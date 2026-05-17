"use client";

import Link from "next/link";
import DashboardShell from "@/components/DashboardShell";
import {
  getKPIs,
  getApplicants,
  getCompanyThreads,
  getWeeklyStats,
  DEMO_COMPANY,
} from "@/lib/services/companyDemo";

export default function DashboardOverview() {
  const kpi = getKPIs();
  const applicants = getApplicants();
  const threads = getCompanyThreads();
  const weekly = getWeeklyStats();

  const pendingApplicants = applicants.filter(
    (a) => a.stage === "liked" || a.stage === "screening"
  );
  const unreadThreads = threads.filter((t) => t.unread > 0);

  return (
    <DashboardShell>
      <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-gray-900">
            おはようございます, {DEMO_COMPANY.name}
          </h1>
          <p className="text-[13px] text-gray-500 mt-1">
            今日の採用状況をチェックしましょう
          </p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <KPICard label="掲載中の求人" value={kpi.activeJobs} unit="件" href="/dashboard/jobs" color="blue" />
          <KPICard label="今週の閲覧数" value={kpi.totalViews.toLocaleString()} href="/dashboard/analytics" color="emerald" />
          <KPICard label="マッチ数" value={kpi.totalMatches} href="/dashboard/applicants" color="violet" />
          <KPICard label="採用決定" value={kpi.hired} unit="人" href="/dashboard/applicants" color="amber" />
        </div>

        {/* Charts + activity */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-4 lg:gap-6">
          {/* Weekly chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[15px] font-extrabold text-gray-900">週間パフォーマンス</h2>
              <Link href="/dashboard/analytics" className="text-[11px] text-blue-500 font-bold hover:underline">
                詳しく見る →
              </Link>
            </div>
            <div className="space-y-3">
              {weekly.map((day) => (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-400 font-bold w-10 shrink-0">{day.date}</span>
                  <div className="flex-1 flex items-center gap-1.5 h-6">
                    <div
                      className="h-full rounded-md bg-blue-100"
                      style={{ width: `${(day.views / 200) * 100}%`, minWidth: 4 }}
                      title={`閲覧 ${day.views}`}
                    />
                    <div
                      className="h-full rounded-md bg-emerald-200"
                      style={{ width: `${(day.likes / 20) * 100}%`, minWidth: 4 }}
                      title={`LIKE ${day.likes}`}
                    />
                    <div
                      className="h-full rounded-md bg-violet-300"
                      style={{ width: `${(day.matches / 7) * 100}%`, minWidth: 4 }}
                      title={`マッチ ${day.matches}`}
                    />
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-400 shrink-0 tabular-nums">
                    <span>{day.views} 閲覧</span>
                    <span>{day.likes} LIKE</span>
                    <span>{day.matches} マッチ</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-50 text-[10px]">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-100" />閲覧</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-200" />LIKE</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-violet-300" />マッチ</span>
            </div>
          </div>

          {/* Right column: activity feed */}
          <div className="space-y-4">
            {/* Pending review */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[14px] font-extrabold text-gray-900">対応待ち</h2>
                <span className="text-[11px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
                  {pendingApplicants.length}件
                </span>
              </div>
              {pendingApplicants.length === 0 ? (
                <p className="text-[12px] text-gray-400">対応待ちの応募者はいません</p>
              ) : (
                <ul className="space-y-2">
                  {pendingApplicants.slice(0, 4).map((a) => (
                    <li key={a.id}>
                      <Link
                        href="/dashboard/applicants"
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.photo} alt={a.name} className="w-9 h-9 rounded-lg object-cover" />
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
            </div>

            {/* Unread messages */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[14px] font-extrabold text-gray-900">未読メッセージ</h2>
                <Link href="/dashboard/messages" className="text-[11px] text-blue-500 font-bold hover:underline">
                  すべて見る →
                </Link>
              </div>
              {unreadThreads.length === 0 ? (
                <p className="text-[12px] text-gray-400">未読メッセージはありません</p>
              ) : (
                <ul className="space-y-2">
                  {unreadThreads.map((t) => (
                    <li key={t.id}>
                      <Link
                        href="/dashboard/messages"
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={t.applicantPhoto} alt={t.applicantName} className="w-9 h-9 rounded-lg object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-bold text-gray-900 truncate">{t.applicantName}</p>
                          <p className="text-[10px] text-gray-500 truncate">{t.lastMessage}</p>
                        </div>
                        <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-[10px] font-black flex items-center justify-center">
                          {t.unread}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Quick stats */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
              <h2 className="text-[14px] font-extrabold mb-3">今月のハイライト</h2>
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

function KPICard({
  label,
  value,
  unit,
  href,
  color,
}: {
  label: string;
  value: string | number;
  unit?: string;
  href: string;
  color: "blue" | "emerald" | "violet" | "amber";
}) {
  const colors = {
    blue: "from-blue-500 to-cyan-400",
    emerald: "from-emerald-500 to-teal-400",
    violet: "from-violet-500 to-fuchsia-400",
    amber: "from-amber-500 to-orange-400",
  };
  return (
    <Link
      href={href}
      className="group bg-white rounded-2xl border border-gray-100 p-4 lg:p-5 hover:shadow-lg hover:border-gray-200 transition"
    >
      <p className="text-[11px] font-bold text-gray-400 mb-2">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl lg:text-3xl font-black bg-gradient-to-r ${colors[color]} bg-clip-text text-transparent`}>
          {value}
        </span>
        {unit && <span className="text-[12px] text-gray-400 font-bold">{unit}</span>}
      </div>
    </Link>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-white/50 font-bold">{label}</p>
      <p className="text-[16px] font-black mt-0.5">{value}</p>
    </div>
  );
}

function StageBadge({ stage }: { stage: string }) {
  const map: Record<string, { label: string; className: string }> = {
    liked: { label: "LIKE", className: "bg-blue-50 text-blue-600" },
    screening: { label: "選考中", className: "bg-amber-50 text-amber-600" },
    matched: { label: "マッチ", className: "bg-violet-50 text-violet-600" },
    interview: { label: "面接", className: "bg-emerald-50 text-emerald-600" },
    offered: { label: "内定", className: "bg-rose-50 text-rose-600" },
    hired: { label: "採用", className: "bg-green-50 text-green-700" },
    rejected: { label: "不採用", className: "bg-gray-50 text-gray-500" },
    withdrawn: { label: "辞退", className: "bg-gray-50 text-gray-400" },
  };
  const s = map[stage] ?? { label: stage, className: "bg-gray-50 text-gray-500" };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.className}`}>
      {s.label}
    </span>
  );
}
