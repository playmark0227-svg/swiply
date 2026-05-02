/**
 * Business-side lead capture.
 *
 * For the static demo this just persists to localStorage. In production
 * this should POST to a backend endpoint (Formspree, Notion, HubSpot,
 * the project's own API, etc.) — replace `submitLead` with the real call.
 */

import { firebaseEnabled, getDb } from "@/lib/firebase/client";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const STORAGE_KEY = "swiply-business-leads";

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
}

export async function submitLead(
  input: Omit<BusinessLead, "id" | "submittedAt">
): Promise<BusinessLead> {
  const lead: BusinessLead = {
    ...input,
    id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    submittedAt: new Date().toISOString(),
  };

  // Optional: ship to Firestore when configured.
  if (firebaseEnabled) {
    const db = getDb();
    if (db) {
      try {
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

function readLocal(): BusinessLead[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BusinessLead[]) : [];
  } catch {
    return [];
  }
}
