import { useEffect, useState, useMemo } from "react";
import {
  BookOpen,
  Check,
  CheckCheck,
  Edit2,
  Filter,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

import { api, ApiError } from "@/api/client";
import { Shell } from "@/components/Shell";
import { ModalDialog } from "@/components/ModalDialog";
import type { ModalDialogState } from "@/components/ModalDialog";
import { PLATFORM_SECTION_CATEGORIES } from "@/constants/categories";
import { previewDocument } from "@/lib/preview-document";

export type ReferenceSection = {
  id: string;
  category: string;
  title: string;
  description: string;
  headCss?: string;
  bodyHtml: string;
  source: "admin_seed" | "ai_generated";
  status: "approved" | "pending_review" | "rejected";
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
};

function combineSectionCode(headCss: string, bodyHtml: string): string {
  const css = headCss ? headCss.trim() : "";
  if (!css) return bodyHtml;
  return `<style>\n${css}\n</style>\n${bodyHtml}`;
}

export function ReferenceLibrary() {
  const [activeTab, setActiveTab] = useState<"approved" | "pending_review">("approved");
  const [sections, setSections] = useState<ReferenceSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Bulk Selection (Pending Review)
  const [selectedPendingIds, setSelectedPendingIds] = useState<Set<string>>(new Set());

  // Modal State for Create / Edit
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<ReferenceSection | null>(null);
  const [editorCategory, setEditorCategory] = useState<string>("hero");
  const [editorTitle, setEditorTitle] = useState("");
  const [editorDescription, setEditorDescription] = useState("");
  const [editorHeadCss, setEditorHeadCss] = useState("");
  const [editorBodyHtml, setEditorBodyHtml] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);

  // Expansion generation in progress
  const [isExpanding, setIsExpanding] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dialog State
  const [modalConfig, setModalConfig] = useState<ModalDialogState | null>(null);

  const fetchSections = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<{ sections: ReferenceSection[] }>(
        `/api/v1/admin/reference-sections?status=${activeTab}`
      );
      setSections(data.sections || []);
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : "Failed to load reference sections.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSections();
    setSelectedPendingIds(new Set());
  }, [activeTab]);

  // Filtered list
  const filteredSections = useMemo(() => {
    return sections.filter((sec) => {
      const matchCategory =
        selectedCategory === "all" || sec.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch =
        !searchQuery ||
        sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sec.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sec.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [sections, selectedCategory, searchQuery]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingSection(null);
    setEditorCategory(selectedCategory !== "all" ? selectedCategory : "hero");
    setEditorTitle("");
    setEditorDescription("");
    setEditorHeadCss("");
    setEditorBodyHtml(`<section class="py-20 px-6 max-w-6xl mx-auto text-center">
  <h2 class="text-3xl font-bold tracking-tight text-gray-900 mb-4">Sample Reference Heading</h2>
  <p class="text-gray-600 max-w-2xl mx-auto leading-relaxed">Describe the purpose and architectural features of this section.</p>
</section>`);
    setEditorError(null);
    setIsEditorOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (sec: ReferenceSection) => {
    setEditingSection(sec);
    setEditorCategory(sec.category);
    setEditorTitle(sec.title);
    setEditorDescription(sec.description);
    setEditorHeadCss(sec.headCss || "");
    setEditorBodyHtml(sec.bodyHtml);
    setEditorError(null);
    setIsEditorOpen(true);
  };

  // Save Reference Section
  const handleSaveSection = async () => {
    if (!editorTitle.trim()) {
      setEditorError("Title is required.");
      return;
    }
    if (!editorDescription.trim()) {
      setEditorError("Rationale / Quality description is required.");
      return;
    }
    if (!editorBodyHtml.trim()) {
      setEditorError("Body HTML is required.");
      return;
    }

    setIsSaving(true);
    setEditorError(null);

    try {
      if (editingSection) {
        // Update existing (always forces status = approved on admin save per spec)
        await api.put(`/api/v1/admin/reference-sections/${editingSection.id}`, {
          category: editorCategory,
          title: editorTitle.trim(),
          description: editorDescription.trim(),
          headCss: editorHeadCss.trim(),
          bodyHtml: editorBodyHtml.trim(),
          status: "approved",
        });
        setSuccessMessage(`Updated "${editorTitle.trim()}" successfully.`);
      } else {
        // Create new
        await api.post("/api/v1/admin/reference-sections", {
          category: editorCategory,
          title: editorTitle.trim(),
          description: editorDescription.trim(),
          headCss: editorHeadCss.trim(),
          bodyHtml: editorBodyHtml.trim(),
        });
        setSuccessMessage(`Created reference section "${editorTitle.trim()}".`);
      }

      setIsEditorOpen(false);
      void fetchSections();
    } catch (err: any) {
      setEditorError(err instanceof ApiError ? err.message : "Failed to save reference section.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Reference Section
  const handleDelete = (sec: ReferenceSection) => {
    setModalConfig({
      isOpen: true,
      type: "confirm",
      variant: "danger",
      title: `Delete Reference: "${sec.title}"?`,
      message:
        "This section will be removed from the AI reference library. It will no longer serve as an architectural pattern for future site generations.",
      confirmText: "Delete",
      onConfirm: async () => {
        try {
          await api.del(`/api/v1/admin/reference-sections/${sec.id}`);
          setModalConfig(null);
          setSuccessMessage(`Deleted "${sec.title}".`);
          void fetchSections();
        } catch (err: any) {
          setModalConfig({
            isOpen: true,
            type: "alert",
            variant: "danger",
            title: "Delete Failed",
            message: err instanceof ApiError ? err.message : "Could not delete section.",
            confirmText: "OK",
            onConfirm: () => setModalConfig(null),
          });
        }
      },
    });
  };

  // Approve Candidate
  const handleApprove = async (sec: ReferenceSection) => {
    try {
      await api.post(`/api/v1/admin/reference-sections/${sec.id}/approve`);
      setSuccessMessage(`Approved "${sec.title}" into reference pool.`);
      void fetchSections();
    } catch (err: any) {
      setModalConfig({
        isOpen: true,
        type: "alert",
        variant: "danger",
        title: "Approval Failed",
        message: err instanceof ApiError ? err.message : "Could not approve candidate.",
        confirmText: "OK",
        onConfirm: () => setModalConfig(null),
      });
    }
  };

  // Reject Candidate
  const handleReject = async (sec: ReferenceSection) => {
    try {
      await api.post(`/api/v1/admin/reference-sections/${sec.id}/reject`);
      setSuccessMessage(`Rejected "${sec.title}".`);
      void fetchSections();
    } catch (err: any) {
      setModalConfig({
        isOpen: true,
        type: "alert",
        variant: "danger",
        title: "Rejection Failed",
        message: err instanceof ApiError ? err.message : "Could not reject candidate.",
        confirmText: "OK",
        onConfirm: () => setModalConfig(null),
      });
    }
  };

  // Bulk Review (Approve or Reject Selected)
  const handleBulkReview = async (action: "approve" | "reject") => {
    const ids = Array.from(selectedPendingIds);
    if (ids.length === 0) return;

    try {
      await api.post("/api/v1/admin/reference-sections/bulk-review", {
        action,
        ids,
        sectionIds: ids,
      });
      setSelectedPendingIds(new Set());
      setSuccessMessage(`${action === "approve" ? "Approved" : "Rejected"} ${ids.length} candidates.`);
      void fetchSections();
    } catch (err: any) {
      setModalConfig({
        isOpen: true,
        type: "alert",
        variant: "danger",
        title: "Bulk Review Failed",
        message: err instanceof ApiError ? err.message : "Failed to execute bulk review.",
        confirmText: "OK",
        onConfirm: () => setModalConfig(null),
      });
    }
  };

  // Trigger AI Reference Expansion Job
  const handleTriggerExpansion = async () => {
    try {
      setIsExpanding(true);
      const res = await api.post<{ message: string; jobId: string }>(
        "/api/v1/admin/reference-sections/expand",
        {
          count: 2,
          category: selectedCategory !== "all" ? selectedCategory : undefined,
        }
      );
      setSuccessMessage(`AI Expansion job queued (#${res.jobId.slice(0, 8)}). Candidates will appear here upon completion.`);
      // Re-fetch after 5 seconds to show any completed candidates
      setTimeout(() => void fetchSections(), 5000);
    } catch (err: any) {
      setModalConfig({
        isOpen: true,
        type: "alert",
        variant: "danger",
        title: "Expansion Request Failed",
        message: err instanceof ApiError ? err.message : "Could not start reference expansion.",
        confirmText: "OK",
        onConfirm: () => setModalConfig(null),
      });
    } finally {
      setIsExpanding(false);
    }
  };

  // Toggle selection for bulk actions
  const toggleSelectPending = (id: string) => {
    setSelectedPendingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPendingIds.size === filteredSections.length) {
      setSelectedPendingIds(new Set());
    } else {
      setSelectedPendingIds(new Set(filteredSections.map((s) => s.id)));
    }
  };

  return (
    <Shell title="Reference Library">
      <div className="flex flex-col h-full overflow-hidden">
        {/* Top Header & Navigation Tabs */}
        <header className="shrink-0 border-b border-night-line bg-white px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-accent" />
                <h1 className="text-lg font-bold text-chalk">Reference Library</h1>
              </div>
              <p className="text-xs text-chalk-dim mt-0.5">
                Admin-curated architectural patterns &amp; AI self-expansion candidates that anchor website generation.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5">
              {activeTab === "pending_review" && (
                <button
                  type="button"
                  onClick={handleTriggerExpansion}
                  disabled={isExpanding}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  {isExpanding ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Generate Candidates Now</span>
                </button>
              )}

              {activeTab === "approved" && (
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Reference Section</span>
                </button>
              )}

              <button
                type="button"
                onClick={fetchSections}
                className="p-1.5 rounded-lg border border-night-line text-chalk-dim hover:text-chalk hover:bg-night transition cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-6 mt-4 border-b border-night-line -mb-4">
            <button
              type="button"
              onClick={() => setActiveTab("approved")}
              className={`pb-3 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 ${
                activeTab === "approved"
                  ? "border-accent text-accent"
                  : "border-transparent text-chalk-dim hover:text-chalk"
              }`}
            >
              <span>Approved References</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-night border border-night-line font-mono">
                {activeTab === "approved" ? sections.length : "•"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("pending_review")}
              className={`pb-3 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 ${
                activeTab === "pending_review"
                  ? "border-accent text-accent"
                  : "border-transparent text-chalk-dim hover:text-chalk"
              }`}
            >
              <span>Pending Review</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-mono font-bold">
                {activeTab === "pending_review" ? sections.length : "•"}
              </span>
            </button>
          </div>
        </header>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-600 hover:text-emerald-900 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="shrink-0 bg-night border-b border-night-line px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-chalk-dim" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs bg-white border border-night-line rounded-md px-2.5 py-1.5 text-chalk font-medium focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="all">All Categories ({sections.length})</option>
              {PLATFORM_SECTION_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-chalk-dim" />
            <input
              type="text"
              placeholder="Search reference sections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs bg-white border border-night-line rounded-md pl-8 pr-3 py-1.5 w-60 text-chalk placeholder:text-chalk-dim focus:outline-none focus:ring-1 focus:ring-accent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-chalk-dim hover:text-chalk"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Bulk Toolbar for Pending Review */}
        {activeTab === "pending_review" && filteredSections.length > 0 && (
          <div className="shrink-0 bg-amber-50/70 border-b border-amber-200/80 px-6 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={
                  selectedPendingIds.size > 0 &&
                  selectedPendingIds.size === filteredSections.length
                }
                onChange={toggleSelectAll}
                className="rounded border-gray-300 text-accent focus:ring-accent cursor-pointer"
              />
              <span className="text-xs font-semibold text-amber-900">
                {selectedPendingIds.size > 0
                  ? `${selectedPendingIds.size} of ${filteredSections.length} selected`
                  : "Select all candidates"}
              </span>
            </div>

            {selectedPendingIds.size > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleBulkReview("approve")}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>Bulk Approve</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkReview("reject")}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                >
                  <XCircle className="w-3 h-3" />
                  <span>Bulk Reject</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-accent opacity-60" />
              <span className="text-xs text-chalk-dim">Loading reference sections...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          ) : filteredSections.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-72 text-center p-8 border border-dashed border-night-line rounded-xl bg-night/50 space-y-3">
              <Layers className="w-10 h-10 text-chalk-dim opacity-40" />
              <div className="space-y-1 max-w-sm">
                <h3 className="text-sm font-bold text-chalk">No Reference Sections Found</h3>
                <p className="text-xs text-chalk-dim leading-relaxed">
                  {activeTab === "approved"
                    ? "No approved reference sections match your filter. Click 'New Reference Section' to author one."
                    : "No pending AI candidates currently in the review queue. Click 'Generate Candidates Now' to trigger an expansion job."}
                </p>
              </div>
              {activeTab === "pending_review" && (
                <button
                  type="button"
                  onClick={handleTriggerExpansion}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer mt-2"
                >
                  Generate Candidates Now
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredSections.map((sec) => {
                const combinedCode = combineSectionCode(sec.headCss || "", sec.bodyHtml);
                const isSelected = selectedPendingIds.has(sec.id);

                return (
                  <div
                    key={sec.id}
                    className={`rounded-xl border bg-white shadow-xs overflow-hidden flex flex-col transition-all duration-200 hover:shadow-md ${
                      isSelected
                        ? "border-accent ring-1 ring-accent"
                        : "border-night-line"
                    }`}
                  >
                    {/* Header Bar */}
                    <div className="px-4 py-3 border-b border-night-line flex items-center justify-between bg-night/50">
                      <div className="flex items-center gap-2 min-w-0">
                        {activeTab === "pending_review" && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectPending(sec.id)}
                            className="rounded border-gray-300 text-accent focus:ring-accent cursor-pointer"
                          />
                        )}
                        <span className="truncate text-xs font-bold text-chalk">
                          {sec.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Category Badge */}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-night-line text-chalk font-semibold uppercase">
                          {sec.category}
                        </span>

                        {/* Source Badge */}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                            sec.source === "ai_generated"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {sec.source === "ai_generated" ? "AI Proposed" : "Admin Seed"}
                        </span>
                      </div>
                    </div>

                    {/* Live Section Preview Card */}
                    <div className="h-44 w-full bg-slate-100 relative overflow-hidden border-b border-night-line">
                      <iframe
                        srcDoc={previewDocument(combinedCode)}
                        title={sec.title}
                        className="w-[1200px] h-[600px] origin-top-left transform scale-[0.28] pointer-events-none"
                        sandbox="allow-same-origin allow-scripts"
                      />
                    </div>

                    {/* Rationale / Description */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-chalk-dim mb-1">
                          Quality Rationale
                        </div>
                        <p className="text-xs text-chalk/80 leading-relaxed line-clamp-3">
                          {sec.description}
                        </p>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-2 border-t border-night-line flex items-center justify-between text-xs">
                        {activeTab === "approved" ? (
                          <>
                            <span className="text-[11px] text-chalk-dim font-mono">
                              {new Date(sec.updatedAt || sec.createdAt).toLocaleDateString()}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(sec)}
                                className="px-2.5 py-1 rounded-md text-chalk hover:bg-night border border-night-line font-medium flex items-center gap-1 transition cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(sec)}
                                className="p-1 rounded-md text-red-600 hover:bg-red-50 transition cursor-pointer"
                                title="Delete Section"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        ) : (
                          /* Pending Review Actions */
                          <div className="w-full flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(sec)}
                              className="text-[11px] font-medium text-chalk-dim hover:text-chalk underline cursor-pointer"
                            >
                              Edit before approve
                            </button>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleReject(sec)}
                                className="px-2.5 py-1 rounded-md bg-red-50 hover:bg-red-100 text-red-700 font-semibold border border-red-200 transition cursor-pointer"
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApprove(sec)}
                                className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs transition cursor-pointer flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* ─── CREATE / EDIT MODAL WITH LIVE SPLIT PREVIEW ─── */}
        {isEditorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <div className="w-full max-w-6xl h-[90vh] bg-white rounded-2xl shadow-2xl border border-night-line flex flex-col overflow-hidden">
              {/* Modal Top Bar */}
              <header className="px-6 py-3.5 border-b border-night-line flex items-center justify-between shrink-0 bg-night/50">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-accent" />
                  <h2 className="text-sm font-bold text-chalk">
                    {editingSection ? `Edit Reference: ${editorTitle || "Untitled"}` : "Create Reference Section"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="text-chalk-dim hover:text-chalk p-1 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </header>

              {editorError && (
                <div className="px-6 py-2 bg-red-50 border-b border-red-200 text-red-700 text-xs font-medium">
                  {editorError}
                </div>
              )}

              {/* Modal Body: Split Form (Left) and Live Preview (Right) */}
              <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                {/* Left Column: Form Fields (6 cols) */}
                <div className="lg:col-span-6 border-r border-night-line p-6 overflow-y-auto space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Category */}
                    <div>
                      <label className="block text-xs font-bold text-chalk mb-1">
                        Category *
                      </label>
                      <select
                        value={editorCategory}
                        onChange={(e) => setEditorCategory(e.target.value)}
                        className="w-full text-xs bg-night border border-night-line rounded-lg px-3 py-2 text-chalk font-medium focus:outline-none focus:ring-1 focus:ring-accent"
                      >
                        {PLATFORM_SECTION_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-xs font-bold text-chalk mb-1">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={editorTitle}
                        onChange={(e) => setEditorTitle(e.target.value)}
                        placeholder="e.g. Modern Research Innovation Lab"
                        className="w-full text-xs bg-night border border-night-line rounded-lg px-3 py-2 text-chalk font-medium focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  </div>

                  {/* Description / Quality Rationale */}
                  <div>
                    <label className="block text-xs font-bold text-chalk mb-0.5">
                      Quality Rationale (Guides AI Generation) *
                    </label>
                    <p className="text-[11px] text-chalk-dim mb-1.5">
                      Explain why this section is high quality and what structural principles the AI should replicate.
                    </p>
                    <textarea
                      rows={3}
                      value={editorDescription}
                      onChange={(e) => setEditorDescription(e.target.value)}
                      placeholder="e.g. Features a clean 3-column metric grid with high contrast iconography, prominent call-to-action cards, and responsive padding."
                      className="w-full text-xs bg-night border border-night-line rounded-lg p-3 text-chalk leading-relaxed focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  {/* Head CSS */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-chalk">Head CSS (Optional)</label>
                      <span className="text-[10px] font-mono text-chalk-dim">CSS rules without &lt;style&gt;</span>
                    </div>
                    <textarea
                      rows={3}
                      value={editorHeadCss}
                      onChange={(e) => setEditorHeadCss(e.target.value)}
                      placeholder=".custom-card { transition: transform 0.2s ease; }"
                      className="w-full font-mono text-xs bg-night border border-night-line rounded-lg p-3 text-chalk leading-relaxed focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  {/* Body HTML */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-chalk">Body HTML *</label>
                      <span className="text-[10px] font-mono text-chalk-dim">Tailwind markup</span>
                    </div>
                    <textarea
                      rows={8}
                      value={editorBodyHtml}
                      onChange={(e) => setEditorBodyHtml(e.target.value)}
                      placeholder="<section class='py-16'>...</section>"
                      className="w-full font-mono text-xs bg-night border border-night-line rounded-lg p-3 text-chalk leading-relaxed focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>

                {/* Right Column: Live Section Preview (6 cols) */}
                <div className="lg:col-span-6 flex flex-col h-full bg-slate-50 overflow-hidden">
                  <header className="px-4 py-2 bg-slate-100 border-b border-night-line flex items-center justify-between text-xs font-bold text-chalk-dim">
                    <span>Live DOM Parity Preview</span>
                    <span className="text-[10px] font-mono uppercase bg-white border border-night-line px-2 py-0.5 rounded">
                      Tailwind Runtime
                    </span>
                  </header>
                  <div className="flex-1 w-full h-full relative overflow-auto p-4 flex items-center justify-center">
                    <div className="w-full h-full bg-white rounded-xl shadow-xs border border-night-line overflow-hidden">
                      <iframe
                        srcDoc={previewDocument(combineSectionCode(editorHeadCss, editorBodyHtml))}
                        title="Live Preview"
                        className="w-full h-full border-0"
                        sandbox="allow-same-origin allow-scripts"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <footer className="px-6 py-3 border-t border-night-line bg-white flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-1.5 text-xs font-semibold text-chalk-dim hover:text-chalk transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSection}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingSection ? "Save & Approve" : "Create Reference"}</span>
                </button>
              </footer>
            </div>
          </div>
        )}

        {/* Modal Dialog Confirmations */}
        {modalConfig && <ModalDialog {...modalConfig} />}
      </div>
    </Shell>
  );
}
