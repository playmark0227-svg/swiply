/**
 * Lightweight account service.
 *
 * - When Firebase Auth is enabled, delegates to Firebase email/password auth.
 * - Otherwise falls back to a localStorage-backed mock so the static export
 *   on GitHub Pages still demonstrates the full UX.
 *
 * NOTE: the localStorage fallback hashes passwords with SHA-256 + a per-user
 * salt. This is a demo-grade implementation; real production auth must use a
 * proper backend (Firebase Auth, NextAuth + DB, etc.).
 */

import { firebaseEnabled, getFirebaseAuth } from "@/lib/firebase/client";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";

const ACCOUNTS_KEY = "swiply-accounts";
const SESSION_KEY = "swiply-session";

export interface Account {
  uid: string;
  email: string;
  displayName: string;
  createdAt: string;
  // demo only — never store plaintext in real systems
  passwordHash: string;
  salt: string;
}

export interface AuthSession {
  uid: string;
  email: string;
  displayName: string;
}

interface StoredAccounts {
  [email: string]: Account;
}

// ---------- Public API ----------

export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<AuthSession> {
  email = email.trim().toLowerCase();
  if (!email || !password) throw new Error("メールアドレスとパスワードを入力してください");
  if (password.length < 6) throw new Error("パスワードは6文字以上で設定してください");

  if (firebaseEnabled) {
    const auth = getFirebaseAuth();
    if (auth) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const session: AuthSession = {
        uid: cred.user.uid,
        email: cred.user.email ?? email,
        displayName,
      };
      writeSession(session);
      return session;
    }
  }

  // ---- localStorage fallback ----
  const accounts = readAccounts();
  if (accounts[email]) throw new Error("このメールアドレスはすでに登録されています");
  const salt = crypto.randomUUID();
  const passwordHash = await hashPassword(password, salt);
  const account: Account = {
    uid: `local-${crypto.randomUUID()}`,
    email,
    displayName,
    createdAt: new Date().toISOString(),
    passwordHash,
    salt,
  };
  accounts[email] = account;
  writeAccounts(accounts);
  const session: AuthSession = { uid: account.uid, email, displayName };
  writeSession(session);
  return session;
}

export async function signIn(email: string, password: string): Promise<AuthSession> {
  email = email.trim().toLowerCase();
  if (!email || !password) throw new Error("メールアドレスとパスワードを入力してください");

  if (firebaseEnabled) {
    const auth = getFirebaseAuth();
    if (auth) {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const session: AuthSession = {
        uid: cred.user.uid,
        email: cred.user.email ?? email,
        displayName: cred.user.displayName ?? email.split("@")[0],
      };
      writeSession(session);
      return session;
    }
  }

  const accounts = readAccounts();
  const account = accounts[email];
  if (!account) throw new Error("メールアドレスまたはパスワードが正しくありません");
  const hash = await hashPassword(password, account.salt);
  if (hash !== account.passwordHash) {
    throw new Error("メールアドレスまたはパスワードが正しくありません");
  }
  const session: AuthSession = {
    uid: account.uid,
    email: account.email,
    displayName: account.displayName,
  };
  writeSession(session);
  return session;
}

export async function signOut(): Promise<void> {
  if (firebaseEnabled) {
    const auth = getFirebaseAuth();
    if (auth) await fbSignOut(auth);
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem(SESSION_KEY);
  }
}

/**
 * Read current session synchronously from localStorage. Use inside React
 * effects when you don't need to wait for Firebase to settle.
 */
/**
 * Admin: list all locally-registered accounts (passwordHash/salt stripped).
 * Only meaningful for the localStorage fallback — Firebase users live in
 * Firebase Auth and aren't enumerable from the client.
 */
export function getLocalAccounts(): Array<Pick<Account, "uid" | "email" | "displayName" | "createdAt">> {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const obj = JSON.parse(raw) as StoredAccounts;
    return Object.values(obj).map(({ uid, email, displayName, createdAt }) => ({
      uid,
      email,
      displayName,
      createdAt,
    }));
  } catch {
    return [];
  }
}

export function getCurrentSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

/**
 * Subscribe to auth state. Calls handler immediately with current session,
 * then again whenever it changes.
 */
export function subscribeAuth(handler: (s: AuthSession | null) => void): () => void {
  // Immediate.
  handler(getCurrentSession());

  if (firebaseEnabled) {
    const auth = getFirebaseAuth();
    if (auth) {
      return onAuthStateChanged(auth, (u: User | null) => {
        if (u) {
          const s: AuthSession = {
            uid: u.uid,
            email: u.email ?? "",
            displayName: u.displayName ?? (u.email?.split("@")[0] ?? "ユーザー"),
          };
          writeSession(s);
          handler(s);
        } else {
          handler(null);
        }
      });
    }
  }

  // localStorage fallback: listen for storage events from other tabs.
  function onStorage(e: StorageEvent) {
    if (e.key === SESSION_KEY) handler(getCurrentSession());
  }
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }
  return () => {};
}

// ---------- helpers ----------

async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder().encode(`${salt}:${password}`);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function readAccounts(): StoredAccounts {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(ACCOUNTS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as StoredAccounts;
  } catch {
    return {};
  }
}

function writeAccounts(a: StoredAccounts): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(a));
}

function writeSession(s: AuthSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}
