"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import { getLikedJobIds, removeLike } from "@/lib/services/likes";
import { getAllJobs } from "@/lib/services/jobs";
import { Job } from "@/types/job";
import { useToast } from "@/components/Toast";
import { haptic } from "@/lib/haptic";

export default function LikesPage() {
  const [likedJobs, setLikedJobs] = useState<Job[]>([]);
  const [loaded, setLoaded] = useState(false);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      const [likedIds, allJobs] = await Promise.all([getLikedJobIds(), getAllJobs()]);
      setLikedJobs(allJobs.filter((job) => likedIds.includes(job.id)));
      setLoaded(true);
    })();
  }, []);

  async function handleRemove(jobId: string) {
    haptic("soft");
    await removeLike(jobId);
    setLikedJobs((prev) => prev.filter((job) => job.id !== jobId));
    toast.show("LIKEを取り消しました", "info");
  }

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">
      <Header />
      <main className="flex-1 max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto w-full px-4 md:px-6 pt-4 md:pt-8 pb-20 md:pb-12">
        <div className="mb-4 md:mb-6">
          <h1 className="text-lg md:text-2xl font-extrabold text-gray-900">LIKE した求人</h1>
          {likedJobs.length > 0 && (
            <p className="text-[11px] md:text-xs text-gray-400 mt-0.5">
              {likedJobs.length}件の求人が保存されています
            </p>
          )}
        </div>

        {loaded && likedJobs.length === 0 ? (
          <div className="text-center py-20">
            <Logo size={56} radius={16} className="mx-auto mb-3 shadow-lg shadow-pink-200/40 ring-2 ring-white" />
            <p className="text-[10px] tracking-[0.3em] font-black bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent mb-2">
              SWIPLY
            </p>
            <h2 className="text-sm font-bold text-gray-900 mb-1">まだ LIKE した求人がありません</h2>
            <p className="text-xs text-gray-400 mb-6">
              スワイプで気になる求人をLIKEしよう
            </p>
            <Link
              href="/swipe"
              className="inline-block px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-violet-200/50 active:scale-95 transition-transform"
            >
              スワイプで探す
            </Link>
          </div>
        ) : (
          <div className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
            {likedJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex">
                  <Link href={`/job/${job.id}`} className="shrink-0">
                    <div className="relative w-24 h-28">
                      <Image
                        src={job.image}
                        alt={job.company}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                  </Link>
                  <div className="flex-1 p-3 min-w-0">
                    <Link href={`/job/${job.id}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-1.5 py-0.5 bg-violet-50 rounded-md text-[10px] font-bold text-violet-500">
                          {job.employmentType}
                        </span>
                        <p className="text-[10px] text-gray-400 truncate">{job.company}</p>
                      </div>
                      <h3 className="font-extrabold text-gray-900 text-sm leading-tight line-clamp-1">
                        {job.title}
                      </h3>
                      <p className="text-xs font-bold text-emerald-600 mt-1">
                        {job.salary}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {job.location} ・ {job.minDays}
                      </p>
                    </Link>
                  </div>
                  <div className="flex flex-col justify-center gap-1.5 pr-3">
                    <Link
                      href={`/job/${job.id}`}
                      className="px-3 py-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[10px] font-bold rounded-xl active:scale-95 transition-transform text-center"
                    >
                      詳細
                    </Link>
                    <button
                      onClick={() => handleRemove(job.id)}
                      className="px-3 py-1.5 text-[10px] text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors text-center"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
