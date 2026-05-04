"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CATEGORY_OPTIONS,
  PREFECTURE_GROUPS,
  type JobFilters,
} from "@/lib/services/search";
import { haptic } from "@/lib/haptic";

interface Props {
  open: boolean;
  initial: JobFilters;
  onClose: () => void;
  onApply: (next: JobFilters) => void;
  /** Hide the type tabs when the page is already type-scoped (e.g., /baito). */
  hideTypeFilter?: boolean;
}

const SALARY_PRESETS = [
  { label: "指定なし", value: 0 },
  { label: "時給1,200円〜", value: 1200 },
  { label: "時給1,500円〜", value: 1500 },
  { label: "月給30万〜", value: 300000 },
  { label: "月給40万〜", value: 400000 },
];

export default function FilterSheet({
  open,
  initial,
  onClose,
  onApply,
  hideTypeFilter,
}: Props) {
  const [draft, setDraft] = useState<JobFilters>(initial);

  useEffect(() => {
    // Reset the draft each time the sheet (re)opens with a new initial
    // value. Legitimate external→internal sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setDraft(initial);
  }, [open, initial]);

  function set<K extends keyof JobFilters>(key: K, value: JobFilters[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function reset() {
    haptic("warn");
    const cleared: JobFilters = {
      type: hideTypeFilter ? initial.type : "all",
      region: "all",
      category: "all",
      minSalary: 0,
      remoteOnly: false,
      urgentOnly: false,
      featuredOnly: false,
      sort: draft.sort,
      q: draft.q,
    };
    setDraft(cleared);
  }

  function apply() {
    haptic("success");
    onApply(draft);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="閉じる"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-label="絞り込み"
            className="fixed inset-x-0 bottom-0 md:inset-0 md:m-auto md:h-[80dvh] md:max-w-2xl z-[101] bg-white md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
          >
            <div className="px-5 pt-3 pb-2 border-b border-gray-100 flex items-center justify-between">
              <button
                onClick={reset}
                className="text-[12px] font-bold text-gray-400 hover:text-gray-700"
              >
                リセット
              </button>
              <h2 className="text-sm font-extrabold text-gray-900">絞り込み</h2>
              <button
                onClick={onClose}
                aria-label="閉じる"
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
              {!hideTypeFilter && (
                <Section title="雇用形態">
                  <Pills
                    value={draft.type ?? "all"}
                    options={[
                      { value: "all", label: "すべて" },
                      { value: "baito", label: "アルバイト" },
                      { value: "gig", label: "単発" },
                      { value: "career", label: "正社員" },
                    ]}
                    onChange={(v) => set("type", v as JobFilters["type"])}
                  />
                </Section>
              )}

              <Section title="エリア">
                <select
                  value={draft.region ?? "all"}
                  onChange={(e) => {
                    haptic("tick");
                    set("region", e.target.value);
                  }}
                  className="w-full px-3.5 py-3 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                >
                  <option value="all">すべて</option>
                  {PREFECTURE_GROUPS.map((g) => (
                    <optgroup key={g.region} label={g.region}>
                      {g.prefectures.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </Section>

              <Section title="カテゴリ">
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {CATEGORY_OPTIONS.map((opt) => {
                    const active = (draft.category ?? "all") === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          haptic("tick");
                          set("category", opt.value);
                        }}
                        className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-[11px] font-bold transition-all ${
                          active
                            ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white border-transparent shadow-md shadow-violet-200"
                            : "bg-white text-gray-600 border-gray-200 hover:border-violet-300"
                        }`}
                      >
                        <span className="text-base leading-none">{opt.emoji}</span>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </Section>

              <Section title="給与">
                <div className="flex flex-wrap gap-2">
                  {SALARY_PRESETS.map((p) => {
                    const active = (draft.minSalary ?? 0) === p.value;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => {
                          haptic("tick");
                          set("minSalary", p.value);
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
                          active
                            ? "bg-emerald-500 text-white border-transparent"
                            : "bg-white text-gray-600 border-gray-200"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </Section>

              <Section title="こだわり条件">
                <div className="flex flex-col gap-2">
                  <Toggle
                    label="リモートOKのみ"
                    value={!!draft.remoteOnly}
                    onChange={(v) => set("remoteOnly", v)}
                  />
                  <Toggle
                    label="急募のみ"
                    value={!!draft.urgentOnly}
                    onChange={(v) => set("urgentOnly", v)}
                  />
                  <Toggle
                    label="注目求人のみ"
                    value={!!draft.featuredOnly}
                    onChange={(v) => set("featuredOnly", v)}
                  />
                </div>
              </Section>
            </div>

            <div className="px-5 py-3 border-t border-gray-100 bg-white">
              <button
                onClick={apply}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-extrabold shadow-lg shadow-violet-200/50 active:scale-[0.98] transition"
              >
                この条件で絞り込む
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-2.5">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Pills({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => {
              haptic("tick");
              onChange(o.value);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
              active
                ? "bg-violet-600 text-white border-transparent shadow-sm shadow-violet-200"
                : "bg-white text-gray-600 border-gray-200 hover:border-violet-300"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        haptic("tick");
        onChange(!value);
      }}
      className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 hover:border-violet-200 transition"
    >
      {label}
      <span
        className={`relative inline-flex w-10 h-6 rounded-full transition-colors ${
          value ? "bg-emerald-500" : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            value ? "translate-x-4" : ""
          }`}
        />
      </span>
    </button>
  );
}
