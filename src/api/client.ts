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
 * multiple bases (api.xite.co.in, localhost:4000) turned legitimate 404s into
 * CORS errors and "Failed to fetch" on the UI.
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
    throw new ApiError(errMessage, response.status);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new ApiError("Request timed out after 15 seconds", 408);
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
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
