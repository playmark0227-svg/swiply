"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { haptic } from "@/lib/haptic";

function SignupInner() {
  const { signUp } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!agree) {
      setError("利用規約とプライバシーポリシーに同意してください");
      return;
    }
    setSubmitting(true);
    try {
      await signUp(email, password, displayName);
      haptic("success");
      toast.show("ようこそSWIPLYへ！", "success");
      router.replace(next);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "登録に失敗しました";
      setError(msg);
      haptic("warn");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <Link href="/" className="flex items-center justify-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-md shadow-violet-200">
              <span className="text-white text-base font-black">S</span>
            </div>
            <span className="text-xl font-black tracking-tight text-gray-900">SWIPLY</span>
          </Link>

          <h1 className="text-2xl font-extrabold text-gray-900 text-center mb-1">
            アカウント作成
          </h1>
          <p className="text-[12px] text-gray-500 text-center mb-7">
            メールアドレスで登録（2分で完了）
          </p>

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1.5">
                ニックネーム
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="さくら"
                autoComplete="nickname"
                required
                className="w-full px-3.5 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1.5">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full px-3.5 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1.5">
                パスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6文字以上で設定"
                autoComplete="new-password"
                minLength={6}
                required
                className="w-full px-3.5 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <label className="flex items-start gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-violet-500"
              />
              <span className="text-[11px] text-gray-600 leading-relaxed">
                <Link href="#" className="text-violet-600 hover:underline">利用規約</Link> および{" "}
                <Link href="#" className="text-violet-600 hover:underline">プライバシーポリシー</Link>
                に同意する
              </span>
            </label>

            {error && (
              <p className="text-[12px] text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-extrabold shadow-lg shadow-violet-200/60 active:scale-[0.98] disabled:opacity-60"
            >
              {submitting ? "登録中…" : "アカウントを作成"}
            </button>
          </form>

          <p className="text-center text-[12px] text-gray-500 mt-6">
            すでにアカウントをお持ちの場合は{" "}
            <Link href={`/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-violet-600 font-bold hover:underline">
              ログイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <SignupInner />
    </Suspense>
  );
}
