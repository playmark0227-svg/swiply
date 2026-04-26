"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { haptic } from "@/lib/haptic";

type NotifType = "new" | "like" | "system" | "application";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  href?: string;
}

const SEED: Notification[] = [
  {
    id: "1",
    type: "application",
    title: "応募が選考中になりました",
    body: "「カフェ ブルーム」のステータスが書類選考中に更新されました。",
    time: "1時間前",
    read: false,
    href: "/applications",
  },
  {
    id: "2",
    type: "new",
    title: "新着求人が3件追加されました",
    body: "あなたの希望条件にマッチする求人が新たに掲載されました。",
    time: "2時間前",
    read: false,
    href: "/search",
  },
  {
    id: "3",
    type: "like",
    title: "LIKE した求人が更新されました",
    body: "カフェ ブルームの求人情報が更新されました。",
    time: "3時間前",
    read: false,
    href: "/likes",
  },
  {
    id: "4",
    type: "system",
    title: "プロフィールを完成させましょう",
    body: "プロフィールを充実させると、企業からのスカウト率がアップします。",
    time: "1日前",
    read: true,
    href: "/profile",
  },
  {
    id: "5",
    type: "new",
    title: "おすすめ求人があります",
    body: "フロントエンドエンジニアの求人があなたにおすすめです。",
    time: "2日前",
    read: true,
    href: "/search",
  },
];

const typeIcon: Record<NotifType, React.ReactNode> = {
  new: (
    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
      <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0h2a2 2 0 012 2v6.764A23.859 23.859 0 0112 17.5a23.86 23.86 0 01-10-2.736V8a2 2 0 012-2h2" />
      </svg>
    </div>
  ),
  like: (
    <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center shrink-0">
      <svg className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </div>
  ),
  system: (
    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
  ),
  application: (
    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
      <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    </div>
  ),
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>(SEED);
  const unread = items.filter((n) => !n.read).length;

  function markAllRead() {
    haptic("tick");
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">
      <Header />
      <main className="flex-1 max-w-lg md:max-w-3xl mx-auto w-full px-4 md:px-8 pt-4 md:pt-10 pb-20 md:pb-16">
        <div className="flex items-end justify-between mb-4 md:mb-6">
          <div>
            <h1 className="text-lg md:text-2xl font-extrabold text-gray-900">お知らせ</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">
              全{items.length}件 ／ 未読 {unread}件
            </p>
          </div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="text-[11px] font-bold text-violet-600 hover:underline"
            >
              すべて既読にする
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {items.map((n) => {
              const card = (
                <div
                  className={`flex gap-3 p-3.5 rounded-2xl border transition-colors ${
                    n.read
                      ? "bg-white border-gray-100/50"
                      : "bg-violet-50/40 border-violet-100"
                  }`}
                >
                  {typeIcon[n.type]}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className={`text-[13px] leading-tight ${
                          n.read ? "font-medium text-gray-600" : "font-bold text-gray-900"
                        }`}
                      >
                        {n.title}
                      </h3>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{n.body}</p>
                    <p className="text-[10px] text-gray-300 mt-1.5">{n.time}</p>
                  </div>
                </div>
              );
              return n.href ? (
                <Link key={n.id} href={n.href} onClick={() => markRead(n.id)}>
                  {card}
                </Link>
              ) : (
                <button key={n.id} onClick={() => markRead(n.id)} className="w-full text-left">
                  {card}
                </button>
              );
            })}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
      <div className="text-3xl mb-2">🔔</div>
      <p className="text-sm font-bold text-gray-900 mb-1">お知らせはありません</p>
      <p className="text-xs text-gray-400">新着求人や応募ステータスをここでお知らせします</p>
    </div>
  );
}
