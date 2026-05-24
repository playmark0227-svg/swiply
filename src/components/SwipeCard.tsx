"use client";

import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { memo, ReactNode } from "react";

interface SwipeCardProps {
  children: ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp: () => void;
  /** When true, the card stays mounted but cannot be dragged. Used for
   *  inactive cards in the stack — keeps the JSX shape stable so React
   *  doesn't remount the underlying JobCard (and its <video>) when a
   *  card is promoted from the stack to the top. */
  disabled?: boolean;
}

const SWIPE_THRESHOLD = 100;
const SWIPE_UP_THRESHOLD = 80;

function SwipeCardImpl({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  disabled = false,
}: SwipeCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const opacity = useTransform(
    x,
    [-300, -100, 0, 100, 300],
    [0.5, 1, 1, 1, 0.5]
  );

  const likeOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const nopeOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const detailOpacity = useTransform(y, [-SWIPE_UP_THRESHOLD, 0], [1, 0]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    const { offset } = info;

    if (offset.y < -SWIPE_UP_THRESHOLD && Math.abs(offset.x) < SWIPE_THRESHOLD) {
      onSwipeUp();
      return;
    }
    if (offset.x > SWIPE_THRESHOLD) {
      onSwipeRight();
      return;
    }
    if (offset.x < -SWIPE_THRESHOLD) {
      onSwipeLeft();
      return;
    }
  }

  return (
    <motion.div
      className={`absolute w-full h-full ${
        disabled ? "" : "cursor-grab active:cursor-grabbing"
      }`}
      style={{ x, y, rotate, opacity }}
      drag={disabled ? false : true}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragEnd={disabled ? undefined : handleDragEnd}
      whileTap={disabled ? undefined : { scale: 1.01 }}
    >
      {/* LIKE indicator */}
      <motion.div
        className="absolute top-12 left-6 z-20 -rotate-12"
        style={{ opacity: likeOpacity }}
      >
        <div className="bg-gradient-to-r from-emerald-500 to-green-400 rounded-2xl px-6 py-2.5 shadow-xl shadow-emerald-500/40 border-2 border-white/30">
          <span className="text-2xl font-black text-white tracking-widest drop-shadow">LIKE</span>
        </div>
      </motion.div>

      {/* NOPE indicator */}
      <motion.div
        className="absolute top-12 right-6 z-20 rotate-12"
        style={{ opacity: nopeOpacity }}
      >
        <div className="bg-gradient-to-r from-red-500 to-rose-400 rounded-2xl px-6 py-2.5 shadow-xl shadow-red-500/40 border-2 border-white/30">
          <span className="text-2xl font-black text-white tracking-widest drop-shadow">NOPE</span>
        </div>
      </motion.div>

      {/* Detail indicator */}
      <motion.div
        className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20"
        style={{ opacity: detailOpacity }}
      >
        <div className="bg-gradient-to-r from-blue-500 to-cyan-400 rounded-2xl px-6 py-2.5 shadow-xl shadow-blue-500/40 border-2 border-white/30 flex items-center gap-2">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
          <span className="text-lg font-black text-white tracking-wide drop-shadow">DETAIL</span>
        </div>
      </motion.div>

      {children}
    </motion.div>
  );
}

const SwipeCard = memo(SwipeCardImpl);
export default SwipeCard;
