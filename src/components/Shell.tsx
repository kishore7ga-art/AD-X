import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";
import { Layers, Globe, Users as UsersIcon, Inbox, LogOut, Zap, Search } from "lucide-react";

import { useAuth } from "@/auth/AuthContext";

/**
 * The Studio's frame.
 *
 * A rail down the left and a bar across the top, over the dark surface defined
 * in `styles.css`. The horizontal tab strip this replaced put navigation,
 * branding, identity and sign-out on one crowded line, which capped the number
 * of destinations the product could ever have; a rail grows downwards for free.
 *
 * Chrome only. Every route, guard and handler is exactly as it was — the nav is
 * the same four `NavLink`s to the same paths, and sign-out calls the same
 * `signOut()`. Nothing here knows anything about data.
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
    <div className="min-h-screen text-chalk">
      <div className="flex min-h-screen">
        {/* ─── Rail ─────────────────────────────────────────────────────── */}
        <aside className="glass sticky top-0 hidden h-screen w-[236px] shrink-0 flex-col justify-between rounded-r-3xl px-4 py-6 lg:flex">
          <div>
            <div className="mb-8 flex items-center gap-2.5 px-2">
              <div className="accent-fill flex h-9 w-9 items-center justify-center rounded-xl">
                <Zap className="h-4.5 w-4.5" strokeWidth={2.5} />
              </div>
              <div className="leading-none">
                <span className="block text-sm font-extrabold tracking-tight text-chalk">XITE</span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-chalk-dim">
                  Super Admin
                </span>
              </div>
            </div>

            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-chalk-dim">
              Menu
            </p>
            <nav className="flex flex-col gap-1">
              <Rail to="/templates" icon={<Layers className="h-4 w-4" />}>
                Templates &amp; Sections
              </Rail>
              <Rail to="/default-website" icon={<Globe className="h-4 w-4" />}>
                Default Website
              </Rail>
              <Rail to="/users" icon={<UsersIcon className="h-4 w-4" />}>
                Users
              </Rail>
              <Rail to="/requests" icon={<Inbox className="h-4 w-4" />}>
                Requests
              </Rail>
            </nav>
          </div>

          {admin ? (
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold text-chalk-dim transition-colors duration-200 hover:bg-white/5 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          ) : null}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* ─── Top bar ────────────────────────────────────────────────── */}
          <header className="sticky top-0 z-40 px-4 pt-4 sm:px-6">
            <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
              <div className="min-w-0">
                <h1 className="truncate text-lg font-extrabold tracking-tight text-chalk">
                  {title || "Studio Portal"}
                </h1>
                <p className="text-[11px] font-medium text-chalk-dim">
                  Welcome back — manage templates, sites and access from one place
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="hidden items-center gap-2 rounded-xl border border-night-line bg-white/[0.03] px-3 py-2 md:flex">
                  <Search className="h-3.5 w-3.5 text-chalk-dim" />
                  <span className="text-[11px] font-medium text-chalk-dim">
                    Search within each page
                  </span>
                </div>

                {admin ? (
                  <div className="glass-raised flex items-center gap-2.5 rounded-xl px-3 py-1.5">
                    <div className="accent-fill flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-black">
                      {admin.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden leading-tight sm:block">
                      <span className="block max-w-[160px] truncate text-[11px] font-bold text-chalk">
                        {admin.email}
                      </span>
                      <span className="text-[10px] font-medium text-chalk-dim">Super Admin</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* The rail is hidden below lg; navigation has to survive that. */}
            <nav className="glass mt-3 flex items-center gap-1 overflow-x-auto rounded-2xl p-1.5 lg:hidden">
              <Rail to="/templates" icon={<Layers className="h-3.5 w-3.5" />} compact>
                Templates
              </Rail>
              <Rail to="/default-website" icon={<Globe className="h-3.5 w-3.5" />} compact>
                Website
              </Rail>
              <Rail to="/users" icon={<UsersIcon className="h-3.5 w-3.5" />} compact>
                Users
              </Rail>
              <Rail to="/requests" icon={<Inbox className="h-3.5 w-3.5" />} compact>
                Requests
              </Rail>
            </nav>
          </header>

          <main className="w-full flex-1 px-4 pb-20 pt-5 sm:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

function Rail({
  to,
  icon,
  children,
  compact = false,
}: {
  to: string;
  icon?: ReactNode;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex shrink-0 cursor-pointer items-center gap-2.5 rounded-xl font-bold transition-all duration-200 ${
          compact ? "px-3 py-2 text-[11px]" : "px-3 py-2.5 text-xs"
        } ${
          isActive
            ? "accent-fill"
            : "text-chalk-dim hover:bg-white/5 hover:text-chalk"
        }`
      }
    >
      {icon}
      <span className="whitespace-nowrap">{children}</span>
    </NavLink>
  );
}
