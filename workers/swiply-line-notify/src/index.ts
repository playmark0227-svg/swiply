/**
 * SWIPLY LINE Notify Worker
 *
 * Bridges SWIPLY (which only knows the user's Login-channel userId from
 * LIFF) to the SWIPLY OA Messaging API (which uses a different userId
 * per LINE spec). LINE's accountLink/linkToken flow can't be used here
 * because the bot doesn't know the messagingUserId until the user
 * messages the OA — so we use a "code-pairing" pattern instead:
 *
 *   1. SWIPLY frontend → POST /pair-init { loginUserId }
 *      → returns { code: "PAIR-XXXXXX", oaMessageUrl }
 *   2. Frontend opens oaMessageUrl → LINE app pre-fills the code in
 *      the SWIPLY OA chat
 *   3. User taps send → message webhook fires with messagingUserId
 *      + the code text
 *   4. Worker looks up KV pair:CODE → loginUserId, writes
 *      link:loginUserId → messagingUserId, replies "✓ 連携完了"
 *   5. Frontend polls /pair-status until linked === true
 *
 * After linking, /notify can push to the user via LINE Messaging API.
 *
 * Endpoints:
 *   POST /pair-init    — issue a one-time code (KV TTL 10 min)
 *   POST /pair-status  — check if a loginUserId has been linked
 *   POST /notify       — push a message to a linked user
 *   POST /webhook      — LINE Messaging API webhook (signature-verified)
 *
 * KV schema (binding LINK_MAP):
 *   pair:{CODE}            → loginUserId          (TTL 600s)
 *   link:{loginUserId}     → messagingUserId      (no TTL)
 */

export interface Env {
  // Secrets (set with `wrangler secret put`)
  LINE_MSG_ACCESS_TOKEN: string;
  LINE_MSG_CHANNEL_SECRET: string;
  // Vars (set in wrangler.toml [vars])
  LINE_LOGIN_CHANNEL_ID: string;
  LINE_MSG_CHANNEL_ID: string;
  LINE_OA_BASIC_ID: string;
  ALLOW_ORIGIN: string;
  // KV
  LINK_MAP: KVNamespace;
}

// ===== Pair code generation =====
// Drop confusing chars: 0/O, 1/I/L
const PAIR_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const PAIR_CODE_LENGTH = 6;
const PAIR_TTL_SECONDS = 600;

function generatePairCode(): string {
  const arr = new Uint8Array(PAIR_CODE_LENGTH);
  crypto.getRandomValues(arr);
  let out = "";
  for (let i = 0; i < PAIR_CODE_LENGTH; i++) {
    out += PAIR_CODE_ALPHABET[arr[i] % PAIR_CODE_ALPHABET.length];
  }
  return `PAIR-${out}`;
}

// Strict regex — must match the alphabet above so spurious "PAIR-XXXX"
// in casual messages don't trigger linking.
const PAIR_CODE_REGEX = /PAIR-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}/;

// ===== HTTP helpers =====
function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function jsonResponse(
  body: unknown,
  status: number,
  cors: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json; charset=utf-8" },
  });
}

// ===== Router =====
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const cors = corsHeaders(env.ALLOW_ORIGIN);

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    try {
      if (url.pathname === "/pair-init" && req.method === "POST") {
        return await handlePairInit(req, env, cors);
      }
      if (url.pathname === "/pair-status" && req.method === "POST") {
        return await handlePairStatus(req, env, cors);
      }
      if (url.pathname === "/notify" && req.method === "POST") {
        return await handleNotify(req, env, cors);
      }
      if (url.pathname === "/webhook" && req.method === "POST") {
        return await handleWebhook(req, env);
      }
      if (url.pathname === "/" && req.method === "GET") {
        return new Response("swiply-line-notify is running", {
          status: 200,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
      return new Response("Not found", { status: 404, headers: cors });
    } catch (e) {
      console.error("[worker] error:", e);
      return jsonResponse(
        { ok: false, error: e instanceof Error ? e.message : String(e) },
        500,
        cors
      );
    }
  },
};

// ===== /pair-init =====
interface PairInitPayload {
  loginUserId: string;
}

async function handlePairInit(
  req: Request,
  env: Env,
  cors: Record<string, string>
): Promise<Response> {
  let payload: PairInitPayload;
  try {
    payload = (await req.json()) as PairInitPayload;
  } catch {
    return jsonResponse({ ok: false, error: "invalid_json" }, 400, cors);
  }
  if (!payload.loginUserId) {
    return jsonResponse(
      { ok: false, error: "loginUserId required" },
      400,
      cors
    );
  }

  // Already linked? Short-circuit.
  const existing = await env.LINK_MAP.get(`link:${payload.loginUserId}`);
  if (existing) {
    return jsonResponse({ ok: true, alreadyLinked: true }, 200, cors);
  }

  // Generate a fresh, collision-free code (extremely unlikely to clash
  // but we retry a few times for safety)
  let code = generatePairCode();
  for (let i = 0; i < 5; i++) {
    const taken = await env.LINK_MAP.get(`pair:${code}`);
    if (!taken) break;
    code = generatePairCode();
  }

  await env.LINK_MAP.put(`pair:${code}`, payload.loginUserId, {
    expirationTtl: PAIR_TTL_SECONDS,
  });

  // LINE OA pre-fill URL: opens the SWIPLY OA chat with the code
  // pre-filled, ready for the user to tap send.
  // Format: https://line.me/R/oaMessage/{basicID}/?{message}
  const basicId = env.LINE_OA_BASIC_ID;
  const oaMessageUrl =
    `https://line.me/R/oaMessage/${encodeURIComponent(basicId)}/?` +
    encodeURIComponent(code);

  return jsonResponse(
    {
      ok: true,
      alreadyLinked: false,
      code,
      expiresAt: new Date(Date.now() + PAIR_TTL_SECONDS * 1000).toISOString(),
      oaMessageUrl,
    },
    200,
    cors
  );
}

// ===== /pair-status =====
interface PairStatusPayload {
  loginUserId: string;
}

async function handlePairStatus(
  req: Request,
  env: Env,
  cors: Record<string, string>
): Promise<Response> {
  let payload: PairStatusPayload;
  try {
    payload = (await req.json()) as PairStatusPayload;
  } catch {
    return jsonResponse({ ok: false, error: "invalid_json" }, 400, cors);
  }
  if (!payload.loginUserId) {
    return jsonResponse(
      { ok: false, error: "loginUserId required" },
      400,
      cors
    );
  }
  const messagingUserId = await env.LINK_MAP.get(`link:${payload.loginUserId}`);
  return jsonResponse({ linked: !!messagingUserId }, 200, cors);
}

// ===== /notify =====
interface NotifyPayload {
  recipientLoginUserId: string;
  title?: string;
  body: string;
  href?: string;
}

async function handleNotify(
  req: Request,
  env: Env,
  cors: Record<string, string>
): Promise<Response> {
  let payload: NotifyPayload;
  try {
    payload = (await req.json()) as NotifyPayload;
  } catch {
    return jsonResponse({ ok: false, error: "invalid_json" }, 400, cors);
  }
  if (!payload.recipientLoginUserId || !payload.body) {
    return jsonResponse(
      { ok: false, error: "recipientLoginUserId and body required" },
      400,
      cors
    );
  }
  const messagingUserId = await env.LINK_MAP.get(
    `link:${payload.recipientLoginUserId}`
  );
  if (!messagingUserId) {
    // Not an error — just means the user hasn't enabled LINE notifications.
    return jsonResponse({ ok: false, reason: "not_linked" }, 200, cors);
  }

  const text = payload.title ? `【${payload.title}】\n${payload.body}` : payload.body;
  const fullText = payload.href
    ? `${text}\n\n👉 https://playmark0227-svg.github.io/swiply${payload.href}`
    : text;

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.LINE_MSG_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to: messagingUserId,
      messages: [{ type: "text", text: fullText }],
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    return jsonResponse(
      { ok: false, error: `LINE API error: ${detail}` },
      502,
      cors
    );
  }
  return jsonResponse({ ok: true }, 200, cors);
}

// ===== /webhook =====
interface LineWebhookEvent {
  type: string;
  replyToken?: string;
  timestamp: number;
  source?: { type: string; userId?: string };
  message?: { type: string; text?: string };
}

async function handleWebhook(req: Request, env: Env): Promise<Response> {
  const signature = req.headers.get("x-line-signature") || "";
  const bodyText = await req.text();
  const valid = await verifyLineSignature(
    env.LINE_MSG_CHANNEL_SECRET,
    bodyText,
    signature
  );
  if (!valid) {
    console.warn("[webhook] invalid signature");
    return new Response("Invalid signature", { status: 401 });
  }

  let body: { events?: LineWebhookEvent[] };
  try {
    body = JSON.parse(bodyText);
  } catch {
    return new Response("Invalid body", { status: 400 });
  }
  const events = body.events ?? [];

  for (const event of events) {
    try {
      await dispatchEvent(event, env);
    } catch (e) {
      console.error("[webhook] event handler error:", e);
      // Keep going — don't fail the entire batch
    }
  }
  return new Response("OK", { status: 200 });
}

async function dispatchEvent(event: LineWebhookEvent, env: Env): Promise<void> {
  const messagingUserId = event.source?.userId;

  if (event.type === "message" && event.message?.type === "text") {
    const raw = (event.message.text ?? "").trim().toUpperCase();
    const match = raw.match(PAIR_CODE_REGEX);
    if (match && messagingUserId) {
      await handlePairCompletion(env, match[0], messagingUserId, event.replyToken);
      return;
    }
    // Non-pair message — friendly fallback (only when replyToken exists).
    if (event.replyToken) {
      await replyToLine(
        env,
        event.replyToken,
        "SWIPLYからのお知らせ専用です🌷\nアプリのプロフィール画面から「LINE通知を有効化」を押すと、6文字のコードが表示されます。それをこちらに送ると連携できます。"
      );
    }
    return;
  }

  if (event.type === "follow") {
    if (event.replyToken) {
      await replyToLine(
        env,
        event.replyToken,
        "SWIPLYへようこそ！🌷\nアプリのプロフィール画面から「LINE通知を有効化」を押すと、ここにマッチや応募のお知らせが届くようになります。"
      );
    }
    return;
  }

  if (event.type === "unfollow") {
    // The user removed the OA. We could clean up the link mapping if we
    // had a reverse index, but iterating KV isn't free. Skip for now —
    // dead link entries get harmlessly returned as 403 from /v2/bot/message/push.
    return;
  }
}

async function handlePairCompletion(
  env: Env,
  code: string,
  messagingUserId: string,
  replyToken: string | undefined
): Promise<void> {
  const loginUserId = await env.LINK_MAP.get(`pair:${code}`);
  if (!loginUserId) {
    if (replyToken) {
      await replyToLine(
        env,
        replyToken,
        "コードが見つかりません💦\n10分で期限切れになります。SWIPLYアプリで「LINE通知を有効化」を押し直して、新しいコードをお試しください。"
      );
    }
    return;
  }
  // Persist the link, then clean up the one-time pair code.
  await env.LINK_MAP.put(`link:${loginUserId}`, messagingUserId);
  await env.LINK_MAP.delete(`pair:${code}`);
  if (replyToken) {
    await replyToLine(
      env,
      replyToken,
      "✓ SWIPLYと連携しました！🎉\nマッチ成立や応募ステータス更新をこのトークでお知らせします。"
    );
  }
}

// ===== LINE API helpers =====
async function replyToLine(
  env: Env,
  replyToken: string,
  text: string
): Promise<void> {
  const res = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.LINE_MSG_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    console.warn(`[reply] LINE API ${res.status}: ${detail}`);
  }
}

async function verifyLineSignature(
  secret: string,
  body: string,
  signature: string
): Promise<boolean> {
  if (!secret || !signature) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body)
  );
  const expected = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
  return expected === signature;
}
