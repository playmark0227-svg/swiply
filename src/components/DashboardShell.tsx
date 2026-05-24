"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Logo from "@/components/Logo";
import { getNotifications, type DashboardNotification } from "@/lib/services/companyDemo";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "ダッシュボード",
    exact: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zm0 7a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1h-4a1 1 0 01-1-1v-5zM4 14a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/jobs",
    label: "求人管理",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0h2a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h2" />
      </svg>
    ),
  },
  {
    href: "/dashboard/applicants",
    label: "応募者",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/messages",
    label: "メッセージ",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/analytics",
    label: "分析",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/settings",
    label: "設定",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

function relativeTimeShort(iso: string): string {
  const diff = Date.now() - Date.parse(iso);
  if (Number.isNaN(diff)) return "";
  if (diff < 60_000) return "今";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}分`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)}時間`;
  return `${Math.floor(diff / 86_400_000)}日`;
}

const NOTIF_ICON: Record<DashboardNotification["type"], { bg: string; icon: React.ReactNode }> = {
  match: {
    bg: "bg-violet-100 text-violet-600",
    icon: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>,
  },
  message: {
    bg: "bg-blue-100 text-blue-600",
    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>,
  },
  application: {
    bg: "bg-emerald-100 text-emerald-600",
    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  },
  interview: {
    bg: "bg-amber-100 text-amber-600",
    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>,
  },
  system: {
    bg: "bg-gray-100 text-gray-600",
    icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  },
};

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const normalized = pathname.replace(/\/$/, "") || "/dashboard";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [notifications] = useState(getNotifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close notification panel on outside click
  useEffect(() => {
    if (!notifOpen) return;
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen]);

  function isActive(item: (typeof NAV_ITEMS)[number]) {
    if ("exact" in item && item.exact) return normalized === item.href;
    return normalized === item.href || normalized.startsWith(item.href + "/");
  }

  return (
    <div className="flex h-dvh bg-gray-50/80">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white shrink-0">
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <Logo size={32} radius={8} priority />
            <div className="leading-tight">
              <p className="text-[14px] font-black tracking-tight bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-400 bg-clip-text text-transparent group-hover:from-cyan-200 group-hover:to-blue-300 transition-all">
                SWIPLY
              </p>
              <p className="text-[8px] tracking-[0.25em] text-white/30 font-bold">
                FOR BUSINESS
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item, i) => {
            const active = isActive(item);
            // Add separator before settings
            const showDivider = i === NAV_ITEMS.length - 1;
            return (
              <div key={item.href}>
                {showDivider && <div className="my-3 border-t border-white/[0.06]" />}
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-white/[0.12] to-white/[0.06] text-white shadow-sm shadow-black/20"
                      : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                  }`}
                >
                  <span className={`transition-colors duration-200 ${active ? "text-cyan-400" : ""}`}>{item.icon}</span>
                  {item.label}
                  {item.label === "メッセージ" && unreadCount > 0 && (
                    <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-[10px] font-black flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-white/[0.06] space-y-2.5">
          {/* Founding CTA */}
          <Link
            href="/business#contact"
            className="group block w-full px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-400/15 to-amber-300/5 border border-amber-400/20 text-center text-[11px] font-bold text-amber-300/90 hover:border-amber-400/40 hover:from-amber-400/25 transition-all duration-300"
          >
            <span className="flex items-center justify-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z"/>
              </svg>
              FOUNDING 申込はこちら
              <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>

          <div className="flex items-center gap-3 px-2 pt-1.5 pb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-[12px] font-black shrink-0 shadow-lg shadow-cyan-500/20">
              B
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-white/90 truncate">Hair Salon BLOOM</p>
              <p className="text-[9px] text-white/30 tracking-wider font-medium">DEMO MODE</p>
            </div>
          </div>

          <div className="flex gap-1 px-1">
            <Link
              href="/business"
              className="flex-1 flex items-center justify-center gap-1 text-[10px] text-white/30 hover:text-white/60 py-1.5 rounded-lg hover:bg-white/[0.04] transition-all"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              LP
            </Link>
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-1 text-[10px] text-white/30 hover:text-white/60 py-1.5 rounded-lg hover:bg-white/[0.04] transition-all"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              B2C
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-[280px] bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white z-50 lg:hidden flex flex-col shadow-2xl">
            <div className="px-5 pt-5 pb-4 border-b border-white/[0.06] flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
                <Logo size={28} radius={7} priority />
                <div className="leading-tight">
                  <p className="text-[13px] font-black tracking-tight bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                    SWIPLY
                  </p>
                  <p className="text-[8px] tracking-[0.25em] text-white/30 font-bold">
                    FOR BUSINESS
                  </p>
                </div>
              </Link>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {NAV_ITEMS.map((item, i) => {
                const active = isActive(item);
                const showDivider = i === NAV_ITEMS.length - 1;
                return (
                  <div key={item.href}>
                    {showDivider && <div className="my-3 border-t border-white/[0.06]" />}
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl text-[14px] font-bold transition ${
                        active
                          ? "bg-white/10 text-white"
                          : "text-white/40 hover:text-white/70 hover:bg-white/5"
                      }`}
                    >
                      <span className={active ? "text-cyan-400" : ""}>{item.icon}</span>
                      {item.label}
                    </Link>
                  </div>
                );
              })}
            </nav>
            <div className="px-4 py-4 border-t border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-[12px] font-black shrink-0">
                  B
                </div>
                <div>
                  <p className="text-[12px] font-bold text-white">Hair Salon BLOOM</p>
                  <p className="text-[9px] text-white/30 tracking-wider">DEMO MODE</p>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 px-4 lg:px-8 h-14 flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-1.5 -ml-1 text-gray-500 hover:text-gray-900 transition"
            aria-label="メニューを開く"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="lg:hidden flex items-center gap-2">
            <Logo size={24} radius={6} priority />
            <span className="text-[13px] font-black tracking-tight text-gray-900">SWIPLY</span>
          </div>

          <div className="flex-1" />

          {/* Notification bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="relative p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              aria-label="通知"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-black flex items-center justify-center shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-[360px] max-h-[420px] bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-[14px] font-extrabold text-gray-900">通知</h3>
                  {unreadCount > 0 && (
                    <span className="text-[11px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                      {unreadCount}件の未読
                    </span>
                  )}
                </div>
                <div className="overflow-y-auto max-h-[360px] divide-y divide-gray-50">
                  {notifications.map((n) => {
                    const meta = NOTIF_ICON[n.type];
                    return (
                      <div
                        key={n.id}
                        className={`px-4 py-3 flex gap-3 hover:bg-gray-50/50 transition cursor-pointer ${
                          !n.read ? "bg-blue-50/30" : ""
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {n.avatar ? (
                            <div className="relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={n.avatar} alt="" className="w-9 h-9 rounded-xl object-cover" />
                              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${meta.bg} flex items-center justify-center shadow-sm`}>
                                {meta.icon}
                              </div>
                            </div>
                          ) : (
                            <div className={`w-9 h-9 rounded-xl ${meta.bg} flex items-center justify-center`}>
                              {meta.icon}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-bold text-gray-900">{n.title}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{relativeTimeShort(n.time)}前</p>
                        </div>
                        {!n.read && (
                          <div className="shrink-0 mt-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <Link
            href="/business"
            className="hidden md:inline-flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-gray-600 transition px-2 py-1.5 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            LP
          </Link>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-[11px] font-black shadow-md shadow-cyan-500/20">
            B
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
