/**
 * Search & filter pure functions. No I/O — operate on the in-memory job list.
 */

import type { Job, JobType } from "@/types/job";

export type SortKey = "recommended" | "newest" | "salary" | "popular";

export interface JobFilters {
  q?: string;
  type?: JobType | "all";
  region?: string | "all";
  category?: string | "all";
  minSalary?: number;
  remoteOnly?: boolean;
  urgentOnly?: boolean;
  featuredOnly?: boolean;
  tags?: string[];
  sort?: SortKey;
}

export const REGION_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "tokyo", label: "東京" },
  { value: "kanagawa", label: "神奈川" },
  { value: "saitama", label: "埼玉" },
  { value: "chiba", label: "千葉" },
  { value: "osaka", label: "大阪" },
  { value: "remote", label: "在宅" },
];

export const CATEGORY_OPTIONS: { value: string; label: string; emoji: string }[] = [
  { value: "all", label: "すべて", emoji: "✨" },
  { value: "food", label: "飲食", emoji: "🍜" },
  { value: "service", label: "サービス", emoji: "🛍️" },
  { value: "office", label: "オフィス", emoji: "💼" },
  { value: "engineering", label: "エンジニア", emoji: "💻" },
  { value: "creative", label: "クリエイティブ", emoji: "🎨" },
  { value: "sales", label: "営業・マーケ", emoji: "📈" },
  { value: "logistics", label: "物流", emoji: "📦" },
  { value: "event", label: "イベント", emoji: "🎪" },
];

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recommended", label: "おすすめ順" },
  { value: "newest", label: "新着順" },
  { value: "salary", label: "給与の高い順" },
  { value: "popular", label: "人気順" },
];

export function applyFilters(jobs: Job[], f: JobFilters): Job[] {
  let out = jobs.slice();

  if (f.type && f.type !== "all") {
    out = out.filter((j) => j.type === f.type);
  }
  if (f.region && f.region !== "all") {
    out = out.filter((j) => j.region === f.region);
  }
  if (f.category && f.category !== "all") {
    out = out.filter((j) => j.category === f.category);
  }
  if (typeof f.minSalary === "number" && f.minSalary > 0) {
    out = out.filter((j) => j.salaryValue >= f.minSalary!);
  }
  if (f.remoteOnly) {
    out = out.filter((j) => j.remoteOk);
  }
  if (f.urgentOnly) {
    out = out.filter((j) => j.urgent);
  }
  if (f.featuredOnly) {
    out = out.filter((j) => j.featured);
  }
  if (f.tags && f.tags.length > 0) {
    out = out.filter((j) => f.tags!.every((t) => j.tags.includes(t)));
  }
  if (f.q && f.q.trim()) {
    const q = f.q.trim().toLowerCase();
    out = out.filter((j) => {
      const hay = [
        j.title,
        j.company,
        j.catchphrase,
        j.description,
        j.location,
        ...j.tags,
        ...j.requirements,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  switch (f.sort ?? "recommended") {
    case "newest":
      out.sort((a, b) => (a.postedAt < b.postedAt ? 1 : -1));
      break;
    case "salary":
      out.sort((a, b) => b.salaryValue - a.salaryValue);
      break;
    case "popular":
      out.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
      break;
    case "recommended":
    default:
      out.sort((a, b) => {
        const fa = (a.featured ? 2 : 0) + (a.urgent ? 1 : 0);
        const fb = (b.featured ? 2 : 0) + (b.urgent ? 1 : 0);
        if (fa !== fb) return fb - fa;
        return a.postedAt < b.postedAt ? 1 : -1;
      });
      break;
  }
  return out;
}

/** Returns true if a job was posted within `days` days. */
export function isNew(job: Job, days = 3): boolean {
  const ts = Date.parse(job.postedAt);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts < days * 24 * 60 * 60 * 1000;
}
