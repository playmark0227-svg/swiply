# LINE プッシュ通知用 Cowork 手順書

SWIPLY 内のマッチ成立 / メッセージ受信時に、ユーザーの LINE に push 通知を飛ばすためのサーバーレス関数を立てます。GitHub Pages は静的サイトなので、LINE Messaging API の Channel Access Token を直接ブラウザに置くことはできません。**サーバー側の関数を1つ別途立てる**必要があります。

## 必要な作業の概要

```
[SWIPLY フロント]      [サーバーレス関数]         [LINE]
   POST /notify  →     verify + 整形 + push  →  LINE Messaging API
                       (Channel Access Token を保持)
```

## ① LINE 側の準備

### A. Messaging API チャネルを作成（既存の Login チャネルとは別物）

> 既に SWIPLY の **LINE Login チャネル**（チャネルID `2009964059`）はありますが、push 通知には別途 **Messaging API チャネル**が必要です。

1. https://developers.line.biz/console/ にログイン
2. 既存の **「SWIPLY」プロバイダー** を開く
3. 「**チャネル作成**」→ **「Messaging API」** を選択
4. 任意のチャネル名（例: `SWIPLY Notifier`）を入力 → 作成
5. 作成後、左サイドバーの **「Messaging API設定」** タブを開く
6. ページ下部の **「チャネルアクセストークン（長期）」** で **「発行」** ボタンを押す
7. **このトークンをコピー**（後で使います）。`Bearer …` の後ろに付けて使う長い文字列です

### B. 既存の LINE Login と公式アカウントを紐付け（重要）

ユーザーが SWIPLY にログインしている `userId`（`U…` で始まる32文字）と、公式アカウントの友だち userId は **チャネルが違うと別物**です。push を送るには:

**選択肢A（推奨）: 1つの Messaging API チャネルに統合**
- ユーザーが SWIPLY を最初に開く前提で、上記の Messaging API チャネルにも LINE Login 機能を有効化（「LINE Login設定」をオンにして、コールバックを既存と同じに）
- この場合、LIFF も Messaging API チャネル側に作成し直す
- 既存の LINE Login チャネルは廃止

**選択肢B（最小工数）: 公式LINE側のフォローイベントで userId 紐付け**
- ユーザーが「友だち追加」した時点で Messaging API は webhook で `userId` を通知してくる
- それを KV (Cloudflare KV / Vercel KV / Upstash Redis 等) に保存
- SWIPLY 側のユーザー（メールやLINE Login userId）と紐付けるためのマッピングテーブルを別途用意

> 簡単に始めるなら**選択肢B**で、「マッピングが取れたユーザーだけに push する」設計が実装が楽です。

## ② サーバーレス関数を立てる（Cloudflare Workers がおすすめ）

無料枠で十分動きます。

### 手順（Cloudflare Workers の場合）

```bash
# Workers CLI を入れる
npm install -g wrangler
wrangler login

# 新しい Worker プロジェクトを作る
mkdir swiply-line-notify && cd swiply-line-notify
npm init -y
npm install
```

`wrangler.toml`:

```toml
name = "swiply-line-notify"
main = "src/index.ts"
compatibility_date = "2026-05-01"

[vars]
ALLOW_ORIGIN = "https://playmark0227-svg.github.io"

# Channel Access Token を Secret として登録：
# wrangler secret put LINE_CHANNEL_ACCESS_TOKEN
```

`src/index.ts`:

```ts
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

    // LINE Messaging API: push message
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

デプロイ:

```bash
# トークンを Secret として登録（公開リポジトリに残らない）
wrangler secret put LINE_CHANNEL_ACCESS_TOKEN
# プロンプトが出たらトークンを貼り付け

wrangler deploy
# → https://swiply-line-notify.<your-subdomain>.workers.dev
```

## ③ SWIPLY フロントを設定

GitHub の **Settings → Secrets and variables → Actions → Variables** に追加:

```
NEXT_PUBLIC_LINE_NOTIFY_URL = https://swiply-line-notify.<your-subdomain>.workers.dev
```

または `.env.local`（ローカル開発用）に追記:

```
NEXT_PUBLIC_LINE_NOTIFY_URL=https://swiply-line-notify.<your-subdomain>.workers.dev
```

設定後、`.github/workflows/deploy.yml` の build ステップに env を渡すように追記が必要:

```yaml
      - name: Build
        run: npm run build
        env:
          NODE_ENV: production
          NEXT_PUBLIC_LINE_NOTIFY_URL: ${{ vars.NEXT_PUBLIC_LINE_NOTIFY_URL }}
```

`src/lib/services/matches.ts` の `notifyExternalChannel()` が、設定があれば自動で push を送る実装になっています（未設定なら何もしない＝開発中も安全）。

## ④ 動作確認

1. SWIPLY をスマホで開いて、LINEログイン→ホーム
2. スワイプで LIKE → マッチ成立すると、~3秒後にユーザーの LINE トーク画面に通知が届く

> ⚠ 注意: 公式アカウントを「**友だち追加していないユーザー**」には push できません（LINE 側の仕様）。SWIPLY のリッチメニューから入るユーザーは自動的に友だち追加済みになります（LIFF設定で「ボット連携: Aggressive」になっているため）。

## トラブルシュート

| 症状 | 原因 | 対処 |
|---|---|---|
| `LINE API error: 400` | userId の形式不正 | `U` で始まる32文字か確認 |
| `LINE API error: 401` | Access Token 無効 | `wrangler secret put` でトークンを再登録 |
| `LINE API error: 403` | 友だち追加されていない | 公式LINEを友だち追加してから再試行 |
| CORS エラー | `ALLOW_ORIGIN` 不一致 | Workers の `wrangler.toml` の `ALLOW_ORIGIN` をフロントの origin と完全一致させる |
| そもそも fetch が呼ばれない | `NEXT_PUBLIC_LINE_NOTIFY_URL` が未設定 | GitHub Actions の Variables / `.env.local` に設定 + 再デプロイ |

## 月次コスト目安

| 項目 | 無料枠 | 想定月間 push 数 | コスト |
|---|---|---|---|
| Cloudflare Workers | 100,000 req/日 | 数千 | **0円** |
| LINE Messaging API（フリープラン） | 200通/月 | 〜200 | **0円** |
| LINE Messaging API（ライトプラン） | 5,000通/月 | 〜5,000 | **5,000円/月** |

ユーザー100人 × マッチ平均5回/月 = 500通 程度が想定。**フリープラン（200通/月）の超過分はライトプランで吸収**するのが現実的。

---

これで SWIPLY のマッチ通知が LINE に届くようになります。実装後、フロント側のコード変更は一切不要です（`matches.ts` の `notifyExternalChannel()` が環境変数を見て自動で送信を試みる設計）。
