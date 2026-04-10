"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { getLikedJobIds, removeLike } from "@/lib/services/likes";
import { getAllJobs } from "@/lib/services/jobs";
import { Job } from "@/types/job";

export default function LikesPage() {
  const [likedJobs, setLikedJobs] = useState<Job[]>([]);

  useEffect(() => {
    (async () => {
      const [likedIds, allJobs] = await Promise.all([getLikedJobIds(), getAllJobs()]);
      setLikedJobs(allJobs.filter((job) => likedIds.includes(job.id)));
    })();
  }, []);

  async function handleRemove(jobId: string) {
    await removeLike(jobId);
    setLikedJobs((prev) => prev.filter((job) => job.id !== jobId));
  }

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50/50">
      <Header />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-4 pb-20">
        <div className="mb-4">
          <h1 className="text-lg font-extrabold text-gray-900">
            LIKE した求人
          </h1>
          {likedJobs.length > 0 && (
            <p className="text-[11px] text-gray-400 mt-0.5">
              {likedJobs.length}件の求人が保存されています
            </p>
          )}
        </div>

        {likedJobs.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-pink-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              まだ LIKE した求人がありません
            </p>
            <Link
              href="/baito"
              className="inline-block px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-2xl font-bold text-sm hover:shadow-lg hover:shadow-violet-200 transition-all"
            >
              求人を探す
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {likedJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden hover:shadow-md transition-shadow"
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
                  <div className="flex-1 p-3 min-w-0 flex flex-col justify-between">
                    <Link href={`/job/${job.id}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-500">
                          {job.employmentType}
                        </span>
                        <p className="text-[10px] text-gray-400 truncate">{job.company}</p>
                      </div>
                      <h3 className="font-extrabold text-gray-900 text-sm leading-tight">
                        {job.title}
                      </h3>
                      <p className="text-xs font-bold text-emerald-600 mt-1">
                        {job.salary}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {job.location} / {job.minDays}
                      </p>
                    </Link>
                  </div>
                  <div className="flex flex-col justify-center gap-2 pr-3">
                    <Link
                      href={`/job/${job.id}`}
                      className="px-3 py-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[10px] font-bold rounded-full hover:shadow-md transition-all text-center"
                    >
                      詳細
                    </Link>
                    <button
                      onClick={() => handleRemove(job.id)}
                      className="px-3 py-1.5 text-[10px] text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
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
