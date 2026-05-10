/**
 * Daily LIKE quota.
 *
 * Why this exists (per岡崎 review): マイナビなど他社で「上から順に全部
 * 一括応募」が蔓延している。SWIPLY では1日 LIKE_DAILY_LIMIT 件まで
 * しか LIKE できないようにブレーキをかける。気軽に消費できないことが、
 * 「本気の応募」をプラットフォームに残す主な防衛策。
 *
 * Storage layout (localStorage):
 *   "swiply-daily-likes" → { date: "YYYY-MM-DD", count: number }
 *
 * Resets at local midnight (i.e. when `date` no longer matches today).
 */

export const LIKE_DAILY_LIMIT = 10;

const STORAGE_KEY = "swiply-daily-likes";

interface DailyRecord {
  date: string; // YYYY-MM-DD (local)
  count: number;
}

function todayKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function read(): DailyRecord {
  if (typeof window === "undefined") return { date: todayKey(), count: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: todayKey(), count: 0 };
    const parsed = JSON.parse(raw) as DailyRecord;
    if (parsed.date !== todayKey()) {
      // Past day — start fresh.
      return { date: todayKey(), count: 0 };
    }
    return parsed;
  } catch {
    return { date: todayKey(), count: 0 };
  }
}

function write(rec: DailyRecord) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rec));
}

export function getTodayLikeCount(): number {
  return read().count;
}

export function getTodayLikeRemaining(): number {
  return Math.max(0, LIKE_DAILY_LIMIT - getTodayLikeCount());
}

export function canLikeToday(): boolean {
  return getTodayLikeRemaining() > 0;
}

/** Increment the daily counter. Call after a successful LIKE. */
export function incrementTodayLike(): void {
  const rec = read();
  write({ date: rec.date, count: rec.count + 1 });
}

/**
 * Decrement the daily counter (used by undo). Never goes below 0.
 */
export function decrementTodayLike(): void {
  const rec = read();
  write({ date: rec.date, count: Math.max(0, rec.count - 1) });
}
