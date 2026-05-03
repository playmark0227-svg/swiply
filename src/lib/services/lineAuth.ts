/**
 * LINE Login (OAuth 2.0 + OpenID Connect, PKCE flow).
 *
 * PKCE means we don't need a Channel Secret on the client — perfect for
 * a static SPA hosted on GitHub Pages. Configure once via:
 *
 *   NEXT_PUBLIC_LINE_CHANNEL_ID=<channel id from LINE Developers Console>
 *
 * Then in your LINE Login channel settings, register the callback URL:
 *
 *   https://playmark0227-svg.github.io/swiply/login/line/callback/
 *
 * (or your local equivalent during development).
 *
 * Optional: enable the "Email address permission" in the channel to
 * receive the user's email in the ID token.
 */

/**
 * SWIPLY's LINE Login channel ID. The Channel ID is public info — it
 * appears in the OAuth authorize URL anyway — so it's safe to ship in
 * the source. Override locally by setting NEXT_PUBLIC_LINE_CHANNEL_ID
 * in `.env.local` if testing against a different channel.
 *
 * Channel: "SWIPLY" (developers.line.biz/console)
 */
// 2005114375 was the SWIPLY provider ID — the channel ID is 2009964059.
const DEFAULT_CHANNEL_ID = "2009964059";
const CHANNEL_ID = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID || DEFAULT_CHANNEL_ID;
const CALLBACK_PATH = "/login/line/callback";
const BASE_PATH = process.env.NODE_ENV === "production" ? "/swiply" : "";

export const isLineConfigured = !!CHANNEL_ID;

const PKCE_KEY = "swiply-line-pkce-verifier";
const STATE_KEY = "swiply-line-state";
const NEXT_KEY = "swiply-line-next";

export interface LineProfile {
  uid: string;
  displayName: string;
  email: string;
  pictureUrl?: string;
  next: string;
}

// ---------- Helpers ----------

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomBase64Url(byteLength: number): string {
  const arr = new Uint8Array(byteLength);
  crypto.getRandomValues(arr);
  return base64UrlEncode(arr);
}

async function sha256Base64Url(input: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input)
  );
  return base64UrlEncode(new Uint8Array(buf));
}

function getRedirectUri(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${BASE_PATH}${CALLBACK_PATH}/`;
}

interface IdTokenPayload {
  iss: string;
  sub: string;
  name?: string;
  picture?: string;
  email?: string;
  amr?: string[];
}

function decodeJwtPayload(jwt: string): IdTokenPayload | null {
  try {
    const parts = jwt.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const decoded = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(decoded) as IdTokenPayload;
  } catch {
    return null;
  }
}

// ---------- Public API ----------

/**
 * Kick off the OAuth flow. Generates a PKCE verifier + state, stores
 * them in sessionStorage, then redirects the browser to LINE's
 * authorization endpoint.
 */
export async function startLineLogin(nextPath: string = "/"): Promise<void> {
  if (!isLineConfigured) {
    throw new Error("LINEログインが設定されていません（NEXT_PUBLIC_LINE_CHANNEL_ID を設定してください）");
  }
  const verifier = randomBase64Url(48);
  const state = randomBase64Url(16);
  sessionStorage.setItem(PKCE_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);
  sessionStorage.setItem(NEXT_KEY, nextPath || "/");

  const challenge = await sha256Base64Url(verifier);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CHANNEL_ID,
    redirect_uri: getRedirectUri(),
    state,
    scope: "profile openid email",
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  window.location.href = `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
}

/**
 * Called from the callback page. Exchanges the auth code for tokens,
 * pulls the LINE profile, and returns a normalised user payload.
 */
export async function handleLineCallback(): Promise<LineProfile> {
  if (!isLineConfigured) {
    throw new Error("LINEログインが設定されていません");
  }
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  const errorParam = params.get("error");

  if (errorParam) {
    const desc = params.get("error_description") || errorParam;
    throw new Error(`LINEログインがキャンセル/失敗されました: ${desc}`);
  }
  if (!code || !state) {
    throw new Error("認証情報が取得できませんでした");
  }

  const expectedState = sessionStorage.getItem(STATE_KEY);
  const verifier = sessionStorage.getItem(PKCE_KEY);
  const next = sessionStorage.getItem(NEXT_KEY) || "/";

  if (state !== expectedState) {
    throw new Error("セキュリティ検証エラー（state不一致）");
  }
  if (!verifier) {
    throw new Error("認証セッションが切れています。もう一度お試しください");
  }

  const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(),
      client_id: CHANNEL_ID,
      code_verifier: verifier,
    }).toString(),
  });

  if (!tokenRes.ok) {
    const detail = await tokenRes.text().catch(() => "");
    throw new Error(`トークン交換に失敗しました: ${detail.slice(0, 200)}`);
  }
  const tokens = (await tokenRes.json()) as {
    access_token: string;
    id_token?: string;
    refresh_token?: string;
  };

  // Pull user profile (LINE Profile API)
  const profileRes = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) {
    throw new Error("プロフィール取得に失敗しました");
  }
  const profile = (await profileRes.json()) as {
    userId: string;
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
  };

  // Email comes from the ID token (only if "email" scope was approved
  // and the channel has the email-permission feature enabled).
  let email = "";
  if (tokens.id_token) {
    const payload = decodeJwtPayload(tokens.id_token);
    if (payload?.email) email = payload.email;
  }
  if (!email) {
    // Fall back to a synthetic @line.local id so downstream code that
    // expects an email field still works.
    email = `${profile.userId}@line.local`;
  }

  // Cleanup
  sessionStorage.removeItem(PKCE_KEY);
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(NEXT_KEY);

  return {
    uid: `line-${profile.userId}`,
    displayName: profile.displayName,
    email,
    pictureUrl: profile.pictureUrl,
    next,
  };
}
