"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import { useAuth } from "@/components/AuthProvider";
import InterviewBookingModal from "@/components/InterviewBookingModal";
import { TrustBadgeRow } from "@/components/TrustBadges";
import { NoShowBadge } from "@/components/PenaltyBadges";
import {
  evaluateNoShows,
  getUserPenalty,
  subscribePenalties,
  type PenaltyState,
} from "@/lib/services/penalties";
import {
  type Match,
  type Message,
  archiveMatch,
  deleteMatch,
  getMatches,
  getMessagesFor,
  markRead,
  sendUserMessage,
  subscribeMatches,
} from "@/lib/services/matches";
import {
  type InterviewAppointment,
  getInterviewByMatchId,
  subscribeInterviews,
  timeUntil,
} from "@/lib/services/interviews";
import { getJobById } from "@/lib/services/jobs";
import type { Job } from "@/types/job";
import { haptic } from "@/lib/haptic";

function relativeTime(iso: string): string {
  const diff = Date.now() - Date.parse(iso);
  if (Number.isNaN(diff)) return "";
  if (diff < 60_000) return "たった今";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}分前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)}時間前`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}日前`;
  return new Date(iso).toLocaleDateString("ja-JP");
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

export default function MessagesPage() {
  const auth = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [penalty, setPenalty] = useState<PenaltyState | null>(null);

  // Subscribe to match/message changes
  useEffect(() => {
    const refresh = () => {
      setMatches(getMatches());
      if (selectedId) setMessages(getMessagesFor(selectedId));
    };
    refresh();
    return subscribeMatches(refresh);
  }, [selectedId]);

  // Penalty sweep + subscription. Read-only so we don't gate the page.
  useEffect(() => {
    evaluateNoShows();
    const refresh = () => setPenalty(getUserPenalty());
    refresh();
    return subscribePenalties(refresh);
  }, []);

  // Mark thread as read when opened
  useEffect(() => {
    if (!selectedId) return;
    markRead(selectedId);
    // External-source sync (mark-read writes to localStorage; we then
    // pull both the latest messages and the updated unread counts).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages(getMessagesFor(selectedId));
    setMatches(getMatches());
  }, [selectedId]);

  const selected = useMemo(
    () => matches.find((m) => m.id === selectedId) ?? null,
    [matches, selectedId]
  );

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">
      <Header />
      <main className="flex-1 max-w-lg md:max-w-6xl mx-auto w-full px-0 md:px-6 pt-0 md:pt-6 pb-16 md:pb-12">
        <div className="hidden md:block px-2 mb-4">
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-2xl font-extrabold text-gray-900">メッセージ</h1>
            {penalty && penalty.level !== "green" && (
              <NoShowBadge level={penalty.level} count={penalty.count} size="md" />
            )}
          </div>
          <p className="text-[12px] text-gray-500">
            マッチした企業とのトーク
          </p>
        </div>
        {penalty && penalty.level === "yellow" && (
          <div className="mx-3 md:mx-0 mb-3 md:mb-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-[12px] text-amber-800 leading-relaxed">
            <p className="font-extrabold mb-0.5">⚠️ 面接ブッチが1回記録されています</p>
            <p>
              次回ブッチで <span className="font-extrabold">1年間アカウント停止</span>
              になります。日程変更が必要な時は、面接前にメッセージで連絡を。
            </p>
          </div>
        )}

        <div className="md:grid md:grid-cols-[340px_1fr] md:gap-6 md:rounded-3xl md:bg-white md:border md:border-gray-100 md:overflow-hidden md:min-h-[70dvh]">
          {/* List */}
          <aside
            className={`md:border-r md:border-gray-100 ${
              selectedId ? "hidden md:block" : "block"
            }`}
          >
            <div className="px-4 py-3 md:px-5 md:py-4 border-b border-gray-100 md:border-b">
              <h2 className="md:hidden text-lg font-extrabold text-gray-900">
                メッセージ
              </h2>
              <p className="hidden md:block text-[10px] tracking-[0.25em] font-bold text-gray-400 uppercase">
                MATCHES — {matches.length}
              </p>
            </div>
            {matches.length === 0 ? (
              <EmptyMatches />
            ) : (
              <ul className="divide-y divide-gray-50">
                {matches.map((m) => (
                  <li key={m.id}>
                    <button
                      onClick={() => {
                        haptic("tick");
                        setSelectedId(m.id);
                      }}
                      className={`w-full text-left px-4 md:px-5 py-3.5 hover:bg-gray-50/60 transition flex gap-3 ${
                        selectedId === m.id ? "md:bg-violet-50/40" : ""
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={m.jobImage}
                        alt={m.jobCompany}
                        className="w-12 h-12 rounded-2xl object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2 mb-0.5">
                          <p className="text-[13px] font-extrabold text-gray-900 truncate">
                            {m.jobCompany}
                          </p>
                          <p className="text-[10px] text-gray-400 shrink-0">
                            {relativeTime(m.lastMessageAt)}
                          </p>
                        </div>
                        <p className="text-[11px] text-gray-500 truncate mb-0.5">
                          {m.jobTitle}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-[12px] truncate ${
                              m.unread > 0
                                ? "text-gray-900 font-bold"
                                : "text-gray-500"
                            }`}
                          >
                            {m.lastMessage}
                          </p>
                          {m.unread > 0 && (
                            <span className="shrink-0 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[10px] font-black tabular-nums">
                              {m.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          {/* Thread */}
          <section
            className={`${selectedId ? "block" : "hidden md:block"} md:flex md:flex-col`}
          >
            {selected ? (
              <ThreadView
                key={selected.id}
                match={selected}
                messages={messages}
                userDisplayName={auth.session?.displayName ?? "あなた"}
                onBack={() => setSelectedId(null)}
                onArchive={() => {
                  if (!confirm("このトークをアーカイブしますか？")) return;
                  archiveMatch(selected.id);
                  setSelectedId(null);
                }}
                onDelete={() => {
                  if (!confirm("このトークを完全に削除しますか？")) return;
                  deleteMatch(selected.id);
                  setSelectedId(null);
                }}
              />
            ) : (
              <DesktopThreadPlaceholder hasMatches={matches.length > 0} />
            )}
          </section>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

function ThreadView({
  match,
  messages,
  userDisplayName,
  onBack,
  onArchive,
  onDelete,
}: {
  match: Match;
  messages: Message[];
  userDisplayName: string;
  onBack: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [interview, setInterview] = useState<InterviewAppointment | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Pull the underlying Job so we can show trust badges (verified /
  // founding / instant-interview) in the thread header.
  useEffect(() => {
    let cancelled = false;
    getJobById(match.jobId).then((j) => {
      if (!cancelled) setJob(j ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [match.jobId]);

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  // Track the most-recent interview attached to this match. Re-runs on
  // any interview state change (booking, completion, cancel, etc.).
  useEffect(() => {
    const refresh = () =>
      setInterview(getInterviewByMatchId(match.id) ?? null);
    refresh();
    return subscribeInterviews(refresh);
  }, [match.id]);

  // Tick once a minute so the relative-time label stays fresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  function send() {
    if (!draft.trim()) return;
    haptic("success");
    sendUserMessage(match.id, draft, userDisplayName);
    setDraft("");
  }

  return (
    <div className="fixed inset-0 z-40 bg-white md:relative md:inset-auto md:z-auto md:flex md:flex-col md:flex-1">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-3 py-2 md:px-5 md:py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          aria-label="戻る"
          className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-gray-700 hover:bg-gray-100 active:scale-90 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <Link
          href={`/job/${match.jobId}/`}
          className="flex items-center gap-3 min-w-0 flex-1 group"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={match.jobImage}
            alt={match.jobCompany}
            className="w-10 h-10 rounded-xl object-cover shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="text-sm font-extrabold text-gray-900 truncate group-hover:text-violet-600 transition">
                {match.jobCompany}
              </p>
              {job && (
                <TrustBadgeRow job={job} size="sm" interactive className="shrink-0" />
              )}
            </div>
            <p className="text-[11px] text-gray-500 truncate">{match.jobTitle}</p>
          </div>
        </Link>
        <button
          onClick={() => {
            haptic("tick");
            setBookingOpen(true);
          }}
          aria-label="ビデオ面接を予約"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-100 text-[11px] font-extrabold transition"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z" />
          </svg>
          ビデオ面接
        </button>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="メニュー"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="5" cy="12" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="19" cy="12" r="1.5" />
            </svg>
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden min-w-[180px]">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setBookingOpen(true);
                  }}
                  className="md:hidden block w-full text-left px-4 py-2.5 text-[12px] text-violet-700 font-bold hover:bg-violet-50"
                >
                  📹 ビデオ面接を予約
                </button>
                <Link
                  href={`/job/${match.jobId}/`}
                  className="block px-4 py-2.5 text-[12px] text-gray-700 hover:bg-gray-50"
                >
                  求人詳細を見る
                </Link>
                <Link
                  href={`/brand/?company=${encodeURIComponent(match.jobCompany)}`}
                  className="block px-4 py-2.5 text-[12px] text-gray-700 hover:bg-gray-50"
                >
                  会社ブランドページ
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onArchive();
                  }}
                  className="block w-full text-left px-4 py-2.5 text-[12px] text-gray-700 hover:bg-gray-50"
                >
                  アーカイブ
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="block w-full text-left px-4 py-2.5 text-[12px] text-rose-500 hover:bg-rose-50"
                >
                  削除
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Interview banner */}
      {interview && interview.status !== "cancelled" && (
        <InterviewBanner interview={interview} />
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-gray-50 px-3 py-4 md:px-5 space-y-2"
      >
        {messages.length === 0 && (
          <div className="text-center text-[12px] text-gray-400 py-12">
            メッセージはまだありません
          </div>
        )}
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const showSenderLabel =
            m.sender !== "user" &&
            m.sender !== "system" &&
            (!prev || prev.sender !== m.sender);
          if (m.sender === "system") {
            return (
              <div key={m.id} className="flex justify-center my-3">
                <div className="px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-[11px] font-bold">
                  {m.body}
                </div>
              </div>
            );
          }
          const isUser = m.sender === "user";
          return (
            <AnimatePresence key={m.id} initial={false}>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[78%] md:max-w-[60%]`}>
                  {showSenderLabel && (
                    <p className="text-[10px] font-bold text-gray-400 mb-0.5 ml-1">
                      {m.senderName}
                    </p>
                  )}
                  <div
                    className={`flex items-end gap-1.5 ${
                      isUser ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div
                      className={`px-3.5 py-2 rounded-2xl text-[14px] leading-relaxed whitespace-pre-wrap break-words ${
                        isUser
                          ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white rounded-br-md shadow-sm"
                          : "bg-white text-gray-900 border border-gray-100 rounded-bl-md"
                      }`}
                    >
                      {m.body}
                    </div>
                    <span className="text-[9px] text-gray-400 mb-1 shrink-0">
                      {formatTime(m.sentAt)}
                    </span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          );
        })}
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-3 py-2 md:px-4 md:py-3 flex items-end gap-2">
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
          className="flex-1 resize-none px-3.5 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 max-h-32"
        />
        <button
          onClick={send}
          disabled={!draft.trim()}
          aria-label="送信"
          className="shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center shadow-md shadow-violet-200/60 disabled:opacity-40 active:scale-95 transition"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>

      {/* Booking modal — parent-controlled mount so initial state resets. */}
      {bookingOpen && (
        <InterviewBookingModal
          onClose={() => setBookingOpen(false)}
          match={{
            id: match.id,
            jobId: match.jobId,
            jobTitle: match.jobTitle,
            jobCompany: match.jobCompany,
            jobImage: match.jobImage,
          }}
        />
      )}
    </div>
  );
}

/**
 * Banner that surfaces the most-recent interview for the active thread.
 * Shows status, relative time-until, and primary CTA (join / view report).
 */
function InterviewBanner({ interview }: { interview: InterviewAppointment }) {
  const status = interview.status;
  const tu = timeUntil(interview.scheduledAt);
  const completed = status === "completed";
  const hasReport =
    !!interview.analysisForUser || !!interview.analysisForCompany;
  const inProgress = status === "in_progress";

  // The "join" action is enabled within ±10min of the scheduled time, or
  // any time after if status hasn't moved to completed/cancelled.
  const canJoin =
    !completed &&
    status !== "cancelled" &&
    (tu.state === "now" ||
      tu.state === "past" ||
      Math.abs(tu.diffMs) < 10 * 60_000);

  const cta = completed
    ? hasReport
      ? {
          href: `/interview/analysis/?id=${interview.id}&mode=user`,
          label: "AI 振り返りを見る",
        }
      : null
    : canJoin
      ? {
          href: `/interview/?id=${interview.id}&mode=user`,
          label: inProgress ? "面接に戻る" : "面接に参加",
        }
      : null;

  const accent = completed
    ? "from-emerald-50 to-teal-50 border-emerald-100 text-emerald-800"
    : tu.state === "now"
      ? "from-rose-50 to-fuchsia-50 border-rose-100 text-rose-800"
      : "from-violet-50 to-fuchsia-50 border-violet-100 text-violet-800";

  const label = completed
    ? "📹 面接終了"
    : tu.state === "now"
      ? "🔴 面接中"
      : `📹 ${tu.label}に面接`;

  return (
    <div
      className={`mx-3 md:mx-5 mt-3 rounded-2xl border bg-gradient-to-r ${accent} px-4 py-3 flex items-center gap-3`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-extrabold mb-0.5">{label}</p>
        <p className="text-[10px] opacity-80 truncate">
          {new Date(interview.scheduledAt).toLocaleString("ja-JP", {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          ・ {interview.durationMinutes}分
          {interview.title ? ` ・ ${interview.title}` : ""}
        </p>
      </div>
      {cta && (
        <Link
          href={cta.href}
          className="shrink-0 px-3.5 py-1.5 rounded-xl bg-white/95 border border-current/30 text-[11px] font-extrabold hover:bg-white active:scale-95 transition"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}

function EmptyMatches() {
  return (
    <div className="text-center py-16 px-6">
      <Logo
        size={56}
        radius={16}
        className="mx-auto mb-3 shadow-md shadow-violet-200/40 ring-2 ring-white"
      />
      <p className="text-[10px] tracking-[0.3em] font-black bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent mb-2">
        SWIPLY
      </p>
      <p className="text-sm font-bold text-gray-900 mb-1">
        まだマッチがありません
      </p>
      <p className="text-xs text-gray-400 mb-5 leading-relaxed">
        スワイプで気になる求人にLIKEして、
        <br />
        マッチが成立するとここでメッセージできるよ
      </p>
      <Link
        href="/swipe"
        className="inline-block px-6 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-2xl font-bold text-sm shadow-md shadow-violet-200/50"
      >
        スワイプで探す
      </Link>
    </div>
  );
}

function DesktopThreadPlaceholder({ hasMatches }: { hasMatches: boolean }) {
  return (
    <div className="hidden md:flex flex-col items-center justify-center text-center px-8 py-16 text-gray-400 min-h-[60dvh]">
      <Logo size={48} radius={14} className="mb-4 opacity-60" />
      <p className="text-[13px] font-bold text-gray-500">
        {hasMatches ? "左のリストからトークを選んでください" : "マッチが成立すると、ここにメッセージが表示されます"}
      </p>
    </div>
  );
}
