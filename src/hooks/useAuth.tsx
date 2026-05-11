import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  AuthSession,
  UserRole,
  clearStoredSession,
  getStoredSession,
  refreshSession,
  sendPasswordReset,
  signInWithPassword,
  signOut,
} from "@/lib/supabaseAuth";

interface AuthContextValue {
  session: AuthSession | null;
  loading: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  signIn: (email: string, password: string, fallbackRole: UserRole) => Promise<AuthSession>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredSession();

    if (!stored) {
      setLoading(false);
      return;
    }

    const shouldRefresh = stored.expires_at ? stored.expires_at - Math.floor(Date.now() / 1000) < 300 : false;

    if (!shouldRefresh) {
      setSession(stored);
      setLoading(false);
      return;
    }

    refreshSession(stored)
      .then(setSession)
      .catch(() => {
        clearStoredSession();
        setSession(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (email: string, password: string, fallbackRole: UserRole) => {
    const nextSession = await signInWithPassword(email, password, fallbackRole);
    setSession(nextSession);
    return nextSession;
  }, []);

  const logout = useCallback(async () => {
    await signOut(session);
    setSession(null);
  }, [session]);

  const resetPassword = useCallback((email: string) => sendPasswordReset(email), []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    loading,
    isAuthenticated: Boolean(session),
    role: session?.role ?? null,
    signIn,
    logout,
    resetPassword,
  }), [loading, logout, resetPassword, session, signIn]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
