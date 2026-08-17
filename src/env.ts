/**
 * Where the API is.
 *
 * Resolves to exactly ONE API base URL based on the current hostname.
 * No multi-base fallback — that caused cascading CORS errors when the
 * primary API returned a legitimate 404 and the client tried dead/wrong
 * secondary hosts like api.xite.co.in or localhost:4000.
 */
const raw = import.meta.env.VITE_API_BASE_URL?.trim();

function resolveApiBase(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("meetkishore.in")) {
      return "https://api.meetkishore.in";
    }
    if (host.includes("xite.co.in")) {
      return "https://api.xite.co.in";
    }
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:4000";
    }
  }
  if (raw) return raw.replace(/\/+$/, "");
  return "http://localhost:4000";
}

/** Single API base URL — no fallback list. */
export const API_BASE = resolveApiBase();

const rawStudio = import.meta.env.VITE_STUDIO_BASE_URL?.trim();
const resolvedStudio = (() => {
  if (rawStudio) return rawStudio;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:3000";
    }
    if (host.includes("meetkishore.in")) {
      return "https://meetkishore.in";
    }
    if (host.includes("xite.co.in")) {
      return "https://xite.co.in";
    }
    return window.location.origin.replace(/^https?:\/\/admin\./, "https://");
  }
  return "http://localhost:3000";
})();

export const STUDIO_BASE = resolvedStudio.replace(/\/+$/, "");
