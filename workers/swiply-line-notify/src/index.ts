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
  /**
   * Optional — when set, /interview/transcribe proxies audio to OpenAI
   * Whisper. When unset, the endpoint returns a mock transcript so the
   * rest of the pipeline still works for demos.
   */
  OPENAI_API_KEY?: string;
  /**
   * Optional — when set, /interview/analyze proxies the transcript to
   * Anthropic Claude. When unset, returns a mock InterviewAnalysis.
   */
  ANTHROPIC_API_KEY?: string;
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
    // multipart/form-data for /interview/transcribe — explicit
    // Content-Type still works, but Access-Control-Allow-Headers needs
    // to accept it.
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
      if (url.pathname === "/interview/transcribe" && req.method === "POST") {
        return await handleInterviewTranscribe(req, env, cors);
      }
      if (url.pathname === "/interview/analyze" && req.method === "POST") {
        return await handleInterviewAnalyze(req, env, cors);
      }
      if (url.pathname === "/scout/generate" && req.method === "POST") {
        return await handleScoutGenerate(req, env, cors);
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

// ===== /interview/transcribe =====
// Accepts multipart/form-data with field "audio" (the recorded blob).
// Proxies to OpenAI Whisper. If OPENAI_API_KEY is unset, returns a
// deterministic mock transcript so the client UI stays functional.
async function handleInterviewTranscribe(
  req: Request,
  env: Env,
  cors: Record<string, string>
): Promise<Response> {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonResponse({ ok: false, error: "invalid_form" }, 400, cors);
  }
  // Cloudflare Workers' type definition for FormData#get is currently
  // `string | null` even for file uploads (the runtime returns a File
  // when the field is a file). Cast through `unknown` to match reality.
  const audioRaw = form.get("audio") as unknown;
  if (
    !audioRaw ||
    typeof audioRaw === "string" ||
    !(audioRaw instanceof File)
  ) {
    return jsonResponse(
      { ok: false, error: "audio field required" },
      400,
      cors
    );
  }
  const audio: File = audioRaw;

  if (!env.OPENAI_API_KEY) {
    return jsonResponse(
      {
        ok: true,
        mock: true,
        transcript: buildMockTranscript(),
      },
      200,
      cors
    );
  }

  // Forward to OpenAI Whisper.
  // https://platform.openai.com/docs/api-reference/audio/createTranscription
  const upstream = new FormData();
  upstream.append("file", audio, audio.name || "interview.webm");
  upstream.append("model", "whisper-1");
  upstream.append("language", "ja");
  upstream.append("response_format", "json");

  const res = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
      body: upstream,
    }
  );
  if (!res.ok) {
    const detail = await res.text();
    return jsonResponse(
      { ok: false, error: `whisper: ${detail.slice(0, 500)}` },
      502,
      cors
    );
  }
  const json = (await res.json()) as { text?: string };
  return jsonResponse({ ok: true, transcript: json.text ?? "" }, 200, cors);
}

function buildMockTranscript(): string {
  return [
    "面接担当：本日はお時間をいただきありがとうございます。まずは自己紹介をお願いします。",
    "候補者：はい、よろしくお願いします。これまでフロントエンドエンジニアとして3年ほど働いておりまして、ReactとTypeScriptを中心に開発してきました。",
    "面接担当：素晴らしいですね。これまでの一番の成果について教えてください。",
    "候補者：ECサイトのリニューアルプロジェクトでチームリーダーを務め、ページ表示速度を40%改善しました。Lighthouse スコアも大きく上がりました。",
    "面接担当：チームをまとめる上で意識したことは何ですか？",
    "候補者：誰でも質問しやすい雰囲気作りと、決定の背景をドキュメント化することを徹底しました。",
    "面接担当：弊社で挑戦したいことはありますか？",
    "候補者：UXに踏み込んだ意思決定がしやすい組織だと聞いておりまして、ユーザー価値に直結する開発に携わりたいです。",
    "面接担当：ありがとうございます。最後に何か質問はありますか？",
    "候補者：チームの開発フローと意思決定について、もう少し詳しく伺ってもよろしいでしょうか。",
  ].join("\n");
}

// ===== /interview/analyze =====
// Accepts JSON: { transcript, mode: "user"|"company", jobTitle, jobCompany }
// Returns { ok, analysis: InterviewAnalysis, mock? }.
interface AnalyzePayload {
  transcript: string;
  mode: "user" | "company";
  jobTitle?: string;
  jobCompany?: string;
}

interface ClaudeAnalysis {
  summary: string;
  strengths: string[];
  improvements: string[];
  recommendation: string;
  warnings?: string[];
}

async function handleInterviewAnalyze(
  req: Request,
  env: Env,
  cors: Record<string, string>
): Promise<Response> {
  let payload: AnalyzePayload;
  try {
    payload = (await req.json()) as AnalyzePayload;
  } catch {
    return jsonResponse({ ok: false, error: "invalid_json" }, 400, cors);
  }
  if (!payload.transcript || typeof payload.transcript !== "string") {
    return jsonResponse(
      { ok: false, error: "transcript required" },
      400,
      cors
    );
  }
  const mode = payload.mode === "company" ? "company" : "user";
  const generatedAt = new Date().toISOString();

  if (!env.ANTHROPIC_API_KEY) {
    return jsonResponse(
      {
        ok: true,
        mock: true,
        analysis: buildMockAnalysis(mode, generatedAt),
      },
      200,
      cors
    );
  }

  const prompt = buildAnalysisPrompt(payload, mode);
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    return jsonResponse(
      { ok: false, error: `claude: ${detail.slice(0, 500)}` },
      502,
      cors
    );
  }
  type ClaudeResponse = {
    content?: Array<{ type: string; text?: string }>;
  };
  const json = (await res.json()) as ClaudeResponse;
  const text =
    json.content
      ?.filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("\n") ?? "";
  const parsed = parseAnalysisJson(text);
  if (!parsed) {
    return jsonResponse(
      { ok: false, error: "claude returned non-JSON output" },
      502,
      cors
    );
  }
  return jsonResponse(
    { ok: true, analysis: { ...parsed, generatedAt } },
    200,
    cors
  );
}

function buildAnalysisPrompt(
  p: AnalyzePayload,
  mode: "user" | "company"
): string {
  const persona =
    mode === "user"
      ? "あなたはキャリアコーチです。求職者本人に向けて、次の面接や転職活動に活かせる具体的なフィードバックを書いてください。"
      : "あなたは採用コンサルタントです。採用担当者に向けて、この候補者の評価レポートを書いてください。";

  return [
    persona,
    "",
    `求人: ${p.jobCompany ?? ""} ${p.jobTitle ?? ""}`,
    "",
    "次のビデオ面接の文字起こしを読み、JSON形式で評価してください。返答は ```json ... ``` のような囲みやコメント無しで、純粋な JSON オブジェクトのみを返してください。スキーマ:",
    "{",
    '  "summary": "1〜2文の総評",',
    '  "strengths": ["強み1", "強み2", ...],   // 3〜5個',
    '  "improvements": ["改善ポイント1", ...], // 2〜4個',
    '  "recommendation": "1文のおすすめ次アクション",',
    '  "warnings": ["懸念事項"]               // 任意、なければ省略',
    "}",
    "",
    "文字起こし:",
    "----",
    p.transcript,
    "----",
    "",
    "JSON のみを返してください。",
  ].join("\n");
}

function parseAnalysisJson(text: string): ClaudeAnalysis | null {
  // Try direct parse first
  const trimmed = text.trim();
  const direct = tryParseJson(trimmed);
  if (direct) return direct;
  // Try to extract a JSON object from markdown fences or surrounding text
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (fence) {
    const fenced = tryParseJson(fence[1]);
    if (fenced) return fenced;
  }
  const obj = trimmed.match(/\{[\s\S]+\}/);
  if (obj) {
    return tryParseJson(obj[0]);
  }
  return null;
}

function tryParseJson(s: string): ClaudeAnalysis | null {
  try {
    const parsed = JSON.parse(s) as Partial<ClaudeAnalysis>;
    if (
      typeof parsed.summary === "string" &&
      Array.isArray(parsed.strengths) &&
      Array.isArray(parsed.improvements) &&
      typeof parsed.recommendation === "string"
    ) {
      return {
        summary: parsed.summary,
        strengths: parsed.strengths.map(String),
        improvements: parsed.improvements.map(String),
        recommendation: parsed.recommendation,
        warnings: Array.isArray(parsed.warnings)
          ? parsed.warnings.map(String)
          : undefined,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

function buildMockAnalysis(
  mode: "user" | "company",
  generatedAt: string
): ClaudeAnalysis & { generatedAt: string } {
  if (mode === "user") {
    return {
      summary:
        "落ち着いた受け答えで実績を具体的に語れていました。次回はより会社固有の課題に踏み込んだ質問を準備するとさらに評価が上がります。",
      strengths: [
        "数値（40%改善）で成果を語れている",
        "チームリードの経験を具体的なエピソードで示せている",
        "言葉遣いが丁寧で聞き取りやすい",
      ],
      improvements: [
        "応募先の事業ドメインに踏み込んだ質問が少なかった",
        "技術選定の意思決定プロセスをもう少し具体的に語れると強い",
      ],
      recommendation:
        "次回までに「なぜこの会社なのか」を3つの観点で言語化して臨むと差別化できます。",
      generatedAt,
    };
  }
  return {
    summary:
      "コミュニケーション能力と実績の言語化能力が高く、リーダー候補として有望です。技術力の深さは追加面接で確認推奨。",
    strengths: [
      "数値で成果を語れる説明能力",
      "リーダーシップ経験あり（チーム管理 + ドキュメント文化醸成）",
      "改善志向（Lighthouse スコア向上の実例）",
    ],
    improvements: [
      "技術選定の判断軸が抽象的だったため、コーディング面接で深掘り推奨",
      "弊社事業への理解度が表面的なので、二次面接ではビジネス観点も確認",
    ],
    recommendation:
      "次フェーズ（コーディング面接 + マネージャー面談）に進めることを推奨します。",
    warnings: ["技術スタックの整合性は次回面接で要確認"],
    generatedAt,
  };
}

// ===== /scout/generate =====
// Generates a personalized scout message for a single candidate, using
// the company's role + the candidate's profile snippet. Replaces the
// generic "定型文スカウト" pattern that drives mainstream sites' open
// rates down to ~30%.
//
// Request:
//   {
//     candidate: { name, age?, selfIntro, skills?, hobbies?, experience? },
//     job:       { title, company, catchphrase?, description? },
//     senderName: "採用担当 田中花子",
//     tone?: "casual" | "formal"  (default: formal)
//   }
//
// Response:
//   { ok, message: string, mock?: boolean }
//
// When ANTHROPIC_API_KEY is not set, returns a deterministic mock so
// the UI keeps working in demos.
interface ScoutPayload {
  candidate: {
    name: string;
    age?: string;
    selfIntro?: string;
    skills?: string[];
    hobbies?: string[];
    experience?: string;
  };
  job: {
    title: string;
    company: string;
    catchphrase?: string;
    description?: string;
  };
  senderName: string;
  tone?: "casual" | "formal";
}

async function handleScoutGenerate(
  req: Request,
  env: Env,
  cors: Record<string, string>
): Promise<Response> {
  let payload: ScoutPayload;
  try {
    payload = (await req.json()) as ScoutPayload;
  } catch {
    return jsonResponse({ ok: false, error: "invalid_json" }, 400, cors);
  }
  if (!payload.candidate?.name || !payload.job?.title || !payload.senderName) {
    return jsonResponse(
      { ok: false, error: "candidate.name, job.title, senderName required" },
      400,
      cors
    );
  }

  if (!env.ANTHROPIC_API_KEY) {
    return jsonResponse(
      {
        ok: true,
        mock: true,
        message: buildMockScout(payload),
      },
      200,
      cors
    );
  }

  const prompt = buildScoutPrompt(payload);
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    return jsonResponse(
      { ok: false, error: `claude: ${detail.slice(0, 500)}` },
      502,
      cors
    );
  }
  type ClaudeResponse = {
    content?: Array<{ type: string; text?: string }>;
  };
  const json = (await res.json()) as ClaudeResponse;
  const text =
    json.content
      ?.filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("\n")
      .trim() ?? "";
  if (!text) {
    return jsonResponse(
      { ok: false, error: "claude returned empty text" },
      502,
      cors
    );
  }
  return jsonResponse({ ok: true, message: text }, 200, cors);
}

function buildScoutPrompt(p: ScoutPayload): string {
  const tone = p.tone === "casual" ? "ややカジュアル（敬体だけ守る）" : "丁寧";
  return [
    "あなたは中小企業の採用担当として、候補者個人に向けたスカウト文章を作成します。",
    "",
    "**強い制約:**",
    "- 「定型文」感を絶対に出さない。冒頭は候補者の自己紹介の具体的な一節を引用する。",
    "- 候補者の名前を冒頭で呼ぶ。",
    "- 候補者の経験/スキル/趣味のうち、ポジションに関連する点を1〜2個明確に言及する。",
    "- 業務内容を簡潔に伝える（30文字以内）。",
    "- 最後にカジュアル面談の打診で締める。",
    "- 全体を200〜350文字。改行で読みやすく。",
    `- トーン: ${tone}`,
    `- 末尾の署名は「${p.senderName}」。`,
    "",
    "**候補者プロフィール:**",
    `名前: ${p.candidate.name}`,
    p.candidate.age ? `年齢: ${p.candidate.age}` : "",
    p.candidate.selfIntro ? `自己紹介: ${p.candidate.selfIntro}` : "",
    p.candidate.skills?.length ? `スキル: ${p.candidate.skills.join(", ")}` : "",
    p.candidate.hobbies?.length ? `趣味: ${p.candidate.hobbies.join(", ")}` : "",
    p.candidate.experience ? `経験: ${p.candidate.experience}` : "",
    "",
    "**ポジション:**",
    `会社: ${p.job.company}`,
    `タイトル: ${p.job.title}`,
    p.job.catchphrase ? `キャッチ: ${p.job.catchphrase}` : "",
    p.job.description ? `業務概要: ${p.job.description.slice(0, 300)}` : "",
    "",
    "スカウト本文のみを返してください（メタコメント・前置き不要）。",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildMockScout(p: ScoutPayload): string {
  const intro = p.candidate.selfIntro
    ? `「${p.candidate.selfIntro.slice(0, 24)}…」というプロフィールを拝見し、`
    : "プロフィールを拝見し、";
  const hook =
    p.candidate.skills?.[0] ||
    p.candidate.hobbies?.[0] ||
    "今回のポジション";
  return [
    `${p.candidate.name}さん、${p.job.company}の${p.senderName}です。`,
    "",
    `${intro}弊社の${p.job.title}と相性が良さそうだなと思いご連絡しました。`,
    `特に「${hook}」のところ、今回のチームでも重要視している部分です。`,
    "",
    p.job.catchphrase
      ? `${p.job.catchphrase}という想いで日々動いています。`
      : "",
    "もしご興味あれば、まずは20分くらいのカジュアル面談からいかがでしょうか？",
    "ご質問だけでも全然OKですので、お気軽にどうぞ🌷",
    "",
    p.senderName,
  ]
    .filter(Boolean)
    .join("\n");
}
