"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SwipeDeck from "@/components/SwipeDeck";
import Logo from "@/components/Logo";
import { getJobsByType } from "@/lib/services/jobs";
import type { Job, JobType } from "@/types/job";

export default function SwipePage() {
  const [jobType, setJobType] = useState<JobType>("career");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    getJobsByType(jobType).then(setJobs);
  }, [jobType]);

  const TYPE_OPTIONS: { value: JobType; label: string }[] = [
    { value: "baito", label: "アルバイト" },
    { value: "gig", label: "単発バイト" },
    { value: "career", label: "正社員" },
  ];
  const typeLabel = TYPE_OPTIONS.find((t) => t.value === jobType)?.label ?? "";

  return (
    <div className="swipe-page flex flex-col h-dvh bg-gray-50">
      {/* Custom header with dropdown */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-11 md:h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5">
            <Logo size={28} radius={8} priority className="md:!w-8 md:!h-8" />
            <span className="text-base md:text-[17px] font-black tracking-tight text-gray-900">
              SWIPLY
            </span>
          </Link>

          {/* Job type dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <span className="text-xs md:text-sm font-bold text-gray-700">{typeLabel}</span>
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
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden min-w-[160px]">
                  {TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setJobType(opt.value);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
                        jobType === opt.value
                          ? "bg-violet-50 text-violet-600"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden">
        {/* Desktop layout: keyboard hints flank the centered card */}
        <div className="h-full max-w-7xl mx-auto flex items-stretch">
          {/* Left hint panel (desktop only) */}
          <aside className="hidden lg:flex flex-col justify-center items-end gap-5 w-56 pr-6 text-right">
            <HintRow keys={["←", "A"]} label="スキップ" tone="red" />
            <HintRow keys={["Z", "↓"]} label="1つ戻す" tone="amber" />
            <p className="text-[11px] text-gray-400 mt-2 leading-relaxed max-w-[180px]">
              キーボードでサクサク判定できます。
            </p>
          </aside>

          {/* Card area */}
          <div className="relative flex-1 min-w-0 h-full">
            <div className="h-full mx-auto p-2 md:py-6 md:px-4 max-w-lg md:max-w-[420px] lg:max-w-[440px] xl:max-w-[480px]">
              <SwipeDeck key={jobType} jobs={jobs} />
            </div>
          </div>

          {/* Right hint panel (desktop only) */}
          <aside className="hidden lg:flex flex-col justify-center items-start gap-5 w-56 pl-6">
            <HintRow keys={["→", "D", "Space"]} label="LIKE" tone="emerald" alignStart />
            <HintRow keys={["↑", "W", "Enter"]} label="詳細を見る" tone="blue" alignStart />
            <p className="text-[11px] text-gray-400 mt-2 leading-relaxed max-w-[180px]">
              ドラッグ or タップでも OK。
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}

function HintRow({
  keys,
  label,
  tone,
  alignStart,
}: {
  keys: string[];
  label: string;
  tone: "emerald" | "red" | "blue" | "amber";
  alignStart?: boolean;
}) {
  const toneMap: Record<string, string> = {
    emerald: "text-emerald-600 border-emerald-200 bg-emerald-50",
    red: "text-red-500 border-red-200 bg-red-50",
    blue: "text-blue-500 border-blue-200 bg-blue-50",
    amber: "text-amber-600 border-amber-200 bg-amber-50",
  };
  return (
    <div className={`flex flex-col gap-1.5 ${alignStart ? "items-start" : "items-end"}`}>
      <div className="flex gap-1.5">
        {keys.map((k) => (
          <kbd
            key={k}
            className={`px-2 min-w-[28px] h-7 inline-flex items-center justify-center rounded-md border text-[11px] font-bold ${toneMap[tone]}`}
          >
            {k}
          </kbd>
        ))}
      </div>
      <span className="text-[12px] font-semibold text-gray-600">{label}</span>
    </div>
  );
}
