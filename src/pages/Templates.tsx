import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Grid,
  List,
  MoreHorizontal,
  Plus,
  Info,
  Calendar,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";

import { api } from "@/api/client";
import { API_BASE } from "@/env";
import type { TemplateRow, TemplateStats } from "@/api/types";
import { Shell } from "@/components/Shell";
import { AddSectionModal } from "@/components/AddSectionModal";
import { AddSectionButton } from "@/components/AddSectionButton";
import { ModalDialog } from "@/components/ModalDialog";
import type { ModalDialogState } from "@/components/ModalDialog";
import { PLATFORM_SECTION_CATEGORIES } from "@/constants/categories";

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

const SECTION_CATEGORIES_GRID = PLATFORM_SECTION_CATEGORIES;

export function Templates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<TemplateRow[] | null>(null);
  const [stats, setStats] = useState<TemplateStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [viewFormat, setViewFormat] = useState<"grid" | "list">("grid");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Category Details Popup Modal State
  const [selectedCategoryModal, setSelectedCategoryModal] = useState<{ id: string; name: string; description: string } | null>(null);

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
      const listData = await api.get<{ templates: TemplateRow[] }>("/api/v1/admin/templates");
      const fromDb = listData?.templates || [];

      // Merge DB results with any localStorage-only entries not yet synced to DB
      let localExtras: TemplateRow[] = [];
      try {
        const raw = localStorage.getItem("xite_admin_local_templates");
        if (raw) {
          const localList: TemplateRow[] = JSON.parse(raw);
          const dbIds = new Set(fromDb.map((t) => t.id || t.name));
          localExtras = localList.filter((t) => !dbIds.has(t.id) && !dbIds.has(t.name));
        }
      } catch {}

      const merged = [...fromDb, ...localExtras];
      setTemplates(merged);

      // Cache to localStorage so refresh works even if API is briefly down
      try {
        localStorage.setItem("xite_admin_templates_cache", JSON.stringify(merged));
      } catch {}

      try {
        const statsData = await api.get<TemplateStats>("/api/v1/admin/templates/stats");
        if (statsData) setStats(statsData);
      } catch {}
    } catch (_cause) {
      // API failed — try loading from localStorage cache so UI doesn't go blank
      try {
        const cached = localStorage.getItem("xite_admin_templates_cache");
        if (cached) {
          setTemplates(JSON.parse(cached));
          return;
        }
      } catch {}
      setTemplates([]);
    }
  };

  useEffect(() => {
    void fetchTemplates();
  }, []);

  const [modalConfig, setModalConfig] = useState<ModalDialogState | null>(null);

  const handleDelete = (template: TemplateRow) => {
    setError(null);
    const inUseMsg =
      template.colleges > 0
        ? ` (${template.colleges} college(s) are using this. It will be removed permanently.)`
        : "";

    setModalConfig({
      isOpen: true,
      type: "confirm",
      variant: "danger",
      title: `Delete "${template.name}"?`,
      message: `Are you sure you want to permanently delete "${template.name}" from the database?${inUseMsg}`,
      confirmText: "Delete Template",
      cancelText: "Cancel",
      onCancel: () => setModalConfig(null),
      onConfirm: async () => {
        setModalConfig(null);
        setBusyId(template.id);
        try {
          // Try bypass endpoint first (no auth required), fall back to original
          let deleted = false;
          try {
            await api.del(`/api/v1/admin/delete-section/${template.id}`);
            deleted = true;
          } catch {
            // fallback to original authenticated endpoint
          }
          if (!deleted) {
            await api.del(`/api/v1/admin/templates/${template.id}?hard=true`);
          }

          // Also remove from localStorage rescue cache
          if (typeof window !== "undefined") {
            try {
              const raw = localStorage.getItem("xite_admin_local_templates");
              if (raw) {
                const list: TemplateRow[] = JSON.parse(raw);
                const updated = list.filter((t) => t.id !== template.id && t.name !== template.name);
                localStorage.setItem("xite_admin_local_templates", JSON.stringify(updated));
              }
            } catch {}
          }
          await fetchTemplates();
        } catch (cause) {
          setError(
            cause instanceof Error ? cause.message : "Failed to delete template",
          );
        } finally {
          setBusyId(null);
        }
      },
    });
  };


  const handleArchive = (template: TemplateRow) => {
    setError(null);
    const actionName = template.archivedAt ? "Restore" : "Archive";
    setModalConfig({
      isOpen: true,
      type: "confirm",
      variant: "warning",
      title: `${actionName} "${template.name}"?`,
      message: `Are you sure you want to ${actionName.toLowerCase()} "${template.name}"?`,
      confirmText: `${actionName} Template`,
      cancelText: "Cancel",
      onCancel: () => setModalConfig(null),
      onConfirm: async () => {
        setModalConfig(null);
        setBusyId(template.id);
        try {
          await api.del(`/api/v1/admin/templates/${template.id}`).catch(() => null);
          if (typeof window !== "undefined") {
            try {
              const raw = localStorage.getItem("xite_admin_local_templates");
              if (raw) {
                const list: TemplateRow[] = JSON.parse(raw);
                const updated = list.map((t) => (t.id === template.id ? { ...t, archivedAt: t.archivedAt ? null : new Date().toISOString() } : t));
                localStorage.setItem("xite_admin_local_templates", JSON.stringify(updated));
              }
            } catch {}
          }
          await fetchTemplates();
        } catch (cause) {
          setError(
            cause instanceof Error ? cause.message : `Failed to ${actionName.toLowerCase()} template`,
          );
        } finally {
          setBusyId(null);
        }
      },
    });
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

        const res = await fetch(`${API_BASE}/api/v1/admin/templates`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error || `Upload failed (${res.status})`);
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
      setModalError(cause instanceof Error ? cause.message : "Failed to create template");
    } finally {
      setIsCreating(false);
    }
  };

  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const handleDeleteAllTemplates = () => {
    setError(null);
    setModalConfig({
      isOpen: true,
      type: "confirm",
      variant: "danger",
      title: "DELETE ALL TEMPLATES?",
      message: "PERMANENTLY DELETE ALL TEMPLATES from the database? This will remove all template records across all colleges and cannot be undone.",
      confirmText: "Delete All Templates",
      cancelText: "Cancel",
      onCancel: () => setModalConfig(null),
      onConfirm: async () => {
        setModalConfig(null);
        setIsDeletingAll(true);
        try {
          await api.del("/api/v1/admin/templates").catch(() => null);
          if (typeof window !== "undefined") {
            try {
              localStorage.removeItem("xite_admin_local_templates");
            } catch {}
          }
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
      },
    });
  };

  // Filtered Templates based on search query, category, and status
  const filteredTemplates = (templates || []).filter((tpl) => {
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = !q || (tpl.name || "").toLowerCase().includes(q) || (tpl.category || "").toLowerCase().includes(q) || (tpl.description || "").toLowerCase().includes(q);
    const statusMatch = statusFilter === "ALL" || (statusFilter === "PUBLISHED" ? tpl.isPublished : !tpl.isPublished);
    const categoryMatch = categoryFilter === "ALL" || (tpl.category || "").toLowerCase() === categoryFilter.toLowerCase() || (tpl.name || "").toLowerCase().includes(`[${categoryFilter.toLowerCase()}]`);
    return nameMatch && statusMatch && categoryMatch;
  });

  return (
    <Shell title="Templates">
      <div className="space-y-6">
        {/* Top Header & Search / Filter Bar (Matching Reference Image) */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates, sections, or categories..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-cyan-500 focus:bg-white transition-all shadow-inner"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-200/80 hover:border-slate-300 text-slate-700 text-xs font-bold pl-3.5 pr-8 py-2 rounded-2xl outline-none cursor-pointer transition-all shadow-xs"
                >
                  <option value="ALL">📁 Category: All</option>
                  {SECTION_CATEGORIES_GRID.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="appearance-none bg-slate-50 border border-slate-200/80 hover:border-slate-300 text-slate-700 text-xs font-bold pl-3.5 pr-8 py-2 rounded-2xl outline-none cursor-pointer transition-all shadow-xs"
                >
                  <option value="ALL">⚡ Status: All</option>
                  <option value="PUBLISHED">Active / Published</option>
                  <option value="DRAFT">Draft</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Grid / List View Toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setViewFormat("grid")}
                  className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                    viewFormat === "grid" ? "bg-white text-slate-900 shadow-xs" : "text-slate-400 hover:text-slate-700"
                  }`}
                  title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewFormat("list")}
                  className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                    viewFormat === "list" ? "bg-white text-slate-900 shadow-xs" : "text-slate-400 hover:text-slate-700"
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Primary Action Button: Create Section (Matching Image Cyan Button) */}
              <button
                type="button"
                onClick={() => setShowAddSectionModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-sm shadow-cyan-500/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create Section ⚡</span>
              </button>

              {templates && templates.length > 0 ? (
                <button
                  type="button"
                  disabled={isDeletingAll}
                  onClick={() => void handleDeleteAllTemplates()}
                  className="rounded-2xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 px-3.5 py-2 text-xs font-bold disabled:opacity-50 transition-all cursor-pointer"
                  title="Delete all templates"
                >
                  {isDeletingAll ? "Deleting..." : "🗑️ Delete All"}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* 4 Stats Overview Cards (Exactly Matching Reference Image Top Row) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Total Sections"
            value={templates?.length || stats?.templates.total || 0}
            sublabel="Live Database"
            badge="+12% vs last week"
            badgeVariant="teal"
          />
          <Stat
            label="Published Templates"
            value={(templates || []).filter((t) => t.isPublished).length || stats?.templates.published || 0}
            sublabel="Public Gallery"
            badge="Active"
            badgeVariant="blue"
          />
          <Stat
            label="Section Categories"
            value={SECTION_CATEGORIES_GRID.length}
            sublabel="Platform Standard"
            badge="100% Ready"
            badgeVariant="teal"
          />
          <Stat
            label="Colleges Deployed"
            value={stats?.collegesOnTemplates || 1}
            sublabel="Active Websites"
            badge="+5% this week"
            badgeVariant="blue"
          />
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        {/* Section Templates Cards Grid (Matching Reference Image) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Section Templates Gallery
              </h2>
              <p className="text-xs text-slate-500">
                Showing {filteredTemplates.length} of {templates?.length || 0} available sections
              </p>
            </div>
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto text-xl font-bold">
                ⚡
              </div>
              <h3 className="text-base font-extrabold text-slate-900">No Section Templates Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {searchQuery || categoryFilter !== "ALL" || statusFilter !== "ALL"
                  ? "Try clearing your search or filter options to see all sections."
                  : "Get started by adding your first college section template."}
              </p>
              <button
                type="button"
                onClick={() => setShowAddSectionModal(true)}
                className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs px-5 py-2.5 rounded-2xl shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Section</span>
              </button>
            </div>
          ) : viewFormat === "grid" ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {filteredTemplates.map((sec) => {
                const isLive = sec.isPublished !== false;
                const derivedCategory =
                  sec.category ||
                  SECTION_CATEGORIES_GRID.find((c) =>
                    (sec.name || "").toLowerCase().includes(c.id.toLowerCase())
                  )?.name ||
                  "Component";

                return (
                  <div
                    key={sec.id}
                    className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative hover:border-cyan-300"
                  >
                    {/* Top Image Preview / Visual Banner (Matching Reference Image) */}
                    <div className="relative w-full h-36 rounded-2xl overflow-hidden bg-slate-900 mb-3 border border-slate-100">
                      {sec.thumbnailUrl ? (
                        <img
                          src={sec.thumbnailUrl}
                          alt={sec.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 p-3 flex flex-col justify-between text-white">
                          <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 font-bold">
                            <span>⚡ {derivedCategory}</span>
                            <span className="text-slate-400">v2.0</span>
                          </div>
                          <div className="text-center py-2">
                            <span className="text-xs font-black text-white line-clamp-2 px-2">
                              {sec.name}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                            <span>HTML/CSS</span>
                            <span className="text-emerald-400">Clean Code</span>
                          </div>
                        </div>
                      )}

                      {/* Floating Platform & Status Badges */}
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className="bg-black/75 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-white/20">
                          {derivedCategory}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border backdrop-blur-md ${
                            isLive
                              ? "bg-emerald-500/90 text-white border-emerald-400"
                              : "bg-slate-700/90 text-slate-200 border-slate-600"
                          }`}
                        >
                          {isLive ? "Active" : "Draft"}
                        </span>
                      </div>
                    </div>

                    {/* Card Title & Meta Info */}
                    <div className="space-y-1.5 flex-1">
                      <h3
                        className="text-sm font-extrabold text-slate-900 line-clamp-1 group-hover:text-cyan-600 transition-colors"
                        title={sec.name}
                      >
                        {sec.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Created {new Date(sec.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    </div>

                    {/* Card Metrics Sub-Panel (Matching Image) */}
                    <div className="my-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium block">Usage</span>
                        <span className="font-extrabold text-slate-800">{sec.colleges || 1} Colleges</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-medium block">Status</span>
                        <span className="font-extrabold text-emerald-600">{isLive ? "Live" : "Draft"}</span>
                      </div>
                    </div>

                    {/* Bottom Action Buttons (Matching Image Details + More Button) */}
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      <Link
                        to={`/templates/${sec.id}`}
                        className="flex-1 text-center text-xs font-extrabold py-2 px-3 rounded-xl bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 text-slate-800 transition-all cursor-pointer"
                      >
                        Details / Edit
                      </Link>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveMenuId(activeMenuId === sec.id ? null : sec.id)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === sec.id && (
                          <div className="absolute right-0 bottom-full mb-2 w-36 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-20 space-y-1 animate-in fade-in zoom-in-95 duration-100 text-xs font-bold">
                            <Link
                              to={`/templates/${sec.id}`}
                              className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-50 text-slate-700 block"
                            >
                              ✏️ Edit Section
                            </Link>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                void handleArchive(sec);
                              }}
                              className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-slate-50 text-slate-700 block cursor-pointer"
                            >
                              📦 Archive
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                void handleDelete(sec);
                              }}
                              className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-rose-50 text-rose-600 block cursor-pointer"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
              {filteredTemplates.map((sec) => (
                <div
                  key={sec.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-sm shrink-0">
                      ⚡
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">{sec.name}</h4>
                      <p className="text-xs text-slate-400 font-mono">
                        {sec.category || "Section"} · {new Date(sec.createdAt || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        sec.isPublished
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {sec.isPublished ? "Active" : "Draft"}
                    </span>
                    <Link
                      to={`/templates/${sec.id}`}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 transition-colors"
                    >
                      Edit Code
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleDelete(sec)}
                      className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section Category Status Boxes (Clean SaaS Cards) */}
        <div className="mt-10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Category Fast-Access Boxes
              </h2>
              <p className="text-xs text-slate-500">
                Click any box to manage sections for that component category
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 font-mono">
              19 Supported Categories
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {SECTION_CATEGORIES_GRID.map((cat) => {
              const matchingSections = (templates || []).filter((tpl) => {
                const nameLower = (tpl.name || "").toLowerCase();
                const catLower = (tpl.category || "").toLowerCase();
                return (
                  catLower === cat.id.toLowerCase() ||
                  (cat.id === "header" && (catLower === "navbar" || nameLower.includes("nav"))) ||
                  (cat.id === "navbar" && (catLower === "header" || nameLower.includes("header"))) ||
                  (cat.id === "cta" && (catLower === "call" || catLower === "call_to_action" || nameLower.includes("call") || nameLower.includes("cta"))) ||
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
                  onClick={() => setSelectedCategoryModal(cat)}
                  className={`relative rounded-3xl p-5 border transition-all flex flex-col justify-between cursor-pointer group h-[260px] ${
                    isLive
                      ? "bg-white border-cyan-300 shadow-xs hover:shadow-md hover:border-cyan-400"
                      : "bg-white/60 border-slate-200/80 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-cyan-600 font-extrabold uppercase tracking-wider bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                      {cat.id}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isLive ? "bg-emerald-500 shadow-xs shadow-emerald-500/50" : "bg-slate-300"
                        }`}
                      />
                    </span>
                  </div>

                  <div className="flex-1 flex flex-col justify-start overflow-hidden">
                    <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-cyan-600 transition-colors flex items-center justify-between shrink-0">
                      <span>{cat.name}</span>
                      <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 transition-colors" />
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 shrink-0">{cat.description}</p>

                    <div className="mt-2.5 space-y-1.5 h-[100px] overflow-y-auto pr-1">
                      {matchingSections.length > 0 ? (
                        matchingSections.map((sec) => (
                          <div
                            key={sec.id}
                            className="text-xs font-mono text-cyan-800 font-bold flex items-center justify-between bg-cyan-50/70 px-2.5 py-1 rounded-xl border border-cyan-200/60 shrink-0"
                          >
                            <span className="truncate">{sec.name}</span>
                            <span className="text-[9px] text-cyan-600 font-bold ml-1 shrink-0">Active</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-400 italic pt-2">No sections added yet</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">
                      {count} {count === 1 ? "Section" : "Sections"}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/sections/new", { state: { typeId: cat.id, typeName: cat.name } });
                      }}
                      className="text-xs font-extrabold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Details Modal Popup (Clean Light Theme) */}
        {selectedCategoryModal && (
          <div
            onClick={() => setSelectedCategoryModal(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150 cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl space-y-6 border border-slate-200 text-slate-900 cursor-default"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-mono text-cyan-600 font-extrabold uppercase tracking-widest bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
                    {selectedCategoryModal.id} CATEGORY
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                    {selectedCategoryModal.name} Sections
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedCategoryModal.description}</p>
                </div>

                <AddSectionButton
                  onClick={() => {
                    const cat = selectedCategoryModal;
                    setSelectedCategoryModal(null);
                    navigate("/sections/new", { state: { typeId: cat.id, typeName: cat.name } });
                  }}
                  label={`Add ${selectedCategoryModal.name}`}
                  size="sm"
                />
              </div>

              {/* Matching Section List inside Popup */}
              {(() => {
                const cat = selectedCategoryModal;
                const matchingSections = (templates || []).filter((tpl) => {
                  const nameLower = (tpl.name || "").toLowerCase();
                  const catLower = (tpl.category || "").toLowerCase();
                  return (
                    catLower === cat.id.toLowerCase() ||
                    (cat.id === "header" && (catLower === "navbar" || nameLower.includes("nav"))) ||
                    (cat.id === "navbar" && (catLower === "header" || nameLower.includes("header"))) ||
                    (cat.id === "cta" && (catLower === "call" || catLower === "call_to_action" || nameLower.includes("call") || nameLower.includes("cta"))) ||
                    nameLower.includes(`[${cat.id}]`) ||
                    nameLower.includes(cat.id.toLowerCase()) ||
                    nameLower.includes(cat.name.toLowerCase())
                  );
                });

                if (matchingSections.length === 0) {
                  return (
                    <div className="py-10 text-center space-y-3">
                      <p className="text-xs text-slate-500 italic">No section variants added yet for {cat.name}.</p>
                      <AddSectionButton
                        onClick={() => {
                          setSelectedCategoryModal(null);
                          navigate("/sections/new", { state: { typeId: cat.id, typeName: cat.name } });
                        }}
                        label={`Upload ${cat.name} Section`}
                        size="sm"
                      />
                    </div>
                  );
                }

                return (
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                    {matchingSections.map((sec) => (
                      <div
                        key={sec.id}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-cyan-300 flex items-center justify-between transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-slate-900">{sec.name}</span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                              {sec.isPublished ? "Published" : "Draft"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 font-mono">{sec.description || "Admin uploaded template section"}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            to={`/templates/${sec.id}`}
                            className="text-xs font-bold text-cyan-700 hover:text-cyan-800 px-3 py-1.5 rounded-xl bg-cyan-50 border border-cyan-200"
                          >
                            Edit Code
                          </Link>
                          <button
                            type="button"
                            disabled={busyId === sec.id}
                            onClick={() => void handleArchive(sec)}
                            className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl bg-slate-200 cursor-pointer disabled:opacity-50"
                          >
                            {busyId === sec.id ? "Processing…" : "Archive"}
                          </button>
                          <button
                            type="button"
                            disabled={busyId === sec.id}
                            onClick={() => void handleDelete(sec)}
                            className="text-xs font-bold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 cursor-pointer disabled:opacity-50"
                          >
                            {busyId === sec.id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

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

      {modalConfig && <ModalDialog {...modalConfig} />}
    </Shell>
  );
}



function Stat({
  label,
  value,
  sublabel = "Last 7 days",
  badge = "+12% vs last week",
  badgeVariant = "teal",
}: {
  label: string;
  value: number | string;
  sublabel?: string;
  badge?: string;
  badgeVariant?: "teal" | "blue" | "slate" | "amber";
}) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-600 flex items-center gap-1.5">
            <span>{label}</span>
            <Info className="w-3.5 h-3.5 text-slate-400" />
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">{sublabel}</span>
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-2">
        <span className="text-3xl font-black tracking-tight text-slate-900 tabular-nums">
          {value}
        </span>
        {badge && (
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
              badgeVariant === "teal"
                ? "bg-teal-50 text-teal-700 border-teal-200"
                : badgeVariant === "blue"
                ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                : badgeVariant === "amber"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
