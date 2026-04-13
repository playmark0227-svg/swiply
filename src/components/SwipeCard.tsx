"use client";

import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { ReactNode } from "react";

interface SwipeCardProps {
  children: ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp: () => void;
}

const SWIPE_THRESHOLD = 100;
const SWIPE_UP_THRESHOLD = 80;

export default function SwipeCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
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
      className="absolute w-full h-full cursor-grab active:cursor-grabbing"
      style={{ x, y, rotate, opacity }}
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 1.01 }}
    >
      {/* LIKE indicator */}
      <motion.div
        className="absolute top-10 left-6 z-20 -rotate-12"
        style={{ opacity: likeOpacity }}
      >
        <div className="bg-emerald-500 rounded-xl px-5 py-2 shadow-lg shadow-emerald-500/30">
          <span className="text-2xl font-black text-white tracking-wide">LIKE</span>
        </div>
      </motion.div>

      {/* NOPE indicator */}
      <motion.div
        className="absolute top-10 right-6 z-20 rotate-12"
        style={{ opacity: nopeOpacity }}
      >
        <div className="bg-red-500 rounded-xl px-5 py-2 shadow-lg shadow-red-500/30">
          <span className="text-2xl font-black text-white tracking-wide">NOPE</span>
        </div>
      </motion.div>

      {/* Detail indicator */}
      <motion.div
        className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20"
        style={{ opacity: detailOpacity }}
      >
        <div className="bg-blue-500 rounded-xl px-5 py-2 shadow-lg shadow-blue-500/30">
          <span className="text-lg font-black text-white tracking-wide">DETAIL ↑</span>
        </div>
      </motion.div>

      {children}
    </motion.div>
  );
}
