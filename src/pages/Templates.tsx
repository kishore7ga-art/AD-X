import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "@/api/client";
import type { TemplateRow, TemplateStats } from "@/api/types";
import { Shell } from "@/components/Shell";

/**
 * Every template in the database, drafts and archived included.
 *
 * Allows admins to view all templates, edit composition, delete unused templates
 * permanently, archive templates in use, or create new templates that instantly
 * appear in the gallery and editor page once published.
 */
export function Templates() {
  const [templates, setTemplates] = useState<TemplateRow[] | null>(null);
  const [stats, setStats] = useState<TemplateStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Add Template Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newThumbnailUrl, setNewThumbnailUrl] = useState("");
  const [newIsPublished, setNewIsPublished] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      const [list, counts] = await Promise.all([
        api.get<{ templates: TemplateRow[] }>("/api/v1/admin/templates"),
        api.get<TemplateStats>("/api/v1/admin/templates/stats"),
      ]);
      setTemplates(list.templates);
      setStats(counts);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load");
    }
  };

  useEffect(() => {
    void fetchTemplates();
  }, []);

  const handleDelete = async (template: TemplateRow) => {
    setError(null);
    if (template.deletable) {
      if (
        !window.confirm(
          `Delete "${template.name}" permanently from the database? It is unused, so it will be removed completely and will never show in the editor page.`,
        )
      ) {
        return;
      }
      setBusyId(template.id);
      try {
        await api.del(`/api/v1/admin/templates/${template.id}?hard=true`);
        await fetchTemplates();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Failed to delete template");
      } finally {
        setBusyId(null);
      }
    } else {
      if (
        !window.confirm(
          `"${template.name}" is currently used by ${template.colleges} college(s). Archive and unpublish it so it no longer appears in the editor page or gallery?`,
        )
      ) {
        return;
      }
      setBusyId(template.id);
      try {
        await api.del(`/api/v1/admin/templates/${template.id}`);
        await fetchTemplates();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Failed to archive template");
      } finally {
        setBusyId(null);
      }
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setModalError("Template name is required");
      return;
    }
    setModalError(null);
    setIsCreating(true);

    try {
      await api.post("/api/v1/admin/templates", {
        name: newName.trim(),
        description: newDescription.trim() || undefined,
        thumbnailUrl: newThumbnailUrl.trim() || undefined,
        isPublished: newIsPublished,
      });

      setNewName("");
      setNewDescription("");
      setNewThumbnailUrl("");
      setNewIsPublished(true);
      setShowAddModal(false);
      await fetchTemplates();
    } catch (cause) {
      setModalError(
        cause instanceof Error ? cause.message : "Failed to create template",
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Shell title="Templates">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-chalk">Design Templates</h1>
          <p className="text-xs text-chalk-dim/60 mt-1">
            Manage templates. Published templates are offered in the frontend editor page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="rounded-full bg-accent px-5 py-2 text-xs font-semibold text-night transition-opacity hover:opacity-90"
        >
          + Add Template
        </button>
      </div>

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
          className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300"
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
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
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
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        to={`/templates/${template.id}`}
                        className="text-accent underline-offset-2 hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={busyId === template.id}
                        onClick={() => void handleDelete(template)}
                        className="text-xs font-medium text-red-400 hover:text-red-300 disabled:opacity-50"
                        title={
                          template.deletable
                            ? "Delete template permanently"
                            : "Archive template (in use)"
                        }
                      >
                        {busyId === template.id
                          ? "Removing…"
                          : template.deletable
                            ? "Delete"
                            : "Archive"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Modal for adding a new template */}
      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-night-line bg-night-raised p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-chalk mb-4">Add New Template</h2>
            {modalError ? (
              <p className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-300">
                {modalError}
              </p>
            ) : null}
            <form onSubmit={(e) => void handleCreateTemplate(e)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-chalk-dim mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zenith Medical"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-lg border border-night-line bg-night px-3 py-2 text-sm text-chalk focus:border-accent outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-chalk-dim mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Clean layout designed for medical institutes"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full rounded-lg border border-night-line bg-night px-3 py-2 text-sm text-chalk focus:border-accent outline-none resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-chalk-dim mb-1">
                  Thumbnail URL (optional)
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newThumbnailUrl}
                  onChange={(e) => setNewThumbnailUrl(e.target.value)}
                  className="w-full rounded-lg border border-night-line bg-night px-3 py-2 text-sm text-chalk focus:border-accent outline-none"
                />
              </div>

              <label className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  checked={newIsPublished}
                  onChange={(e) => setNewIsPublished(e.target.checked)}
                  className="size-4 accent-accent"
                />
                <span className="text-xs text-chalk">
                  Publish immediately (visible in frontend editor page)
                </span>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-night-line">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-full border border-night-line px-4 py-2 text-xs font-semibold text-chalk-dim hover:text-chalk"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-full bg-accent px-5 py-2 text-xs font-semibold text-night hover:opacity-90 disabled:opacity-50"
                >
                  {isCreating ? "Creating…" : "Create Template"}
                </button>
              </div>
            </form>
          </div>
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
