import { jobs as staticJobs } from "@/data/jobs";
import { getMergedJobs } from "@/lib/services/adminJobs";
import type { Job, JobType } from "@/types/job";

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
  return typeof window === "undefined" ? staticJobs : getMergedJobs();
}

export async function getJobsByType(type: JobType): Promise<Job[]> {
  const all =
    typeof window === "undefined" ? staticJobs : getMergedJobs();
  return all.filter((job) => job.type === type);
}

export async function getJobById(id: string): Promise<Job | undefined> {
  const all =
    typeof window === "undefined" ? staticJobs : getMergedJobs();
  return all.find((job) => job.id === id);
}

/**
 * Build-time helper for `generateStaticParams`. Must stay synchronous because
 * Next.js calls it during the static export build.
 */
export function getAllJobIds(): string[] {
  return staticJobs.map((j) => j.id);
}
