import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Emit a static sitemap.xml at build time (required under output: "export").
export const dynamic = "force-static";

/**
 * Sitemap of the public, indexable surfaces. Private app routes (dashboard,
 * admin, messages, profile, etc.) and demo job-detail pages are intentionally
 * omitted. `lastModified` is a fixed build constant so the sitemap doesn't
 * churn on every deploy.
 */
const LAST_MODIFIED = "2026-05-29";

type Entry = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

const ROUTES: Entry[] = [
  { path: "/", changeFrequency: "daily", priority: 1.0 },
  { path: "/swipe", changeFrequency: "daily", priority: 0.9 },
  { path: "/search", changeFrequency: "daily", priority: 0.8 },
  { path: "/baito", changeFrequency: "daily", priority: 0.8 },
  { path: "/gig", changeFrequency: "daily", priority: 0.8 },
  { path: "/career", changeFrequency: "daily", priority: 0.8 },
  { path: "/business", changeFrequency: "weekly", priority: 0.7 },
  { path: "/verify", changeFrequency: "monthly", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map(({ path, changeFrequency, priority }) => ({
    // trailingSlash: true → canonical URLs end in "/"
    url: `${SITE_URL}${path === "/" ? "/" : `${path}/`}`,
    lastModified: LAST_MODIFIED,
    changeFrequency,
    priority,
  }));
}
