/**
 * Where the API is.
 *
 * Hardcoded to api.meetkishore.in in production.
 * Falls back to localhost:4000 for local development.
 */
const raw = import.meta.env.VITE_API_BASE_URL?.trim();

function resolveApiBase(): string {
  if (raw) return raw.replace(/\/+$/, "");
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:4000";
    }
  }
  // All production traffic goes to api.meetkishore.in
  return "https://api.meetkishore.in";
}

/** Single API base URL. */
export const API_BASE = resolveApiBase();

const rawStudio = import.meta.env.VITE_STUDIO_BASE_URL?.trim();
const resolvedStudio = (() => {
  if (rawStudio) return rawStudio;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:3000";
    }
  }
  return "https://meetkishore.in";
})();

export const STUDIO_BASE = resolvedStudio.replace(/\/+$/, "");
