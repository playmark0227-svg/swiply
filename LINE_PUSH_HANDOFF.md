# LINE プッシュ通知 — Claude Code への引き継ぎ

## このタスクの目的

SWIPLY 内のマッチ成立 / メッセージ受信時に、ユーザーの LINE 公式アカウント(SWIPLY)から push 通知を飛ばす。GitHub Pages は静的サイトなので、LINE Messaging API の Channel Access Token を直接ブラウザに置けない。**サーバーレス関数を1つ別途立てる必要がある。**

## 全体構成

```
[SWIPLY フロント (GitHub Pages)]
        │
        │ POST /notify
        ▼
[サーバーレス関数 (Cloudflare Workers 等)]
        │   verify + 整形
        │   Channel Access Token を保持
        ▼
[LINE Messaging API]
        │   push message
        ▼
[ユーザーの LINE アプリ]
```

## 前提状態(完了済み・LIFF_HANDOFF.md と共通)

- LIFF 自動ログイン実装済み(別ハンドオフ書 `LIFF_HANDOFF.md` 参照)
- LINE Login チャネル: SWIPLY (channel ID `2009964059`)
- LIFF アプリ: ID `2009964059-jcGdt1Nm`、ボットリンク「On (Aggressive)」
- リッチメニュー: `https://liff.line.me/2009964059-jcGdt1Nm` 設定済み
- リッチメニューから入るユーザーは自動で友だち追加される(ボットリンク Aggressive のため)

## 残タスク(順番に実行)

### ① LINE 側の準備

#### A. Messaging API チャネル作成(既存 Login チャネルとは別物)

push 通知には Messaging API チャネルが必要。手順:

1. https://developers.line.biz/console/ にログイン
2. 既存の **SWIPLY プロバイダー** を開く
3. 「チャネル作成」→ **「Messaging API」** を選択
4. チャネル名(例: `SWIPLY Notifier`)を入力 → 作成
5. 作成後、左サイドバー **「Messaging API設定」** タブを開く
6. ページ下部の **「チャネルアクセストークン(長期)」** で **「発行」** ボタンを押す
7. このトークンをコピー(後で Workers Secret として使う)

#### B. LINE userId の紐付け方針(要決定)

ユーザーが SWIPLY にログインしている userId(LINE Login で取得した `U…` で始まる32文字)と、公式アカウントの友だち userId は **チャネルが違うと別物**。push を送るには両方を紐付ける必要がある。

**選択肢A(推奨・将来性): 1つの Messaging API チャネルに統合**
- ユーザーが SWIPLY を最初に開く前提で、Messaging API チャネルにも LINE Login 機能を有効化
- 既存と同じコールバックURL を登録
- LIFF も Messaging API チャネル側に作り直す
- **既存の LINE Login チャネルは廃止**(影響範囲: `lineAuth.ts` / `liffAuth.ts` / `.env.local` / GitHub Actions の env)
- メリット: userId が完全に一致するので紐付け不要

**選択肢B(最小工数): フォローイベントで userId 紐付けを KV に保存**
- ユーザーが「友だち追加」した時点で Messaging API は webhook で userId を通知
- それを KV(Cloudflare KV / Vercel KV / Upstash Redis 等)に保存
- SWIPLY 側のユーザー(メールや LINE Login userId)と紐付けるためのマッピングテーブルを別途用意
- **マッピングが取れたユーザーだけに push する**設計が簡単

**Claude Code への指示**: 選択肢を確認してから着手すること。デフォルトは選択肢B(最小工数)で進めて、push が動くようになってから A への移行を検討する流れ。

### ② サーバーレス関数を立てる(Cloudflare Workers 推奨)

無料枠で十分動く(後述のコスト目安参照)。

#### セットアップ

```bash
npm install -g wrangler
wrangler login

mkdir swiply-line-notify && cd swiply-line-notify
npm init -y
npm install
```

#### `wrangler.toml`

```toml
name = "swiply-line-notify"
main = "src/index.ts"
compatibility_date = "2026-05-01"

[vars]
ALLOW_ORIGIN = "https://playmark0227-svg.github.io"

# Channel Access Token は Secret として登録(後述)
```

#### `src/index.ts`

```typescript
export interface Env {
  LINE_CHANNEL_ACCESS_TOKEN: string;
  ALLOW_ORIGIN: string;
}

interface PushPayload {
  lineUserId: string;
  title: string;
  body: string;
  href?: string;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const cors = {
      "Access-Control-Allow-Origin": env.ALLOW_ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: cors });
    }

    let payload: PushPayload;
    try {
      payload = await req.json();
    } catch {
      return new Response("Invalid JSON", { status: 400, headers: cors });
    }

    if (!payload.lineUserId || !payload.body) {
      return new Response("lineUserId と body は必須", { status: 400, headers: cors });
    }

    const text = payload.title
      ? `【${payload.title}】\n${payload.body}`
      : payload.body;

    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: payload.lineUserId,
        messages: [
          {
            type: "text",
            text:
              text +
              (payload.href
                ? `\n\n👉 https://playmark0227-svg.github.io/swiply${payload.href}`
                : ""),
          },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return new Response(`LINE API error: ${detail}`, {
        status: 502,
        headers: cors,
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  },
};
```

#### デプロイ

```bash
# トークンを Secret として登録(公開リポジトリには残らない)
wrangler secret put LINE_CHANNEL_ACCESS_TOKEN
# プロンプトが出たら ① で取得したトークンを貼り付け

wrangler deploy
# → デプロイ後 https://swiply-line-notify.<your-subdomain>.workers.dev のような URL が表示される
```

### ③ SWIPLY フロントの実装(★ matches.ts と notifyExternalChannel を作る)

**重要**: 現状のコードベースには `src/lib/services/matches.ts` も `notifyExternalChannel()` も **存在しない**。Claude Code は以下を新規作成する必要がある:

#### 3-1. `src/lib/services/matches.ts` を新規作成

要件:
- マッチ成立時に呼ばれるエントリーポイント関数
- LINE userId が紐付いているユーザーには `notifyExternalChannel()` で push 通知
- LINE 通知 URL が未設定なら何もしない(開発中も安全)
- 既存の LINE Login userId(`uid: "line-Uxxxxxx..."`)から prefix を外して LINE userId を抽出する想定

サンプル雛形:

```typescript
// src/lib/services/matches.ts
const NOTIFY_URL = process.env.NEXT_PUBLIC_LINE_NOTIFY_URL || "";

interface NotifyArgs {
  /** Recipient's LINE userId (raw, without "line-" prefix). */
  lineUserId: string;
  title: string;
  body: string;
  /** Optional path within SWIPLY to deep-link to (e.g. "/likes"). */
  href?: string;
}

/**
 * Best-effort LINE push notification. Returns silently if the notify
 * endpoint isn't configured (dev / preview environments). Fire-and-
 * forget — we don't await the response in the caller.
 */
export async function notifyExternalChannel(args: NotifyArgs): Promise<void> {
  if (!NOTIFY_URL) return;
  try {
    await fetch(NOTIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
  } catch (e) {
    // Push failure shouldn't block the in-app match flow.
    console.warn("[matches] LINE push failed", e);
  }
}

/**
 * Extract a raw LINE userId from a SWIPLY uid. The OAuth/LIFF flows
 * store sessions with `uid: "line-{userId}"`; for non-LINE users this
 * returns null and notifyExternalChannel becomes a no-op.
 */
export function lineUserIdFromUid(uid: string): string | null {
  return uid.startsWith("line-") ? uid.slice("line-".length) : null;
}
```

#### 3-2. マッチ成立箇所からの呼び出し

スワイプ成立箇所(`src/app/likes/page.tsx` や `src/lib/services/likes.ts` 周辺)で `notifyExternalChannel` を呼ぶ。
- 自分が LIKE した相手にも、相手が自分を LIKE して成立した側にも、それぞれ送る
- `lineUserId` は相手側の uid から抽出
- 例: `notifyExternalChannel({ lineUserId, title: "マッチ成立!", body: "新しいマッチがいます", href: "/likes" })`

具体的な呼び出し場所と判定ロジックは既存実装を読んで判断してください。

#### 3-3. 環境変数の設定

GitHub の **Settings → Secrets and variables → Actions → Variables** に追加:

```
NEXT_PUBLIC_LINE_NOTIFY_URL = https://swiply-line-notify.<your-subdomain>.workers.dev
```

ローカル開発用には `.env.local` に追記:

```
NEXT_PUBLIC_LINE_NOTIFY_URL=https://swiply-line-notify.<your-subdomain>.workers.dev
```

#### 3-4. `.github/workflows/deploy.yml` の build ステップに env を渡す

```yaml
      - name: Build
        run: npm run build
        env:
          NODE_ENV: production
          NEXT_PUBLIC_LINE_NOTIFY_URL: ${{ vars.NEXT_PUBLIC_LINE_NOTIFY_URL }}
```

### ④ 動作確認

1. SWIPLY をスマホで開く → リッチメニューからログイン → ホーム
2. スワイプで LIKE → マッチ成立で 1〜3秒後にユーザーの LINE トーク画面に通知が届く
3. 届かない場合は ⑤ のトラブルシュートを参照

⚠ **公式アカウントを「友だち追加していないユーザー」には push できない**(LINE 仕様)。SWIPLY のリッチメニューから入るユーザーは LIFF のボットリンク Aggressive により自動で友だち追加される。

### ⑤ トラブルシュート

| 症状 | 原因 | 対処 |
|---|---|---|
| `LINE API error: 400` | `userId` の形式不正 | `U` で始まる32文字か確認 |
| `LINE API error: 401` | Access Token 無効 | `wrangler secret put` でトークンを再登録 |
| `LINE API error: 403` | 友だち追加されていない | 公式LINEを友だち追加してから再試行 |
| CORS エラー | `ALLOW_ORIGIN` 不一致 | Workers の `wrangler.toml` の `ALLOW_ORIGIN` をフロントの origin と完全一致させる |
| そもそも fetch が呼ばれない | `NEXT_PUBLIC_LINE_NOTIFY_URL` が未設定 | GitHub Actions の Variables / `.env.local` に設定 + 再デプロイ |

## コスト目安

| 項目 | 無料枠 | 想定月間 push 数 | コスト |
|---|---|---|---|
| Cloudflare Workers | 100,000 req/日 | 数千 | 0円 |
| LINE Messaging API(フリープラン) | 200通/月 | 〜200 | 0円 |
| LINE Messaging API(ライトプラン) | 5,000通/月 | 〜5,000 | 5,000円/月 |

ユーザー100人 × マッチ平均5回/月 = 500通 程度が想定。フリープラン(200通/月)の超過分はライトプランで吸収するのが現実的。

## 補足

- **本ハンドオフは LIFF 自動ログイン(`LIFF_HANDOFF.md`)が完了している前提**。先にそちらが本番デプロイされて動作している必要がある。
- **選択肢B で進める場合の追加実装**: 友だち追加 webhook を受ける別エンドポイント(または同じ Workers の別ルート)が必要。webhook で受けた userId を KV / DB に保存し、SWIPLY のユーザーと紐付けるロジックを別途設計する。本ハンドオフではそこまでの設計は含まれていないので、Claude Code は webhook の受け側まで作るかどうかをユーザーに確認すること。
- **将来的には Firebase Functions に統合する選択肢もある**(プロジェクトが既に Firebase クライアントSDKを使っているため)。その場合 Cloudflare Workers ではなく Firebase Functions で同じことを実装。
