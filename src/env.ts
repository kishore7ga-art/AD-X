/**
 * Where the API is.
 *
 * xite-F can leave its equivalent unset and fall back to `""`, because there
 * the API is same-origin — a relative `/api/v1/...` reaches the right place.
 * This app has no such fallback: an empty base here means the request goes to
 * the Vite dev server, which answers with `index.html`, and the console shows a
 * JSON parse error rather than anything resembling the real cause.
 *
 * So it throws at import time instead. A blank screen with one clear message
 * beats a login form that fails for a reason it cannot describe.
 */
const raw = import.meta.env.VITE_API_BASE_URL?.trim();

const resolvedBase = (() => {
  if (raw) return raw;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:4000";
    }
    if (host.includes("meetkishore.in")) {
      return "https://api.meetkishore.in";
    }
    if (host.includes("xite.co.in")) {
      return "https://api.xite.co.in";
    }
    return window.location.origin;
  }
  return "http://localhost:4000";
})();

/** Trailing slash trimmed, so `${API_BASE}/api/v1/...` never doubles up. */
export const API_BASE = resolvedBase.replace(/\/+$/, "");

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

