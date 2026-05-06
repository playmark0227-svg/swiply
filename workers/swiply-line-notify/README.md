# swiply-line-notify

SWIPLY → LINE OA push 通知用 Cloudflare Worker。LIFF (Login チャネル) と Messaging API チャネルの userId を **コードペアリング方式** でブリッジする。

## なぜ Account Link API ではないか

LINE 公式の `accountLink` / `linkToken` API は `POST /v2/bot/user/{userId}/linkToken` の `{userId}` に **Messaging API チャネルの userId** を要求する。SWIPLY フロントは LIFF で Login userId しか持っていないので、accountLink フローは入口段階で詰む。代わりに「6桁のコードを SWIPLY OA に送ってもらう」ペアリング方式で同じ目的を達成する。

## エンドポイント

| Method | Path | 用途 | CORS |
|---|---|---|---|
| `POST` | `/pair-init` | フロントが連携コード発行を要求 | 必要 |
| `POST` | `/pair-status` | 連携完了を確認するポーリング | 必要 |
| `POST` | `/notify` | マッチ等のイベントを LINE トークに push | 必要 |
| `POST` | `/webhook` | LINE Messaging API webhook（署名検証あり） | 不要 |

## KV スキーマ (binding `LINK_MAP`)

| Key | Value | TTL |
|---|---|---|
| `pair:{CODE}` | `loginUserId` | 600s |
| `link:{loginUserId}` | `messagingUserId` | なし（永続） |

## セットアップ手順

### 1. 依存導入 + Cloudflare ログイン

```bash
cd workers/swiply-line-notify
npm install
npx wrangler login   # ブラウザで Cloudflare アカウント認証
```

### 2. KV namespace 作成

```bash
npx wrangler kv namespace create LINK_MAP
```

出力例:

```
🌀 Creating namespace with title "swiply-line-notify-LINK_MAP"
✨ Success! Add the following to your configuration file:
[[kv_namespaces]]
binding = "LINK_MAP"
id = "abc123def456..."
```

→ 出力された `id` を `wrangler.toml` の `REPLACE_ME_AFTER_KV_CREATE` と差し替え。

### 3. Secret 登録（コミットされない）

```bash
# Channel Access Token (長期) — Notifier チャネルのもの。1Password 等から取り出して貼り付け
npx wrangler secret put LINE_MSG_ACCESS_TOKEN

# Channel Secret — webhook 署名検証用。LINE OA Manager → 設定 → Messaging API で確認可
npx wrangler secret put LINE_MSG_CHANNEL_SECRET
```

### 4. デプロイ

```bash
npx wrangler deploy
```

成功すると以下のような URL が表示される:

```
Published swiply-line-notify (1.23 sec)
  https://swiply-line-notify.<your-subdomain>.workers.dev
```

→ **この URL を控える**。SWIPLY フロント側の `NEXT_PUBLIC_LINE_NOTIFY_URL` に設定する。

### 5. LINE OA Manager で Webhook URL を設定

1. https://manager.line.biz/account/@909suozs/setting/messaging-api を開く
2. 「**Webhook URL**」欄に以下を入れて保存:
   ```
   https://swiply-line-notify.<your-subdomain>.workers.dev/webhook
   ```
3. 「**Webhookの利用**」を ON
4. 「**検証**」ボタンで疎通確認 → `Success` が出れば OK
5. **「あいさつメッセージ」「応答メッセージ」は OFF** にする（webhook を使うので）

### 6. SWIPLY フロント側に URL を伝える

GitHub の **Settings → Secrets and variables → Actions → Variables** に追加:

```
NEXT_PUBLIC_LINE_NOTIFY_URL = https://swiply-line-notify.<your-subdomain>.workers.dev
```

ローカル開発用に `.env.local` にも追記（既に `.env.local.example` に欄を作成済み）:

```
NEXT_PUBLIC_LINE_NOTIFY_URL=https://swiply-line-notify.<your-subdomain>.workers.dev
```

## 動作確認

```bash
# 200 OK
curl -i https://swiply-line-notify.<your-subdomain>.workers.dev/

# pair-init dummy call (Workers がエラーを返すか確認)
curl -i -X POST https://swiply-line-notify.<your-subdomain>.workers.dev/pair-init \
  -H "Content-Type: application/json" \
  -H "Origin: https://playmark0227-svg.github.io" \
  -d '{"loginUserId":"U_test_dummy"}'
# → { "ok": true, "alreadyLinked": false, "code": "PAIR-XXXXXX", "expiresAt": "...", "oaMessageUrl": "..." }
```

## ログを見る

```bash
npx wrangler tail
```

別ターミナルで起動しておくと、本番 Worker のログがリアルタイムで流れる。

## トラブルシュート

| 症状 | 原因 | 対処 |
|---|---|---|
| `/webhook` が 401 を返す | Channel Secret が違う | `npx wrangler secret put LINE_MSG_CHANNEL_SECRET` で再登録 |
| webhook 検証ボタンが Success にならない | URL のパス末尾が `/webhook` になっていない | OA Manager の Webhook URL を確認 |
| 連携コード送ったのに反応がない | Webhook URL 未設定 / 利用 OFF | OA Manager → 設定 → Messaging API |
| `LINE API error: 403` (push) | OA を友だち追加していない | LIFF Aggressive で自動追加されるはずだが、ブロックしてないか確認 |
| `LINE API error: 401` (push) | Channel Access Token 無効 | `npx wrangler secret put LINE_MSG_ACCESS_TOKEN` で再登録 |
| CORS エラー | `wrangler.toml` の `ALLOW_ORIGIN` がフロント origin と不一致 | 値を確認して `npx wrangler deploy` |
