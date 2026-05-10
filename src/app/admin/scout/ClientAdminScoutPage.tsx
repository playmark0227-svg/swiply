"use client";

/**
 * AI Scout console (`/admin/scout/`).
 *
 * Workflow:
 *   1. Operator picks a candidate from the demo list
 *   2. Operator picks a job (filtered to candidate's desired type)
 *   3. Operator chooses tone + sender name → "AI で文面を生成"
 *   4. The Worker (Claude) returns a personalized scout text
 *   5. Operator can edit, then "送信" → recorded to localStorage history
 *
 * Auth-gated: re-uses the same `isAdminAuthenticated` check the main
 * admin page uses, so the same password unlocks both.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { TrustBadgeRow } from "@/components/TrustBadges";
import { isAdminAuthenticated } from "@/lib/services/adminAuth";
import { getAllJobs } from "@/lib/services/jobs";
import { type CandidateProfile, candidates } from "@/data/candidates";
import {
  generateScout,
  getScoutHistory,
  recordScoutSent,
  type ScoutMessage,
} from "@/lib/services/scoutClient";
import type { Job } from "@/types/job";

export default function ClientAdminScoutPage() {
  const [authed] = useState<boolean | null>(() => {
    if (typeof window === "undefined") return null;
    return isAdminAuthenticated();
  });

  if (authed === null) {
    return <div className="min-h-dvh bg-gray-950" />;
  }
  if (!authed) {
    return (
      <div className="min-h-dvh bg-gray-950 text-white flex items-center justify-center px-5">
        <div className="text-center">
          <p className="text-sm font-bold mb-3">認証が必要です</p>
          <Link
            href="/admin/"
            className="inline-block px-5 py-2 rounded-xl bg-white text-gray-900 text-sm font-bold"
          >
            管理画面でログイン
          </Link>
        </div>
      </div>
    );
  }
  return <ScoutConsole />;
}

function ScoutConsole() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidate, setCandidate] = useState<CandidateProfile>(candidates[0]);
  const [job, setJob] = useState<Job | null>(null);
  const [tone, setTone] = useState<"casual" | "formal">("formal");
  const [senderName, setSenderName] = useState("採用担当 田中花子");
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mock, setMock] = useState(false);
  const [history, setHistory] = useState<ScoutMessage[]>([]);

  // Load jobs once
  useEffect(() => {
    getAllJobs().then((list) => {
      setJobs(list);
      // Pick the first job that matches the candidate's desired type
      const match = list.find(
        (j) =>
          candidate.desiredJobType === "both" ||
          j.type === candidate.desiredJobType
      );
      setJob(match ?? list[0] ?? null);
    });
  }, [candidate.desiredJobType]);

  useEffect(() => {
    setHistory(getScoutHistory());
  }, []);

  // Auto-pick a relevant job when the candidate changes
  useEffect(() => {
    if (jobs.length === 0) return;
    const match = jobs.find(
      (j) =>
        candidate.desiredJobType === "both" ||
        j.type === candidate.desiredJobType
    );
    setJob(match ?? jobs[0]);
    setDraft("");
    setError(null);
    setMock(false);
  }, [candidate, jobs]);

  const filteredJobs = useMemo(() => {
    if (candidate.desiredJobType === "both") return jobs;
    return jobs.filter((j) => j.type === candidate.desiredJobType);
  }, [candidate, jobs]);

  async function handleGenerate() {
    if (!job) return;
    setGenerating(true);
    setError(null);
    setMock(false);
    try {
      const res = await generateScout({ candidate, job, senderName, tone });
      if (res.ok && res.message) {
        setDraft(res.message);
        if (res.mock) setMock(true);
      } else {
        setError(res.error || "AI 生成に失敗しました");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  }

  function handleSend() {
    if (!job || !draft.trim()) return;
    recordScoutSent({
      candidateId: candidate.id,
      jobId: job.id,
      senderName,
      body: draft,
      aiGenerated: !mock || draft.length > 0,
    });
    setHistory(getScoutHistory());
    setDraft("");
    alert(`${candidate.name}さんにスカウトを送信しました 🎉`);
  }

  return (
    <div className="min-h-dvh bg-gray-50 pb-20">
      <Header />
      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-5 md:pt-8">
        <div className="flex items-end justify-between mb-5 md:mb-6">
          <div>
            <p className="text-[10px] tracking-[0.3em] font-black text-cyan-500 mb-1">
              AI SCOUT
            </p>
            <h1 className="text-xl md:text-2xl font-extrabold text-gray-900">
              候補者向け個別スカウト
            </h1>
            <p className="text-[12px] text-gray-500 mt-0.5 max-w-2xl leading-relaxed">
              プロフィールを Claude が読み込み、定型文ではない個別文章を生成します。
              他社の定型文スカウトの開封率は約30%。SWIPLY式は55%以上を狙います。
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[300px_1fr] gap-4 md:gap-6">
          {/* Candidate list */}
          <aside>
            <p className="text-[10px] tracking-[0.25em] font-black text-gray-400 mb-2">
              CANDIDATES — {candidates.length}
            </p>
            <ul className="space-y-2">
              {candidates.map((c) => {
                const active = c.id === candidate.id;
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setCandidate(c)}
                      className={`w-full text-left rounded-2xl px-3 py-2.5 flex items-center gap-3 border transition ${
                        active
                          ? "bg-violet-50 border-violet-200 shadow-sm"
                          : "bg-white border-gray-100 hover:border-violet-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.photo}
                        alt={c.name}
                        className="w-10 h-10 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-extrabold text-gray-900 truncate">
                          {c.name}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {c.age}歳 ・ {c.location}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {c.experience}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Detail + composer */}
          <section className="space-y-4 md:space-y-5">
            {/* Candidate card */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5 md:p-6">
              <div className="flex items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={candidate.photo}
                  alt={candidate.name}
                  className="w-16 h-16 rounded-2xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h2 className="text-base md:text-lg font-extrabold text-gray-900">
                    {candidate.name}
                    <span className="ml-2 text-[12px] font-medium text-gray-500">
                      {candidate.age}歳 / {candidate.location}
                    </span>
                  </h2>
                  <p className="text-[12px] text-gray-700 mt-1.5 leading-relaxed">
                    {candidate.selfIntro}
                  </p>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                    <p>
                      <span className="text-gray-400 mr-1">経験:</span>
                      <span className="text-gray-900 font-bold">
                        {candidate.experience}
                      </span>
                    </p>
                    {candidate.education && (
                      <p>
                        <span className="text-gray-400 mr-1">学歴:</span>
                        <span className="text-gray-900 font-bold">
                          {candidate.education}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {candidate.skills.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded-md bg-violet-50 text-[10px] font-bold text-violet-600"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Composer */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5 md:p-6">
              <p className="text-[10px] tracking-[0.25em] font-black text-gray-400 mb-3">
                COMPOSE
              </p>
              <div className="grid md:grid-cols-2 gap-3 mb-4">
                <Field label="ポジション">
                  <select
                    value={job?.id ?? ""}
                    onChange={(e) => {
                      const j = jobs.find((x) => x.id === e.target.value);
                      if (j) setJob(j);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-900 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  >
                    {filteredJobs.slice(0, 30).map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.company} ─ {j.title}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="送信者名">
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-900 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </Field>
              </div>
              <Field label="トーン">
                <div className="flex gap-2">
                  {(["formal", "casual"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTone(t)}
                      className={`px-4 py-1.5 rounded-xl text-[12px] font-extrabold transition ${
                        tone === t
                          ? "bg-violet-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {t === "formal" ? "丁寧" : "カジュアル"}
                    </button>
                  ))}
                </div>
              </Field>

              {job && (
                <div className="mt-4 bg-gray-50 rounded-2xl px-4 py-3 text-[11px] text-gray-700 border border-gray-100">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-extrabold text-gray-900">
                      📌 {job.company} ─ {job.title}
                    </p>
                    <TrustBadgeRow job={job} size="sm" />
                  </div>
                  <p className="line-clamp-2 text-gray-600">
                    {job.catchphrase}
                  </p>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={generating || !job}
                className="mt-4 w-full py-3 rounded-2xl text-sm font-extrabold text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 disabled:opacity-50 active:scale-[0.98] transition"
              >
                {generating ? "生成中…" : "🤖 AI で文面を生成"}
              </button>
            </div>

            {/* Draft */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5 md:p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] tracking-[0.25em] font-black text-gray-400">
                  DRAFT
                </p>
                {mock && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
                    MOCK（API未接続）
                  </span>
                )}
              </div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={12}
                placeholder={
                  generating
                    ? "AIが文面を生成中…"
                    : "「AIで文面を生成」を押すと、候補者向けの個別文章が表示されます。手直し後に送信できます。"
                }
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-[13px] text-gray-900 leading-relaxed focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-y font-sans"
              />
              {error && (
                <p className="text-[11px] text-rose-500 mt-2">{error}</p>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleSend}
                  disabled={!draft.trim()}
                  className="flex-1 py-3 rounded-2xl text-sm font-extrabold text-white bg-gradient-to-r from-emerald-500 to-teal-500 disabled:opacity-50 active:scale-[0.98] transition"
                >
                  📨 送信
                </button>
                <button
                  onClick={() => setDraft("")}
                  disabled={!draft.trim()}
                  className="px-4 py-3 rounded-2xl text-[12px] font-bold text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 disabled:opacity-50"
                >
                  クリア
                </button>
              </div>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="bg-white rounded-3xl border border-gray-100 p-5 md:p-6">
                <p className="text-[10px] tracking-[0.25em] font-black text-gray-400 mb-3">
                  SENT — {history.length}
                </p>
                <ul className="space-y-2">
                  {history.slice(-8).reverse().map((h) => {
                    const c = candidates.find((x) => x.id === h.candidateId);
                    const j = jobs.find((x) => x.id === h.jobId);
                    return (
                      <li
                        key={h.id}
                        className="text-[12px] text-gray-700 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100"
                      >
                        <p>
                          <span className="font-extrabold">
                            {c?.name ?? "?"}
                          </span>
                          <span className="text-gray-400 mx-1.5">→</span>
                          <span className="text-gray-600">
                            {j?.company ?? "?"} / {j?.title ?? "?"}
                          </span>
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(h.sentAt).toLocaleString("ja-JP")} ・{" "}
                          {h.senderName}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        <Link href="/admin/" className="flex items-center gap-2">
          <Logo size={28} radius={8} priority />
          <p className="text-[14px] font-black tracking-tight bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
            ViFight
          </p>
          <span className="text-gray-200 text-sm">/</span>
          <span className="text-[12px] font-bold text-gray-500">スカウト</span>
        </Link>
        <Link
          href="/admin/"
          className="text-[11px] font-bold text-gray-500 hover:text-violet-600"
        >
          ← 管理ホーム
        </Link>
      </div>
    </header>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold text-gray-500 mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
