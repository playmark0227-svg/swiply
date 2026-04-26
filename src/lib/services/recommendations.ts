/**
 * Lightweight recommendation scoring. Profile-aware where a profile exists,
 * otherwise falls back to "featured / popular" heuristics.
 */

import type { Job } from "@/types/job";
import type { UserProfile } from "@/types/profile";

interface ScoredJob {
  job: Job;
  score: number;
  reasons: string[];
}

export function scoreJobs(jobs: Job[], profile: UserProfile | null): ScoredJob[] {
  return jobs
    .map((job) => scoreOne(job, profile))
    .sort((a, b) => b.score - a.score);
}

function scoreOne(job: Job, profile: UserProfile | null): ScoredJob {
  let score = 0;
  const reasons: string[] = [];

  if (job.featured) score += 8;
  if (job.urgent) score += 3;
  // Recency.
  const days = (Date.now() - Date.parse(job.postedAt)) / (1000 * 60 * 60 * 24);
  if (!Number.isNaN(days)) score += Math.max(0, 10 - days);
  // Popularity boost (light).
  score += Math.min(5, (job.views ?? 0) / 400);

  if (!profile) return { job, score, reasons };

  // Type preference.
  if (
    profile.desiredJobType &&
    profile.desiredJobType !== "both" &&
    profile.desiredJobType === job.type
  ) {
    score += 12;
    reasons.push("希望雇用形態にマッチ");
  }
  // Category preference.
  if (profile.desiredCategories?.includes(job.category)) {
    score += 10;
    reasons.push("興味カテゴリ");
  }
  // Location preference: substring match between profile.location and job.location.
  if (profile.location && job.location.includes(profile.location.slice(0, 2))) {
    score += 6;
    reasons.push("近いエリア");
  }
  if (profile.desiredLocations?.some((loc) => job.location.includes(loc))) {
    score += 8;
    reasons.push("希望エリア");
  }
  // Salary floor.
  const minSalary = parseInt(profile.desiredMinSalary || "0", 10);
  if (minSalary && job.salaryValue >= minSalary) {
    score += 4;
    reasons.push("希望給与クリア");
  }
  // Skills overlap with tags/requirements.
  const haystack = (job.tags.join(" ") + " " + job.requirements.join(" ")).toLowerCase();
  const skillHits = profile.skills.filter((s) =>
    haystack.includes(s.toLowerCase())
  ).length;
  if (skillHits > 0) {
    score += skillHits * 3;
    reasons.push(`スキル${skillHits}件マッチ`);
  }
  // Remote preference: if profile location is "在宅" or empty and remoteOk → boost.
  if (job.remoteOk) {
    score += 3;
    reasons.push("リモートOK");
  }

  return { job, score, reasons };
}

/**
 * Find jobs similar to a given job. Same-type and shared category/tag overlap.
 */
export function findSimilar(allJobs: Job[], job: Job, limit = 4): Job[] {
  return allJobs
    .filter((j) => j.id !== job.id)
    .map((j) => {
      let s = 0;
      if (j.type === job.type) s += 5;
      if (j.category === job.category) s += 5;
      if (j.region === job.region) s += 3;
      const tagOverlap = j.tags.filter((t) => job.tags.includes(t)).length;
      s += tagOverlap * 2;
      return { j, s };
    })
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.j);
}
