import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Upload, Save, ArrowLeft, Eye, FileCode, CheckCircle, AlertCircle } from "lucide-react";
import { Shell } from "@/components/Shell";
import { AddSectionButton } from "@/components/AddSectionButton";
import { api } from "@/api/client";
import { buildSectionPreviewDocument, normalizeSectionCode } from "@/lib/section-runtime";

const DEFAULT_STARTER_CODE = `<!-- Section Component: Hero Banner -->
<section style="background: #ffffff; color: #0f172a; padding: 80px 24px 60px 24px; text-align: center; font-family: system-ui, sans-serif; width: 100%; box-sizing: border-box; border-bottom: 1px solid #e2e8f0;">
  <div style="max-width: 960px; margin: 0 auto;">
    <span style="background: #ffe4e6; border: 1px solid #f43f5e; color: #e11d48; padding: 6px 20px; border-radius: 9999px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block;">ADMISSIONS OPEN 2026–2027</span>
    <h1 style="font-size: 56px; font-weight: 900; margin-top: 24px; line-height: 1.15; color: #0f172a; letter-spacing: -0.02em;">Empowering Minds, Shaping Tomorrow's Leaders</h1>
    <p style="font-size: 18px; color: #64748b; margin-top: 20px; line-height: 1.6; max-width: 840px; margin-left: auto; margin-right: auto; font-weight: 500;">Join a world-class academic community dedicated to innovation, groundbreaking research, and personal growth. Discover over 120 undergraduate and graduate programs tailored for your future.</p>
    <div style="margin-top: 36px; display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;">
      <a href="#admissions" style="background: #ef4444; color: #ffffff; padding: 14px 36px; border-radius: 12px; font-size: 15px; font-weight: 800; text-decoration: none; box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.4); display: inline-block;">Apply Now</a>
      <a href="#courses" style="background: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; padding: 14px 36px; border-radius: 12px; font-size: 15px; font-weight: 800; text-decoration: none; display: inline-block;">Explore Programs</a>
    </div>
    <div style="margin-top: 60px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; border-top: 1px solid #e2e8f0; padding-top: 32px;">
      <div>
        <div style="font-size: 28px; font-weight: 900; color: #0f172a;">#12</div>
        <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.05em;">NATIONAL RANK</div>
      </div>
      <div>
        <div style="font-size: 28px; font-weight: 900; color: #0f172a;">120+</div>
        <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.05em;">ACADEMIC MAJORS</div>
      </div>
      <div>
        <div style="font-size: 28px; font-weight: 900; color: #0f172a;">96%</div>
        <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.05em;">GRADUATE PLACEMENT</div>
      </div>
      <div>
        <div style="font-size: 28px; font-weight: 900; color: #0f172a;">10:1</div>
        <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.05em;">STUDENT-FACULTY RATIO</div>
      </div>
    </div>
  </div>
</section>`;

export function SectionAddStudio() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { typeId?: string; typeName?: string } | undefined;

  const typeName = state?.typeName || "Hero Banner";
  const typeId = state?.typeId || "hero";

  const [variantName, setVariantName] = useState(`${typeName} Variant`);
  const [code, setCode] = useState(DEFAULT_STARTER_CODE);
  const [fileName, setFileName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [optSuccess, setOptSuccess] = useState(false);
  const [aiFixing, setAiFixing] = useState(false);
  const [aiFixSuccess, setAiFixSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewWidth, setPreviewWidth] = useState<string>("100%");
  const [viewMode, setViewMode] = useState<"code" | "preview" | "split">("code");

  // Compute preview code: if full HTML doc, extract styles + body for clean preview
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        setCode(content);
      }
    };
    reader.readAsText(file);
  };
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
  /**
   * Brings a section up to date with the responsive engine.
   *
   * This used to write ~70 lines of media queries into the section itself, and
   * an identical copy of them lived in the other studio screen. Two forks of an
   * engine, frozen into every section they touched: a fix to either one reached
   * nothing already saved. The engine now runs centrally, on every section and
   * every surface, so all this has to do is clear out what the old passes left.
   */
  const applyAutoResponsive = (raw: string): string => normalizeSectionCode(raw);


  const handleSaveToDatabase = async () => {
    if (!code.trim()) { setError('Please paste HTML code first.'); return; }
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    // Extract body content from full HTML documents — also preserve <link>, <style>, and <script> from <head>
    let cleanCode = code.trim();
    if (/^<!DOCTYPE/i.test(cleanCode) || /<html[\s>]/i.test(cleanCode)) {
      const headMatch = cleanCode.match(/<head[\s\S]*?<\/head>/i);
      const headAssets: string[] = [];
      if (headMatch) {
        const linkRegex = /<link[^>]+>/gi;
        let l;
        while ((l = linkRegex.exec(headMatch[0])) !== null) {
          headAssets.push(l[0]);
        }
        const styleRegex = /<style[^>]*>[\s\S]*?<\/style>/gi;
        let s;
        while ((s = styleRegex.exec(headMatch[0])) !== null) {
          headAssets.push(s[0]);
        }
        const scriptRegex = /<script[^>]*>[\s\S]*?<\/script>/gi;
        let sc;
        while ((sc = scriptRegex.exec(headMatch[0])) !== null) {
          headAssets.push(sc[0]);
        }
      }
      const bodyMatch = cleanCode.match(/<body([^>]*)>([\s\S]*?)<\/body>/i);
      let bodyContent = "";
      if (bodyMatch) {
        const bodyAttrs = bodyMatch[1]?.trim() || "";
        const inner = bodyMatch[2]?.trim() || "";
        bodyContent = bodyAttrs ? `<div class="xite-body-wrapper" ${bodyAttrs}>${inner}</div>` : inner;
      } else {
        bodyContent = cleanCode
          .replace(/^<!DOCTYPE[^>]*>/i, '')
          .replace(/<html[^>]*>/i, '')
          .replace(/<\/html>/i, '')
          .replace(/<head[\s\S]*?<\/head>/i, '')
          .trim();
      }
      cleanCode = [...headAssets, bodyContent].filter(Boolean).join('\n');
    }

    const cleanCategory = (typeId || 'header').toLowerCase();
    const customTitle = variantName.trim() || `Variant ${Date.now().toString().slice(-4)}`;
    const finalName = `${typeName} [${cleanCategory}] - ${customTitle}`;

    const payload = { name: finalName, category: cleanCategory, description: `Admin section for ${typeName}`, code: cleanCode, isPublished: true };

    // Try the simple endpoint first, then fall back to full endpoint
    const endpoints = [
      '/api/v1/admin/save-section',
      '/api/v1/admin/templates',
    ];

    let lastError = 'All save endpoints failed';
    for (const endpoint of endpoints) {
      try {
        const result = await api.post<any>(endpoint, payload);
        // Success!
        // Save to localStorage as backup too
        try {
          const cached = { id: result?.id || `tpl-${Date.now()}`, ...payload, colleges: 0, createdAt: new Date().toISOString() };
          const raw = localStorage.getItem('xite_admin_local_templates');
          const list = raw ? JSON.parse(raw) : [];
          list.unshift(cached);
          localStorage.setItem('xite_admin_local_templates', JSON.stringify(list.slice(0, 50)));
          localStorage.setItem('xite_admin_templates_cache', JSON.stringify([cached, ...list].slice(0, 50)));
        } catch {}
        setSaveSuccess(true);
        setSaving(false);
        setTimeout(() => navigate('/templates'), 1400);
        return;
      } catch (err: any) {
        const msg = err?.response?.data?.error || err?.message || 'Unknown error';
        console.warn(`[SectionAddStudio] ${endpoint} failed:`, msg);
        lastError = msg;
      }
    }
    
    // Both failed — save to localStorage as rescue
    try {
      const rescued = { id: `tpl-${Date.now()}`, ...payload, colleges: 0, createdAt: new Date().toISOString() };
      const raw = localStorage.getItem('xite_admin_local_templates');
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(rescued);
      localStorage.setItem('xite_admin_local_templates', JSON.stringify(list.slice(0, 50)));
    } catch {}
    
    setError(`Save failed: ${lastError} — The section was saved locally. It will sync to DB when the server is fixed.`);
    setSaving(false);
  };

  return (
    <Shell title="Add Section Studio">
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
                Add Section Code — {typeName}
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

            <AddSectionButton
              onClick={handleSaveToDatabase}
              disabled={saving}
              label={saving ? "Saving to Database..." : saveSuccess ? "Saved to DB ✓" : "Save Section to DB"}
              icon={<Save className="w-4 h-4 text-slate-700 group-hover:text-slate-950" />}
              size="sm"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {aiFixSuccess && (
          <div className="p-4 rounded-xl bg-violet-950/60 border border-violet-700 text-violet-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-violet-400" />
            <span>⚡ Section normalised. Responsive behaviour is applied automatically at every breakpoint — on this preview, in the editor and on the published site — so there is nothing to bake in here. Review and save when ready.</span>
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

        {/* Component Key & Metadata Bar */}
        <div className="grid gap-4 sm:grid-cols-2 bg-neutral-950 p-4 rounded-2xl border border-white/10">
          <div>
            <label className="text-xs font-extrabold text-neutral-400 uppercase">Section Variant Title</label>
            <input
              type="text"
              value={variantName}
              onChange={(e) => setVariantName(e.target.value)}
              className="w-full mt-1.5 bg-black border border-neutral-800 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-white"
            />
          </div>
          <div>
            <label className="text-xs font-extrabold text-neutral-400 uppercase">Upload Code File (.html, .jsx, .tsx, .css)</label>
            <div className="mt-1.5 flex items-center gap-3">
              <label className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 hover:border-white text-white px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all">
                <Upload className="w-4 h-4" />
                <span>Choose File</span>
                <input type="file" onChange={handleFileUpload} accept=".html,.jsx,.tsx,.vue,.css,.txt" className="hidden" />
              </label>
              {fileName && <span className="text-xs font-mono text-neutral-400 truncate">{fileName}</span>}
            </div>
          </div>
        </div>

        {/* Step-by-Step View Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-950 p-3.5 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 bg-black p-1.5 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode("code")}
              className={`px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                viewMode === "code" ? "bg-white text-black shadow-lg" : "text-neutral-400 hover:text-white"
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>1. Add / Edit Code</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                viewMode === "preview" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/40" : "text-neutral-400 hover:text-white"
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>2. Test & Full Preview</span>
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
            {viewMode === "preview" && (
              <button
                type="button"
                onClick={() => setViewMode("code")}
                className="flex items-center gap-2 text-xs font-black px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-white text-neutral-300 hover:text-white cursor-pointer transition-all"
              >
                <FileCode className="w-4 h-4" />
                <span>&larr; Edit Code</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Studio Layout */}
        <div className={`grid gap-6 min-h-[65vh] ${
          viewMode === "split" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
        }`}>
          
          {/* Code File Editor (Page / Tab 1) */}
          {(viewMode === "code" || viewMode === "split") && (
            <div className="flex flex-col bg-neutral-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-3.5 border-b border-white/10 bg-neutral-900 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-white" />
                  <span className="text-xs font-extrabold text-white tracking-wide uppercase">
                    Section Source Code {viewMode === "code" && "(Full Page Editor)"}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
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
              </div>

              <div className="flex-1 p-3.5 bg-black flex flex-col">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste or write HTML/JSX section code here..."
                  className="w-full flex-1 min-h-[500px] bg-black text-neutral-200 font-mono text-xs p-4 rounded-xl border border-neutral-900 focus:outline-none focus:border-white leading-relaxed resize-y"
                />

                {/* Bottom Action Footer for Code Tab */}
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
                      <AddSectionButton
                        onClick={handleSaveToDatabase}
                        disabled={saving}
                        label={saving ? "Saving..." : saveSuccess ? "Saved ✓" : "Save Section to DB"}
                        icon={<Save className="w-4 h-4" />}
                        size="sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Live Full Preview Canvas (Page / Tab 2) */}
          {(viewMode === "preview" || viewMode === "split") && (
            <div className="flex flex-col bg-neutral-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-3.5 border-b border-white/10 bg-neutral-900 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-white" />
                  <span className="text-xs font-extrabold text-white tracking-wide uppercase">
                    Live Section Preview {viewMode === "preview" && "(Full Width Canvas)"}
                  </span>
                </div>

                {/* Viewport Width Switcher */}
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

              <div className="flex-1 p-4 bg-neutral-900/50 flex flex-col items-center justify-center overflow-auto min-h-[500px]">
                <div
                  style={{ width: previewWidth, maxWidth: "100%" }}
                  className="w-full flex-1 min-h-[480px] transition-all duration-300 mx-auto shadow-2xl rounded-xl border border-neutral-800 overflow-hidden bg-black flex flex-col"
                >
                  <iframe
                    title="Section Preview"
                    srcDoc={buildSectionPreviewDocument(previewCode)}
                    className="w-full flex-1 min-h-[480px] bg-black border-0"
                    sandbox="allow-scripts"
                  />
                </div>
              </div>

              {/* Bottom Action Footer for Preview Tab */}
              {viewMode === "preview" && (
                <div className="p-3.5 bg-neutral-950 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setViewMode("code")}
                    className="flex items-center gap-2 text-xs font-black px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-white text-neutral-300 hover:text-white cursor-pointer transition-all"
                  >
                    <FileCode className="w-4 h-4" />
                    <span>&larr; Back to Code Editor</span>
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
                    <AddSectionButton
                      onClick={handleSaveToDatabase}
                      disabled={saving}
                      label={saving ? "Saving to Database..." : saveSuccess ? "Saved to DB ✓" : "Save Section to DB"}
                      icon={<Save className="w-4 h-4" />}
                      size="sm"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </Shell>
  );
}
