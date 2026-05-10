"use client";

/**
 * Penalty badges (yellow / red cards) shown on threads, profile,
 * and the swipe deck "you're suspended" banner.
 */

import Link from "next/link";
import { type CardLevel, type PenaltyState } from "@/lib/services/penalties";

export function NoShowBadge({
  level,
  count,
  size = "sm",
  className = "",
}: {
  level: CardLevel;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  if (level === "green") return null;
  const sizing =
    size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[11px]";
  if (level === "yellow") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full font-extrabold bg-amber-50 border border-amber-200 text-amber-700 ${sizing} ${className}`}
        title="ブッチ歴1回 — 次は1年停止"
      >
        <span aria-hidden>⚠️</span>
        <span>ブッチ歴{count ?? 1}回</span>
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-extrabold bg-rose-50 border border-rose-200 text-rose-700 ${sizing} ${className}`}
      title="アカウント停止中"
    >
      <span aria-hidden>🚫</span>
      <span>停止中</span>
    </span>
  );
}

/**
 * Full-screen lock when the candidate has hit the red card. Shown
 * by pages that mutate state (swipe, interview join). Read-only
 * pages (likes, messages) stay accessible so the user can wrap up
 * existing conversations.
 */
export function SuspendedScreen({ penalty }: { penalty: PenaltyState }) {
  return (
    <div className="min-h-dvh bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 text-white flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.41 0 8 3.59 8 8 0 1.85-.63 3.55-1.69 4.9z" />
          </svg>
        </div>
        <h1 className="text-base font-extrabold text-gray-900 mb-2">
          アカウント停止中です
        </h1>
        <p className="text-[12px] text-gray-600 leading-relaxed mb-4">
          面接ブッチが
          <span className="font-extrabold text-rose-600">{penalty.count}回</span>
          記録されたため、SWIPLY のスワイプ・面接参加は
          <span className="font-extrabold">1年間</span>
          停止されています。
        </p>
        {penalty.suspendedUntil && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3 mb-5 text-[11px] text-rose-800">
            停止解除予定：
            <span className="font-extrabold">
              {new Date(penalty.suspendedUntil).toLocaleDateString("ja-JP")}
            </span>
          </div>
        )}
        <p className="text-[11px] text-gray-500 leading-relaxed mb-5">
          採用担当者の時間も SWIPLY の信頼性も、ブッチによって損なわれます。
          相手の事情を考慮した行動を、次回からお願いします。
        </p>
        <Link
          href="/messages"
          className="block w-full py-3 rounded-2xl text-sm font-bold text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100"
        >
          進行中のメッセージを見る
        </Link>
      </div>
    </div>
  );
}
