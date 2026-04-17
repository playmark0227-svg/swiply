"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import JobListCard from "@/components/JobListCard";
import JobListSkeleton from "@/components/JobListSkeleton";
import { getJobsByType } from "@/lib/services/jobs";
import type { Job } from "@/types/job";
import { haptic } from "@/lib/haptic";

export default function BaitoPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getJobsByType("baito").then((j) => {
      setJobs(j);
      setLoaded(true);
    });
  }, []);

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">
      <Header />
      <main className="flex-1 max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto w-full px-4 md:px-6 pt-4 md:pt-8 pb-20 md:pb-12">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <h1 className="text-lg md:text-2xl font-extrabold text-gray-900">アルバイト求人</h1>
            <p className="text-[11px] md:text-xs text-gray-400 mt-0.5">
              {loaded ? `${jobs.length}件の求人` : "読み込み中…"}
            </p>
          </div>
          <Link
            href="/baito/swipe"
            onClick={() => haptic("tick")}
            className="flex items-center gap-1.5 md:gap-2 px-3.5 md:px-5 py-2 md:py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs md:text-sm font-bold rounded-xl shadow-lg shadow-violet-200/50 active:scale-95 hover:shadow-xl hover:shadow-violet-300/60 transition-all"
          >
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            スワイプで探す
          </Link>
        </div>

        {!loaded ? (
          <JobListSkeleton count={12} />
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 text-xs text-gray-400">
            該当する求人がありません
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-4">
            {jobs.map((job) => (
              <JobListCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
