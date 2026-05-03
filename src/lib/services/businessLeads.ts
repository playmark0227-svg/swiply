/**
 * Business-side lead capture.
 *
 * For the static demo this just persists to localStorage. In production
 * this should POST to a backend endpoint (Formspree, Notion, HubSpot,
 * the project's own API, etc.) — replace `submitLead` with the real call.
 */

import { firebaseEnabled, getDb } from "@/lib/firebase/client";

const STORAGE_KEY = "swiply-business-leads";

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "meeting"
  | "won"
  | "lost";

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: "新規",
  contacted: "連絡済み",
  qualified: "見込み有",
  meeting: "商談中",
  won: "成約",
  lost: "見送り",
};

export const LEAD_STATUS_TONE: Record<LeadStatus, string> = {
  new: "bg-blue-50 text-blue-600 border-blue-200",
  contacted: "bg-amber-50 text-amber-600 border-amber-200",
  qualified: "bg-violet-50 text-violet-600 border-violet-200",
  meeting: "bg-cyan-50 text-cyan-700 border-cyan-200",
  won: "bg-emerald-50 text-emerald-700 border-emerald-200",
  lost: "bg-gray-100 text-gray-500 border-gray-200",
};

export interface BusinessLead {
  id: string;
  company: string;
  contactName: string;
  email: string;
  phone?: string;
  industry?: string;
  size?: string;
  plan?: string;
  message?: string;
  submittedAt: string;
  /** Sales pipeline status. Defaults to "new". */
  status?: LeadStatus;
  /** Operator notes — private. */
  notes?: string;
  /** Last status change timestamp. */
  updatedAt?: string;
}

export async function submitLead(
  input: Omit<BusinessLead, "id" | "submittedAt" | "status">
): Promise<BusinessLead> {
  const lead: BusinessLead = {
    ...input,
    id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    submittedAt: new Date().toISOString(),
    status: "new",
  };

  // Optional: ship to Firestore when configured.
  if (firebaseEnabled && process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    const db = await getDb();
    if (db) {
      try {
        const { addDoc, collection, serverTimestamp } = await import(
          "firebase/firestore"
        );
        await addDoc(collection(db, "businessLeads"), {
          ...lead,
          createdAt: serverTimestamp(),
        });
      } catch {
        // fall through to local persistence
      }
    }
  }

  if (typeof window !== "undefined") {
    const existing = readLocal();
    existing.unshift(lead);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  }
  return lead;
}

export function getLocalLeads(): BusinessLead[] {
  return readLocal();
}

export function adminUpdateLead(
  id: string,
  patch: Partial<Pick<BusinessLead, "status" | "notes">>
): void {
  if (typeof window === "undefined") return;
  const list = readLocal();
  const idx = list.findIndex((l) => l.id === id);
  if (idx < 0) return;
  list[idx] = {
    ...list[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function adminDeleteLead(id: string): void {
  if (typeof window === "undefined") return;
  const list = readLocal().filter((l) => l.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function readLocal(): BusinessLead[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BusinessLead[]) : [];
  } catch {
    return [];
  }
}
