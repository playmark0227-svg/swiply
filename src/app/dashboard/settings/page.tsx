"use client";

import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { DEMO_COMPANY } from "@/lib/services/companyDemo";

type SettingsTab = "profile" | "plan" | "notifications" | "integrations";

export default function DashboardSettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("profile");

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "profile",
      label: "会社プロフィール",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      id: "plan",
      label: "プラン・請求",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      id: "notifications",
      label: "通知設定",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      id: "integrations",
      label: "外部連携",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
    },
  ];

  return (
    <DashboardShell>
      <div className="px-4 lg:px-8 py-6 lg:py-8 max-w-5xl mx-auto">
        {/* Demo banner */}
        <div className="mb-6 relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/30 -translate-y-1/2 translate-x-1/4" />
          </div>
          <div className="flex items-center gap-2.5 relative">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <p className="text-[12px] font-bold text-white">デモモードで体験中 — 設定変更は保存されません</p>
          </div>
          <a href="/business#contact" className="relative shrink-0 px-4 py-1.5 rounded-lg bg-white/20 text-white text-[11px] font-bold hover:bg-white/30 transition">
            本番を始める →
          </a>
        </div>

        <h1 className="text-xl lg:text-2xl font-black text-gray-900 mb-6">設定</h1>

        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
          {/* Sidebar tabs */}
          <nav className="flex lg:flex-col gap-1 mb-5 lg:mb-0 overflow-x-auto pb-2 lg:pb-0">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-bold transition whitespace-nowrap ${
                  tab === t.id
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="min-w-0">
            {tab === "profile" && <ProfileTab />}
            {tab === "plan" && <PlanTab />}
            {tab === "notifications" && <NotificationsTab />}
            {tab === "integrations" && <IntegrationsTab />}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function ProfileTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm">
        <h2 className="text-[15px] font-extrabold text-gray-900 mb-5">基本情報</h2>

        {/* Company logo + name */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={DEMO_COMPANY.logo}
              alt={DEMO_COMPANY.name}
              className="w-20 h-20 rounded-2xl object-cover shadow-md"
            />
            <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <div>
            <h3 className="text-[16px] font-extrabold text-gray-900">{DEMO_COMPANY.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 border border-amber-200">
                FOUNDING MEMBER
              </span>
              {DEMO_COMPANY.verified && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  認証済み
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <FormField label="会社名" value={DEMO_COMPANY.name} />
          <FormField label="業種" value={DEMO_COMPANY.industry} />
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="所在地" value="東京都渋谷区神宮前3-15-8" />
            <FormField label="電話番号" value="03-1234-5678" />
          </div>
          <FormField label="Webサイト" value="https://hairsalon-bloom.example.com" />
          <div>
            <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">会社紹介</label>
            <textarea
              className="w-full h-24 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
              defaultValue="渋谷・表参道エリアで展開するヘアサロン。一人ひとりのお客様に寄り添った丁寧な施術と、トレンドを取り入れたスタイル提案が強みです。"
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-[13px] font-extrabold shadow-md shadow-blue-200/50 hover:shadow-lg active:scale-[0.97] transition">
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanTab() {
  return (
    <div className="space-y-6">
      {/* Current plan */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm">
        <h2 className="text-[15px] font-extrabold text-gray-900 mb-5">現在のプラン</h2>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200/50 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z"/>
                </svg>
                <h3 className="text-[16px] font-black text-gray-900">FOUNDING プラン</h3>
              </div>
              <p className="text-[12px] text-gray-500">100社限定の創業メンバー特典</p>
            </div>
            <span className="text-[20px] font-black text-amber-600">
              <span className="text-[12px] font-bold text-gray-400">月額 </span>
              ¥0
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              "求人掲載 無制限",
              "AIマッチング",
              "ビデオ面接",
              "分析ダッシュボード",
              "LINE通知連携",
              "優先サポート",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-[12px] text-gray-700">
                <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {feature}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Billing history */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm">
        <h2 className="text-[15px] font-extrabold text-gray-900 mb-5">請求履歴</h2>
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
          </div>
          <p className="text-[13px] font-bold text-gray-500">FOUNDINGプランは無料です</p>
          <p className="text-[11px] text-gray-400 mt-1">請求履歴はありません</p>
        </div>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const [settings, setSettings] = useState({
    newLike: true,
    newMatch: true,
    newMessage: true,
    newApplication: true,
    interviewReminder: true,
    weeklyReport: true,
    emailNotif: true,
    lineNotif: false,
    pushNotif: true,
  });

  function toggle(key: keyof typeof settings) {
    setSettings((s) => ({ ...s, [key]: !s[key] }));
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm">
        <h2 className="text-[15px] font-extrabold text-gray-900 mb-5">通知の種類</h2>
        <div className="space-y-4">
          <ToggleRow
            label="新しいLIKE"
            description="求職者があなたの求人をLIKEした時"
            checked={settings.newLike}
            onChange={() => toggle("newLike")}
          />
          <ToggleRow
            label="新しいマッチ"
            description="相互LIKEでマッチが成立した時"
            checked={settings.newMatch}
            onChange={() => toggle("newMatch")}
          />
          <ToggleRow
            label="新しいメッセージ"
            description="候補者からメッセージが届いた時"
            checked={settings.newMessage}
            onChange={() => toggle("newMessage")}
          />
          <ToggleRow
            label="新しい応募"
            description="候補者が求人に応募した時"
            checked={settings.newApplication}
            onChange={() => toggle("newApplication")}
          />
          <ToggleRow
            label="面接リマインダー"
            description="面接の24時間前と1時間前"
            checked={settings.interviewReminder}
            onChange={() => toggle("interviewReminder")}
          />
          <ToggleRow
            label="週次レポート"
            description="毎週月曜日にパフォーマンスレポートを送信"
            checked={settings.weeklyReport}
            onChange={() => toggle("weeklyReport")}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm">
        <h2 className="text-[15px] font-extrabold text-gray-900 mb-5">通知チャネル</h2>
        <div className="space-y-4">
          <ToggleRow
            label="メール通知"
            description="登録メールアドレスに通知"
            checked={settings.emailNotif}
            onChange={() => toggle("emailNotif")}
          />
          <ToggleRow
            label="LINE通知"
            description="LINE公式アカウント経由で通知"
            checked={settings.lineNotif}
            onChange={() => toggle("lineNotif")}
          />
          <ToggleRow
            label="プッシュ通知"
            description="ブラウザのプッシュ通知"
            checked={settings.pushNotif}
            onChange={() => toggle("pushNotif")}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-[13px] font-extrabold shadow-md shadow-blue-200/50 hover:shadow-lg active:scale-[0.97] transition">
          保存する
        </button>
      </div>
    </div>
  );
}

function IntegrationsTab() {
  const integrations = [
    {
      name: "LINE公式アカウント",
      description: "マッチ・メッセージ通知をLINEで受信",
      icon: (
        <div className="w-10 h-10 rounded-xl bg-[#06C755] flex items-center justify-center text-white font-black text-[14px]">
          L
        </div>
      ),
      connected: false,
    },
    {
      name: "Google カレンダー",
      description: "面接スケジュールを自動で同期",
      icon: (
        <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
          </svg>
        </div>
      ),
      connected: false,
    },
    {
      name: "Slack",
      description: "チームチャンネルにリアルタイム通知",
      icon: (
        <div className="w-10 h-10 rounded-xl bg-[#4A154B] flex items-center justify-center text-white font-black text-[14px]">
          S
        </div>
      ),
      connected: false,
    },
    {
      name: "Zoom",
      description: "ビデオ面接をZoomで実施",
      icon: (
        <div className="w-10 h-10 rounded-xl bg-[#2D8CFF] flex items-center justify-center text-white font-black text-[12px]">
          Z
        </div>
      ),
      connected: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm">
        <h2 className="text-[15px] font-extrabold text-gray-900 mb-2">外部サービス連携</h2>
        <p className="text-[12px] text-gray-500 mb-5">外部サービスと連携して採用効率をアップ</p>

        <div className="space-y-3">
          {integrations.map((int) => (
            <div
              key={int.name}
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition"
            >
              {int.icon}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-extrabold text-gray-900">{int.name}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{int.description}</p>
              </div>
              <button
                className={`shrink-0 px-4 py-2 rounded-xl text-[12px] font-bold transition ${
                  int.connected
                    ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    : "bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-md shadow-blue-200/50 hover:shadow-lg active:scale-[0.97]"
                }`}
              >
                {int.connected ? "接続済み" : "連携する"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 lg:p-6 text-white">
        <h3 className="text-[14px] font-extrabold mb-2">API連携</h3>
        <p className="text-[12px] text-white/60 mb-4">独自のシステムとSWIPLYを連携できます</p>
        <div className="bg-white/10 rounded-xl p-3">
          <p className="text-[10px] text-white/40 font-bold mb-1">API キー</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[12px] font-mono text-white/70 bg-white/5 rounded-lg px-3 py-1.5 truncate">
              sk_demo_xxxxxxxxxxxxxxxxxx
            </code>
            <button className="shrink-0 px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-[11px] font-bold hover:bg-white/20 transition">
              コピー
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-[11px] font-bold text-gray-500 mb-1.5 block">{label}</label>
      <input
        type="text"
        defaultValue={value}
        className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-gray-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-[13px] font-bold text-gray-900">{label}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
          checked ? "bg-gradient-to-r from-blue-500 to-cyan-400" : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
