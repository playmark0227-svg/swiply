"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo";
import type { UserProfile } from "@/types/profile";
import { CATEGORY_OPTIONS, PREFECTURE_GROUPS } from "@/lib/services/search";
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
            className="fixed inset-3 sm:inset-6 md:inset-0 md:m-auto md:max-w-2xl md:max-h-[92dvh] md:w-[92vw] rounded-3xl bg-white z-[141] shadow-2xl overflow-hidden flex flex-col"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            {/* Brand header */}
            <div className="flex items-center gap-2 px-5 md:px-7 pt-4 md:pt-5 pb-1">
              <Logo size={28} radius={8} />
              <span className="text-[14px] font-black tracking-tight bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                SWIPLY
              </span>
              <span className="text-[11px] text-gray-400 ml-1">へようこそ</span>
            </div>

            {/* Progress */}
            <div className="px-5 md:px-7 pt-2 pb-3">
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

            <div className="flex-1 overflow-y-auto px-5 md:px-7 pb-3">
              {step === 0 && (
                <div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-1">
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
                  <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-1">
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
                <RegionStep
                  selected={draft.desiredLocations}
                  onToggle={toggleRegion}
                  onSetAll={(values) => patch({ desiredLocations: values })}
                />
              )}

              {step === 3 && (
                <div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-1">
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

            <div className="px-5 md:px-7 py-3 md:py-4 border-t border-gray-100 flex gap-2">
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

function RegionStep({
  selected,
  onToggle,
  onSetAll,
}: {
  selected: string[];
  onToggle: (value: string) => void;
  onSetAll: (values: string[]) => void;
}) {
  // Auto-expand any group that already has a selection so the user
  // can see what they've picked. The 在宅 group always expands.
  const initialExpanded = useMemo(() => {
    const out = new Set<string>();
    for (const g of PREFECTURE_GROUPS) {
      if (
        g.region === "在宅" ||
        g.prefectures.some((p) => selected.includes(p.value))
      ) {
        out.add(g.region);
      }
    }
    if (out.size === 0) out.add("関東"); // sensible default
    return out;
  }, [selected]);
  const [expanded, setExpanded] = useState<Set<string>>(initialExpanded);

  function toggleExpand(region: string) {
    haptic("tick");
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(region)) next.delete(region);
      else next.add(region);
      return next;
    });
  }

  function selectedCountInGroup(group: typeof PREFECTURE_GROUPS[number]): number {
    return group.prefectures.filter((p) => selected.includes(p.value)).length;
  }

  function selectGroup(group: typeof PREFECTURE_GROUPS[number]) {
    haptic("tick");
    const groupValues = group.prefectures.map((p) => p.value);
    const allSelected = groupValues.every((v) => selected.includes(v));
    if (allSelected) {
      // Deselect all in this group
      onSetAll(selected.filter((s) => !groupValues.includes(s)));
    } else {
      // Add any not yet selected
      const next = [...new Set([...selected, ...groupValues])];
      onSetAll(next);
    }
  }

  return (
    <div>
      <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-1">
        エリアは？
      </h2>
      <p className="text-[12px] md:text-[13px] text-gray-500 mb-4">
        通える範囲を選んでね（全国対応・複数選択OK）
      </p>

      <div className="flex items-center justify-between text-[11px] mb-3">
        <span className="text-gray-400">
          {selected.length > 0 ? `${selected.length}件 選択中` : "未選択"}
        </span>
        {selected.length > 0 && (
          <button
            onClick={() => {
              haptic("warn");
              onSetAll([]);
            }}
            className="text-gray-400 hover:text-rose-500 font-bold"
          >
            すべてクリア
          </button>
        )}
      </div>

      <div className="space-y-2">
        {PREFECTURE_GROUPS.map((group) => {
          const isOpen = expanded.has(group.region);
          const count = selectedCountInGroup(group);
          const totalInGroup = group.prefectures.length;
          const allInGroup = count === totalInGroup;
          return (
            <div
              key={group.region}
              className={`rounded-2xl border transition ${
                count > 0
                  ? "border-violet-200 bg-violet-50/30"
                  : "border-gray-100 bg-white"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleExpand(group.region)}
                className="w-full px-4 py-3 flex items-center gap-2"
              >
                <span className="text-[13px] font-extrabold text-gray-900">
                  {group.region}
                </span>
                {count > 0 && (
                  <span className="text-[10px] font-bold text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded-full">
                    {count}/{totalInGroup}
                  </span>
                )}
                <span className="flex-1" />
                {totalInGroup > 1 && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      selectGroup(group);
                    }}
                    className="text-[10px] font-bold text-violet-600 hover:text-violet-700 px-2 py-0.5 rounded-full bg-white border border-violet-200"
                  >
                    {allInGroup ? "解除" : "全選択"}
                  </span>
                )}
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {isOpen && (
                <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                  {group.prefectures.map((p) => {
                    const active = selected.includes(p.value);
                    return (
                      <button
                        key={p.value}
                        onClick={() => onToggle(p.value)}
                        className={`px-3 py-1.5 rounded-full border-2 text-[12px] font-bold transition ${
                          active
                            ? "border-violet-500 bg-violet-500 text-white shadow-sm"
                            : "border-gray-200 bg-white text-gray-700 hover:border-violet-300"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
