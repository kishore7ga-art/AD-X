import { useState, useMemo } from "react";
import {
  Eye,
  EyeOff,
  X,
  Search,
  CheckCircle2,
  SlidersHorizontal,
  Layers,
} from "lucide-react";

// ============================================================================
// 1. Data Model & Schema Definition
// ============================================================================

export interface ConfigurableSection {
  id: string;
  title: string;
  sectionType?: string;
  code?: string;
  sortOrder?: number;
  /**
   * Visibility flag. Defaults to true if undefined to support legacy data.
   * When false, the section remains preserved in database & admin,
   * but is omitted from public renders and client navigation.
   */
  isVisible?: boolean;
  [key: string]: any;
}

export interface SectionVisibilityModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback when user closes the modal */
  onClose: () => void;
  /** Current list of sections for the active page */
  sections: ConfigurableSection[];
  /** Callback fired when sections' visibility states are updated */
  onUpdateSections: (updatedSections: ConfigurableSection[]) => void;
  /** Optional page name or title for header context */
  pageTitle?: string;
}

// ============================================================================
// 2. Admin Section Visibility Modal Component
// ============================================================================

export function SectionVisibilityModal({
  isOpen,
  onClose,
  sections,
  onUpdateSections,
  pageTitle = "Current Page",
}: SectionVisibilityModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "visible" | "hidden">("all");

  // Normalize sections so isVisible is guaranteed to be boolean
  const normalizedSections = useMemo(() => {
    return sections.map((sec) => ({
      ...sec,
      isVisible: sec.isVisible !== false, // Defaults to true
    }));
  }, [sections]);

  // Handle single section toggle
  const handleToggle = (id: string) => {
    const updated = normalizedSections.map((sec) =>
      sec.id === id ? { ...sec, isVisible: !sec.isVisible } : sec
    );
    onUpdateSections(updated);
  };

  // Bulk visibility controls
  const handleSetAll = (visible: boolean) => {
    const updated = normalizedSections.map((sec) => ({
      ...sec,
      isVisible: visible,
    }));
    onUpdateSections(updated);
  };

  // Filter sections by search and visibility filter tab
  const filteredSections = useMemo(() => {
    return normalizedSections.filter((sec) => {
      const matchesSearch =
        sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sec.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sec.sectionType && sec.sectionType.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (filterMode === "visible") return sec.isVisible;
      if (filterMode === "hidden") return !sec.isVisible;
      return true;
    });
  }, [normalizedSections, searchQuery, filterMode]);

  const totalCount = normalizedSections.length;
  const visibleCount = normalizedSections.filter((s) => s.isVisible).length;
  const hiddenCount = totalCount - visibleCount;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative flex w-full max-w-2xl flex-col rounded-2xl border border-zinc-800 bg-zinc-950 text-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h2 id="modal-title" className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
                Manage Section Visibility
                <span className="text-xs font-normal text-zinc-400 font-mono bg-zinc-800 px-2 py-0.5 rounded-full">
                  {pageTitle}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Toggle sections on or off. Hidden sections remain saved in your database but are omitted from public pages.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter & Metric Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 px-6 py-3 bg-zinc-900/30">
          {/* Quick Stats & Tabs */}
          <div className="flex items-center gap-1.5 bg-zinc-900 rounded-lg p-1 border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1 rounded-md font-medium transition ${
                filterMode === "all" ? "bg-zinc-800 text-white shadow" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("visible")}
              className={`px-3 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                filterMode === "visible" ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/40" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Eye className="w-3 h-3 text-emerald-400" />
              Visible ({visibleCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("hidden")}
              className={`px-3 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                filterMode === "hidden" ? "bg-zinc-800 text-amber-300" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <EyeOff className="w-3 h-3 text-amber-400" />
              Hidden ({hiddenCount})
            </button>
          </div>

          {/* Bulk Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSetAll(true)}
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:underline transition"
            >
              Show All
            </button>
            <span className="text-zinc-700">|</span>
            <button
              type="button"
              onClick={() => handleSetAll(false)}
              className="text-xs font-medium text-amber-400 hover:text-amber-300 hover:underline transition"
            >
              Hide All
            </button>
          </div>
        </div>

        {/* Search Field */}
        <div className="p-4 border-b border-zinc-800/60 bg-zinc-950">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by title, ID, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Section List (Dynamic Scrollable Container) */}
        <div className="flex-1 overflow-y-auto p-6 divide-y divide-zinc-900 space-y-3">
          {filteredSections.length === 0 ? (
            <div className="py-12 text-center">
              <Layers className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
              <p className="text-sm text-zinc-400">No sections found matching your filter.</p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-2 text-xs text-blue-400 hover:underline"
                >
                  Clear search query
                </button>
              )}
            </div>
          ) : (
            filteredSections.map((section, index) => {
              const isVisible = section.isVisible;

              return (
                <div
                  key={section.id || index}
                  className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                    isVisible
                      ? "border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/70"
                      : "border-zinc-900 bg-zinc-950/80 opacity-60 hover:opacity-80"
                  }`}
                >
                  {/* Left: Info & Badges */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs font-mono font-bold ${
                        isVisible
                          ? "border-blue-500/20 bg-blue-950/30 text-blue-400"
                          : "border-zinc-800 bg-zinc-900 text-zinc-600"
                      }`}
                    >
                      #{index + 1}
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-medium text-white truncate">
                          {section.title || "Untitled Section"}
                        </h4>

                        {/* Status Badge */}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                            isVisible
                              ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/50"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                          }`}
                        >
                          {isVisible ? (
                            <>
                              <Eye className="w-2.5 h-2.5" />
                              Visible
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-2.5 h-2.5" />
                              Hidden
                            </>
                          )}
                        </span>

                        {section.sectionType && (
                          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 uppercase">
                            {section.sectionType}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-zinc-500 font-mono truncate mt-0.5">
                        ID: {section.id}
                      </p>
                    </div>
                  </div>

                  {/* Right: Custom iOS-Style Toggle Switch */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isVisible}
                      onClick={() => handleToggle(section.id)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-950 ${
                        isVisible ? "bg-emerald-500" : "bg-zinc-700"
                      }`}
                      title={isVisible ? "Click to hide section" : "Click to show section"}
                    >
                      <span className="sr-only">Toggle section visibility</span>
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          isVisible ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900/60 px-6 py-4">
          <span className="text-xs text-zinc-400">
            {visibleCount} of {totalCount} sections visible to public visitors
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. Trigger Button Component
// ============================================================================

export function ManageSectionsButton({
  onClick,
  sections,
}: {
  onClick: () => void;
  sections?: ConfigurableSection[];
}) {
  const visibleCount = sections ? sections.filter((s) => s.isVisible !== false).length : 0;
  const totalCount = sections ? sections.length : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/80 px-3.5 py-2 text-xs font-semibold text-zinc-200 shadow-sm transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-white cursor-pointer"
      title="Manage section visibility"
    >
      <SlidersHorizontal className="h-3.5 w-3.5 text-blue-400" />
      <span>Manage Sections</span>
      {totalCount > 0 && (
        <span className="rounded-full bg-zinc-800 border border-zinc-700 px-2 py-0.5 font-mono text-[10px] text-zinc-300">
          {visibleCount}/{totalCount}
        </span>
      )}
    </button>
  );
}

export default SectionVisibilityModal;
