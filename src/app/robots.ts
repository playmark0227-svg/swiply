import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Emit a static robots.txt at build time (required under output: "export").
export const dynamic = "force-static";

/**
 * robots.txt — allow everything except the private operator/recruiter
 * surfaces, and advertise the sitemap. (On a GitHub Pages project sub-path
 * crawlers read robots from the domain root, so this mainly matters once a
 * custom domain is attached — cheap to keep correct now.)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Personal/operator surfaces with no indexable content (all data is
      // client-side and user-specific). Public discovery pages stay allowed.
      disallow: [
        "/admin/",
        "/dashboard/",
        "/liff/",
        "/login/",
        "/signup/",
        "/profile/",
        "/messages/",
        "/likes/",
        "/applications/",
        "/notifications/",
        "/interview/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
