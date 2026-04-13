"use client";

import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

const notifications = [
  {
    id: "1",
    type: "new" as const,
    title: "新着求人が追加されました",
    body: "あなたの希望条件に合う求人が3件追加されました。",
    time: "1時間前",
    read: false,
  },
  {
    id: "2",
    type: "like" as const,
    title: "LIKE した求人が更新されました",
    body: "カフェ ブルームの求人情報が更新されました。",
    time: "3時間前",
    read: false,
  },
  {
    id: "3",
    type: "system" as const,
    title: "プロフィールを完成させましょう",
    body: "プロフィールを充実させると、企業からのスカウト率がアップします。",
    time: "1日前",
    read: true,
  },
  {
    id: "4",
    type: "new" as const,
    title: "おすすめ求人",
    body: "フロントエンドエンジニアの求人があなたにおすすめです。",
    time: "2日前",
    read: true,
  },
];

const typeIcon = {
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
};

export default function NotificationsPage() {
  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">
      <Header />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-4 pb-20">
        <h1 className="text-lg font-extrabold text-gray-900 mb-4">お知らせ</h1>

        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex gap-3 p-3.5 rounded-2xl border transition-colors ${
                n.read
                  ? "bg-white border-gray-100/50"
                  : "bg-violet-50/40 border-violet-100"
              }`}
            >
              {typeIcon[n.type]}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className={`text-[13px] leading-tight ${n.read ? "font-medium text-gray-600" : "font-bold text-gray-900"}`}>
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
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
