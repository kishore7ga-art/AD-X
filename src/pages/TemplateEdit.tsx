import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api } from "@/api/client";
import type { LibraryVariant, TemplateRow } from "@/api/types";
import { Shell } from "@/components/Shell";

/**
 * One template: its details, and which design fills each of its categories.
 *
 * Two save buttons, not one, and that is deliberate. The details and the
 * composition are different endpoints doing different things — a rename is a
 * `templates` update, a swap is a `sections` update — and a single Save would hide
 * which of them failed when one did.
 *
 * There is no delete button when the API says the template is not deletable. That
 * is not the check; the server refuses regardless. It is so the button does not
 * offer something that will be turned down.
 */
export function TemplateEdit() {
  const { id = "" } = useParams();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<TemplateRow | null>(null);
  const [library, setLibrary] = useState<LibraryVariant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState<"details" | "slots" | "retire" | null>(null);

  // Form state is separate from the loaded template so an unsaved edit is not
  // silently overwritten by a refetch.
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [leads, setLeads] = useState<Record<string, string>>({});

  function adopt(row: TemplateRow) {
    setTemplate(row);
    setName(row.name);
    setDescription(row.description ?? "");
    setIsPublished(row.isPublished);
    setLeads(
      Object.fromEntries(
        row.slots.map((slot) => [slot.slotId, slot.leadVariantId ?? ""]),
      ),
    );
  }

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [row, lib] = await Promise.all([
          api.get<TemplateRow>(`/api/v1/admin/templates/${id}`),
          api.get<{ variants: LibraryVariant[] }>("/api/v1/admin/library"),
        ]);
        if (cancelled) return;
        adopt(row);
        setLibrary(lib.variants);
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Could not load");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function run(
    which: "details" | "slots" | "retire",
    work: () => Promise<void>,
  ) {
    setBusy(which);
    setError(null);
    setNote(null);
    try {
      await work();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  const saveDetails = () =>
    run("details", async () => {
      const updated = await api.patch<TemplateRow>(
        `/api/v1/admin/templates/${id}`,
        { name, description: description || null, isPublished },
      );
      adopt(updated);
      setNote("Details saved.");
    });

  const saveSlots = () =>
    run("slots", async () => {
      const updated = await api.patch<TemplateRow>(
        `/api/v1/admin/templates/${id}/sections`,
        {
          slots: Object.entries(leads).map(([slotId, leadVariantId]) => ({
            slotId,
            leadVariantId: leadVariantId || null,
          })),
        },
      );
      adopt(updated);
      setNote("Sections updated. No college content was touched.");
    });

  const setArchived = (archived: boolean) =>
    run("retire", async () => {
      const updated = await api.patch<TemplateRow>(
        `/api/v1/admin/templates/${id}`,
        { archived },
      );
      adopt(updated);
      setNote(archived ? "Archived — no longer offered." : "Back in the gallery.");
    });

  const hardDelete = () =>
    run("retire", async () => {
      /**
       * The confirm is for the accident, not for the safety.
       *
       * The API refuses a hard delete on anything in use regardless of what this
       * dialog says — see `retireTemplate`. This exists so a misclick does not
       * remove an unused template that somebody was still working on.
       */
      if (
        !window.confirm(
          `Delete "${template?.name}" permanently? Nothing uses it, so nothing else is removed.`,
        )
      ) {
        return;
      }
      await api.del(`/api/v1/admin/templates/${id}?hard=true`);
      navigate("/templates", { replace: true });
    });

  if (error && !template) {
    return (
      <Shell title="Template">
        <p role="alert" className={BANNER_BAD}>
          {error}
        </p>
      </Shell>
    );
  }

  if (!template) {
    return (
      <Shell title="Template">
        <p className="text-sm text-chalk-dim/60">Loading…</p>
      </Shell>
    );
  }

  return (
    <Shell title={template.name}>
      {error ? (
        <p role="alert" className={`${BANNER_BAD} mb-6`}>
          {error}
        </p>
      ) : null}
      {note ? (
        <p className={`${BANNER_OK} mb-6`}>{note}</p>
      ) : null}

      <section className="rounded-xl border border-night-line bg-night-raised p-6">
        <h2 className={HEADING}>Details</h2>

        <div className="mt-5 space-y-5">
          <label className="block">
            <span className={LABEL}>Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={INPUT}
            />
          </label>

          <label className="block">
            <span className={LABEL}>Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className={`${INPUT} resize-y`}
            />
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(event) => setIsPublished(event.target.checked)}
              className="size-4 accent-accent"
            />
            <span className="text-sm text-chalk">
              Published
              <span className="ml-2 text-xs text-chalk-dim/50">
                colleges can pick it in the gallery
              </span>
            </span>
          </label>
        </div>

        <button
          type="button"
          onClick={() => void saveDetails()}
          disabled={busy !== null}
          className={PRIMARY}
        >
          {busy === "details" ? "Saving…" : "Save details"}
        </button>
      </section>

      <section className="mt-6 rounded-xl border border-night-line bg-night-raised p-6">
        <h2 className={HEADING}>Sections</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-chalk-dim">
          Which design fills each category. Changing one re-points this template
          only — colleges already using it keep their content, and their own
          per-section choices are untouched.
        </p>

        <div className="mt-5 space-y-4">
          {template.slots.map((slot) => {
            const options = library.filter(
              (variant) =>
                variant.sectionType === slot.sectionType &&
                (variant.isActive || variant.id === slot.leadVariantId),
            );

            return (
              <label
                key={slot.slotId}
                className="grid gap-2 sm:grid-cols-[9rem_1fr] sm:items-center sm:gap-4"
              >
                <span className="font-mono text-xs uppercase tracking-wider text-chalk-dim/60">
                  {slot.sectionType}
                  {slot.isRequired ? (
                    <span className="ml-1 text-accent" title="Required">
                      *
                    </span>
                  ) : null}
                </span>
                <select
                  value={leads[slot.slotId] ?? ""}
                  onChange={(event) =>
                    setLeads((current) => ({
                      ...current,
                      [slot.slotId]: event.target.value,
                    }))
                  }
                  className={SELECT}
                >
                  <option value="">— none —</option>
                  {options.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.variantName}
                      {variant.isActive ? "" : " (retired)"}
                      {variant.inUse ? ` · ${variant.inUse} in use` : ""}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => void saveSlots()}
          disabled={busy !== null}
          className={PRIMARY}
        >
          {busy === "slots" ? "Saving…" : "Save sections"}
        </button>
      </section>

      <section className="mt-6 rounded-xl border border-night-line bg-night-raised p-6">
        <h2 className={HEADING}>Availability</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-chalk-dim">
          {template.colleges
            ? `${template.colleges} college${template.colleges === 1 ? "" : "s"} use this template, with ${template.collegeSections} sections built from it. Archiving stops it being offered and changes nothing for them.`
            : "Nothing uses this template."}
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          {template.archivedAt ? (
            <button
              type="button"
              onClick={() => void setArchived(false)}
              disabled={busy !== null}
              className={SECONDARY}
            >
              Un-archive
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void setArchived(true)}
              disabled={busy !== null}
              className={SECONDARY}
            >
              Archive
            </button>
          )}

          {/*
            Only offered when the API says it is possible. It refuses otherwise
            regardless, so this is about not presenting a dead control.
          */}
          {template.deletable ? (
            <button
              type="button"
              onClick={() => void hardDelete()}
              disabled={busy !== null}
              className="rounded-full border border-red-500/40 px-5 py-2.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-50"
            >
              Delete permanently
            </button>
          ) : (
            <span className="self-center text-xs text-chalk-dim/40">
              Cannot be deleted while {template.collegeSections} college sections
              depend on it
            </span>
          )}
        </div>
      </section>
    </Shell>
  );
}

const HEADING =
  "text-[11px] font-semibold uppercase tracking-[0.24em] text-chalk-dim/50";
const LABEL =
  "text-xs font-semibold uppercase tracking-[0.18em] text-chalk-dim/60";
const INPUT =
  "mt-2 w-full rounded-lg border border-night-line bg-night px-4 py-3 text-sm text-chalk outline-none transition focus:border-accent";
const SELECT =
  "w-full rounded-lg border border-night-line bg-night px-3 py-2.5 text-sm text-chalk outline-none transition focus:border-accent";
const PRIMARY =
  "mt-6 rounded-full bg-accent px-6 py-2.5 text-xs font-semibold text-night transition-opacity hover:opacity-90 disabled:opacity-50";
const SECONDARY =
  "rounded-full border border-night-line px-5 py-2.5 text-xs font-semibold text-chalk-dim transition-colors hover:border-chalk-dim/40 hover:text-chalk disabled:opacity-50";
const BANNER_BAD =
  "rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300";
const BANNER_OK =
  "rounded-xl border border-accent/30 bg-accent/10 px-5 py-4 text-sm text-chalk";
