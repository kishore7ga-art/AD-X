import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

import { useAuth } from "@/auth/AuthContext";

/**
 * A route guard, and deliberately not a security boundary.
 *
 * Worth being explicit about, because the guide it comes from is not: this only
 * decides which screen to draw. Every admin endpoint checks the cookie itself via
 * `requireAdmin`, so bypassing this in devtools yields a page whose every request
 * 401s rather than access to anything. The frontend cannot be the check — it runs
 * on the visitor's machine.
 *
 * The three states are genuinely different and only one of them is a redirect:
 * `undefined` means the session is still being resolved, and rendering the login
 * form during that flash would bounce a signed-in admin to a form they do not need.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { admin } = useAuth();
  const location = useLocation();

  if (admin === undefined) return <Resolving />;

  if (!admin) {
    // Where they were headed, so signing in lands there instead of at the top.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

function Resolving() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-lavender">
      <p className="text-sm text-chalk">Checking your session…</p>
    </div>
  );
}
