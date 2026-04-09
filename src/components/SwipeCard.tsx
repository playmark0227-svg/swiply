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
  const rotate = useTransform(x, [-300, 0, 300], [-20, 0, 20]);
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
      whileTap={{ scale: 1.02 }}
    >
      {/* LIKE indicator */}
      <motion.div
        className="absolute top-8 left-6 z-20 rounded-lg border-4 border-green-500 px-4 py-2 -rotate-12"
        style={{ opacity: likeOpacity }}
      >
        <span className="text-3xl font-black text-green-500">LIKE</span>
      </motion.div>

      {/* NOPE indicator */}
      <motion.div
        className="absolute top-8 right-6 z-20 rounded-lg border-4 border-red-500 px-4 py-2 rotate-12"
        style={{ opacity: nopeOpacity }}
      >
        <span className="text-3xl font-black text-red-500">NOPE</span>
      </motion.div>

      {/* Detail indicator */}
      <motion.div
        className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 rounded-lg border-4 border-blue-500 px-4 py-2"
        style={{ opacity: detailOpacity }}
      >
        <span className="text-xl font-black text-blue-500">DETAIL</span>
      </motion.div>

      {children}
    </motion.div>
  );
}
