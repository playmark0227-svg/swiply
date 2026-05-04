"use client";

/**
 * LIFF auto-login entry page (handoff variant).
 *
 * Two scenarios this page handles:
 *
 * (A) Tapped from the SWIPLY rich menu (inside the LINE in-app browser)
 *     1. LINE opens this page inside the in-app browser.
 *     2. liff.init() succeeds; we grab the user's ID token.
 *     3. We call liff.openWindow({ external: true }) to relaunch
 *        `/login/line/finish/#id_token=...` in the OS default browser.
 *     4. We close the LIFF window so LINE returns the user to chat.
 *     5. The default browser picks up where we left off, verifies the
 *        ID token via LINE's verify endpoint, and adopts a session.
 *
 *     This way the user ends up using SWIPLY in their normal Safari /
 *     Chrome — not stuck inside the LINE in-app browser.
 *
 * (B) Visited directly from a regular browser (e.g. someone shares the
 *     LIFF URL in iMessage and the recipient taps it on desktop)
 *     1. liff.init() runs; if the user has no LINE session, liff.login()
 *        bounces through the standard OAuth screen.
 *     2. After login we don't need an external bounce — we already are
 *        in the default browser. Forward to /login/line/finish/ inline.
 *
 * The ID token rides in the URL fragment (`#id_token=...`) instead of a
 * query string. Fragments are not transmitted to the server, so they
 * never end up in GitHub Pages access logs. The finish page strips the
 * fragment via history.replaceState immediately after verification.
 *
 * This page is fully client-rendered. With output: "export", Next.js
 * prerenders an empty shell; all auth runs in useEffect on the client.
 */

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";
import { isLiffConfigured } from "@/lib/services/liffAuth";

type Phase = "loading" | "handed-off" | "error";

const FINISH_PATH = "/login/line/finish";
const BASE_PATH = process.env.NODE_ENV === "production" ? "/swiply" : "";

function buildFinishUrl(idToken: string, next: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  // Note the trailing slash before `#` — Next.js exports with
  // trailingSlash:true so /login/line/finish/ is the canonical form.
  const params = new URLSearchParams({ id_token: idToken, next });
  return `${origin}${BASE_PATH}${FINISH_PATH}/#${params.toString()}`;
}

function LiffEntryInner() {
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState("");
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const next = searchParams?.get("next") || "/";

    (async () => {
      try {
        if (!isLiffConfigured) {
          throw new Error(
            "LIFFが設定されていません（NEXT_PUBLIC_LIFF_ID を環境変数に追加してください）"
          );
        }

        // Dynamic import keeps the SDK out of SSR. The SDK touches
        // `window` at module load time.
        const liffModule = await import("@line/liff");
        const liff = liffModule.default;

        const liffId = process.env.NEXT_PUBLIC_LIFF_ID || "2009964059-jcGdt1Nm";
        await liff.init({ liffId });

        if (!liff.isLoggedIn()) {
          // No LINE session — bounce through the OAuth screen, then
          // come back to this same URL (preserving ?next).
          const here =
            typeof window !== "undefined"
              ? window.location.href
              : undefined;
          liff.login(here ? { redirectUri: here } : undefined);
          return; // login() navigates the page away
        }

        const idToken = liff.getIDToken();
        if (!idToken) {
          throw new Error(
            "ID token を取得できませんでした（openid scope が無効の可能性）"
          );
        }

        const finishUrl = buildFinishUrl(idToken, next);

        if (liff.isInClient()) {
          // (A) Inside LINE in-app browser → bounce to the OS default
          // browser so the user finishes login in Safari/Chrome.
          try {
            liff.openWindow({ url: finishUrl, external: true });
            setPhase("handed-off");
            try {
              liff.closeWindow();
            } catch {
              // closeWindow is best-effort. If the LIFF window can't
              // close (e.g. on certain platforms) it just stays open
              // showing the "handed-off" message — no harm done.
            }
          } catch {
            // openWindow can fail on rare platforms; fall back to a
            // same-window navigation.
            window.location.href = finishUrl;
          }
        } else {
          // (B) Already in a default browser. Just forward to the
          // finish page inline.
          window.location.href = finishUrl;
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "ログインに失敗しました");
        setPhase("error");
      }
    })();
  }, [searchParams]);

  return (
    <div className="min-h-dvh bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 flex items-center justify-center px-5">
      <div className="w-full max-w-sm text-center">
        <Logo
          size={48}
          radius={14}
          priority
          className="mx-auto mb-4 shadow-md shadow-violet-200"
        />
        {phase === "loading" ? (
          <>
            <p className="text-[12px] tracking-[0.25em] font-bold text-violet-500 mb-2">
              SIGNING YOU IN
            </p>
            <p className="text-base font-extrabold text-gray-900 mb-2">
              LINEで認証中…
            </p>
            <div className="mt-6 mx-auto w-10 h-10 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
          </>
        ) : phase === "handed-off" ? (
          <>
            <p className="text-[12px] tracking-[0.25em] font-bold text-violet-500 mb-2">
              OPENING IN BROWSER
            </p>
            <p className="text-base font-extrabold text-gray-900 mb-2">
              ブラウザを開きました
            </p>
            <p className="text-[12px] text-gray-600 leading-relaxed">
              続きはお使いのブラウザ（Safari / Chrome）でお試しください。
            </p>
          </>
        ) : (
          <>
            <p className="text-[12px] tracking-[0.25em] font-bold text-rose-500 mb-2">
              SIGN-IN FAILED
            </p>
            <p className="text-base font-extrabold text-gray-900 mb-3">
              ログインに失敗しました
            </p>
            <p className="text-[12px] text-gray-600 leading-relaxed mb-6">
              {error}
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-extrabold text-sm shadow-md"
            >
              ログイン画面に戻る
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function LiffEntryPage() {
  // useSearchParams() requires a Suspense boundary in App Router when
  // the page is statically exported.
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-gradient-to-br from-violet-50 via-white to-fuchsia-50" />
      }
    >
      <LiffEntryInner />
    </Suspense>
  );
}
