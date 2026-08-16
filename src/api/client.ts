import { API_BASE, API_BASES } from "@/env";

/**
 * Every call this app makes to the API.
 *
 * `credentials: "include"` on all of them, which is the whole reason this is one
 * function rather than `fetch` at each call site. The admin session is an httpOnly
 * cookie the API sets — there is no token for this app to hold, attach, or
 * accidentally forget — so the only thing a request has to get right is asking the
 * browser to send the cookie. One place to get it right.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

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
  let lastError: Error | null = null;
  const bases = API_BASES.length > 0 ? API_BASES : [API_BASE];

  for (const base of bases) {
    try {
      const response = await fetch(`${base}${path}`, {
        method: init?.method ?? "GET",
        credentials: "include",
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
      lastError = new ApiError(errMessage, response.status);

      // If status is not 404 or 500+, break and throw immediately
      if (response.status !== 404 && response.status < 500) {
        throw lastError;
      }
    } catch (err) {
      if (err instanceof ApiError && err.status !== 404 && err.status < 500) {
        throw err;
      }
      lastError = err instanceof Error ? err : new ApiError(`Could not reach ${base}`, 0);
    }
  }

  throw lastError ?? new ApiError(`Could not reach API endpoint`, 0);
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
