import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api } from "@/api/client";
import { API_BASE } from "@/env";
import type { LibraryVariant, TemplateRow } from "@/api/types";
import { Shell } from "@/components/Shell";

const STUDIO_PALETTES = [
  {
    id: "dark",
    name: "Midnight Dark",
    bg: "#0D1117",
    text: "#F0F6FC",
    accent: "#38BDF8",
    cardBg: "#161B22",
    border: "#30363D",
  },
  {
    id: "emerald",
    name: "Emerald Gold",
    bg: "#064E3B",
    text: "#ECFDF5",
    accent: "#F59E0B",
    cardBg: "#022C22",
    border: "#047857",
  },
  {
    id: "sapphire",
    name: "Sapphire Blue",
    bg: "#0F172A",
    text: "#F8FAFC",
    accent: "#3B82F6",
    cardBg: "#1E293B",
    border: "#334155",
  },
  {
    id: "sunset",
    name: "Sunset Coral",
    bg: "#451A03",
    text: "#FFF7ED",
    accent: "#F97316",
    cardBg: "#292524",
    border: "#78350F",
  },
  {
    id: "light",
    name: "Minimal Light",
    bg: "#F8FAFC",
    text: "#0F172A",
    accent: "#0EA5E9",
    cardBg: "#FFFFFF",
    border: "#E2E8F0",
  },
  {
    id: "cyber",
    name: "Cyber Neon",
    bg: "#180828",
    text: "#F4F4F5",
    accent: "#E066FF",
    cardBg: "#280F43",
    border: "#3B0764",
  },
];

export function TemplateEdit() {
  const { id = "" } = useParams();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<TemplateRow | null>(null);
  const [library, setLibrary] = useState<LibraryVariant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState<"details" | "slots" | "retire" | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [leads, setLeads] = useState<Record<string, string>>({});

  // Studio Code & Workbench Testing State
  const [studioViewport, setStudioViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [studioTab, setStudioTab] = useState<"preview" | "code">("preview");
  const [selectedPalette, setSelectedPalette] = useState("dark");

  // File Upload State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [selectedPrimaryFile, setSelectedPrimaryFile] = useState<string>("all");
  const [folderName, setFolderName] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const currentPalette =
    STUDIO_PALETTES.find((p) => p.id === selectedPalette) ?? STUDIO_PALETTES[0]!;

  function adopt(row: TemplateRow) {
    setTemplate(row);
    setName(row.name);
    setDescription(row.description ?? "");
    setThumbnailUrl(row.thumbnailUrl ?? "");
    setIsPublished(row.isPublished);
    setFilePreview(row.code ?? null);
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
          setError(cause instanceof Error ? cause.message : "Could not load template");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleFolderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const allowedExtensions = [
      ".html",
      ".htm",
      ".blade.php",
      ".jsx",
      ".vue",
      ".txt",
      ".php",
      ".js",
      ".tsx",
      ".ts",
      ".css",
    ];

    const filesArray = Array.from(fileList).filter((f) => {
      const filename = f.name.toLowerCase();
      return allowedExtensions.some((ext) => filename.endsWith(ext));
    });

    if (filesArray.length === 0) {
      setError("No valid code files found in selected upload.");
      return;
    }

    const firstPath = filesArray[0]!.webkitRelativePath || filesArray[0]!.name;
    const derivedFolderName = firstPath.includes("/")
      ? (firstPath.split("/")[0] ?? "Uploaded Folder")
      : "Uploaded Folder";
    setFolderName(derivedFolderName);

    const contentsMap: Record<string, string> = {};
    await Promise.all(
      filesArray.map(
        (file) =>
          new Promise<void>((resolve) => {
            const reader = new FileReader();
            const key = file.webkitRelativePath || file.name;
            reader.onload = (event) => {
              contentsMap[key] = (event.target?.result as string) || "";
              resolve();
            };
            reader.onerror = () => resolve();
            reader.readAsText(file);
          }),
      ),
    );

    setError(null);
    setSelectedFiles(filesArray);
    setFileContents(contentsMap);
    setSelectedPrimaryFile("all");

    const stitched = Object.entries(contentsMap)
      .map(([path, text]) => `<!-- File: ${path} -->\n${text}`)
      .join("\n\n");
    setFilePreview(stitched);
  };

  const handlePrimaryFileChange = (pathKey: string) => {
    setSelectedPrimaryFile(pathKey);
    if (pathKey === "all") {
      const stitched = Object.entries(fileContents)
        .map(([path, text]) => `<!-- File: ${path} -->\n${text}`)
        .join("\n\n");
      setFilePreview(stitched);
    } else {
      setFilePreview(fileContents[pathKey] ?? "");
    }
  };

  const handleClearUploadedFiles = () => {
    setSelectedFiles([]);
    setFileContents({});
    setFolderName(null);
    setSelectedPrimaryFile("all");
    setFilePreview(template?.code ?? null);
  };

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
      let updated: TemplateRow;

      if (selectedFiles.length > 0) {
        const formData = new FormData();
        formData.append("name", name.trim());
        if (description.trim()) formData.append("description", description.trim());
        if (thumbnailUrl.trim()) formData.append("thumbnailUrl", thumbnailUrl.trim());
        formData.append("isPublished", String(isPublished));

        selectedFiles.forEach((file) => {
          formData.append("files", file, file.webkitRelativePath || file.name);
        });

        const response = await fetch(`${API_BASE}/api/v1/admin/templates/${id}`, {
          method: "PATCH",
          credentials: "include",
          body: formData,
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(payload?.error ?? `Save failed (${response.status})`);
        }
        updated = (await response.json()) as TemplateRow;
      } else {
        updated = await api.patch<TemplateRow>(`/api/v1/admin/templates/${id}`, {
          name: name.trim(),
          description: description.trim() || null,
          thumbnailUrl: thumbnailUrl.trim() || null,
          isPublished,
          code: filePreview,
        });
      }

      adopt(updated);
      setSelectedFiles([]);
      setFileContents({});
      setFolderName(null);
      setNote("Template details & code updated successfully.");
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
      setNote("Sections updated. Frontend will automatically render updated design variants.");
    });

  const setArchived = (archived: boolean) =>
    run("retire", async () => {
      const updated = await api.patch<TemplateRow>(
        `/api/v1/admin/templates/${id}`,
        { archived },
      );
      adopt(updated);
      setNote(archived ? "Archived — no longer offered to colleges." : "Restored to live gallery.");
    });

  const hardDelete = () =>
    run("retire", async () => {
      if (
        !window.confirm(
          `Delete "${template?.name}" permanently? This removes all template records from the database.`,
        )
      ) {
        return;
      }
      await api.del(`/api/v1/admin/templates/${id}?hard=true`);
      navigate("/templates", { replace: true });
    });

  if (error && !template) {
    return (
      <Shell title="Edit Template">
        <p role="alert" className={BANNER_BAD}>
          {error}
        </p>
      </Shell>
    );
  }

  if (!template) {
    return (
      <Shell title="Edit Template">
        <p className="text-sm text-chalk-dim/60">Loading template workbench…</p>
      </Shell>
    );
  }

  return (
    <Shell title={`Edit: ${template.name}`}>
      {/* Studio Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-chalk flex items-center gap-2">
            🎨 Edit Template: {template.name}
            {template.isPublished ? (
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                LIVE
              </span>
            ) : (
              <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
                DRAFT
              </span>
            )}
          </h1>
          <p className="text-xs text-chalk-dim/60 mt-1">
            Update template code, test responsiveness & palette colors, or reconfigure section composition.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/templates")}
            className="rounded-full border border-night-line px-4 py-2 text-xs font-semibold text-chalk-dim hover:text-chalk"
          >
            ← Back to Templates
          </button>
          <button
            type="button"
            onClick={() => void saveDetails()}
            disabled={busy !== null}
            className="rounded-full bg-accent px-5 py-2 text-xs font-bold text-night transition-opacity hover:opacity-90 disabled:opacity-50 shadow-lg"
          >
            {busy === "details" ? "Saving Template…" : "✓ Save Details & Code"}
          </button>
        </div>
      </div>

      {error ? (
        <p role="alert" className={`${BANNER_BAD} mb-6`}>
          {error}
        </p>
      ) : null}
      {note ? <p className={`${BANNER_OK} mb-6`}>{note}</p> : null}

      {/* Main 2-Column Workbench Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Workbench Live Preview & Code Inspector (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col rounded-xl border border-night-line bg-night-raised overflow-hidden">
          {/* Studio Top Control Bar */}
          <div className="flex flex-wrap items-center justify-between border-b border-night-line bg-night p-3 gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setStudioViewport("desktop")}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  studioViewport === "desktop"
                    ? "bg-accent text-night shadow"
                    : "text-chalk-dim hover:text-chalk"
                }`}
              >
                🖥️ Desktop
              </button>
              <button
                type="button"
                onClick={() => setStudioViewport("tablet")}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  studioViewport === "tablet"
                    ? "bg-accent text-night shadow"
                    : "text-chalk-dim hover:text-chalk"
                }`}
              >
                📱 Tablet
              </button>
              <button
                type="button"
                onClick={() => setStudioViewport("mobile")}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  studioViewport === "mobile"
                    ? "bg-accent text-night shadow"
                    : "text-chalk-dim hover:text-chalk"
                }`}
              >
                📲 Mobile
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setStudioTab("preview")}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  studioTab === "preview"
                    ? "bg-night-raised text-chalk border border-night-line"
                    : "text-chalk-dim hover:text-chalk"
                }`}
              >
                👁️ Live Render
              </button>
              <button
                type="button"
                onClick={() => setStudioTab("code")}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  studioTab === "code"
                    ? "bg-night-raised text-chalk border border-night-line"
                    : "text-chalk-dim hover:text-chalk"
                }`}
              >
                💻 Code Inspector
              </button>
            </div>
          </div>

          {/* Color Palette Testing Bar */}
          <div className="flex flex-wrap items-center justify-between border-b border-night-line bg-night/80 px-4 py-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-chalk-dim/60">
                Palette:
              </span>
              <div className="flex flex-wrap gap-1">
                {STUDIO_PALETTES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPalette(p.id)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all ${
                      selectedPalette === p.id
                        ? "border-accent bg-accent/15 text-chalk"
                        : "border-night-line bg-night text-chalk-dim hover:text-chalk"
                    }`}
                  >
                    <span
                      className="size-2 rounded-full border border-white/20"
                      style={{ backgroundColor: p.accent }}
                    />
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Canvas Render Area */}
          <div className="p-4 flex-1 min-h-[500px] flex justify-center bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] overflow-y-auto">
            <div
              className={`transition-all duration-300 w-full h-full min-h-[480px] ${
                studioViewport === "desktop"
                  ? "w-full"
                  : studioViewport === "tablet"
                  ? "w-[768px] border border-night-line rounded-xl overflow-hidden shadow-2xl"
                  : "w-[375px] border-2 border-night-line rounded-2xl overflow-hidden shadow-2xl"
              }`}
            >
              {studioTab === "preview" ? (
                filePreview !== null ? (
                  <iframe
                    title="Template Live Preview"
                    srcDoc={`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <meta charset="utf-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1">
                          <script>
                            (function() {
                              var _warn = console.warn;
                              console.warn = function() {
                                if (arguments[0] && typeof arguments[0] === 'string' && arguments[0].indexOf('cdn.tailwindcss.com') !== -1) return;
                                _warn.apply(console, arguments);
                              };
                            })();
                          </script>
                          <script src="https://cdn.tailwindcss.com"></script>
                          <style>
                            body {
                              background-color: ${currentPalette.bg};
                              color: ${currentPalette.text};
                              font-family: system-ui, -apple-system, sans-serif;
                              margin: 0;
                              padding: 2rem;
                            }
                            .card { background-color: ${currentPalette.cardBg}; border-color: ${currentPalette.border}; }
                            .accent-text { color: ${currentPalette.accent}; }
                            .accent-bg { background-color: ${currentPalette.accent}; color: ${currentPalette.bg}; }
                          </style>
                        </head>
                        <body>
                          ${filePreview
                            .replace(/<script\b[^>]*src=["'](?!https?:\/\/|\/\/)[^"']*["'][^>]*>[\s\S]*?<\/script>/gi, "")
                            .replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["'](?!https?:\/\/|\/\/)[^"']*["'][^>]*>/gi, "")}
                        </body>
                      </html>
                    `}
                    className="w-full h-full min-h-[480px] border-0 bg-white rounded-lg shadow-inner"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[480px] border-2 border-dashed border-night-line rounded-xl bg-night/40 p-8 text-center">
                    <p className="text-sm font-semibold text-chalk mb-1">No Code Code Markup Available</p>
                    <p className="text-xs text-chalk-dim/60">Upload a template file or folder on the right to preview real-time rendering.</p>
                  </div>
                )
              ) : (
                <div className="h-full w-full min-h-[480px] flex flex-col rounded-xl border border-night-line bg-[#0d1117] overflow-hidden">
                  {/* Code Editor Header */}
                  <div className="flex items-center justify-between px-4 py-2 border-b border-night-line bg-night/60">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                      <span className="text-[11px] font-mono font-bold text-emerald-400">HTML Code Editor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-chalk-dim/40 font-mono">
                        {filePreview ? `${filePreview.length.toLocaleString()} chars` : "0 chars"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (filePreview) {
                            void navigator.clipboard.writeText(filePreview);
                          }
                        }}
                        className="text-[10px] font-bold text-chalk-dim hover:text-white px-2 py-0.5 rounded bg-night-line/60 hover:bg-night-line transition-colors cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  {/* Editable Code Textarea */}
                  <textarea
                    value={filePreview ?? ""}
                    onChange={(e) => setFilePreview(e.target.value)}
                    spellCheck={false}
                    placeholder="<!-- Paste or type your HTML section code here... -->"
                    className="flex-1 w-full min-h-[440px] bg-[#0d1117] text-emerald-400 font-mono text-xs leading-relaxed p-4 resize-none border-0 outline-none focus:outline-none placeholder:text-chalk-dim/30"
                    style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'Cascadia Code', monospace" }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Template Fields, Code Upload, Section Composition (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Details & Code Upload Card */}
          <section className="rounded-xl border border-night-line bg-night-raised p-6">
            <h2 className={HEADING}>Template Metadata & Code</h2>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className={LABEL}>Template Name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={INPUT}
                  required
                />
              </label>

              <label className="block">
                <span className={LABEL}>Description</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={2}
                  className={`${INPUT} resize-y`}
                />
              </label>

              <label className="block">
                <span className={LABEL}>Thumbnail Image URL</span>
                <input
                  type="text"
                  placeholder="/template-brightwood.jpg"
                  value={thumbnailUrl}
                  onChange={(event) => setThumbnailUrl(event.target.value)}
                  className={INPUT}
                />
              </label>

              {/* Code File / Folder Uploader */}
              <div className="rounded-xl border border-night-line bg-night p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-chalk-dim">
                    Template Code File / Folder
                  </span>
                  {selectedFiles.length > 0 ? (
                    <button
                      type="button"
                      onClick={handleClearUploadedFiles}
                      className="text-[11px] font-semibold text-red-400 hover:underline"
                    >
                      Clear Upload
                    </button>
                  ) : null}
                </div>

                <input
                  type="file"
                  onChange={(e) => void handleFolderChange(e)}
                  className="w-full text-xs text-chalk-dim file:mr-3 file:rounded-lg file:border-0 file:bg-accent/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-accent hover:file:bg-accent/20"
                />

                {selectedFiles.length > 0 ? (
                  <div className="space-y-2 pt-2 border-t border-night-line">
                    <p className="text-[11px] font-mono text-emerald-400">
                      ✓ Uploaded {selectedFiles.length} file(s) ({folderName})
                    </p>

                    {selectedFiles.length > 1 ? (
                      <select
                        value={selectedPrimaryFile}
                        onChange={(e) => handlePrimaryFileChange(e.target.value)}
                        className="w-full rounded-lg border border-night-line bg-night-raised px-2.5 py-1.5 text-xs text-chalk"
                      >
                        <option value="all">View Stitched Code (All Files)</option>
                        {Object.keys(fileContents).map((pathKey) => (
                          <option key={pathKey} value={pathKey}>
                            {pathKey}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <label className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(event) => setIsPublished(event.target.checked)}
                  className="size-4 accent-accent"
                />
                <span className="text-sm text-chalk">
                  Published
                  <span className="ml-2 text-xs text-chalk-dim/50">
                    Offered in the frontend editor page
                  </span>
                </span>
              </label>
            </div>

            <button
              type="button"
              onClick={() => void saveDetails()}
              disabled={busy !== null}
              className={`${PRIMARY} w-full`}
            >
              {busy === "details" ? "Saving Metadata & Code…" : "Save Details & Code"}
            </button>
          </section>

          {/* Section Composition Card */}
          <section className="rounded-xl border border-night-line bg-night-raised p-6">
            <h2 className={HEADING}>Section Composition</h2>
            <p className="mt-2 text-xs leading-relaxed text-chalk-dim">
              Select which section variant from the library this template leads with for each section type.
            </p>

            <div className="mt-4 space-y-3">
              {template.slots.map((slot) => {
                const options = library.filter(
                  (variant) =>
                    variant.sectionType === slot.sectionType &&
                    (variant.isActive || variant.id === slot.leadVariantId),
                );

                return (
                  <label
                    key={slot.slotId}
                    className="grid gap-2 sm:grid-cols-[7rem_1fr] sm:items-center sm:gap-3"
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
              className={`${PRIMARY} w-full`}
            >
              {busy === "slots" ? "Updating Sections…" : "Save Section Composition"}
            </button>
          </section>

          {/* Actions & Archiving Card */}
          <section className="rounded-xl border border-night-line bg-night-raised p-6">
            <h2 className={HEADING}>Template Availability</h2>
            <p className="mt-2 text-xs leading-relaxed text-chalk-dim">
              {template.colleges
                ? `${template.colleges} college${template.colleges === 1 ? "" : "s"} use this template.`
                : "No colleges are currently using this template."}
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
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
                  Cannot delete while in use by {template.collegeSections} section(s)
                </span>
              )}
            </div>
          </section>
        </div>
      </div>
    </Shell>
  );
}

const HEADING =
  "text-[11px] font-semibold uppercase tracking-[0.24em] text-chalk-dim/50";
const LABEL =
  "text-xs font-semibold uppercase tracking-[0.18em] text-chalk-dim/60";
const INPUT =
  "mt-2 w-full rounded-lg border border-night-line bg-night px-4 py-2.5 text-sm text-chalk outline-none transition focus:border-accent";
const SELECT =
  "w-full rounded-lg border border-night-line bg-night px-3 py-2 text-sm text-chalk outline-none transition focus:border-accent";
const PRIMARY =
  "mt-5 rounded-full bg-accent px-6 py-2.5 text-xs font-bold text-night transition-opacity hover:opacity-90 disabled:opacity-50";
const SECONDARY =
  "rounded-full border border-night-line px-5 py-2.5 text-xs font-semibold text-chalk-dim transition-colors hover:border-chalk-dim/40 hover:text-chalk disabled:opacity-50";
const BANNER_BAD =
  "rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300";
const BANNER_OK =
  "rounded-xl border border-accent/30 bg-accent/10 px-5 py-4 text-sm text-chalk";
