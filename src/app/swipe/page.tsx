"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SwipeDeck from "@/components/SwipeDeck";
import { getJobsByType } from "@/lib/services/jobs";
import type { Job, JobType } from "@/types/job";

export default function SwipePage() {
  const [jobType, setJobType] = useState<JobType>("baito");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    getJobsByType(jobType).then(setJobs);
  }, [jobType]);

  const typeLabel = jobType === "baito" ? "アルバイト" : "正社員";

  return (
    <div className="swipe-page flex flex-col h-dvh bg-gray-50">
      {/* Custom header with dropdown */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100/50">
        <div className="max-w-lg mx-auto px-4 h-11 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <span className="text-white text-[10px] font-black">S</span>
            </div>
            <span className="text-base font-black tracking-tight text-gray-900">
              SWIPLY
            </span>
          </Link>

          {/* Job type dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <span className="text-xs font-bold text-gray-700">{typeLabel}</span>
              <svg
                className={`w-3.5 h-3.5 text-gray-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                {/* Menu */}
                <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden min-w-[140px]">
                  <button
                    onClick={() => { setJobType("baito"); setDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
                      jobType === "baito"
                        ? "bg-violet-50 text-violet-600"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    アルバイト
                  </button>
                  <button
                    onClick={() => { setJobType("career"); setDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
                      jobType === "career"
                        ? "bg-violet-50 text-violet-600"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    正社員
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden">
        <div className="max-w-lg mx-auto h-full p-2 pb-0">
          <SwipeDeck key={jobType} jobs={jobs} />
        </div>
      </main>
    </div>
  );
}
