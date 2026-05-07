"use client";

/**
 * Booking modal — picks date/time/duration for a video interview.
 *
 * Hosted from the message thread view. On submit it calls
 * `createInterview` (which writes to localStorage, appends a system
 * message, and best-effort-pings LINE) and closes itself.
 *
 * The parent conditionally mounts this component (`{open && <…/>}`),
 * so initial state is always fresh on each open — no reset effect.
 */

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  createInterview,
  type CreateInterviewInput,
  type InterviewAppointment,
} from "@/lib/services/interviews";
import { haptic } from "@/lib/haptic";

interface Props {
  onClose: () => void;
  onCreated?: (appointment: InterviewAppointment) => void;
  match: {
    id: string;
    jobId: string;
    jobTitle: string;
    jobCompany: string;
    jobImage: string;
  };
}

const DURATIONS = [15, 30, 45, 60];

export default function InterviewBookingModal({
  onClose,
  onCreated,
  match,
}: Props) {
  const [date, setDate] = useState(() => buildDefaultDateTime().date);
  const [time, setTime] = useState(() => buildDefaultDateTime().time);
  const [duration, setDuration] = useState(30);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // "now" snapshot for validation — refreshed once a minute so the
  // validity check is render-pure (no Date.now() during render).
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const tick = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(tick);
  }, []);

  // Memoize the validity check so it's a pure derivation of state.
  const scheduledAt = useMemo(
    () => new Date(`${date}T${time}:00`).toISOString(),
    [date, time]
  );
  const valid = useMemo(() => {
    const at = Date.parse(scheduledAt);
    if (Number.isNaN(at)) return false;
    return at > nowMs - 5 * 60 * 1000; // allow 5min slack
  }, [scheduledAt, nowMs]);

  function handleSubmit() {
    if (!valid || submitting) return;
    setSubmitting(true);
    haptic("success");
    const input: CreateInterviewInput = {
      matchId: match.id,
      jobId: match.jobId,
      jobTitle: match.jobTitle,
      jobCompany: match.jobCompany,
      jobImage: match.jobImage,
      scheduledAt,
      durationMinutes: duration,
      title: title.trim() || undefined,
      notes: notes.trim() || undefined,
    };
    const appt = createInterview(input);
    onCreated?.(appt);
    onClose();
  }

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center"
      >
        <motion.div
          key="sheet"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-md mx-auto md:my-12 max-h-[92dvh] overflow-y-auto"
        >
          {/* Header */}
          <div className="px-5 pt-5 pb-3 flex items-start gap-3 border-b border-gray-100">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-extrabold text-gray-900">
                ビデオ面接を予約
              </h2>
              <p className="text-[12px] text-gray-500 truncate">
                {match.jobCompany} ・ {match.jobTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="閉じる"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-5 space-y-4">
            <Field label="日付">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </Field>
            <Field label="開始時刻">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </Field>
            <Field label="所要時間">
              <div className="grid grid-cols-4 gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={`py-2.5 rounded-xl text-sm font-bold transition ${
                      duration === d
                        ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-200/60"
                        : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-violet-300"
                    }`}
                  >
                    {d}分
                  </button>
                ))}
              </div>
            </Field>
            <Field label="議題（任意）">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={60}
                placeholder="一次面接 / カジュアル面談 など"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </Field>
            <Field label="メモ（任意）">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={400}
                placeholder="参加者のお名前や事前資料の共有など"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none"
              />
            </Field>

            <div className="bg-violet-50 border border-violet-100 rounded-2xl px-3.5 py-3 text-[11px] leading-relaxed text-violet-800">
              📹 当日は SWIPLY のメッセージ画面から参加できます。録画と AI 振り返りは任意です（参加時に同意を確認します）。
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-3 flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl text-sm font-bold text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100"
            >
              キャンセル
            </button>
            <button
              onClick={handleSubmit}
              disabled={!valid || submitting}
              className="flex-1 py-3 rounded-2xl text-sm font-extrabold text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-md shadow-violet-200/60 disabled:opacity-40 active:scale-95 transition"
            >
              {submitting ? "予約中…" : "予約する"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
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

function buildDefaultDateTime(): { date: string; time: string } {
  // Default: tomorrow at 14:00 local
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(14, 0, 0, 0);
  const yyyy = d.getFullYear();
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  const hh = d.getHours().toString().padStart(2, "0");
  const mi = d.getMinutes().toString().padStart(2, "0");
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${mi}` };
}
