"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import SwipeCard from "./SwipeCard";
import JobCard from "./JobCard";
import { Job } from "@/types/job";
import { addLike, removeLike } from "@/lib/services/likes";
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
    if (currentJob) addLike(currentJob.id);
    handleNext("right");
  }, [currentJob, handleNext]);

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
            onClick={() => {
              haptic("tick");
              setHistory([]);
              setCurrentIndex(0);
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl font-bold text-sm active:scale-95 transition-transform"
          >
            もう一度見る
          </button>
          <button
            onClick={() => {
              haptic("tick");
              router.push("/likes");
            }}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm active:scale-95 transition-transform"
          >
            LIKEリスト
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

        <div className="absolute top-3 right-3 z-30">
          <span className="text-[10px] font-bold text-white/60 bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
            {currentIndex + 1} / {jobs.length}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-center items-center gap-4 py-3 shrink-0">
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all ${
            canUndo
              ? "bg-white text-amber-500 border-gray-100/80 shadow-md shadow-gray-200/60 active:scale-90"
              : "bg-gray-100 text-gray-300 border-transparent"
          }`}
          aria-label="1つ戻す"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 14L4 9m0 0l5-5M4 9h11a5 5 0 015 5v1" />
          </svg>
        </button>

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
          className="w-11 h-11 rounded-full bg-white shadow-md shadow-gray-200/60 flex items-center justify-center border border-gray-100/80 active:scale-90 transition-all"
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
