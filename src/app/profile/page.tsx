"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { useRouter } from "next/navigation";
import { getProfile, saveProfile } from "@/lib/services/profile";
import { UserProfile, defaultProfile } from "@/types/profile";
import { getApplications, type Application } from "@/lib/services/applications";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import { haptic } from "@/lib/haptic";

function computeCompleteness(p: UserProfile): { percent: number; missing: string[] } {
  const checks = [
    { label: "名前", ok: !!p.name },
    { label: "年齢", ok: !!p.age },
    { label: "居住地", ok: !!p.location },
    { label: "自己紹介", ok: !!p.selfIntro && p.selfIntro.length >= 20 },
    { label: "スキル", ok: p.skills.length > 0 },
    { label: "趣味", ok: p.hobbies.length > 0 },
    { label: "学歴", ok: !!p.education },
    { label: "希望カテゴリ", ok: p.desiredCategories.length > 0 },
    { label: "写真", ok: !!p.photo },
  ];
  const ok = checks.filter((c) => c.ok).length;
  return {
    percent: Math.round((ok / checks.length) * 100),
    missing: checks.filter((c) => !c.ok).map((c) => c.label),
  };
}

const HOBBY_OPTIONS = [
  "読書", "映画鑑賞", "音楽", "旅行", "料理", "スポーツ",
  "ゲーム", "写真", "カフェ巡り", "ショッピング", "アニメ",
  "キャンプ", "ヨガ", "ランニング", "ドライブ", "DIY",
];

const SKILL_OPTIONS = [
  "接客", "コミュニケーション", "PC基本操作", "Excel", "英語",
  "中国語", "調理", "レジ打ち", "事務", "営業",
  "プログラミング", "デザイン", "動画編集", "SNS運用", "ライティング",
  "マーケティング", "経理", "マネジメント",
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [saved, setSaved] = useState(false);
  const [editingHobbies, setEditingHobbies] = useState(false);
  const [editingSkills, setEditingSkills] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const toast = useToast();
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    getProfile().then((p) => {
      // First-time hint: pre-fill name from session display name if empty.
      if (!p.name && auth.session?.displayName) {
        setProfile({ ...p, name: auth.session.displayName });
      } else {
        setProfile(p);
      }
    });
    getApplications().then(setApps);
  }, [auth.session]);

  const completeness = useMemo(() => computeCompleteness(profile), [profile]);
  const activeApps = apps.filter((a) => a.status !== "withdrawn" && a.status !== "rejected");

  function handleChange(field: keyof UserProfile, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  function toggleTag(field: "hobbies" | "skills", tag: string) {
    setProfile((prev) => {
      const current = prev[field];
      const updated = current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag];
      return { ...prev, [field]: updated };
    });
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setProfile((prev) => ({ ...prev, photo: result }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    haptic("success");
    await saveProfile(profile);
    setSaved(true);
    toast.show("プロフィールを保存しました", "success");
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50/50">
      <Header />
      <main className="flex-1 max-w-lg md:max-w-3xl mx-auto w-full px-4 md:px-8 pt-5 md:pt-10 pb-32 md:pb-28">
        <h1 className="text-lg md:text-2xl font-extrabold text-gray-900 mb-4">マイページ</h1>

        {/* Dashboard card */}
        <div className="mb-5 rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white p-4 md:p-5 shadow-lg shadow-violet-200/60">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-[10px] tracking-[0.2em] font-bold opacity-80">PROFILE STRENGTH</p>
              <p className="text-3xl md:text-4xl font-black tabular-nums leading-none mt-1">
                {completeness.percent}<span className="text-base">%</span>
              </p>
            </div>
            <p className="text-[11px] opacity-80 max-w-[60%] text-right leading-relaxed">
              {completeness.percent === 100
                ? "完璧。応募準備バッチリ。"
                : `あと${completeness.missing.length}項目で完成`}
            </p>
          </div>
          <div className="h-2 rounded-full bg-white/25 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${completeness.percent}%` }}
            />
          </div>
          {completeness.missing.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {completeness.missing.slice(0, 4).map((m) => (
                <span key={m} className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                  + {m}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* KYC status card */}
        <Link
          href="/verify"
          className="block mb-3 rounded-2xl border p-3.5 transition active:scale-[0.99] hover:shadow-sm"
          style={
            profile.kyc.status === "verified"
              ? { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" }
              : { backgroundColor: "#fff", borderColor: "#e5e7eb" }
          }
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                profile.kyc.status === "verified"
                  ? "bg-emerald-500"
                  : "bg-violet-100"
              }`}
            >
              {profile.kyc.status === "verified" ? (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-[10px] tracking-[0.2em] font-bold ${
                  profile.kyc.status === "verified" ? "text-emerald-600" : "text-violet-500"
                }`}
              >
                ID VERIFICATION
              </p>
              <p className="text-[13px] font-extrabold text-gray-900">
                {profile.kyc.status === "verified"
                  ? "本人確認済み"
                  : profile.kyc.status === "rejected"
                  ? "確認に失敗 - 再試行する"
                  : "本人確認をする →"}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {profile.kyc.status === "verified"
                  ? "信頼バッジ付き。優良企業のスカウト対象に。"
                  : "免許証＋顔写真でAI照合（3分）"}
              </p>
            </div>
            <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <Link
            href="/applications"
            className="flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 p-3 hover:border-violet-200 hover:shadow-sm transition"
          >
            <p className="text-[10px] text-gray-400 font-bold">応募中</p>
            <p className="text-xl font-black text-gray-900 tabular-nums">{activeApps.length}</p>
            <p className="text-[10px] text-violet-500 font-bold mt-0.5">応募管理 →</p>
          </Link>
          <Link
            href="/likes"
            className="flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 p-3 hover:border-pink-200 hover:shadow-sm transition"
          >
            <p className="text-[10px] text-gray-400 font-bold">LIKE</p>
            <p className="text-xl font-black text-gray-900 tabular-nums">—</p>
            <p className="text-[10px] text-pink-500 font-bold mt-0.5">一覧を見る →</p>
          </Link>
          <Link
            href="/notifications"
            className="flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 p-3 hover:border-amber-200 hover:shadow-sm transition"
          >
            <p className="text-[10px] text-gray-400 font-bold">お知らせ</p>
            <p className="text-xl font-black text-gray-900 tabular-nums">●</p>
            <p className="text-[10px] text-amber-600 font-bold mt-0.5">確認する →</p>
          </Link>
        </div>

        {/* Photo section */}
        <div className="flex flex-col items-center mb-6">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-200 overflow-hidden hover:border-violet-300 transition-colors group"
          >
            {profile.photo ? (
              <img
                src={profile.photo}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-300 group-hover:text-violet-400 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            )}
            {/* Edit overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
          <p className="text-[10px] text-gray-400 mt-2">タップして写真を設定</p>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          {/* Basic info */}
          <SectionTitle>基本情報</SectionTitle>

          <InputField
            label="名前"
            placeholder="山田 太郎"
            value={profile.name}
            onChange={(v) => handleChange("name", v)}
          />

          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="年齢"
              placeholder="25"
              value={profile.age}
              onChange={(v) => handleChange("age", v)}
              type="number"
            />
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1.5">性別</label>
              <select
                value={profile.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
              >
                <option value="">選択してください</option>
                <option value="male">男性</option>
                <option value="female">女性</option>
                <option value="other">その他</option>
                <option value="private">回答しない</option>
              </select>
            </div>
          </div>

          <InputField
            label="居住地"
            placeholder="東京都渋谷区"
            value={profile.location}
            onChange={(v) => handleChange("location", v)}
          />

          {/* Self intro */}
          <SectionTitle>自己紹介</SectionTitle>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1.5">自己紹介文</label>
            <textarea
              value={profile.selfIntro}
              onChange={(e) => handleChange("selfIntro", e.target.value)}
              placeholder="あなたのことを教えてください..."
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 resize-none focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all placeholder:text-gray-300"
            />
            <p className="text-[10px] text-gray-300 mt-1 text-right">
              {profile.selfIntro.length} / 500
            </p>
          </div>

          {/* Hobbies */}
          <SectionTitle>趣味</SectionTitle>
          <div>
            <div className="flex flex-wrap gap-1.5">
              {profile.hobbies.map((hobby) => (
                <span
                  key={hobby}
                  className="px-2.5 py-1 rounded-full bg-violet-50 text-violet-600 text-[11px] font-medium border border-violet-100 flex items-center gap-1"
                >
                  {hobby}
                  <button
                    onClick={() => toggleTag("hobbies", hobby)}
                    className="text-violet-300 hover:text-violet-600"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
              <button
                onClick={() => setEditingHobbies(!editingHobbies)}
                className="px-2.5 py-1 rounded-full border border-dashed border-gray-200 text-[11px] text-gray-400 hover:border-violet-300 hover:text-violet-500 transition-colors"
              >
                + 追加
              </button>
            </div>
            {editingHobbies && (
              <div className="mt-2 p-3 bg-white rounded-xl border border-gray-100 flex flex-wrap gap-1.5">
                {HOBBY_OPTIONS.filter((h) => !profile.hobbies.includes(h)).map((hobby) => (
                  <button
                    key={hobby}
                    onClick={() => toggleTag("hobbies", hobby)}
                    className="px-2.5 py-1 rounded-full bg-gray-50 text-[11px] text-gray-500 hover:bg-violet-50 hover:text-violet-600 transition-colors"
                  >
                    {hobby}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Skills */}
          <SectionTitle>スキル・経験</SectionTitle>
          <div>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-medium border border-emerald-100 flex items-center gap-1"
                >
                  {skill}
                  <button
                    onClick={() => toggleTag("skills", skill)}
                    className="text-emerald-300 hover:text-emerald-600"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
              <button
                onClick={() => setEditingSkills(!editingSkills)}
                className="px-2.5 py-1 rounded-full border border-dashed border-gray-200 text-[11px] text-gray-400 hover:border-emerald-300 hover:text-emerald-500 transition-colors"
              >
                + 追加
              </button>
            </div>
            {editingSkills && (
              <div className="mt-2 p-3 bg-white rounded-xl border border-gray-100 flex flex-wrap gap-1.5">
                {SKILL_OPTIONS.filter((s) => !profile.skills.includes(s)).map((skill) => (
                  <button
                    key={skill}
                    onClick={() => toggleTag("skills", skill)}
                    className="px-2.5 py-1 rounded-full bg-gray-50 text-[11px] text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                  >
                    {skill}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Career info */}
          <SectionTitle>経歴</SectionTitle>

          <InputField
            label="最終学歴"
            placeholder="○○大学 △△学部"
            value={profile.education}
            onChange={(v) => handleChange("education", v)}
          />

          <InputField
            label="職務経験"
            placeholder="カフェスタッフ 2年、事務 1年"
            value={profile.experience}
            onChange={(v) => handleChange("experience", v)}
          />

          {/* Desired job type */}
          <SectionTitle>希望条件</SectionTitle>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1.5">希望雇用形態</label>
            <div className="flex gap-2">
              {([
                { value: "baito", label: "バイト" },
                { value: "gig", label: "単発" },
                { value: "career", label: "正社員" },
                { value: "both", label: "ぜんぶ" },
              ] as const).map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleChange("desiredJobType", option.value)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    profile.desiredJobType === option.value
                      ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-200"
                      : "bg-white border border-gray-200 text-gray-400 hover:border-violet-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Account */}
          <SectionTitle>アカウント</SectionTitle>
          <div className="rounded-2xl bg-white border border-gray-100 p-4">
            {auth.session ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-400">ログイン中</p>
                    <p className="text-sm font-extrabold text-gray-900 truncate">
                      {auth.session.displayName}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">{auth.session.email}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-600">
                    ●ログイン済
                  </span>
                </div>
                <button
                  onClick={async () => {
                    haptic("warn");
                    if (!confirm("ログアウトしますか？")) return;
                    await auth.signOut();
                    toast.show("ログアウトしました", "info");
                    router.push("/login");
                  }}
                  className="w-full py-2.5 rounded-xl border border-gray-200 text-[12px] font-bold text-gray-600 hover:border-rose-200 hover:text-rose-500 transition"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <div>
                <p className="text-[12px] text-gray-600 mb-3 leading-relaxed">
                  ログインすると、応募履歴やLIKEを複数の端末で同期できます。
                </p>
                <div className="flex gap-2">
                  <Link
                    href="/login"
                    className="flex-1 text-center py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[12px] font-extrabold shadow-md"
                  >
                    ログイン
                  </Link>
                  <Link
                    href="/signup"
                    className="flex-1 text-center py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-[12px] font-bold"
                  >
                    新規登録
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Save button - above bottom nav */}
      <div className="fixed bottom-14 md:bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100/50 px-5 py-2.5 md:py-3">
        <div className="max-w-lg md:max-w-3xl mx-auto">
          <button
            onClick={handleSave}
            className={`w-full h-11 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] ${
              saved
                ? "bg-emerald-500 text-white"
                : "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-200"
            }`}
          >
            {saved ? "保存しました！" : "プロフィールを保存"}
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-extrabold text-gray-900 flex items-center gap-2 pt-2">
      <div className="w-1 h-4 rounded-full bg-gradient-to-b from-violet-500 to-fuchsia-500" />
      {children}
    </h2>
  );
}

function InputField({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-500 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all placeholder:text-gray-300"
      />
    </div>
  );
}
