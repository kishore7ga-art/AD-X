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
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    if (!raw || raw.includes("localhost") || raw.includes("127.0.0.1")) {
      return "https://api.xite.co.in";
    }
  }
  return raw || "http://localhost:4000";
})();

/** Trailing slash trimmed, so `${API_BASE}/api/v1/...` never doubles up. */
export const API_BASE = resolvedBase.replace(/\/+$/, "");
