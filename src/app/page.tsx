"use client";

import Link from "next/link";
import BottomNav from "@/components/BottomNav";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-white px-6 pb-16">
      {/* Logo */}
      <div className="mb-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-5 shadow-xl shadow-violet-200">
          <span className="text-white text-2xl font-black">S</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2">
          SWIPLY
        </h1>
        <p className="text-gray-400 text-base font-medium">
          求人を&quot;探す&quot;から&quot;出会う&quot;へ
        </p>
      </div>

      {/* Selection */}
      <div className="w-full max-w-xs space-y-3">
        <Link
          href="/baito"
          className="group block w-full py-4 px-6 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-center font-bold text-base rounded-2xl hover:shadow-xl hover:shadow-violet-200 transition-all active:scale-[0.97]"
        >
          <span className="block text-white/70 text-xs font-medium mb-0.5">PART-TIME</span>
          アルバイトを探す
        </Link>
        <Link
          href="/career"
          className="group block w-full py-4 px-6 bg-gray-900 text-white text-center font-bold text-base rounded-2xl hover:bg-gray-800 hover:shadow-xl transition-all active:scale-[0.97]"
        >
          <span className="block text-white/50 text-xs font-medium mb-0.5">FULL-TIME</span>
          正社員を探す
        </Link>
      </div>

      {/* Footer */}
      <p className="mt-10 text-[10px] text-gray-300">
        あなたにぴったりの仕事が見つかる
      </p>

      <BottomNav />
    </div>
  );
}
