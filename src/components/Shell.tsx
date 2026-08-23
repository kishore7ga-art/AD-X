import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";
import {
  Layers,
  Globe,
  Users as UsersIcon,
  Inbox,
  LogOut,
  Zap,
  Search,
  Bell,
  LifeBuoy,
} from "lucide-react";

import { useAuth } from "@/auth/AuthContext";

/**
 * The Studio's frame.
 *
 * One white card floating on the lavender ground, holding a rail down the left
 * and a bar across the top. The frame is the point: a panel that stops short of
 * the window edge reads as an object you are working on, which is what the
 * whole light treatment is for.
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
    /*
      A fixed-height shell, not a tall page.

      The frame has to clip to its own radius, and `overflow: hidden` turns an
      element into a scroll container that never scrolls — which silently kills
      `position: sticky` for everything inside it. So the scrolling moves into
      the panes: the frame is exactly one viewport, the rail holds still, and
      the content well scrolls under it. That is also how the layout this is
      drawn from behaves.
    */
    <div className="h-screen p-2.5 text-chalk sm:p-4 lg:p-6">
      <div className="app-frame flex h-full overflow-hidden">
        {/* ─── Rail ───────────────────────────────────────────────────────── */}
        <aside className="hidden h-full w-[248px] shrink-0 flex-col justify-between overflow-y-auto px-4 py-6 lg:flex">
          <div>
            <div className="mb-9 flex items-center gap-2.5 px-2">
              <div className="accent-fill flex h-9 w-9 items-center justify-center rounded-xl">
                <Zap className="h-4.5 w-4.5" strokeWidth={2.5} />
              </div>
              <div className="leading-none">
                <span className="block text-[17px] font-extrabold tracking-tight text-chalk">
                  XITE
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-chalk-dim">
                  Super Admin
                </span>
              </div>
            </div>

            <p className="mb-2.5 px-3 text-[10px] font-bold uppercase tracking-widest text-chalk-dim">
              Menu
            </p>
            <nav className="flex flex-col gap-1.5">
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

          <div className="space-y-3">
            {/*
              The dark card at the foot of the rail. It is the one place on this
              surface that inverts, which is what makes it findable without it
              having to shout in a colour that would compete with the KPI tiles.
            */}
            <div className="rounded-3xl bg-accent p-4 text-night">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                <LifeBuoy className="h-4 w-4" />
              </div>
              <p className="text-[13px] font-extrabold leading-tight">Help Center</p>
              <p className="mt-1 text-[11px] font-medium leading-snug text-night/60">
                Something not behaving? The platform runbook has the answers.
              </p>
              <a
                href="https://xite.co.in"
                target="_blank"
                rel="noreferrer"
                className="mt-3 block rounded-xl bg-white px-3 py-2 text-center text-[11px] font-extrabold text-chalk transition-colors hover:bg-night"
              >
                Open runbook
              </a>
            </div>

            {admin ? (
              <button
                type="button"
                onClick={() => void signOut()}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold text-chalk-dim transition-colors duration-200 hover:bg-rose-50 hover:text-rose-600"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            ) : null}
          </div>
        </aside>

        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          {/* ─── Top bar ──────────────────────────────────────────────────── */}
          <header className="shrink-0 px-4 pt-5 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-[22px] font-extrabold tracking-tight text-chalk">
                  {title || "Studio Portal"}
                </h1>
                <p className="text-[11px] font-medium text-chalk-dim">
                  Welcome back — manage templates, sites and access from one place
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                {/*
                  A hint, not a field. Search belongs to each page's own data, so
                  a box here that filtered nothing would be a lie about what the
                  chrome can do.
                */}
                <div className="hidden items-center gap-2 rounded-full border border-night-line bg-night px-4 py-2.5 md:flex">
                  <Search className="h-3.5 w-3.5 text-chalk-dim" />
                  <span className="text-[11px] font-medium text-chalk-dim">
                    Search within each page
                  </span>
                </div>

                <span className="hidden h-10 w-10 items-center justify-center rounded-full border border-night-line bg-white text-chalk-dim sm:flex">
                  <Bell className="h-4 w-4" />
                </span>

                {admin ? (
                  <div className="flex items-center gap-2.5 rounded-full border border-night-line bg-white py-1.5 pl-1.5 pr-3.5">
                    <div className="accent-fill flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-black">
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
            <nav className="mt-3 flex items-center gap-1 overflow-x-auto rounded-2xl border border-night-line bg-night p-1.5 lg:hidden">
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

          <main className="app-well mt-5 w-full flex-1 overflow-y-auto rounded-tl-[28px] px-4 pb-20 pt-6 sm:px-6">
            {children}
          </main>
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
          compact ? "px-3 py-2 text-[11px]" : "px-3.5 py-3 text-xs"
        } ${
          isActive
            ? "accent-fill"
            : "text-chalk-dim hover:bg-night hover:text-chalk"
        }`
      }
    >
      {icon}
      <span className="whitespace-nowrap">{children}</span>
    </NavLink>
  );
}
