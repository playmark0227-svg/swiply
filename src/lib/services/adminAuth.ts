/**
 * Admin gate for the ViFight ops console.
 *
 * Demo-grade only: holds a per-browser SHA-256 + salt password hash in
 * localStorage. First visit asks the operator to set a password; subsequent
 * visits prompt for it. For real production this MUST move to a backend
 * with proper SSO / IAM (Firebase Custom Claims, Auth0, IDaaS, etc.).
 */

const KEY = "swiply-admin-credential";
const SESSION_KEY = "swiply-admin-session";

interface StoredCredential {
  salt: string;
  hash: string;
}

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function readCred(): StoredCredential | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredCredential;
  } catch {
    return null;
  }
}

export function isAdminEnrolled(): boolean {
  return !!readCred();
}

export async function enrollAdmin(password: string): Promise<void> {
  if (password.length < 6) {
    throw new Error("パスワードは6文字以上で設定してください");
  }
  const salt = crypto.randomUUID();
  const hash = await sha256(`${salt}:${password}`);
  localStorage.setItem(KEY, JSON.stringify({ salt, hash }));
  startSession();
}

export async function loginAdmin(password: string): Promise<void> {
  const cred = readCred();
  if (!cred) throw new Error("管理者パスワードが未設定です");
  const hash = await sha256(`${cred.salt}:${password}`);
  if (hash !== cred.hash) throw new Error("パスワードが違います");
  startSession();
}

export function logoutAdmin(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await loginAdmin(currentPassword);
  await enrollAdmin(newPassword);
}

export function resetAdminCredential(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

function startSession(): void {
  sessionStorage.setItem(SESSION_KEY, "1");
}
