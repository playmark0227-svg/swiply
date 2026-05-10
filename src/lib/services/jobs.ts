import { jobs as staticJobs } from "@/data/jobs";
import { getMergedJobs } from "@/lib/services/adminJobs";
import type { Job, JobType, VerificationDetails } from "@/types/job";

/**
 * Demo-data enrichment.
 *
 * The static seed in `src/data/jobs.ts` predates the new trust+speed
 * signals (verification / founding / instantInterview). Rather than
 * mutate 800+ lines, we deterministically derive these flags from the
 * job ID + existing fields so demos look populated without manual edits.
 *
 * In production, these should come from Firestore directly on the Job
 * document — drop this helper at that point.
 */
const DEFAULT_VERIFICATION_ITEMS = [
  "事業実態（登記簿・許認可）",
  "労働基準法遵守（賃金・休暇）",
  "反社会的勢力との関係調査",
  "面接担当者ヒアリング",
];

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function deriveVerification(job: Job): VerificationDetails | undefined {
  // ~70% of jobs are verified — leaves the rest as "未認証" for contrast.
  if (hashId(job.id) % 10 < 7) {
    const verifiedAt = new Date(
      Date.parse(job.postedAt) - 14 * 86_400_000
    ).toISOString();
    return {
      verifiedAt,
      items: DEFAULT_VERIFICATION_ITEMS,
      reviewedAt: verifiedAt,
    };
  }
  return undefined;
}

function deriveFounding(job: Job): boolean {
  // featured jobs are FOUNDING by default; plus ~25% of others.
  if (job.featured) return true;
  return hashId(job.id) % 4 === 0;
}

function deriveInstantInterview(job: Job): boolean {
  // 急募 jobs commit to instant interviews; plus ~30% of others.
  if (job.urgent) return true;
  return hashId(job.id + "x") % 10 < 3;
}

function enrichJob(job: Job): Job {
  // If the document already carries explicit values (admin-edited), keep
  // them — only fill in the gaps with derived defaults.
  return {
    ...job,
    verification: job.verification ?? deriveVerification(job),
    verified:
      job.verified ?? !!(job.verification ?? deriveVerification(job)),
    founding: job.founding ?? deriveFounding(job),
    instantInterview: job.instantInterview ?? deriveInstantInterview(job),
  };
}

function enrichAll(list: Job[]): Job[] {
  return list.map(enrichJob);
}

/**
 * Re-order jobs so that:
 *   - FOUNDING members get a guaranteed priority slot near the top
 *   - 即日面接 OK jobs get a small bump
 * The original ordering is otherwise preserved within each tier.
 *
 * Used by the swipe deck so the highest-conversion-intent surface
 * always shows the highest-paying-tier first.
 */
export function prioritizeForSwipe(list: Job[]): Job[] {
  // Stable partition into 3 tiers
  const founding: Job[] = [];
  const instant: Job[] = [];
  const rest: Job[] = [];
  for (const j of list) {
    if (j.founding) founding.push(j);
    else if (j.instantInterview) instant.push(j);
    else rest.push(j);
  }
  // Interleave founding into the front so it doesn't dominate the deck
  // but is guaranteed to appear early. Pattern: every 3rd card is FOUNDING
  // until we run out, then the remaining tier mix follows.
  const out: Job[] = [];
  let f = 0;
  let i = 0;
  let r = 0;
  let position = 0;
  while (out.length < list.length) {
    const slot = position % 3;
    let picked: Job | undefined;
    if (slot === 0 && f < founding.length) picked = founding[f++];
    else if (slot === 1 && i < instant.length) picked = instant[i++];
    else if (r < rest.length) picked = rest[r++];
    else if (i < instant.length) picked = instant[i++];
    else if (f < founding.length) picked = founding[f++];
    if (picked) out.push(picked);
    else break;
    position++;
  }
  return out;
}

/**
 * Jobs service.
 *
 * Currently returns the static `src/data/jobs.ts` array, but the API is async
 * so the implementation can be swapped to Firestore without touching callers.
 *
 * Firestore swap (when ready):
 *
 *   import { firebaseEnabled, getDb } from "@/lib/firebase/client";
 *   import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
 *
 *   export async function getJobsByType(type: JobType): Promise<Job[]> {
 *     if (firebaseEnabled) {
 *       const db = getDb();
 *       if (db) {
 *         const snap = await getDocs(
 *           query(collection(db, "jobs"), where("type", "==", type))
 *         );
 *         return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Job));
 *       }
 *     }
 *     return staticJobs.filter((j) => j.type === type);
 *   }
 *
 * Note: this site uses `output: "export"` so `/job/[id]` calls
 * `getAllJobIds()` at build time. If you move to Firestore, generate the
 * static IDs at build time (e.g., via a build script) or switch to
 * `dynamicParams: true` after disabling static export.
 */

export async function getAllJobs(): Promise<Job[]> {
  // At runtime, use the admin-overridden merged list. At build time
  // (no `window`), fall back to the static seed.
  return enrichAll(typeof window === "undefined" ? staticJobs : getMergedJobs());
}

export async function getJobsByType(type: JobType): Promise<Job[]> {
  const all =
    typeof window === "undefined" ? staticJobs : getMergedJobs();
  return enrichAll(all.filter((job) => job.type === type));
}

export async function getJobById(id: string): Promise<Job | undefined> {
  const all =
    typeof window === "undefined" ? staticJobs : getMergedJobs();
  const found = all.find((job) => job.id === id);
  return found ? enrichJob(found) : undefined;
}

/**
 * Build-time helper for `generateStaticParams`. Must stay synchronous because
 * Next.js calls it during the static export build.
 */
export function getAllJobIds(): string[] {
  return staticJobs.map((j) => j.id);
}
