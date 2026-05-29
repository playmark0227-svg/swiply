/**
 * Site-wide constants shared by the root metadata, the PWA manifest,
 * robots.txt and the sitemap.
 *
 * SWIPLY is deployed as a GitHub Pages *project* site, so it lives under a
 * `/swiply` path prefix in production and at the domain root in dev. Keeping
 * the origin / base path / fully-qualified URL in one place avoids the
 * subtle drift that creeps in when each metadata file hand-rolls them.
 */
const isProd = process.env.NODE_ENV === "production";

/** Origin only (no path) — the GitHub Pages user domain. */
export const SITE_ORIGIN = "https://playmark0227-svg.github.io";

/** Path prefix the app is served under (project-site sub-path in prod). */
export const BASE_PATH = isProd ? "/swiply" : "";

/** Fully-qualified site root, e.g. https://playmark0227-svg.github.io/swiply */
export const SITE_URL = `${SITE_ORIGIN}${BASE_PATH}`;

export const SITE_NAME = "SWIPLY";
export const SITE_TITLE = "SWIPLY — 履歴書の前に、スワイプでいい。";
export const SITE_DESCRIPTION =
  "履歴書の前に、スワイプでいい。求人の発見からマッチ後のチャット、ビデオ面接 + AI 振り返りまで、就職活動のひと通りをアプリ１つで。";
