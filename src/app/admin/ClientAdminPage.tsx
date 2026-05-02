"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Logo from "@/components/Logo";
import {
  enrollAdmin,
  isAdminAuthenticated,
  isAdminEnrolled,
  loginAdmin,
  logoutAdmin,
  changeAdminPassword,
  resetAdminCredential,
} from "@/lib/services/adminAuth";
import {
  getMergedJobs,
  updateJob,
  deleteJob,
  restoreJob,
  createJob,
  deleteAdminJob,
  isJobAdminCreated,
  resetJobs,
  makeNewJobId,
} from "@/lib/services/adminJobs";
import {
  getApplications,
  STATUS_LABEL,
  STATUS_TONE,
  adminSetApplicationStatus,
  adminDeleteApplication,
  type Application,
  type ApplicationStatus,
} from "@/lib/services/applications";
import { getLocalLeads, type BusinessLead } from "@/lib/services/businessLeads";
import { getLocalAccounts } from "@/lib/services/userAuth";
import { getProfile, saveProfile } from "@/lib/services/profile";
import { getLikedJobIds } from "@/lib/services/likes";
import type { Job, JobType } from "@/types/job";
import type { UserProfile } from "@/types/profile";

type Tab =
  | "dashboard"
  | "jobs"
  | "applications"
  | "leads"
  | "users"
  | "kyc"
  | "settings";

// =================================================================
// Page entry
// =================================================================
export default function ClientAdminPage() {
  // Lazy initializer: read auth state synchronously on the client. The
  // page is dynamically imported via next/dynamic ({ ssr: false }), so
  // this never runs during static generation.
  const [authed, setAuthed] = useState<boolean | null>(() => {
    if (typeof window === "undefined") return null;
    return isAdminAuthenticated();
  });

  if (authed === null) {
    return <div className="min-h-dvh bg-gray-950" />;
  }
  if (!authed) {
    return <AuthGate onAuthed={() => setAuthed(true)} />;
  }
  return <AdminShell onSignOut={() => setAuthed(false)} />;
}

// =================================================================
// Auth gate (enroll on first visit, login afterwards)
// =================================================================
function AuthGate({ onAuthed }: { onAuthed: () => void }) {
  const [enrolled, setEnrolled] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setEnrolled(isAdminEnrolled());
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (enrolled) {
        await loginAdmin(password);
      } else {
        if (password !== confirmPassword) {
          throw new Error("パスワードが一致しません");
        }
        await enrollAdmin(password);
      }
      onAuthed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-gray-950 text-white flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 justify-center mb-8">
          <Logo size={48} radius={14} priority />
          <div className="leading-tight">
            <p className="text-xl font-black tracking-tight bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              ViFight
            </p>
            <p className="text-[10px] tracking-[0.25em] text-white/40 font-bold">
              ADMIN CONSOLE
            </p>
          </div>
        </div>

        <h1 className="text-xl font-extrabold text-center mb-1">
          {enrolled ? "管理者ログイン" : "管理者パスワード設定"}
        </h1>
        <p className="text-[12px] text-white/50 text-center mb-7 leading-relaxed">
          {enrolled
            ? "SWIPLY 運営者向け管理コンソール"
            : "このブラウザで使う管理者パスワードを設定してください"}
        </p>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10"
          />
          {!enrolled && (
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="パスワード（確認）"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 focus:bg-white/10"
            />
          )}

          {error && (
            <p className="text-[12px] text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-sm font-extrabold disabled:opacity-60"
          >
            {submitting ? "..." : enrolled ? "ログイン" : "設定して入る"}
          </button>
        </form>

        <p className="text-[10px] text-white/30 text-center mt-6 leading-relaxed">
          ⚠ デモ環境では認証情報がブラウザ内（localStorage）に保存されます。
          <br />
          本番運用では Firebase Custom Claims / IDaaS への移行が必須です。
        </p>

        <Link
          href="/"
          className="block text-center text-[11px] text-white/40 hover:text-white mt-4"
        >
          ← サイトに戻る
        </Link>
      </div>
    </div>
  );
}

// =================================================================
// Authenticated shell with sidebar nav
// =================================================================
function AdminShell({ onSignOut }: { onSignOut: () => void }) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [navOpen, setNavOpen] = useState(false);

  function handleSignOut() {
    logoutAdmin();
    onSignOut();
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "ダッシュボード", icon: <IconDashboard /> },
    { id: "jobs", label: "求人管理", icon: <IconBriefcase /> },
    { id: "applications", label: "応募管理", icon: <IconClipboard /> },
    { id: "leads", label: "B2Bリード", icon: <IconBuilding /> },
    { id: "users", label: "ユーザー", icon: <IconUsers /> },
    { id: "kyc", label: "本人確認", icon: <IconShield /> },
    { id: "settings", label: "設定", icon: <IconCog /> },
  ];

  return (
    <div className="min-h-dvh bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`${navOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:sticky top-0 left-0 h-dvh w-64 bg-gray-950 text-white z-50 transition-transform flex flex-col`}
      >
        <div className="px-5 py-5 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2">
            <Logo size={32} radius={9} />
            <div className="leading-tight">
              <p className="text-base font-black tracking-tight bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                ViFight
              </p>
              <p className="text-[9px] tracking-[0.25em] text-white/40 font-bold">
                ADMIN CONSOLE
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {tabs.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  setNavOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold transition mb-1 ${
                  active
                    ? "bg-gradient-to-r from-blue-500/30 to-cyan-400/20 text-white border border-cyan-400/30"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className={active ? "text-cyan-300" : "text-white/40"}>
                  {t.icon}
                </span>
                {t.label}
              </button>
            );
          })}
        </nav>

        <div className="px-3 pb-5">
          <Link
            href="/"
            className="block text-center w-full px-3 py-2 rounded-xl text-[12px] text-white/60 hover:bg-white/5 mb-2"
          >
            ← サイトを見る
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full px-3 py-2 rounded-xl text-[12px] text-white/60 hover:bg-rose-500/10 hover:text-rose-300"
          >
            ログアウト
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {navOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setNavOpen(false)}
        />
      )}

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-gray-100 px-4 md:px-8 lg:px-10 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setNavOpen(true)}
              className="md:hidden w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center"
              aria-label="メニュー"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-base md:text-xl lg:text-2xl font-extrabold text-gray-900 tracking-tight">
              {tabs.find((t) => t.id === tab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden md:inline text-[11px] text-gray-400">
              ViFight Console
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-700">DEMO</span>
            </div>
          </div>
        </header>

        <div className="px-4 md:px-8 lg:px-10 py-6 md:py-8 max-w-[1600px] mx-auto w-full">
          {tab === "dashboard" && <DashboardTab onJump={setTab} />}
          {tab === "jobs" && <JobsTab />}
          {tab === "applications" && <ApplicationsTab />}
          {tab === "leads" && <LeadsTab />}
          {tab === "users" && <UsersTab />}
          {tab === "kyc" && <KycTab />}
          {tab === "settings" && <SettingsTab onAfterReset={onSignOut} />}
        </div>
      </main>
    </div>
  );
}

// =================================================================
// Tab: Dashboard
// =================================================================
function DashboardTab({ onJump }: { onJump: (tab: Tab) => void }) {
  const [stats, setStats] = useState({
    jobs: 0,
    activeApps: 0,
    leads: 0,
    users: 0,
    likes: 0,
  });

  useEffect(() => {
    (async () => {
      const [apps, likes] = await Promise.all([getApplications(), getLikedJobIds()]);
      setStats({
        jobs: getMergedJobs().length,
        activeApps: apps.filter((a) => a.status !== "withdrawn" && a.status !== "rejected").length,
        leads: getLocalLeads().length,
        users: getLocalAccounts().length,
        likes: likes.length,
      });
    })();
  }, []);

  const cards = [
    { label: "掲載中の求人", value: stats.jobs, jump: "jobs" as const, tone: "blue" },
    { label: "進行中の応募", value: stats.activeApps, jump: "applications" as const, tone: "violet" },
    { label: "B2Bリード", value: stats.leads, jump: "leads" as const, tone: "amber" },
    { label: "登録ユーザー", value: stats.users, jump: "users" as const, tone: "emerald" },
    { label: "LIKE合計", value: stats.likes, jump: "applications" as const, tone: "rose" },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
        {cards.map((c) => (
          <button
            key={c.label}
            onClick={() => onJump(c.jump)}
            className="text-left bg-white border border-gray-100 rounded-2xl p-4 md:p-5 hover:shadow-md hover:border-blue-100 transition active:scale-[0.99]"
          >
            <p className="text-[10px] md:text-[11px] font-bold text-gray-500 mb-1">{c.label}</p>
            <p className="text-2xl md:text-4xl font-black tabular-nums text-gray-900 leading-none">
              {c.value}
            </p>
            <p className="text-[10px] md:text-[11px] text-blue-500 font-bold mt-2 md:mt-3">詳細を見る →</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6 lg:p-7">
        <h2 className="text-sm md:text-base font-extrabold text-gray-900 mb-3 md:mb-4">クイックアクション</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
          <QuickAction label="新しい求人を作成" onClick={() => onJump("jobs")} />
          <QuickAction label="応募ステータスを更新" onClick={() => onJump("applications")} />
          <QuickAction label="リードを確認" onClick={() => onJump("leads")} />
          <QuickAction label="本人確認の審査" onClick={() => onJump("kyc")} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6 text-[12px] md:text-[13px] text-gray-600 leading-relaxed">
        <p className="font-extrabold text-gray-900 mb-2">⚠ デモ環境について</p>
        <p>
          このコンソールは静的サイト（GitHub Pages）上で動作するため、データはあなたのブラウザの localStorage にのみ保存されます。複数の運営者で同じデータを共有するには、Firestore / Supabase 等のバックエンド連携が必要です。
        </p>
      </div>
    </div>
  );
}

function QuickAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left px-4 py-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/40 transition text-[12px] font-bold text-gray-700"
    >
      {label} →
    </button>
  );
}

// =================================================================
// Tab: Jobs
// =================================================================
function JobsTab() {
  const [editing, setEditing] = useState<Job | null>(null);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<"all" | JobType | "deleted">("all");
  const [bump, setBump] = useState(0);

  // Derive directly via useMemo — re-reads localStorage when `bump` ticks.
  const jobs = useMemo(
    () => (typeof window === "undefined" ? [] : getMergedJobs()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bump]
  );

  function refresh() {
    setBump((b) => b + 1);
  }

  const visible = useMemo(() => {
    if (filter === "all") return jobs;
    if (filter === "deleted") return [];
    return jobs.filter((j) => j.type === filter);
  }, [jobs, filter]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <FilterPill
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label={`すべて (${jobs.length})`}
        />
        <FilterPill
          active={filter === "baito"}
          onClick={() => setFilter("baito")}
          label={`バイト (${jobs.filter((j) => j.type === "baito").length})`}
        />
        <FilterPill
          active={filter === "gig"}
          onClick={() => setFilter("gig")}
          label={`単発 (${jobs.filter((j) => j.type === "gig").length})`}
        />
        <FilterPill
          active={filter === "career"}
          onClick={() => setFilter("career")}
          label={`正社員 (${jobs.filter((j) => j.type === "career").length})`}
        />
        <div className="flex-1" />
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-[12px] font-extrabold shadow-md"
        >
          + 新規作成
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <Th>ID</Th>
                <Th>タイトル</Th>
                <Th>会社</Th>
                <Th>種別</Th>
                <Th>給与</Th>
                <Th>状態</Th>
                <Th>操作</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((job) => (
                <tr key={job.id} className="border-t border-gray-50 hover:bg-gray-50/40">
                  <Td className="font-mono text-[10px] text-gray-400">{job.id}</Td>
                  <Td className="font-bold text-gray-900">
                    <div className="line-clamp-1 max-w-[200px]">{job.title}</div>
                  </Td>
                  <Td className="text-gray-600">
                    <div className="line-clamp-1 max-w-[160px]">{job.company}</div>
                  </Td>
                  <Td>
                    <TypeBadge type={job.type} />
                  </Td>
                  <Td className="text-gray-600 whitespace-nowrap">{job.salary}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {job.featured && <Tag color="amber">★ PICK</Tag>}
                      {job.urgent && <Tag color="rose">急募</Tag>}
                      {job.remoteOk && <Tag color="violet">リモート</Tag>}
                      {isJobAdminCreated(job.id) && <Tag color="cyan">管理画面作成</Tag>}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditing(job)}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 text-[11px] font-bold hover:bg-blue-100"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => {
                          if (!confirm(`「${job.title}」を削除しますか？`)) return;
                          if (isJobAdminCreated(job.id)) {
                            deleteAdminJob(job.id);
                          } else {
                            deleteJob(job.id);
                          }
                          refresh();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 text-[11px] font-bold hover:bg-rose-100"
                      >
                        削除
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-10 text-[12px]">
                    対象がありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Soft-deleted list */}
      <DeletedJobsPanel onRestore={refresh} />

      {editing && (
        <JobEditModal
          job={editing}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            updateJob(editing.id, patch);
            setEditing(null);
            refresh();
          }}
        />
      )}

      {creating && (
        <JobCreateModal
          onClose={() => setCreating(false)}
          onCreate={(j) => {
            createJob(j);
            setCreating(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function DeletedJobsPanel({ onRestore }: { onRestore: () => void }) {
  const [bump, setBump] = useState(0);
  // Recompute when `bump` changes after a restore.
  const allIds = useMemo(() => {
    if (typeof window === "undefined") return [] as string[];
    const merged = new Set(getMergedJobs().map((j) => j.id));
    try {
      const arr = JSON.parse(localStorage.getItem("swiply-jobs-deleted") ?? "[]") as string[];
      return arr.filter((id) => !merged.has(id));
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bump]);

  if (allIds.length === 0) return null;

  return (
    <div className="mt-6 bg-rose-50/40 border border-rose-100 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-extrabold text-rose-700">削除済み（復元可能）</h3>
        <span className="text-[11px] text-rose-500 font-bold">{allIds.length}件</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {allIds.map((id) => (
          <button
            key={id}
            onClick={() => {
              restoreJob(id);
              setBump((b) => b + 1);
              onRestore();
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 text-[11px] font-bold hover:bg-rose-100"
          >
            <span className="font-mono text-[10px]">{id}</span>
            <span className="text-rose-400">↺ 復元</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function JobEditModal({
  job,
  onClose,
  onSave,
}: {
  job: Job;
  onClose: () => void;
  onSave: (patch: Partial<Job>) => void;
}) {
  const [draft, setDraft] = useState<Job>({ ...job });

  function patch<K extends keyof Job>(k: K, v: Job[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  return (
    <ModalShell title={`求人を編集 — ${job.id}`} onClose={onClose}>
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="タイトル">
          <input
            className={inputClass}
            value={draft.title}
            onChange={(e) => patch("title", e.target.value)}
          />
        </Field>
        <Field label="会社名">
          <input
            className={inputClass}
            value={draft.company}
            onChange={(e) => patch("company", e.target.value)}
          />
        </Field>
        <Field label="給与（表示）">
          <input
            className={inputClass}
            value={draft.salary}
            onChange={(e) => patch("salary", e.target.value)}
          />
        </Field>
        <Field label="給与（数値）">
          <input
            type="number"
            className={inputClass}
            value={draft.salaryValue}
            onChange={(e) => patch("salaryValue", parseInt(e.target.value, 10) || 0)}
          />
        </Field>
        <Field label="勤務地">
          <input
            className={inputClass}
            value={draft.location}
            onChange={(e) => patch("location", e.target.value)}
          />
        </Field>
        <Field label="エリア (region)">
          <select
            className={inputClass}
            value={draft.region}
            onChange={(e) => patch("region", e.target.value)}
          >
            {["tokyo", "kanagawa", "saitama", "chiba", "osaka", "remote", "other"].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </Field>
        <Field label="種別">
          <select
            className={inputClass}
            value={draft.type}
            onChange={(e) => patch("type", e.target.value as JobType)}
          >
            <option value="baito">バイト</option>
            <option value="gig">単発</option>
            <option value="career">正社員</option>
          </select>
        </Field>
        <Field label="カテゴリ">
          <input
            className={inputClass}
            value={draft.category}
            onChange={(e) => patch("category", e.target.value)}
          />
        </Field>
        <Field label="雇用形態">
          <input
            className={inputClass}
            value={draft.employmentType}
            onChange={(e) => patch("employmentType", e.target.value)}
          />
        </Field>
        <Field label="勤務日数">
          <input
            className={inputClass}
            value={draft.minDays}
            onChange={(e) => patch("minDays", e.target.value)}
          />
        </Field>
      </div>

      <Field label="キャッチコピー" className="mt-3">
        <input
          className={inputClass}
          value={draft.catchphrase}
          onChange={(e) => patch("catchphrase", e.target.value)}
        />
      </Field>

      <Field label="説明" className="mt-3">
        <textarea
          className={`${inputClass} resize-none`}
          rows={4}
          value={draft.description}
          onChange={(e) => patch("description", e.target.value)}
        />
      </Field>

      <Field label="画像URL" className="mt-3">
        <input
          className={inputClass}
          value={draft.image}
          onChange={(e) => patch("image", e.target.value)}
        />
      </Field>

      <Field label="動画URL（任意）" className="mt-3">
        <input
          className={inputClass}
          value={draft.video ?? ""}
          onChange={(e) => patch("video", e.target.value || undefined)}
          placeholder="未指定ならカテゴリ別の自動マップを使用"
        />
      </Field>

      <Field label="タグ（カンマ区切り）" className="mt-3">
        <input
          className={inputClass}
          value={draft.tags.join(", ")}
          onChange={(e) =>
            patch(
              "tags",
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
        />
      </Field>

      <div className="grid grid-cols-3 gap-3 mt-3">
        <Toggle
          label="★ PICK (featured)"
          on={!!draft.featured}
          onChange={(v) => patch("featured", v)}
        />
        <Toggle label="急募" on={!!draft.urgent} onChange={(v) => patch("urgent", v)} />
        <Toggle
          label="リモートOK"
          on={!!draft.remoteOk}
          onChange={(v) => patch("remoteOk", v)}
        />
      </div>

      <div className="flex gap-2 mt-6">
        <button
          onClick={onClose}
          className="flex-1 h-11 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm"
        >
          キャンセル
        </button>
        <button
          onClick={() => onSave(draft)}
          className="flex-1 h-11 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-extrabold text-sm shadow-md"
        >
          変更を保存
        </button>
      </div>
    </ModalShell>
  );
}

function JobCreateModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (j: Job) => void;
}) {
  const today = new Date().toISOString();
  const seed: Job = {
    id: makeNewJobId(),
    type: "baito",
    company: "",
    title: "",
    salary: "時給 1,200円",
    salaryValue: 1200,
    location: "東京都",
    region: "tokyo",
    catchphrase: "",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=800&fit=crop",
    description: "",
    requirements: [],
    benefits: [],
    workHours: "9:00-18:00",
    access: "",
    tags: [],
    employmentType: "アルバイト",
    minDays: "週2日〜",
    experience: "未経験OK",
    postedAt: today,
    category: "service",
  };
  return (
    <JobEditModal
      job={seed}
      onClose={onClose}
      onSave={(patch) => onCreate({ ...seed, ...patch })}
    />
  );
}

// =================================================================
// Tab: Applications
// =================================================================
function ApplicationsTab() {
  const [apps, setApps] = useState<Application[]>([]);
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");
  const [bump, setBump] = useState(0);

  useEffect(() => {
    getApplications().then(setApps);
  }, [bump]);

  const visible = useMemo(() => {
    if (filter === "all") return apps;
    return apps.filter((a) => a.status === filter);
  }, [apps, filter]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <FilterPill
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label={`すべて (${apps.length})`}
        />
        {(
          ["submitted", "reviewing", "interview", "offered", "rejected", "withdrawn"] as const
        ).map((s) => (
          <FilterPill
            key={s}
            active={filter === s}
            onClick={() => setFilter(s)}
            label={`${STATUS_LABEL[s]} (${apps.filter((a) => a.status === s).length})`}
          />
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <Th>応募ID</Th>
                <Th>求人</Th>
                <Th>応募日</Th>
                <Th>状態</Th>
                <Th>操作</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((app) => (
                <tr key={app.id} className="border-t border-gray-50 hover:bg-gray-50/40">
                  <Td className="font-mono text-[10px] text-gray-400">{app.id.slice(0, 12)}…</Td>
                  <Td>
                    <div className="font-bold text-gray-900 line-clamp-1 max-w-[260px]">{app.jobTitle}</div>
                    <div className="text-gray-500 text-[11px] line-clamp-1 max-w-[260px]">{app.jobCompany}</div>
                  </Td>
                  <Td className="text-gray-600 whitespace-nowrap">
                    {new Date(app.appliedAt).toLocaleDateString("ja-JP")}
                  </Td>
                  <Td>
                    <select
                      value={app.status}
                      onChange={async (e) => {
                        await adminSetApplicationStatus(
                          app.id,
                          e.target.value as ApplicationStatus
                        );
                        setBump((b) => b + 1);
                      }}
                      className={`px-2 py-1 rounded-lg border text-[11px] font-bold ${STATUS_TONE[app.status]}`}
                    >
                      {(
                        [
                          "submitted",
                          "reviewing",
                          "interview",
                          "offered",
                          "rejected",
                          "withdrawn",
                        ] as const
                      ).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </Td>
                  <Td>
                    <button
                      onClick={async () => {
                        if (!confirm("この応募を削除しますか？")) return;
                        await adminDeleteApplication(app.id);
                        setBump((b) => b + 1);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 text-[11px] font-bold hover:bg-rose-100"
                    >
                      削除
                    </button>
                  </Td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-10 text-[12px]">
                    対象の応募がありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// Tab: B2B Leads
// =================================================================
function LeadsTab() {
  const [bump, setBump] = useState(0);
  const leads = useMemo<BusinessLead[]>(
    () => (typeof window === "undefined" ? [] : getLocalLeads()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bump]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] text-gray-500">
          /business のお問い合わせフォームから受け付けたリード
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const csv = leadsToCsv(leads);
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `swiply-leads-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            disabled={leads.length === 0}
            className="px-3 h-9 rounded-xl bg-gray-100 text-gray-700 text-[12px] font-bold disabled:opacity-50"
          >
            CSV書き出し
          </button>
          <button
            onClick={() => {
              if (!confirm("リード履歴をすべて削除しますか？")) return;
              localStorage.removeItem("swiply-business-leads");
              setBump((b) => b + 1);
            }}
            disabled={leads.length === 0}
            className="px-3 h-9 rounded-xl bg-rose-50 text-rose-600 text-[12px] font-bold disabled:opacity-50"
          >
            全削除
          </button>
        </div>
      </div>

      {leads.length === 0 ? (
        <EmptyPanel text="まだリードがありません。/business のフォームから問い合わせがあるとここに表示されます。" />
      ) : (
        <div className="space-y-3">
          {leads.map((l) => (
            <div key={l.id} className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900">{l.company}</h3>
                  <p className="text-[12px] text-gray-500">
                    {l.contactName} ／ <a href={`mailto:${l.email}`} className="text-blue-600 hover:underline">{l.email}</a>
                    {l.phone && <> ／ {l.phone}</>}
                  </p>
                </div>
                <p className="text-[10px] text-gray-400 whitespace-nowrap">
                  {new Date(l.submittedAt).toLocaleString("ja-JP")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mt-2 text-[11px] text-gray-500">
                {l.industry && <Tag color="cyan">業種: {l.industry}</Tag>}
                {l.size && <Tag color="violet">規模: {l.size}</Tag>}
                {l.plan && <Tag color="amber">希望: {l.plan}</Tag>}
              </div>
              {l.message && (
                <p className="text-[12px] text-gray-700 leading-relaxed mt-3 bg-gray-50 rounded-xl p-3 whitespace-pre-wrap">
                  {l.message}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function leadsToCsv(leads: BusinessLead[]): string {
  const header = ["submittedAt", "company", "contactName", "email", "phone", "industry", "size", "plan", "message"];
  const rows = leads.map((l) =>
    header
      .map((k) => {
        const v = (l as unknown as Record<string, string>)[k] ?? "";
        return `"${String(v).replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  return [header.join(","), ...rows].join("\n");
}

// =================================================================
// Tab: Users
// =================================================================
function UsersTab() {
  // Read once at mount via lazy initializer.
  const [accounts] = useState<ReturnType<typeof getLocalAccounts>>(() =>
    typeof window === "undefined" ? [] : getLocalAccounts()
  );

  return (
    <div>
      <p className="text-[12px] text-gray-500 mb-4">
        ローカルに登録されたアカウント。Firebase Auth を有効にしている場合はここには表示されません。
      </p>
      {accounts.length === 0 ? (
        <EmptyPanel text="登録ユーザーがいません" />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-[12px]">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <Th>UID</Th>
                <Th>ニックネーム</Th>
                <Th>メール</Th>
                <Th>登録日</Th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.uid} className="border-t border-gray-50">
                  <Td className="font-mono text-[10px] text-gray-400">{a.uid.slice(0, 16)}…</Td>
                  <Td className="font-bold text-gray-900">{a.displayName}</Td>
                  <Td className="text-gray-600">{a.email}</Td>
                  <Td className="text-gray-500 text-[11px]">
                    {new Date(a.createdAt).toLocaleDateString("ja-JP")}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =================================================================
// Tab: KYC
// =================================================================
function KycTab() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  useEffect(() => {
    getProfile().then(setProfile);
  }, []);

  async function setStatus(status: UserProfile["kyc"]["status"]) {
    if (!profile) return;
    const next: UserProfile = {
      ...profile,
      kyc: {
        ...profile.kyc,
        status,
        verifiedAt: status === "verified" ? new Date().toISOString() : profile.kyc.verifiedAt,
      },
    };
    await saveProfile(next);
    setProfile(next);
  }

  if (!profile) return <EmptyPanel text="読み込み中…" />;

  return (
    <div className="max-w-2xl">
      <p className="text-[12px] text-gray-500 mb-4">
        現在のブラウザに紐づくユーザーの本人確認情報。バックエンド連携時はユーザーごとのテーブルになります。
      </p>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-extrabold text-gray-900">現在のステータス</h3>
          <StatusBadge status={profile.kyc.status} />
        </div>

        <dl className="grid grid-cols-2 gap-3 text-[12px] mb-5">
          <div>
            <dt className="text-gray-400 text-[10px] font-bold mb-1">提出日時</dt>
            <dd className="text-gray-700">
              {profile.kyc.submittedAt
                ? new Date(profile.kyc.submittedAt).toLocaleString("ja-JP")
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400 text-[10px] font-bold mb-1">承認日時</dt>
            <dd className="text-gray-700">
              {profile.kyc.verifiedAt
                ? new Date(profile.kyc.verifiedAt).toLocaleString("ja-JP")
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400 text-[10px] font-bold mb-1">照合スコア</dt>
            <dd className="text-gray-700">
              {profile.kyc.matchConfidence ? `${profile.kyc.matchConfidence}%` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-gray-400 text-[10px] font-bold mb-1">書類末尾</dt>
            <dd className="text-gray-700 font-mono">
              {profile.kyc.documentLast4 ? `****${profile.kyc.documentLast4}` : "—"}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
          <button
            onClick={() => setStatus("verified")}
            className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-[12px] font-bold hover:bg-emerald-100"
          >
            ✓ 承認する
          </button>
          <button
            onClick={() => setStatus("pending")}
            className="px-3 py-2 rounded-xl bg-amber-50 text-amber-600 text-[12px] font-bold hover:bg-amber-100"
          >
            審査中に戻す
          </button>
          <button
            onClick={() => setStatus("rejected")}
            className="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 text-[12px] font-bold hover:bg-rose-100"
          >
            ✗ 却下する
          </button>
          <button
            onClick={() => setStatus("unverified")}
            className="px-3 py-2 rounded-xl bg-gray-50 text-gray-600 text-[12px] font-bold hover:bg-gray-100"
          >
            未確認に戻す
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: UserProfile["kyc"]["status"] }) {
  const map: Record<typeof status, { label: string; cls: string }> = {
    unverified: { label: "未確認", cls: "bg-gray-100 text-gray-500 border-gray-200" },
    pending: { label: "審査中", cls: "bg-amber-50 text-amber-600 border-amber-200" },
    verified: { label: "確認済み", cls: "bg-emerald-50 text-emerald-600 border-emerald-200" },
    rejected: { label: "却下", cls: "bg-rose-50 text-rose-600 border-rose-200" },
  };
  const m = map[status];
  return (
    <span className={`inline-block px-2 py-0.5 rounded border text-[11px] font-bold ${m.cls}`}>
      {m.label}
    </span>
  );
}

// =================================================================
// Tab: Settings
// =================================================================
function SettingsTab({ onAfterReset }: { onAfterReset: () => void }) {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function changePw(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setMsg("");
    if (newPw !== confirmPw) {
      setErr("新しいパスワードが一致しません");
      return;
    }
    try {
      await changeAdminPassword(currentPw, newPw);
      setMsg("パスワードを変更しました");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "失敗しました");
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6">
        <h3 className="text-sm font-extrabold text-gray-900 mb-3">管理者パスワード変更</h3>
        <form onSubmit={changePw} className="space-y-3">
          <input
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            placeholder="現在のパスワード"
            required
            className={inputClass}
          />
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="新しいパスワード（6文字以上）"
            minLength={6}
            required
            className={inputClass}
          />
          <input
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            placeholder="新しいパスワード（確認）"
            minLength={6}
            required
            className={inputClass}
          />
          {err && <p className="text-[12px] text-rose-600">{err}</p>}
          {msg && <p className="text-[12px] text-emerald-600">{msg}</p>}
          <button
            type="submit"
            className="px-4 h-10 rounded-xl bg-gray-900 text-white text-[12px] font-bold"
          >
            変更する
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6">
        <h3 className="text-sm font-extrabold text-gray-900 mb-3">データ管理</h3>
        <div className="space-y-2">
          <DangerButton
            label="求人の編集をすべてリセット"
            sub="管理画面で行った求人編集・追加・削除を取り消し、初期データに戻します。"
            onClick={() => {
              if (!confirm("求人の編集をすべてリセットしますか？")) return;
              resetJobs();
              alert("リセットしました");
            }}
          />
          <DangerButton
            label="ローカルのデモデータをすべて削除"
            sub="応募・LIKE・お知らせ・プロフィール・リードなど、このブラウザの全デモデータを削除します。"
            onClick={() => {
              if (!confirm("本当にすべて削除しますか？この操作は取り消せません。")) return;
              [
                "swiply-applications",
                "swiply-likes",
                "swiply-recently-viewed",
                "swiply-business-leads",
                "swiply-job-overrides",
                "swiply-jobs-new",
                "swiply-jobs-deleted",
                "swiply-profile",
                "swiply-accounts",
                "swiply-session",
              ].forEach((k) => localStorage.removeItem(k));
              alert("削除しました");
            }}
          />
          <DangerButton
            label="管理者認証情報をリセット"
            sub="管理者パスワードを削除し、ログイン画面に戻ります。"
            onClick={() => {
              if (!confirm("管理者認証情報をリセットしますか？")) return;
              resetAdminCredential();
              onAfterReset();
            }}
          />
        </div>
      </div>

      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 text-[11px] text-gray-500 leading-relaxed">
        <p className="font-extrabold text-gray-700 mb-1">本番運用への移行ガイド</p>
        <ul className="space-y-1.5 list-disc list-inside">
          <li>認証は Firebase Auth + Custom Claims（admin: true）に移行</li>
          <li>求人・応募・リード等のデータは Firestore へ保存</li>
          <li>管理者操作はサーバー側で再認可（クライアントだけに依存しない）</li>
          <li>本人確認は eKYC 提供事業者（TRUSTDOCK 等）を経由</li>
        </ul>
      </div>
    </div>
  );
}

function DangerButton({
  label,
  sub,
  onClick,
}: {
  label: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 rounded-xl border border-rose-100 hover:bg-rose-50 transition"
    >
      <p className="text-[13px] font-bold text-rose-600">{label}</p>
      <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>
    </button>
  );
}

// =================================================================
// Shared UI primitives
// =================================================================
const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition";

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[10px] font-bold text-gray-500 mb-1.5 tracking-wider uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-[12px] font-bold transition ${
        on
          ? "bg-blue-50 border-blue-200 text-blue-700"
          : "bg-white border-gray-200 text-gray-500"
      }`}
    >
      <span>{label}</span>
      <span
        className={`w-8 h-5 rounded-full p-0.5 transition ${
          on ? "bg-blue-500" : "bg-gray-300"
        }`}
      >
        <span
          className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${
            on ? "translate-x-3" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

function FilterPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 h-9 rounded-xl text-[12px] font-bold transition ${
        active
          ? "bg-gray-900 text-white"
          : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
      }`}
    >
      {label}
    </button>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="text-left px-4 py-2.5 font-bold text-[10px] tracking-wider uppercase">
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-2.5 align-top ${className}`}>{children}</td>;
}

function TypeBadge({ type }: { type: JobType }) {
  const map = {
    baito: { label: "バイト", cls: "bg-violet-50 text-violet-600 border-violet-200" },
    gig: { label: "単発", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    career: { label: "正社員", cls: "bg-blue-50 text-blue-600 border-blue-200" },
  };
  const m = map[type];
  return (
    <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold ${m.cls}`}>
      {m.label}
    </span>
  );
}

function Tag({
  color,
  children,
}: {
  color: "amber" | "rose" | "violet" | "cyan";
  children: React.ReactNode;
}) {
  const map = {
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-600 border-rose-200",
    violet: "bg-violet-50 text-violet-600 border-violet-200",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-200",
  };
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-bold ${map[color]}`}>
      {children}
    </span>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center text-gray-400 text-[12px]">
      {text}
    </div>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-3xl max-h-[90dvh] overflow-y-auto bg-white rounded-3xl shadow-2xl">
        <div className="sticky top-0 bg-white px-5 md:px-6 py-3 border-b border-gray-100 flex items-center justify-between z-10">
          <h2 className="text-sm font-extrabold text-gray-900 truncate pr-4">{title}</h2>
          <button
            onClick={onClose}
            aria-label="閉じる"
            className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-500 flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-5 md:px-6 py-5">{children}</div>
      </div>
    </div>
  );
}


// =================================================================
// Sidebar icons
// =================================================================
function IconDashboard() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3m10-11v11a1 1 0 01-1 1h-3m-7 0h7m-7 0v-7a1 1 0 011-1h5a1 1 0 011 1v7" />
    </svg>
  );
}
function IconBriefcase() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0h2a2 2 0 012 2v6.764A23.859 23.859 0 0112 17.5a23.86 23.86 0 01-10-2.736V8a2 2 0 012-2h2" />
    </svg>
  );
}
function IconClipboard() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}
function IconBuilding() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
function IconCog() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
