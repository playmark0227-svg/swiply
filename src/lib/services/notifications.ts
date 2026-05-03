/**
 * Notifications service.
 *
 * The consumer notifications page reads from this; the admin console can
 * create / edit / delete entries here. Persisted to localStorage.
 *
 * key: "swiply-notifications" → Notification[]
 */

export type NotificationType = "new" | "like" | "system" | "application";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** ISO timestamp; UI renders relative time. */
  createdAt: string;
  read: boolean;
  /** Optional click-through path. */
  href?: string;
}

const KEY = "swiply-notifications";

const SEED: Notification[] = [
  {
    id: "n-1",
    type: "application",
    title: "応募が選考中になりました",
    body: "「カフェ ブルーム」のステータスが書類選考中に更新されました。",
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    read: false,
    href: "/applications",
  },
  {
    id: "n-2",
    type: "new",
    title: "新着求人が3件追加されました",
    body: "あなたの希望条件にマッチする求人が新たに掲載されました。",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
    href: "/search",
  },
  {
    id: "n-3",
    type: "like",
    title: "LIKE した求人が更新されました",
    body: "カフェ ブルームの求人情報が更新されました。",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    read: false,
    href: "/likes",
  },
  {
    id: "n-4",
    type: "system",
    title: "プロフィールを完成させましょう",
    body: "プロフィールを充実させると、企業からのスカウト率がアップします。",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    href: "/profile",
  },
  {
    id: "n-5",
    type: "new",
    title: "おすすめ求人があります",
    body: "フロントエンドエンジニアの求人があなたにおすすめです。",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    href: "/search",
  },
];

function read(): Notification[] {
  if (typeof window === "undefined") return SEED;
  const raw = localStorage.getItem(KEY);
  if (raw == null) {
    // First visit: seed and return.
    localStorage.setItem(KEY, JSON.stringify(SEED));
    return SEED;
  }
  try {
    return JSON.parse(raw) as Notification[];
  } catch {
    return SEED;
  }
}

function write(list: Notification[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function getNotifications(): Notification[] {
  return read().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getUnreadCount(): number {
  return read().filter((n) => !n.read).length;
}

export function markRead(id: string): void {
  write(read().map((n) => (n.id === id ? { ...n, read: true } : n)));
}

export function markAllRead(): void {
  write(read().map((n) => ({ ...n, read: true })));
}

export function adminCreateNotification(input: {
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
}): Notification {
  const n: Notification = {
    id: `n-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    type: input.type,
    title: input.title,
    body: input.body,
    href: input.href,
    createdAt: new Date().toISOString(),
    read: false,
  };
  write([n, ...read()]);
  return n;
}

export function adminUpdateNotification(
  id: string,
  patch: Partial<Omit<Notification, "id" | "createdAt">>
): void {
  write(read().map((n) => (n.id === id ? { ...n, ...patch } : n)));
}

export function adminDeleteNotification(id: string): void {
  write(read().filter((n) => n.id !== id));
}

export function adminClearNotifications(): void {
  write([]);
}

/** Re-seed the notification list with the original demo data. */
export function adminResetNotifications(): void {
  write(SEED);
}

export const TYPE_LABEL: Record<NotificationType, string> = {
  new: "新着",
  like: "LIKE",
  system: "システム",
  application: "応募",
};

export const TYPE_COLOR: Record<NotificationType, string> = {
  new: "bg-violet-50 text-violet-600 border-violet-200",
  like: "bg-pink-50 text-pink-600 border-pink-200",
  system: "bg-gray-100 text-gray-500 border-gray-200",
  application: "bg-emerald-50 text-emerald-700 border-emerald-200",
};
