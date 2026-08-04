import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";

import { useAuth } from "@/auth/AuthContext";

/**
 * The frame every signed-in screen sits in.
 *
 * One layout component rather than a header per page, so the nav cannot end up
 * saying different things on different screens — which is how a panel starts
 * feeling untrustworthy.
 */
export function Shell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { admin, signOut } = useAuth();

  return (
    <div className="min-h-svh bg-night">
      <div className="mx-auto w-full max-w-[1200px] px-5 py-10 sm:px-8">
        <header className="flex flex-wrap items-baseline justify-between gap-4 border-b border-night-line pb-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-chalk-dim/50">
              Super Admin
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-chalk">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-5">
            {/*
              One tab, because one screen exists. The access-request endpoints are
              built and a Requests tab belongs here, but linking to a route that
              renders nothing is worse than not offering it yet.
            */}
            <nav className="flex items-center gap-5 text-xs">
              <Tab to="/templates">Templates</Tab>
              <Tab to="/default-website">Default Website</Tab>
              <Tab to="/users">Users</Tab>
              <Tab to="/requests">Requests</Tab>
            </nav>
            {admin ? (
              <div className="flex items-center gap-3 text-xs text-chalk-dim/60">
                <span className="hidden sm:inline">{admin.email}</span>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="rounded-full border border-night-line px-3 py-1.5 font-semibold text-chalk-dim transition-colors hover:border-chalk-dim/40 hover:text-chalk"
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <div className="mt-8 pb-16">{children}</div>
      </div>
    </div>
  );
}

function Tab({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `font-semibold transition-colors ${
          isActive ? "text-chalk" : "text-chalk-dim/50 hover:text-chalk-dim"
        }`
      }
    >
      {children}
    </NavLink>
  );
}
