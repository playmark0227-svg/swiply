"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { haptic } from "@/lib/haptic";

/**
 * Top-level pages (reachable via BottomNav / logo) show the Warp logo.
 * Any other page shows a back button in place of the logo.
 */
const ROOT_PAGES = new Set<string>([
  "/",
  "/baito",
  "/career",
  "/swipe",
  "/profile",
  "/likes",
  "/notifications",
]);

const PAGE_TITLE: Record<string, string> = {
  "/likes": "LIKE一覧",
  "/notifications": "お知らせ",
  "/profile": "マイページ",
  "/baito": "アルバイト",
  "/career": "正社員",
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isRoot = ROOT_PAGES.has(pathname);
  const title = PAGE_TITLE[pathname];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100/50">
      <div className="max-w-lg mx-auto px-3 h-12 flex items-center justify-between">
        {isRoot ? (
          <Link href="/" className="flex items-center gap-2 px-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-sm shadow-violet-200">
              <span className="text-white text-xs font-black">W</span>
            </div>
            <span className="text-[15px] font-black tracking-tight text-gray-900">
              Warp
            </span>
            {title && (
              <>
                <span className="text-gray-200 text-sm">/</span>
                <span className="text-[13px] font-semibold text-gray-500">
                  {title}
                </span>
              </>
            )}
          </Link>
        ) : (
          <button
            onClick={() => {
              haptic("tick");
              router.back();
            }}
            aria-label="戻る"
            className="w-9 h-9 -ml-1 rounded-xl flex items-center justify-center text-gray-700 hover:bg-gray-100 active:scale-90 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <div className="flex items-center gap-0.5">
          <Link
            href="/notifications"
            aria-label="お知らせ"
            onClick={() => haptic("tick")}
            className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              pathname === "/notifications"
                ? "text-violet-600 bg-violet-50"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </Link>

          <Link
            href="/likes"
            aria-label="LIKEした求人"
            onClick={() => haptic("tick")}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              pathname === "/likes"
                ? "text-pink-500 bg-pink-50"
                : "text-gray-400 hover:text-pink-500 hover:bg-pink-50"
            }`}
          >
            <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
