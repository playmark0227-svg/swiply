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

export default function CareerPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getJobsByType("career").then((j) => {
      setJobs(j);
      setLoaded(true);
    });
  }, []);

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">
      <Header />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-4 pb-20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-extrabold text-gray-900">正社員求人</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {loaded ? `${jobs.length}件の求人` : "読み込み中…"}
            </p>
          </div>
          <Link
            href="/career/swipe"
            onClick={() => haptic("tick")}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-violet-200/50 active:scale-95 transition-transform"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            スワイプで探す
          </Link>
        </div>

        {!loaded ? (
          <JobListSkeleton count={6} />
        ) : jobs.length === 0 ? (
          <div className="text-center py-20 text-xs text-gray-400">
            該当する求人がありません
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
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
