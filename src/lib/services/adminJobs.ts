/**
 * Admin job management — overlays runtime CRUD on top of the static
 * `data/jobs.ts` seed. Edits and additions are persisted to localStorage
 * so the demo keeps working without a backend; soft-deleted IDs are also
 * tracked. The public `getAllJobs` API stays unchanged at the type level.
 */

import { jobs as staticJobs } from "@/data/jobs";
import type { Job } from "@/types/job";

const OVERRIDES_KEY = "swiply-job-overrides";
const NEW_JOBS_KEY = "swiply-jobs-new";
const DELETED_KEY = "swiply-jobs-deleted";

interface Overrides {
  [id: string]: Partial<Job>;
}

function readOverrides(): Overrides {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(OVERRIDES_KEY) ?? "{}") as Overrides;
  } catch {
    return {};
  }
}

function writeOverrides(o: Overrides): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(o));
}

function readNewJobs(): Job[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(NEW_JOBS_KEY) ?? "[]") as Job[];
  } catch {
    return [];
  }
}

function writeNewJobs(j: Job[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NEW_JOBS_KEY, JSON.stringify(j));
}

function readDeleted(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(DELETED_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function writeDeleted(d: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DELETED_KEY, JSON.stringify(d));
}

/**
 * In-memory cache of the merged list. Storage events from other tabs and
 * explicit `invalidateMergedJobs()` calls (after an admin write) bust it.
 * Avoids repeated JSON.parse on every getMergedJobs invocation.
 */
let cachedMerged: Job[] | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (
      e.key === OVERRIDES_KEY ||
      e.key === NEW_JOBS_KEY ||
      e.key === DELETED_KEY
    ) {
      cachedMerged = null;
    }
  });
}

function invalidateMergedJobs() {
  cachedMerged = null;
}

/** Returns the merged jobs list (static seed + admin additions − deletions, with overrides applied). */
export function getMergedJobs(): Job[] {
  if (cachedMerged) return cachedMerged;

  const overrides = readOverrides();
  const newJobs = readNewJobs();
  const deleted = new Set(readDeleted());

  const merged: Job[] = [];
  for (const j of staticJobs) {
    if (deleted.has(j.id)) continue;
    merged.push({ ...j, ...(overrides[j.id] ?? {}) });
  }
  for (const j of newJobs) {
    if (deleted.has(j.id)) continue;
    merged.push({ ...j, ...(overrides[j.id] ?? {}) });
  }
  cachedMerged = merged;
  return merged;
}

export function updateJob(id: string, patch: Partial<Job>): void {
  const overrides = readOverrides();
  overrides[id] = { ...(overrides[id] ?? {}), ...patch };
  writeOverrides(overrides);
  invalidateMergedJobs();
}

export function deleteJob(id: string): void {
  const deleted = readDeleted();
  if (!deleted.includes(id)) {
    deleted.push(id);
    writeDeleted(deleted);
    invalidateMergedJobs();
  }
}

export function restoreJob(id: string): void {
  const deleted = readDeleted().filter((d) => d !== id);
  writeDeleted(deleted);
  invalidateMergedJobs();
}

export function createJob(job: Job): void {
  const list = readNewJobs();
  list.push(job);
  writeNewJobs(list);
  invalidateMergedJobs();
}

export function deleteAdminJob(id: string): void {
  // Hard-delete a created (non-static) job.
  const list = readNewJobs().filter((j) => j.id !== id);
  writeNewJobs(list);
  // Also clean up any overrides for it.
  const ov = readOverrides();
  delete ov[id];
  writeOverrides(ov);
  invalidateMergedJobs();
}

export function isJobDeleted(id: string): boolean {
  return readDeleted().includes(id);
}

export function isJobAdminCreated(id: string): boolean {
  return readNewJobs().some((j) => j.id === id);
}

/** Reset all admin overrides and additions. */
export function resetJobs(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(OVERRIDES_KEY);
  localStorage.removeItem(NEW_JOBS_KEY);
  localStorage.removeItem(DELETED_KEY);
  invalidateMergedJobs();
}

export function makeNewJobId(prefix: string = "admin"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
