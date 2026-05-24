/**
 * FOUNDING member remaining-slots counter.
 *
 * Creates urgency on the LP by showing "残り ○○ 社" with a slow,
 * deterministic drip so the number feels live. Seeded from the
 * current date so first-time visitors always see a plausible count,
 * and returning visitors see it tick down naturally.
 *
 * In production, replace with a Firestore counter or API call.
 */

const KEY = "swiply-founding-remaining";
const TOTAL = 100;

/** Deterministic starting count based on today's date. */
function seedCount(): number {
  const launch = new Date("2026-03-01").getTime();
  const now = Date.now();
  const daysSinceLaunch = Math.max(0, (now - launch) / 86_400_000);
  // ~0.8 signups/day on average → remaining shrinks over time
  const taken = Math.min(Math.floor(daysSinceLaunch * 0.8), TOTAL - 7);
  return TOTAL - taken;
}

export function getFoundingRemaining(): number {
  if (typeof window === "undefined") return seedCount();
  try {
    const stored = localStorage.getItem(KEY);
    if (stored) {
      const { count, ts } = JSON.parse(stored) as { count: number; ts: number };
      // Drip: lose 1 slot per ~18 hours since last visit
      const hoursSince = (Date.now() - ts) / 3_600_000;
      const drip = Math.floor(hoursSince / 18);
      const next = Math.max(7, count - drip); // never go below 7
      if (drip > 0) {
        localStorage.setItem(KEY, JSON.stringify({ count: next, ts: Date.now() }));
      }
      return next;
    }
  } catch {
    // ignore
  }
  const initial = seedCount();
  localStorage.setItem(KEY, JSON.stringify({ count: initial, ts: Date.now() }));
  return initial;
}
