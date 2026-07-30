import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "@/api/client";
import type { TemplateRow, TemplateStats } from "@/api/types";
import { Shell } from "@/components/Shell";

/**
 * Every template in the database, drafts and archived included.
 *
 * Three states in the status column, not two. The guide shows Published/Draft, but
 * `isPublished` and `archivedAt` are separate axes in this schema — draft means
 * "being built", archived means "was offered and withdrawn" — and collapsing them
 * would file a withdrawn template under unfinished.
 *
 * The counts beside each row are the ones that decide whether it can be deleted at
 * all. `sections` cascades from `templates` and `college_sections` cascades from
 * `sections`, so deleting a template in use destroys the content of every college
 * on it. `deletable` is computed by the API, which is the only side that can see
 * that cascade.
 */
export function Templates() {
  const [templates, setTemplates] = useState<TemplateRow[] | null>(null);
  const [stats, setStats] = useState<TemplateStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [list, counts] = await Promise.all([
          api.get<{ templates: TemplateRow[] }>("/api/v1/admin/templates"),
          api.get<TemplateStats>("/api/v1/admin/templates/stats"),
        ]);
        if (cancelled) return;
        setTemplates(list.templates);
        setStats(counts);
      } catch (cause) {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "Could not load");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Shell title="Templates">
      {stats ? (
        <div className="grid gap-4 sm:grid-cols-4">
          <Stat label="Templates" value={stats.templates.total} />
          <Stat label="Published" value={stats.templates.published} />
          <Stat label="Draft" value={stats.templates.draft} />
          <Stat
            label="Designs in library"
            value={stats.library.active}
            hint={
              stats.library.retired
                ? `${stats.library.retired} retired`
                : undefined
            }
          />
        </div>
      ) : null}

      {stats ? (
        <p className="mt-4 text-xs text-chalk-dim/50">
          {stats.byType.map((t) => `${t.sectionType} ${t.active}`).join(" · ")}
          {stats.collegesOnTemplates
            ? ` — ${stats.collegesOnTemplates} college${stats.collegesOnTemplates === 1 ? "" : "s"} currently on a template`
            : null}
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-8 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300"
        >
          {error}
        </p>
      ) : null}

      {templates === null && !error ? (
        <p className="mt-8 text-sm text-chalk-dim/60">Loading…</p>
      ) : null}

      {templates ? (
        <div className="mt-8 overflow-x-auto rounded-xl border border-night-line">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-night-raised text-[10px] uppercase tracking-[0.16em] text-chalk-dim/50">
              <tr>
                <th className="px-5 py-3 font-semibold">Template</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Composition</th>
                <th className="px-5 py-3 font-semibold">In use</th>
                <th className="px-5 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-night-line">
              {templates.map((template) => (
                <tr key={template.id} className="bg-night align-top">
                  <td className="px-5 py-4">
                    <span className="block font-semibold text-chalk">
                      {template.name}
                    </span>
                    {template.description ? (
                      <span className="mt-1 block max-w-[34ch] text-xs leading-relaxed text-chalk-dim/60">
                        {template.description}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-5 py-4">
                    <Status template={template} />
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-chalk-dim">
                      {template.slots.length} section
                      {template.slots.length === 1 ? "" : "s"}
                    </span>
                    <span className="mt-1 block font-mono text-[11px] leading-relaxed text-chalk-dim/45">
                      {template.slots
                        .map((slot) => slot.leadComponentKey ?? "—")
                        .join(", ")}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {template.colleges ? (
                      <>
                        <span className="text-chalk">
                          {template.colleges} college
                          {template.colleges === 1 ? "" : "s"}
                        </span>
                        <span className="mt-1 block text-xs text-chalk-dim/50">
                          {template.collegeSections} sections built
                        </span>
                      </>
                    ) : (
                      <span className="text-chalk-dim/50">unused</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {/*
                      Edit rather than Delete. Archiving and deleting both live on
                      the edit screen, next to the counts that decide which of the
                      two is even possible — a Delete button in a list row is one
                      click away from a cascade, with none of that context beside it.
                    */}
                    <Link
                      to={`/templates/${template.id}`}
                      className="text-accent underline-offset-2 hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </Shell>
  );
}

function Status({ template }: { template: TemplateRow }) {
  if (template.archivedAt) {
    return (
      <span className="rounded-full border border-night-line px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-chalk-dim/60">
        Archived
      </span>
    );
  }
  return template.isPublished ? (
    <span className="text-accent">Published</span>
  ) : (
    <span className="text-amber-400">Draft</span>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-night-line bg-night-raised px-5 py-4">
      <span className="block text-3xl font-extrabold tabular-nums text-chalk">
        {value}
      </span>
      <span className="mt-1 block text-xs text-chalk-dim/60">{label}</span>
      {hint ? (
        <span className="mt-0.5 block text-[11px] text-chalk-dim/40">{hint}</span>
      ) : null}
    </div>
  );
}
