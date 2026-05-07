"use client";

/**
 * Recording-consent gate.
 *
 * Shown when a candidate joins an interview room. Two buttons:
 *   - 同意して開始(録画ON) → consent: true
 *   - 録画なしで開始     → consent: false
 *
 * The room handles the actual MediaRecorder lifecycle; this component
 * is purely the consent UI.
 */

import { motion, AnimatePresence } from "framer-motion";

interface Props {
  open: boolean;
  onConsent: () => void;
  onDecline: () => void;
  onCancel: () => void;
  jobCompany: string;
  jobTitle: string;
}

export default function InterviewConsentDialog({
  open,
  onConsent,
  onDecline,
  onCancel,
  jobCompany,
  jobTitle,
}: Props) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] bg-black/55 backdrop-blur-sm flex items-center justify-center px-4"
      >
        <motion.div
          key="card"
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl"
        >
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15A.998.998 0 0 0 6.09 11c-.61 0-1.09.54-1 1.14.49 3 2.89 5.34 5.91 5.78V21h2v-3.08c3.02-.44 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
            </svg>
          </div>
          <h2 className="text-center text-base font-extrabold text-gray-900 mb-1">
            ビデオ面接へ参加
          </h2>
          <p className="text-center text-[12px] text-gray-500 mb-4">
            {jobCompany} ・ {jobTitle}
          </p>

          <div className="bg-violet-50 border border-violet-100 rounded-2xl px-4 py-3.5 text-[12px] leading-relaxed text-gray-700 mb-4">
            <p className="font-bold text-violet-800 mb-1.5">録画と AI 振り返りについて</p>
            <ul className="list-disc list-inside space-y-1">
              <li>音声を端末内で録音し、終了時に SWIPLY サーバーへ送信します</li>
              <li>OpenAI Whisper で文字起こし、Claude で振り返りレポートを作成</li>
              <li>30 日後に録音・文字起こし・レポートは自動的に削除</li>
              <li>同意せずに参加することもできます（その場合は文字起こし・AI 評価なし）</li>
            </ul>
          </div>

          <div className="space-y-2">
            <button
              onClick={onConsent}
              className="w-full py-3 rounded-2xl text-sm font-extrabold text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-md shadow-violet-200/60 active:scale-[0.98] transition"
            >
              同意して開始(録画ON)
            </button>
            <button
              onClick={onDecline}
              className="w-full py-3 rounded-2xl text-sm font-bold text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100"
            >
              録画なしで参加
            </button>
            <button
              onClick={onCancel}
              className="w-full py-2 text-[12px] text-gray-500 hover:text-gray-700"
            >
              キャンセル
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
