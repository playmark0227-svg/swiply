"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import JobListCard from "@/components/JobListCard";
import JobListSkeleton from "@/components/JobListSkeleton";
import SearchBar from "@/components/SearchBar";
import FilterToolbar from "@/components/FilterToolbar";
import { getJobsByType } from "@/lib/services/jobs";
import { applyFilters, type JobFilters } from "@/lib/services/search";
import type { Job } from "@/types/job";
import { haptic } from "@/lib/haptic";

export default function CareerPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filters, setFilters] = useState<JobFilters>({
    type: "career",
    region: "all",
    category: "all",
    minSalary: 0,
    sort: "recommended",
  });

  useEffect(() => {
    getJobsByType("career").then((j) => {
      setJobs(j);
      setLoaded(true);
    });
  }, []);

  const visible = useMemo(() => applyFilters(jobs, filters), [jobs, filters]);

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">
      <Header />
      <main className="flex-1 max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto w-full px-4 md:px-6 pt-4 md:pt-8 pb-20 md:pb-12">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <h1 className="text-lg md:text-2xl font-extrabold text-gray-900">正社員求人</h1>
            <p className="text-[11px] md:text-xs text-gray-400 mt-0.5">
              {loaded ? `${jobs.length}件中 ${visible.length}件表示` : "読み込み中…"}
            </p>
          </div>
          <Link
            href="/career/swipe"
            onClick={() => haptic("tick")}
            className="flex items-center gap-1.5 md:gap-2 px-3.5 md:px-5 py-2 md:py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs md:text-sm font-bold rounded-xl shadow-lg shadow-violet-200/50 active:scale-95 hover:shadow-xl hover:shadow-violet-300/60 transition-all"
          >
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            スワイプで探す
          </Link>
        </div>

        <div className="space-y-3 mb-4">
          <SearchBar
            defaultValue={filters.q ?? ""}
            onSubmit={(q) => setFilters((f) => ({ ...f, q }))}
            placeholder="職種・会社・スキルなど"
          />
          <FilterToolbar
            filters={filters}
            onChange={setFilters}
            hideTypeFilter
            resultCount={visible.length}
          />
        </div>

        {!loaded ? (
          <JobListSkeleton count={12} />
        ) : visible.length === 0 ? (
          <EmptyState onReset={() => setFilters({ type: "career", sort: "recommended" })} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-4">
            {visible.map((job) => (
              <JobListCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="text-center py-16 md:py-24 bg-white rounded-3xl border border-gray-100">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
        <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <p className="text-sm font-bold text-gray-900 mb-1">条件に合う求人が見つかりません</p>
      <p className="text-xs text-gray-400 mb-5">条件をリセットしてみましょう</p>
      <button
        onClick={onReset}
        className="px-5 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl active:scale-95 transition"
      >
        条件をリセット
      </button>
    </div>
  );
}
