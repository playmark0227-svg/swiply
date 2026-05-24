"use client";

/**
 * AI analysis route.
 *
 * URL: /interview/analysis/?id=<interviewId>&mode=user|company
 *
 * - Reads the appointment from localStorage.
 * - If no analysis exists yet for the requested perspective, offers a
 *   "もう一度生成" button (re-runs the Worker analyze endpoint with the
 *   stored transcript). For interviews that were never recorded, links
 *   back to the room to re-run.
 */

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import InterviewAnalysisCard from "@/components/InterviewAnalysisCard";
import {
  type InterviewAppointment,
  analyzeInterview,
  formatJaDateTime,
  getInterviewById,
  subscribeInterviews,
  updateInterview,
} from "@/lib/services/interviews";

export default function InterviewAnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center text-gray-400 text-sm">
          読み込み中…
        </div>
      }
    >
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const mode: "user" | "company" =
    params.get("mode") === "company" ? "company" : "user";

  const [appointment, setAppointment] = useState<
    InterviewAppointment | null | undefined
  >(undefined);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const refresh = () => setAppointment(getInterviewById(id) ?? null);
    refresh();
    return subscribeInterviews(refresh);
  }, [id]);

  // Bail out before the effect runs if the URL is malformed.
  // (Done after hooks so the rules-of-hooks aren't violated.)
  // Falls through into the existing not-found branch below via `!appointment`.

  async function handleRegenerate() {
    if (!appointment?.transcript) return;
    setRegenerating(true);
    setError(null);
    const res = await analyzeInterview(appointment.transcript, mode, {
      jobTitle: appointment.jobTitle,
      jobCompany: appointment.jobCompany,
    });
    if (res.ok && res.analysis) {
      updateInterview(appointment.id, {
        [mode === "user" ? "analysisForUser" : "analysisForCompany"]:
          res.analysis,
      });
    } else {
      setError(res.error || "AI 分析に失敗しました");
    }
    setRegenerating(false);
  }

  if (id && appointment === undefined) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-gray-400 text-sm">
        読み込み中…
      </div>
    );
  }
  if (!appointment) {
    return (
      <div className="min-h-dvh bg-[#fbf8f3] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-base font-extrabold text-gray-900 mb-2">
            面接が見つかりません
          </p>
          <Link
            href="/messages"
            className="inline-block px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-[12px] font-bold hover:bg-gray-200"
          >
            メッセージに戻る
          </Link>
        </div>
      </div>
    );
  }

  const analysis =
    mode === "user"
      ? appointment.analysisForUser
      : appointment.analysisForCompany;

  return (
    <div className="flex flex-col min-h-dvh bg-[#fbf8f3]">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 md:px-6 pt-4 md:pt-8 pb-20">
        <div className="mb-5">
          <Link
            href="/messages"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-violet-600 transition mb-3"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            メッセージへ
          </Link>
          <div className="bg-white rounded-3xl border border-gray-100 p-4 md:p-5 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={appointment.jobImage}
              alt={appointment.jobCompany}
              className="w-12 h-12 rounded-2xl object-cover ring-1 ring-gray-100"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-gray-900 truncate">
                {appointment.jobCompany}
              </p>
              <p className="text-[11px] text-gray-500 truncate">
                {appointment.jobTitle}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {formatJaDateTime(appointment.scheduledAt)} ・{" "}
                {appointment.durationMinutes}分
              </p>
            </div>
          </div>
        </div>

        {analysis ? (
          <>
            <InterviewAnalysisCard analysis={analysis} mode={mode} />
            {appointment.transcript && (
              <details className="mt-5 bg-white rounded-3xl border border-gray-100 px-5 py-4">
                <summary className="text-[12px] font-bold text-gray-700 cursor-pointer">
                  📝 文字起こしを表示
                </summary>
                <pre className="text-[12px] leading-relaxed text-gray-700 mt-3 whitespace-pre-wrap font-sans">
                  {appointment.transcript}
                </pre>
              </details>
            )}
            <div className="flex gap-2 mt-5">
              {appointment.transcript && (
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="flex-1 py-3 rounded-2xl text-[12px] font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                >
                  {regenerating ? "生成中…" : "🔁 もう一度 AI 分析"}
                </button>
              )}
              <Link
                href={`/interview/analysis/?id=${appointment.id}&mode=${mode === "user" ? "company" : "user"}`}
                className="flex-1 py-3 rounded-2xl text-[12px] font-bold text-violet-700 bg-violet-50 border border-violet-100 hover:bg-violet-100 text-center"
              >
                {mode === "user" ? "👔 採用側の評価を見る" : "🌷 候補者へのレポートを見る"}
              </Link>
            </div>
            {error && (
              <p className="text-[11px] text-rose-500 text-center mt-3">
                {error}
              </p>
            )}
          </>
        ) : (
          <NoAnalysis
            appointment={appointment}
            mode={mode}
            regenerating={regenerating}
            onRegenerate={handleRegenerate}
            error={error}
          />
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function NoAnalysis({
  appointment,
  mode,
  regenerating,
  onRegenerate,
  error,
}: {
  appointment: InterviewAppointment;
  mode: "user" | "company";
  regenerating: boolean;
  onRegenerate: () => void;
  error: string | null;
}) {
  const hasTranscript = !!appointment.transcript;
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 text-center">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zM7 5h2v8l-1-.75L7 13V5z" />
        </svg>
      </div>
      <p className="text-sm font-extrabold text-gray-900 mb-1">
        {mode === "user" ? "候補者向け" : "採用担当向け"}のレポートはまだありません
      </p>
      <p className="text-[12px] text-gray-500 mb-5">
        {hasTranscript
          ? "文字起こしから AI 分析を生成できます。"
          : appointment.status === "completed"
            ? "この面接は録画されていなかったため、AI 分析は作成できません。"
            : "面接終了後、自動的に AI 分析が作成されます。"}
      </p>
      {hasTranscript ? (
        <button
          onClick={onRegenerate}
          disabled={regenerating}
          className="inline-block px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[12px] font-extrabold shadow-md shadow-violet-200/50 disabled:opacity-50"
        >
          {regenerating ? "生成中…" : "AI 分析を生成"}
        </button>
      ) : (
        <Link
          href={`/interview/?id=${appointment.id}&mode=${mode}`}
          className="inline-block px-5 py-2.5 rounded-2xl bg-violet-50 text-violet-700 border border-violet-100 text-[12px] font-bold"
        >
          面接ルームを開く
        </Link>
      )}
      {error && (
        <p className="text-[11px] text-rose-500 mt-3">{error}</p>
      )}
    </div>
  );
}
