/**
 * Admin gate for the ViFight ops console.
 *
 * Demo-grade only:
 * - A built-in default credential lets the operator log in immediately
 *   without enrolling. This is for development convenience on the static
 *   GitHub Pages demo only — for production this MUST move to a backend
 *   with proper SSO / IAM (Firebase Custom Claims, Auth0, IDaaS, etc.).
 * - When a custom credential has been set (via `enrollAdmin` or
 *   `changeAdminPassword`), the default is disabled in favour of it.
 * - The custom credential is stored as SHA-256 + per-install salt in
 *   localStorage.
 */

// ⚠ Public repo — change before serious production use.
const DEFAULT_EMAIL = "ayukun.0227@icloud.com";
const DEFAULT_PASSWORD = "ayumu0227";

const KEY = "swiply-admin-credential";
const SESSION_KEY = "swiply-admin-session";

interface StoredCredential {
  email: string;
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
    const parsed = JSON.parse(raw) as Partial<StoredCredential>;
    // Legacy credentials (pre-email-field rollout) are missing `email`.
    // Discard them so the new built-in defaults work without the operator
    // having to clear localStorage manually.
    if (!parsed.salt || !parsed.hash || !parsed.email) {
      localStorage.removeItem(KEY);
      return null;
    }
    return {
      email: parsed.email,
      salt: parsed.salt,
      hash: parsed.hash,
    };
  } catch {
    return null;
  }
}

/** Always true now — defaults exist out of the box. Kept for API parity. */
export function isAdminEnrolled(): boolean {
  return true;
}

/** Returns the email currently registered (custom override or default). */
export function getAdminEmail(): string {
  return readCred()?.email ?? DEFAULT_EMAIL;
}

/** Returns the default credentials so the login screen can hint at them. */
export function getDefaultAdminCredentials(): { email: string; password: string } {
  return { email: DEFAULT_EMAIL, password: DEFAULT_PASSWORD };
}

/**
 * Set or replace the admin credential. After this is called, the
 * built-in default no longer works — only the new email/password pair.
 */
export async function enrollAdmin(email: string, password: string): Promise<void> {
  email = email.trim().toLowerCase();
  if (!email) throw new Error("メールアドレスを入力してください");
  if (password.length < 6) {
    throw new Error("パスワードは6文字以上で設定してください");
  }
  const salt = crypto.randomUUID();
  const hash = await sha256(`${salt}:${password}`);
  localStorage.setItem(KEY, JSON.stringify({ email, salt, hash }));
  startSession();
}

export async function loginAdmin(email: string, password: string): Promise<void> {
  email = email.trim().toLowerCase();
  const cred = readCred();
  if (cred) {
    if (cred.email.toLowerCase() !== email) {
      throw new Error("メールアドレスまたはパスワードが違います");
    }
    const hash = await sha256(`${cred.salt}:${password}`);
    if (hash !== cred.hash) {
      throw new Error("メールアドレスまたはパスワードが違います");
    }
  } else {
    if (
      email !== DEFAULT_EMAIL.toLowerCase() ||
      password !== DEFAULT_PASSWORD
    ) {
      throw new Error("メールアドレスまたはパスワードが違います");
    }
  }
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
  newPassword: string,
  newEmail?: string
): Promise<void> {
  const email = readCred()?.email ?? DEFAULT_EMAIL;
  await loginAdmin(email, currentPassword);
  await enrollAdmin(newEmail ?? email, newPassword);
}

export function resetAdminCredential(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

function startSession(): void {
  sessionStorage.setItem(SESSION_KEY, "1");
}
