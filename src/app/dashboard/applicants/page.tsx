"use client";

import { useMemo, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import {
  getApplicants,
  type Applicant,
  type ApplicantStage,
  type SwiplyRecord,
} from "@/lib/services/companyDemo";

/** Reliability tier from a 0-100 score. */
function reliabilityTier(score: number) {
  if (score >= 85)
    return { label: "高信頼", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", bar: "from-emerald-500 to-teal-400", dot: "bg-emerald-500" };
  if (score >= 70)
    return { label: "良好", cls: "bg-blue-50 text-blue-600 border-blue-200", bar: "from-blue-500 to-cyan-400", dot: "bg-blue-500" };
  if (score >= 50)
    return { label: "要注意", cls: "bg-amber-50 text-amber-700 border-amber-200", bar: "from-amber-500 to-orange-400", dot: "bg-amber-500" };
  return { label: "リスク高", cls: "bg-rose-50 text-rose-600 border-rose-200", bar: "from-rose-500 to-red-400", dot: "bg-rose-500" };
}

const STAGE_META: Record<
  ApplicantStage,
  { label: string; color: string; order: number }
> = {
  liked:     { label: "LIKE",   color: "bg-blue-50 text-blue-600 border-blue-200", order: 0 },
  matched:   { label: "マッチ", color: "bg-violet-50 text-violet-600 border-violet-200", order: 1 },
  screening: { label: "選考中", color: "bg-amber-50 text-amber-600 border-amber-200", order: 2 },
  interview: { label: "面接",   color: "bg-emerald-50 text-emerald-600 border-emerald-200", order: 3 },
  offered:   { label: "内定",   color: "bg-rose-50 text-rose-600 border-rose-200", order: 4 },
  hired:     { label: "採用",   color: "bg-green-50 text-green-700 border-green-200", order: 5 },
  rejected:  { label: "不採用", color: "bg-gray-100 text-gray-500 border-gray-200", order: 6 },
  withdrawn: { label: "辞退",   color: "bg-gray-50 text-gray-400 border-gray-200", order: 7 },
};

type ViewMode = "list" | "kanban";
type StageFilter = ApplicantStage | "all";

export default function DashboardApplicantsPage() {
  const [applicants] = useState(getApplicants);
  const [filter, setFilter] = useState<StageFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("list");

  const filtered = useMemo(() => {
    const list = filter === "all" ? applicants : applicants.filter((a) => a.stage === filter);
    return list.sort((a, b) => STAGE_META[a.stage].order - STAGE_META[b.stage].order);
  }, [applicants, filter]);

  const selected = applicants.find((a) => a.id === selectedId) ?? null;

  // Count per stage for filter pills
  const stageCounts = useMemo(() => {
    const m: Partial<Record<ApplicantStage, number>> = {};
    for (const a of applicants) m[a.stage] = (m[a.stage] ?? 0) + 1;
    return m;
  }, [applicants]);

  // Kanban columns
  const kanbanStages: ApplicantStage[] = ["liked", "matched", "screening", "interview", "offered", "hired"];

  return (
    <DashboardShell>
      <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
        {/* Demo banner */}
        <DemoBanner />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl lg:text-2xl font-black text-gray-900">応募者管理</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">{applicants.length}人の候補者</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("list")}
              className={`p-2 rounded-lg transition ${view === "list" ? "bg-gray-900 text-white" : "bg-white text-gray-400 border border-gray-200"}`}
              aria-label="リスト表示"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setView("kanban")}
              className={`p-2 rounded-lg transition ${view === "kanban" ? "bg-gray-900 text-white" : "bg-white text-gray-400 border border-gray-200"}`}
              aria-label="カンバン表示"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </button>
          </div>
        </div>

        {view === "list" ? (
          <>
            {/* Filter pills */}
            <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
              <FilterPill
                label="すべて"
                count={applicants.length}
                active={filter === "all"}
                onClick={() => setFilter("all")}
              />
              {(Object.keys(STAGE_META) as ApplicantStage[]).map((s) => {
                const count = stageCounts[s] ?? 0;
                if (count === 0) return null;
                return (
                  <FilterPill
                    key={s}
                    label={STAGE_META[s].label}
                    count={count}
                    active={filter === s}
                    onClick={() => setFilter(s)}
                  />
                );
              })}
            </div>

            {/* List + detail split */}
            <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-6">
              {/* List */}
              <div className="space-y-2">
                {filtered.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setSelectedId(a.id)}
                    className={`w-full text-left bg-white rounded-xl border p-3 lg:p-4 flex items-center gap-3 transition hover:shadow-sm ${
                      selectedId === a.id
                        ? "border-blue-300 ring-2 ring-blue-100"
                        : "border-gray-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.photo} alt={a.name} className="w-11 h-11 rounded-xl object-cover shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[14px] font-extrabold text-gray-900 truncate">{a.name}</p>
                        <span className="text-[11px] text-gray-400">{a.age}歳</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${STAGE_META[a.stage].color}`}>
                          {STAGE_META[a.stage].label}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate">{a.jobTitle} / {a.experience}</p>
                    </div>
                    <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                      <MatchScore score={a.matchRate} />
                      <ReliabilityChip record={a.swiplyRecord} />
                    </div>
                  </button>
                ))}
              </div>

              {/* Detail panel */}
              <div className="hidden lg:block">
                {selected ? (
                  <ApplicantDetail applicant={selected} />
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                    <p className="text-[13px] text-gray-400">候補者を選択してください</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Kanban view */
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-3 min-w-max">
              {kanbanStages.map((stage) => {
                const stageApps = applicants.filter((a) => a.stage === stage);
                return (
                  <div key={stage} className="w-[260px] shrink-0">
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${STAGE_META[stage].color}`}>
                        {STAGE_META[stage].label}
                      </span>
                      <span className="text-[11px] text-gray-400 font-bold">{stageApps.length}</span>
                    </div>
                    <div className="space-y-2">
                      {stageApps.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => setSelectedId(a.id)}
                          className={`w-full text-left bg-white rounded-xl border p-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
                            selectedId === a.id ? "border-blue-300 ring-2 ring-blue-100" : "border-gray-100"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 mb-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={a.photo} alt={a.name} className="w-9 h-9 rounded-xl object-cover shadow-sm" />
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-bold text-gray-900 truncate">{a.name}</p>
                              <p className="text-[10px] text-gray-400 truncate">{a.age}歳</p>
                            </div>
                            <MatchScore score={a.matchRate} />
                          </div>
                          <p className="text-[10px] text-gray-500 truncate mb-2">{a.jobTitle}</p>
                          <div className="flex flex-wrap gap-1">
                            {a.skills.slice(0, 3).map((s) => (
                              <span key={s} className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-500 border border-gray-100">
                                {s}
                              </span>
                            ))}
                          </div>
                        </button>
                      ))}
                      {stageApps.length === 0 && (
                        <div className="border-2 border-dashed border-gray-100 rounded-xl p-4 text-center text-[11px] text-gray-300">
                          候補者なし
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Mobile detail modal */}
      {selected && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setSelectedId(null)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white px-4 pt-3 pb-2 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-[15px] font-extrabold text-gray-900">{selected.name}</h3>
              <button onClick={() => setSelectedId(null)} className="p-1 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <ApplicantDetail applicant={selected} />
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function FilterPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-bold transition ${
        active
          ? "bg-gray-900 text-white"
          : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
      }`}
    >
      {label} ({count})
    </button>
  );
}

function MatchScore({ score }: { score: number }) {
  const color = score >= 85 ? "text-emerald-600" : score >= 70 ? "text-blue-500" : "text-gray-400";
  return (
    <div className={`text-[12px] font-black tabular-nums ${color}`}>
      {score}%
    </div>
  );
}

/** Compact reliability chip for the list rows (only shown when noteworthy). */
function ReliabilityChip({ record }: { record: SwiplyRecord }) {
  const tier = reliabilityTier(record.reliabilityScore);
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${tier.cls}`}
      title={`SWIPLY 信頼スコア ${record.reliabilityScore}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${tier.dot}`} />
      信頼 {record.reliabilityScore}
    </span>
  );
}

/**
 * The company-facing reliability panel: SWIPLY-internal track record so a
 * hiring company can judge no-show risk and stickiness before investing.
 */
function SwiplyRecordPanel({ record }: { record: SwiplyRecord }) {
  const tier = reliabilityTier(record.reliabilityScore);
  const attendTotal = record.interviewsAttended + record.noShows;
  const attendRate =
    attendTotal > 0
      ? Math.round((record.interviewsAttended / attendTotal) * 100)
      : null;
  // Pure: parsing a fixed ISO string is deterministic (unlike Date.now()).
  const memberLabel = new Date(record.memberSince).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "numeric",
  });

  const stats: { label: string; value: string; warn?: boolean }[] = [
    { label: "応募", value: `${record.applications}件` },
    { label: "面接出席", value: `${record.interviewsAttended}回` },
    { label: "ブッチ", value: `${record.noShows}回`, warn: record.noShows > 0 },
    { label: "過去採用", value: `${record.hiredBefore}回` },
    {
      label: "平均在籍",
      value: record.avgTenureMonths != null ? `${record.avgTenureMonths}ヶ月` : "—",
    },
    { label: "登録", value: memberLabel },
  ];

  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50/70 border-b border-gray-100">
        <span className="text-[10px] font-bold text-gray-500 tracking-wide">
          SWIPLY 実績・信頼スコア
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.cls}`}>
          {tier.label}
        </span>
      </div>

      <div className="p-3 space-y-3">
        {/* Score */}
        <div>
          <div className="flex items-end justify-between mb-1.5">
            <span className="text-[11px] font-bold text-gray-500">信頼スコア</span>
            <span className="text-[20px] font-black tabular-nums text-gray-900 leading-none">
              {record.reliabilityScore}
              <span className="text-[11px] text-gray-400 font-bold"> / 100</span>
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${tier.bar} transition-all duration-700`}
              style={{ width: `${record.reliabilityScore}%` }}
            />
          </div>
          {attendRate != null && (
            <p className="text-[10px] text-gray-400 mt-1.5">
              面接出席率 <span className="font-bold text-gray-600">{attendRate}%</span>
              （{record.interviewsAttended}/{attendTotal}）
            </p>
          )}
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <div
              key={s.label}
              className={`rounded-lg px-2 py-1.5 border ${
                s.warn ? "bg-amber-50 border-amber-200" : "bg-gray-50/70 border-gray-100"
              }`}
            >
              <p className="text-[9px] text-gray-400 font-bold">{s.label}</p>
              <p className={`text-[13px] font-black tabular-nums ${s.warn ? "text-amber-700" : "text-gray-900"}`}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {record.noShows > 0 ? (
          <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 leading-relaxed">
            ⚠ 過去に無断キャンセル歴あり。面接設定時はリマインドを推奨します。
          </p>
        ) : (
          <p className="text-[10px] text-gray-400 leading-relaxed">
            SWIPLY 内の行動履歴にもとづく信頼指標です。ブッチが少なく、定着している候補者ほど高くなります。
          </p>
        )}
      </div>
    </div>
  );
}

function DemoBanner() {
  return (
    <div className="mb-5 relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
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
        <p className="text-[12px] font-bold text-white">デモモードで体験中 — 実際の操作は反映されません</p>
      </div>
      <a href="/business#contact" className="relative shrink-0 px-4 py-1.5 rounded-lg bg-white/20 text-white text-[11px] font-bold hover:bg-white/30 transition">
        本番を始める →
      </a>
    </div>
  );
}

function ApplicantDetail({ applicant }: { applicant: Applicant }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={applicant.photo} alt={applicant.name} className="w-14 h-14 rounded-xl object-cover" />
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-extrabold text-gray-900">{applicant.name}</h3>
            <span className="text-[12px] text-gray-400">{applicant.age}歳</span>
          </div>
          <p className="text-[12px] text-gray-500">{applicant.jobTitle}</p>
        </div>
      </div>

      {/* Match score */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-blue-700">AI マッチスコア</span>
          <span className="text-[22px] font-black text-blue-600 tabular-nums">{applicant.matchRate}%</span>
        </div>
        {/* Score bar */}
        <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-700"
            style={{ width: `${applicant.matchRate}%` }}
          />
        </div>
      </div>

      {/* Stage */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 mb-1.5">ステータス</p>
        <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${STAGE_META[applicant.stage].color}`}>
          {STAGE_META[applicant.stage].label}
        </span>
      </div>

      {/* Experience */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 mb-1.5">経歴</p>
        <p className="text-[13px] text-gray-700">{applicant.experience}</p>
      </div>

      {/* Skills */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 mb-1.5">スキル</p>
        <div className="flex flex-wrap gap-1.5">
          {applicant.skills.map((s) => (
            <span key={s} className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-gray-50 border border-gray-100 text-gray-600">
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Self intro */}
      <div>
        <p className="text-[10px] font-bold text-gray-400 mb-1.5">自己紹介</p>
        <p className="text-[13px] text-gray-700 leading-relaxed">{applicant.selfIntro}</p>
      </div>

      {/* SWIPLY track record — the「その前のデータが見れる」reliability signal */}
      <SwiplyRecordPanel record={applicant.swiplyRecord} />

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 pt-2">
        <button className="h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-[12px] font-extrabold shadow-md shadow-blue-200/50 active:scale-[0.97] transition">
          メッセージ
        </button>
        <button className="h-10 rounded-xl bg-gray-100 text-gray-700 text-[12px] font-extrabold hover:bg-gray-200 active:scale-[0.97] transition">
          面接を予約
        </button>
      </div>
    </div>
  );
}
