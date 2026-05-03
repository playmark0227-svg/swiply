"use client";

/**
 * LIFF auto-login entry page.
 *
 * This is the page the rich menu in the SWIPLY LINE Official Account
 * points to (via https://liff.line.me/{LIFF_ID}). When the user taps
 * the rich menu:
 *
 *   1. LINE opens this page inside the LINE in-app browser
 *   2. liff.init() recognises the user instantly (no redirect)
 *   3. We pull the profile and adopt it as the AuthProvider session
 *   4. Redirect to ?next= (defaults to "/")
 *
 * Outside the LINE app (e.g. someone shares the LIFF URL in Safari),
 * liff.login() falls back to the standard LINE OAuth screen — same UX
 * as clicking the LINE login button on `/login`.
 *
 * This page is fully client-rendered. With output: "export", Next.js
 * still prerenders it as an empty shell, but the auth logic only runs
 * inside useEffect on the client, so static export is safe.
 */

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";
import { useAuth } from "@/components/AuthProvider";
import {
  initAndAuthenticate,
  isLiffConfigured,
} from "@/lib/services/liffAuth";

type Phase = "loading" | "error";

function LiffEntryInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
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
        const profile = await initAndAuthenticate(next);
        auth.setSession({
          uid: profile.uid,
          email: profile.email,
          displayName: profile.displayName,
        });
        router.replace(profile.next || "/");
      } catch (e) {
        setError(e instanceof Error ? e.message : "ログインに失敗しました");
        setPhase("error");
      }
    })();
  }, [auth, router, searchParams]);

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
