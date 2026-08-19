import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";
import { Layers, Globe, Users as UsersIcon, Inbox, LogOut } from "lucide-react";

import { useAuth } from "@/auth/AuthContext";

export function Shell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { admin, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-white shadow-sm shadow-cyan-500/20 font-black text-sm">
                ⚡
              </div>
              <div>
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-cyan-600 block leading-none">
                  XITE SUPER ADMIN
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-sm font-extrabold text-slate-900 tracking-tight">
                    Studio Portal
                  </span>
                  {title ? (
                    <span className="text-xs font-semibold text-slate-400">
                      / {title}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Horizontal Navigation Tabs */}
            <nav className="flex items-center gap-1.5 text-xs font-semibold bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
              <Tab to="/templates" icon={<Layers className="w-3.5 h-3.5" />}>
                Templates & Sections
              </Tab>
              <Tab to="/default-website" icon={<Globe className="w-3.5 h-3.5" />}>
                Default Website
              </Tab>
              <Tab to="/users" icon={<UsersIcon className="w-3.5 h-3.5" />}>
                Users
              </Tab>
              <Tab to="/requests" icon={<Inbox className="w-3.5 h-3.5" />}>
                Requests
              </Tab>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {admin ? (
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200/60 text-slate-700 font-medium">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/40 animate-pulse" />
                  <span className="hidden sm:inline font-mono">{admin.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-bold text-xs text-slate-600 hover:text-red-600 hover:border-red-200 transition-colors shadow-xs cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto w-full max-w-[1400px] px-4 sm:px-8 py-6 pb-20">
        {children}
      </main>
    </div>
  );
}

function Tab({ to, icon, children }: { to: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
          isActive
            ? "bg-white text-slate-900 shadow-xs border border-slate-200/80 font-extrabold"
            : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
        }`
      }
    >
      {icon}
      <span>{children}</span>
    </NavLink>
  );
}
