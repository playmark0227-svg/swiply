/**
 * Matching + messaging service.
 *
 * "LIKE" goes one direction (user → job). When the company also signals
 * interest, a Match is formed and a message thread opens. For the demo,
 * we simulate the company side with a probabilistic auto-match on LIKE
 * + scripted NPC replies after a short delay.
 *
 * Storage layout (localStorage):
 *   "swiply-matches"   → Match[]
 *   "swiply-messages"  → { [matchId]: Message[] }
 *
 * For real production, both should move to Firestore with realtime
 * snapshots; the SWIPLY frontend already speaks the dynamic-import
 * Firestore pattern, so the migration is contained.
 */

import { adminCreateNotification } from "@/lib/services/notifications";

export type MatchStatus = "active" | "archived";

export interface Match {
  id: string;
  jobId: string;
  jobTitle: string;
  jobCompany: string;
  jobImage: string;
  matchedAt: string;
  /** Last message preview for the list view. */
  lastMessage: string;
  /** ISO; updated on every new message. */
  lastMessageAt: string;
  /** Unread count for the user side. */
  unread: number;
  status: MatchStatus;
}

export type MessageSender = "user" | "company" | "system";

export interface Message {
  id: string;
  matchId: string;
  sender: MessageSender;
  senderName: string;
  body: string;
  sentAt: string;
}

const MATCHES_KEY = "swiply-matches";
const MESSAGES_KEY = "swiply-messages";
/** Custom event name. Components subscribe to react to changes from this tab. */
const CHANGE_EVENT = "swiply-matches-changed";

// ---------- Storage primitives ----------

function readMatches(): Match[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MATCHES_KEY);
    return raw ? (JSON.parse(raw) as Match[]) : [];
  } catch {
    return [];
  }
}

function writeMatches(list: Match[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MATCHES_KEY, JSON.stringify(list));
  notifyChange();
}

function readAllMessages(): Record<string, Message[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Message[]>) : {};
  } catch {
    return {};
  }
}

function writeAllMessages(map: Record<string, Message[]>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(map));
  notifyChange();
}

function notifyChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------- Public API ----------

export function getMatches(): Match[] {
  return readMatches().sort((a, b) =>
    a.lastMessageAt < b.lastMessageAt ? 1 : -1
  );
}

export function getMatchById(id: string): Match | undefined {
  return readMatches().find((m) => m.id === id);
}

export function getMessagesFor(matchId: string): Message[] {
  return (readAllMessages()[matchId] ?? []).sort((a, b) =>
    a.sentAt < b.sentAt ? -1 : 1
  );
}

export function getTotalUnread(): number {
  return readMatches().reduce((sum, m) => sum + (m.unread ?? 0), 0);
}

/**
 * Subscribe to match/message changes. Fires on any storage write from
 * THIS tab (custom event) or other tabs (storage event).
 */
export function subscribeMatches(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onChange = () => handler();
  const onStorage = (e: StorageEvent) => {
    if (e.key === MATCHES_KEY || e.key === MESSAGES_KEY) handler();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Probability the company "likes back" when the user LIKEs a job.
 * Cards with `featured` are slightly more likely.
 */
export function maybeMatch(input: {
  jobId: string;
  jobTitle: string;
  jobCompany: string;
  jobImage: string;
  featured?: boolean;
}): Match | null {
  const baseChance = input.featured ? 0.55 : 0.4;
  if (Math.random() > baseChance) return null;
  const existing = readMatches().find((m) => m.jobId === input.jobId);
  if (existing) return existing; // don't double-match
  return createMatch(input);
}

function pickIntroMessage(company: string, jobTitle: string): string {
  const candidates = [
    `はじめまして、${company} の採用担当です！「${jobTitle}」のご応募ありがとうございます🙇‍♀️`,
    `${company}です。プロフィール拝見しました！${jobTitle}の件で少しお話できれば嬉しいです✨`,
    `マッチありがとうございます！${jobTitle}についてご質問あれば気軽にどうぞ🌿`,
    `${company} です。採用担当の佐藤と申します。${jobTitle}にご興味いただきありがとうございます！`,
    `${company}です✨ 一緒にお仕事できたら嬉しいです。まず簡単に自己紹介を伺ってもいいですか？`,
  ];
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function pickFollowupMessage(): string {
  const candidates = [
    "週末でしたら午後の方が動きやすいです🌞 ご都合いかがですか？",
    "オンラインでも対面でも大丈夫です◎ ご希望ありますか？",
    "気になる点や不安な点、なんでも聞いてくださいね🌷",
    "履歴書はSWIPLY 内のプロフィールで十分ですので、お気軽にお話しましょう！",
    "30分くらいのカジュアル面談から、いかがですか☕",
    "何時頃なら時間取れそうですか？",
    "なるほど、ありがとうございます！もう少し詳しく教えてもらえますか？",
    "了解しました🙆 こちらでも検討してまた連絡しますね！",
  ];
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function createMatch(input: {
  jobId: string;
  jobTitle: string;
  jobCompany: string;
  jobImage: string;
}): Match {
  const now = new Date().toISOString();
  const matchId = genId("match");
  const match: Match = {
    id: matchId,
    jobId: input.jobId,
    jobTitle: input.jobTitle,
    jobCompany: input.jobCompany,
    jobImage: input.jobImage,
    matchedAt: now,
    lastMessage: "🎉 マッチしました！",
    lastMessageAt: now,
    unread: 1,
    status: "active",
  };

  // Persist match
  const list = readMatches();
  list.unshift(match);
  writeMatches(list);

  // Initial system message
  appendMessage(matchId, {
    sender: "system",
    senderName: "SWIPLY",
    body: `🎉 ${input.jobCompany} とマッチしました！メッセージで気軽にやり取りしてみよう。`,
  });

  // In-app notification
  try {
    adminCreateNotification({
      type: "like",
      title: `${input.jobCompany} とマッチしました！`,
      body: `「${input.jobTitle}」でマッチが成立しました。メッセージから話してみよう。`,
      href: "/messages",
    });
  } catch {
    // ignore — notifications are best-effort
  }

  // Schedule a company "intro" message after a short delay
  scheduleNpcMessage(matchId, pickIntroMessage(input.jobCompany, input.jobTitle), 1800);

  // Optional: external LINE push. Best-effort, fails silently if not
  // configured. See COWORK_LINE_NOTIFICATIONS.md.
  void notifyExternalChannel({
    title: `${input.jobCompany} とマッチしました！`,
    body: `「${input.jobTitle}」でマッチ成立🎉 SWIPLYでメッセージを開いてください。`,
    href: "/messages",
  });

  return match;
}

export function appendMessage(
  matchId: string,
  input: { sender: MessageSender; senderName: string; body: string }
): Message {
  const now = new Date().toISOString();
  const msg: Message = {
    id: genId("msg"),
    matchId,
    sender: input.sender,
    senderName: input.senderName,
    body: input.body,
    sentAt: now,
  };
  const all = readAllMessages();
  const arr = all[matchId] ?? [];
  arr.push(msg);
  all[matchId] = arr;
  writeAllMessages(all);

  // Update parent match preview + unread
  const matches = readMatches();
  const idx = matches.findIndex((m) => m.id === matchId);
  if (idx >= 0) {
    const wasUserMessage = input.sender === "user";
    matches[idx] = {
      ...matches[idx],
      lastMessage: input.body,
      lastMessageAt: now,
      unread: wasUserMessage ? matches[idx].unread : matches[idx].unread + 1,
    };
    writeMatches(matches);
  }
  return msg;
}

export function sendUserMessage(matchId: string, body: string, displayName: string): void {
  if (!body.trim()) return;
  appendMessage(matchId, {
    sender: "user",
    senderName: displayName || "あなた",
    body: body.trim(),
  });

  // Schedule an auto-reply from the company (1.5–4s)
  const delay = 1500 + Math.random() * 2500;
  scheduleNpcMessage(matchId, pickFollowupMessage(), delay);
}

export function markRead(matchId: string): void {
  const matches = readMatches();
  const idx = matches.findIndex((m) => m.id === matchId);
  if (idx < 0 || matches[idx].unread === 0) return;
  matches[idx] = { ...matches[idx], unread: 0 };
  writeMatches(matches);
}

export function archiveMatch(matchId: string): void {
  const matches = readMatches().map((m) =>
    m.id === matchId ? { ...m, status: "archived" as MatchStatus } : m
  );
  writeMatches(matches);
}

export function deleteMatch(matchId: string): void {
  writeMatches(readMatches().filter((m) => m.id !== matchId));
  const all = readAllMessages();
  delete all[matchId];
  writeAllMessages(all);
}

// ---------- Internals ----------

function scheduleNpcMessage(matchId: string, body: string, delayMs: number) {
  if (typeof window === "undefined") return;
  setTimeout(() => {
    const match = getMatchById(matchId);
    if (!match || match.status === "archived") return;
    appendMessage(matchId, {
      sender: "company",
      senderName: match.jobCompany,
      body,
    });
  }, delayMs);
}

interface ExternalNotifyPayload {
  title: string;
  body: string;
  href?: string;
}

/**
 * Best-effort LINE push notification.
 *
 * NEXT_PUBLIC_LINE_NOTIFY_URL points at the Cloudflare Workers deployment
 * (`workers/swiply-line-notify/`). It accepts:
 *
 *   POST /notify { recipientLoginUserId, title, body, href? }
 *
 * The Workers side looks up `link:{recipientLoginUserId}` in KV — which
 * is populated only after the user has tapped "LINE通知を有効化" on the
 * profile screen and sent the pair code in their LINE chat. If the user
 * hasn't linked, the Worker returns `{ ok: false, reason: "not_linked" }`
 * with status 200 — we treat that as silent success.
 *
 * This function fires-and-forgets: any failure is swallowed so it never
 * blocks the in-app match flow.
 */
async function notifyExternalChannel(payload: ExternalNotifyPayload): Promise<void> {
  if (typeof window === "undefined") return;
  const endpoint = (process.env.NEXT_PUBLIC_LINE_NOTIFY_URL || "").replace(/\/$/, "");
  if (!endpoint) return;

  // Pull the LINE Login channel userId from the current session.
  // (uid format: "line-Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
  let recipientLoginUserId: string | null = null;
  try {
    const raw = localStorage.getItem("swiply-session");
    if (raw) {
      const session = JSON.parse(raw) as { uid?: string };
      if (session.uid?.startsWith("line-")) {
        recipientLoginUserId = session.uid.slice("line-".length);
      }
    }
  } catch {
    // ignore
  }
  if (!recipientLoginUserId) return;

  try {
    await fetch(`${endpoint}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientLoginUserId,
        title: payload.title,
        body: payload.body,
        href: payload.href,
      }),
    });
  } catch {
    // best-effort
  }
}
