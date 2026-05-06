# LINE プッシュ通知 — Claude Code への引き継ぎ

## このタスクの目的

SWIPLY 内のマッチ成立 / メッセージ受信時に、ユーザーの LINE 公式アカウント(SWIPLY)から push 通知を飛ばす。

## ⚠️ 重要な前提(LINE 仕様)

LINE は LIFF と Messaging API を **同じチャネルに統合できない仕様**です。Messaging API チャネルでは LIFF が作れず、LINE Login チャネルでは push が送れません。当初検討した「1チャネル統合(選択肢A)」は **物理的に不可能**で、**2チャネル + Account Link API で紐付ける構成**(LINE 公式の標準パターン)が正解でした。

## 全体構成

```
[ユーザーの LINE アプリ]
   ↓ rich menu tap
[LIFF (Login チャネル 2009964059)]
   ↓ liff.getProfile() → loginUserId
[SWIPLY フロント (GitHub Pages)]
   ↓ POST /notify { recipientLoginUserId, body, ... }
[Cloudflare Workers]
   ├── recipientLoginUserId → KV lookup → messagingUserId
   │     (KV is populated by accountLink webhook below)
   ↓ POST /v2/bot/message/push
[LINE Messaging API (Notifier チャネル 2009985261)]
   ↓ push message
[ユーザーの LINE トーク]


[ユーザーが LIFF 経由でログインした直後の連携フロー]

   SWIPLY が linkToken 発行 API を叩く (Login チャネルの Channel Access Token を使用)
        ↓
   linkToken をユーザーに渡し、LINE 公式アカウントとの連携 URL に誘導
        ↓
   ユーザーが LINE 上で「許可」をタップ
        ↓
   Messaging API チャネルの webhook が `accounts.linked` イベントを受信
        (loginUserId と messagingUserId が両方含まれる)
        ↓
   Workers 側で KV に { loginUserId → messagingUserId } を保存
        ↓
   以降、push 通知が送信可能になる
```

## 前提状態(完了済み)

| 項目 | 状態 | 値 |
|---|---|---|
| LIFF 自動ログイン(`LIFF_HANDOFF.md`) | ✅ 完了 | LIFF ID `2009964059-jcGdt1Nm` |
| LINE Login チャネル(SWIPLY) | ✅ 既存維持 | Channel ID **`2009964059`** |
| Messaging API チャネル(SWIPLY OA 紐付け) | ✅ 有効化済み | Channel ID **`2009985261`** |
| Channel Access Token(長期、Notifier チャネル) | ✅ 発行済み | ユーザーが 1Password 等に保管済み |
| Channel Secret(Notifier チャネル) | ✅ 表示済み | LINE OA Manager → 設定 → Messaging API で再表示可能 |
| Webhook URL | ⏳ 未設定 | Workers デプロイ後に設定 |
| リッチメニューURL | ✅ そのまま | `https://liff.line.me/2009964059-jcGdt1Nm` |

**注**: 「Messaging API チャネルを Developers コンソールから新規作成」は LINE 仕様で禁止されました。代わりに **LINE Official Account Manager → 設定 → Messaging API → "Messaging APIを利用する"** で SWIPLY OA に紐付ける形で作ります(完了済み)。

## 残タスク(順番に実行)

### ① Cloudflare Workers セットアップ

#### 1-1. プロジェクト作成

```bash
npm install -g wrangler
wrangler login

mkdir swiply-line-notify && cd swiply-line-notify
npm init -y
npm install
```

#### 1-2. KV namespace 作成

```bash
wrangler kv namespace create LINK_MAP
# 出力に表示される id をメモ → wrangler.toml の kv_namespaces.id に貼る
```

#### 1-3. `wrangler.toml`

```toml
name = "swiply-line-notify"
main = "src/index.ts"
compatibility_date = "2026-05-01"

[vars]
ALLOW_ORIGIN = "https://playmark0227-svg.github.io"
LINE_LOGIN_CHANNEL_ID   = "2009964059"
LINE_MSG_CHANNEL_ID     = "2009985261"
LINE_MSG_CHANNEL_SECRET = ""    # 後述: webhook 署名検証用。secret に置きたい場合は削除して `wrangler secret put` で登録

[[kv_namespaces]]
binding = "LINK_MAP"
id = "<wrangler kv namespace create で取得したID>"

# Channel Access Token(長期)— 必ず Secret として登録(ファイルに直書きしない):
#   wrangler secret put LINE_MSG_ACCESS_TOKEN
# Channel Secret も Secret として登録(webhook 署名検証用):
#   wrangler secret put LINE_MSG_CHANNEL_SECRET
```

#### 1-4. `src/index.ts`

3つのエンドポイントを実装:

- `POST /notify` — フロントから呼ばれる push 送信エンドポイント
- `POST /linkToken` — LIFF からアカウント連携のために linkToken を取得
- `POST /webhook` — Messaging API からの webhook(アカウント連携イベント等)

```typescript
export interface Env {
  LINE_MSG_ACCESS_TOKEN: string;       // Secret
  LINE_MSG_CHANNEL_SECRET: string;     // Secret
  LINE_LOGIN_CHANNEL_ID: string;       // Var
  LINE_MSG_CHANNEL_ID: string;         // Var
  ALLOW_ORIGIN: string;                // Var
  LINK_MAP: KVNamespace;
}

interface NotifyPayload {
  recipientLoginUserId: string;        // U... (Login channel userId)
  title?: string;
  body: string;
  href?: string;
}

interface LinkTokenPayload {
  loginUserId: string;                 // 連携をリクエストするユーザーの Login チャネルでの userId
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const cors = corsHeaders(env.ALLOW_ORIGIN);

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === "/notify" && req.method === "POST") {
      return handleNotify(req, env, cors);
    }
    if (url.pathname === "/linkToken" && req.method === "POST") {
      return handleLinkToken(req, env, cors);
    }
    if (url.pathname === "/webhook" && req.method === "POST") {
      return handleWebhook(req, env);  // CORS 不要 (LINE からのサーバー間呼び出し)
    }
    return new Response("Not found", { status: 404, headers: cors });
  },
};

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

async function handleNotify(
  req: Request,
  env: Env,
  cors: Record<string, string>
): Promise<Response> {
  let payload: NotifyPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400, headers: cors });
  }
  if (!payload.recipientLoginUserId || !payload.body) {
    return new Response("recipientLoginUserId と body は必須", { status: 400, headers: cors });
  }

  // Login userId → Messaging userId 変換
  const messagingUserId = await env.LINK_MAP.get(payload.recipientLoginUserId);
  if (!messagingUserId) {
    // 紐付け未完了 — push できない。201 で「届けられないがエラーではない」を表現
    return new Response(JSON.stringify({ ok: false, reason: "not_linked" }), {
      status: 201,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const text = payload.title
    ? `【${payload.title}】\n${payload.body}`
    : payload.body;
  const fullText = payload.href
    ? `${text}\n\n👉 https://playmark0227-svg.github.io/swiply${payload.href}`
    : text;

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.LINE_MSG_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to: messagingUserId,
      messages: [{ type: "text", text: fullText }],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return new Response(`LINE API error: ${detail}`, { status: 502, headers: cors });
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

async function handleLinkToken(
  req: Request,
  env: Env,
  cors: Record<string, string>
): Promise<Response> {
  let payload: LinkTokenPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400, headers: cors });
  }
  if (!payload.loginUserId) {
    return new Response("loginUserId は必須", { status: 400, headers: cors });
  }

  // Messaging API: linkToken 発行
  // https://developers.line.biz/ja/reference/messaging-api/#issue-link-token
  const res = await fetch(
    `https://api.line.me/v2/bot/user/${payload.loginUserId}/linkToken`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${env.LINE_MSG_ACCESS_TOKEN}` },
    }
  );
  if (!res.ok) {
    const detail = await res.text();
    return new Response(`linkToken error: ${detail}`, { status: 502, headers: cors });
  }
  const { linkToken } = (await res.json()) as { linkToken: string };
  return new Response(JSON.stringify({ linkToken }), {
    status: 200,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

async function handleWebhook(req: Request, env: Env): Promise<Response> {
  // 署名検証
  const signature = req.headers.get("x-line-signature") || "";
  const bodyText = await req.text();
  const valid = await verifyLineSignature(
    env.LINE_MSG_CHANNEL_SECRET,
    bodyText,
    signature
  );
  if (!valid) return new Response("Invalid signature", { status: 401 });

  const body = JSON.parse(bodyText) as { events: LineEvent[] };
  for (const event of body.events) {
    if (event.type === "accountLink" && event.link.result === "ok") {
      // accountLink イベント:
      //   event.source.userId = Messaging API チャネルでの userId
      //   event.link.nonce    = linkToken 発行時に紐付けた nonce
      // ただし LINE の linkToken フローでは、linkToken は loginUserId に直接紐付くので、
      // ここでは loginUserId を nonce 経由で引く設計が必要(下記 KV 設計参照)
      const nonce = event.link.nonce;
      const loginUserId = await env.LINK_MAP.get(`nonce:${nonce}`);
      if (loginUserId) {
        await env.LINK_MAP.put(loginUserId, event.source.userId);
        await env.LINK_MAP.delete(`nonce:${nonce}`);  // 使用済み nonce を消す
      }
    }
  }
  return new Response("OK", { status: 200 });
}

interface LineEvent {
  type: string;
  source: { type: string; userId: string };
  link: { result: string; nonce: string };
}

async function verifyLineSignature(
  secret: string,
  body: string,
  signature: string
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body)
  );
  const expected = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
  return expected === signature;
}
```

**KV 設計のポイント**:
- `LINK_MAP[loginUserId] = messagingUserId` … push 送信時のメインルックアップ
- `LINK_MAP[nonce:<nonce>] = loginUserId` … linkToken 発行〜accountLink webhook の間の一時的な対応(TTL を 10分〜1時間で設定推奨、`{ expirationTtl: 600 }` 等)

ただし上記コードでは `nonce` の保存タイミングが書いていません。**`/linkToken` ハンドラで linkToken と一緒に返ってくる nonce を取って、`LINK_MAP[nonce:xxx] = loginUserId` を保存する必要がある**。LINE Messaging API の `/v2/bot/user/{userId}/linkToken` のレスポンスには linkToken 自体しか含まれず、nonce はクライアント側で生成して LINE に渡す方式の場合と、LINE が linkToken に組み込む場合がある。実装時に Messaging API のドキュメントを再確認のこと:
- https://developers.line.biz/ja/reference/messaging-api/#issue-link-token
- https://developers.line.biz/ja/docs/messaging-api/linking-accounts/

#### 1-5. デプロイ + Secret 登録

```bash
# Channel Access Token(長期) — 1Password から取り出して貼り付け
wrangler secret put LINE_MSG_ACCESS_TOKEN

# Channel Secret(webhook 署名検証用) — LINE OA Manager → 設定 → Messaging API から取得
wrangler secret put LINE_MSG_CHANNEL_SECRET

# デプロイ
wrangler deploy
# → https://swiply-line-notify.<your-subdomain>.workers.dev
```

### ② Webhook URL を LINE OA Manager に登録

1. https://manager.line.biz/account/@909suozs/setting/messaging-api を開く
2. 「Webhook URL」欄に以下を入れて保存:
   ```
   https://swiply-line-notify.<your-subdomain>.workers.dev/webhook
   ```
3. **「Webhookの利用」を ON**(同ページの設定にある場合)
4. 検証ボタンで疎通確認

### ③ SWIPLY フロントの実装

#### 3-1. `src/lib/services/matches.ts` を新規作成

```typescript
const NOTIFY_URL = process.env.NEXT_PUBLIC_LINE_NOTIFY_URL || "";

export function lineUserIdFromUid(uid: string): string | null {
  return uid.startsWith("line-") ? uid.slice("line-".length) : null;
}

interface NotifyArgs {
  recipientUid: string;     // SWIPLY uid (例: "line-Uxxx...")
  title?: string;
  body: string;
  href?: string;            // 例: "/likes"
}

export async function notifyExternalChannel(args: NotifyArgs): Promise<void> {
  if (!NOTIFY_URL) return;
  const recipientLoginUserId = lineUserIdFromUid(args.recipientUid);
  if (!recipientLoginUserId) return;  // 非LINEユーザーは通知対象外

  try {
    await fetch(`${NOTIFY_URL}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientLoginUserId,
        title: args.title,
        body: args.body,
        href: args.href,
      }),
    });
  } catch (e) {
    console.warn("[matches] LINE push failed", e);
  }
}
```

#### 3-2. アカウント連携 UI(LIFF 経由)

ユーザーが LIFF で初めてログインした直後、または「LINE通知を有効にする」ボタンを押した時に:

```typescript
// src/lib/services/lineLink.ts (新規)
const NOTIFY_URL = process.env.NEXT_PUBLIC_LINE_NOTIFY_URL || "";

export async function startLineLink(loginUserId: string): Promise<void> {
  if (!NOTIFY_URL) {
    throw new Error("LINE通知サーバーが設定されていません");
  }
  const res = await fetch(`${NOTIFY_URL}/linkToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loginUserId }),
  });
  if (!res.ok) throw new Error(`linkToken 取得失敗: ${res.status}`);
  const { linkToken } = (await res.json()) as { linkToken: string };
  // LINE のアカウント連携 URL に飛ばす
  window.location.href = `https://access.line.me/dialog/bot/accountLink?linkToken=${linkToken}&nonce=${linkToken}`;
}
```

呼び出し側(例: `/profile` ページに「LINE通知をONにする」ボタンを置く):

```tsx
import { lineUserIdFromUid } from "@/lib/services/matches";
import { startLineLink } from "@/lib/services/lineLink";

const loginUserId = session ? lineUserIdFromUid(session.uid) : null;
{loginUserId && (
  <button onClick={() => startLineLink(loginUserId)}>
    LINEで通知を受け取る
  </button>
)}
```

#### 3-3. マッチ成立箇所からの呼び出し

`src/lib/services/likes.ts` 周辺(LIKE が成立してマッチになる箇所)で:

```typescript
import { notifyExternalChannel } from "@/lib/services/matches";

// マッチが成立した後
notifyExternalChannel({
  recipientUid: matchedUserUid,
  title: "マッチ成立!",
  body: "新しいマッチがいます",
  href: "/likes",
});
```

具体的な呼び出し場所と判定ロジックは既存実装を読んで判断してください。

#### 3-4. 環境変数

GitHub の **Settings → Secrets and variables → Actions → Variables** に追加:

```
NEXT_PUBLIC_LINE_NOTIFY_URL = https://swiply-line-notify.<your-subdomain>.workers.dev
```

`.env.local`(ローカル開発用)に追記:

```
NEXT_PUBLIC_LINE_NOTIFY_URL=https://swiply-line-notify.<your-subdomain>.workers.dev
```

#### 3-5. `.github/workflows/deploy.yml` の build ステップに env を渡す

```yaml
      - name: Build
        run: npm run build
        env:
          NODE_ENV: production
          NEXT_PUBLIC_LINE_NOTIFY_URL: ${{ vars.NEXT_PUBLIC_LINE_NOTIFY_URL }}
```

### ④ 動作確認

1. SWIPLY をスマホで開く → リッチメニューからログイン → ホーム
2. プロフィール画面等の「LINEで通知を受け取る」ボタンをタップ
3. LINE 公式アカウント連携の画面に遷移 → 「許可」をタップ
4. SWIPLY に戻る → 連携完了
5. スワイプで LIKE → マッチ成立 → 1〜3秒後に LINE トークに通知

### ⑤ トラブルシュート

| 症状 | 原因 | 対処 |
|---|---|---|
| `notify` レスポンスが `{ ok: false, reason: "not_linked" }` | アカウント連携未完了 | `/linkToken` フローを通す |
| Webhook が呼ばれない | LINE OA Manager 側で Webhook URL 未設定 / 利用OFF | OA Manager → 設定 → Messaging API で確認 |
| Webhook が 401 | 署名検証失敗。Channel Secret が違う | `wrangler secret put LINE_MSG_CHANNEL_SECRET` で再登録 |
| `LINE API error: 401` | Channel Access Token 失効/無効 | `wrangler secret put LINE_MSG_ACCESS_TOKEN` で再登録 |
| `LINE API error: 403` | 公式LINEを友だち追加していない | LINE で SWIPLY を友だち追加 |
| CORS エラー | `ALLOW_ORIGIN` 不一致 | Workers の `wrangler.toml` の `ALLOW_ORIGIN` をフロントの origin と完全一致させる |

## コスト目安

| 項目 | 無料枠 | 想定月間 push 数 | コスト |
|---|---|---|---|
| Cloudflare Workers | 100,000 req/日 | 数千 | 0円 |
| Cloudflare KV | 1,000 writes/日, 10万 reads/日 | 連携イベント数十〜百 | 0円 |
| LINE Messaging API(フリープラン) | 200通/月 | 〜200 | 0円 |
| LINE Messaging API(ライトプラン) | 5,000通/月 | 〜5,000 | 5,000円/月 |

## 補足

- **LIFF_HANDOFF.md が完了している前提**(本番デプロイ済み・実機ログイン確認済みであること)
- 既存の **LINE Login チャネル `2009964059` は維持**。コード側の `DEFAULT_CHANNEL_ID` / `DEFAULT_LIFF_ID` は変更不要
- アカウント連携は **ユーザー操作が必要**(ボタンをタップして LINE で許可)。リッチメニューから入っただけでは紐付かない
- 連携は1ユーザーにつき1回。完了後は KV にマッピングが残るので push 通知が継続的に動く
- 将来 Firebase Functions に移行する場合: `auth.users.{uid}.lineLink: { messagingUserId }` を Firestore に保存する設計に変えれば、Cloudflare KV と Workers の代替にできる
