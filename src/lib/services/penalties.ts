/**
 * Bidirectional no-show penalty (yellow / red cards).
 *
 * Why this exists (per岡崎 review): タイミー方式の「ブッチ防止」を
 * SWIPLY 標準仕様に。1回でイエロー、2回でレッド (1年停止)。
 * 候補者と企業の双方を同じルールで縛る。
 *
 * Detection rule: an InterviewAppointment is considered a no-show
 * when, 30 min after `scheduledAt`, the appointment is still in
 * status === "scheduled". Anyone (the harness or the room itself)
 * can call `evaluateNoShows()` to convert stale appointments to
 * `status === "no_show"` + record the offense.
 *
 * Storage layout (localStorage):
 *   "swiply-penalties" → {
 *     userOffenses: NoShowOffense[],   // candidate side (one user per device)
 *     companyOffenses: { [jobId]: NoShowOffense[] }
 *   }
 *
 * Suspension is computed at read time: 2+ offenses in the last 365 days
 * → red card → status === "red" with `suspendedUntil` 1 year out.
 */

import {
  type InterviewAppointment,
  type InterviewStatus,
  getInterviews,
  updateInterview,
} from "@/lib/services/interviews";

export type CardLevel = "green" | "yellow" | "red";

export interface NoShowOffense {
  /** ID of the InterviewAppointment that was missed. */
  interviewId: string;
  /** ISO timestamp the no-show was recorded. */
  recordedAt: string;
  /** Optional context for display ("会社名 / 求人タイトル"). */
  context?: string;
}

export interface PenaltyState {
  level: CardLevel;
  count: number;
  offenses: NoShowOffense[];
  /** ISO timestamp when a red-card suspension lifts. */
  suspendedUntil?: string;
}

interface PenaltyStorage {
  userOffenses: NoShowOffense[];
  companyOffenses: Record<string, NoShowOffense[]>;
}

const STORAGE_KEY = "swiply-penalties";
const NO_SHOW_GRACE_MS = 30 * 60_000; // 30 min after scheduledAt
const RED_CARD_THRESHOLD = 2;
const SUSPENSION_DAYS = 365;
const ROLLING_WINDOW_DAYS = 365;
const CHANGE_EVENT = "swiply-penalties-changed";

// ─── Storage primitives ───────────────────────────────────────────────

function read(): PenaltyStorage {
  if (typeof window === "undefined")
    return { userOffenses: [], companyOffenses: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { userOffenses: [], companyOffenses: {} };
    const parsed = JSON.parse(raw) as PenaltyStorage;
    return {
      userOffenses: Array.isArray(parsed.userOffenses)
        ? parsed.userOffenses
        : [],
      companyOffenses:
        parsed.companyOffenses && typeof parsed.companyOffenses === "object"
          ? parsed.companyOffenses
          : {},
    };
  } catch {
    return { userOffenses: [], companyOffenses: {} };
  }
}

function write(storage: PenaltyStorage) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// ─── Public API ──────────────────────────────────────────────────────

/** Compute the candidate's current card level. */
export function getUserPenalty(): PenaltyState {
  return summarize(read().userOffenses);
}

/** Compute a company's current card level. */
export function getCompanyPenalty(jobId: string): PenaltyState {
  return summarize(read().companyOffenses[jobId] ?? []);
}

/** True if the user is currently allowed to take new actions. */
export function isUserSuspended(): boolean {
  const p = getUserPenalty();
  return p.level === "red" && (!p.suspendedUntil || Date.parse(p.suspendedUntil) > Date.now());
}

export function isCompanySuspended(jobId: string): boolean {
  const p = getCompanyPenalty(jobId);
  return p.level === "red" && (!p.suspendedUntil || Date.parse(p.suspendedUntil) > Date.now());
}

/**
 * Record a candidate-side no-show (i.e. the candidate didn't show up
 * to an interview they had booked / been booked for).
 */
export function recordUserNoShow(opts: {
  interviewId: string;
  context?: string;
}): PenaltyState {
  const storage = read();
  storage.userOffenses.push({
    interviewId: opts.interviewId,
    recordedAt: new Date().toISOString(),
    context: opts.context,
  });
  write(storage);
  return summarize(storage.userOffenses);
}

/**
 * Record a company-side no-show / cancel-without-notice.
 */
export function recordCompanyNoShow(opts: {
  jobId: string;
  interviewId: string;
  context?: string;
}): PenaltyState {
  const storage = read();
  const arr = storage.companyOffenses[opts.jobId] ?? [];
  arr.push({
    interviewId: opts.interviewId,
    recordedAt: new Date().toISOString(),
    context: opts.context,
  });
  storage.companyOffenses[opts.jobId] = arr;
  write(storage);
  return summarize(arr);
}

export function subscribePenalties(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onChange = () => handler();
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) handler();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Sweep all stored interviews. Any "scheduled" appointment that's
 * 30+ min past its scheduledAt is upgraded to "no_show" and the
 * candidate (or company, if they were the host) gets an offense.
 *
 * Safe to call repeatedly — already-evaluated interviews are skipped.
 *
 * Returns the number of new offenses recorded.
 */
export function evaluateNoShows(): number {
  const now = Date.now();
  let recorded = 0;
  for (const itv of getInterviews()) {
    if (!isStale(itv, now)) continue;
    // Mark the interview itself
    const updated = updateInterview(itv.id, {
      status: "no_show" as InterviewStatus,
    });
    if (!updated) continue;
    // For demo purposes we can't tell who booked the interview without
    // additional context. We attribute the no-show to the candidate
    // (the most common real-world case). In production, the room itself
    // would carry the responsibility (whoever didn't dial in is at fault).
    recordUserNoShow({
      interviewId: itv.id,
      context: `${itv.jobCompany} / ${itv.jobTitle}`,
    });
    recorded++;
  }
  return recorded;
}

function isStale(itv: InterviewAppointment, now: number): boolean {
  if (itv.status !== "scheduled") return false;
  const at = Date.parse(itv.scheduledAt);
  if (Number.isNaN(at)) return false;
  return now - at > NO_SHOW_GRACE_MS;
}

// ─── Internals ───────────────────────────────────────────────────────

function summarize(offenses: NoShowOffense[]): PenaltyState {
  const now = Date.now();
  const cutoff = now - ROLLING_WINDOW_DAYS * 86_400_000;
  const recent = offenses.filter((o) => Date.parse(o.recordedAt) >= cutoff);
  const count = recent.length;
  let level: CardLevel = "green";
  if (count === 1) level = "yellow";
  if (count >= RED_CARD_THRESHOLD) level = "red";
  let suspendedUntil: string | undefined;
  if (level === "red") {
    const last = recent[recent.length - 1];
    suspendedUntil = new Date(
      Date.parse(last.recordedAt) + SUSPENSION_DAYS * 86_400_000
    ).toISOString();
  }
  return { level, count, offenses: recent, suspendedUntil };
}
