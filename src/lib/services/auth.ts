import { firebaseEnabled, getFirebaseAuth } from "@/lib/firebase/client";
import { onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";

const LOCAL_UID_KEY = "swiply-local-uid";

/**
 * Returns a stable user id.
 * - If Firebase is enabled, ensures an anonymous Firebase user and returns its uid.
 * - Otherwise, generates and persists a local uid in localStorage.
 *
 * All user-scoped data (likes, profile) should be keyed by this id.
 */
export async function getCurrentUserId(): Promise<string> {
  if (!firebaseEnabled) return getOrCreateLocalUid();

  const auth = getFirebaseAuth();
  if (!auth) return getOrCreateLocalUid();

  const existing = auth.currentUser;
  if (existing) return existing.uid;

  // Wait for the auth state to settle, then sign in anonymously if needed.
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
