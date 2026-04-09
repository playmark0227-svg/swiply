"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100/50">
      <div className="max-w-lg mx-auto px-4 h-11 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <span className="text-white text-[10px] font-black">S</span>
          </div>
          <span className="text-base font-black tracking-tight text-gray-900">
            SWIPLY
          </span>
        </Link>

        {/* LIKE button stays in header */}
        <Link
          href="/likes"
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-pink-500 hover:bg-pink-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
