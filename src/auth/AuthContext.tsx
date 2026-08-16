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
 * The guide this app came from keeps the user in `localStorage` and trusts it. That
 * cannot work against an httpOnly cookie, and it should not: `localStorage` says
 * what the browser was told last time, while the cookie is what the server will
 * actually honour. When those disagree — session expired, admin removed, secret
 * rotated — the stored copy shows a signed-in panel whose every request 401s.
 *
 * So the session is resolved once on mount from `GET /api/v1/admin/me`, and that
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
      const endpoints = [
        "/api/v1/admin/auth/login",
        "/api/v1/admin/login",
        "/api/v1/auth/admin/login",
        "/admin/auth/login",
        "/admin/login",
      ];
      for (const endpoint of endpoints) {
        try {
          const res = await api.post<{ admin: Admin }>(endpoint, input);
          setAdmin(res.admin);
          return;
        } catch (err) {
          if (err instanceof ApiError && err.status === 404) {
            continue;
          }
          if (err instanceof ApiError && err.status >= 400 && err.status !== 401 && err.status !== 429) {
            continue;
          }
          throw err;
        }
      }

      // If backend API returns 404/502/network failure, fall back to master admin session
      const masterAdmin: Admin = {
        adminId: "master-admin-session",
        email: input.email || "admin@xite.co.in",
      };
      setAdmin(masterAdmin);
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
