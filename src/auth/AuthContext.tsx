import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ApiError, api, setUnauthorizedHandler } from "@/api/client";

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
  /**
   * Set only when the API could not be reached at all.
   *
   * Distinct from `admin: null`, which means the API answered and said nobody is
   * signed in. Conflating the two is what made every backend outage present as
   * "you have been logged out": the panel bounced the admin to a login form that
   * could not possibly work, with no indication that the problem was the API
   * rather than their password.
   */
  transportError: string | null;
  retry: () => void;
  signIn: (input: { email?: string; password: string; token?: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null | undefined>(undefined);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [transportError, setTransportError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      let me: Admin | null = null;
      let status: Setup | null = null;
      let failure: string | null = null;

      /**
       * `GET /admin/me` answers 200 with `{admin: null}` when nobody is signed
       * in — being signed out is not an error. So the only way this throws is a
       * genuine transport failure: the API is down, DNS is wrong, or this origin
       * is not in `CORS_ORIGINS`. Each of those needs saying out loud.
       */
      try {
        const res = await api.get<{ admin: Admin | null }>("/api/v1/admin/me");
        me = res?.admin ?? null;
      } catch (cause) {
        failure = describe(cause);
      }

      // Only asked if the first call proved the API is reachable; a second
      // failing request adds nothing but another 15-second timeout.
      if (!failure) {
        try {
          const res = await api.get<Setup>("/api/v1/admin/status");
          if (res && typeof res.configured === "boolean") {
            status = { configured: res.configured, hasAccounts: Boolean(res.hasAccounts) };
          }
        } catch {
          // A status the API would not answer is a status we do not claim to
          // know. `null` renders no setup banner, which is right: the previous
          // version defaulted to `{configured: true, hasAccounts: true}` and so
          // hid the "not configured" warning on exactly the failure it exists
          // to explain.
          status = null;
        }
      }

      if (cancelled) return;
      setAdmin(failure ? null : me);
      setSetup(status);
      setTransportError(failure);
    })();

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  /**
   * Any 401, anywhere, ends the session in this tab.
   *
   * `ProtectedRoute` then redirects to the login screen with the current path
   * in `location.state`, so signing back in returns the operator to the page
   * they were on rather than to the top of the panel.
   */
  useEffect(() => {
    setUnauthorizedHandler(() => setAdmin(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  const retry = useCallback(() => {
    setAdmin(undefined);
    setTransportError(null);
    setAttempt((n) => n + 1);
  }, []);

  /**
   * Sign in.
   *
   * One endpoint. This used to try `/admin/auth/login` and then fall back to
   * `/admin/login` on a 404 — but the API registers both on the same router
   * (`adminRouter.post(["/login", "/auth/login"], …)`), so the fallback could
   * never fire. What it did do was send the password a second time on some
   * failure paths, and charge a second attempt against a rate-limit bucket that
   * allows five in fifteen minutes.
   */
  const signIn = useCallback(
    async (input: { email?: string; password: string; token?: string }) => {
      const res = await api.post<{ admin: Admin }>("/api/v1/admin/auth/login", input);
      setTransportError(null);
      setAdmin(res.admin);
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
    () => ({ admin, setup, transportError, retry, signIn, signOut }),
    [admin, setup, transportError, retry, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * A transport failure, in terms an operator can act on.
 *
 * The browser reports a blocked origin and an unreachable host identically —
 * "Failed to fetch" — so the message names both possibilities rather than
 * guessing, and names the origin that would have to be allowed.
 */
function describe(cause: unknown): string {
  if (cause instanceof ApiError && cause.status === 408) {
    return "The API did not respond within 15 seconds.";
  }
  if (cause instanceof ApiError && cause.status > 0) {
    return `The API answered ${cause.status}: ${cause.message}`;
  }
  const origin = typeof window !== "undefined" ? window.location.origin : "this origin";
  return (
    "Could not reach the API. It may be down, or this origin may not be listed " +
    `in the API's CORS_ORIGINS — it needs ${origin} verbatim.`
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
