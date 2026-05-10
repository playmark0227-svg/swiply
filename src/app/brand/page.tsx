"use client";

/**
 * Company brand page.
 *
 * URL: /brand/?company=<会社名>  or  /brand/?jobId=<job-id>
 *
 * The "親対策" (parent-friendly) explanatory page岡崎 talks about:
 * 社長メッセージ, 職場動画, 社員の声, 福利厚生, メディア掲載歴 ——
 * all in one printable view that candidates can hand to their parents.
 *
 * The "印刷" button uses `window.print()` and the `@media print`
 * styles in `globals.css` to hide nav and pretty-print the document.
 */

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { TrustBadgeRow } from "@/components/TrustBadges";
import { getBrandPageByCompany, getBrandPageByJobId } from "@/lib/services/brandPages";
import type { BrandPage, Job } from "@/types/job";

interface ResolvedBrand {
  company: string;
  page: BrandPage;
  representativeJob: Job;
}

export default function BrandPageRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center text-gray-400 text-sm">
          読み込み中…
        </div>
      }
    >
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const params = useSearchParams();
  const company = params.get("company");
  const jobId = params.get("jobId");
  const [data, setData] = useState<ResolvedBrand | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const promise = company
      ? getBrandPageByCompany(company)
      : jobId
        ? getBrandPageByJobId(jobId)
        : Promise.resolve(null);
    promise.then((d) => {
      if (!cancelled) setData(d);
    });
    return () => {
      cancelled = true;
    };
  }, [company, jobId]);

  if (data === undefined) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-gray-400 text-sm">
        読み込み中…
      </div>
    );
  }
  if (!data) {
    return (
      <div className="min-h-dvh bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-base font-extrabold text-gray-900 mb-2">
            ブランドページが見つかりません
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-[12px] font-bold"
          >
            トップに戻る
          </Link>
        </div>
      </div>
    );
  }

  return <BrandView data={data} />;
}

function BrandView({ data }: { data: ResolvedBrand }) {
  const { company, page, representativeJob: rep } = data;

  function handlePrint() {
    if (typeof window !== "undefined") window.print();
  }

  return (
    <div className="min-h-dvh bg-[#fbf8f3] brand-page">
      <div className="print:hidden">
        <Header />
      </div>

      <article className="max-w-3xl mx-auto px-5 md:px-8 pt-6 md:pt-12 pb-20 print:pt-0 print:pb-0 print:max-w-none print:px-0">
        {/* Header / hero */}
        <header className="mb-8 md:mb-10">
          <div className="flex items-center justify-between mb-3 print:hidden">
            <Link
              href="/"
              className="text-[11px] font-bold text-gray-500 hover:text-violet-600"
            >
              ← トップ
            </Link>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 text-white text-[11px] font-extrabold hover:bg-gray-800 active:scale-95 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              印刷 / PDF
            </button>
          </div>

          <p className="text-[11px] tracking-[0.3em] font-black text-violet-500 mb-2">
            COMPANY BRAND
          </p>
          <h1 className="text-[28px] md:text-[44px] font-black text-gray-900 leading-tight mb-3">
            {company}
          </h1>
          <p className="text-[15px] md:text-[18px] text-gray-700 leading-relaxed font-medium">
            {page.tagline}
          </p>
          <div className="mt-4 print:hidden">
            <TrustBadgeRow job={rep} size="md" interactive />
          </div>
        </header>

        {/* Hero image */}
        <div className="relative aspect-[16/9] rounded-3xl overflow-hidden mb-8 md:mb-12 shadow-md print:rounded-none print:shadow-none">
          <Image
            src={rep.image}
            alt={company}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>

        {/* CEO message */}
        <Section title="代表メッセージ" subtitle="MESSAGE FROM CEO">
          <div className="md:flex md:gap-6 md:items-start">
            {page.ceoPhoto && (
              <div className="hidden md:block w-32 h-32 rounded-2xl overflow-hidden shrink-0">
                <Image
                  src={page.ceoPhoto}
                  alt={page.ceoName}
                  width={128}
                  height={128}
                  className="object-cover w-full h-full"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[14px] md:text-[15px] text-gray-800 leading-[1.95] font-medium whitespace-pre-line">
                {page.ceoMessage}
              </p>
              <p className="mt-4 text-[12px] font-bold text-gray-500">
                — {page.ceoName}
              </p>
            </div>
          </div>
        </Section>

        {/* Videos */}
        {page.videos.length > 0 && (
          <Section title="職場の様子" subtitle="VIDEO">
            <div className="grid sm:grid-cols-2 gap-4">
              {page.videos.map((v, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                >
                  <video
                    src={v.url}
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full aspect-video bg-black"
                  />
                  <p className="text-[12px] font-bold text-gray-700 px-3 py-2">
                    {v.title}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Staff voices */}
        <Section title="社員の声" subtitle="STAFF VOICES">
          <ul className="space-y-4 md:space-y-5">
            {page.staffVoices.map((s, i) => (
              <li
                key={i}
                className="bg-white rounded-2xl border border-gray-100 px-5 py-4"
              >
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <p className="text-[13px] font-extrabold text-gray-900">
                    {s.name}
                    <span className="ml-2 text-[11px] font-medium text-gray-500">
                      {s.role}
                    </span>
                  </p>
                  {s.joinedYear && (
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {s.joinedYear}入社
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-gray-700 leading-relaxed">
                  「{s.quote}」
                </p>
              </li>
            ))}
          </ul>
        </Section>

        {/* Benefits */}
        {page.benefitsHighlights.length > 0 && (
          <Section title="待遇・福利厚生" subtitle="BENEFITS">
            <ul className="grid sm:grid-cols-2 gap-2">
              {page.benefitsHighlights.map((b, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-[13px] text-gray-700 bg-white rounded-xl border border-gray-100 px-3 py-2"
                >
                  <svg
                    className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Press */}
        {page.press && page.press.length > 0 && (
          <Section title="メディア掲載" subtitle="PRESS">
            <ul className="space-y-2">
              {page.press.map((p, i) => (
                <li
                  key={i}
                  className="text-[12px] text-gray-700 bg-white rounded-xl border border-gray-100 px-4 py-3"
                >
                  <p className="font-extrabold text-gray-900 mb-0.5">
                    {p.outlet}
                  </p>
                  <p className="text-gray-700">{p.title}</p>
                  {p.publishedAt && (
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(p.publishedAt).toLocaleDateString("ja-JP")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Roles available */}
        <Section title="募集中のポジション" subtitle="OPEN ROLES">
          <Link
            href={`/job/${rep.id}/`}
            className="block bg-white rounded-2xl border border-gray-100 p-4 hover:border-violet-200 transition print:hidden"
          >
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={rep.image}
                alt={rep.company}
                className="w-16 h-16 rounded-xl object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-extrabold text-gray-900 truncate">
                  {rep.title}
                </p>
                <p className="text-[12px] text-gray-500 truncate">
                  {rep.location} ・ {rep.salary}
                </p>
                <TrustBadgeRow job={rep} size="sm" className="mt-1.5" />
              </div>
              <span className="text-[12px] font-extrabold text-violet-600">
                求人を見る →
              </span>
            </div>
          </Link>
        </Section>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-200 text-center">
          <p className="text-[11px] text-gray-500">
            このページは <span className="font-extrabold">SWIPLY</span> が
            審査を行なった企業のブランドページです。
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            © {new Date().getFullYear()} {company} ・ Powered by SWIPLY
          </p>
        </footer>
      </article>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10 md:mb-12 print:break-inside-avoid">
      {subtitle && (
        <p className="text-[10px] tracking-[0.3em] font-black text-violet-500 mb-1">
          ─ {subtitle}
        </p>
      )}
      <h2 className="text-[18px] md:text-[24px] font-extrabold text-gray-900 mb-4">
        {title}
      </h2>
      {children}
    </section>
  );
}
