import { firebaseEnabled, getFirebaseAuth } from "@/lib/firebase/client";
import type { User } from "firebase/auth";

const LOCAL_UID_KEY = "swiply-local-uid";

/**
 * Returns a stable user id.
 * - If Firebase is enabled, ensures an anonymous Firebase user and returns its uid.
 * - Otherwise, generates and persists a local uid in localStorage.
 */
export async function getCurrentUserId(): Promise<string> {
  if (!firebaseEnabled || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return getOrCreateLocalUid();

  const auth = await getFirebaseAuth();
  if (!auth) return getOrCreateLocalUid();

  const existing = auth.currentUser;
  if (existing) return existing.uid;

  const { onAuthStateChanged, signInAnonymously } = await import("firebase/auth");

  const user = await new Promise<User | null>((resolve) => {
    const unsub = onAuthStateChanged(auth, (u) => {
      unsub();
      resolve(u);
    });
  });

  if (user) return user.uid;

  const cred = await signInAnonymously(auth);
  return cred.user.uid;
}

function getOrCreateLocalUid(): string {
  if (typeof window === "undefined") return "anonymous";
  let uid = localStorage.getItem(LOCAL_UID_KEY);
  if (!uid) {
    uid = `local-${crypto.randomUUID()}`;
    localStorage.setItem(LOCAL_UID_KEY, uid);
  }
  return uid;
}
