import { API_BASE } from "@/env";

/**
 * Every call this app makes to the API.
 *
 * `credentials: "include"` on all of them, which is the whole reason this is one
 * function rather than `fetch` at each call site. The admin session is an httpOnly
 * cookie the API sets — there is no token for this app to hold, attach, or
 * accidentally forget — so the only thing a request has to get right is asking the
 * browser to send the cookie. One place to get it right.
 *
 * Sends to exactly one API_BASE — no multi-base fallback. The old cascade through
 * multiple bases (api.webxite.org, localhost:4000) turned legitimate 404s into
 * CORS errors and "Failed to fetch" on the UI.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /**
     * How long the API says to wait, from its `Retry-After` header.
     *
     * Carried here rather than guessed at the call site. The login screen used
     * to hardcode a five-minute countdown against a fifteen-minute bucket, so
     * its timer expired, the button re-enabled, and the next attempt was
     * refused again — which reads as a broken panel rather than a lockout.
     */
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** `Retry-After` as whole seconds, for the two forms the spec allows. */
function retryAfter(response: Response): number | undefined {
  const header = response.headers.get("Retry-After");
  if (!header) return undefined;

  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds);

  // The other legal form is an HTTP date.
  const at = Date.parse(header);
  if (!Number.isNaN(at)) return Math.max(0, Math.ceil((at - Date.now()) / 1000));

  return undefined;
}

/**
 * Told when any request comes back 401.
 *
 * The admin session is an eight-hour cookie, so it expires while somebody is
 * using the panel — and nothing noticed. `ProtectedRoute` resolves the session
 * once on mount and never again, so an expired session left the operator on a
 * fully-drawn panel where every button failed with a different message
 * ("Failed to load templates", "Failed to delete template") and nothing ever
 * suggested signing in again.
 *
 * A 401 is not a per-screen error; it is a fact about the whole tab. One
 * handler, registered by `AuthProvider`, so every present and future call site
 * is covered without any of them knowing about it.
 */
type UnauthorizedHandler = () => void;

let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

/**
 * Signing in with the wrong password is also a 401, and it must not fire the
 * handler: there is no session to end, and doing so would clear the form's
 * state underneath the person typing in it.
 */
const AUTH_PATHS = ["/api/v1/admin/auth/login", "/api/v1/admin/login"];

/** The API answers every failure as `{ error: string }`. */
async function readError(response: Response): Promise<string> {
  const payload = (await response.json().catch(() => null)) as Record<string, any> | null;
  if (!payload) return `Request failed (${response.status})`;
  if (typeof payload.error === "string") return payload.error;
  if (payload.error && typeof payload.error === "object" && typeof payload.error.message === "string") {
    return payload.error.message;
  }
  if (typeof payload.message === "string") return payload.message;
  return `Request failed (${response.status})`;
}

async function request<T>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: init?.method ?? "GET",
      credentials: "include",
      signal: controller.signal,
      ...(init?.body === undefined
        ? {}
        : {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(init.body),
          }),
    });

    if (response.ok) {
      if (response.status === 204) return undefined as T;
      return (await response.json()) as T;
    }

    const errMessage = await readError(response);

    if (response.status === 401 && !AUTH_PATHS.includes(path)) {
      onUnauthorized?.();
    }

    throw new ApiError(errMessage, response.status, retryAfter(response));
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new ApiError("Request timed out after 15 seconds", 408);
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}

/**
 * A multipart upload.
 *
 * Here rather than as a bare `fetch` at the call site, which is where it was:
 * the template uploader built its own request and so re-implemented the two
 * things this module exists to get right — `credentials: "include"`, without
 * which the admin cookie is not sent, and reading `{ error }` out of a failure
 * so the operator sees the API's own message rather than a status code.
 *
 * `Content-Type` is deliberately unset: the browser must add the multipart
 * boundary, and setting it by hand produces a body the server cannot parse.
 */
async function postForm<T>(path: string, body: FormData): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    body,
  });

  if (response.ok) {
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  if (response.status === 401) onUnauthorized?.();

  throw new ApiError(await readError(response), response.status, retryAfter(response));
}

export const api = {
  postForm,
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
