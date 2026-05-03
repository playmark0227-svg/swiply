"use client";

import { useState } from "react";
import { isLineConfigured, startLineLogin } from "@/lib/services/lineAuth";

interface Props {
  /** Where to redirect after successful login. */
  next?: string;
  /** Optional label override. */
  label?: string;
  className?: string;
}

/**
 * LINE-branded login CTA. Uses LINE's official green (#06C755) and the
 * white speech-bubble glyph. When LINE Login isn't configured the
 * button still renders but with a tooltip + disabled state so devs see
 * what's happening locally.
 */
export default function LineLoginButton({
  next = "/",
  label,
  className = "",
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const configured = isLineConfigured;

  async function onClick() {
    setError("");
    if (!configured) {
      setError(
        "LINEログインは未設定です（NEXT_PUBLIC_LINE_CHANNEL_ID を環境変数に追加してください）"
      );
      return;
    }
    setBusy(true);
    try {
      await startLineLogin(next);
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="w-full h-12 rounded-2xl bg-[#06C755] hover:bg-[#05B24C] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#06C755]/30 active:scale-[0.98] transition disabled:opacity-60"
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386a.633.633 0 0 1-.626-.63V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016a.626.626 0 0 1-.626.626.622.622 0 0 1-.51-.262l-2.443-3.317v2.954a.625.625 0 0 1-1.252 0V8.108a.628.628 0 0 1 .624-.626c.197 0 .375.094.503.256l2.45 3.327V8.108a.625.625 0 0 1 1.254 0v4.771zm-5.728 0a.625.625 0 0 1-1.252 0V8.108a.625.625 0 0 1 1.252 0v4.771zm-2.466.629H4.917a.634.634 0 0 1-.629-.629V8.108c0-.345.282-.63.629-.63.345 0 .628.285.628.63v4.141h1.77c.349 0 .629.283.629.63a.629.629 0 0 1-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
        </svg>
        {busy ? "LINEへ移動中…" : label ?? "LINEでログイン"}
      </button>
      {!configured && (
        <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 mt-2">
          ⚠ デモ環境ではLINEログインが未設定です。<code className="font-mono">NEXT_PUBLIC_LINE_CHANNEL_ID</code> を <code>.env.local</code> に追加してください。
        </p>
      )}
      {error && (
        <p className="text-[11px] text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1.5 mt-2">
          {error}
        </p>
      )}
    </div>
  );
}
