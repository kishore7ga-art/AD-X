import { API_BASE } from "@/env";

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
  const payload = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return payload?.error ?? `Request failed (${response.status})`;
}

async function request<T>(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: init?.method ?? "GET",
      credentials: "include",
      ...(init?.body === undefined
        ? {}
        : {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(init.body),
          }),
    });
  } catch {
    /**
     * A blocked origin and an unreachable server are the same `TypeError` here —
     * the browser withholds which on purpose. Saying both is the honest version;
     * the connectivity screen this app opened with says where to look.
     */
    throw new ApiError(
      "Could not reach the API. It may be down, or this origin may not be in CORS_ORIGINS.",
      0,
    );
  }

  if (!response.ok) throw new ApiError(await readError(response), response.status);

  // 204 has no body, and `.json()` on an empty response throws.
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
