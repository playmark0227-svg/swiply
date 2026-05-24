"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import SwipeCard from "./SwipeCard";
import JobCard from "./JobCard";
import Logo from "./Logo";
import DailyLimitModal from "./DailyLimitModal";
import { Job } from "@/types/job";
import { addLike, removeLike } from "@/lib/services/likes";
import { maybeMatch } from "@/lib/services/matches";
import {
  canLikeToday,
  decrementTodayLike,
  getTodayLikeRemaining,
  incrementTodayLike,
  LIKE_DAILY_LIMIT,
} from "@/lib/services/dailyLimits";
import { useToast } from "./Toast";
import { haptic } from "@/lib/haptic";

interface SwipeDeckProps {
  jobs: Job[];
}

type HistoryEntry = { index: number; direction: "left" | "right" };

/** How many cards we keep mounted in the stack. The top one plays; the
 *  others stay paused but their <video> elements have already buffered. */
const STACK_SIZE = 3;

export default function SwipeDeck({ jobs }: SwipeDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showToast, setShowToast] = useState<"like" | "nope" | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  // Lazy-init from localStorage so the counter is correct on first paint
  // without an extra effect. Subsequent updates happen inside handlers.
  const [remaining, setRemaining] = useState<number>(() =>
    typeof window === "undefined"
      ? LIKE_DAILY_LIMIT
      : getTodayLikeRemaining()
  );
  const router = useRouter();
  const toast = useToast();

  const currentJob = jobs[currentIndex];

  const handleNext = useCallback(
    (direction: "left" | "right") => {
      setShowToast(direction === "right" ? "like" : "nope");
      haptic(direction === "right" ? "success" : "soft");
      setHistory((prev) => [...prev, { index: currentIndex, direction }]);
      setCurrentIndex((prev) => prev + 1);
      setTimeout(() => setShowToast(null), 800);
    },
    [currentIndex]
  );

  const handleSwipeLeft = useCallback(() => {
    handleNext("left");
  }, [handleNext]);

  const handleSwipeRight = useCallback(() => {
    if (!currentJob) return;
    if (!canLikeToday()) {
      // Out of LIKE quota — block the swipe + open the explainer modal.
      // The card stays put so the user can still 左フリック / 上フリック.
      haptic("warn");
      setLimitModalOpen(true);
      return;
    }
    incrementTodayLike();
    setRemaining(getTodayLikeRemaining());
    addLike(currentJob.id);
    // Probabilistic mutual match — if it fires, the matches service
    // creates a Match record + system message + notification, and
    // schedules an NPC intro reply.
    const m = maybeMatch({
      jobId: currentJob.id,
      jobTitle: currentJob.title,
      jobCompany: currentJob.company,
      jobImage: currentJob.image,
      featured: currentJob.featured,
    });
    if (m) {
      toast.show(`🎉 ${currentJob.company} とマッチしました！`, "success");
    }
    handleNext("right");
  }, [currentJob, handleNext, toast]);

  const handleSwipeUp = useCallback(() => {
    if (currentJob) {
      haptic("tick");
      router.push(`/job/${currentJob.id}`);
    }
  }, [currentJob, router]);

  const handleUndo = useCallback(async () => {
    const last = history[history.length - 1];
    if (!last) return;
    haptic("warn");
    if (last.direction === "right") {
      const job = jobs[last.index];
      if (job) await removeLike(job.id);
      // Refund the daily quota — undoing a LIKE shouldn't consume it.
      decrementTodayLike();
      setRemaining(getTodayLikeRemaining());
    }
    setHistory((prev) => prev.slice(0, -1));
    setCurrentIndex(last.index);
    toast.show("1つ戻しました", "info");
  }, [history, jobs, toast]);

  // Keyboard shortcuts (desktop). Ignore when typing in inputs.
  useEffect(() => {
    function isEditable(el: EventTarget | null) {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el.isContentEditable
      );
    }
    function onKey(e: KeyboardEvent) {
      if (isEditable(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (currentIndex >= jobs.length) return;
      switch (e.key) {
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          handleSwipeRight();
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          handleSwipeLeft();
          break;
        case "ArrowUp":
        case "w":
        case "W":
        case "Enter":
          e.preventDefault();
          handleSwipeUp();
          break;
        case " ":
          e.preventDefault();
          handleSwipeRight();
          break;
        case "z":
        case "Z":
        case "Backspace":
        case "ArrowDown":
          e.preventDefault();
          handleUndo();
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    currentIndex,
    jobs.length,
    handleSwipeRight,
    handleSwipeLeft,
    handleSwipeUp,
    handleUndo,
  ]);

  if (currentIndex >= jobs.length) {
    const likedCount = history.filter((h) => h.direction === "right").length;
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        {/* Confetti-like decorative dots */}
        <div className="relative mb-6">
          <div className="absolute -inset-8 pointer-events-none">
            {[...Array(8)].map((_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              const r = 44 + (i % 2) * 12;
              return (
                <span
                  key={i}
                  className="absolute w-2 h-2 rounded-full opacity-60"
                  style={{
                    left: `calc(50% + ${Math.cos(angle) * r}px - 4px)`,
                    top: `calc(50% + ${Math.sin(angle) * r}px - 4px)`,
                    background: ["#8b5cf6", "#ec4899", "#06b6d4", "#f59e0b", "#10b981"][i % 5],
                  }}
                />
              );
            })}
          </div>
          <Logo size={72} radius={20} className="shadow-xl shadow-violet-200/60 ring-4 ring-white" />
        </div>
        <p className="text-[10px] tracking-[0.3em] font-black text-violet-500 mb-1">
          COMPLETE
        </p>
        <h2 className="text-xl font-black text-gray-900 mb-1">
          全ての求人をチェック済み！
        </h2>
        <p className="text-[13px] text-gray-400 mb-2 leading-relaxed">
          お疲れさまでした
        </p>

        {/* Session stats */}
        <div className="flex items-center gap-4 mb-6 px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-100">
          <div className="text-center">
            <p className="text-lg font-black text-gray-900 tabular-nums">{jobs.length}</p>
            <p className="text-[10px] text-gray-400 font-bold">チェック</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-center">
            <p className="text-lg font-black text-pink-500 tabular-nums">{likedCount}</p>
            <p className="text-[10px] text-gray-400 font-bold">LIKE</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-center">
            <p className="text-lg font-black text-violet-600 tabular-nums">{jobs.length > 0 ? Math.round((likedCount / jobs.length) * 100) : 0}%</p>
            <p className="text-[10px] text-gray-400 font-bold">LIKE率</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              haptic("tick");
              setHistory([]);
              setCurrentIndex(0);
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl font-bold text-sm active:scale-95 transition-transform shadow-lg shadow-violet-200/50"
          >
            もう一度見る
          </button>
          <button
            onClick={() => {
              haptic("tick");
              router.push("/likes");
            }}
            className="px-5 py-2.5 bg-white text-gray-700 rounded-xl font-bold text-sm active:scale-95 transition-transform border border-gray-200 shadow-sm"
          >
            LIKEリスト →
          </button>
        </div>
      </div>
    );
  }

  const canUndo = history.length > 0;

  // Render a stable stack of cards. The top card plays its video; the
  // others stay paused but their <video> elements are already mounted
  // (and their data buffered via preload="auto"), so when one is promoted
  // to the top via swipe, playback starts instantly with no fresh fetch.
  const stack = jobs.slice(currentIndex, currentIndex + STACK_SIZE);

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="relative flex-1 min-h-0">
        {/* Stack — render BACK-TO-FRONT so the top card is last in the
            DOM and naturally has the highest stacking. Stable keys mean
            cards stay mounted across swipes; only their stack position
            (and active flag) changes. */}
        <AnimatePresence>
          {[...stack].reverse().map((job, reverseIdx) => {
            const stackPos = stack.length - 1 - reverseIdx;
            const isTop = stackPos === 0;
            return (
              <motion.div
                key={job.id}
                className="absolute inset-0"
                style={{ zIndex: stack.length - stackPos }}
                initial={false}
                animate={{
                  scale: 1 - stackPos * 0.04,
                  y: stackPos * 8,
                  opacity: stackPos === 0 ? 1 : stackPos === 1 ? 0.55 : 0.25,
                }}
                exit={{
                  x:
                    history[history.length - 1]?.direction === "right"
                      ? 400
                      : -400,
                  opacity: 0,
                  rotate:
                    history[history.length - 1]?.direction === "right"
                      ? 20
                      : -20,
                  transition: { duration: 0.22 },
                }}
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
              >
                <SwipeCard
                  disabled={!isTop}
                  onSwipeLeft={handleSwipeLeft}
                  onSwipeRight={handleSwipeRight}
                  onSwipeUp={handleSwipeUp}
                >
                  <JobCard job={job} active={isTop} />
                </SwipeCard>
              </motion.div>
            );
          })}
        </AnimatePresence>

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

        <div className="absolute top-3 right-3 z-30 flex flex-col items-end gap-1">
          <span className="text-[10px] font-bold text-white/60 bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
            {currentIndex + 1} / {jobs.length}
          </span>
          <span
            className={`text-[10px] font-extrabold backdrop-blur-sm px-2 py-0.5 rounded-full tabular-nums ${
              remaining <= 2
                ? "bg-rose-500/30 text-rose-100 border border-rose-300/40"
                : "bg-white/15 text-white/80"
            }`}
            title="今日のLIKE残り"
          >
            ❤ {remaining}/{LIKE_DAILY_LIMIT}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-center items-center gap-3 md:gap-5 py-3 shrink-0">
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${
              canUndo
                ? "bg-white text-amber-500 border-gray-100/80 shadow-md shadow-gray-200/60 active:scale-90 hover:shadow-lg"
                : "bg-gray-100 text-gray-300 border-transparent"
            }`}
            aria-label="1つ戻す"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 14L4 9m0 0l5-5M4 9h11a5 5 0 015 5v1" />
            </svg>
          </button>
          <span className="hidden md:block text-[9px] font-bold text-gray-400">戻す</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleSwipeLeft}
            className="w-14 h-14 rounded-full bg-white shadow-lg shadow-gray-200/60 flex items-center justify-center border border-gray-100/80 active:scale-90 hover:shadow-xl hover:border-red-100 transition-all group"
            aria-label="スキップ"
          >
            <svg className="w-6 h-6 text-red-400 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <span className="hidden md:block text-[9px] font-bold text-gray-400">SKIP</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleSwipeUp}
            className="w-11 h-11 rounded-full bg-white shadow-md shadow-gray-200/60 flex items-center justify-center border border-gray-100/80 active:scale-90 hover:shadow-lg hover:border-blue-100 transition-all group"
            aria-label="詳細を見る"
          >
            <svg className="w-5 h-5 text-blue-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <span className="hidden md:block text-[9px] font-bold text-gray-400">詳細</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleSwipeRight}
            className={`relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-all ${
              remaining > 0
                ? "bg-gradient-to-br from-emerald-400 to-green-500 shadow-emerald-200/60 hover:shadow-xl hover:shadow-emerald-300/60"
                : "bg-gradient-to-br from-gray-300 to-gray-400 shadow-gray-200/60"
            }`}
            aria-label={remaining > 0 ? "LIKE" : "今日のLIKE残数なし"}
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
          <span className="hidden md:block text-[9px] font-bold text-gray-400">LIKE</span>
        </div>
      </div>

      <DailyLimitModal
        open={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
      />
    </div>
  );
}
