/**
 * Shared timestamp formatters for chat / message UIs.
 *
 * Both the candidate inbox (`/messages`) and the recruiter inbox
 * (`/dashboard/messages`) previously defined these identically — keep one copy.
 *
 * Note: these read `Date.now()` / `new Date()`, so only call them while
 * rendering client-loaded data (e.g. after a useEffect), never during the
 * static prerender, or hydration will mismatch.
 */

/** Relative time: "たった今" / "5分前" / "3時間前" / "2日前" / locale date (>7d). */
export function relativeTime(iso: string): string {
  const diff = Date.now() - Date.parse(iso);
  if (Number.isNaN(diff)) return "";
  if (diff < 60_000) return "たった今";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}時間前`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}日前`;
  return new Date(iso).toLocaleDateString("ja-JP");
}

/** 24-hour clock, "HH:MM". */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}
