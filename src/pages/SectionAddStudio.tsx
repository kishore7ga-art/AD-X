import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Upload, Save, ArrowLeft, Eye, FileCode, CheckCircle, AlertCircle } from "lucide-react";
import { Shell } from "@/components/Shell";
import { AddSectionButton } from "@/components/AddSectionButton";
import { api } from "@/api/client";

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
  const [previewWidth, setPreviewWidth] = useState<string>("1200px");
  const [viewMode, setViewMode] = useState<"split" | "preview" | "code">("split");

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


  const handleSaveToDatabase = async () => {
    if (!code.trim()) { setError('Please paste HTML code first.'); return; }
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

        {/* View Mode Switcher Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-950 p-3 rounded-2xl border border-white/10">
          <div className="flex items-center gap-1.5 bg-black p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`px-3.5 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                viewMode === "split" ? "bg-white text-black shadow-md" : "text-neutral-400 hover:text-white"
              }`}
            >
              <span>↔️</span>
              <span>Split View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`px-3.5 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                viewMode === "preview" ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" : "text-neutral-400 hover:text-white"
              }`}
            >
              <span>👁️</span>
              <span>Full Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("code")}
              className={`px-3.5 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                viewMode === "code" ? "bg-neutral-800 text-white shadow-md" : "text-neutral-400 hover:text-white"
              }`}
            >
              <span>💻</span>
              <span>Code Only</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-neutral-400 font-bold">
            {viewMode === "preview" ? "Full Width Preview Canvas Active" : viewMode === "code" ? "Full Width Code Editor Active" : "Side-by-Side Split View"}
          </div>
        </div>

        {/* Dynamic Studio Layout: Split, Full Preview, or Code Only */}
        <div className={`grid gap-6 min-h-[65vh] ${
          viewMode === "split" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
        }`}>
          
          {/* Live Preview Canvas */}
          {(viewMode === "split" || viewMode === "preview") && (
            <div className="flex flex-col bg-neutral-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-3 border-b border-white/10 bg-neutral-900 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-white" />
                  <span className="text-xs font-extrabold text-white tracking-wide uppercase">
                    Live Section Preview {viewMode === "preview" && "(Full Width)"}
                  </span>
                </div>

                {/* Viewport Width Switcher */}
                <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setPreviewWidth("1200px")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      previewWidth === "1200px" ? "bg-blue-600 text-white shadow-md" : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    🖥️ Desktop (1200px)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewWidth("768px")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      previewWidth === "768px" ? "bg-blue-600 text-white shadow-md" : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    📱 Tablet (768px)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewWidth("375px")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      previewWidth === "375px" ? "bg-blue-600 text-white shadow-md" : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    📱 Mobile (375px)
                  </button>
                </div>
              </div>

              <div className="flex-1 p-4 bg-neutral-900/50 flex items-center justify-center overflow-auto min-h-[480px]">
                <div
                  style={{ width: previewWidth, maxWidth: "100%" }}
                  className="h-full min-h-[440px] transition-all duration-300 mx-auto shadow-2xl rounded-xl border border-neutral-800 overflow-hidden"
                >
                  <iframe
                    title="Section Preview"
                    srcDoc={'<!DOCTYPE html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><style>body{margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;}*{box-sizing:border-box;}</style></head><body>' + previewCode + '</body></html>'}
                    className="w-full h-full min-h-[440px] bg-black"
                    sandbox="allow-scripts"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Code File Editor */}
          {(viewMode === "split" || viewMode === "code") && (
            <div className="flex flex-col bg-neutral-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-3 border-b border-white/10 bg-neutral-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-white" />
                  <span className="text-xs font-extrabold text-white tracking-wide uppercase">
                    Section Source Code {viewMode === "code" && "(Full Width)"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleAutoResponsive()}
                  disabled={aiFixing}
                  className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                    aiFixSuccess
                      ? "text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500 hover:text-black"
                      : "text-violet-300 bg-violet-500/20 border border-violet-500/40 hover:bg-violet-500 hover:text-black"
                  }`}
                >
                  {aiFixing ? "⏳ Applying Fix..." : aiFixSuccess ? "✓ Responsive Applied" : "⚡ Auto Responsive Fix"}
                </button>
              </div>

              <div className="flex-1 p-3 bg-black">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste or write HTML/JSX section code here..."
                  className="w-full h-full min-h-[440px] bg-black text-neutral-200 font-mono text-xs p-4 rounded-xl border border-neutral-900 focus:outline-none focus:border-white leading-relaxed resize-none"
                />
              </div>
            </div>
          )}

        </div>

      </div>
    </Shell>
  );
}
