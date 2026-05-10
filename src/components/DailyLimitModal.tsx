"use client";

/**
 * Modal shown when the candidate hits the daily LIKE quota.
 *
 * Tone-wise, this is the opposite of an error — it frames the limit
 * as a feature ("本気の応募だけが残る理由") rather than a punishment.
 */

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { LIKE_DAILY_LIMIT } from "@/lib/services/dailyLimits";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function DailyLimitModal({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="bd"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] bg-black/55 backdrop-blur-sm flex items-end md:items-center justify-center px-4"
        >
          <motion.div
            key="m"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-3xl md:rounded-3xl w-full max-w-md p-6"
          >
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center mb-4">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
              </svg>
            </div>
            <h2 className="text-base font-extrabold text-gray-900 text-center mb-2">
              今日の LIKE は使い切りました
            </h2>
            <p className="text-[12px] text-gray-600 text-center leading-relaxed mb-4">
              SWIPLYは1日<span className="font-extrabold text-violet-600">{LIKE_DAILY_LIMIT}件まで</span>
              しか LIKE できません。
              「気軽に押せない」からこそ、企業側もちゃんと向き合ってくれる
              ＝ 本気の応募だけが残る仕組みです。
            </p>
            <div className="bg-violet-50 border border-violet-100 rounded-2xl px-4 py-3 mb-5 text-[11px] text-violet-800 leading-relaxed">
              <p className="font-bold mb-1">💡 続きをやるなら</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>明日の朝にリセット（日本時間 0:00）</li>
                <li>今日 LIKE した求人にメッセージで動こう</li>
                <li>気になる求人をブックマークしておこう</li>
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="/messages"
                onClick={onClose}
                className="block w-full py-3 rounded-2xl text-center text-sm font-extrabold text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 active:scale-[0.98] transition"
              >
                メッセージを開く
              </Link>
              <Link
                href="/likes"
                onClick={onClose}
                className="block w-full py-3 rounded-2xl text-center text-sm font-bold text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100"
              >
                今日 LIKE した求人を見る
              </Link>
              <button
                onClick={onClose}
                className="text-[11px] text-gray-400 mt-2 hover:text-gray-600"
              >
                閉じる
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
