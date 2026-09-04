import { useState } from "react";
import { Link } from "react-router-dom";
import {
  X,
  Monitor,
  Tablet,
  Smartphone,
  Edit3,
  Copy,
  Check,
  Image as ImageIcon,
  Code2,
  Calendar,
} from "lucide-react";
import { buildSectionPreviewDocument } from "@/lib/section-runtime";
import type { TemplateRow } from "@/api/types";
import { api } from "@/api/client";

interface QuickSectionPreviewModalProps {
  template: TemplateRow | null;
  onClose: () => void;
  onUpdateTemplate?: (updated: TemplateRow) => void;
}

export function QuickSectionPreviewModal({
  template,
  onClose,
  onUpdateTemplate,
}: QuickSectionPreviewModalProps) {
  const [viewportWidth, setViewportWidth] = useState<string>("100%");
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "image">("preview");
  const [copied, setCopied] = useState(false);
  const [thumbnailInput, setThumbnailInput] = useState(template?.thumbnailUrl || "");
  const [savingThumb, setSavingThumb] = useState(false);
  const [thumbSaved, setThumbSaved] = useState(false);
  const [thumbError, setThumbError] = useState<string | null>(null);

  if (!template) return null;

  const previewCode = template.code || "";
  const categoryName = template.category || "Section";

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(previewCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleSaveThumbnail = async () => {
    setSavingThumb(true);
    setThumbError(null);
    setThumbSaved(false);

    try {
      const payload = {
        thumbnailUrl: thumbnailInput.trim() || null,
      };
      const updated = await api.patch<TemplateRow>(
        `/api/v1/admin/templates/${template.id}`,
        payload
      );
      setThumbSaved(true);
      if (onUpdateTemplate) {
        onUpdateTemplate(updated || {
          ...template,
          thumbnailUrl: payload.thumbnailUrl,
        });
      }
      setTimeout(() => setThumbSaved(false), 3000);
    } catch (err) {
      setThumbError(err instanceof Error ? err.message : "Failed to update thumbnail");
    } finally {
      setSavingThumb(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-6xl h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in zoom-in-95 duration-200"
      >
        {/* Top Header Bar */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="bg-blue-500/20 text-blue-400 text-xs font-mono font-bold px-3 py-1 rounded-full border border-blue-500/30">
              {categoryName.toUpperCase()}
            </span>
            <div>
              <h2 className="text-base font-bold text-white leading-tight truncate max-w-[400px]" title={template.name}>
                {template.name}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 font-mono">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(template.createdAt || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                <span>•</span>
                <span className={template.isPublished ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
                  {template.isPublished ? "● Live / Published" : "○ Draft"}
                </span>
                {template.code && (
                  <>
                    <span>•</span>
                    <span>{(template.code.length / 1024).toFixed(1)} KB HTML</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Viewport and Tab Switches */}
          <div className="flex items-center gap-2">
            {activeTab === "preview" && (
              <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewportWidth("100%")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    viewportWidth === "100%"
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Desktop (100% Width)"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewportWidth("768px")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    viewportWidth === "768px"
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Tablet (768px)"
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tablet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewportWidth("375px")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    viewportWidth === "375px"
                      ? "bg-blue-600 text-white shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Mobile (375px)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mobile</span>
                </button>
              </div>
            )}

            {/* Mode Switcher */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  activeTab === "preview" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Live Preview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("code")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "code" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Source</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("image")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "image" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Thumbnail</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 bg-slate-950 overflow-hidden flex flex-col relative">
          {activeTab === "preview" && (
            <div className="flex-1 p-4 overflow-auto flex items-start justify-center bg-slate-950">
              <div
                style={{ width: viewportWidth, maxWidth: "100%" }}
                className="transition-all duration-300 shadow-2xl rounded-xl border border-slate-800 overflow-hidden bg-white min-h-[500px]"
              >
                {previewCode ? (
                  <iframe
                    title={template.name}
                    srcDoc={buildSectionPreviewDocument(previewCode)}
                    className="w-full min-h-[600px] border-0 bg-white"
                    sandbox="allow-scripts allow-same-origin allow-popups"
                    allow="autoplay; fullscreen"
                  />
                ) : (
                  <div className="p-12 text-center text-slate-500 font-mono text-sm">
                    No HTML code available for this section.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "code" && (
            <div className="flex-1 p-4 overflow-auto bg-slate-950 font-mono text-xs text-slate-200">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <span className="text-slate-400 font-bold uppercase text-[11px]">HTML / CSS Section Code</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 cursor-pointer transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy Code"}</span>
                </button>
              </div>
              <pre className="whitespace-pre-wrap break-all leading-relaxed p-4 bg-slate-900 rounded-xl border border-slate-800 text-emerald-300">
                {previewCode || "<!-- No code available -->"}
              </pre>
            </div>
          )}

          {activeTab === "image" && (
            <div className="flex-1 p-6 overflow-auto bg-slate-950 flex flex-col items-center justify-center max-w-2xl mx-auto w-full space-y-6">
              <div className="w-full space-y-2 text-center">
                <h3 className="text-base font-bold text-white">Section Thumbnail Image</h3>
                <p className="text-xs text-slate-400">
                  Set a custom preview image URL (PNG, JPG, WebP) to display as the card thumbnail in the admin section library.
                </p>
              </div>

              {thumbnailInput ? (
                <div className="w-full h-56 rounded-xl border border-slate-700 overflow-hidden bg-slate-900 relative shadow-xl">
                  <img
                    src={thumbnailInput}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded text-[10px] text-slate-300 font-mono border border-slate-800">
                    Live Thumbnail Preview
                  </div>
                </div>
              ) : (
                <div className="w-full h-44 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 flex flex-col items-center justify-center text-slate-500 space-y-2">
                  <ImageIcon className="w-8 h-8 text-slate-600" />
                  <span className="text-xs">No image URL configured. Currently using live code preview.</span>
                </div>
              )}

              <div className="w-full space-y-3">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Thumbnail Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={thumbnailInput}
                    onChange={(e) => setThumbnailInput(e.target.value)}
                    placeholder="https://images.unsplash.com/... or /images/..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveThumbnail}
                    disabled={savingThumb}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {savingThumb ? "Saving…" : "Save Image"}
                  </button>
                </div>

                {thumbSaved && (
                  <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Thumbnail image URL updated successfully!
                  </p>
                )}
                {thumbError && (
                  <p className="text-xs text-rose-400 font-semibold">
                    {thumbError}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Footer Action Bar */}
        <div className="p-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 font-mono">
            Section ID: <span className="text-slate-300 font-bold">{template.id}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
            >
              Close
            </button>
            <Link
              to={`/templates/${template.id}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Open in Code Studio</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
