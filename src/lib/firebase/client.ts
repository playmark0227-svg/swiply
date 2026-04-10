import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

/**
 * Firebase configuration is read from NEXT_PUBLIC_FIREBASE_* env vars.
 * If any required key is missing, `firebaseEnabled` is false and all
 * services fall back to localStorage / static data.
 *
 * Set the env vars in `.env.local` (see `.env.local.example`) to enable.
 */
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

function ensureApp(): FirebaseApp | null {
  if (!firebaseEnabled) return null;
  if (app) return app;
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return app;
}

export function getFirebaseAuth(): Auth | null {
  if (!firebaseEnabled) return null;
  if (authInstance) return authInstance;
  const a = ensureApp();
  if (!a) return null;
  authInstance = getAuth(a);
  return authInstance;
}

export function getDb(): Firestore | null {
  if (!firebaseEnabled) return null;
  if (dbInstance) return dbInstance;
  const a = ensureApp();
  if (!a) return null;
  dbInstance = getFirestore(a);
  return dbInstance;
}

export function getFbStorage(): FirebaseStorage | null {
  if (!firebaseEnabled) return null;
  if (storageInstance) return storageInstance;
  const a = ensureApp();
  if (!a) return null;
  storageInstance = getStorage(a);
  return storageInstance;
}
