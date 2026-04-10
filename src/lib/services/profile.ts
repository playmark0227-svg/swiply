import { firebaseEnabled, getDb } from "@/lib/firebase/client";
import { getCurrentUserId } from "@/lib/services/auth";
import { defaultProfile, type UserProfile } from "@/types/profile";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

const STORAGE_KEY = "swiply-profile";

/**
 * Profile service.
 *
 * Firestore layout:
 *   users/{userId} → UserProfile + { updatedAt }
 *
 * Fallback: localStorage["swiply-profile"]
 */

export async function getProfile(): Promise<UserProfile> {
  if (firebaseEnabled) {
    const db = getDb();
    if (db) {
      const uid = await getCurrentUserId();
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        return { ...defaultProfile, ...(snap.data() as Partial<UserProfile>) };
      }
      return defaultProfile;
    }
  }
  return readLocal();
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  if (firebaseEnabled) {
    const db = getDb();
    if (db) {
      const uid = await getCurrentUserId();
      await setDoc(
        doc(db, "users", uid),
        { ...profile, updatedAt: serverTimestamp() },
        { merge: true }
      );
      return;
    }
  }
  writeLocal(profile);
}

// ---------- localStorage fallback helpers ----------

function readLocal(): UserProfile {
  if (typeof window === "undefined") return defaultProfile;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? { ...defaultProfile, ...JSON.parse(stored) } : defaultProfile;
}

function writeLocal(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}
