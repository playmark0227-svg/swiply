"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/",
    label: "ホーム",
    exact: true,
    activeIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.71 2.29a1 1 0 00-1.42 0l-9 9a1 1 0 000 1.42A1 1 0 003 13h1v7a2 2 0 002 2h12a2 2 0 002-2v-7h1a1 1 0 00.71-1.71zM9 20v-5a1 1 0 011-1h4a1 1 0 011 1v5z" />
      </svg>
    ),
    inactiveIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    href: "/baito",
    label: "バイト",
    activeIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 6h-4V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2H4a2 2 0 00-2 2v11a3 3 0 003 3h14a3 3 0 003-3V8a2 2 0 00-2-2zM10 4h4v2h-4zM21 13a23.86 23.86 0 01-9 2 23.86 23.86 0 01-9-2V8a1 1 0 011-1h16a1 1 0 011 1z" />
      </svg>
    ),
    inactiveIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0h2a2 2 0 012 2v6.764A23.859 23.859 0 0112 17.5a23.86 23.86 0 01-10-2.736V8a2 2 0 012-2h2" />
      </svg>
    ),
  },
  // Center swipe tab — handled separately below
  {
    href: "/swipe",
    label: "スワイプ",
    center: true,
  },
  {
    href: "/career",
    label: "正社員",
    activeIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 2H5a3 3 0 00-3 3v14a3 3 0 003 3h14a3 3 0 003-3V5a3 3 0 00-3-3zm-8 15v-4a1 1 0 011-1h2a1 1 0 011 1v4zm6 0h-2v-4a3 3 0 00-3-3h-2a3 3 0 00-3 3v4H5V5h14zM9 7h2v2H9zm4 0h2v2h-2z" />
      </svg>
    ),
    inactiveIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "マイページ",
    activeIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5.33 0-8 2.67-8 4v1a1 1 0 001 1h14a1 1 0 001-1v-1c0-1.33-2.67-4-8-4z" />
      </svg>
    ),
    inactiveIcon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  function isActive(tab: (typeof tabs)[number]) {
    if ("exact" in tab && tab.exact) return pathname === tab.href;
    return pathname === tab.href || pathname.startsWith(tab.href + "/");
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-end justify-around h-[56px] px-1">
        {tabs.map((tab) => {
          const active = isActive(tab);

          // Center swipe button — prominent gradient style
          if ("center" in tab && tab.center) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center justify-center flex-1 -mt-3"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-90 ${
                    active
                      ? "bg-gradient-to-br from-violet-600 to-fuchsia-500 shadow-violet-300"
                      : "bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-violet-200"
                  }`}
                >
                  {/* Swipe icon */}
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <span className={`text-[9px] mt-1 leading-none ${active ? "font-bold text-violet-600" : "font-medium text-gray-400"}`}>
                  {tab.label}
                </span>
              </Link>
            );
          }

          // Regular tab
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                active ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {active ? tab.activeIcon : tab.inactiveIcon}
              <span className={`text-[9px] mt-0.5 leading-none ${active ? "font-bold" : "font-medium"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
