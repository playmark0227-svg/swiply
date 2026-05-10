/**
 * Company brand-page derivation.
 *
 * Each Job in the static seed predates the BrandPage feature. Rather
 * than forcing the operator to fill in 9 fields per company, we derive
 * a sensible default BrandPage from the existing Job fields (company,
 * description, image, qa…). The admin can override on a per-company
 * basis later — that's an explicit override we'll respect.
 *
 * In production, BrandPages should be 1:1 with a Company document in
 * Firestore. The candidate-side route reads from this service.
 */

import type { BrandPage, Job } from "@/types/job";
import { getAllJobs } from "@/lib/services/jobs";

/**
 * Returns the BrandPage for a company name, deriving demo content
 * from any matching Job in the static catalog.
 */
export async function getBrandPageByCompany(
  company: string
): Promise<{ company: string; page: BrandPage; representativeJob: Job } | null> {
  const all = await getAllJobs();
  // Pick the first (newest) job for this company as the representative
  // — its image, catchphrase, etc. drive the brand-page hero.
  const matches = all.filter((j) => j.company === company);
  if (matches.length === 0) return null;
  const rep = matches.sort((a, b) =>
    a.postedAt < b.postedAt ? 1 : -1
  )[0];
  return {
    company,
    representativeJob: rep,
    page: rep.brand ?? buildDemoBrandPage(rep, matches),
  };
}

export async function getBrandPageByJobId(
  jobId: string
): Promise<{ company: string; page: BrandPage; representativeJob: Job } | null> {
  const all = await getAllJobs();
  const job = all.find((j) => j.id === jobId);
  if (!job) return null;
  return getBrandPageByCompany(job.company);
}

function buildDemoBrandPage(rep: Job, allRoles: Job[]): BrandPage {
  return {
    tagline: rep.catchphrase || `${rep.company} の、ふだん。`,
    ceoName: `${rep.company} 代表`,
    ceoMessage: [
      `はじめまして。${rep.company} の代表です。`,
      "",
      `${rep.companyDescription ?? "私たちは、関わる人すべてが「ここで働けて良かった」と思える会社を目指しています。"}`,
      "",
      `${rep.title}を含め、複数のポジションで仲間を募集しています。`,
      "履歴書ではわからない人柄を、ぜひ動画とSWIPLY内のやりとりで知ってください。",
    ].join("\n"),
    ceoPhoto: rep.image,
    videos: rep.video
      ? [
          { title: `${rep.company} の現場`, url: rep.video },
        ]
      : [],
    staffVoices: buildDemoVoices(rep, allRoles),
    benefitsHighlights: rep.benefits.slice(0, 5),
    press: [
      {
        outlet: "財界札幌",
        title: `${rep.company}、新卒採用に力を入れる ―― 動画で職場を伝える挑戦`,
        publishedAt: rep.postedAt,
      },
    ],
  };
}

function buildDemoVoices(
  rep: Job,
  allRoles: Job[]
): BrandPage["staffVoices"] {
  // Generate 2–3 demo voices keyed off the role mix so different
  // companies feel a bit different.
  const baseQuotes = [
    {
      name: "佐藤 ゆり",
      role: rep.title,
      joinedYear: "2024年",
      quote:
        "面接の段階で「この会社、雰囲気いいな」と感じたまま入社できました。動画で見ていた光景と現場のギャップが少なかったのが嬉しいです。",
    },
    {
      name: "田中 健",
      role: allRoles[1]?.title ?? rep.title,
      joinedYear: "2022年",
      quote:
        "未経験から始めましたが、教育がしっかりしていてすぐに戦力扱いしてもらえました。1人で抱え込まずに済む文化です。",
    },
    {
      name: "山本 さくら",
      role: allRoles[2]?.title ?? rep.title,
      joinedYear: "2020年",
      quote:
        "子育てしながら働けるよう、シフトの相談にも親身に乗ってくれます。育休からの復帰もスムーズでした。",
    },
  ];
  return baseQuotes;
}
