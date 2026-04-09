"use client";

import { useEffect, useState, useRef } from "react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { getProfile, saveProfile } from "@/lib/profile";
import { UserProfile, defaultProfile } from "@/types/profile";

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

  useEffect(() => {
    setProfile(getProfile());
  }, []);

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

  function handleSave() {
    saveProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50/50">
      <Header />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-5 pb-32">
        <h1 className="text-lg font-extrabold text-gray-900 mb-5">プロフィール</h1>

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
                { value: "baito", label: "アルバイト" },
                { value: "career", label: "正社員" },
                { value: "both", label: "どちらも" },
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
        </div>
      </main>

      {/* Save button - above bottom nav */}
      <div className="fixed bottom-14 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100/50 px-5 py-2.5">
        <div className="max-w-lg mx-auto">
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
