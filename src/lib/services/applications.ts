/**
 * Applications service. Stores mock applications in localStorage so the UX
 * mirrors a real portal even without a backend.
 *
 * key: "swiply-applications" → Application[]
 */

export type ApplicationStatus =
  | "submitted" // 応募完了
  | "reviewing" // 書類選考中
  | "interview" // 面接調整中
  | "offered" // 内定
  | "rejected" // 不採用
  | "withdrawn"; // 辞退

export interface Application {
  id: string; // unique uuid-like
  jobId: string;
  /** Snapshot at apply time so list pages don't break if the job is removed. */
  jobTitle: string;
  jobCompany: string;
  jobImage: string;
  status: ApplicationStatus;
  appliedAt: string; // ISO
  message: string;
  /** Mock status timeline shown in /applications detail. */
  events: { at: string; status: ApplicationStatus; note?: string }[];
}

const KEY = "swiply-applications";

function read(): Application[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Application[]) : [];
  } catch {
    return [];
  }
}

function write(list: Application[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export async function getApplications(): Promise<Application[]> {
  return read().sort((a, b) => (a.appliedAt < b.appliedAt ? 1 : -1));
}

export async function getApplicationByJobId(
  jobId: string
): Promise<Application | undefined> {
  return read().find((a) => a.jobId === jobId);
}

export async function hasAppliedTo(jobId: string): Promise<boolean> {
  return !!(await getApplicationByJobId(jobId));
}

export async function submitApplication(input: {
  jobId: string;
  jobTitle: string;
  jobCompany: string;
  jobImage: string;
  message: string;
}): Promise<Application> {
  const now = new Date().toISOString();
  const app: Application = {
    id: `app-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    jobId: input.jobId,
    jobTitle: input.jobTitle,
    jobCompany: input.jobCompany,
    jobImage: input.jobImage,
    status: "submitted",
    appliedAt: now,
    message: input.message,
    events: [{ at: now, status: "submitted", note: "応募が完了しました" }],
  };
  const list = read();
  // Replace any existing application for the same job (re-apply allowed).
  const filtered = list.filter((a) => a.jobId !== input.jobId);
  filtered.push(app);
  write(filtered);
  return app;
}

/**
 * Admin: forcibly update an application's status (used by the ops console).
 * Adds an event entry tagged with [admin].
 */
export async function adminSetApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  note?: string
): Promise<void> {
  const list = read();
  const idx = list.findIndex((a) => a.id === applicationId);
  if (idx < 0) return;
  list[idx] = {
    ...list[idx],
    status,
    events: [
      ...list[idx].events,
      {
        at: new Date().toISOString(),
        status,
        note: note ?? `[admin] ステータスを${STATUS_LABEL[status]}に変更`,
      },
    ],
  };
  write(list);
}

export async function adminDeleteApplication(applicationId: string): Promise<void> {
  const list = read().filter((a) => a.id !== applicationId);
  write(list);
}

export async function withdrawApplication(jobId: string): Promise<void> {
  const list = read();
  const idx = list.findIndex((a) => a.jobId === jobId);
  if (idx < 0) return;
  const now = new Date().toISOString();
  list[idx] = {
    ...list[idx],
    status: "withdrawn",
    events: [
      ...list[idx].events,
      { at: now, status: "withdrawn", note: "応募を辞退しました" },
    ],
  };
  write(list);
}

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  submitted: "応募完了",
  reviewing: "書類選考中",
  interview: "面接調整中",
  offered: "内定",
  rejected: "不採用",
  withdrawn: "辞退",
};

export const STATUS_TONE: Record<ApplicationStatus, string> = {
  submitted: "bg-blue-50 text-blue-600 border-blue-200",
  reviewing: "bg-amber-50 text-amber-600 border-amber-200",
  interview: "bg-violet-50 text-violet-600 border-violet-200",
  offered: "bg-emerald-50 text-emerald-600 border-emerald-200",
  rejected: "bg-gray-100 text-gray-500 border-gray-200",
  withdrawn: "bg-gray-50 text-gray-400 border-gray-200",
};
