/**
 * Where the API is.
 *
 * Production API Base: https://api.webxite.org
 * Local Development Base: http://localhost:4000
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
  return "https://api.webxite.org";
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
  return "https://webxite.org";
})();

export const STUDIO_BASE = resolvedStudio.replace(/\/+$/, "");
