"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo";
import type { UserProfile } from "@/types/profile";
import { CATEGORY_OPTIONS, REGION_OPTIONS } from "@/lib/services/search";
import { saveProfile } from "@/lib/services/profile";
import { useToast } from "./Toast";
import { haptic } from "@/lib/haptic";

interface Props {
  open: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSaved: (p: UserProfile) => void;
}

const TYPE_OPTIONS: { value: UserProfile["desiredJobType"]; label: string; emoji: string }[] = [
  { value: "baito", label: "アルバイト", emoji: "☕" },
  { value: "gig", label: "単発バイト", emoji: "⚡" },
  { value: "career", label: "正社員", emoji: "💼" },
  { value: "both", label: "ぜんぶ見る", emoji: "✨" },
];

const SALARY_PRESETS = [
  { value: "0", label: "指定なし" },
  { value: "1200", label: "時給1200円〜" },
  { value: "1500", label: "時給1500円〜" },
  { value: "300", label: "月給30万〜" },
  { value: "500", label: "年収500万〜" },
];

export default function OnboardingModal({ open, profile, onClose, onSaved }: Props) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<UserProfile>(profile);
  const toast = useToast();

  function patch(p: Partial<UserProfile>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  function toggleCategory(cat: string) {
    haptic("tick");
    setDraft((d) => ({
      ...d,
      desiredCategories: d.desiredCategories.includes(cat)
        ? d.desiredCategories.filter((c) => c !== cat)
        : [...d.desiredCategories, cat],
    }));
  }

  function toggleRegion(r: string) {
    haptic("tick");
    setDraft((d) => ({
      ...d,
      desiredLocations: d.desiredLocations.includes(r)
        ? d.desiredLocations.filter((x) => x !== r)
        : [...d.desiredLocations, r],
    }));
  }

  async function finish() {
    haptic("success");
    const next = { ...draft, onboarded: true };
    await saveProfile(next);
    onSaved(next);
    toast.show("好みを保存しました。おすすめが更新されます", "success");
  }

  const totalSteps = 4;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[140]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-label="はじめての設定"
            className="fixed inset-x-0 bottom-0 md:inset-0 md:m-auto md:max-w-lg md:max-h-[88dvh] md:rounded-3xl rounded-t-3xl bg-white z-[141] shadow-2xl overflow-hidden flex flex-col"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
          >
            {/* Brand header */}
            <div className="flex items-center gap-2 px-5 pt-4 pb-1">
              <Logo size={26} radius={7} />
              <span className="text-[13px] font-black tracking-tight bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                SWIPLY
              </span>
              <span className="text-[10px] text-gray-300 ml-1">へようこそ</span>
            </div>

            {/* Progress */}
            <div className="px-5 pt-2 pb-2">
              <div className="flex gap-1">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1 rounded-full ${
                      i <= step ? "bg-gradient-to-r from-violet-500 to-fuchsia-500" : "bg-gray-100"
                    }`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-2">
                STEP {step + 1} / {totalSteps}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-3">
              {step === 0 && (
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900 mb-1">
                    どんな働き方を探してる？
                  </h2>
                  <p className="text-[12px] text-gray-500 mb-4">あとから変えられます</p>
                  <div className="grid grid-cols-2 gap-2">
                    {TYPE_OPTIONS.map((t) => {
                      const active = draft.desiredJobType === t.value;
                      return (
                        <button
                          key={t.value}
                          onClick={() => {
                            haptic("tick");
                            patch({ desiredJobType: t.value });
                          }}
                          className={`p-4 rounded-2xl border-2 text-left transition ${
                            active
                              ? "border-violet-500 bg-violet-50"
                              : "border-gray-100 bg-white hover:border-violet-200"
                          }`}
                        >
                          <div className="text-2xl mb-1">{t.emoji}</div>
                          <div className="text-[13px] font-extrabold text-gray-900">{t.label}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900 mb-1">
                    気になるカテゴリは？
                  </h2>
                  <p className="text-[12px] text-gray-500 mb-4">複数選択OK</p>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORY_OPTIONS.filter((c) => c.value !== "all").map((c) => {
                      const active = draft.desiredCategories.includes(c.value);
                      return (
                        <button
                          key={c.value}
                          onClick={() => toggleCategory(c.value)}
                          className={`flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition ${
                            active
                              ? "border-violet-500 bg-violet-50"
                              : "border-gray-100 bg-white"
                          }`}
                        >
                          <span className="text-xl leading-none">{c.emoji}</span>
                          <span className="text-[11px] font-bold text-gray-700">{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900 mb-1">
                    エリアは？
                  </h2>
                  <p className="text-[12px] text-gray-500 mb-4">通える範囲を選んでね</p>
                  <div className="flex flex-wrap gap-2">
                    {REGION_OPTIONS.filter((r) => r.value !== "all").map((r) => {
                      const active = draft.desiredLocations.includes(r.value);
                      return (
                        <button
                          key={r.value}
                          onClick={() => toggleRegion(r.value)}
                          className={`px-4 py-2 rounded-full border-2 text-[13px] font-bold transition ${
                            active
                              ? "border-violet-500 bg-violet-50 text-violet-700"
                              : "border-gray-100 bg-white text-gray-700"
                          }`}
                        >
                          {r.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="text-lg font-extrabold text-gray-900 mb-1">
                    希望の給与は？
                  </h2>
                  <p className="text-[12px] text-gray-500 mb-4">この条件以上の求人を優先します</p>
                  <div className="space-y-2">
                    {SALARY_PRESETS.map((s) => {
                      const active = (draft.desiredMinSalary || "0") === s.value;
                      return (
                        <button
                          key={s.value}
                          onClick={() => {
                            haptic("tick");
                            patch({ desiredMinSalary: s.value });
                          }}
                          className={`w-full p-3.5 rounded-2xl border-2 text-left text-[13px] font-bold transition ${
                            active
                              ? "border-violet-500 bg-violet-50 text-violet-700"
                              : "border-gray-100 bg-white text-gray-700"
                          }`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 flex gap-2">
              {step > 0 ? (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="px-4 h-11 rounded-2xl bg-gray-100 text-gray-700 font-bold text-[13px]"
                >
                  戻る
                </button>
              ) : (
                <button
                  onClick={() => {
                    onSaved({ ...draft, onboarded: true });
                    saveProfile({ ...draft, onboarded: true });
                  }}
                  className="px-4 h-11 rounded-2xl text-gray-400 font-bold text-[13px]"
                >
                  スキップ
                </button>
              )}
              {step < totalSteps - 1 ? (
                <button
                  onClick={() => {
                    haptic("tick");
                    setStep((s) => s + 1);
                  }}
                  className="flex-1 h-11 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-extrabold shadow-md"
                >
                  次へ
                </button>
              ) : (
                <button
                  onClick={async () => {
                    await finish();
                    onClose();
                  }}
                  className="flex-1 h-11 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-extrabold shadow-md"
                >
                  はじめる
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
