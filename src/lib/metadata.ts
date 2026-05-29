import type { Metadata } from "next";
import { BASE_PATH, SITE_NAME } from "@/lib/site";

/**
 * Build a complete per-page Metadata object (title + description + matching
 * Open Graph / Twitter cards) from a short title and description.
 *
 * The root layout supplies the `%s | SWIPLY` title template and the default
 * social image, but Open Graph/Twitter objects don't deep-merge with the
 * parent — so we restate them here (with the shared og.jpg) to guarantee each
 * page shares correctly.
 */
const DEFAULT_OG_IMAGE = {
  url: `${BASE_PATH}/og.jpg`,
  width: 1200,
  height: 630,
};

export function pageMetadata(title: string, description: string): Metadata {
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
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: social,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}
