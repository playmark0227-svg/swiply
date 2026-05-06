/**
 * LINE 公式アカウント (SWIPLY OA) との通知連携クライアント。
 *
 * SWIPLY のフロントエンドは、ユーザーが LIFF 経由でログインしたときに
 * その LINE Login channel の userId（"line-Uxxxx..." の形で session に
 * 保存される）を持っている。push 通知を送るには Messaging API channel
 * 側の userId が必要だが、両者は LINE 仕様上別物。
 *
 * そこで Cloudflare Workers (`workers/swiply-line-notify/`) を仲介役に
 * 立て、6文字コード貼り付け方式で紐付けを取る:
 *
 *   1. /pair-init で短命なコード "PAIR-XXXXXX" を発行 + LINE 公式 OA への
 *      事前入力リンクを取得
 *   2. ユーザーが LINE アプリで送信ボタンをタップ
 *   3. Workers の webhook が messagingUserId を受信して KV に保存
 *   4. SWIPLY 側は /pair-status をポーリングして連携完了を検知
 *
 * 使い分け:
 *   - getLoginUserId(session): session uid から LINE userId を取り出す
 *   - isLineNotifySupported(): 設定済み + LINE ログイン中で連携可能か
 *   - initPair(loginUserId): コード発行
 *   - checkPairStatus(loginUserId): 紐付け済みかチェック
 *
 * 環境変数 NEXT_PUBLIC_LINE_NOTIFY_URL が未設定のときはサイレントに
 * 機能無効化する（開発・プレビュー環境を壊さない）。
 */

const NOTIFY_URL =
  (process.env.NEXT_PUBLIC_LINE_NOTIFY_URL || "").replace(/\/$/, "");

export interface PairInitResult {
  alreadyLinked: boolean;
  /** "PAIR-XXXXXX" の形式。alreadyLinked のときは undefined。 */
  code?: string;
  /** ISO 文字列。コードの有効期限。 */
  expiresAt?: string;
  /** LINE アプリを開いて事前入力済みのチャットを表示する URL。 */
  oaMessageUrl?: string;
}

export class LineLinkError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "LineLinkError";
  }
}

/**
 * AuthSession の uid から LINE Login channel の userId を取り出す。
 * session.uid は LIFF 経由ログインだと "line-Uxxxx..." の形になる。
 * LINE 経由でないユーザー（メールパスワードログイン等）には null を返す。
 */
export function getLoginUserId(uid: string | undefined | null): string | null {
  if (!uid) return null;
  return uid.startsWith("line-") ? uid.slice("line-".length) : null;
}

/**
 * LINE 通知連携が利用可能か。
 * - NEXT_PUBLIC_LINE_NOTIFY_URL が設定されている
 * - 渡された uid が LINE ログイン由来（"line-" prefix）
 */
export function isLineNotifySupported(uid: string | undefined | null): boolean {
  return !!NOTIFY_URL && !!getLoginUserId(uid);
}

/**
 * Workers 側でペアコードを発行し、LINE OA への事前入力 URL を返す。
 * 既に紐付け済みなら alreadyLinked: true で短絡応答が返る。
 */
export async function initPair(loginUserId: string): Promise<PairInitResult> {
  if (!NOTIFY_URL) {
    throw new LineLinkError(
      "LINE通知サーバーが設定されていません（NEXT_PUBLIC_LINE_NOTIFY_URL）"
    );
  }
  const res = await fetch(`${NOTIFY_URL}/pair-init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginUserId }),
  });
  if (!res.ok) {
    const body = await safeReadText(res);
    throw new LineLinkError(
      `pair-init に失敗しました (${res.status}): ${body}`,
      res.status
    );
  }
  const data = (await res.json()) as {
    ok: boolean;
    alreadyLinked?: boolean;
    code?: string;
    expiresAt?: string;
    oaMessageUrl?: string;
    error?: string;
  };
  if (!data.ok) {
    throw new LineLinkError(data.error || "pair-init が ok=false で応答しました");
  }
  return {
    alreadyLinked: !!data.alreadyLinked,
    code: data.code,
    expiresAt: data.expiresAt,
    oaMessageUrl: data.oaMessageUrl,
  };
}

/**
 * 連携が完了しているかをチェック。ポーリング用。
 */
export async function checkPairStatus(loginUserId: string): Promise<boolean> {
  if (!NOTIFY_URL) return false;
  const res = await fetch(`${NOTIFY_URL}/pair-status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginUserId }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { linked?: boolean };
  return !!data.linked;
}

async function safeReadText(res: Response): Promise<string> {
  try {
    const t = await res.text();
    return t.slice(0, 200);
  } catch {
    return "";
  }
}
