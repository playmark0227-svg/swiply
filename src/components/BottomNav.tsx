"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { haptic } from "@/lib/haptic";
import { getTotalUnread, subscribeMatches } from "@/lib/services/matches";

/**
 * 5-tab symmetric bottom navigation:
 *
 *   ホーム  |  検索  |  [スワイプ]  |  メッセージ  |  マイページ
 *     (2 left)         (center)          (2 right)
 *
 * Swipe sits dead-center with equal items on each side.
 */
const tabs = [
  {
    href: "/",
    label: "ホーム",
    exact: true,
    activeIcon: (
      <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.71 2.29a1 1 0 00-1.42 0l-9 9a1 1 0 000 1.42A1 1 0 003 13h1v7a2 2 0 002 2h12a2 2 0 002-2v-7h1a1 1 0 00.71-1.71zM9 20v-5a1 1 0 011-1h4a1 1 0 011 1v5z" />
      </svg>
    ),
    inactiveIcon: (
      <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    href: "/search",
    label: "検索",
    activeIcon: (
      <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
      </svg>
    ),
    inactiveIcon: (
      <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    href: "/swipe",
    label: "スワイプ",
    center: true,
  },
  {
    href: "/messages",
    label: "メッセージ",
    activeIcon: (
      <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2zM7 9h10v2H7zm6 5H7v-2h6z" />
      </svg>
    ),
    inactiveIcon: (
      <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "マイページ",
    activeIcon: (
      <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5.33 0-8 2.67-8 4v1a1 1 0 001 1h14a1 1 0 001-1v-1c0-1.33-2.67-4-8-4z" />
      </svg>
    ),
    inactiveIcon: (
      <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const normalized = pathname === "/" ? "/" : pathname.replace(/\/$/, "");

  // Live unread count for the messages badge.
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    const refresh = () => setUnread(getTotalUnread());
    refresh();
    return subscribeMatches(refresh);
  }, []);

  function isActive(tab: (typeof tabs)[number]) {
    if ("exact" in tab && tab.exact) return normalized === tab.href;
    return normalized === tab.href || normalized.startsWith(tab.href + "/");
  }

  return (
    <nav className="fixed md:hidden bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-100/50 safe-area-bottom shadow-[0_-1px_8px_rgba(0,0,0,0.04)]">
      <div className="max-w-lg mx-auto flex items-end justify-around h-[58px] px-2">
        {tabs.map((tab) => {
          const active = isActive(tab);

          if ("center" in tab && tab.center) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => haptic("tick")}
                aria-label={tab.label}
                className="flex flex-col items-center flex-1 -mt-4"
              >
                <div
                  className={`w-13 h-13 rounded-[18px] flex items-center justify-center transition-all active:scale-90 ${
                    active
                      ? "bg-gradient-to-br from-violet-600 to-fuchsia-500 shadow-lg shadow-violet-300/50 ring-4 ring-white"
                      : "bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-md shadow-violet-200/50 ring-4 ring-white"
                  }`}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <span className={`text-[10px] mt-1 leading-none ${active ? "font-bold text-violet-600" : "font-medium text-gray-400"}`}>
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => haptic("tick")}
              aria-label={tab.label}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                active ? "text-violet-600" : "text-gray-400"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-pill"
                  className="absolute top-1.5 h-8 w-12 rounded-xl bg-violet-50"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">
                {active ? tab.activeIcon : tab.inactiveIcon}
                {tab.href === "/messages" && unread > 0 && (
                  <span className="absolute -top-1 -right-2 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white text-[9px] font-black tabular-nums shadow-sm">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </span>
              <span className={`relative text-[10px] mt-1 leading-none ${active ? "font-bold" : "font-medium"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
