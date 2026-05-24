"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import {
  getKPIs,
  getApplicants,
  getCompanyThreads,
  getWeeklyStats,
  getRecentActivity,
  DEMO_COMPANY,
  type ActivityEvent,
} from "@/lib/services/companyDemo";

function useAnimatedNumber(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    const start = ref.current;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = performance.now();
    let raf: number;
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setValue(current);
      ref.current = current;
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "お疲れ様です";
  if (h < 12) return "おはようございます";
  if (h < 18) return "こんにちは";
  return "お疲れ様です";
}

function relativeTime(iso: string): string {
  const diff = Date.now() - Date.parse(iso);
  if (Number.isNaN(diff)) return "";
  if (diff < 60_000) return "たった今";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}分前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)}時間前`;
  return `${Math.floor(diff / 86_400_000)}日前`;
}

const ACTIVITY_ICON: Record<ActivityEvent["type"], { bg: string; icon: React.ReactNode }> = {
  like: {
    bg: "bg-blue-100",
    icon: <svg className="w-3.5 h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>,
  },
  match: {
    bg: "bg-violet-100",
    icon: <svg className="w-3.5 h-3.5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>,
  },
  message: {
    bg: "bg-sky-100",
    icon: <svg className="w-3.5 h-3.5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>,
  },
  interview: {
    bg: "bg-amber-100",
    icon: <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>,
  },
  offer: {
    bg: "bg-rose-100",
    icon: <svg className="w-3.5 h-3.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  },
  hire: {
    bg: "bg-emerald-100",
    icon: <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>,
  },
  view_milestone: {
    bg: "bg-cyan-100",
    icon: <svg className="w-3.5 h-3.5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>,
  },
};

export default function DashboardOverview() {
  const kpi = getKPIs();
  const applicants = getApplicants();
  const threads = getCompanyThreads();
  const weekly = getWeeklyStats();
  const activity = getRecentActivity();

  const pendingApplicants = applicants.filter(
    (a) => a.stage === "liked" || a.stage === "screening"
  );
  const unreadThreads = threads.filter((t) => t.unread > 0);

  return (
    <DashboardShell>
      <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto space-y-6">
        {/* Demo banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/30 -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/20 translate-y-1/2 -translate-x-1/4" />
          </div>
          <div className="flex items-center gap-3 relative">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-extrabold text-white">デモモードで体験中</p>
              <p className="text-[11px] text-white/70">Hair Salon BLOOM としてダッシュボードを操作できます</p>
            </div>
          </div>
          <Link
            href="/business#contact"
            className="relative shrink-0 px-5 py-2.5 rounded-xl bg-white text-blue-700 text-[12px] font-extrabold shadow-lg shadow-black/10 hover:bg-cyan-50 active:scale-[0.97] transition-all"
          >
            ファウンディング申込 →
          </Link>
        </div>

        {/* Welcome */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl lg:text-2xl font-black text-gray-900">
              {getGreeting()}, {DEMO_COMPANY.name}
            </h1>
            <p className="text-[13px] text-gray-500 mt-1">
              今日の採用状況をチェックしましょう
            </p>
          </div>
          <p className="hidden md:block text-[12px] text-gray-400 font-medium">
            {new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
          </p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <AnimatedKPICard
            label="掲載中の求人"
            value={kpi.activeJobs}
            unit="件"
            href="/dashboard/jobs"
            color="blue"
            trend={null}
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0h2a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h2"/></svg>}
          />
          <AnimatedKPICard
            label="今週の閲覧数"
            value={kpi.totalViews}
            href="/dashboard/analytics"
            color="emerald"
            trend={kpi.viewsTrend}
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>}
          />
          <AnimatedKPICard
            label="マッチ数"
            value={kpi.totalMatches}
            href="/dashboard/applicants"
            color="violet"
            trend={kpi.matchesTrend}
            icon={<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>}
          />
          <AnimatedKPICard
            label="採用決定"
            value={kpi.hired}
            unit="人"
            href="/dashboard/applicants"
            color="amber"
            trend={kpi.hiredTrend}
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>}
          />
        </div>

        {/* Charts + activity */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-4 lg:gap-6">
          {/* Left: Weekly chart + mini sparklines */}
          <div className="space-y-4">
            {/* Weekly chart */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm shadow-gray-100/50">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-[15px] font-extrabold text-gray-900">週間パフォーマンス</h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">過去7日間の推移</p>
                </div>
                <Link href="/dashboard/analytics" className="text-[11px] text-blue-500 font-bold hover:underline flex items-center gap-1">
                  詳しく見る
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {/* Bar chart */}
              <div className="flex items-end gap-2 h-[180px] mb-3">
                {weekly.map((day) => {
                  const maxViews = Math.max(...weekly.map((d) => d.views));
                  const h = (day.views / maxViews) * 100;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full group">
                      {/* Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-1 px-2 py-1 rounded-lg bg-gray-900 text-white text-[10px] font-bold whitespace-nowrap shadow-lg pointer-events-none">
                        {day.views}閲覧 / {day.likes}LIKE / {day.matches}マッチ
                      </div>
                      <div className="w-full flex flex-col gap-[2px]" style={{ height: `${h}%`, minHeight: 8 }}>
                        <div className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg group-hover:from-blue-600 group-hover:to-blue-500 transition-colors shadow-sm" />
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold mt-2">{day.date}</span>
                    </div>
                  );
                })}
              </div>

              {/* Legend + summary */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <div className="flex items-center gap-4 text-[10px]">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded bg-blue-400" />閲覧数</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                  <span className="font-bold">平均 {Math.round(weekly.reduce((s, d) => s + d.views, 0) / weekly.length)} /日</span>
                  <span className="text-gray-300">|</span>
                  <span className="font-bold">最大 {Math.max(...weekly.map((d) => d.views))}</span>
                </div>
              </div>
            </div>

            {/* Mini metric row */}
            <div className="grid grid-cols-3 gap-3">
              <MiniMetricCard
                label="合計LIKE"
                value={kpi.totalLikes}
                trend={kpi.likesTrend}
                weekly={weekly.map((d) => d.likes)}
                color="emerald"
              />
              <MiniMetricCard
                label="マッチ数"
                value={kpi.totalMatches}
                trend={kpi.matchesTrend}
                weekly={weekly.map((d) => d.matches)}
                color="violet"
              />
              <MiniMetricCard
                label="応募数"
                value={kpi.totalApplications}
                trend={kpi.applicationsTrend}
                weekly={weekly.map((d) => d.applications)}
                color="rose"
              />
            </div>
          </div>

          {/* Right column: activity + pending + messages */}
          <div className="space-y-4">
            {/* Activity timeline */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm shadow-gray-100/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[14px] font-extrabold text-gray-900">最近のアクティビティ</h2>
              </div>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[17px] top-3 bottom-3 w-[1.5px] bg-gray-100" />
                <ul className="space-y-3">
                  {activity.slice(0, 6).map((event) => {
                    const meta = ACTIVITY_ICON[event.type];
                    return (
                      <li key={event.id} className="flex items-start gap-3 relative">
                        <div className={`w-[35px] h-[35px] rounded-xl ${meta.bg} flex items-center justify-center shrink-0 z-10 shadow-sm`}>
                          {meta.icon}
                        </div>
                        <div className="min-w-0 flex-1 pt-1">
                          <p className="text-[12px] text-gray-700 leading-snug">{event.description}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{relativeTime(event.time)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* Pending review */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm shadow-gray-100/50">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[14px] font-extrabold text-gray-900">対応待ち</h2>
                <span className="text-[11px] font-bold text-rose-500 bg-rose-50 px-2.5 py-0.5 rounded-full">
                  {pendingApplicants.length}件
                </span>
              </div>
              {pendingApplicants.length === 0 ? (
                <p className="text-[12px] text-gray-400">対応待ちの応募者はいません</p>
              ) : (
                <ul className="space-y-1.5">
                  {pendingApplicants.slice(0, 4).map((a) => (
                    <li key={a.id}>
                      <Link
                        href="/dashboard/applicants"
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.photo} alt={a.name} className="w-9 h-9 rounded-xl object-cover shadow-sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-bold text-gray-900 truncate">{a.name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{a.jobTitle}</p>
                        </div>
                        <StageBadge stage={a.stage} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {pendingApplicants.length > 4 && (
                <Link href="/dashboard/applicants" className="block text-center text-[11px] text-blue-500 font-bold mt-3 hover:underline">
                  すべて表示 ({pendingApplicants.length}件)
                </Link>
              )}
            </div>

            {/* Unread messages */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm shadow-gray-100/50">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[14px] font-extrabold text-gray-900">未読メッセージ</h2>
                <Link href="/dashboard/messages" className="text-[11px] text-blue-500 font-bold hover:underline flex items-center gap-1">
                  すべて見る
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              {unreadThreads.length === 0 ? (
                <p className="text-[12px] text-gray-400">未読メッセージはありません</p>
              ) : (
                <ul className="space-y-1.5">
                  {unreadThreads.map((t) => (
                    <li key={t.id}>
                      <Link
                        href="/dashboard/messages"
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={t.applicantPhoto} alt={t.applicantName} className="w-9 h-9 rounded-xl object-cover shadow-sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-bold text-gray-900 truncate">{t.applicantName}</p>
                          <p className="text-[10px] text-gray-500 truncate">{t.lastMessage}</p>
                        </div>
                        <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                          {t.unread}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Quick stats */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-850 to-gray-800 rounded-2xl p-5 text-white shadow-lg shadow-gray-900/20">
              <h2 className="text-[14px] font-extrabold mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
                </svg>
                今月のハイライト
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="応募→面接率" value={`${kpi.conversionRate}%`} />
                <MiniStat label="平均返信速度" value={kpi.avgResponseTime} />
                <MiniStat label="面接予定" value={`${kpi.interviewScheduled}件`} />
                <MiniStat label="内定承諾" value={`${kpi.hired}人`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function AnimatedKPICard({
  label,
  value,
  unit,
  href,
  color,
  trend,
  icon,
}: {
  label: string;
  value: number;
  unit?: string;
  href: string;
  color: "blue" | "emerald" | "violet" | "amber";
  trend: number | null;
  icon: React.ReactNode;
}) {
  const animated = useAnimatedNumber(value);
  const colors = {
    blue: { gradient: "from-blue-500 to-cyan-400", iconBg: "bg-blue-50 text-blue-500", trendUp: "text-blue-600" },
    emerald: { gradient: "from-emerald-500 to-teal-400", iconBg: "bg-emerald-50 text-emerald-500", trendUp: "text-emerald-600" },
    violet: { gradient: "from-violet-500 to-fuchsia-400", iconBg: "bg-violet-50 text-violet-500", trendUp: "text-violet-600" },
    amber: { gradient: "from-amber-500 to-orange-400", iconBg: "bg-amber-50 text-amber-500", trendUp: "text-amber-600" },
  };
  const c = colors[color];

  return (
    <Link
      href={href}
      className="group bg-white rounded-2xl border border-gray-100 p-4 lg:p-5 hover:shadow-lg hover:border-gray-200 hover:-translate-y-0.5 transition-all duration-300 shadow-sm shadow-gray-100/50"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-bold text-gray-400">{label}</p>
        <div className={`w-8 h-8 rounded-xl ${c.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-2xl lg:text-3xl font-black bg-gradient-to-r ${c.gradient} bg-clip-text text-transparent tabular-nums`}>
          {animated.toLocaleString()}
        </span>
        {unit && <span className="text-[12px] text-gray-400 font-bold">{unit}</span>}
      </div>
      {trend !== null && trend !== 0 && (
        <div className={`flex items-center gap-1 mt-2 text-[11px] font-bold ${trend > 0 ? "text-emerald-600" : "text-rose-500"}`}>
          {trend > 0 ? (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
          <span>{trend > 0 ? "+" : ""}{trend}%</span>
          <span className="text-gray-400 font-medium">前週比</span>
        </div>
      )}
    </Link>
  );
}

function MiniMetricCard({
  label,
  value,
  trend,
  weekly,
  color,
}: {
  label: string;
  value: number;
  trend: number;
  weekly: number[];
  color: "emerald" | "violet" | "rose";
}) {
  const maxW = Math.max(...weekly, 1);
  const colorMap = {
    emerald: { bar: "bg-emerald-400", text: "text-emerald-600" },
    violet: { bar: "bg-violet-400", text: "text-violet-600" },
    rose: { bar: "bg-rose-400", text: "text-rose-600" },
  };
  const c = colorMap[color];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm shadow-gray-100/50">
      <p className="text-[10px] font-bold text-gray-400 mb-1">{label}</p>
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-[20px] font-black text-gray-900 tabular-nums">{value}</span>
        {trend !== 0 && (
          <span className={`text-[10px] font-bold ${trend > 0 ? "text-emerald-600" : "text-rose-500"}`}>
            {trend > 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      {/* Sparkline */}
      <div className="flex items-end gap-[2px] h-6">
        {weekly.map((v, i) => (
          <div
            key={i}
            className={`flex-1 ${c.bar} rounded-sm opacity-60 last:opacity-100 transition-all`}
            style={{ height: `${Math.max((v / maxW) * 100, 8)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.06] rounded-xl px-3 py-2.5">
      <p className="text-[10px] text-white/40 font-bold">{label}</p>
      <p className="text-[17px] font-black mt-0.5 tabular-nums">{value}</p>
    </div>
  );
}

function StageBadge({ stage }: { stage: string }) {
  const map: Record<string, { label: string; className: string }> = {
    liked: { label: "LIKE", className: "bg-blue-50 text-blue-600 border border-blue-100" },
    screening: { label: "選考中", className: "bg-amber-50 text-amber-600 border border-amber-100" },
    matched: { label: "マッチ", className: "bg-violet-50 text-violet-600 border border-violet-100" },
    interview: { label: "面接", className: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
    offered: { label: "内定", className: "bg-rose-50 text-rose-600 border border-rose-100" },
    hired: { label: "採用", className: "bg-green-50 text-green-700 border border-green-100" },
    rejected: { label: "不採用", className: "bg-gray-50 text-gray-500 border border-gray-100" },
    withdrawn: { label: "辞退", className: "bg-gray-50 text-gray-400 border border-gray-100" },
  };
  const s = map[stage] ?? { label: stage, className: "bg-gray-50 text-gray-500" };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.className}`}>
      {s.label}
    </span>
  );
}
