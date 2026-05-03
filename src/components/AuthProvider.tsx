"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  type AuthSession,
  signIn as svcSignIn,
  signOut as svcSignOut,
  signUp as svcSignUp,
  setSession as svcSetSession,
  subscribeAuth,
} from "@/lib/services/userAuth";

interface AuthContextValue {
  session: AuthSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthSession>;
  signUp: (email: string, password: string, displayName: string) => Promise<AuthSession>;
  signOut: () => Promise<void>;
  /** Adopt an externally-issued session (e.g. from LINE Login). */
  setSession: (session: AuthSession) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // subscribeAuth invokes the handler synchronously with the current
    // session, so we don't need a separate setSession call before it.
    const unsub = subscribeAuth((s) => {
      setSession(s);
      setLoading(false);
    });
    return unsub;
  }, []);

  async function signIn(email: string, password: string) {
    const s = await svcSignIn(email, password);
    setSession(s);
    return s;
  }
  async function signUp(email: string, password: string, displayName: string) {
    const s = await svcSignUp(email, password, displayName);
    setSession(s);
    return s;
  }
  async function signOut() {
    await svcSignOut();
    setSession(null);
  }
  function adoptSession(s: AuthSession) {
    svcSetSession(s);
    setSession(s);
  }

  return (
    <AuthContext.Provider
      value={{ session, loading, signIn, signUp, signOut, setSession: adoptSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
