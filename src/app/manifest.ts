import type { MetadataRoute } from "next";
import {
  BASE_PATH,
  SITE_NAME,
  SITE_TITLE,
  SITE_DESCRIPTION,
} from "@/lib/site";

// Emit a static manifest.webmanifest at build time (required under output: "export").
export const dynamic = "force-static";

/**
 * PWA manifest — makes SWIPLY installable ("ホーム画面に追加") with a
 * branded standalone launch experience. Member URLs resolve relative to the
 * manifest's own location, but GitHub Pages serves it under `/swiply`, so we
 * prefix every path with BASE_PATH to be unambiguous.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_TITLE,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    lang: "ja",
    dir: "ltr",
    id: `${BASE_PATH}/`,
    start_url: `${BASE_PATH}/`,
    scope: `${BASE_PATH}/`,
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a0f",
    theme_color: "#0a0a0f",
    categories: ["business", "productivity", "lifestyle"],
    icons: [
      {
        src: `${BASE_PATH}/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${BASE_PATH}/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${BASE_PATH}/icon-maskable-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
