/**
 * Recently viewed jobs (client-only, capped at 12).
 * key: "swiply-recently-viewed" → string[] of jobIds, most recent first
 */

const KEY = "swiply-recently-viewed";
const MAX = 12;

export function getRecentlyViewedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function pushRecentlyViewed(jobId: string) {
  if (typeof window === "undefined") return;
  const list = getRecentlyViewedIds().filter((id) => id !== jobId);
  list.unshift(jobId);
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}

export function clearRecentlyViewed() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
