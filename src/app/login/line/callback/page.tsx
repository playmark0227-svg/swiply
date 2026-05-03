"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { handleLineCallback } from "@/lib/services/lineAuth";
import { useAuth } from "@/components/AuthProvider";

type Phase = "loading" | "error";

export default function LineCallbackPage() {
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
        const profile = await handleLineCallback();
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
  }, [auth, router]);

  return (
    <div className="min-h-dvh bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 flex items-center justify-center px-5">
      <div className="w-full max-w-sm text-center">
        <Logo size={48} radius={14} priority className="mx-auto mb-4 shadow-md shadow-violet-200" />
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
