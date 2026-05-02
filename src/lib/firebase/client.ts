/**
 * Firebase configuration is read from NEXT_PUBLIC_FIREBASE_* env vars.
 * If any required key is missing, `firebaseEnabled` is false and all
 * services fall back to localStorage / static data.
 *
 * IMPORTANT: every firebase module is dynamically imported behind the
 * `firebaseEnabled` flag. When the env vars are absent the constant is
 * statically `false` and the bundler dead-code-eliminates the entire
 * firebase tree (~150KB+ saved on the static GitHub Pages build).
 */

import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseEnabled = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

async function ensureApp(): Promise<FirebaseApp | null> {
  if (!firebaseEnabled || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return null;
  if (app) return app;
  const { initializeApp, getApps, getApp } = await import("firebase/app");
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return app;
}

export async function getFirebaseAuth(): Promise<Auth | null> {
  if (!firebaseEnabled || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return null;
  if (authInstance) return authInstance;
  const a = await ensureApp();
  if (!a) return null;
  const { getAuth } = await import("firebase/auth");
  authInstance = getAuth(a);
  return authInstance;
}

export async function getDb(): Promise<Firestore | null> {
  if (!firebaseEnabled || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return null;
  if (dbInstance) return dbInstance;
  const a = await ensureApp();
  if (!a) return null;
  const { getFirestore } = await import("firebase/firestore");
  dbInstance = getFirestore(a);
  return dbInstance;
}

export async function getFbStorage(): Promise<FirebaseStorage | null> {
  if (!firebaseEnabled || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return null;
  if (storageInstance) return storageInstance;
  const a = await ensureApp();
  if (!a) return null;
  const { getStorage } = await import("firebase/storage");
  storageInstance = getStorage(a);
  return storageInstance;
}
