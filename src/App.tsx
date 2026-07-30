import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "@/auth/AuthContext";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { Login } from "@/pages/Login";
import { TemplateEdit } from "@/pages/TemplateEdit";
import { Templates } from "@/pages/Templates";
import { Users } from "@/pages/Users";

/**
 * The panel's routes.
 *
 * `AuthProvider` sits above `BrowserRouter` so the session is resolved once for the
 * whole app rather than per navigation — the alternative is a `/admin/me` call every
 * time somebody clicks a tab, and a flash of the login screen each time it is in
 * flight.
 *
 * The connectivity probe this file used to hold has served its purpose: CORS and the
 * cookie round-trip are proven, and the real screens exercise the same path on every
 * request now. What it diagnosed lives on in `client.ts`, which reports a blocked
 * origin and an unreachable API as the one thing the browser will actually tell us.
 */
export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/templates"
            element={
              <ProtectedRoute>
                <Templates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/templates/:id"
            element={
              <ProtectedRoute>
                <TemplateEdit />
              </ProtectedRoute>
            }
          />
          {/* Templates is the landing screen because it is the only one built. */}
          <Route path="/" element={<Navigate to="/templates" replace />} />
          {/*
            Anything else, rather than a blank page. A wrong URL in an admin panel
            is nearly always a stale bookmark, and the useful answer is the screen
            that does exist.
          */}
          <Route path="*" element={<Navigate to="/templates" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
