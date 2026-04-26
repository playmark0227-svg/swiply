"use client";

import { useState } from "react";
import FilterSheet from "./FilterSheet";
import { SORT_OPTIONS, type JobFilters } from "@/lib/services/search";
import { haptic } from "@/lib/haptic";

interface Props {
  filters: JobFilters;
  onChange: (f: JobFilters) => void;
  hideTypeFilter?: boolean;
  resultCount: number;
}

/**
 * Toolbar above list pages: shows filter button + active chips + sort dropdown.
 */
export default function FilterToolbar({
  filters,
  onChange,
  hideTypeFilter,
  resultCount,
}: Props) {
  const [open, setOpen] = useState(false);
  const activeCount = countActive(filters, hideTypeFilter);

  function clearChip(key: keyof JobFilters) {
    haptic("warn");
    const next: JobFilters = { ...filters };
    if (key === "minSalary") next.minSalary = 0;
    else if (key === "remoteOnly" || key === "urgentOnly" || key === "featuredOnly")
      next[key] = false;
    else if (key === "type") next.type = "all";
    else if (key === "region") next.region = "all";
    else if (key === "category") next.category = "all";
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => {
            haptic("tick");
            setOpen(true);
          }}
          className={`flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold border transition ${
            activeCount > 0
              ? "bg-violet-50 text-violet-600 border-violet-200"
              : "bg-white text-gray-700 border-gray-200 hover:border-violet-200"
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          絞り込み
          {activeCount > 0 && (
            <span className="ml-0.5 px-1.5 rounded-full bg-violet-600 text-white text-[10px] leading-tight">
              {activeCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-2 text-[11px] text-gray-400">
          <span className="tabular-nums">{resultCount.toLocaleString()}件</span>
          <span className="w-px h-3 bg-gray-200" />
          <SortMenu
            value={filters.sort ?? "recommended"}
            onChange={(v) => {
              haptic("tick");
              onChange({ ...filters, sort: v });
            }}
          />
        </div>
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chipsFor(filters, hideTypeFilter).map((c) => (
            <button
              key={c.key}
              onClick={() => clearChip(c.key)}
              className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full bg-violet-100 text-violet-700 text-[11px] font-bold hover:bg-violet-200"
            >
              {c.label}
              <span className="text-violet-400">×</span>
            </button>
          ))}
        </div>
      )}

      <FilterSheet
        open={open}
        initial={filters}
        onClose={() => setOpen(false)}
        onApply={onChange}
        hideTypeFilter={hideTypeFilter}
      />
    </div>
  );
}

function SortMenu({
  value,
  onChange,
}: {
  value: NonNullable<JobFilters["sort"]>;
  onChange: (v: NonNullable<JobFilters["sort"]>) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as NonNullable<JobFilters["sort"]>)}
        className="appearance-none bg-transparent pr-4 text-[11px] font-bold text-gray-700 focus:outline-none cursor-pointer"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className="w-3 h-3 text-gray-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

function countActive(f: JobFilters, hideType?: boolean): number {
  let n = 0;
  if (!hideType && f.type && f.type !== "all") n++;
  if (f.region && f.region !== "all") n++;
  if (f.category && f.category !== "all") n++;
  if (f.minSalary && f.minSalary > 0) n++;
  if (f.remoteOnly) n++;
  if (f.urgentOnly) n++;
  if (f.featuredOnly) n++;
  return n;
}

function chipsFor(
  f: JobFilters,
  hideType?: boolean
): { key: keyof JobFilters; label: string }[] {
  const out: { key: keyof JobFilters; label: string }[] = [];
  if (!hideType && f.type && f.type !== "all") {
    const labels: Record<string, string> = {
      baito: "アルバイト",
      gig: "単発",
      career: "正社員",
    };
    out.push({ key: "type", label: labels[f.type] ?? f.type });
  }
  if (f.region && f.region !== "all") {
    const labels: Record<string, string> = {
      tokyo: "東京",
      kanagawa: "神奈川",
      saitama: "埼玉",
      chiba: "千葉",
      osaka: "大阪",
      remote: "在宅",
    };
    out.push({ key: "region", label: labels[f.region] ?? f.region });
  }
  if (f.category && f.category !== "all") {
    const labels: Record<string, string> = {
      food: "飲食",
      service: "サービス",
      office: "オフィス",
      engineering: "エンジニア",
      creative: "クリエイティブ",
      sales: "営業・マーケ",
      logistics: "物流",
      event: "イベント",
    };
    out.push({ key: "category", label: labels[f.category] ?? f.category });
  }
  if (f.minSalary && f.minSalary > 0) {
    out.push({
      key: "minSalary",
      label: f.minSalary >= 10000 ? `月給${f.minSalary / 10000}万〜` : `時給${f.minSalary}〜`,
    });
  }
  if (f.remoteOnly) out.push({ key: "remoteOnly", label: "リモート" });
  if (f.urgentOnly) out.push({ key: "urgentOnly", label: "急募" });
  if (f.featuredOnly) out.push({ key: "featuredOnly", label: "注目" });
  return out;
}
