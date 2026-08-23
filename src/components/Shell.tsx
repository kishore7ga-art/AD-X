import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";
import {
  Layers,
  Globe,
  Users as UsersIcon,
  Inbox,
  LogOut,
  Search,
  Bell,
  ChevronDown,
  FileText,
  LifeBuoy,
  Activity,
} from "lucide-react";

import { useAuth } from "@/auth/AuthContext";

/**
 * The Studio's frame.
 *
 * A rail flush to the left edge and a bar across the top, both white, both
 * separated from the content by a single hairline. The rail splits in two: the
 * screens you work in sit at the top, and the reference material sits at the
 * bottom of the column, which keeps the working set short no matter how much
 * else gets added later.
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
    <div className="flex h-screen bg-white text-chalk">
      {/* ─── Rail ─────────────────────────────────────────────────────────── */}
      <aside className="hidden h-full w-[212px] shrink-0 flex-col justify-between border-r border-night-line lg:flex">
        <div>
          <div className="flex h-[60px] items-center px-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-[13px] font-extrabold text-white">
              X
            </span>
            <span className="ml-2.5 text-[15px] font-bold tracking-tight text-chalk">XITE</span>
          </div>

          <nav className="mt-2 flex flex-col gap-0.5 px-3">
            <Rail to="/templates" icon={<Layers className="h-[17px] w-[17px]" />}>
              Templates &amp; Sections
            </Rail>
            <Rail to="/default-website" icon={<Globe className="h-[17px] w-[17px]" />}>
              Default Website
            </Rail>
            <Rail to="/users" icon={<UsersIcon className="h-[17px] w-[17px]" />}>
              Users
            </Rail>
            <Rail to="/requests" icon={<Inbox className="h-[17px] w-[17px]" />}>
              Requests
            </Rail>
          </nav>
        </div>

        {/*
          The lower group.

          These are references rather than destinations inside the panel, so
          they are anchored to the foot of the rail and marked up as the links
          out that they are. They are deliberately not `NavLink`s: nothing here
          routes, and a nav item that never becomes active is a dead control.
        */}
        <div className="flex flex-col gap-0.5 px-3 pb-4">
          <RailLink href="https://api.webxite.org/api/health" icon={<Activity className="h-[17px] w-[17px]" />}>
            API health
          </RailLink>
          <RailLink href="https://api.webxite.org/openapi.json" icon={<FileText className="h-[17px] w-[17px]" />}>
            API reference
          </RailLink>
          <RailLink href="https://webxite.org" icon={<LifeBuoy className="h-[17px] w-[17px]" />}>
            Platform site
          </RailLink>

          {admin ? (
            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-1 flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-chalk-dim transition-colors hover:bg-night hover:text-rose-600"
            >
              <LogOut className="h-[17px] w-[17px]" />
              <span>Sign out</span>
            </button>
          ) : null}
        </div>
      </aside>

      <div className="flex h-full min-w-0 flex-1 flex-col">
        {/* ─── Top bar ────────────────────────────────────────────────────── */}
        <header className="flex h-[60px] shrink-0 items-center justify-between gap-4 border-b border-night-line px-4 sm:px-6">
          <h1 className="truncate text-[15px] font-semibold tracking-tight text-chalk">
            {title || "Studio Portal"}
          </h1>

          <div className="flex items-center gap-1.5 sm:gap-3">
            {/*
              A hint, not a field. Search belongs to each page's own data, so a
              box here that filtered nothing would be a lie about what the
              chrome can do.
            */}
            <span className="hidden items-center gap-2 rounded-lg border border-night-line px-3 py-1.5 text-[12px] font-medium text-chalk-dim md:inline-flex">
              <Search className="h-3.5 w-3.5" />
              Search within each page
            </span>

            <span className="relative hidden h-8 w-8 items-center justify-center rounded-lg text-chalk-dim sm:flex">
              <Bell className="h-[18px] w-[18px]" />
            </span>

            {admin ? (
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-night text-[11px] font-bold text-chalk-dim">
                  {admin.email.charAt(0).toUpperCase()}
                </span>
                <span className="hidden max-w-[190px] truncate text-[13px] font-medium text-chalk sm:block">
                  {admin.email}
                </span>
                <ChevronDown className="hidden h-4 w-4 text-chalk-dim sm:block" />
              </div>
            ) : null}
          </div>
        </header>

        {/* The rail is hidden below lg; navigation has to survive that. */}
        <nav className="flex items-center gap-1 overflow-x-auto border-b border-night-line px-4 py-2 lg:hidden">
          <Rail to="/templates" icon={<Layers className="h-4 w-4" />} compact>
            Templates
          </Rail>
          <Rail to="/default-website" icon={<Globe className="h-4 w-4" />} compact>
            Website
          </Rail>
          <Rail to="/users" icon={<UsersIcon className="h-4 w-4" />} compact>
            Users
          </Rail>
          <Rail to="/requests" icon={<Inbox className="h-4 w-4" />} compact>
            Requests
          </Rail>
        </nav>

        <main className="app-well w-full flex-1 overflow-y-auto px-4 pb-16 pt-6 sm:px-6">
          {children}
        </main>
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
        `flex shrink-0 cursor-pointer items-center gap-2.5 rounded-lg font-medium transition-colors ${
          compact ? "px-3 py-1.5 text-[12px]" : "px-2.5 py-2 text-[13px]"
        } ${
          isActive
            ? "bg-accent/10 font-semibold text-accent"
            : "text-chalk-dim hover:bg-night hover:text-chalk"
        }`
      }
    >
      {icon}
      <span className="whitespace-nowrap">{children}</span>
    </NavLink>
  );
}

function RailLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-chalk-dim transition-colors hover:bg-night hover:text-chalk"
    >
      {icon}
      <span className="whitespace-nowrap">{children}</span>
    </a>
  );
}
