"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import {
  type Application,
  getApplications,
  STATUS_LABEL,
  STATUS_TONE,
  withdrawApplication,
} from "@/lib/services/applications";
import { useToast } from "@/components/Toast";
import { haptic } from "@/lib/haptic";

export default function ApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loaded, setLoaded] = useState(false);
  const toast = useToast();

  useEffect(() => {
    getApplications().then((a) => {
      setApps(a);
      setLoaded(true);
    });
  }, []);

  async function handleWithdraw(jobId: string) {
    haptic("warn");
    if (!confirm("応募を辞退しますか？")) return;
    await withdrawApplication(jobId);
    setApps(await getApplications());
    toast.show("応募を辞退しました", "info");
  }

  const active = apps.filter((a) => a.status !== "withdrawn" && a.status !== "rejected");
  const archived = apps.filter((a) => a.status === "withdrawn" || a.status === "rejected");

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50">
      <Header />
      <main className="flex-1 max-w-lg md:max-w-3xl mx-auto w-full px-4 md:px-8 pt-4 md:pt-10 pb-20 md:pb-16">
        <div className="mb-4 md:mb-6">
          <h1 className="text-lg md:text-2xl font-extrabold text-gray-900">応募管理</h1>
          {loaded && apps.length > 0 && (
            <p className="text-[11px] md:text-xs text-gray-400 mt-0.5">
              全{apps.length}件 ／ 進行中 {active.length}件
            </p>
          )}
        </div>

        {!loaded ? (
          <SkeletonList />
        ) : apps.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {active.length > 0 && (
              <Section title="進行中">
                <div className="space-y-2.5">
                  {active.map((app) => (
                    <AppCard key={app.id} app={app} onWithdraw={() => handleWithdraw(app.jobId)} />
                  ))}
                </div>
              </Section>
            )}
            {archived.length > 0 && (
              <Section title="完了・辞退" className="mt-6">
                <div className="space-y-2.5">
                  {archived.map((app) => (
                    <AppCard key={app.id} app={app} muted />
                  ))}
                </div>
              </Section>
            )}
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function Section({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={className}>
      <h2 className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-2 px-1">
        {title}
      </h2>
      {children}
    </section>
  );
}

function AppCard({
  app,
  onWithdraw,
  muted,
}: {
  app: Application;
  onWithdraw?: () => void;
  muted?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border ${
        muted ? "border-gray-100/70 opacity-70" : "border-gray-100"
      } overflow-hidden`}
    >
      <Link href={`/job/${app.jobId}`} className="flex gap-3 p-3.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={app.jobImage}
          alt={app.jobCompany}
          className="w-16 h-16 rounded-xl object-cover shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <p className="text-[10px] text-gray-400 truncate">{app.jobCompany}</p>
            <span className={`shrink-0 px-1.5 py-0.5 rounded border text-[10px] font-bold ${STATUS_TONE[app.status]}`}>
              {STATUS_LABEL[app.status]}
            </span>
          </div>
          <p className="text-[13px] font-extrabold text-gray-900 leading-snug line-clamp-1">
            {app.jobTitle}
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            応募日: {new Date(app.appliedAt).toLocaleDateString("ja-JP")}
          </p>
        </div>
      </Link>

      {/* Timeline */}
      <div className="border-t border-gray-50 px-3.5 py-2.5">
        <ol className="flex items-center gap-1 text-[10px]">
          {(["submitted", "reviewing", "interview", "offered"] as const).map((s, i) => {
            const reached = stepIndex(app.status) >= i;
            return (
              <li key={s} className="flex items-center gap-1 flex-1 last:flex-initial">
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px] ${
                    reached
                      ? "bg-violet-500 text-white"
                      : "bg-gray-100 text-gray-300"
                  }`}
                >
                  {i + 1}
                </span>
                <span className={reached ? "text-gray-700 font-bold" : "text-gray-300"}>
                  {STATUS_LABEL[s]}
                </span>
                {i < 3 && (
                  <span className={`flex-1 h-px ${reached ? "bg-violet-300" : "bg-gray-100"}`} />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {onWithdraw && (
        <div className="border-t border-gray-50 px-3.5 py-2 flex justify-end">
          <button
            onClick={onWithdraw}
            className="text-[11px] font-bold text-gray-400 hover:text-rose-500"
          >
            辞退する
          </button>
        </div>
      )}
    </div>
  );
}

function stepIndex(status: Application["status"]): number {
  switch (status) {
    case "submitted":
      return 0;
    case "reviewing":
      return 1;
    case "interview":
      return 2;
    case "offered":
      return 3;
    default:
      return -1;
  }
}

function EmptyState() {
  return (
    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
      <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      </div>
      <h2 className="text-sm font-bold text-gray-900 mb-1">まだ応募がありません</h2>
      <p className="text-xs text-gray-400 mb-6">気になる求人を見つけて応募してみよう</p>
      <Link
        href="/swipe"
        className="inline-block px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-violet-200/50 active:scale-95 transition-transform"
      >
        スワイプで探す
      </Link>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-3.5 animate-pulse">
          <div className="flex gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-2 w-1/3 bg-gray-100 rounded" />
              <div className="h-3 w-2/3 bg-gray-100 rounded" />
              <div className="h-2 w-1/4 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
