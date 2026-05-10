"use client";

/**
 * Trust + speed badges shown on job cards, job detail, and message
 * threads. Three flavors:
 *
 *   - VerificationBadge  : SWIPLY 確認済み (item #1 from岡崎 review)
 *   - FoundingBadge      : ⭐FOUNDING (item #10)
 *   - InstantInterviewBadge : 🔥 今日・明日面接OK (item #10)
 *
 * Each can render in two sizes: "sm" (inline within card chips) and
 * "md" (standalone, with optional click-to-explain modal).
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { VerificationDetails } from "@/types/job";

type Size = "sm" | "md";

// ─── Verification ─────────────────────────────────────────────────────

interface VerificationBadgeProps {
  details?: VerificationDetails;
  size?: Size;
  /** When true, tapping opens a modal with the full审查 items. */
  interactive?: boolean;
  className?: string;
}

export function VerificationBadge({
  details,
  size = "sm",
  interactive = false,
  className = "",
}: VerificationBadgeProps) {
  const [open, setOpen] = useState(false);
  if (!details) return null;
  const base =
    "inline-flex items-center gap-1 font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full";
  const sizing =
    size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2.5 py-1 text-[11px]";
  const icon = (
    <svg
      className={size === "sm" ? "w-2.5 h-2.5" : "w-3.5 h-3.5"}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path d="M12 2l2.39 4.84L20 8l-4 3.9.94 5.5L12 14.77 7.06 17.4 8 11.9 4 8l5.61-1.16L12 2zm0 5L9.95 11l-4.5.66 3.27 3.18-.78 4.51L12 16.83l4.06 2.52-.78-4.51L18.55 11.66 14.05 11 12 7z" />
    </svg>
  );
  if (!interactive) {
    return (
      <span className={`${base} ${sizing} ${className}`} title="SWIPLY確認済み">
        {icon}
        <span>確認済み</span>
      </span>
    );
  }
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={`${base} ${sizing} ${className} hover:bg-emerald-100 transition`}
        aria-label="SWIPLY確認済みの詳細を見る"
      >
        {icon}
        <span>SWIPLY確認済み</span>
      </button>
      <VerificationDetailsModal
        open={open}
        onClose={() => setOpen(false)}
        details={details}
      />
    </>
  );
}

function VerificationDetailsModal({
  open,
  onClose,
  details,
}: {
  open: boolean;
  onClose: () => void;
  details: VerificationDetails;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="bd"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center px-4"
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
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l2.39 4.84L20 8l-4 3.9.94 5.5L12 14.77 7.06 17.4 8 11.9 4 8l5.61-1.16L12 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900">
                  SWIPLY確認済み
                </h3>
                <p className="text-[11px] text-gray-500">
                  {new Date(details.verifiedAt).toLocaleDateString("ja-JP")} 認定
                  {details.reviewedAt && details.reviewedAt !== details.verifiedAt && (
                    <>
                      {" / "}
                      {new Date(details.reviewedAt).toLocaleDateString("ja-JP")} 再確認
                    </>
                  )}
                </p>
              </div>
            </div>
            <p className="text-[12px] text-gray-700 leading-relaxed mb-3">
              下記の項目について、SWIPLY運営による独自審査を通過した企業です。
              審査は<span className="font-bold text-emerald-700">毎年再確認</span>
              されます。
            </p>
            <ul className="space-y-1.5">
              {details.items.map((it, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-[12px] text-gray-700"
                >
                  <svg
                    className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={onClose}
              className="mt-5 w-full py-3 rounded-2xl text-sm font-extrabold text-white bg-gradient-to-r from-emerald-500 to-teal-500 active:scale-[0.98] transition"
            >
              閉じる
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Founding ────────────────────────────────────────────────────────

export function FoundingBadge({
  size = "sm",
  className = "",
}: {
  size?: Size;
  className?: string;
}) {
  const sizing =
    size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2.5 py-1 text-[11px]";
  return (
    <span
      className={`inline-flex items-center gap-1 font-black tracking-wide rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 text-amber-950 border border-amber-300 ${sizing} ${className}`}
      title="ファウンディングメンバー（最初の100社限定）"
    >
      <span aria-hidden>⭐</span>
      <span>FOUNDING</span>
    </span>
  );
}

// ─── Instant interview ──────────────────────────────────────────────

export function InstantInterviewBadge({
  size = "sm",
  className = "",
}: {
  size?: Size;
  className?: string;
}) {
  const sizing =
    size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2.5 py-1 text-[11px]";
  return (
    <span
      className={`inline-flex items-center gap-1 font-extrabold rounded-full bg-rose-50 border border-rose-200 text-rose-700 ${sizing} ${className}`}
      title="今日または明日中に面接日程を確定する企業です"
    >
      <span aria-hidden>🔥</span>
      <span>今日明日面接OK</span>
    </span>
  );
}

// ─── Convenience: stack badges ──────────────────────────────────────

interface TrustBadgeRowProps {
  job: {
    verified?: boolean;
    verification?: VerificationDetails;
    founding?: boolean;
    instantInterview?: boolean;
  };
  size?: Size;
  /** When true, the verification badge opens its details modal on tap. */
  interactive?: boolean;
  className?: string;
}

export function TrustBadgeRow({
  job,
  size = "sm",
  interactive = false,
  className = "",
}: TrustBadgeRowProps) {
  const has = !!(job.verified || job.founding || job.instantInterview);
  if (!has) return null;
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {job.verified && (
        <VerificationBadge
          details={job.verification}
          size={size}
          interactive={interactive}
        />
      )}
      {job.founding && <FoundingBadge size={size} />}
      {job.instantInterview && <InstantInterviewBadge size={size} />}
    </div>
  );
}
