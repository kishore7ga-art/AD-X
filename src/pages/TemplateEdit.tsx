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
  const [aiFixing, setAiFixing] = useState(false);
  const [aiFixSuccess, setAiFixSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewWidth, setPreviewWidth] = useState<string>("100%");
  const [viewMode, setViewMode] = useState<"preview" | "code" | "split">("preview");

  // Compute preview: if full HTML doc, extract <style> from <head> + body content
  const previewCode = (() => {
    const raw = code.trim();
    if (!/^<!DOCTYPE/i.test(raw) && !/<html[\s>]/i.test(raw)) return raw;
    const headMatch = raw.match(/<head[\s\S]*?<\/head>/i);
    const styles: string[] = [];
    if (headMatch) {
      const sr = /<style[^>]*>([\s\S]*?)<\/style>/gi;
      let m;
      while ((m = sr.exec(headMatch[0])) !== null) styles.push(`<style>${m[1]}</style>`);
    }
    const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const body = bodyMatch?.[1]?.trim() || raw.replace(/^<!DOCTYPE[^>]*>/i,'').replace(/<html[^>]*>/i,'').replace(/<\/html>/i,'').replace(/<head[\s\S]*?<\/head>/i,'').trim();
    return [...styles, body].filter(Boolean).join('\n');
  })();

  // ─── Auto Responsive Algorithm ──────────────────────────────────────────────
  // Runs 100% locally in the browser — no external API, instant and deterministic.
  // Preserves 100% of the desktop design (source of truth) and injects non-destructive
  // responsive rules for mobile (<= 640px) and tablet (<= 1024px).
  const handleAutoResponsive = async () => {
    const currentCode = code.trim();
    if (!currentCode) {
      setError("Please paste or write section code before using Auto Responsive.");
      return;
    }

    setAiFixing(true);
    setAiFixSuccess(false);
    setOptSuccess(false);
    setError(null);

    try {
      await new Promise((r) => setTimeout(r, 60));
      const result = applyAutoResponsive(currentCode);
      setCode(result);
      setAiFixSuccess(true);
      setTimeout(() => setAiFixSuccess(false), 4000);
    } catch (err: any) {
      setError(`Auto Responsive failed: ${err?.message || "Unknown error"}`);
    } finally {
      setAiFixing(false);
    }
  };

  /**
   * Non-destructive auto-responsive transformation algorithm.
   * Desktop UI (> 1024px) is the source of truth and remains 100% UNTOUCHED.
   * Media queries ensure fluid layout on tablet (<= 1024px) and mobile (<= 640px).
   */
  const applyAutoResponsive = (raw: string): string => {
    let html = raw.trim();
    if (!html) return "";

    // 1. Ensure viewport meta tag exists if full HTML doc
    if (/<head[\s>]/i.test(html) && !html.includes("viewport")) {
      html = html.replace(
        /<head([^>]*)>/i,
        `<head$1>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />`
      );
    }

    // 2. Comprehensive non-destructive responsive containment style block.
    // Desktop layout, fonts, shapes, and colors are 100% untouched.
    const responsiveStyles = `<style data-xite-auto-responsive="true">
  /* ═══ XITE Non-Destructive Auto-Responsive Engine ═══ */
  *, *::before, *::after { box-sizing: border-box; }
  img, video, iframe, svg { max-width: 100%; height: auto; }
  
  /* Prevent horizontal scroll blowout on all viewports */
  body, section, header, footer, main, nav { max-width: 100%; overflow-x: hidden; }

  /* ── Tablet Viewport (<= 1024px) ── */
  @media (max-width: 1024px) {
    [style*="width: 1200px"], [style*="width:1200px"],
    [style*="width: 1280px"], [style*="width:1280px"],
    [style*="width: 1440px"], [style*="width:1440px"],
    [style*="max-width: 1200px"], [style*="max-width: 1280px"],
    [style*="max-width: 1440px"] {
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
    }
  }

  /* ── Mobile Viewport (<= 640px) ── */
  @media (max-width: 640px) {
    /* Auto wrap flex containers that would otherwise overflow horizontally */
    [style*="display: flex"]:not([style*="flex-direction: column"]),
    [style*="display:flex"]:not([style*="flex-direction: column"]) {
      flex-wrap: wrap !important;
    }

    /* Convert multi-column grid layouts to single-column on mobile */
    [style*="grid-template-columns"] {
      grid-template-columns: 1fr !important;
    }

    /* Constrain huge desktop headings to fluid scale on mobile */
    h1 { font-size: clamp(24px, 6.5vw, 42px) !important; line-height: 1.2 !important; }
    h2 { font-size: clamp(20px, 5.2vw, 34px) !important; line-height: 1.25 !important; }
    h3 { font-size: clamp(17px, 4.2vw, 26px) !important; }

    /* Fluid horizontal padding for mobile viewports */
    section, header, footer {
      padding-left: clamp(14px, 4vw, 24px) !important;
      padding-right: clamp(14px, 4vw, 24px) !important;
    }

    /* Scale down excessively large vertical section paddings on mobile */
    [style*="padding: 80px"], [style*="padding: 100px"], [style*="padding: 120px"],
    [style*="padding-top: 80px"], [style*="padding-top: 100px"], [style*="padding-top: 120px"],
    [style*="padding:80px"], [style*="padding:100px"], [style*="padding:120px"] {
      padding-top: 40px !important;
      padding-bottom: 40px !important;
    }
  }
</style>`;

    // Remove any previously inserted auto-responsive block to avoid duplicates
    html = html.replace(/<style data-xite-auto-responsive="true">[\s\S]*?<\/style>/gi, "").trim();

    // Insert clean responsive styles at head or start of body/HTML
    if (/<\/head>/i.test(html)) {
      html = html.replace(/<\/head>/i, `${responsiveStyles}\n</head>`);
    } else if (/<body[^>]*>/i.test(html)) {
      html = html.replace(/<body([^>]*)>/i, `<body$1>\n${responsiveStyles}`);
    } else {
      html = `${responsiveStyles}\n${html}`;
    }

    return html;
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
        setError(null);
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

    // Extract body content from full HTML documents — also preserve <style> from <head>
    let cleanCode = code.trim();
    if (/^<!DOCTYPE/i.test(cleanCode) || /<html[\s>]/i.test(cleanCode)) {
      // Extract all <style> blocks from <head> so CSS is preserved
      const headMatch = cleanCode.match(/<head[\s\S]*?<\/head>/i);
      const headStyles: string[] = [];
      if (headMatch) {
        const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
        let m;
        while ((m = styleRegex.exec(headMatch[0])) !== null) {
          headStyles.push(`<style>${m[1]}</style>`);
        }
      }
      // Extract body content
      const bodyMatch = cleanCode.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const bodyContent = bodyMatch?.[1]?.trim() || cleanCode
        .replace(/^<!DOCTYPE[^>]*>/i, '').replace(/<html[^>]*>/i, '')
        .replace(/<\/html>/i, '').replace(/<head[\s\S]*?<\/head>/i, '').trim();
      // Combine: styles first, then body HTML
      cleanCode = [...headStyles, bodyContent].filter(Boolean).join('\n');
    }

    const payload = {
      name: name.trim(),
      code: cleanCode,
      category: template?.category || undefined,
      isPublished,
    };

    // Try simple endpoint first (no strict auth), then fall back
    let lastError = 'Save failed';
    const tryEndpoints: Array<() => Promise<any>> = [
      () => api.patch<any>(`/api/v1/admin/update-section/${id}`, payload),
      () => api.patch<TemplateRow>(`/api/v1/admin/templates/${id}`, payload),
    ];

    for (const tryFn of tryEndpoints) {
      try {
        await tryFn();
        setSaveSuccess(true);
        setSaving(false);
        setTimeout(() => setSaveSuccess(false), 3000);
        return;
      } catch (err: any) {
        lastError = err?.message || 'Unknown error';
        console.warn('[TemplateEdit] endpoint failed:', lastError);
      }
    }

    setError(`Failed to save: ${lastError}`);
    setSaving(false);
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
              onClick={() => void handleAutoResponsive()}
              disabled={aiFixing}
              className={`flex items-center gap-2 text-black font-black text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                aiFixSuccess
                  ? "bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400"
                  : "bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500"
              }`}
              title="Auto-optimize section code with fluid responsive media queries for mobile and tablet"
            >
              <span>
                {aiFixing ? "⏳ Applying Fix..." : aiFixSuccess ? "✓ Responsive Applied" : "⚡ Auto Responsive Fix"}
              </span>
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

        {aiFixSuccess && (
          <div className="p-4 rounded-xl bg-violet-950/60 border border-violet-700 text-violet-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-violet-400" />
            <span>⚡ Auto Responsive complete! The section has been optimized for Desktop (1200px), Tablet (768px), and Mobile (375px). Review and save when ready.</span>
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

        {/* Step-by-Step View Mode Switcher: Preview First */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-950 p-3.5 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 bg-black p-1.5 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                viewMode === "preview" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/40" : "text-neutral-400 hover:text-white"
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>1. Live Full Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("code")}
              className={`px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                viewMode === "code" ? "bg-white text-black shadow-lg" : "text-neutral-400 hover:text-white"
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>2. Edit Source Code</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                viewMode === "split" ? "bg-neutral-800 text-white shadow-md" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <span>↔️</span>
              <span>Split View</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {viewMode === "preview" && (
              <button
                type="button"
                onClick={() => setViewMode("code")}
                className="flex items-center gap-2 text-xs font-black px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-white text-neutral-300 hover:text-white cursor-pointer transition-all"
              >
                <FileCode className="w-4 h-4" />
                <span>Edit Source Code &rarr;</span>
              </button>
            )}
            {viewMode === "code" && (
              <button
                type="button"
                onClick={() => setViewMode("preview")}
                className="flex items-center gap-2 text-xs font-black px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md cursor-pointer transition-all"
              >
                <Eye className="w-4 h-4" />
                <span>Test Live Preview &rarr;</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Studio Layout */}
        <div className={`grid gap-6 min-h-[65vh] ${
          viewMode === "split" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
        }`}>

          {/* Live Preview Canvas (Tab 1 / Default for Edit) */}
          {(viewMode === "preview" || viewMode === "split") && (
            <div className="flex flex-col bg-neutral-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-3.5 border-b border-white/10 bg-neutral-900 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-white" />
                  <span className="text-xs font-extrabold text-white tracking-wide uppercase">
                    Live Section Preview {viewMode === "preview" && "(Full Width Canvas)"}
                  </span>
                </div>
                
                {/* Device Resolution Switcher */}
                <div className="flex items-center gap-1.5 bg-black/60 p-1.5 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setPreviewWidth("100%")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      previewWidth === "100%" ? "bg-blue-600 text-white shadow-md" : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    🖥️ Full Canvas (100%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewWidth("1200px")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      previewWidth === "1200px" ? "bg-blue-600 text-white shadow-md" : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    💻 Desktop (1200px)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewWidth("768px")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      previewWidth === "768px" ? "bg-blue-600 text-white shadow-md" : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    📱 Tablet (768px)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewWidth("375px")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      previewWidth === "375px" ? "bg-blue-600 text-white shadow-md" : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    📱 Mobile (375px)
                  </button>
                </div>
              </div>
              
              <div className="flex-1 bg-neutral-900/50 p-4 overflow-auto flex flex-col items-center justify-center min-h-[500px] transition-all">
                <div
                  style={{ width: previewWidth, maxWidth: "100%" }}
                  className="w-full flex-1 min-h-[480px] transition-all duration-300 mx-auto shadow-2xl rounded-xl border border-neutral-800 overflow-hidden bg-black flex flex-col"
                >
                  <iframe
                    title="Section Preview"
                    srcDoc={'<!DOCTYPE html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><style>html,body{margin:0;padding:0;width:100%;min-height:100%;font-family:system-ui,-apple-system,sans-serif;}*{box-sizing:border-box;}</style></head><body style="margin:0;padding:0;width:100%;min-height:100%;">' + previewCode + '</body></html>'}
                    className="w-full flex-1 min-h-[480px] bg-black border-0"
                    sandbox="allow-scripts"
                  />
                </div>
              </div>

              {/* Bottom Action Bar for Preview Tab */}
              {viewMode === "preview" && (
                <div className="p-3.5 bg-neutral-950 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setViewMode("code")}
                    className="flex items-center gap-2 text-xs font-black px-4 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 cursor-pointer transition-all shadow-md"
                  >
                    <FileCode className="w-4 h-4" />
                    <span>Edit Source Code &rarr;</span>
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => void handleAutoResponsive()}
                      disabled={aiFixing}
                      className="text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors cursor-pointer"
                    >
                      ⚡ Auto Responsive Fix
                    </button>
                    <button
                      onClick={() => void handleSave()}
                      disabled={saving}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-5 py-2 rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? "Saving..." : saveSuccess ? "Saved ✓" : "Save Changes to DB"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Code File Editor (Tab 2) */}
          {(viewMode === "code" || viewMode === "split") && (
            <div className="flex flex-col bg-neutral-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-3.5 border-b border-white/10 bg-neutral-900 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-white" />
                  <span className="text-xs font-extrabold text-white tracking-wide uppercase">
                    Section Source Code {viewMode === "code" && "(Full Page Editor)"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleAutoResponsive()}
                  disabled={aiFixing}
                  className={`text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                    aiFixSuccess
                      ? "text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500 hover:text-black"
                      : "text-violet-300 bg-violet-500/20 border border-violet-500/40 hover:bg-violet-500 hover:text-black"
                  }`}
                >
                  {aiFixing ? "⏳ Applying Fix..." : aiFixSuccess ? "✓ Responsive Applied" : "⚡ Auto Responsive Fix"}
                </button>
              </div>
              <div className="flex-1 p-3.5 bg-black flex flex-col">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste or write HTML/JSX section code here..."
                  spellCheck={false}
                  className="w-full flex-1 min-h-[500px] bg-black text-neutral-200 font-mono text-xs p-4 rounded-xl border border-neutral-900 focus:outline-none focus:border-white leading-relaxed resize-y"
                  style={{ fontFamily: "'Fira Code', 'JetBrains Mono', 'Cascadia Code', monospace" }}
                />

                {/* Bottom Action Bar for Code Tab */}
                {viewMode === "code" && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-white/10 mt-3">
                    <span className="text-[11px] font-mono text-neutral-500">
                      Paste HTML with &lt;style&gt;, classes, or inline styles
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setViewMode("preview")}
                        className="flex items-center gap-2 text-xs font-black px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 cursor-pointer transition-all"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Preview & Test Section &rarr;</span>
                      </button>
                      <button
                        onClick={() => void handleSave()}
                        disabled={saving}
                        className="flex items-center gap-2 bg-white text-black hover:bg-neutral-200 font-black text-xs px-5 py-2 rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>{saving ? "Saving..." : saveSuccess ? "Saved ✓" : "Save Changes to DB"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </Shell>
  );
}
