"use client";

import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { getCompanyJobs, type CompanyJob } from "@/lib/services/companyDemo";

const STATUS_MAP: Record<CompanyJob["status"], { label: string; dot: string; bg: string }> = {
  active:  { label: "掲載中", dot: "bg-emerald-400", bg: "bg-emerald-50 text-emerald-700" },
  paused:  { label: "一時停止", dot: "bg-amber-400", bg: "bg-amber-50 text-amber-700" },
  draft:   { label: "下書き", dot: "bg-gray-400", bg: "bg-gray-100 text-gray-600" },
  expired: { label: "終了", dot: "bg-red-400", bg: "bg-red-50 text-red-600" },
};

const TYPE_LABEL: Record<string, string> = {
  career: "正社員",
  baito: "アルバイト",
  gig: "単発バイト",
};

export default function DashboardJobsPage() {
  const [jobs] = useState(getCompanyJobs);
  const [filter, setFilter] = useState<CompanyJob["status"] | "all">("all");

  const filtered = filter === "all" ? jobs : jobs.filter((j) => j.status === filter);

  return (
    <DashboardShell>
      <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl lg:text-2xl font-black text-gray-900">求人管理</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">{jobs.length}件の求人</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-[13px] font-extrabold shadow-md shadow-blue-200/50 hover:shadow-lg active:scale-[0.97] transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            新しい求人を作成
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
          {(["all", "active", "paused", "draft", "expired"] as const).map((s) => {
            const count = s === "all" ? jobs.length : jobs.filter((j) => j.status === s).length;
            if (s !== "all" && count === 0) return null;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-bold transition ${
                  filter === s
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
                }`}
              >
                {s === "all" ? "すべて" : STATUS_MAP[s].label} ({count})
              </button>
            );
          })}
        </div>

        {/* Job cards */}
        <div className="space-y-3">
          {filtered.map((job) => (
            <JobRow key={job.id} job={job} />
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}

function JobRow({ job }: { job: CompanyJob }) {
  const status = STATUS_MAP[job.status];
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 lg:p-5 hover:shadow-md transition">
      <div className="flex gap-4">
        {/* Thumbnail */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={job.image}
          alt={job.title}
          className="w-16 h-16 lg:w-20 lg:h-20 rounded-xl object-cover shrink-0"
        />

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[15px] font-extrabold text-gray-900 truncate">{job.title}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${status.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
                <span className="font-bold text-gray-600">{TYPE_LABEL[job.type] ?? job.type}</span>
                <span>{job.salary}</span>
                <span>{job.location}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="relative shrink-0">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="19" r="1.5" />
                </svg>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden min-w-[160px]">
                    <button className="w-full text-left px-4 py-2.5 text-[12px] text-gray-700 hover:bg-gray-50 font-bold">
                      編集
                    </button>
                    <button className="w-full text-left px-4 py-2.5 text-[12px] text-gray-700 hover:bg-gray-50 font-bold">
                      {job.status === "active" ? "一時停止" : "再掲載"}
                    </button>
                    <button className="w-full text-left px-4 py-2.5 text-[12px] text-gray-700 hover:bg-gray-50 font-bold">
                      複製
                    </button>
                    <button className="w-full text-left px-4 py-2.5 text-[12px] text-rose-500 hover:bg-rose-50 font-bold">
                      削除
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-3 text-[11px]">
            <Stat icon="👁" label="閲覧" value={job.views.toLocaleString()} />
            <Stat icon="❤" label="LIKE" value={String(job.likes)} />
            <Stat icon="🤝" label="マッチ" value={String(job.matches)} />
            <Stat icon="📋" label="応募" value={String(job.applications)} />
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className="hidden sm:inline text-gray-400">
              {new Date(job.postedAt).toLocaleDateString("ja-JP")} 掲載
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1 text-gray-500">
      <span aria-hidden className="text-[10px]">{icon}</span>
      <span className="font-bold text-gray-700">{value}</span>
      <span className="hidden sm:inline text-gray-400">{label}</span>
    </div>
  );
}
