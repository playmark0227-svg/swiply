/**
 * Video interview scheduling + recording + AI analysis service.
 *
 * Storage layout (localStorage):
 *   "swiply-interviews" → InterviewAppointment[]
 *
 * Each interview FKs to an existing Match (see `matches.ts`). When a
 * company books an interview from a message thread, we create an
 * InterviewAppointment, append a system message to the thread with a
 * join link, and best-effort push a LINE notification to the candidate.
 *
 * Video stack — pragmatic, dependency-free:
 *   - Video room: Jitsi Meet, embedded via <iframe> using a deterministic
 *     room name derived from the interview ID. No API keys required for
 *     the public meet.jit.si server.
 *   - Recording: MediaRecorder API on the candidate's local audio track,
 *     consent-gated. The audio blob is uploaded to the SWIPLY Worker
 *     (`workers/swiply-line-notify/`) which proxies to OpenAI Whisper for
 *     transcription and Anthropic Claude for analysis.
 *   - Retention: 30 days. `expireAt` on each appointment; `getInterviews`
 *     transparently prunes expired entries on read.
 *
 * Worker endpoints (new — see `workers/swiply-line-notify/src/index.ts`):
 *   POST /interview/transcribe  → audio (FormData) → { transcript }
 *   POST /interview/analyze     → { transcript, mode } → InterviewAnalysis
 *
 * If the corresponding API keys (OPENAI_API_KEY, ANTHROPIC_API_KEY) are
 * not configured on the Worker, the endpoints respond with mock data —
 * the UI keeps working end-to-end without any external dependency.
 */

import { appendMessage } from "@/lib/services/matches";
import { adminCreateNotification } from "@/lib/services/notifications";

// ─── Types ────────────────────────────────────────────────────────────

export type InterviewStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

/** Whose perspective the AI report is written for. */
export type AnalysisMode = "user" | "company";

export interface InterviewAnalysis {
  /** 1–2 sentence top-level summary. */
  summary: string;
  /** Strengths / positives observed in the conversation. */
  strengths: string[];
  /** Areas to improve / things to consider. */
  improvements: string[];
  /** A single recommended next step. */
  recommendation: string;
  /** Optional caution flags. */
  warnings?: string[];
  /** ISO timestamp when this report was generated. */
  generatedAt: string;
}

export interface InterviewAppointment {
  id: string;
  matchId: string;
  jobId: string;
  jobTitle: string;
  jobCompany: string;
  jobImage: string;
  /** ISO 8601 — when the interview should start. */
  scheduledAt: string;
  /** Duration in minutes. */
  durationMinutes: number;
  /** Jitsi room name (used to build the meet.jit.si URL). */
  roomName: string;
  /** Optional title shown to participants. */
  title?: string;
  /** Optional notes from the host. */
  notes?: string;
  status: InterviewStatus;
  createdAt: string;
  updatedAt: string;
  /** When recording started (client-side). */
  recordedAt?: string;
  /** Transcript text from Whisper. */
  transcript?: string;
  /** AI analysis written for the jobseeker. */
  analysisForUser?: InterviewAnalysis;
  /** AI analysis written for the company. */
  analysisForCompany?: InterviewAnalysis;
  /**
   * Hard-delete after this ISO timestamp. Defaults to scheduledAt + 30
   * days. Computed at create time and refreshed when recording uploads.
   */
  expireAt: string;
}

// ─── Storage primitives ───────────────────────────────────────────────

const STORAGE_KEY = "swiply-interviews";
const CHANGE_EVENT = "swiply-interviews-changed";
const RETENTION_DAYS = 30;

function notifyChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function readRaw(): InterviewAppointment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as InterviewAppointment[]) : [];
  } catch {
    return [];
  }
}

function writeRaw(list: InterviewAppointment[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  notifyChange();
}

/** Prune any entries past their `expireAt`. Returns the live set. */
function pruneExpired(list: InterviewAppointment[]): InterviewAppointment[] {
  const now = Date.now();
  const live = list.filter((a) => {
    const exp = Date.parse(a.expireAt);
    return Number.isNaN(exp) || exp > now;
  });
  if (live.length !== list.length && typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(live));
  }
  return live;
}

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

/** Derive a clean Jitsi room name from the interview ID. */
function deriveRoomName(interviewId: string): string {
  // meet.jit.si accepts most alphanum characters; namespace to "swiply"
  // to avoid colliding with random rooms on the public server.
  return `swiply-${interviewId.replace(/[^a-zA-Z0-9-]/g, "")}`;
}

// ─── Read API ─────────────────────────────────────────────────────────

export function getInterviews(): InterviewAppointment[] {
  return pruneExpired(readRaw()).sort((a, b) =>
    a.scheduledAt < b.scheduledAt ? -1 : 1
  );
}

export function getInterviewById(id: string): InterviewAppointment | undefined {
  return getInterviews().find((a) => a.id === id);
}

export function getInterviewByMatchId(
  matchId: string
): InterviewAppointment | undefined {
  // Most-recent active interview for a match (the one users care about).
  return getInterviews()
    .filter((a) => a.matchId === matchId && a.status !== "cancelled")
    .sort((a, b) => (a.scheduledAt < b.scheduledAt ? 1 : -1))[0];
}

export function getInterviewsForMatch(
  matchId: string
): InterviewAppointment[] {
  return getInterviews()
    .filter((a) => a.matchId === matchId)
    .sort((a, b) => (a.scheduledAt < b.scheduledAt ? -1 : 1));
}

/** Fire `handler` whenever interview state changes (this tab or another). */
export function subscribeInterviews(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onChange = () => handler();
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) handler();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

// ─── Write API ────────────────────────────────────────────────────────

export interface CreateInterviewInput {
  matchId: string;
  jobId: string;
  jobTitle: string;
  jobCompany: string;
  jobImage: string;
  scheduledAt: string; // ISO 8601
  durationMinutes: number;
  title?: string;
  notes?: string;
}

export function createInterview(
  input: CreateInterviewInput
): InterviewAppointment {
  const now = new Date().toISOString();
  const id = genId("itv");
  const expireAt = new Date(
    Date.parse(input.scheduledAt) + RETENTION_DAYS * 86_400_000
  ).toISOString();
  const appointment: InterviewAppointment = {
    id,
    matchId: input.matchId,
    jobId: input.jobId,
    jobTitle: input.jobTitle,
    jobCompany: input.jobCompany,
    jobImage: input.jobImage,
    scheduledAt: input.scheduledAt,
    durationMinutes: input.durationMinutes,
    roomName: deriveRoomName(id),
    title: input.title,
    notes: input.notes,
    status: "scheduled",
    createdAt: now,
    updatedAt: now,
    expireAt,
  };

  const list = readRaw();
  list.push(appointment);
  writeRaw(list);

  // System message in the thread
  const when = formatJaDateTime(input.scheduledAt);
  appendMessage(input.matchId, {
    sender: "system",
    senderName: "SWIPLY",
    body: `📹 ビデオ面接が予約されました\n${when}（${input.durationMinutes}分）${
      input.title ? `\n議題: ${input.title}` : ""
    }\n面接ルームへ → /interview/?id=${id}`,
  });

  // In-app notification
  try {
    adminCreateNotification({
      type: "like",
      title: `${input.jobCompany} とビデオ面接が予約されました`,
      body: `${when}（${input.durationMinutes}分）の面接が予約されました。`,
      href: `/interview/?id=${id}`,
    });
  } catch {
    // best-effort
  }

  // Best-effort LINE push to the candidate
  void notifyLine({
    title: `${input.jobCompany} とビデオ面接`,
    body: `${when}（${input.durationMinutes}分）に面接が予約されました。当日は SWIPLY からご参加ください📹`,
    href: `/interview/?id=${id}`,
  });

  return appointment;
}

export function updateInterview(
  id: string,
  patch: Partial<
    Omit<InterviewAppointment, "id" | "matchId" | "createdAt" | "roomName">
  >
): InterviewAppointment | null {
  const list = readRaw();
  const idx = list.findIndex((a) => a.id === id);
  if (idx < 0) return null;
  const next: InterviewAppointment = {
    ...list[idx],
    ...patch,
    id: list[idx].id,
    matchId: list[idx].matchId,
    createdAt: list[idx].createdAt,
    roomName: list[idx].roomName,
    updatedAt: new Date().toISOString(),
  };
  list[idx] = next;
  writeRaw(list);
  return next;
}

export function cancelInterview(id: string): InterviewAppointment | null {
  const updated = updateInterview(id, { status: "cancelled" });
  if (updated) {
    appendMessage(updated.matchId, {
      sender: "system",
      senderName: "SWIPLY",
      body: `📹 ビデオ面接がキャンセルされました（${formatJaDateTime(
        updated.scheduledAt
      )}）`,
    });
  }
  return updated;
}

export function deleteInterview(id: string): void {
  writeRaw(readRaw().filter((a) => a.id !== id));
}

// ─── Utility ──────────────────────────────────────────────────────────

export function formatJaDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getFullYear();
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  const hh = d.getHours().toString().padStart(2, "0");
  const mi = d.getMinutes().toString().padStart(2, "0");
  return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
}

export function buildJitsiUrl(roomName: string, displayName?: string): string {
  // # fragment so config doesn't leak into Worker logs / referrers.
  const params = [
    "config.prejoinPageEnabled=false",
    "config.startWithVideoMuted=false",
    "config.startWithAudioMuted=false",
    "config.disableDeepLinking=true",
  ];
  if (displayName) {
    params.push(
      `userInfo.displayName=${encodeURIComponent(`"${displayName}"`)}`
    );
  }
  return `https://meet.jit.si/${encodeURIComponent(roomName)}#${params.join(
    "&"
  )}`;
}

/** "in 5 min" / "8 min ago" — used for status badges. */
export function timeUntil(iso: string): {
  diffMs: number;
  label: string;
  state: "future" | "now" | "past";
} {
  const diffMs = Date.parse(iso) - Date.now();
  const abs = Math.abs(diffMs);
  let label: string;
  if (abs < 60_000) label = "まもなく";
  else if (abs < 3600_000) label = `${Math.round(abs / 60_000)}分`;
  else if (abs < 86_400_000) label = `${Math.round(abs / 3600_000)}時間`;
  else label = `${Math.round(abs / 86_400_000)}日`;
  if (diffMs > 60_000) return { diffMs, label: `あと${label}`, state: "future" };
  if (diffMs < -60_000) return { diffMs, label: `${label}前`, state: "past" };
  return { diffMs, label: "面接中", state: "now" };
}

// ─── Worker client (transcription + AI analysis + LINE) ──────────────

function workerEndpoint(): string {
  return (process.env.NEXT_PUBLIC_LINE_NOTIFY_URL || "").replace(/\/$/, "");
}

interface TranscribeResponse {
  ok: boolean;
  transcript?: string;
  mock?: boolean;
  error?: string;
}

/**
 * Upload an audio blob to the Worker and receive a Whisper transcript.
 *
 * If OPENAI_API_KEY is not configured on the Worker, the response will
 * include `mock: true` and a placeholder transcript — the rest of the
 * pipeline keeps working.
 */
export async function transcribeAudio(audio: Blob): Promise<TranscribeResponse> {
  const endpoint = workerEndpoint();
  if (!endpoint) {
    return { ok: false, error: "worker_endpoint_missing" };
  }
  try {
    const fd = new FormData();
    // Whisper accepts m4a / mp3 / wav / webm / mpeg / mpga / ogg / flac.
    // MediaRecorder typically produces audio/webm.
    fd.append("audio", audio, `interview-${Date.now()}.webm`);
    const res = await fetch(`${endpoint}/interview/transcribe`, {
      method: "POST",
      body: fd,
    });
    const json = (await res.json()) as TranscribeResponse;
    return json;
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

interface AnalyzeResponse {
  ok: boolean;
  analysis?: InterviewAnalysis;
  mock?: boolean;
  error?: string;
}

/**
 * Send the transcript to the Worker for AI analysis.
 *
 * `mode` decides the perspective: "user" produces a coaching report for
 * the jobseeker; "company" produces a hiring-side evaluation. Different
 * prompts on the Worker side.
 */
export async function analyzeInterview(
  transcript: string,
  mode: AnalysisMode,
  context: { jobTitle: string; jobCompany: string }
): Promise<AnalyzeResponse> {
  const endpoint = workerEndpoint();
  if (!endpoint) {
    return { ok: false, error: "worker_endpoint_missing" };
  }
  try {
    const res = await fetch(`${endpoint}/interview/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript,
        mode,
        jobTitle: context.jobTitle,
        jobCompany: context.jobCompany,
      }),
    });
    const json = (await res.json()) as AnalyzeResponse;
    return json;
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

interface LineNotifyPayload {
  title: string;
  body: string;
  href?: string;
}

/** Best-effort LINE push. Mirrors the helper in matches.ts. */
async function notifyLine(payload: LineNotifyPayload): Promise<void> {
  if (typeof window === "undefined") return;
  const endpoint = workerEndpoint();
  if (!endpoint) return;
  let recipientLoginUserId: string | null = null;
  try {
    const raw = localStorage.getItem("swiply-session");
    if (raw) {
      const session = JSON.parse(raw) as { uid?: string };
      if (session.uid?.startsWith("line-")) {
        recipientLoginUserId = session.uid.slice("line-".length);
      }
    }
  } catch {
    // ignore
  }
  if (!recipientLoginUserId) return;
  try {
    await fetch(`${endpoint}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientLoginUserId,
        title: payload.title,
        body: payload.body,
        href: payload.href,
      }),
    });
  } catch {
    // best-effort
  }
}

/** Re-exported for the booking flow callers that need to ping LINE later. */
export const sendInterviewLineNotification = notifyLine;
