/**
 * Frontend client for the AI scout endpoint (`/scout/generate`) on the
 * SWIPLY Worker. Keeps API shape in one place + handles the no-endpoint
 * fallback so the admin UI works in completely offline demos.
 *
 * Sent scouts are persisted to localStorage so the admin can see what's
 * already been sent (and avoid duplicate sends to the same candidate).
 */

import type { CandidateProfile } from "@/data/candidates";
import type { Job } from "@/types/job";

const HISTORY_KEY = "swiply-scout-history";

export interface ScoutMessage {
  id: string;
  candidateId: string;
  jobId: string;
  senderName: string;
  body: string;
  /** ISO timestamp. */
  sentAt: string;
  /** Whether the message was generated via the AI endpoint vs hand-edited. */
  aiGenerated: boolean;
}

interface GenerateResponse {
  ok: boolean;
  message?: string;
  mock?: boolean;
  error?: string;
}

function endpoint(): string {
  return (process.env.NEXT_PUBLIC_LINE_NOTIFY_URL || "").replace(/\/$/, "");
}

/**
 * Generate a personalized scout message for the given candidate + job.
 * When the Worker isn't configured, returns a deterministic local
 * fallback so the UI still demos.
 */
export async function generateScout(opts: {
  candidate: CandidateProfile;
  job: Job;
  senderName: string;
  tone?: "casual" | "formal";
}): Promise<GenerateResponse> {
  const ep = endpoint();
  if (!ep) {
    return {
      ok: true,
      mock: true,
      message: localFallback(opts),
    };
  }
  try {
    const res = await fetch(`${ep}/scout/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidate: {
          name: opts.candidate.name,
          age: opts.candidate.age,
          selfIntro: opts.candidate.selfIntro,
          skills: opts.candidate.skills,
          hobbies: opts.candidate.hobbies,
          experience: opts.candidate.experience,
        },
        job: {
          title: opts.job.title,
          company: opts.job.company,
          catchphrase: opts.job.catchphrase,
          description: opts.job.description,
        },
        senderName: opts.senderName,
        tone: opts.tone ?? "formal",
      }),
    });
    return (await res.json()) as GenerateResponse;
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

function localFallback(opts: {
  candidate: CandidateProfile;
  job: Job;
  senderName: string;
}): string {
  const c = opts.candidate;
  const j = opts.job;
  const hook = c.skills[0] || c.hobbies[0] || "今回のポジション";
  return [
    `${c.name}さん、${j.company}の${opts.senderName}です。`,
    "",
    `「${c.selfIntro.slice(0, 28)}…」というプロフィールを拝見し、`,
    `弊社の${j.title}と相性が良さそうだなと思いご連絡しました。`,
    `特に「${hook}」のところ、今回のチームでも重要視している部分です。`,
    "",
    j.catchphrase ? `${j.catchphrase}という想いで日々動いています。` : "",
    "もしご興味あれば、まずは20分くらいのカジュアル面談からいかがでしょうか？",
    "ご質問だけでも全然OKですので、お気軽にどうぞ🌷",
    "",
    opts.senderName,
  ]
    .filter(Boolean)
    .join("\n");
}

// ─── History (localStorage) ──────────────────────────────────────────

export function getScoutHistory(): ScoutMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as ScoutMessage[]) : [];
  } catch {
    return [];
  }
}

export function recordScoutSent(input: Omit<ScoutMessage, "id" | "sentAt">): ScoutMessage {
  const msg: ScoutMessage = {
    ...input,
    id: `scout-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    sentAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    const list = getScoutHistory();
    list.push(msg);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  }
  return msg;
}
