"use client";

/**
 * SWIPLY のマイページに置く「LINE通知連携」カード。
 *
 * 表示条件:
 *   - LIFF/LINE ログインで session.uid が "line-..." である
 *   - NEXT_PUBLIC_LINE_NOTIFY_URL が設定されている
 * 上記いずれかを満たさないときは何もレンダリングしない（デザインの邪魔をしない）。
 *
 * 状態遷移:
 *   loading       初期化（既存ペアリング状態を確認中）
 *   not-linked    まだ連携していない（"LINE通知を有効化" ボタン）
 *   pairing       コード発行済み・LINE 上で送信待ち（コード表示 + 自動ポーリング）
 *   linked        連携済み
 *   error         API エラー（再試行 CTA を出す）
 *
 * pairing 中は 3 秒間隔で /pair-status をポーリングし、
 * 連携検知次第 linked へ遷移。コード TTL は 10 分なので、
 * 同じ画面を放置されたまま期限切れになる可能性に備えて
 * 残り時間も表示する。
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  checkPairStatus,
  getLoginUserId,
  initPair,
  isLineNotifySupported,
  LineLinkError,
  type PairInitResult,
} from "@/lib/services/lineLink";

type Phase = "loading" | "not-linked" | "pairing" | "linked" | "error";

interface Props {
  /** 現在の SWIPLY セッションの uid（"line-..." 形式想定）。 */
  uid: string | null | undefined;
}

export default function LineNotifySection({ uid }: Props) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [pair, setPair] = useState<PairInitResult | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const supported = isLineNotifySupported(uid);
  const loginUserId = getLoginUserId(uid);

  // 初期状態のチェック: もう紐付け済みかどうか
  useEffect(() => {
    if (!supported || !loginUserId) return;
    let cancelled = false;
    (async () => {
      try {
        const linked = await checkPairStatus(loginUserId);
        if (cancelled) return;
        setPhase(linked ? "linked" : "not-linked");
      } catch {
        if (cancelled) return;
        setPhase("not-linked");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supported, loginUserId]);

  // pairing 中のポーリング
  useEffect(() => {
    if (phase !== "pairing" || !loginUserId) return;
    pollTimerRef.current = setInterval(async () => {
      try {
        const linked = await checkPairStatus(loginUserId);
        if (linked) {
          setPhase("linked");
          setPair(null);
        }
      } catch {
        // 一時的な失敗は無視（次のティックで再試行）
      }
    }, 3000);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    };
  }, [phase, loginUserId]);

  // pairing 中のカウントダウン更新（1秒）
  useEffect(() => {
    if (phase !== "pairing") return;
    tickTimerRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    };
  }, [phase]);

  const handleStart = useCallback(async () => {
    if (!loginUserId) return;
    setError("");
    setPhase("loading");
    try {
      const result = await initPair(loginUserId);
      if (result.alreadyLinked) {
        setPhase("linked");
        return;
      }
      setPair(result);
      setNow(Date.now());
      setPhase("pairing");
    } catch (e) {
      const msg =
        e instanceof LineLinkError
          ? e.message
          : e instanceof Error
            ? e.message
            : "連携の開始に失敗しました";
      setError(msg);
      setPhase("error");
    }
  }, [loginUserId]);

  const handleCancel = useCallback(() => {
    setPair(null);
    setPhase("not-linked");
  }, []);

  if (!supported) return null;

  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-4 mt-4">
      <div className="flex items-start gap-3">
        <LineGlyph />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-gray-900">LINE通知</p>
          <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
            マッチや応募ステータス更新を、SWIPLY 公式アカウントのトークでお知らせします。
          </p>

          {phase === "loading" && (
            <div className="mt-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-violet-200 border-t-violet-500 animate-spin" />
              <span className="text-[11px] text-gray-500">確認中…</span>
            </div>
          )}

          {phase === "linked" && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold text-emerald-700">
                連携中（通知が届きます）
              </span>
            </div>
          )}

          {phase === "not-linked" && (
            <button
              type="button"
              onClick={handleStart}
              className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#06C755] hover:bg-[#05B24C] active:scale-[0.98] transition text-white text-[12px] font-extrabold shadow-md shadow-[#06C755]/30"
            >
              <LineGlyph small />
              LINE通知を有効化
            </button>
          )}

          {phase === "pairing" && pair && (
            <PairingPanel
              pair={pair}
              now={now}
              onCancel={handleCancel}
              onRegenerate={handleStart}
            />
          )}

          {phase === "error" && (
            <div className="mt-3">
              <p className="text-[11px] text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1.5 mb-2">
                {error}
              </p>
              <button
                type="button"
                onClick={handleStart}
                className="text-[11px] font-bold text-violet-600 hover:text-violet-700"
              >
                もう一度試す
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PairingPanel({
  pair,
  now,
  onCancel,
  onRegenerate,
}: {
  pair: PairInitResult;
  now: number;
  onCancel: () => void;
  onRegenerate: () => void;
}) {
  const expiresAt = pair.expiresAt ? new Date(pair.expiresAt).getTime() : 0;
  const remainingMs = Math.max(0, expiresAt - now);
  const expired = remainingMs <= 0;
  const remainingMin = Math.floor(remainingMs / 60000);
  const remainingSec = Math.floor((remainingMs % 60000) / 1000);

  return (
    <div className="mt-3 rounded-xl bg-violet-50/60 border border-violet-100 p-3">
      <p className="text-[10px] tracking-[0.2em] font-bold text-violet-500 mb-1">
        STEP 1
      </p>
      <p className="text-[12px] font-bold text-gray-900 mb-2">
        SWIPLY のトークでこのコードを送ってください
      </p>
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-100 px-3 py-2 mb-3">
        <code className="font-mono text-base font-extrabold tracking-wider text-violet-700">
          {pair.code}
        </code>
        <button
          type="button"
          onClick={() => {
            if (pair.code) navigator.clipboard?.writeText(pair.code).catch(() => {});
          }}
          className="text-[11px] font-bold text-violet-600 hover:text-violet-800"
        >
          コピー
        </button>
      </div>

      <p className="text-[10px] tracking-[0.2em] font-bold text-violet-500 mb-1">
        STEP 2
      </p>
      <p className="text-[12px] font-bold text-gray-900 mb-2">
        LINE で SWIPLY を開いて送信
      </p>
      {pair.oaMessageUrl && !expired ? (
        <a
          href={pair.oaMessageUrl}
          className="block w-full text-center px-4 py-2 rounded-xl bg-[#06C755] hover:bg-[#05B24C] active:scale-[0.98] transition text-white text-[12px] font-extrabold shadow-md shadow-[#06C755]/30"
        >
          LINEで開く
        </a>
      ) : (
        <p className="text-[11px] text-rose-600">コードの有効期限が切れました。下から再発行してください。</p>
      )}

      <div className="mt-3 flex items-center justify-between text-[11px]">
        <span className="text-gray-500">
          {expired
            ? "期限切れ"
            : `残り ${String(remainingMin).padStart(2, "0")}:${String(remainingSec).padStart(2, "0")} / 自動で連携を確認中…`}
        </span>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onRegenerate}
            className="text-violet-600 hover:text-violet-700 font-bold"
          >
            再発行
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 font-bold"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}

function LineGlyph({ small = false }: { small?: boolean }) {
  const size = small ? 16 : 24;
  return (
    <span
      className="inline-flex items-center justify-center rounded-md"
      style={{
        width: small ? size : size + 8,
        height: small ? size : size + 8,
        background: small ? "transparent" : "#06C755",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill={small ? "#06C755" : "#fff"}
        aria-hidden
      >
        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386a.633.633 0 0 1-.626-.63V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016a.626.626 0 0 1-.626.626.622.622 0 0 1-.51-.262l-2.443-3.317v2.954a.625.625 0 0 1-1.252 0V8.108a.628.628 0 0 1 .624-.626c.197 0 .375.094.503.256l2.45 3.327V8.108a.625.625 0 0 1 1.254 0v4.771zm-5.728 0a.625.625 0 0 1-1.252 0V8.108a.625.625 0 0 1 1.252 0v4.771zm-2.466.629H4.917a.634.634 0 0 1-.629-.629V8.108c0-.345.282-.63.629-.63.345 0 .628.285.628.63v4.141h1.77c.349 0 .629.283.629.63a.629.629 0 0 1-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
      </svg>
    </span>
  );
}
