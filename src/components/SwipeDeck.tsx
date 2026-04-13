"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import SwipeCard from "./SwipeCard";
import JobCard from "./JobCard";
import { Job } from "@/types/job";
import { addLike } from "@/lib/services/likes";

interface SwipeDeckProps {
  jobs: Job[];
}

export default function SwipeDeck({ jobs }: SwipeDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [leaving, setLeaving] = useState<"left" | "right" | null>(null);
  const [showToast, setShowToast] = useState<"like" | "nope" | null>(null);
  const router = useRouter();

  const currentJob = jobs[currentIndex];
  const nextJob = jobs[currentIndex + 1];

  const handleNext = useCallback(
    (direction: "left" | "right") => {
      setLeaving(direction);
      setShowToast(direction === "right" ? "like" : "nope");
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setLeaving(null);
      }, 200);
      setTimeout(() => setShowToast(null), 800);
    },
    []
  );

  const handleSwipeLeft = useCallback(() => {
    handleNext("left");
  }, [handleNext]);

  const handleSwipeRight = useCallback(() => {
    if (currentJob) addLike(currentJob.id);
    handleNext("right");
  }, [currentJob, handleNext]);

  const handleSwipeUp = useCallback(() => {
    if (currentJob) router.push(`/job/${currentJob.id}`);
  }, [currentJob, router]);

  if (currentIndex >= jobs.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-extrabold text-gray-900 mb-1">
          全ての求人をチェック済み！
        </h2>
        <p className="text-xs text-gray-400 mb-6 leading-relaxed">
          気になる求人はLIKEリストから確認できます
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setCurrentIndex(0)}
            className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl font-bold text-sm active:scale-95 transition-transform"
          >
            もう一度見る
          </button>
          <button
            onClick={() => router.push("/likes")}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm active:scale-95 transition-transform"
          >
            LIKEリスト
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Card area */}
      <div className="relative flex-1 min-h-0">
        {/* Next card (background) */}
        {nextJob && (
          <div className="absolute inset-1 scale-[0.95] opacity-30 rounded-3xl overflow-hidden">
            <JobCard job={nextJob} />
          </div>
        )}

        {/* Current card */}
        <AnimatePresence>
          {currentJob && !leaving && (
            <SwipeCard
              key={currentJob.id}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              onSwipeUp={handleSwipeUp}
            >
              <JobCard job={currentJob} />
            </SwipeCard>
          )}

          {currentJob && leaving && (
            <motion.div
              key={`${currentJob.id}-leaving`}
              className="absolute w-full h-full"
              initial={{ x: 0, opacity: 1 }}
              animate={{
                x: leaving === "right" ? 400 : -400,
                opacity: 0,
                rotate: leaving === "right" ? 20 : -20,
              }}
              transition={{ duration: 0.2 }}
            >
              <JobCard job={currentJob} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast notification */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              className={`absolute top-12 left-1/2 -translate-x-1/2 z-40 px-5 py-2 rounded-full font-bold text-sm shadow-lg ${
                showToast === "like"
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-700 text-white"
              }`}
            >
              {showToast === "like" ? "LIKED!" : "SKIP"}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress indicator */}
        <div className="absolute top-2 left-3 right-3 z-30">
          <div className="flex gap-1">
            {jobs.map((_, i) => (
              <div
                key={i}
                className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${
                  i < currentIndex
                    ? "bg-white"
                    : i === currentIndex
                    ? "bg-white shadow-sm shadow-white/50"
                    : "bg-white/25"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Card counter */}
        <div className="absolute top-3 right-3 z-30">
          <span className="text-[10px] font-bold text-white/50 bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
            {currentIndex + 1} / {jobs.length}
          </span>
        </div>
      </div>

      {/* Action buttons - below card */}
      <div className="flex justify-center items-center gap-6 py-3 shrink-0">
        <button
          onClick={handleSwipeLeft}
          className="w-14 h-14 rounded-full bg-white shadow-lg shadow-gray-200/60 flex items-center justify-center border border-gray-100/80 active:scale-90 transition-all"
          aria-label="スキップ"
        >
          <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <button
          onClick={handleSwipeUp}
          className="w-11 h-11 rounded-full bg-white shadow-lg shadow-gray-200/60 flex items-center justify-center border border-gray-100/80 active:scale-90 transition-all"
          aria-label="詳細を見る"
        >
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
          </svg>
        </button>

        <button
          onClick={handleSwipeRight}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 shadow-lg shadow-emerald-200/60 flex items-center justify-center active:scale-90 transition-all"
          aria-label="LIKE"
        >
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
