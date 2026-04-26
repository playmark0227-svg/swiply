"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo";
import type { Job } from "@/types/job";
import {
  type Application,
  submitApplication,
  getApplicationByJobId,
  STATUS_LABEL,
  STATUS_TONE,
} from "@/lib/services/applications";
import { getProfile } from "@/lib/services/profile";
import type { UserProfile } from "@/types/profile";
import { useToast } from "./Toast";
import { haptic } from "@/lib/haptic";

interface Props {
  job: Job | null;
  open: boolean;
  onClose: () => void;
  onSubmitted?: (app: Application) => void;
}

export default function ApplyModal({ job, open, onClose, onSubmitted }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<Application | null>(null);
  const [existing, setExisting] = useState<Application | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!open || !job) return;
    setDone(null);
    setMessage("");
    getProfile().then(setProfile);
    getApplicationByJobId(job.id).then((a) => setExisting(a ?? null));
  }, [open, job]);

  const incomplete = !profile?.name || !profile?.location;

  async function handleSubmit() {
    if (!job) return;
    haptic("success");
    setSubmitting(true);
    try {
      const app = await submitApplication({
        jobId: job.id,
        jobTitle: job.title,
        jobCompany: job.company,
        jobImage: job.image,
        message: message.trim() || `${job.title}に興味があります。ぜひお話を伺いたいです。`,
      });
      setDone(app);
      onSubmitted?.(app);
      toast.show("応募を完了しました", "success");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && job && (
        <>
          <motion.button
            type="button"
            aria-label="閉じる"
            className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[120]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-label="応募する"
            className="fixed inset-x-0 bottom-0 md:inset-0 md:m-auto md:max-w-xl md:max-h-[88dvh] md:rounded-3xl rounded-t-3xl bg-white z-[121] shadow-2xl overflow-hidden flex flex-col"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
          >
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Logo size={22} radius={6} />
                <h2 className="text-sm font-extrabold text-gray-900">
                  {done ? "応募が完了しました" : "応募内容の確認"}
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="閉じる"
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {/* Job summary */}
              <div className="flex gap-3 p-3 rounded-2xl bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={job.image}
                  alt={job.company}
                  className="w-14 h-14 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-gray-400 truncate">{job.company}</p>
                  <p className="text-sm font-extrabold text-gray-900 truncate">{job.title}</p>
                  <p className="text-[11px] font-bold text-emerald-600 mt-0.5">{job.salary}</p>
                </div>
              </div>

              {existing && !done && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-700">
                  この求人にはすでに応募済みです（ステータス:{" "}
                  <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-bold ${STATUS_TONE[existing.status]}`}>
                    {STATUS_LABEL[existing.status]}
                  </span>）。再応募すると上書きされます。
                </div>
              )}

              {!done && profile && profile.kyc.status !== "verified" && (
                <a
                  href="/verify"
                  className="block rounded-2xl border border-violet-200 bg-violet-50/60 p-3 text-[12px] text-violet-700 hover:bg-violet-100 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-violet-200 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-violet-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold">本人確認が未完了です</p>
                      <p className="text-[11px] opacity-90">
                        確認済みのユーザーは選考通過率が約2.3倍。今すぐ確認 →
                      </p>
                    </div>
                  </div>
                </a>
              )}

              {!done && (
                <>
                  {/* Profile preview */}
                  <div>
                    <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-2">
                      プロフィール情報
                    </p>
                    {incomplete ? (
                      <div className="rounded-2xl bg-rose-50 border border-rose-100 p-3 text-[12px] text-rose-600">
                        プロフィール（名前・居住地）が未入力です。マイページから入力すると応募がスムーズになります。
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-gray-100 p-3 text-[12px] text-gray-700 space-y-1">
                        <Row label="名前" value={profile!.name} />
                        {profile!.age && <Row label="年齢" value={`${profile!.age}歳`} />}
                        <Row label="居住地" value={profile!.location} />
                        {profile!.skills.length > 0 && (
                          <Row label="スキル" value={profile!.skills.slice(0, 6).join(" / ")} />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-2">
                      自己PR・志望動機（任意）
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="例）週3日から始めたいです。学生時代にカフェでホールを担当していました。"
                      rows={5}
                      className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 resize-none focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all placeholder:text-gray-300"
                    />
                    <p className="text-[10px] text-gray-300 mt-1 text-right">
                      {message.length} / 500
                    </p>
                  </div>
                </>
              )}

              {done && (
                <div className="text-center py-4">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                    <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-extrabold text-gray-900">応募が完了しました</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    企業からの返信があり次第、お知らせでお伝えします。<br />
                    応募管理ページからもいつでも確認できます。
                  </p>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-gray-100">
              {done ? (
                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    className="flex-1 h-11 rounded-2xl bg-gray-100 text-gray-700 font-bold"
                  >
                    閉じる
                  </button>
                  <a
                    href="/applications"
                    className="flex-1 h-11 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-extrabold shadow-md flex items-center justify-center"
                  >
                    応募状況を見る
                  </a>
                </div>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-extrabold shadow-lg shadow-violet-200/50 active:scale-[0.98] disabled:opacity-60 transition"
                >
                  {submitting ? "送信中…" : "この内容で応募する"}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-400 shrink-0">{label}</span>
      <span className="font-bold text-right">{value}</span>
    </div>
  );
}
