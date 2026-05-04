# LIFF 自動ログイン実装 — Claude Code への引き継ぎ

## このタスクの目的

LINE公式アカウント **SWIPLY** (@909suozs) のリッチメニューをタップしたユーザーが、自作Webサービス(jobly)に追加タップ・パスワード入力なしで自動ログインできるようにする。**LINE 内ブラウザではなく、ユーザーの OS デフォルトブラウザ(Safari / Chrome)**でログイン状態にする。

## プロジェクト構成

- 場所: `~/Desktop/jobly`
- スタック: Next.js 16 App Router + TypeScript + Firebase クライアントSDK
- デプロイ: `output: "export"` で静的書き出し → GitHub Pages (`https://playmark0227-svg.github.io/swiply/`)
- リポジトリ: `https://github.com/playmark0227-svg/swiply` (`main` ブランチに push すると `.github/workflows/deploy.yml` が GitHub Pages にデプロイ)
- 認証: localStorage ベースのセッション (`src/lib/services/userAuth.ts` + `src/components/AuthProvider.tsx`)
- 既存の LINEログイン (OAuth 2.0 PKCE) は `src/lib/services/lineAuth.ts` 等に実装済み。今回はそこに **LIFF + 外部ブラウザ受け渡しフロー**を追加した形で、既存の OAuth フローはそのまま残してある。

## 実装した認証フロー

```
[ユーザー] スマホで SWIPLY のリッチメニューをタップ
    ↓
[LINE] in-app ブラウザで https://liff.line.me/2009964059-jcGdt1Nm を開く
    ↓
[/liff/ ページ] (LINE in-app browser 内)
    ・liff.init() 実行
    ・liff.getIDToken() で JWT 取得
    ・liff.openWindow({ url: '/login/line/finish/#id_token=...', external: true })
       → Safari / Chrome に飛ばす
    ・liff.closeWindow()
       → LINE 内ブラウザを閉じる
    ↓
[/login/line/finish/ ページ] (デフォルトブラウザ内)
    ・URL fragment から id_token を読む
    ・https://api.line.me/oauth2/v2.1/verify に POST して検証
    ・検証 OK なら AuthProvider.setSession({ uid: 'line-<userId>', ... })
    ・history.replaceState で fragment を URL から消す
    ・router.replace(next) でホームへ
```

通常ブラウザで LIFF URL を直接開いた場合(リッチメニュー以外、例: 共有リンク)は、`liff.isInClient()` が false なので外部ブラウザ起動はスキップし、同じウィンドウで `/login/line/finish/` に遷移する。

ID token を URL の **fragment(`#`)** に乗せている理由: fragment はサーバーに送られないので GitHub Pages のアクセスログに残らない。受け取った直後に `history.replaceState` で消すので、コピー&ペーストで他人に共有されるリスクも最小化。

## LINE Developers / OA Manager 側の状態(完了済み)

- **プロバイダー**: `SWIPLY` (provider ID `2005114375`)
- **LINEログインチャネル**: `SWIPLY` (channel ID **`2009964059`**)
- **LIFFアプリ**: 作成済み
  - LIFF ID: **`2009964059-jcGdt1Nm`**
  - LIFF URL: **`https://liff.line.me/2009964059-jcGdt1Nm`**
  - エンドポイントURL: `https://playmark0227-svg.github.io/swiply/liff/`
  - サイズ: Full / Scope: openid + profile / 友だち追加: On (Aggressive)
- **リッチメニュー**: `LINE Official Account Manager → SWIPLY → リッチメニュー` のアクションA を `https://liff.line.me/2009964059-jcGdt1Nm` に差し替え保存済み

## コード変更(作業済み・まだローカルのみ)

`git status` 想定:

```
modified:   .env.local.example
modified:   package-lock.json
modified:   package.json                    ← @line/liff ^2.28.0 を依存に追加
modified:   src/lib/services/lineAuth.ts    ← DEFAULT_CHANNEL_ID 修正
                                              (2005114375=プロバイダーID → 2009964059=チャネルID)
新規:        src/app/liff/page.tsx           ← LIFF エントリー(in-app browser 検出 → 外部ブラウザ送り)
新規:        src/app/login/line/finish/page.tsx  ← 外部ブラウザ側の受け側(id_token 検証 + セッション発行)
新規:        src/lib/services/liffAuth.ts    ← LIFF SDK ラッパー
                                              (DEFAULT_LIFF_ID = "2009964059-jcGdt1Nm" を内蔵)
新規:        .env.local                      ← LIFF_ID / CHANNEL_ID 入り(.gitignore対象)
```

LIFF ID とチャネルID はコードに既定値を埋め込み済みなので、CI 側に環境変数を追加せずともデプロイ後すぐ動く設計。

## 残タスク(あなたがやること)

### 1. ローカルのロックファイルを削除して commit + push

`~/Desktop/jobly/.git/index.lock` が前任者の作業中に残ってしまっているので削除してから commit。

```bash
cd ~/Desktop/jobly
rm -f .git/index.lock
git add -A
git status               # 上記の変更ファイルが揃っていることを確認
git commit -m "Add LIFF auto-login + external-browser handoff for rich menu

- /liff/ enters via LINE in-app browser, calls liff.openWindow with
  external:true to relaunch /login/line/finish/ in the OS default
  browser, then closes the LIFF window
- /login/line/finish/ verifies the ID token via LINE's verify
  endpoint, adopts a SWIPLY session, and strips the fragment
- Works in regular browsers too (skips the external bounce)
- Hardcode public LIFF ID + channel ID as defaults so static export
  works on GitHub Pages without CI env vars
- Fix DEFAULT_CHANNEL_ID in lineAuth.ts (was the provider ID)"
git push origin main
```

push 完了後、`https://github.com/playmark0227-svg/swiply/actions` で「Deploy to GitHub Pages」ワークフローが走るのを確認(2-3分)。

### 2. デプロイ完了後の検証(curl で OK)

```bash
# どちらも 200 が返ること
curl -sI https://playmark0227-svg.github.io/swiply/liff/ | head -1
curl -sI https://playmark0227-svg.github.io/swiply/login/line/finish/ | head -1

# /liff/ の HTML 内に LIFF ID が埋め込まれていること
curl -s https://playmark0227-svg.github.io/swiply/liff/ | grep -o "2009964059-jcGdt1Nm" | head -1

# /login/line/finish/ の HTML 内にチャネルIDが埋め込まれていること
curl -s https://playmark0227-svg.github.io/swiply/login/line/finish/ | grep -o "2009964059" | head -3
```

### 3. 実機テスト

1. スマホで LINE を開いて **SWIPLY**(@909suozs)を表示
2. リッチメニューの **「ここからログイン!」** をタップ
3. 期待される挙動:
   a. LINE in-app browser に「ブラウザを開きました」と一瞬表示される
   b. **デフォルトブラウザ(Safari / Chrome)が前面に出る**
   c. デフォルトブラウザ側で「LINEで認証中…」のスピナーが出て、即座にホーム(`/`)にリダイレクトされる
   d. **LINE in-app browser ではなく、デフォルトブラウザで** SWIPLY にログインした状態になる
4. `localStorage.getItem('swiply-session')` を DevTools で確認すると `uid: "line-Uxxxxxxxx..."` が入っているはず

iOS の場合、初回は「LINEから〇〇で開く」のような確認ダイアログが出る可能性あり(OS の標準挙動)。

## トラブルシュート

| 症状 | 原因 | 対処 |
|---|---|---|
| `/liff/` が 404 | デプロイがまだ完了していない、あるいは push されていない | GitHub Actions のログを見て成功してから再試行 |
| `/login/line/finish/` が 404 | 同上(新ルート) | 同上 |
| デフォルトブラウザに飛ばない | `liff.openWindow` がブロックされた、または `external: true` が効かない端末 | 「ブラウザを開きました」表示で止まる場合は、コンソールログを確認。フォールバックとして同ウィンドウ遷移するコードも入っている |
| 外部ブラウザに飛んだ後「ID token の検証に失敗」 | チャネルIDが verify API に渡されていない、あるいは ID token の有効期限切れ(LINE は ~1h) | ブラウザ DevTools の Network で verify エンドポイントのレスポンス確認。期限切れならリッチメニューを再タップで新しい ID token を取得 |
| 「認証情報が見つかりませんでした」 | URL fragment の `#id_token=...` が無い(直接 finish ページを開いた等) | `/liff/` 経由でアクセスする必要あり |
| 通常ブラウザで LIFF を開くとリダイレクトループ | `liff.login()` の `redirectUri` がチャネルに登録されていない | LINE Developers コンソール → SWIPLY チャネル → LINEログイン設定 → コールバックURL に `https://playmark0227-svg.github.io/swiply/liff/` を追加 |

## 関連ファイルの場所

```
src/app/liff/page.tsx                          ← LIFF エントリー(in-app browser 内で動く)
src/app/login/line/finish/page.tsx             ← デフォルトブラウザ側の受け側 ★NEW
src/lib/services/liffAuth.ts                   ← LIFF SDK ラッパー(DEFAULT_LIFF_ID 含む)
src/lib/services/lineAuth.ts                   ← 既存 OAuth (PKCE) フロー、DEFAULT_CHANNEL_ID 含む
src/app/login/line/callback/page.tsx           ← 既存 OAuth コールバック(/loginボタン経由用)
src/components/AuthProvider.tsx                ← セッション管理 React Context
src/lib/services/userAuth.ts                   ← signIn/signUp/setSession の実装
.env.local.example                             ← 環境変数のドキュメント
.env.local                                     ← ローカル開発用(gitignore済み)
.github/workflows/deploy.yml                   ← GitHub Pages 自動デプロイ
next.config.ts                                 ← output: "export" + basePath: "/swiply"
```

## 補足

- 既存の `/login/line/callback/` ルートは OAuth PKCE フロー用。`/login` ページの「LINEでログイン」ボタンから来る経路。今回追加した `/login/line/finish/` は LIFF 経由の専用受け側。**用途が違う別ルート**。
- 未認証LINE公式アカウント(SWIPLYは `@909suozs` で未認証)でもLIFFは動作する。
- `?next=` でリッチメニュータップ後の遷移先を制御可能(例: `https://liff.line.me/2009964059-jcGdt1Nm?next=/career`)。`next` は `/liff/` → `/login/line/finish/` まで引き継がれる。
- **セキュリティ**: ID token は LINE が署名した JWT なので、verify API でチャネルID + 有効期限を確認すれば本物と保証される。fragment はサーバーに送られず、受信後即座に削除されるため漏洩リスクは最小。
