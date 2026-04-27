"use client";

/**
 * Identity verification (本人確認) UI scaffold.
 *
 * IMPORTANT — DEMO ONLY:
 * This page DOES NOT perform real face matching. The "AI comparison" is
 * simulated with a timer and pseudo-random confidence score so the full UX
 * can be demonstrated. For production, integrate a regulated eKYC provider
 * (e.g. TRUSTDOCK, LIQUID eKYC, Polarify, Onfido, Persona) which will:
 *
 *   1. Receive the document photo and selfie via secure backend
 *   2. Run OCR + tamper detection on the document
 *   3. Run face-to-face biometric match in their secure environment
 *   4. Return a verification token your backend stores against the user
 *
 * Never run face biometric matching client-side; never store raw face images
 * in localStorage in production.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/components/AuthProvider";
import { getProfile, saveProfile } from "@/lib/services/profile";
import type { UserProfile } from "@/types/profile";
import { useToast } from "@/components/Toast";
import { haptic } from "@/lib/haptic";

type Step = "intro" | "document" | "selfie" | "review" | "result";

export default function VerifyPage() {
  const auth = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [step, setStep] = useState<Step>("intro");
  const [docImage, setDocImage] = useState<string>("");
  const [selfieImage, setSelfieImage] = useState<string>("");
  const [docNumberLast4, setDocNumberLast4] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    getProfile().then((p) => {
      setProfile(p);
      if (p.kyc.status === "verified") setStep("result");
    });
  }, []);

  // Run "AI" review animation when entering review step.
  useEffect(() => {
    if (step !== "review") return;
    setProgress(0);
    setConfidence(null);
    const start = Date.now();
    const total = 3200; // simulated review duration
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / total) * 100));
      setProgress(pct);
      if (elapsed >= total) {
        clearInterval(tick);
        // Pseudo-random simulated match confidence between 92–99%.
        // (Demo only — no real biometric matching is performed.)
        const score = 92 + Math.random() * 7;
        setConfidence(score);
        finalizeVerification(score);
      }
    }, 80);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function finalizeVerification(score: number) {
    if (!profile) return;
    const updated: UserProfile = {
      ...profile,
      kyc: {
        status: score >= 90 ? "verified" : "rejected",
        submittedAt: new Date().toISOString(),
        verifiedAt: score >= 90 ? new Date().toISOString() : undefined,
        matchConfidence: Math.round(score * 10) / 10,
        documentLast4: docNumberLast4 || undefined,
      },
    };
    await saveProfile(updated);
    setProfile(updated);
    haptic(score >= 90 ? "success" : "warn");
    setStep("result");
    toast.show(score >= 90 ? "本人確認が完了しました" : "確認に失敗しました", score >= 90 ? "success" : "error");
  }

  function readImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleDocSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await readImage(file);
    setDocImage(data);
  }

  async function handleSelfieSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await readImage(file);
    setSelfieImage(data);
  }

  async function resetVerification() {
    if (!profile) return;
    if (!confirm("本人確認情報をリセットしますか？")) return;
    const updated: UserProfile = {
      ...profile,
      kyc: { status: "unverified" },
    };
    await saveProfile(updated);
    setProfile(updated);
    setDocImage("");
    setSelfieImage("");
    setDocNumberLast4("");
    setConfidence(null);
    setStep("intro");
  }

  if (!profile) {
    return (
      <div className="flex flex-col min-h-dvh bg-gray-50">
        <Header />
        <main className="flex-1" />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">
      <Header />
      <main className="flex-1 max-w-lg md:max-w-3xl mx-auto w-full px-4 md:px-8 pt-4 md:pt-10 pb-20">
        <h1 className="text-lg md:text-3xl font-extrabold text-gray-900 mb-1">本人確認</h1>
        <p className="text-[12px] md:text-sm text-gray-500 mb-5 md:mb-7">
          安心して応募・採用につなげるための eKYC
        </p>

        {/* Progress dots */}
        {step !== "intro" && step !== "result" && (
          <div className="flex gap-1 mb-5">
            {(["document", "selfie", "review"] as const).map((s, i) => {
              const order: Step[] = ["document", "selfie", "review"];
              const idx = order.indexOf(step);
              const reached = i <= idx;
              return (
                <div
                  key={s}
                  className={`flex-1 h-1 rounded-full ${
                    reached ? "bg-gradient-to-r from-violet-500 to-fuchsia-500" : "bg-gray-200"
                  }`}
                />
              );
            })}
          </div>
        )}

        {step === "intro" && (
          <IntroStep
            kyc={profile.kyc}
            authed={!!auth.session}
            onStart={() => {
              haptic("tick");
              setStep("document");
            }}
            onReset={resetVerification}
          />
        )}

        {step === "document" && (
          <DocumentStep
            image={docImage}
            last4={docNumberLast4}
            setLast4={setDocNumberLast4}
            onPick={handleDocSelect}
            onClear={() => setDocImage("")}
            onNext={() => {
              haptic("tick");
              setStep("selfie");
            }}
            onBack={() => setStep("intro")}
          />
        )}

        {step === "selfie" && (
          <SelfieStep
            image={selfieImage}
            onPick={handleSelfieSelect}
            onClear={() => setSelfieImage("")}
            onNext={() => {
              haptic("tick");
              setStep("review");
            }}
            onBack={() => setStep("document")}
          />
        )}

        {step === "review" && (
          <ReviewStep progress={progress} docImage={docImage} selfieImage={selfieImage} />
        )}

        {step === "result" && (
          <ResultStep
            kyc={profile.kyc}
            confidence={confidence ?? profile.kyc.matchConfidence ?? null}
            onRetry={() => {
              setDocImage("");
              setSelfieImage("");
              setStep("intro");
            }}
            onHome={() => router.push("/profile")}
          />
        )}
      </main>
      <BottomNav />
    </div>
  );
}

// ---------- step components ----------

function IntroStep({
  kyc,
  authed,
  onStart,
  onReset,
}: {
  kyc: UserProfile["kyc"];
  authed: boolean;
  onStart: () => void;
  onReset: () => void;
}) {
  if (kyc.status === "verified") {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white p-5 shadow-lg shadow-emerald-200/60">
        <p className="text-[10px] tracking-[0.2em] font-bold opacity-80">VERIFIED</p>
        <h2 className="text-2xl font-black mt-1">本人確認済み</h2>
        <p className="text-[12px] opacity-90 mt-2 leading-relaxed">
          身分証と顔写真の照合が完了しました。優良企業のスカウト・面接案内が届きやすくなります。
        </p>
        {kyc.matchConfidence && (
          <p className="text-[11px] opacity-80 mt-3">
            照合スコア: <span className="font-extrabold">{kyc.matchConfidence}%</span>
            {kyc.documentLast4 && <span className="ml-2">／ 書類末尾 ****{kyc.documentLast4}</span>}
          </p>
        )}
        <button
          onClick={onReset}
          className="mt-4 text-[11px] font-bold opacity-90 underline underline-offset-2 hover:opacity-100"
        >
          本人確認をリセットする
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-3xl bg-white border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-extrabold text-gray-900">3分で完了する本人確認</h2>
            <p className="text-[11px] text-gray-500">運転免許証 ＋ 顔写真の2点だけ</p>
          </div>
        </div>

        <ol className="space-y-3 mt-4">
          <Step n={1} title="身分証をアップロード" body="運転免許証・マイナンバーカード等の表面を撮影" />
          <Step n={2} title="顔写真を撮影" body="正面の写真をアップロード（撮影もOK）" />
          <Step n={3} title="自動照合" body="身分証の顔写真と一致するか自動で確認" />
        </ol>
      </div>

      <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-100 p-4">
        <p className="text-[12px] font-bold text-amber-700 mb-1">⚠ デモ環境のお知らせ</p>
        <p className="text-[11px] text-amber-700 leading-relaxed">
          このプロトタイプでは実際の生体認証は実行されません。送信した画像はブラウザ内（localStorage）に一時保存されるのみで、サーバーには送信されません。本番運用では eKYC 提供事業者（TRUSTDOCK / LIQUID eKYC 等）との連携が必要です。
        </p>
      </div>

      {!authed && (
        <p className="mt-3 text-[11px] text-gray-500">
          <Link href="/login?next=/verify" className="text-violet-600 font-bold hover:underline">
            ログイン
          </Link>
          すると本人確認結果がアカウントに紐づきます。
        </p>
      )}

      <button
        onClick={onStart}
        className="mt-5 w-full h-12 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-extrabold shadow-lg shadow-violet-200/60 active:scale-[0.98]"
      >
        本人確認をはじめる
      </button>

      {kyc.status === "rejected" && (
        <p className="text-center text-[11px] text-rose-500 mt-3 font-bold">
          前回は照合に失敗しました。もう一度お試しください。
        </p>
      )}
    </>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex gap-3">
      <div className="shrink-0 w-7 h-7 rounded-full bg-violet-100 text-violet-700 text-[11px] font-black flex items-center justify-center">
        {n}
      </div>
      <div>
        <p className="text-[13px] font-extrabold text-gray-900 leading-tight">{title}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">{body}</p>
      </div>
    </li>
  );
}

function DocumentStep({
  image,
  last4,
  setLast4,
  onPick,
  onClear,
  onNext,
  onBack,
}: {
  image: string;
  last4: string;
  setLast4: (v: string) => void;
  onPick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <>
      <h2 className="text-base font-extrabold text-gray-900 mb-1">STEP 1 / 身分証</h2>
      <p className="text-[12px] text-gray-500 mb-4">
        運転免許証・マイナンバーカード・パスポートのいずれかの表面を撮影してください
      </p>

      {!image ? (
        <label className="block">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onPick}
            className="hidden"
          />
          <div className="aspect-[16/10] rounded-3xl border-2 border-dashed border-violet-200 bg-violet-50/40 flex flex-col items-center justify-center cursor-pointer hover:border-violet-400 transition">
            <svg className="w-10 h-10 text-violet-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-[13px] font-bold text-gray-700">タップして撮影／選択</p>
            <p className="text-[11px] text-gray-400 mt-1">枠内に身分証全体が入るように</p>
          </div>
        </label>
      ) : (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="身分証プレビュー" className="w-full aspect-[16/10] object-cover rounded-3xl border border-gray-100" />
          <button onClick={onClear} className="mt-2 text-[11px] text-gray-500 hover:text-rose-500 font-bold">
            撮り直す
          </button>
        </div>
      )}

      <div className="mt-4">
        <label className="block text-[11px] font-bold text-gray-500 mb-1.5">
          書類番号の末尾4桁（任意）
        </label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={last4}
          onChange={(e) => setLast4(e.target.value.replace(/\D/g, ""))}
          placeholder="0000"
          className="w-full px-3.5 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 tabular-nums tracking-widest"
        />
        <p className="text-[10px] text-gray-400 mt-1">表示用。フル番号は保存しません。</p>
      </div>

      <div className="flex gap-2 mt-6">
        <button
          onClick={onBack}
          className="px-4 h-11 rounded-2xl bg-gray-100 text-gray-700 font-bold text-[13px]"
        >
          戻る
        </button>
        <button
          onClick={onNext}
          disabled={!image}
          className="flex-1 h-11 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-extrabold shadow-md disabled:opacity-50"
        >
          次へ
        </button>
      </div>
    </>
  );
}

function SelfieStep({
  image,
  onPick,
  onClear,
  onNext,
  onBack,
}: {
  image: string;
  onPick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <>
      <h2 className="text-base font-extrabold text-gray-900 mb-1">STEP 2 / 顔写真</h2>
      <p className="text-[12px] text-gray-500 mb-4">
        正面・無帽・マスクなしの顔写真をアップロードしてください
      </p>

      {!image ? (
        <label className="block">
          <input
            type="file"
            accept="image/*"
            capture="user"
            onChange={onPick}
            className="hidden"
          />
          <div className="aspect-square max-w-xs mx-auto rounded-full border-2 border-dashed border-fuchsia-200 bg-fuchsia-50/40 flex flex-col items-center justify-center cursor-pointer hover:border-fuchsia-400 transition">
            <svg className="w-12 h-12 text-fuchsia-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="text-[13px] font-bold text-gray-700">タップして撮影／選択</p>
            <p className="text-[11px] text-gray-400 mt-1">明るい場所で正面から</p>
          </div>
        </label>
      ) : (
        <div className="flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="顔写真プレビュー" className="w-48 h-48 object-cover rounded-full border-4 border-white shadow-lg" />
          <button onClick={onClear} className="mt-3 text-[11px] text-gray-500 hover:text-rose-500 font-bold">
            撮り直す
          </button>
        </div>
      )}

      <div className="flex gap-2 mt-6">
        <button
          onClick={onBack}
          className="px-4 h-11 rounded-2xl bg-gray-100 text-gray-700 font-bold text-[13px]"
        >
          戻る
        </button>
        <button
          onClick={onNext}
          disabled={!image}
          className="flex-1 h-11 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-extrabold shadow-md disabled:opacity-50"
        >
          照合する
        </button>
      </div>
    </>
  );
}

function ReviewStep({
  progress,
  docImage,
  selfieImage,
}: {
  progress: number;
  docImage: string;
  selfieImage: string;
}) {
  const stages = [
    { at: 15, label: "身分証を読み取り中…" },
    { at: 35, label: "OCR・改ざん検知中…" },
    { at: 60, label: "顔の特徴点を抽出中…" },
    { at: 85, label: "AI で照合中…" },
    { at: 100, label: "完了" },
  ];
  const current = [...stages].reverse().find((s) => progress >= s.at - 14)?.label ?? stages[0].label;

  return (
    <div className="text-center py-6">
      <div className="relative inline-block mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={docImage}
          alt=""
          className="w-32 h-20 object-cover rounded-xl shadow-md border border-white"
        />
        <div className="absolute -bottom-4 -right-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selfieImage}
            alt=""
            className="w-16 h-16 object-cover rounded-full border-4 border-white shadow-md"
          />
        </div>
      </div>

      <p className="text-[11px] tracking-[0.2em] text-violet-500 font-bold mb-1">VERIFYING</p>
      <h2 className="text-lg font-extrabold text-gray-900 mb-1">AIで照合しています</h2>
      <p className="text-[12px] text-gray-500 mb-6">{current}</p>

      <div className="max-w-xs mx-auto">
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] text-gray-400 tabular-nums mt-2">{progress}%</p>
      </div>

      <p className="text-[10px] text-gray-400 mt-8 max-w-xs mx-auto leading-relaxed">
        ※ デモ環境のためAI照合はシミュレーションです。本番では eKYC 事業者の API を呼び出します。
      </p>
    </div>
  );
}

function ResultStep({
  kyc,
  confidence,
  onRetry,
  onHome,
}: {
  kyc: UserProfile["kyc"];
  confidence: number | null;
  onRetry: () => void;
  onHome: () => void;
}) {
  const verified = kyc.status === "verified";
  return (
    <div className="text-center py-4">
      <div
        className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
          verified ? "bg-emerald-100" : "bg-rose-100"
        }`}
      >
        {verified ? (
          <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-10 h-10 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <h2 className="text-xl font-black text-gray-900 mb-1">
        {verified ? "本人確認が完了しました" : "照合できませんでした"}
      </h2>
      <p className="text-[12px] text-gray-500 mb-4 leading-relaxed">
        {verified
          ? "信頼バッジが付与されました。応募時に企業から優先的に確認されます。"
          : "顔写真と身分証の特徴が十分に一致しませんでした。明るい場所で正面から撮り直してみてください。"}
      </p>

      {confidence !== null && (
        <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full px-4 py-1.5 mb-6">
          <span className="text-[10px] text-gray-400 font-bold">照合スコア</span>
          <span
            className={`text-sm font-black tabular-nums ${
              verified ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {confidence.toFixed(1)}%
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2 max-w-xs mx-auto">
        <button
          onClick={onHome}
          className="h-11 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-extrabold shadow-md"
        >
          マイページへ
        </button>
        {!verified && (
          <button
            onClick={onRetry}
            className="h-11 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold text-[13px]"
          >
            もう一度試す
          </button>
        )}
      </div>
    </div>
  );
}
