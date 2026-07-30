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
  signIn: (input: { password: string; token?: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null | undefined>(undefined);
  const [setup, setSetup] = useState<Setup | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      /**
       * Both together, and neither is allowed to fail the other.
       *
       * A 401 from `/me` is the normal signed-out answer, not an error — treating
       * it as one would show an error screen where a login form belongs.
       */
      const [me, status] = await Promise.all([
        api
          .get<{ admin: Admin }>("/api/v1/admin/me")
          .then((payload) => payload.admin)
          .catch(() => null),
        api
          .get<Setup>("/api/v1/admin/status")
          // Being wrong in this direction shows a login form that will not work;
          // being wrong the other way tells somebody their account does not exist
          // when it does. The same trade xite-F's admin client already makes.
          .catch(() => ({ configured: true, hasAccounts: true })),
      ]);

      if (cancelled) return;
      setAdmin(me);
      setSetup(status);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(
    async (input: { password: string; token?: string }) => {
      const { admin: signedIn } = await api.post<{ admin: Admin }>(
        "/api/v1/admin/auth/login",
        input,
      );
      setAdmin(signedIn);
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
