import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Eye,
  FileCode,
  Upload,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import { api } from "@/api/client";
import type { TemplateRow } from "@/api/types";
import { Shell } from "@/components/Shell";

export function TemplateEdit() {
  const { id = "" } = useParams();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<TemplateRow | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [fileName, setFileName] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [optSuccess, setOptSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewWidth, setPreviewWidth] = useState<string>("100%");

  // Auto-Resolution Code Optimizer
  const handleAutoResolutionOptimize = () => {
    let currentCode = code;
    const responsiveStyles = `
<style id="auto-responsive-styles">
  * { box-sizing: border-box !important; }
  img, video, iframe, canvas, svg { max-width: 100% !important; height: auto !important; }
  section, div, header, footer, nav, article { max-width: 100% !important; box-sizing: border-box !important; }
  @media (max-width: 1024px) {
    .grid-cols-4, [style*="grid-template-columns: repeat(4"], [style*="grid-template-columns:repeat(4"] {
      grid-template-columns: repeat(2, 1fr) !important;
    }
  }
  @media (max-width: 768px) {
    section, header, footer { padding-left: 20px !important; padding-right: 20px !important; }
    h1 { font-size: clamp(28px, 6vw, 42px) !important; line-height: 1.2 !important; }
    h2 { font-size: clamp(22px, 5vw, 32px) !important; }
    h3 { font-size: clamp(18px, 4vw, 24px) !important; }
    .grid, [style*="display: grid"], [style*="display:grid"] {
      grid-template-columns: 1fr !important;
      gap: 16px !important;
    }
    div[style*="display: flex"], header[style*="display: flex"], nav[style*="display: flex"] {
      flex-wrap: wrap !important;
    }
  }
  @media (max-width: 480px) {
    section, header, footer { padding-left: 14px !important; padding-right: 14px !important; }
    h1 { font-size: 26px !important; }
    button, a[style*="display: inline"], a[style*="display: block"] {
      width: 100% !important;
      text-align: center !important;
      justify-content: center !important;
    }
  }
</style>
`;

    if (!currentCode.includes("auto-responsive-styles")) {
      if (currentCode.includes("</section>")) {
        currentCode = currentCode.replace("</section>", `</section>\n${responsiveStyles}`);
      } else if (currentCode.includes("</footer>")) {
        currentCode = currentCode.replace("</footer>", `</footer>\n${responsiveStyles}`);
      } else if (currentCode.includes("</header>")) {
        currentCode = currentCode.replace("</header>", `</header>\n${responsiveStyles}`);
      } else {
        currentCode = `${currentCode}\n${responsiveStyles}`;
      }
    }

    setCode(currentCode);
    setOptSuccess(true);
    setTimeout(() => setOptSuccess(false), 3500);
  };

  // Load existing template data
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const row = await api.get<TemplateRow>(`/api/v1/admin/templates/${id}`);
        if (cancelled) return;
        setTemplate(row);
        setName(row.name);
        setCode(row.code ?? "");
        setIsPublished(row.isPublished);
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Could not load template");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") setCode(content);
    };
    reader.readAsText(file);
  };

  // Save to database
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      await api.patch<TemplateRow>(`/api/v1/admin/templates/${id}`, {
        name: name.trim(),
        code,
        isPublished,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to save section to database");
    } finally {
      setSaving(false);
    }
  };

  // Extract category from template name e.g. "Hero Banner [hero] - Hero Banner Variant"
  const categoryName = template?.name
    ? template.name.replace(/\s*\[.*?\]\s*-.*$/, "").trim()
    : "Section";

  if (loading) {
    return (
      <Shell title="Edit Section">
        <div className="flex items-center justify-center min-h-[60vh] bg-black text-white">
          <span className="text-xs font-mono text-neutral-400 animate-pulse">Loading section code…</span>
        </div>
      </Shell>
    );
  }

  if (error && !template) {
    return (
      <Shell title="Edit Section">
        <div className="p-6 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{error}</span>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title={`Edit: ${template?.name ?? "Section"}`}>
      <div className="space-y-6 bg-black text-white min-h-[85vh] font-sans">

        {/* Header Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/templates")}
              className="flex items-center gap-2 text-xs font-black px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-white text-neutral-300 hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div>
              <span className="text-[11px] font-mono uppercase text-neutral-400 font-bold tracking-wider">
                Admin Section Studio
              </span>
              <h1 className="text-xl font-black text-white tracking-tight">
                Edit Section Code — {categoryName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAutoResolutionOptimize}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer"
              title="Automatically optimize code layout & responsive CSS rules for Desktop, Tablet, and Mobile devices"
            >
              <span>⚡ Auto Resolution Code Edit</span>
            </button>

            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="flex items-center gap-2 bg-white text-black hover:bg-neutral-200 font-black text-xs px-6 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving to Database..." : saveSuccess ? "Saved to DB ✓" : "Save Section to DB"}</span>
            </button>
          </div>
        </div>

        {/* Error / Success Banners */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {optSuccess && (
          <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-300 text-xs font-bold flex items-center gap-2 animate-bounce">
            <CheckCircle className="w-4 h-4 text-amber-400" />
            <span>⚡ Section code auto-optimized with fluid responsive rules for Desktop (1200px), Tablet (768px), and Mobile (375px)!</span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Section code saved successfully! Live database updated.</span>
          </div>
        )}

        {/* Metadata Bar: Section Variant Title + Upload File */}
        <div className="grid gap-4 sm:grid-cols-2 bg-neutral-950 p-4 rounded-2xl border border-white/10">
          <div>
            <label className="text-xs font-extrabold text-neutral-400 uppercase">Section Variant Title</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1.5 bg-black border border-neutral-800 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-white"
            />
          </div>
          <div>
            <label className="text-xs font-extrabold text-neutral-400 uppercase">
              Upload Code File (.html, .jsx, .tsx, .css)
            </label>
            <div className="mt-1.5 flex items-center gap-3">
              <label className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 hover:border-white text-white px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all">
                <Upload className="w-4 h-4" />
                <span>Choose File</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".html,.jsx,.tsx,.vue,.css,.txt"
                  className="hidden"
                />
              </label>
              {fileName && (
                <span className="text-xs font-mono text-neutral-400 truncate">{fileName}</span>
              )}
            </div>
          </div>
        </div>

        {/* Published Toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
          />
          <span className="text-xs font-bold text-neutral-300">
            Published
            <span className="ml-2 text-[10px] text-neutral-500 font-normal">
              Offered in the frontend editor page
            </span>
          </span>
        </label>

        {/* Split View Studio: Left (Live Preview), Right (Code Editor) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[60vh]">

          {/* Left Side: Live Preview Canvas */}
          <div className="flex flex-col bg-neutral-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-3 border-b border-white/10 bg-neutral-900 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-white" />
                <span className="text-xs font-extrabold text-white tracking-wide uppercase">Live Section Preview</span>
              </div>
              
              {/* Device Resolution Switcher */}
              <div className="flex items-center gap-1 bg-black p-1 rounded-xl border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setPreviewWidth("100%")}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    previewWidth === "100%" ? "bg-neutral-800 text-white font-extrabold" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  🖥️ Desktop (1200px)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewWidth("768px")}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    previewWidth === "768px" ? "bg-neutral-800 text-white font-extrabold" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  📱 Tablet (768px)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewWidth("375px")}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    previewWidth === "375px" ? "bg-neutral-800 text-white font-extrabold" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  📱 Mobile (375px)
                </button>
              </div>
            </div>
            
            <div className="flex-1 bg-neutral-900 p-4 overflow-auto flex items-center justify-center min-h-[420px] transition-all">
              <div
                style={{ width: previewWidth, maxWidth: "100%" }}
                className="h-full min-h-[400px] transition-all duration-300 mx-auto shadow-2xl rounded-xl border border-neutral-800 overflow-hidden"
              >
                <iframe
                  title="Section Preview"
                  srcDoc={code}
                  className="w-full h-full min-h-[400px] bg-black"
                  sandbox="allow-scripts"
                />
              </div>
            </div>
          </div>

          {/* Right Side: Code File Editor */}
          <div className="flex flex-col bg-neutral-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-3 border-b border-white/10 bg-neutral-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-white" />
                <span className="text-xs font-extrabold text-white tracking-wide uppercase">Section Source Code</span>
              </div>
              <button
                type="button"
                onClick={handleAutoResolutionOptimize}
                className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 rounded-lg hover:bg-amber-500 hover:text-black transition-all cursor-pointer"
              >
                ⚡ Auto Resolution Code Edit
              </button>
            </div>
            <div className="flex-1 p-3 bg-black">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste or write HTML/JSX section code here..."
                spellCheck={false}
                className="w-full h-full min-h-[400px] bg-black text-neutral-200 font-mono text-xs p-4 rounded-xl border border-neutral-900 focus:outline-none focus:border-white leading-relaxed resize-none"
                style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'Cascadia Code', monospace" }}
              />
            </div>
          </div>

        </div>

        {/* Bottom Save Button */}
        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-neutral-200 font-black text-sm px-6 py-3.5 rounded-2xl shadow-xl transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          <span>{saving ? "Saving to Database..." : saveSuccess ? "✓ Saved to DB!" : "Save Section to DB"}</span>
        </button>

      </div>
    </Shell>
  );
}
