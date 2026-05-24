"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import {
  getCompanyThreads,
  type CompanyThread,
  type CompanyMessage,
} from "@/lib/services/companyDemo";

function relativeTime(iso: string): string {
  const diff = Date.now() - Date.parse(iso);
  if (Number.isNaN(diff)) return "";
  if (diff < 60_000) return "たった今";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}分前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)}時間前`;
  return `${Math.floor(diff / 86_400_000)}日前`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export default function DashboardMessagesPage() {
  const [threads] = useState(getCompanyThreads);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => threads.find((t) => t.id === selectedId) ?? null,
    [threads, selectedId]
  );

  return (
    <DashboardShell>
      <div className="flex flex-col h-[calc(100dvh-56px)]">
        {/* Demo banner */}
        <div className="shrink-0 mx-3 mt-3 relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 relative">
            <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center shrink-0">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <p className="text-[11px] font-bold text-white">デモモード — メッセージの送信は保存されません</p>
          </div>
          <a href="/business#contact" className="relative shrink-0 px-3 py-1 rounded-md bg-white/20 text-white text-[10px] font-bold hover:bg-white/30 transition">
            本番を始める →
          </a>
        </div>

        <div className="flex flex-1 min-h-0">
        {/* Thread list */}
        <aside
          className={`w-full md:w-[340px] md:border-r md:border-gray-100 bg-white shrink-0 flex flex-col ${
            selectedId ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="px-4 py-3 border-b border-gray-100">
            <h1 className="text-[16px] font-extrabold text-gray-900">メッセージ</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">候補者とのやり取り</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 ? (
              <div className="text-center py-16 text-[12px] text-gray-400">
                メッセージはまだありません
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {threads.map((t) => (
                  <li key={t.id}>
                    <button
                      onClick={() => setSelectedId(t.id)}
                      className={`w-full text-left px-4 py-3.5 hover:bg-gray-50/60 transition flex gap-3 ${
                        selectedId === t.id ? "md:bg-blue-50/40" : ""
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={t.applicantPhoto}
                        alt={t.applicantName}
                        className="w-11 h-11 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2 mb-0.5">
                          <p className="text-[13px] font-extrabold text-gray-900 truncate">
                            {t.applicantName}
                          </p>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {relativeTime(t.lastMessageAt)}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 truncate mb-0.5">{t.jobTitle}</p>
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-[12px] truncate ${t.unread > 0 ? "text-gray-900 font-bold" : "text-gray-500"}`}>
                            {t.lastMessage}
                          </p>
                          {t.unread > 0 && (
                            <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-[10px] font-black flex items-center justify-center">
                              {t.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Thread view */}
        <section
          className={`flex-1 flex flex-col min-w-0 ${
            selectedId ? "flex" : "hidden md:flex"
          }`}
        >
          {selected ? (
            <ThreadView
              thread={selected}
              onBack={() => setSelectedId(null)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-[13px] text-gray-400 bg-gray-50">
              左のリストからトークを選んでください
            </div>
          )}
        </section>
      </div>
        </div>
    </DashboardShell>
  );
}

function ThreadView({
  thread,
  onBack,
}: {
  thread: CompanyThread;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<CompanyMessage[]>(thread.messages);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(thread.messages);
  }, [thread.id, thread.messages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  function send() {
    if (!draft.trim()) return;
    const msg: CompanyMessage = {
      id: `cm-new-${Date.now()}`,
      sender: "company",
      senderName: "Hair Salon BLOOM",
      body: draft.trim(),
      sentAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
    setDraft("");
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={onBack}
          className="md:hidden p-1 text-gray-500"
          aria-label="戻る"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thread.applicantPhoto}
          alt={thread.applicantName}
          className="w-9 h-9 rounded-lg object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-extrabold text-gray-900 truncate">{thread.applicantName}</p>
          <p className="text-[10px] text-gray-400 truncate">{thread.jobTitle}</p>
        </div>
        <button className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z" />
          </svg>
          ビデオ面接
        </button>
        <button className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold transition">
          プロフィール
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-gray-50 px-4 py-5 space-y-2">
        {messages.map((m) => {
          if (m.sender === "system") {
            return (
              <div key={m.id} className="flex justify-center my-3">
                <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold">
                  {m.body}
                </div>
              </div>
            );
          }
          const isCompany = m.sender === "company";
          return (
            <div key={m.id} className={`flex ${isCompany ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[75%]">
                {!isCompany && (
                  <p className="text-[10px] font-bold text-gray-400 mb-0.5 ml-1">
                    {m.senderName}
                  </p>
                )}
                <div className={`flex items-end gap-1.5 ${isCompany ? "flex-row-reverse" : ""}`}>
                  <div
                    className={`px-3.5 py-2 rounded-2xl text-[14px] leading-relaxed whitespace-pre-wrap break-words ${
                      isCompany
                        ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-br-md shadow-sm"
                        : "bg-white text-gray-900 border border-gray-100 rounded-bl-md"
                    }`}
                  >
                    {m.body}
                  </div>
                  <span className="text-[9px] text-gray-400 mb-1 shrink-0">{formatTime(m.sentAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 flex items-end gap-2 shrink-0">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="メッセージを入力…"
          className="flex-1 resize-none px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 max-h-32"
        />
        <button
          onClick={send}
          disabled={!draft.trim()}
          className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center shadow-md disabled:opacity-40 active:scale-95 transition"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </>
  );
}
