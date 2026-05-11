const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "") ?? "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

const AUTH_STORAGE_KEY = "meclones.supabase.auth";

export type UserRole = "admin" | "teacher" | "student" | "parent";

export interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: SupabaseUser;
  role: UserRole;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  user: SupabaseUser;
}

const validRoles: UserRole[] = ["admin", "teacher", "student", "parent"];

function assertSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase configuration. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Vercel/local environment.");
  }
}

function authHeaders(token?: string) {
  assertSupabaseConfig();
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${token ?? SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };
}

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && validRoles.includes(value as UserRole);
}

export function resolveUserRole(user: SupabaseUser, fallbackRole: UserRole = "student") {
  const metadataRole = user.app_metadata?.role ?? user.user_metadata?.role;
  return isUserRole(metadataRole) ? metadataRole : fallbackRole;
}

async function parseAuthResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload.error_description ?? payload.msg ?? payload.message ?? "Authentication request failed.";
    throw new Error(message);
  }

  return payload;
}

export function saveSession(session: AuthSession) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function getStoredSession(): AuthSession | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as AuthSession;
    if (!session.access_token || !session.user?.id || !isUserRole(session.role)) return null;
    return session;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function clearStoredSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function signInWithPassword(email: string, password: string, fallbackRole: UserRole) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email, password }),
  });
  const payload = await parseAuthResponse(response) as TokenResponse;
  const session: AuthSession = {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_at: payload.expires_in ? Math.floor(Date.now() / 1000) + payload.expires_in : undefined,
    user: payload.user,
    role: resolveUserRole(payload.user, fallbackRole),
  };
  saveSession(session);
  return session;
}

export async function refreshSession(session: AuthSession) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  const payload = await parseAuthResponse(response) as TokenResponse;
  const refreshed: AuthSession = {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_at: payload.expires_in ? Math.floor(Date.now() / 1000) + payload.expires_in : undefined,
    user: payload.user,
    role: resolveUserRole(payload.user, session.role),
  };
  saveSession(refreshed);
  return refreshed;
}

export async function signOut(session: AuthSession | null) {
  if (session?.access_token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: authHeaders(session.access_token),
    }).catch(() => undefined);
  }
  clearStoredSession();
}

export async function sendPasswordReset(email: string) {
  const redirectTo = `${window.location.origin}/login`;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email }),
  });
  await parseAuthResponse(response);
}
