"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
import { HeartIcon, CloseIcon } from "@/components/icons/Glyphs";

/**
 * HeroSwipeDemo — a live, draggable mini swipe deck for the landing hero.
 *
 * The whole product hinges on one gesture; the LP should let a visitor *feel*
 * it in three seconds rather than read a claim about it. Each card is its own
 * keyed element inside an AnimatePresence deck, so the dismissed card animates
 * cleanly off-screen while a fresh card rises into place — no shared-element
 * reset, no flash.
 *
 * Accessibility: honours prefers-reduced-motion (drag off, instant swaps) and
 * the tap buttons drive the whole thing without any pointer gesture at all.
 */

type DemoJob = {
  company: string;
  title: string;
  salary: string;
  location: string;
  badge: string;
  image: string;
  tags: string[];
};

const DEMO_JOBS: DemoJob[] = [
  {
    company: "カフェ ブルーム",
    title: "バリスタ / ホール",
    salary: "時給 1,300円",
    location: "東京・渋谷",
    badge: "アルバイト",
    image:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=520&h=680&fit=crop",
    tags: ["未経験OK", "髪色自由", "まかない"],
  },
  {
    company: "Studio カナタ",
    title: "UI デザイナー",
    salary: "月給 34万円〜",
    location: "リモートOK",
    badge: "正社員",
    image:
      "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=520&h=680&fit=crop",
    tags: ["私服OK", "フレックス", "副業OK"],
  },
  {
    company: "焼肉 燈 -あかり-",
    title: "ホールスタッフ",
    salary: "時給 1,300円",
    location: "東京・新宿",
    badge: "週2日〜",
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=520&h=680&fit=crop",
    tags: ["まかない食べ放題", "シフト自由"],
  },
];

const variants = {
  enter: { scale: 0.9, y: 20, opacity: 0 },
  behind: { scale: 0.94, y: 12, opacity: 0.75 },
  top: { scale: 1, y: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? 480 : -480, opacity: 0 }),
};

type DeckItem = { id: number; job: DemoJob };

function DeckCard({ job }: { job: DemoJob }) {
  return (
    <div className="relative w-full h-full rounded-[1.75rem] overflow-hidden bg-gray-900 ring-1 ring-white/10 shadow-2xl shadow-black/50">
      <Image
        src={job.image}
        alt={`${job.company}の職場`}
        fill
        sizes="280px"
        className="object-cover pointer-events-none"
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10" />

      <div className="absolute top-3 left-3">
        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white/90 text-gray-900 shadow-sm">
          {job.badge}
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4">
        <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-500/95 text-[12px] font-black text-white shadow-sm mb-2">
          {job.salary}
        </span>
        <h3 className="text-[17px] font-extrabold text-white leading-snug jp-heading">
          {job.title}
        </h3>
        <p className="text-[12px] text-white/70 mt-0.5">
          {job.company} ・ {job.location}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {job.tags.map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 rounded-md bg-white/12 backdrop-blur-sm text-[10px] font-semibold text-white/85"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Card({
  item,
  isTop,
  exitDir,
  reduce,
  onVote,
  onInteract,
}: {
  item: DeckItem;
  isTop: boolean;
  exitDir: number;
  reduce: boolean | null;
  onVote: (dir: 1 | -1) => void;
  onInteract: () => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-260, 0, 260], [-16, 0, 16]);
  const likeOpacity = useTransform(x, [24, 110], [0, 1]);
  const nopeOpacity = useTransform(x, [-110, -24], [1, 0]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > 100 || info.velocity.x > 600) onVote(1);
    else if (info.offset.x < -100 || info.velocity.x < -600) onVote(-1);
  }

  const draggable = isTop && !reduce;

  return (
    <motion.div
      className={`absolute inset-0 ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
      style={isTop ? { x, rotate } : undefined}
      variants={variants}
      initial="enter"
      animate={isTop ? "top" : "behind"}
      exit="exit"
      custom={exitDir}
      transition={{ duration: reduce ? 0 : 0.34, ease: [0.16, 1, 0.3, 1] }}
      drag={draggable ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragStart={onInteract}
      onDragEnd={draggable ? handleDragEnd : undefined}
    >
      <DeckCard job={item.job} />

      {isTop && (
        <>
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-6 left-5 z-20 -rotate-12 pointer-events-none"
          >
            <div className="px-3.5 py-1 rounded-xl border-2 border-emerald-400 bg-emerald-500/20 backdrop-blur-sm">
              <span className="text-lg font-black text-emerald-300 tracking-widest">
                LIKE
              </span>
            </div>
          </motion.div>
          <motion.div
            style={{ opacity: nopeOpacity }}
            className="absolute top-6 right-5 z-20 rotate-12 pointer-events-none"
          >
            <div className="px-3.5 py-1 rounded-xl border-2 border-rose-400 bg-rose-500/20 backdrop-blur-sm">
              <span className="text-lg font-black text-rose-300 tracking-widest">
                NOPE
              </span>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

export default function HeroSwipeDemo() {
  const reduce = useReducedMotion();
  const nextId = useRef(DEMO_JOBS.length);
  const [deck, setDeck] = useState<DeckItem[]>(() =>
    DEMO_JOBS.map((job, i) => ({ id: i, job }))
  );
  const [exitDir, setExitDir] = useState(1);
  const [interacted, setInteracted] = useState(false);

  function vote(dir: 1 | -1) {
    setInteracted(true);
    setExitDir(dir);
    setDeck((prev) => {
      const rest = prev.slice(1);
      const id = nextId.current;
      nextId.current += 1;
      return [...rest, { id, job: DEMO_JOBS[id % DEMO_JOBS.length] }];
    });
  }

  // Render the front two — top (draggable) + one behind for depth.
  const visible = deck.slice(0, 2);
  const topId = deck[0]?.id;

  return (
    <div className="flex flex-col items-center select-none">
      <div className="relative w-[240px] h-[336px] sm:w-[264px] sm:h-[368px]">
        <AnimatePresence initial={false} custom={exitDir}>
          {[...visible].reverse().map((item) => (
            <Card
              key={item.id}
              item={item}
              isTop={item.id === topId}
              exitDir={exitDir}
              reduce={reduce}
              onVote={vote}
              onInteract={() => setInteracted(true)}
            />
          ))}
        </AnimatePresence>

        {/* Drag hint — fades once the visitor engages */}
        <div
          className="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 z-30 transition-opacity duration-500"
          style={{ opacity: interacted ? 0 : 1 }}
        >
          <span className="whitespace-nowrap px-3 py-1 rounded-full bg-white text-gray-900 text-[11px] font-bold shadow-lg shadow-black/20 flex items-center gap-1.5">
            <ArrowHint /> ドラッグしてみて
          </span>
        </div>
      </div>

      {/* Tap controls — full functionality without a drag gesture */}
      <div className="flex items-center gap-5 mt-8">
        <button
          type="button"
          onClick={() => vote(-1)}
          aria-label="興味なし（次の求人へ）"
          className="w-12 h-12 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-rose-300 flex items-center justify-center hover:bg-white/20 hover:scale-105 active:scale-95 transition"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => vote(1)}
          aria-label="いいね（次の求人へ）"
          className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center shadow-lg shadow-fuchsia-500/30 hover:scale-105 active:scale-95 transition"
        >
          <HeartIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

function ArrowHint() {
  return (
    <svg
      className="w-3.5 h-3.5 text-violet-500"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h13M13 6l6 6-6 6" />
    </svg>
  );
}
