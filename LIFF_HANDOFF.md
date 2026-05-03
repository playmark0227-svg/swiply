# LIFF 自動ログイン実装 — Claude Code への引き継ぎ

## このタスクの目的

LINE公式アカウント **SWIPLY** (@909suozs) のリッチメニューをタップしたユーザーが、自作Webサービス(jobly)に追加タップ・パスワード入力なしで自動ログインできるようにする。LIFF (LINE Front-end Framework) を使った1タップ自動ログインを実装する。

## プロジェクト構成(分かっていること)

- 場所: `~/Desktop/jobly`
- スタック: Next.js 16 App Router + TypeScript + Firebase クライアントSDK
- デプロイ: `output: "export"` で静的書き出し → GitHub Pages (`https://playmark0227-svg.github.io/swiply/`)
- リポジトリ: `https://github.com/playmark0227-svg/swiply` (`main` ブランチに push すると `.github/workflows/deploy.yml` が GitHub Pages にデプロイ)
- 認証: localStorage ベースのセッション (`src/lib/services/userAuth.ts` + `src/components/AuthProvider.tsx`)。Firebase Auth 併用可だが今回の LIFF フローはローカルセッション直接発行で完結。
- 既存実装: LINEログイン (OAuth 2.0 PKCE) は実装済み (`src/lib/services/lineAuth.ts` + `src/app/login/line/callback/page.tsx` + `src/components/LineLoginButton.tsx`)。今回は **その上に LIFF を追加する形**で、既存の OAuth フローはそのまま残してある。

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

`git status` でこの状態のはず:

```
modified:   .env.local.example
modified:   package-lock.json
modified:   package.json              ← @line/liff ^2.28.0 を依存に追加
modified:   src/lib/services/lineAuth.ts  ← DEFAULT_CHANNEL_ID を 2005114375 → 2009964059 に修正
                                           (前者はプロバイダーID、後者がチャネルID)
新規:        src/app/liff/page.tsx     ← LIFF エントリーページ(リッチメニュー直リンク先)
新規:        src/lib/services/liffAuth.ts  ← LIFF SDK ラッパー
新規:        .env.local                ← LIFF_ID と CHANNEL_ID 入り(.gitignore対象なのでpushされない)
```

`liffAuth.ts` には `DEFAULT_LIFF_ID = "2009964059-jcGdt1Nm"` を埋め込み済みなので、CI 側に環境変数を追加せずともデプロイ後すぐ動く設計。

## 残タスク(あなたがやること)

### 1. ローカルのロックファイルを削除して commit + push

`~/Desktop/jobly/.git/index.lock` が前任者の作業中に残ってしまっているので削除してから commit。

```bash
cd ~/Desktop/jobly
rm -f .git/index.lock
git add -A
git status               # 上記の変更ファイルが揃っていることを確認
git commit -m "Add LIFF auto-login entry for rich menu

- New /liff/ route auto-authenticates inside LINE in-app browser
  via @line/liff and adopts the AuthProvider session in one tap
- Outside the LINE app, falls through to liff.login() OAuth redirect
- Fix DEFAULT_CHANNEL_ID in lineAuth.ts (was the provider ID, not channel)
- Hardcode public LIFF ID + channel ID as defaults so static export
  works on GitHub Pages without CI env vars"
git push origin main
```

push 完了後、`https://github.com/playmark0227-svg/swiply/actions` で「Deploy to GitHub Pages」ワークフローが走るのを確認(2-3分)。

### 2. デプロイ完了後の検証

```bash
# 200 が返ること
curl -sI https://playmark0227-svg.github.io/swiply/liff/ | head -1

# HTML 内に LIFF ID が含まれていること
curl -s https://playmark0227-svg.github.io/swiply/liff/ | grep -o "2009964059-jcGdt1Nm" | head -1
```

両方とも返ってくれば、デプロイが正しく反映されている。

### 3. 実機テスト

1. スマホで LINE を開いて **SWIPLY**(@909suozs)を表示
2. リッチメニューの **「ここからログイン!」** をタップ
3. LINE 内ブラウザで「LINEで認証中…」のスピナーが一瞬出て、即座にホーム(`/`)にリダイレクトされる → **成功**
4. `localStorage` に `swiply-session` キーが保存されている(`uid: "line-Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"`)はず

## 期待される挙動

- **LINE内ブラウザで開いた場合**: `liff.init()` が即座にユーザーを認識 → `liff.getProfile()` で userId / displayName / pictureUrl 取得 → `AuthProvider.setSession()` で localStorage にセッション書き込み → `?next=` パラメータの URL(デフォルト `/`)に `router.replace()`。0タップで完結。
- **通常ブラウザで開いた場合**: `liff.isLoggedIn()` が false → `liff.login({ redirectUri })` で LINE OAuth に飛ばす → 認証後に同じ `/liff/` ページに戻ってきて、上と同じフローで完結。
- **`uid` の形式**: `line-{userId}` (例: `line-U1234567890abcdef...`)。既存の LINE Login OAuth フローと同じ形式なので、ユーザーアカウント側の互換性あり。

## トラブルシュート

| 症状 | 原因 | 対処 |
|---|---|---|
| `/liff/` が 404 | デプロイがまだ完了していない、あるいは push されていない | GitHub Actions のログを見て成功してから再試行 |
| 「LIFFが設定されていません」エラー | ビルド時に `NEXT_PUBLIC_LIFF_ID` が空(かつ `DEFAULT_LIFF_ID` も空) | `liffAuth.ts` の `DEFAULT_LIFF_ID` が `"2009964059-jcGdt1Nm"` になっているか確認 |
| 「LINE で認証中…」のまま固まる | ネットワーク遅延 or `liff.init()` 失敗 | DevTools のコンソールエラーを確認、LIFF ID 不一致の可能性 |
| 通常ブラウザで開くとリダイレクトループ | `liff.login()` の `redirectUri` がチャネルに登録されていない | LINE Developers コンソール → SWIPLY チャネル → LINEログイン設定 → コールバックURL に `https://playmark0227-svg.github.io/swiply/liff/` が登録されているか確認(LIFF アプリのエンドポイントURLとは別) |

## 関連ファイルの場所(参考)

```
src/app/liff/page.tsx                    ← LIFF エントリーページ
src/lib/services/liffAuth.ts             ← LIFF SDK ラッパー(DEFAULT_LIFF_ID 含む)
src/lib/services/lineAuth.ts             ← 既存 OAuth (PKCE) フロー、DEFAULT_CHANNEL_ID 含む
src/components/AuthProvider.tsx          ← セッション管理 React Context
src/lib/services/userAuth.ts             ← signIn/signUp/setSession の実装
.env.local.example                       ← 環境変数のドキュメント
.env.local                               ← ローカル開発用(gitignore済み)
.github/workflows/deploy.yml             ← GitHub Pages 自動デプロイ
next.config.ts                           ← output: "export" + basePath: "/swiply"
```

## 補足

- 既存の `/login/line/callback/` は OAuth PKCE フロー用で残してある。`/login` ページの「LINEでログイン」ボタンから来る経路。LIFF 経由は `/liff/` 専用。
- 未認証LINE公式アカウント(SWIPLYは `@909suozs` で未認証)でもLIFFは問題なく動作する(認証バッジは検索性等にしか影響しない)。
- 必要なら `?next=` でリッチメニュータップ後の遷移先を制御可能(例: `https://liff.line.me/2009964059-jcGdt1Nm?next=/career` で `/career` に飛ばす)。リッチメニューURL側で付ければOK。
