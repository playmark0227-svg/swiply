"use client";

/**
 * LINE Login finish handler — receives an ID token in the URL fragment
 * and adopts a SWIPLY session in the user's default browser.
 *
 * Reached two ways:
 *
 *  1. From `/liff/` after the in-LINE LIFF page calls
 *     liff.openWindow({ url: '/login/line/finish/#id_token=...',
 *                       external: true })
 *     — i.e. the user was in the LINE in-app browser and we punted
 *     them out to Safari/Chrome to complete login. (Primary case.)
 *
 *  2. From `/liff/` via plain redirect when the LIFF URL is opened
 *     in a regular browser (e.g. on desktop). Same code path, no
 *     external bounce needed.
 *
 * Verification flow:
 *
 *   - Read `id_token` and `next` from window.location.hash
 *   - POST to https://api.line.me/oauth2/v2.1/verify to confirm the
 *     token's signature, audience (= our channel ID), and expiry
 *   - Build a SWIPLY session from the verified payload (sub = LINE
 *     userId; uid prefix matches the existing OAuth-PKCE flow so
 *     downstream code stays compatible)
 *   - history.replaceState() removes the fragment from the URL so the
 *     ID token can't leak via copy/paste or screenshots
 *   - router.replace(next) navigates to the originally-requested page
 *
 * Why fragment instead of query string?
 *   Fragments are not transmitted to the server, so the ID token
 *   never appears in GitHub Pages (or any HTTP) access logs.
 *
 * The ID token is short-lived (LINE issues these with a ~1h expiry)
 * and cryptographically signed by LINE; the verify endpoint is the
 * canonical client-side validation path documented by LINE.
 */

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { useAuth } from "@/components/AuthProvider";

type Phase = "loading" | "error";

interface VerifyPayload {
  iss: string;
  sub: string;          // LINE userId — what we key the session off
  aud: string;
  exp: number;
  iat: number;
  amr?: string[];
  name?: string;
  picture?: string;
  email?: string;
}

function LineFinishInner() {
  const router = useRouter();
  const auth = useAuth();
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState("");
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    (async () => {
      try {
        const fragment =
          typeof window !== "undefined" ? window.location.hash.slice(1) : "";
        const params = new URLSearchParams(fragment);
        const idToken = params.get("id_token");
        const next = params.get("next") || "/";

        if (!idToken) {
          throw new Error(
            "認証情報が見つかりませんでした。リッチメニューからもう一度お試しください。"
          );
        }

        const channelId =
          process.env.NEXT_PUBLIC_LINE_CHANNEL_ID || "2009964059";

        const verifyRes = await fetch(
          "https://api.line.me/oauth2/v2.1/verify",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              id_token: idToken,
              client_id: channelId,
            }).toString(),
          }
        );

        if (!verifyRes.ok) {
          const text = await verifyRes.text().catch(() => "");
          throw new Error(
            `ID token の検証に失敗しました: ${text.slice(0, 200) || verifyRes.status}`
          );
        }

        const payload = (await verifyRes.json()) as VerifyPayload;
        if (!payload.sub) {
          throw new Error("LINEプロフィールから userId を取得できませんでした");
        }

        const session = {
          uid: `line-${payload.sub}`,
          email: payload.email || `${payload.sub}@line.local`,
          displayName: payload.name || "ユーザー",
        };

        auth.setSession(session);

        // Wipe the ID token from the URL so it can't be re-shared.
        try {
          history.replaceState(null, "", window.location.pathname);
        } catch {
          // Older browsers without history API: ignore.
        }

        router.replace(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : "ログインに失敗しました");
        setPhase("error");
      }
    })();
  }, [auth, router]);

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

export default function LineFinishPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-gradient-to-br from-violet-50 via-white to-fuchsia-50" />
      }
    >
      <LineFinishInner />
    </Suspense>
  );
}
