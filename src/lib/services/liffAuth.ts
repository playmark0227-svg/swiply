/**
 * LIFF (LINE Front-end Framework) wrapper.
 *
 * Used by the rich-menu auto-login flow:
 *
 *   LINE rich menu tap
 *     → https://liff.line.me/{LIFF_ID}
 *     → opens our `/liff/` page inside the LINE in-app browser
 *     → liff.init() + liff.getProfile() runs immediately, no extra tap
 *     → setSession() into AuthProvider → redirect to `next` URL
 *
 * If the same URL is opened *outside* the LINE app (e.g. shared as a
 * regular link), liff.login() will redirect through the standard LINE
 * Login OAuth flow — same channel, just with a redirect — so the page
 * still works as a universal sign-in entry point.
 *
 * Required env var:
 *   NEXT_PUBLIC_LIFF_ID = the LIFF ID from LINE Developers Console
 *                        (e.g. "2005114375-XaBcDeFg")
 *
 * The LIFF app must be registered under the existing SWIPLY LINE Login
 * channel (Channel ID 2005114375) with:
 *   - Endpoint URL = https://playmark0227-svg.github.io/swiply/liff/
 *     (or your local dev URL during testing)
 *   - Scope        = profile, openid  (email is optional)
 *   - Size         = Full
 */

import type { LineProfile } from "./lineAuth";

// SWIPLY's LIFF ID. Like the LINE channel ID, this is public — it
// appears in the rich-menu URL (https://liff.line.me/{id}) anyway —
// so it's safe to ship as a default. Override locally with
// NEXT_PUBLIC_LIFF_ID in `.env.local` if testing against a different
// LIFF app.
const DEFAULT_LIFF_ID = "2009964059-jcGdt1Nm";
const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || DEFAULT_LIFF_ID;

export const isLiffConfigured = !!LIFF_ID;

interface DecodedIdToken {
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
}

/**
 * Initialise the LIFF SDK and return the current LINE user as a
 * `LineProfile` (the same shape the OAuth callback returns, so the
 * AuthProvider can adopt it without any changes).
 *
 * - Inside the LINE in-app browser: resolves immediately with the
 *   user's profile. No taps, no redirects.
 * - In a regular browser: triggers `liff.login()` which redirects to
 *   the LINE OAuth screen and never resolves on this call. The user
 *   comes back to the same URL and `init` succeeds the second time.
 */
export async function initAndAuthenticate(
  nextPath: string = "/"
): Promise<LineProfile> {
  if (!LIFF_ID) {
    throw new Error(
      "LIFFが設定されていません（NEXT_PUBLIC_LIFF_ID を環境変数に追加してください）"
    );
  }

  // Dynamic import keeps @line/liff out of the SSR bundle. The SDK
  // touches `window` at module load time, so it must be client-only.
  const liffModule = await import("@line/liff");
  const liff = liffModule.default;

  await liff.init({ liffId: LIFF_ID });

  if (!liff.isLoggedIn()) {
    // Not in LINE in-app browser AND no existing LINE session in this
    // browser — redirect through the standard LINE Login flow, then
    // come back to the same URL (preserving ?next).
    const here =
      typeof window !== "undefined"
        ? window.location.href
        : undefined;
    liff.login(here ? { redirectUri: here } : undefined);
    // login() navigates the page away; this promise never resolves.
    return new Promise<LineProfile>(() => {});
  }

  const profile = await liff.getProfile();

  // Email comes from the OIDC ID token. Only present if the channel has
  // the email-permission feature enabled and the user granted it. Falls
  // back to a synthetic @line.local id so downstream code (which expects
  // a non-empty email) keeps working.
  let email = "";
  try {
    const idToken = liff.getDecodedIDToken() as DecodedIdToken | null;
    if (idToken?.email) email = idToken.email;
  } catch {
    // older LIFF versions throw if no ID token is available — ignore
  }
  if (!email) email = `${profile.userId}@line.local`;

  return {
    uid: `line-${profile.userId}`,
    displayName: profile.displayName,
    email,
    pictureUrl: profile.pictureUrl,
    next: nextPath,
  };
}

/**
 * True iff the current page is being rendered inside the LINE in-app
 * browser. Useful for components that want to hide the "Login with
 * LINE" button when LIFF will auto-login the user anyway.
 *
 * Returns false during SSR or before LIFF SDK is ready.
 */
export async function isInLineClient(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (!LIFF_ID) return false;
  try {
    const liff = (await import("@line/liff")).default;
    if (!liff.id) await liff.init({ liffId: LIFF_ID });
    return liff.isInClient();
  } catch {
    return false;
  }
}
