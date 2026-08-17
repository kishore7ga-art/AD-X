import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ApiError, api } from "@/api/client";

/**
 * Who is signed in, asked of the API rather than remembered here.
 *
 * The session is resolved once on mount from `GET /api/v1/admin/me`, and that
 * answer is the only source of truth. Nothing about the session is persisted
 * client-side, because nothing needs to be: the cookie already survives a reload.
 */

export type Admin = { adminId: string; email: string };

/** Whether the panel can serve at all, read before the login form is drawn. */
export type Setup = { configured: boolean; hasAccounts: boolean };

type AuthState = {
  /** `undefined` while resolving, `null` for signed out. */
  admin: Admin | null | undefined;
  setup: Setup | null;
  signIn: (input: { email?: string; password: string; token?: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null | undefined>(undefined);
  const [setup, setSetup] = useState<Setup | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      let me: Admin | null = null;
      let status: Setup | null = { configured: true, hasAccounts: true };

      try {
        const res = await api.get<{ admin: Admin }>("/api/v1/admin/me");
        if (res && res.admin) me = res.admin;
      } catch {}

      try {
        const res = await api.get<Setup>("/api/v1/admin/status");
        if (res) status = res;
      } catch {}

      if (cancelled) return;
      setAdmin(me);
      setSetup(status);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(
    async (input: { email?: string; password: string; token?: string }) => {
      // The backend registers POST on both "/login" and "/auth/login" under
      // the adminRouter mounted at /api/v1/admin. Try them in order — the
      // second is the canonical one, the first is a legacy alias.
      const endpoints = [
        "/api/v1/admin/auth/login",
        "/api/v1/admin/login",
      ];
      let lastErr: unknown;
      for (const endpoint of endpoints) {
        try {
          const res = await api.post<{ admin: Admin }>(endpoint, input);
          setAdmin(res.admin);
          return;
        } catch (err) {
          lastErr = err;
          // Only retry on 404 (route not found) — any other error is real
          if (err instanceof ApiError && err.status === 404) {
            continue;
          }
          throw err;
        }
      }
      throw lastErr ?? new ApiError("Login failed", 0);
    },
    [],
  );

  const signOut = useCallback(async () => {
    // Clears the cookie server-side; a failure still signs this tab out, because
    // leaving somebody looking at a panel they asked to leave is worse.
    await api.post("/api/v1/admin/auth/logout").catch(() => undefined);
    setAdmin(null);
  }, []);

  const value = useMemo(
    () => ({ admin, setup, signIn, signOut }),
    [admin, setup, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

/** Whether an error means "your session is gone", for callers that must re-auth. */
export const isUnauthorized = (cause: unknown) =>
  cause instanceof ApiError && cause.status === 401;
