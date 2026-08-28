import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Inbox, Layers, Users as UsersIcon } from "lucide-react";

import { api, ApiError } from "@/api/client";
import { Shell } from "@/components/Shell";
import { StatTile } from "@/components/StatTile";

/**
 * The Super Admin's landing screen.
 *
 * ── Why this did not exist ─────────────────────────────────────────────────
 *
 * `/` redirected to `/templates`, with a comment saying it was "the landing
 * screen because it is the only one built". Meanwhile `GET /admin/overview` had
 * been returning platform counts the whole time and nothing in this panel ever
 * called it — so the numbers an operator needs to run the platform existed on
 * the API and were rendered nowhere.
 *
 * ── What is deliberately not here ──────────────────────────────────────────
 *
 * Anything the API cannot count. Every figure below maps to a field on
 * `/admin/overview`, and that endpoint now counts rather than asserts: its
 * `templates[].colleges` used to be the literal zero for every row and its
 * `recentActions` used to be the empty array, both of which render as perfectly
 * plausible facts. There is no trend line and no percentage-change chip, for
 * the same reason `StatTile` has no sparkline — there is no history behind
 * these numbers, and drawing one would be a picture of data that does not exist.
 */

type Overview = {
  colleges: {
    total: number;
    active: number;
    published: number;
    onboardingIncomplete: number;
    withoutTemplate: number;
  };
  requests: { pending: number; approved: number; rejected: number };
  users: number;
  presence: { total: number; live: number; windowSeconds: number };
  sections: number;
  templates: { id: string; name: string; colleges: number; archived: boolean }[];
  recentActions: {
    action: string;
    tenantId: string;
    actorId: string | null;
    createdAt: string | null;
  }[];
};

/** `ACCESS_REQUEST_CREATED` -> `Access request created`. */
function humanAction(action: string): string {
  const words = action.toLowerCase().replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function relative(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function Dashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const payload = await api.get<Overview>("/api/v1/admin/overview");
        if (!cancelled) {
          setData(payload);
          setError(null);
        }
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof ApiError
              ? cause.message
              : "Could not load platform metrics.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    /**
     * Refreshed on an interval because one of these numbers is a live count.
     *
     * Sixty seconds, matching the presence write's own throttle — polling
     * faster cannot surface anything newer, it only costs an aggregation per
     * poll. The whole payload is refetched rather than a presence-only endpoint
     * added, because the queue counts move on the same timescale and one
     * request is cheaper than two.
     */
    const timer = window.setInterval(() => void load(), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const liveMinutes = data ? Math.round(data.presence.windowSeconds / 60) : 5;

  return (
    <Shell title="Dashboard">
      {loading && !data ? (
        <p className="text-sm text-chalk-dim">Loading platform metrics…</p>
      ) : error && !data ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-semibold text-rose-700">{error}</p>
          <p className="mt-1 text-xs text-rose-600">
            These are live counts from the API — nothing is shown here when it
            cannot be reached, rather than a stale or placeholder figure.
          </p>
        </div>
      ) : data ? (
        <div className="flex flex-col gap-6">
          {/* The figures an operator acts on first. */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Pending requests"
              value={data.requests.pending}
              sublabel="Waiting on a decision"
              badge={data.requests.pending > 0 ? "Action" : "Clear"}
              tone={data.requests.pending > 0 ? "sun" : "green"}
              icon={<Inbox className="h-3.5 w-3.5" />}
            />
            <StatTile
              label="Active now"
              value={data.presence.live}
              sublabel={`Sessions used in the last ${liveMinutes} min`}
              badge="Live"
              tone="green"
              icon={<Activity className="h-3.5 w-3.5" />}
            />
            <StatTile
              label="Total users"
              value={data.presence.total}
              sublabel="Accounts across all colleges"
              tone="lilac"
              icon={<UsersIcon className="h-3.5 w-3.5" />}
            />
            <StatTile
              label="Published sites"
              value={data.colleges.published}
              sublabel={`of ${data.colleges.total} colleges`}
              tone={data.colleges.published > 0 ? "green" : "lilac"}
              icon={<Layers className="h-3.5 w-3.5" />}
            />
          </section>

          {/* The rest of the platform's shape. */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Approved requests"
              value={data.requests.approved}
              tone="lilac"
            />
            <StatTile
              label="Rejected requests"
              value={data.requests.rejected}
              tone="lilac"
            />
            <StatTile
              label="Onboarding incomplete"
              value={data.colleges.onboardingIncomplete}
              sublabel="Have not finished role, theme and font"
              tone={data.colleges.onboardingIncomplete > 0 ? "sun" : "green"}
            />
            <StatTile
              label="Section instances"
              value={data.sections}
              sublabel="Across every tenant draft"
              tone="lilac"
            />
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Library usage — the column that used to be a hardcoded zero. */}
            <section className="rounded-lg border border-night-line">
              <header className="flex items-center justify-between border-b border-night-line px-5 py-3.5">
                <h2 className="text-[13px] font-bold text-chalk">Section library</h2>
                <Link
                  to="/templates"
                  className="text-[12px] font-semibold text-accent hover:underline"
                >
                  Manage
                </Link>
              </header>
              {data.templates.length === 0 ? (
                <p className="px-5 py-6 text-[13px] text-chalk-dim">
                  No section templates yet. Until one exists, tenants have
                  nothing to add or swap to.
                </p>
              ) : (
                <ul className="divide-y divide-night-line">
                  {data.templates.slice(0, 8).map((template) => (
                    <li
                      key={template.id}
                      className="flex items-center justify-between gap-3 px-5 py-3"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-[13px] font-semibold text-chalk">
                          {template.name}
                        </span>
                        {template.archived && (
                          <span className="shrink-0 rounded border border-night-line bg-night px-1.5 py-0.5 text-[10px] font-semibold uppercase text-chalk-dim">
                            Archived
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-[12px] tabular-nums text-chalk-dim">
                        {template.colleges === 0
                          ? "unused"
                          : `${template.colleges} ${template.colleges === 1 ? "college" : "colleges"}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* The audit log, which was being written and never read. */}
            <section className="rounded-lg border border-night-line">
              <header className="border-b border-night-line px-5 py-3.5">
                <h2 className="text-[13px] font-bold text-chalk">Recent activity</h2>
              </header>
              {data.recentActions.length === 0 ? (
                <p className="px-5 py-6 text-[13px] text-chalk-dim">
                  Nothing recorded yet.
                </p>
              ) : (
                <ul className="divide-y divide-night-line">
                  {data.recentActions.map((entry, index) => (
                    <li
                      key={`${entry.action}-${entry.createdAt}-${index}`}
                      className="flex items-center justify-between gap-3 px-5 py-3"
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-[13px] font-semibold text-chalk">
                          {humanAction(entry.action)}
                        </span>
                        {entry.tenantId && (
                          <span className="truncate text-[11px] font-mono text-chalk-dim">
                            {entry.tenantId}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-[12px] text-chalk-dim">
                        {relative(entry.createdAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {error && (
            <p className="text-[12px] text-amber-700">
              Showing the last figures that loaded — the most recent refresh
              failed: {error}
            </p>
          )}
        </div>
      ) : null}
    </Shell>
  );
}
