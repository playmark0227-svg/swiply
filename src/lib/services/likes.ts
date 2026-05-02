import { firebaseEnabled, getDb } from "@/lib/firebase/client";
import { getCurrentUserId } from "@/lib/services/auth";

const STORAGE_KEY = "swiply-likes";

/**
 * Likes service.
 *
 * Storage layout (Firestore):
 *   users/{userId}/likes/{jobId} → { jobId, createdAt }
 *
 * Fallback storage (localStorage):
 *   key "swiply-likes" → string[] of jobIds
 */

export async function getLikedJobIds(): Promise<string[]> {
  if (firebaseEnabled && process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    const db = await getDb();
    if (db) {
      const { collection, getDocs } = await import("firebase/firestore");
      const uid = await getCurrentUserId();
      const snap = await getDocs(collection(db, "users", uid, "likes"));
      return snap.docs.map((d) => d.id);
    }
  }
  return readLocal();
}

export async function addLike(jobId: string): Promise<void> {
  if (firebaseEnabled && process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    const db = await getDb();
    if (db) {
      const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
      const uid = await getCurrentUserId();
      await setDoc(doc(db, "users", uid, "likes", jobId), {
        jobId,
        createdAt: serverTimestamp(),
      });
      return;
    }
  }
  const likes = readLocal();
  if (!likes.includes(jobId)) {
    likes.push(jobId);
    writeLocal(likes);
  }
}

export async function removeLike(jobId: string): Promise<void> {
  if (firebaseEnabled && process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    const db = await getDb();
    if (db) {
      const { doc, deleteDoc } = await import("firebase/firestore");
      const uid = await getCurrentUserId();
      await deleteDoc(doc(db, "users", uid, "likes", jobId));
      return;
    }
  }
  writeLocal(readLocal().filter((id) => id !== jobId));
}

export async function isLiked(jobId: string): Promise<boolean> {
  const ids = await getLikedJobIds();
  return ids.includes(jobId);
}

// ---------- localStorage fallback helpers ----------

function readLocal(): string[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function writeLocal(ids: string[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}
