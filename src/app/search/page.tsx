"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import JobListCard from "@/components/JobListCard";
import JobListSkeleton from "@/components/JobListSkeleton";
import SearchBar from "@/components/SearchBar";
import FilterToolbar from "@/components/FilterToolbar";
import { getAllJobs } from "@/lib/services/jobs";
import { applyFilters, type JobFilters, CATEGORY_OPTIONS } from "@/lib/services/search";
import type { Job } from "@/types/job";
import { haptic } from "@/lib/haptic";

const POPULAR_TERMS = ["在宅", "高時給", "未経験OK", "週1OK", "髪色自由", "正社員", "リモート"];

function SearchPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const initialQ = params.get("q") ?? "";

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filters, setFilters] = useState<JobFilters>({
    q: initialQ,
    type: "all",
    region: "all",
    category: "all",
    sort: "recommended",
  });

  useEffect(() => {
    getAllJobs().then((j) => {
      setJobs(j);
      setLoaded(true);
    });
  }, []);

  // Keep ?q= in sync.
  useEffect(() => {
    const q = filters.q?.trim();
    if (q && q !== initialQ) {
      router.replace(`/search?q=${encodeURIComponent(q)}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q]);

  const visible = useMemo(() => applyFilters(jobs, filters), [jobs, filters]);

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">
      <Header />
      <main className="flex-1 max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto w-full px-4 md:px-6 pt-4 md:pt-8 pb-20 md:pb-12">
        <h1 className="text-lg md:text-2xl font-extrabold text-gray-900 mb-3 md:mb-4">
          すべての求人を検索
        </h1>

        <div className="space-y-3 mb-3">
          <SearchBar
            defaultValue={filters.q ?? ""}
            onSubmit={(q) => setFilters((f) => ({ ...f, q }))}
            autoFocus={!initialQ}
          />

          {!filters.q && (
            <div className="flex items-center gap-2 text-[11px] flex-wrap">
              <span className="text-gray-400 font-bold">人気のワード</span>
              {POPULAR_TERMS.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    haptic("tick");
                    setFilters((f) => ({ ...f, q: t }));
                  }}
                  className="px-2.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-600"
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          <FilterToolbar
            filters={filters}
            onChange={setFilters}
            resultCount={visible.length}
          />
        </div>

        {!filters.q && !filters.region && !filters.minSalary && (
          <CategoryGrid
            onPick={(category) => {
              haptic("tick");
              setFilters((f) => ({ ...f, category }));
            }}
          />
        )}

        {!loaded ? (
          <JobListSkeleton count={12} />
        ) : visible.length === 0 ? (
          <Empty />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-4 mt-2">
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

function CategoryGrid({ onPick }: { onPick: (cat: string) => void }) {
  return (
    <section className="mb-4">
      <h2 className="text-xs font-bold text-gray-500 mb-2">カテゴリから探す</h2>
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
        {CATEGORY_OPTIONS.filter((c) => c.value !== "all").map((c) => (
          <button
            key={c.value}
            onClick={() => onPick(c.value)}
            className="flex flex-col items-center gap-1 py-3 rounded-2xl bg-white border border-gray-100 hover:border-violet-200 hover:shadow-sm transition"
          >
            <span className="text-xl leading-none">{c.emoji}</span>
            <span className="text-[11px] font-bold text-gray-700">{c.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Empty() {
  return (
    <div className="text-center py-16 md:py-24 bg-white rounded-3xl border border-gray-100 mt-3">
      <div className="text-3xl mb-1">🔍</div>
      <p className="text-sm font-bold text-gray-900 mb-1">該当する求人が見つかりません</p>
      <p className="text-xs text-gray-400">別のキーワードや条件をお試しください</p>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-dvh bg-gray-50">
        <Header />
        <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-4 pb-20">
          <JobListSkeleton count={6} />
        </main>
        <BottomNav />
      </div>
    }>
      <SearchPageInner />
    </Suspense>
  );
}
