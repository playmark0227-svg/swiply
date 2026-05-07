"use client";

/**
 * AI analysis report card.
 *
 * Renders an InterviewAnalysis as a friendly, actionable report.
 * Used on /interview/analysis/?id=…&mode=user|company.
 */

import type { InterviewAnalysis } from "@/lib/services/interviews";

interface Props {
  analysis: InterviewAnalysis;
  mode: "user" | "company";
}

export default function InterviewAnalysisCard({ analysis, mode }: Props) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6 space-y-5">
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 ${
            mode === "user"
              ? "bg-gradient-to-br from-violet-500 to-fuchsia-500"
              : "bg-gradient-to-br from-amber-500 to-orange-500"
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2 9.91 8.26 3.5 8.85l4.84 4.21L7.05 19.5 12 16.27l4.95 3.23-1.29-6.44 4.84-4.21-6.41-.59L12 2z" />
          </svg>
        </div>
        <div>
          <p className="text-[10px] tracking-[0.25em] font-bold text-gray-400 uppercase mb-0.5">
            {mode === "user" ? "FOR CANDIDATE" : "FOR HIRING TEAM"}
          </p>
          <h2 className="text-base font-extrabold text-gray-900">
            AI 振り返りレポート
          </h2>
          <p className="text-[11px] text-gray-500">
            {new Date(analysis.generatedAt).toLocaleString("ja-JP", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
            生成
          </p>
        </div>
      </div>

      <Section title="総評">
        <p className="text-[13px] leading-relaxed text-gray-700">
          {analysis.summary}
        </p>
      </Section>

      <Section title={mode === "user" ? "✨ 良かった点" : "✨ 評価ポイント"}>
        <ul className="space-y-1.5">
          {analysis.strengths.map((s, i) => (
            <li
              key={i}
              className="text-[13px] leading-relaxed text-gray-700 pl-4 relative"
            >
              <span className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-emerald-400" />
              {s}
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title={
          mode === "user" ? "🌱 次回までに磨きたい点" : "🔍 確認したいポイント"
        }
      >
        <ul className="space-y-1.5">
          {analysis.improvements.map((s, i) => (
            <li
              key={i}
              className="text-[13px] leading-relaxed text-gray-700 pl-4 relative"
            >
              <span className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-violet-400" />
              {s}
            </li>
          ))}
        </ul>
      </Section>

      <Section title={mode === "user" ? "🎯 おすすめアクション" : "🎯 推奨ネクストステップ"}>
        <p className="text-[13px] leading-relaxed text-gray-700 bg-violet-50 border border-violet-100 rounded-2xl px-4 py-3">
          {analysis.recommendation}
        </p>
      </Section>

      {analysis.warnings && analysis.warnings.length > 0 && (
        <Section title="⚠️ 留意点">
          <ul className="space-y-1.5">
            {analysis.warnings.map((s, i) => (
              <li
                key={i}
                className="text-[12px] leading-relaxed text-amber-800 pl-4 relative"
              >
                <span className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-amber-400" />
                {s}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] font-extrabold text-gray-500 mb-1.5 tracking-wide">
        {title}
      </p>
      {children}
    </div>
  );
}
