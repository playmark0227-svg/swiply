"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { getJobById } from "@/lib/services/jobs";
import { addLike, isLiked, removeLike } from "@/lib/services/likes";
import { Job } from "@/types/job";
import { useToast } from "@/components/Toast";
import { haptic } from "@/lib/haptic";

export default function ClientJobDetailPage({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [liked, setLiked] = useState(false);
  const [burst, setBurst] = useState(0);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      const found = await getJobById(jobId);
      if (found) {
        setJob(found);
        setLiked(await isLiked(jobId));
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
      title: `${job.title} - Warp`,
      text: `${job.company}の求人をチェック`,
      url,
    };
    haptic("tick");
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // user cancelled — fall through to copy
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

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Hero image */}
      <div className="relative h-72 bg-gray-200">
        <Image
          src={job.image}
          alt={job.company}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />

        {/* Back button */}
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

        {/* Share button */}
        <button
          onClick={handleShare}
          aria-label="共有"
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-xl bg-black/30 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 6l-4-4m0 0L8 6m4-4v12" />
          </svg>
        </button>

        {/* Employment type badge */}
        <div className="absolute top-16 right-4 z-10">
          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-white/90 backdrop-blur-sm text-gray-800 shadow-sm">
            {job.employmentType}
          </span>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <p className="text-xs font-semibold text-amber-300 mb-1">
            {job.catchphrase}
          </p>
          <h1 className="text-2xl font-extrabold leading-tight">{job.title}</h1>
          <p className="text-sm text-white/70 font-medium mt-0.5">{job.company}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto -mt-1 rounded-t-3xl bg-white relative z-10">
        <div className="px-5 pt-5 pb-28 space-y-5">
          {/* Key info */}
          <div className="grid grid-cols-2 gap-2">
            <InfoCard
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />}
              label="給与"
              value={job.salary}
              highlight
            />
            <InfoCard
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />}
              label="勤務地"
              value={job.location}
            />
            <InfoCard
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
              label="勤務時間"
              value={job.workHours}
            />
            <InfoCard
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />}
              label="勤務日数"
              value={job.minDays}
            />
            <InfoCard
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />}
              label="アクセス"
              value={job.access}
            />
            <InfoCard
              icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />}
              label="経験"
              value={job.experience}
            />
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
              {job.benefits.map((benefit) => (
                <span key={benefit} className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-medium">
                  {benefit}
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
        </div>
      </div>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100/50 px-5 py-3 z-50">
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
            {/* Heart burst particles */}
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
            onClick={() => {
              haptic("success");
              toast.show("応募フォームは準備中です", "info");
            }}
            className="flex-1 h-12 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold rounded-2xl shadow-lg shadow-violet-200/50 active:scale-[0.98] transition-all"
          >
            応募する
          </button>
        </div>
      </div>
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
    <div className={`rounded-2xl p-3 ${highlight ? "bg-emerald-50/80 border border-emerald-100" : "bg-gray-50/80 border border-gray-100"}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <svg className={`w-3 h-3 ${highlight ? "text-emerald-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icon}
        </svg>
        <p className="text-[10px] text-gray-400 font-medium">{label}</p>
      </div>
      <p className={`text-xs font-bold leading-snug ${highlight ? "text-emerald-700" : "text-gray-800"}`}>{value}</p>
    </div>
  );
}
