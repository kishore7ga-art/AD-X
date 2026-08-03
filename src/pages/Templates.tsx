import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "@/api/client";
import { API_BASE } from "@/env";
import type { TemplateRow, TemplateStats } from "@/api/types";
import { Shell } from "@/components/Shell";
import { AddSectionModal } from "@/components/AddSectionModal";

/**
 * Every template in the database, drafts and archived included.
 *
 * Allows admins to view all templates, edit composition, delete unused templates
 * permanently, archive templates in use, or create new templates that instantly
 * appear in the gallery and editor page once published.
 */
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

const SECTION_CATEGORIES_GRID = [
  { id: "hero", name: "Hero Banner", description: "Lead banner & title headline" },
  { id: "about", name: "About Us", description: "History, vision & mission statement" },
  { id: "courses", name: "Academics & Courses", description: "Degree programs & department grid" },
  { id: "faculty", name: "Faculty Roster", description: "Professors & department heads" },
  { id: "events", name: "Events & News", description: "Upcoming campus events & highlights" },
  { id: "contact", name: "Contact & Map", description: "Campus address, helpline & map" },
  { id: "placements", name: "Placements & Careers", description: "Recruiters & placement stats" },
  { id: "scholarships", name: "Scholarships & Grants", description: "Financial aid & merit awards" },
];

export function Templates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<TemplateRow[] | null>(null);
  const [stats, setStats] = useState<TemplateStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Add Section Modal State
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  // Add Template Modal & Workbench Studio State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newThumbnailUrl, setNewThumbnailUrl] = useState("");
  const [newIsPublished, setNewIsPublished] = useState(true);

  // Folder & File Upload State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [selectedPrimaryFile, setSelectedPrimaryFile] = useState<string>("all");
  const [folderName, setFolderName] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // Workbench Testing State
  const [studioViewport, setStudioViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [studioTab, setStudioTab] = useState<"preview" | "code">("preview");
  const [selectedPalette, setSelectedPalette] = useState("dark");
  const [isCreating, setIsCreating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const currentPalette =
    STUDIO_PALETTES.find((p) => p.id === selectedPalette) ?? STUDIO_PALETTES[0]!;

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
    const inUseMsg =
      template.colleges > 0
        ? ` (${template.colleges} college(s) are using this. It will be removed from all live colleges and the database permanently.)`
        : "";
    if (
      !window.confirm(
        `Permanently delete "${template.name}" from the live database for ALL users?${inUseMsg}`,
      )
    ) {
      return;
    }
    setBusyId(template.id);
    try {
      await api.del(`/api/v1/admin/templates/${template.id}?hard=true`);
      await fetchTemplates();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Failed to delete template",
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleArchive = async (template: TemplateRow) => {
    setError(null);
    const actionName = template.archivedAt ? "Restore" : "Archive";
    if (!window.confirm(`${actionName} template "${template.name}"?`)) {
      return;
    }
    setBusyId(template.id);
    try {
      await api.del(`/api/v1/admin/templates/${template.id}`);
      await fetchTemplates();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : `Failed to ${actionName.toLowerCase()} template`,
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleFolderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) {
      setSelectedFiles([]);
      setFileContents({});
      setFilePreview(null);
      setFolderName(null);
      return;
    }

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
      setModalError("No valid template code files found in selected upload.");
      setSelectedFiles([]);
      setFileContents({});
      setFilePreview(null);
      setFolderName(null);
      return;
    }

    const totalSize = filesArray.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > 10 * 1024 * 1024) {
      setModalError("Total upload size exceeds 10MB limit.");
      setSelectedFiles([]);
      setFileContents({});
      setFilePreview(null);
      setFolderName(null);
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

    setModalError(null);
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

  const handleClearFiles = () => {
    setSelectedFiles([]);
    setFileContents({});
    setFilePreview(null);
    setFolderName(null);
    setSelectedPrimaryFile("all");
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
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        formData.append("name", newName.trim());
        if (newDescription.trim()) {
          formData.append("description", newDescription.trim());
        }
        if (newThumbnailUrl.trim()) {
          formData.append("thumbnailUrl", newThumbnailUrl.trim());
        }
        formData.append("isPublished", String(newIsPublished));

        selectedFiles.forEach((file) => {
          formData.append("files", file, file.webkitRelativePath || file.name);
        });

        const response = await fetch(`${API_BASE}/api/v1/admin/templates`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(payload?.error ?? `Request failed (${response.status})`);
        }
      } else {
        await api.post("/api/v1/admin/templates", {
          name: newName.trim(),
          description: newDescription.trim() || undefined,
          thumbnailUrl: newThumbnailUrl.trim() || undefined,
          isPublished: newIsPublished,
        });
      }

      setNewName("");
      setNewDescription("");
      setNewThumbnailUrl("");
      setNewIsPublished(true);
      setSelectedFiles([]);
      setFileContents({});
      setFilePreview(null);
      setFolderName(null);
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

  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const handleDeleteAllTemplates = async () => {
    setError(null);
    if (
      !window.confirm(
        "PERMANENTLY DELETE ALL TEMPLATES from the database? This will remove all template records across all colleges and cannot be undone.",
      )
    ) {
      return;
    }
    setIsDeletingAll(true);
    try {
      await api.del("/api/v1/admin/templates");
      await fetchTemplates();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Failed to delete all templates",
      );
    } finally {
      setIsDeletingAll(false);
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
        <div className="flex items-center gap-3">
          {templates && templates.length > 0 ? (
            <button
              type="button"
              disabled={isDeletingAll}
              onClick={() => void handleDeleteAllTemplates()}
              className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-50 transition-all"
            >
              {isDeletingAll ? "Deleting All…" : "🗑️ Delete All Sections"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setShowAddSectionModal(true)}
            className="rounded-xl bg-white px-5 py-2.5 text-xs font-black text-black transition-all hover:bg-neutral-200 cursor-pointer shadow-lg"
          >
            + Add Section
          </button>
        </div>
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

      {/* Section Category Status Boxes Grid (Matching Screenshot 3) */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black tracking-widest text-neutral-400 uppercase">
            Section Category Boxes
          </h2>
          <span className="text-xs text-neutral-500 font-mono">
            {templates?.length || 0} Total Admin Sections
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {SECTION_CATEGORIES_GRID.map((cat) => {
            const matchingSections = (templates || []).filter((tpl) => {
              const nameLower = (tpl.name || "").toLowerCase();
              return (
                nameLower.includes(`[${cat.id}]`) ||
                nameLower.includes(cat.id.toLowerCase()) ||
                nameLower.includes(cat.name.toLowerCase())
              );
            });

            const count = matchingSections.length;
            const isLive = count > 0;

            return (
              <div
                key={cat.id}
                className={`relative rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                  isLive
                    ? "bg-[#11161d] border-emerald-500/40 hover:border-emerald-500/70 shadow-lg"
                    : "bg-[#0d1117] border-neutral-800 hover:border-neutral-700"
                }`}
              >
                {/* Status Indicator Dot (Matching Screenshot 3) */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider">
                    {cat.id}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isLive ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-amber-500/60"
                      }`}
                    />
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-black text-white">{cat.name}</h3>
                  <p className="text-[11px] text-neutral-500 mt-0.5">{cat.description}</p>

                  {/* List of Section Names inside this Box */}
                  <div className="mt-3 space-y-1.5 min-h-[48px]">
                    {matchingSections.length > 0 ? (
                      matchingSections.map((sec) => (
                        <div
                          key={sec.id}
                          className="text-xs font-mono text-emerald-400 font-bold flex items-center justify-between bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-800/40"
                        >
                          <span className="truncate">{sec.name}</span>
                          <span className="text-[9px] text-emerald-300 font-normal">Active</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-neutral-500 italic">No sections added yet</p>
                    )}
                  </div>
                </div>

                {/* Quick Add Button */}
                <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-400">
                    {count} {count === 1 ? "Section" : "Sections"}
                  </span>
                  <button
                    onClick={() => navigate("/sections/new", { state: { typeId: cat.id, typeName: cat.name } })}
                    className="text-xs font-extrabold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                  >
                    + Add {cat.name}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
                        onClick={() => void handleArchive(template)}
                        className="text-xs font-medium text-chalk-dim hover:text-chalk disabled:opacity-50"
                        title={
                          template.archivedAt
                            ? "Restore template to gallery"
                            : "Archive template"
                        }
                      >
                        {template.archivedAt ? "Restore" : "Archive"}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === template.id}
                        onClick={() => void handleDelete(template)}
                        className="text-xs font-medium text-red-400 hover:text-red-300 disabled:opacity-50"
                        title="Permanently delete template across all users and database"
                      >
                        {busyId === template.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Full-Page Studio Workbench Modal */}
      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#090D14] text-chalk overflow-hidden animate-in fade-in duration-200">
          {/* Studio Top Header Bar */}
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-night-line bg-night-raised px-6">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-accent/10 border border-accent/30 text-accent font-bold text-sm">
                🎨
              </div>
              <div>
                <h2 className="text-sm font-bold text-chalk flex items-center gap-2">
                  Template Studio Workbench
                  {selectedFiles.length > 0 ? (
                    <span className="rounded-full bg-accent/20 border border-accent/40 px-2.5 py-0.5 text-[10px] font-mono text-accent">
                      📁 {folderName || `${selectedFiles.length} file(s)`}
                    </span>
                  ) : null}
                </h2>
                <p className="text-[11px] text-chalk-dim/60">
                  Upload layout code folder, test responsiveness & theme color palettes in real-time.
                </p>
              </div>
            </div>

            {/* Viewport & View Mode Toggles */}
            <div className="hidden md:flex items-center gap-2 rounded-xl border border-night-line bg-night p-1">
              <div className="flex items-center gap-1 pr-2 border-r border-night-line">
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
                  📱 Tablet (768px)
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
                  📲 Mobile (375px)
                </button>
              </div>

              <div className="flex items-center gap-1 pl-1">
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

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  handleClearFiles();
                }}
                className="rounded-full border border-night-line px-4 py-1.5 text-xs font-semibold text-chalk-dim hover:text-chalk hover:border-chalk-dim/40"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-template-form"
                disabled={isCreating}
                className="rounded-full bg-accent px-5 py-1.5 text-xs font-bold text-night shadow-lg transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isCreating ? "Saving Template…" : "✓ Add to Database"}
              </button>
            </div>
          </header>

          {/* Main 2-Column Grid Body */}
          <div className="grid flex-1 grid-cols-1 lg:grid-cols-12 overflow-hidden">
            {/* Left Side: Live Preview & Canvas Testing (8 Columns) */}
            <main className="lg:col-span-8 flex flex-col bg-[#05080E] border-r border-night-line overflow-hidden">
              {/* Toolbar: Color Palette Switcher */}
              <div className="flex items-center justify-between border-b border-night-line bg-night/80 px-6 py-2.5 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-chalk-dim/60 mr-2">
                    Color Palette Testing:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {STUDIO_PALETTES.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPalette(p.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                          selectedPalette === p.id
                            ? "border-accent bg-accent/15 text-chalk shadow-sm"
                            : "border-night-line bg-night text-chalk-dim hover:text-chalk"
                        }`}
                      >
                        <span
                          className="size-2.5 rounded-full border border-white/20"
                          style={{ backgroundColor: p.accent }}
                        />
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] font-mono text-chalk-dim/50 hidden sm:block">
                  Viewport: {studioViewport === "desktop" ? "100%" : studioViewport === "tablet" ? "768px" : "375px"}
                </div>
              </div>

              {/* Viewport Canvas Container */}
              <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
                <div
                  className={`transition-all duration-300 h-full flex flex-col ${
                    studioViewport === "desktop"
                      ? "w-full"
                      : studioViewport === "tablet"
                      ? "w-[768px] shadow-2xl border border-night-line rounded-xl overflow-hidden"
                      : "w-[375px] shadow-2xl border-4 border-night-line rounded-3xl overflow-hidden"
                  }`}
                >
                  {studioTab === "preview" ? (
                    filePreview !== null ? (
                      <iframe
                        title="Template Section Preview"
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
                              ${(filePreview ?? "")
                                .replace(/<script\b[^>]*src=["'](?!https?:\/\/|\/\/)[^"']*["'][^>]*>[\s\S]*?<\/script>/gi, "")
                                .replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["'](?!https?:\/\/|\/\/)[^"']*["'][^>]*>/gi, "")}
                            </body>
                          </html>
                        `}
                        className="w-full h-full min-h-[500px] border-0 bg-white rounded-lg shadow-inner"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full min-h-[450px] border-2 border-dashed border-night-line rounded-2xl bg-night/40 p-8 text-center">
                        <div className="size-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-3xl mb-4 animate-pulse">
                          📂
                        </div>
                        <h3 className="text-base font-bold text-chalk mb-1">
                          No Code File Uploaded Yet
                        </h3>
                        <p className="max-w-md text-xs text-chalk-dim/70 leading-relaxed mb-6">
                          Select or drag a template code file (<code className="text-accent font-mono">.html</code>, <code className="text-accent font-mono">.blade.php</code>, <code className="text-accent font-mono">.jsx</code>, <code className="text-accent font-mono">.vue</code>) on the right panel to generate real-time live preview.
                        </p>
                      </div>
                    )
                  ) : (
                    /* Code Inspector Mode */
                    <div className="h-full w-full rounded-xl border border-night-line bg-night p-4 overflow-y-auto font-mono text-xs text-chalk-dim">
                      {filePreview !== null ? (
                        <pre className="whitespace-pre-wrap break-all leading-relaxed text-emerald-400">
                          {filePreview}
                        </pre>
                      ) : (
                        <p className="text-chalk-dim/50 italic text-center py-12">
                          Upload a file to inspect full code markup.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </main>

            {/* Right Side: Metadata Form & File Upload (4 Columns) */}
            <aside className="lg:col-span-4 bg-night-raised flex flex-col overflow-y-auto p-6 space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-chalk-dim/70 mb-1">
                  Template Information
                </h3>
                <p className="text-xs text-chalk-dim/50">
                  Configure template metadata stored in the database.
                </p>
              </div>

              {modalError ? (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
                  {modalError}
                </p>
              ) : null}

              <form
                id="create-template-form"
                onSubmit={(e) => void handleCreateTemplate(e)}
                className="space-y-5"
              >
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-chalk-dim mb-1.5">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zenith Medical"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded-xl border border-night-line bg-night px-4 py-2.5 text-sm text-chalk focus:border-accent outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-chalk-dim mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Clean layout designed for medical institutes"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full rounded-xl border border-night-line bg-night px-4 py-2.5 text-sm text-chalk focus:border-accent outline-none resize-y transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-chalk-dim mb-1.5">
                    Thumbnail URL (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={newThumbnailUrl}
                    onChange={(e) => setNewThumbnailUrl(e.target.value)}
                    className="w-full rounded-xl border border-night-line bg-night px-4 py-2.5 text-sm text-chalk focus:border-accent outline-none transition-colors"
                  />
                </div>

                {/* Folder & Multi-File Upload Section */}
                <div className="rounded-xl border border-night-line bg-night/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-accent">
                      Template Folder Upload
                    </label>
                    <span className="text-[10px] text-chalk-dim/60">
                      Upload entire directory or files
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Select Folder Button */}
                    <label className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-accent/40 bg-accent/5 hover:bg-accent/10 cursor-pointer transition-colors text-center">
                      <span className="text-xl">📁</span>
                      <span className="mt-1 text-xs font-bold text-accent">Select Folder</span>
                      <span className="text-[9px] text-chalk-dim/60">Full directory upload</span>
                      <input
                        type="file"
                        // @ts-expect-error - webkitdirectory directory attributes
                        webkitdirectory=""
                        directory=""
                        multiple
                        onChange={handleFolderChange}
                        className="hidden"
                      />
                    </label>

                    {/* Select Files Button */}
                    <label className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-night-line bg-night hover:bg-night-raised cursor-pointer transition-colors text-center">
                      <span className="text-xl">📄</span>
                      <span className="mt-1 text-xs font-bold text-chalk-dim hover:text-chalk">
                        Select Files
                      </span>
                      <span className="text-[9px] text-chalk-dim/60">Multiple code files</span>
                      <input
                        type="file"
                        multiple
                        accept=".html,.htm,.blade.php,.jsx,.vue,.txt,.php,.js,.tsx,.ts,.css"
                        onChange={handleFolderChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {selectedFiles.length > 0 ? (
                    <div className="rounded-lg border border-accent/30 bg-accent/10 p-3 space-y-2">
                      <div className="flex items-center justify-between border-b border-accent/20 pb-2">
                        <div>
                          <span className="text-xs font-bold text-accent block truncate max-w-[190px]">
                            📁 {folderName || "Uploaded Folder"}
                          </span>
                          <span className="text-[10px] text-chalk-dim/70">
                            {selectedFiles.length} file(s) ·{" "}
                            {(
                              selectedFiles.reduce((sum, f) => sum + f.size, 0) / 1024
                            ).toFixed(1)}{" "}
                            KB total
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearFiles}
                          className="text-[11px] font-medium text-red-400 hover:text-red-300 hover:underline"
                        >
                          Clear
                        </button>
                      </div>

                      {/* Primary File Selector */}
                      {selectedFiles.length > 1 ? (
                        <div>
                          <label className="block text-[10px] uppercase font-semibold text-chalk-dim mb-1">
                            Active Preview File:
                          </label>
                          <select
                            value={selectedPrimaryFile}
                            onChange={(e) => handlePrimaryFileChange(e.target.value)}
                            className="w-full rounded bg-night border border-night-line px-2.5 py-1.5 text-xs text-chalk outline-none focus:border-accent"
                          >
                            <option value="all">✨ All Files (Stitched Layout)</option>
                            {Object.keys(fileContents).map((pathKey) => (
                              <option key={pathKey} value={pathKey}>
                                📄 {pathKey}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-[11px] text-chalk-dim/50 leading-relaxed">
                      Select a folder containing your section files, HTML, Blade/JSX/Vue layouts, or CSS. All code files will be parsed and stored.
                    </p>
                  )}
                </div>

                <label className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    checked={newIsPublished}
                    onChange={(e) => setNewIsPublished(e.target.checked)}
                    className="size-4 accent-accent rounded"
                  />
                  <span className="text-xs font-medium text-chalk">
                    Publish immediately
                    <span className="block text-[11px] text-chalk-dim/50">
                      Visible in frontend gallery and editor page
                    </span>
                  </span>
                </label>
              </form>
            </aside>
          </div>
        </div>
      ) : null}

      {/* Add Section Type Modal */}
      <AddSectionModal
        isOpen={showAddSectionModal}
        onClose={() => setShowAddSectionModal(false)}
        onSelectSectionType={(selected: { id: string; name: string }) => {
          navigate("/sections/new", {
            state: { typeId: selected.id, typeName: selected.name },
          });
        }}
      />
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
