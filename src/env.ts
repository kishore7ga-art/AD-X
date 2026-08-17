/**
 * Where the API is.
 *
 * Resolves dynamically based on domain:
 * - *.xite.co.in -> https://api.xite.co.in
 * - *.meetkishore.in -> https://api.meetkishore.in
 * - localhost -> http://localhost:4000
 * Primary default is https://api.xite.co.in
 */
const raw = import.meta.env.VITE_API_BASE_URL?.trim();

function resolveApiBase(): string {
  if (raw) return raw.replace(/\/+$/, "");
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
  return "https://api.xite.co.in";
}

/** Single API base URL. */
export const API_BASE = resolveApiBase();

const rawStudio = import.meta.env.VITE_STUDIO_BASE_URL?.trim();
const resolvedStudio = (() => {
  if (rawStudio) return rawStudio;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("meetkishore.in")) {
      return "https://meetkishore.in";
    }
    if (host.includes("xite.co.in")) {
      return "https://xite.co.in";
    }
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:3000";
    }
  }
  return "https://xite.co.in";
})();

export const STUDIO_BASE = resolvedStudio.replace(/\/+$/, "");
