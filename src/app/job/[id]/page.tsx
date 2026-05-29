import type { Metadata } from "next";
import { getAllJobIds, getJobById } from "@/lib/services/jobs";
import { BASE_PATH, SITE_NAME } from "@/lib/site";
import ClientJobDetailPage from "./ClientJobDetailPage";

export function generateStaticParams() {
  return getAllJobIds().map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) {
    return { title: "求人が見つかりません" };
  }

  const title = `${job.title} — ${job.company}`;
  const description =
    job.catchphrase ||
    `${job.location}・${job.salary}の求人。SWIPLYでスワイプして応募できます。`;
  // Job photos are absolute (Unsplash) URLs; fall back to the site card.
  const image = /^https?:\/\//.test(job.image)
    ? job.image
    : `${BASE_PATH}/og.jpg`;
  const social = `${title} | ${SITE_NAME}`;

  return {
    title,
    description,
    openGraph: {
      title: social,
      description,
      type: "website",
      locale: "ja_JP",
      siteName: SITE_NAME,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: social,
      description,
      images: [image],
    },
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClientJobDetailPage jobId={id} />;
}
