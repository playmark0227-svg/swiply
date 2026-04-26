"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { getAllJobs, getJobById } from "@/lib/services/jobs";
import { addLike, isLiked, removeLike } from "@/lib/services/likes";
import {
  type Application,
  getApplicationByJobId,
  STATUS_LABEL,
  STATUS_TONE,
} from "@/lib/services/applications";
import { findSimilar } from "@/lib/services/recommendations";
import { pushRecentlyViewed } from "@/lib/services/recentlyViewed";
import { isNew } from "@/lib/services/search";
import ApplyModal from "@/components/ApplyModal";
import JobListCard from "@/components/JobListCard";
import { Job } from "@/types/job";
import { useToast } from "@/components/Toast";
import { haptic } from "@/lib/haptic";

export default function ClientJobDetailPage({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [liked, setLiked] = useState(false);
  const [burst, setBurst] = useState(0);
  const [applyOpen, setApplyOpen] = useState(false);
  const [application, setApplication] = useState<Application | null>(null);
  const [similar, setSimilar] = useState<Job[]>([]);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      const found = await getJobById(jobId);
      if (found) {
        setJob(found);
        setLiked(await isLiked(jobId));
        const all = await getAllJobs();
        setSimilar(findSimilar(all, found, 4));
        const a = await getApplicationByJobId(jobId);
        setApplication(a ?? null);
        pushRecentlyViewed(jobId);
      }
    })();
  }, [jobId]);

  if (!job) {
    return (
      <div className="flex items-center justify-center h-dvh bg-white">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  async function toggleLike() {
    if (!job) return;
    if (liked) {
      setLiked(false);
      haptic("soft");
      await removeLike(job.id);
      toast.show("LIKEを取り消しました", "info");
    } else {
      setLiked(true);
      setBurst((b) => b + 1);
      haptic("success");
      await addLike(job.id);
      toast.show("LIKEしました", "success");
    }
  }

  async function handleShare() {
    if (!job) return;
    const url = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: `${job.title} - SWIPLY`,
      text: `${job.company}の求人をチェック`,
      url,
    };
    haptic("tick");
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        /* user cancelled */
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        toast.show("リンクをコピーしました", "success");
      } catch {
        toast.show("共有できませんでした", "error");
      }
    }
  }

  function openApply() {
    haptic("tick");
    setApplyOpen(true);
  }

  const fresh = isNew(job, 3);
  const mapQuery = encodeURIComponent(job.location);

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Hero image */}
      <div className="relative h-72 md:h-[420px] bg-gray-200">
        <Image
          src={job.image}
          alt={job.company}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />

        <button
          onClick={() => {
            haptic("tick");
            router.back();
          }}
          aria-label="戻る"
          className="absolute top-4 left-4 z-10 w-10 h-10 rounded-xl bg-black/30 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={handleShare}
          aria-label="共有"
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-xl bg-black/30 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 6l-4-4m0 0L8 6m4-4v12" />
          </svg>
        </button>

        {/* Right-side stack of badges */}
        <div className="absolute top-16 right-4 z-10 flex flex-col gap-1.5 items-end">
          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-white/90 backdrop-blur-sm text-gray-800 shadow-sm">
            {job.employmentType}
          </span>
          {job.urgent && (
            <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-rose-500 text-white shadow-sm">急募</span>
          )}
          {fresh && !job.urgent && (
            <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-500 text-white shadow-sm">新着</span>
          )}
          {job.remoteOk && (
            <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-violet-500 text-white shadow-sm">リモートOK</span>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-10 text-white">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs md:text-sm font-semibold text-amber-300 mb-1">{job.catchphrase}</p>
            <h1 className="text-2xl md:text-4xl font-extrabold leading-tight">{job.title}</h1>
            <p className="text-sm md:text-base text-white/70 font-medium mt-0.5 md:mt-1">{job.company}</p>

            <div className="flex items-center gap-3 mt-3 text-[11px] md:text-xs text-white/70">
              {typeof job.applicants === "number" && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.7 0 8 1.34 8 4v2H4v-2c0-2.66 5.3-4 8-4zm0-2a4 4 0 100-8 4 4 0 000 8z" /></svg>
                  今週{job.applicants}人が応募
                </span>
              )}
              {typeof job.views === "number" && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {job.views.toLocaleString()} views
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg md:max-w-5xl mx-auto -mt-1 rounded-t-3xl bg-white relative z-10">
        <div className="px-5 md:px-10 pt-5 md:pt-8 pb-28 md:pb-32 space-y-5 md:space-y-0 md:grid md:grid-cols-[1fr_320px] md:gap-10">
          {/* Primary */}
          <div className="space-y-5 md:space-y-8 min-w-0">
            {application && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-violet-50 border border-violet-100">
                <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${STATUS_TONE[application.status]}`}>
                  {STATUS_LABEL[application.status]}
                </span>
                <p className="text-[12px] text-violet-700 font-bold">
                  この求人にはすでに応募済み
                </p>
                <Link
                  href="/applications"
                  className="ml-auto text-[11px] font-bold text-violet-600 underline underline-offset-2"
                >
                  応募管理へ
                </Link>
              </div>
            )}

            {/* Key info */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
              <InfoCard icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />} label="給与" value={job.salary} highlight />
              <InfoCard icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />} label="勤務地" value={job.location} />
              <InfoCard icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />} label="勤務時間" value={job.workHours} />
              <InfoCard icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />} label="勤務日数" value={job.minDays} />
              <InfoCard icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />} label="アクセス" value={job.access} />
              <InfoCard icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />} label="経験" value={job.experience} />
            </div>

            <section>
              <SectionTitle>仕事内容</SectionTitle>
              <p className="text-sm text-gray-600 leading-relaxed">{job.description}</p>
            </section>

            <section>
              <SectionTitle>応募条件</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {job.requirements.map((req) => (
                  <span key={req} className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium text-gray-600">
                    {req}
                  </span>
                ))}
              </div>
            </section>

            <section>
              <SectionTitle>待遇・メリット</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {job.benefits.map((b) => (
                  <span key={b} className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-medium">
                    {b}
                  </span>
                ))}
              </div>
            </section>

            <section>
              <SectionTitle>特徴タグ</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {job.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1.5 bg-violet-50 border border-violet-100 text-violet-700 rounded-xl text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </section>

            {/* Map */}
            <section>
              <SectionTitle>勤務地マップ</SectionTitle>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative aspect-[16/8] rounded-2xl overflow-hidden border border-gray-100 group"
              >
                {/* Static placeholder (avoids leaking system info / API keys per privacy rules) */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#e0e7ff,#fce7f3_50%,#fef3c7)]" />
                <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(45deg,#fff_25%,transparent_25%,transparent_75%,#fff_75%,#fff),linear-gradient(45deg,#fff_25%,transparent_25%,transparent_75%,#fff_75%,#fff)] [background-size:24px_24px] [background-position:0_0,12px_12px]" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700 group-hover:scale-105 transition-transform">
                  <svg className="w-7 h-7 text-rose-500 drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                  </svg>
                  <p className="text-sm font-extrabold mt-2">{job.location}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{job.access}</p>
                </div>
                <div className="absolute bottom-3 right-3 bg-white/95 px-2 py-1 rounded-lg text-[10px] font-bold text-gray-700 shadow-sm">
                  Google マップで開く →
                </div>
              </a>
            </section>

            {/* Company info */}
            {job.companyDescription && (
              <section>
                <SectionTitle>企業について</SectionTitle>
                <div className="rounded-2xl border border-gray-100 p-4">
                  <p className="font-bold text-gray-900 text-sm">{job.company}</p>
                  <p className="text-xs text-gray-500 leading-relaxed mt-1.5">{job.companyDescription}</p>
                </div>
              </section>
            )}

            {/* Q&A */}
            {job.qa && job.qa.length > 0 && (
              <section>
                <SectionTitle>よくある質問</SectionTitle>
                <div className="space-y-2">
                  {job.qa.map((item, i) => (
                    <details key={i} className="rounded-2xl border border-gray-100 bg-white group">
                      <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-2 font-bold text-sm text-gray-800">
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-[11px] font-bold">Q</span>
                          {item.q}
                        </span>
                        <svg className="w-4 h-4 text-gray-300 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="px-4 pb-4 -mt-1 text-[13px] text-gray-600 leading-relaxed flex gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[11px] font-bold shrink-0">A</span>
                        {item.a}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* Similar jobs */}
            {similar.length > 0 && (
              <section>
                <SectionTitle>似ている求人</SectionTitle>
                <div className="grid grid-cols-2 gap-2.5 md:gap-4">
                  {similar.map((s) => (
                    <JobListCard key={s.id} job={s} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Desktop sticky sidebar */}
          <aside className="hidden md:block">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
                <p className="text-[11px] text-gray-400 font-medium mb-1">給与</p>
                <p className="text-xl font-black text-emerald-600 mb-4">{job.salary}</p>
                <div className="space-y-2 text-sm">
                  <SidebarRow label="勤務地" value={job.location} />
                  <SidebarRow label="勤務時間" value={job.workHours} />
                  <SidebarRow label="勤務日数" value={job.minDays} />
                  <SidebarRow label="アクセス" value={job.access} />
                </div>
                <button
                  onClick={openApply}
                  className="mt-5 w-full h-11 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold rounded-2xl shadow-lg shadow-violet-200/50 active:scale-[0.98] hover:shadow-xl hover:shadow-violet-300/60 transition-all"
                >
                  {application ? "再応募する" : "この求人に応募する"}
                </button>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={toggleLike}
                    aria-label={liked ? "LIKEを取り消す" : "LIKE"}
                    className={`flex-1 h-10 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition ${
                      liked
                        ? "bg-pink-50 text-pink-600 border border-pink-200"
                        : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-pink-50 hover:text-pink-500 hover:border-pink-200"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    {liked ? "LIKE済み" : "LIKE"}
                  </button>
                  <button
                    onClick={handleShare}
                    aria-label="共有"
                    className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 flex items-center justify-center transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 6l-4-4m0 0L8 6m4-4v12" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 text-center">
                キーボードの ← → でも LIKE/スキップ できます
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile-only fixed bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100/50 px-5 py-3 z-50">
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            onClick={toggleLike}
            aria-label={liked ? "LIKEを取り消す" : "LIKE"}
            className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${
              liked
                ? "bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-200/50"
                : "bg-gray-100 text-gray-400 hover:text-pink-400"
            }`}
          >
            <AnimatePresence>
              {burst > 0 && (
                <motion.span
                  key={burst}
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  {[0, 1, 2, 3, 4, 5].map((i) => {
                    const angle = (i / 6) * Math.PI * 2;
                    const dx = Math.cos(angle) * 28;
                    const dy = Math.sin(angle) * 28;
                    return (
                      <motion.span
                        key={i}
                        className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-pink-400"
                        initial={{ x: -3, y: -3, opacity: 1, scale: 0.5 }}
                        animate={{ x: dx - 3, y: dy - 3, opacity: 0, scale: 1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    );
                  })}
                </motion.span>
              )}
            </AnimatePresence>
            <motion.svg
              key={liked ? "on" : "off"}
              className="w-5 h-5 relative"
              fill="currentColor"
              viewBox="0 0 24 24"
              initial={{ scale: liked ? 0.6 : 1 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </motion.svg>
          </button>
          <button
            onClick={openApply}
            className="flex-1 h-12 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold rounded-2xl shadow-lg shadow-violet-200/50 active:scale-[0.98] transition-all"
          >
            {application ? "再応募する" : "応募する"}
          </button>
        </div>
      </div>

      <ApplyModal
        job={job}
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        onSubmitted={(a) => setApplication(a)}
      />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-extrabold text-gray-900 mb-2.5 flex items-center gap-2">
      <div className="w-1 h-4 rounded-full bg-gradient-to-b from-violet-500 to-fuchsia-500" />
      {children}
    </h2>
  );
}

function InfoCard({ icon, label, value, highlight }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-3 md:p-4 ${highlight ? "bg-emerald-50/80 border border-emerald-100" : "bg-gray-50/80 border border-gray-100"}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <svg className={`w-3 h-3 md:w-4 md:h-4 ${highlight ? "text-emerald-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icon}
        </svg>
        <p className="text-[10px] md:text-[11px] text-gray-400 font-medium">{label}</p>
      </div>
      <p className={`text-xs md:text-sm font-bold leading-snug ${highlight ? "text-emerald-700" : "text-gray-800"}`}>{value}</p>
    </div>
  );
}

function SidebarRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-3 py-1 border-b border-gray-100 last:border-0">
      <span className="text-[11px] text-gray-400 font-medium shrink-0">{label}</span>
      <span className="text-[12px] font-semibold text-gray-800 text-right">{value}</span>
    </div>
  );
}
