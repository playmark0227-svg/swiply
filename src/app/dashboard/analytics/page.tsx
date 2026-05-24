"use client";

import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import {
  getCompanyJobs,
  getApplicants,
  getWeeklyStats,
  getKPIs,
} from "@/lib/services/companyDemo";

export default function DashboardAnalyticsPage() {
  const [jobs] = useState(getCompanyJobs);
  const [applicants] = useState(getApplicants);
  const weekly = getWeeklyStats();
  const kpi = getKPIs();

  // Per-job breakdown
  const activeJobs = jobs.filter((j) => j.status === "active" || j.status === "paused");

  // Funnel data
  const funnel = [
    { label: "閲覧", value: kpi.totalViews, color: "bg-blue-400" },
    { label: "LIKE", value: kpi.totalLikes, color: "bg-emerald-400" },
    { label: "マッチ", value: kpi.totalMatches, color: "bg-violet-400" },
    { label: "応募", value: kpi.totalApplications, color: "bg-rose-400" },
    { label: "面接", value: kpi.interviewScheduled, color: "bg-amber-400" },
    { label: "採用", value: kpi.hired, color: "bg-green-500" },
  ];
  const maxFunnel = Math.max(...funnel.map((f) => f.value), 1);

  // Source breakdown (mock)
  const sources = [
    { label: "SWIPLY スワイプ", pct: 62, color: "bg-blue-400" },
    { label: "検索", pct: 18, color: "bg-emerald-400" },
    { label: "AIスカウト", pct: 12, color: "bg-fuchsia-400" },
    { label: "SNSシェア", pct: 8, color: "bg-amber-400" },
  ];

  // Stage distribution
  const stageDistrib = [
    { label: "LIKE", count: applicants.filter((a) => a.stage === "liked").length, color: "bg-blue-300" },
    { label: "マッチ", count: applicants.filter((a) => a.stage === "matched").length, color: "bg-violet-300" },
    { label: "選考中", count: applicants.filter((a) => a.stage === "screening").length, color: "bg-amber-300" },
    { label: "面接", count: applicants.filter((a) => a.stage === "interview").length, color: "bg-emerald-300" },
    { label: "内定", count: applicants.filter((a) => a.stage === "offered").length, color: "bg-rose-300" },
    { label: "採用", count: applicants.filter((a) => a.stage === "hired").length, color: "bg-green-400" },
  ];
  const maxStage = Math.max(...stageDistrib.map((s) => s.count), 1);

  return (
    <DashboardShell>
      <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto space-y-6">
        {/* Demo banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/30 -translate-y-1/2 translate-x-1/4" />
          </div>
          <div className="flex items-center gap-2.5 relative">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <p className="text-[12px] font-bold text-white">デモモードで体験中 — サンプルデータを表示しています</p>
          </div>
          <a href="/business#contact" className="relative shrink-0 px-4 py-1.5 rounded-lg bg-white/20 text-white text-[11px] font-bold hover:bg-white/30 transition">
            本番を始める →
          </a>
        </div>

        <div>
          <h1 className="text-xl lg:text-2xl font-black text-gray-900">分析</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">採用パフォーマンスの概要</p>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <SummaryCard label="合計閲覧数" value={kpi.totalViews.toLocaleString()} />
          <SummaryCard label="合計LIKE" value={String(kpi.totalLikes)} />
          <SummaryCard label="マッチ率" value={`${((kpi.totalMatches / Math.max(kpi.totalLikes, 1)) * 100).toFixed(1)}%`} />
          <SummaryCard label="平均返信速度" value={kpi.avgResponseTime} />
          <SummaryCard label="応募→面接" value={`${kpi.conversionRate}%`} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Funnel */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm shadow-gray-100/50">
            <h2 className="text-[15px] font-extrabold text-gray-900 mb-5">採用ファネル</h2>
            <div className="space-y-3">
              {funnel.map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-gray-500 w-12 shrink-0 text-right">{f.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-7 overflow-hidden">
                    <div
                      className={`h-full ${f.color} rounded-full flex items-center justify-end pr-2 transition-all`}
                      style={{ width: `${Math.max((f.value / maxFunnel) * 100, 3)}%` }}
                    >
                      <span className="text-[10px] font-black text-white">{f.value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Source breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm shadow-gray-100/50">
            <h2 className="text-[15px] font-extrabold text-gray-900 mb-5">流入元</h2>
            <div className="space-y-3">
              {sources.map((s) => (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-bold text-gray-700">{s.label}</span>
                    <span className="text-[12px] font-black text-gray-900">{s.pct}%</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full ${s.color} rounded-full transition-all`}
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weekly trend */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm shadow-gray-100/50">
            <h2 className="text-[15px] font-extrabold text-gray-900 mb-5">週間トレンド</h2>
            <div className="flex items-end gap-2 h-40">
              {weekly.map((day) => {
                const max = Math.max(...weekly.map((d) => d.views));
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-0.5 text-[9px] font-bold text-gray-600 tabular-nums">
                      {day.views}
                    </div>
                    <div className="w-full flex flex-col gap-0.5" style={{ height: 120 }}>
                      <div className="flex-1 flex flex-col justify-end">
                        <div
                          className="bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg group-hover:from-blue-600 group-hover:to-blue-400 transition-colors shadow-sm"
                          style={{ height: `${(day.views / max) * 100}%`, minHeight: 4 }}
                        />
                      </div>
                    </div>
                    <span className="text-[9px] text-gray-400 font-bold">{day.date}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-50 text-[10px] text-gray-400">
              <span>最大 {Math.max(...weekly.map((d) => d.views))} 閲覧/日</span>
              <span>平均 {Math.round(weekly.reduce((s, d) => s + d.views, 0) / weekly.length)} 閲覧/日</span>
            </div>
          </div>

          {/* Stage distribution */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm shadow-gray-100/50">
            <h2 className="text-[15px] font-extrabold text-gray-900 mb-5">候補者ステージ分布</h2>
            <div className="space-y-3">
              {stageDistrib.map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-gray-500 w-12 shrink-0 text-right">{s.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full ${s.color} rounded-full flex items-center pl-2 transition-all`}
                      style={{ width: `${Math.max((s.count / maxStage) * 100, 8)}%` }}
                    >
                      <span className="text-[10px] font-black text-white">{s.count}人</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Per-job performance */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm shadow-gray-100/50">
          <h2 className="text-[15px] font-extrabold text-gray-900 mb-5">求人別パフォーマンス</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 text-[11px] font-bold text-gray-400 pr-4">求人</th>
                  <th className="pb-3 text-[11px] font-bold text-gray-400 text-right px-3">閲覧</th>
                  <th className="pb-3 text-[11px] font-bold text-gray-400 text-right px-3">LIKE</th>
                  <th className="pb-3 text-[11px] font-bold text-gray-400 text-right px-3">マッチ</th>
                  <th className="pb-3 text-[11px] font-bold text-gray-400 text-right px-3">応募</th>
                  <th className="pb-3 text-[11px] font-bold text-gray-400 text-right pl-3">CVR</th>
                </tr>
              </thead>
              <tbody>
                {activeJobs.map((job) => {
                  const cvr = job.views > 0 ? ((job.applications / job.views) * 100).toFixed(1) : "0";
                  return (
                    <tr key={job.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={job.image} alt={job.title} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-gray-900 truncate">{job.title}</p>
                            <p className="text-[10px] text-gray-400">{job.salary}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right text-[13px] font-bold text-gray-700 tabular-nums">{job.views.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right text-[13px] font-bold text-gray-700 tabular-nums">{job.likes}</td>
                      <td className="py-3 px-3 text-right text-[13px] font-bold text-gray-700 tabular-nums">{job.matches}</td>
                      <td className="py-3 px-3 text-right text-[13px] font-bold text-gray-700 tabular-nums">{job.applications}</td>
                      <td className="py-3 pl-3 text-right text-[13px] font-black text-blue-600 tabular-nums">{cvr}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm shadow-gray-100/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
      <p className="text-[10px] font-bold text-gray-400 mb-1">{label}</p>
      <p className="text-[20px] font-black text-gray-900 tabular-nums">{value}</p>
    </div>
  );
}
