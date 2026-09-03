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

    /**
     * One endpoint, and a failure that fails.
     *
     * Two things used to happen here, both wrong.
     *
     * It posted to `/admin/save-section` and, on failure, to
     * `/admin/templates` — two endpoints that write the same row, so a
     * transient error produced a duplicate rather than a retry.
     *
     * And when both failed it wrote the section into
     * `localStorage.xite_admin_local_templates`, showed the operator
     * "The section was saved locally. It will sync to DB when the server is
     * fixed", and returned. **Nothing synced it.** No code in this repo ever
     * read that key and posted it. The Templates screen then merged it into the
     * library list, so the section looked saved, looked published, and no
     * tenant could ever use it — the editor reads the database. An author could
     * lose a day's work and be told twice that it was safe.
     *
     * A save that did not save is an error.
     */
    try {
      await api.post("/api/v1/admin/templates", payload);
      setSaveSuccess(true);
      setSaving(false);
      setTimeout(() => navigate("/templates"), 1400);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "The API rejected the section.";
      setError(
        `Could not save this section: ${message}. It has not been stored — ` +
          "copy your code somewhere safe before leaving this page.",
      );
      setSaving(false);
    }
    setSaving(false);
  };

  return (
    <Shell title="Add Section Studio">
      <div className="space-y-6 text-chalk min-h-[85vh] font-sans">
        
        {/* Header Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-night-line pb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/templates")}
              className="flex items-center gap-2 text-xs font-bold px-3.5 py-2 rounded-lg bg-night-raised border border-night-line hover:border-night-line text-chalk-dim hover:text-chalk transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div>
              <span className="text-[11px] font-mono uppercase text-chalk-dim font-bold tracking-wider">
                Admin Section Studio
              </span>
              <h1 className="text-xl font-bold text-chalk tracking-tight">
                Add Section Code — {typeName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => void handleAutoResponsive()}
              disabled={aiFixing}
              className={`flex items-center gap-2 text-night font-bold text-xs px-4 py-2.5 rounded-lg shadow-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                aiFixSuccess
                  ? "bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600"
                  : "bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600"
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
              icon={<Save className="w-4 h-4 text-night" />}
              size="sm"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {aiFixSuccess && (
          <div className="p-4 rounded-lg bg-violet-50 border border-violet-200 text-violet-700 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-violet-600" />
            <span>⚡ Section normalised. Responsive behaviour is applied automatically at every breakpoint — on this preview, in the editor and on the published site — so there is nothing to bake in here. Review and save when ready.</span>
          </div>
        )}

        {optSuccess && (
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold flex items-center gap-2 animate-bounce">
            <CheckCircle className="w-4 h-4 text-amber-600" />
            <span>⚡ Section code auto-optimized with fluid responsive rules for Desktop (1200px), Tablet (768px), and Mobile (375px)!</span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Section code saved successfully! Live database updated.</span>
          </div>
        )}

        {/* Component Key & Metadata Bar */}
        <div className="grid gap-4 sm:grid-cols-2 bg-night p-4 rounded-lg border border-night-line">
          <div>
            <label className="text-xs font-semibold text-chalk-dim uppercase">Section Variant Title</label>
            <input
              type="text"
              value={variantName}
              onChange={(e) => setVariantName(e.target.value)}
              className="w-full mt-1.5 bg-night border border-night-line rounded-lg px-3.5 py-2 text-xs font-bold text-chalk focus:outline-none focus:border-night-line"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-chalk-dim uppercase">Upload Code File (.html, .jsx, .tsx, .css)</label>
            <div className="mt-1.5 flex items-center gap-3">
              <label className="flex items-center gap-2 bg-night-raised border border-night-line hover:border-chalk/25 text-chalk px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all">
                <Upload className="w-4 h-4" />
                <span>Choose File</span>
                <input type="file" onChange={handleFileUpload} accept=".html,.jsx,.tsx,.vue,.css,.txt" className="hidden" />
              </label>
              {fileName && <span className="text-xs font-mono text-chalk-dim truncate">{fileName}</span>}
            </div>
          </div>
        </div>

        {/* Step-by-Step View Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-night p-3.5 rounded-lg border border-night-line">
          <div className="flex items-center gap-2 bg-night p-1.5 rounded-lg border border-night-line">
            <button
              type="button"
              onClick={() => setViewMode("code")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                viewMode === "code" ? "bg-accent text-night shadow-lg" : "text-chalk-dim hover:text-chalk"
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>1. Add / Edit Code</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                viewMode === "preview" ? "bg-accent text-white shadow-lg shadow-chalk/20" : "text-chalk-dim hover:text-chalk"
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>2. Test & Full Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                viewMode === "split" ? "bg-accent text-night shadow-md" : "text-chalk-dim hover:text-chalk"
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
                className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white shadow-md cursor-pointer transition-all"
              >
                <Eye className="w-4 h-4" />
                <span>Test Live Preview &rarr;</span>
              </button>
            )}
            {viewMode === "preview" && (
              <button
                type="button"
                onClick={() => setViewMode("code")}
                className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg bg-night-raised border border-night-line hover:border-night-line text-chalk-dim hover:text-chalk cursor-pointer transition-all"
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
            <div className="flex flex-col bg-night border border-night-line rounded-lg overflow-hidden shadow-lg">
              <div className="p-3.5 border-b border-night-line bg-night-raised flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-chalk" />
                  <span className="text-xs font-semibold text-chalk tracking-wide uppercase">
                    Section Source Code {viewMode === "code" && "(Full Page Editor)"}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => void handleAutoResponsive()}
                    disabled={aiFixing}
                    className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                      aiFixSuccess
                        ? "text-emerald-700 bg-emerald-100 border border-emerald-300 hover:bg-emerald-600 hover:text-night"
                        : "text-violet-700 bg-violet-100 border border-violet-300 hover:bg-violet-600 hover:text-night"
                    }`}
                  >
                    {aiFixing ? "⏳ Applying Fix..." : aiFixSuccess ? "✓ Responsive Applied" : "⚡ Auto Responsive Fix"}
                  </button>
                </div>
              </div>

              <div className="flex-1 p-3.5 bg-night flex flex-col">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste or write HTML/JSX section code here..."
                  className="w-full flex-1 min-h-[500px] bg-white text-chalk font-mono text-xs p-4 rounded-lg border border-night-line focus:outline-none focus:border-chalk leading-relaxed resize-y"
                />

                {/* Bottom Action Footer for Code Tab */}
                {viewMode === "code" && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-night-line mt-3">
                    <span className="text-[11px] font-mono text-chalk-dim">
                      Paste HTML with &lt;style&gt;, classes, or inline styles
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setViewMode("preview")}
                        className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white shadow-lg shadow-chalk/20 cursor-pointer transition-all"
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
            <div className="flex flex-col bg-night border border-night-line rounded-lg overflow-hidden shadow-lg">
              <div className="p-3.5 border-b border-night-line bg-night-raised flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-chalk" />
                  <span className="text-xs font-semibold text-chalk tracking-wide uppercase">
                    Live Section Preview {viewMode === "preview" && "(Full Width Canvas)"}
                  </span>
                </div>

                {/* Viewport Width Switcher */}
                <div className="flex items-center gap-1.5 bg-night p-1.5 rounded-lg border border-night-line">
                  <button
                    type="button"
                    onClick={() => setPreviewWidth("100%")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      previewWidth === "100%" ? "bg-accent text-white shadow-md" : "text-chalk-dim hover:text-chalk"
                    }`}
                  >
                    🖥️ Full Canvas (100%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewWidth("1200px")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      previewWidth === "1200px" ? "bg-accent text-white shadow-md" : "text-chalk-dim hover:text-chalk"
                    }`}
                  >
                    💻 Desktop (1200px)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewWidth("768px")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      previewWidth === "768px" ? "bg-accent text-white shadow-md" : "text-chalk-dim hover:text-chalk"
                    }`}
                  >
                    📱 Tablet (768px)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewWidth("375px")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      previewWidth === "375px" ? "bg-accent text-white shadow-md" : "text-chalk-dim hover:text-chalk"
                    }`}
                  >
                    📱 Mobile (375px)
                  </button>
                </div>
              </div>

              <div className="flex-1 p-4 bg-night-raised flex flex-col items-center justify-center overflow-auto min-h-[500px]">
                <div
                  style={{ width: previewWidth, maxWidth: "100%" }}
                  className="w-full flex-1 min-h-[480px] transition-all duration-300 mx-auto shadow-lg rounded-lg border border-night-line overflow-hidden bg-white flex flex-col"
                >
                  <iframe
                    title="Section Preview"
                    srcDoc={buildSectionPreviewDocument(previewCode)}
                    className="w-full flex-1 min-h-[480px] bg-white border-0"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    allow="autoplay; fullscreen"
                  />
                </div>
              </div>

              {/* Bottom Action Footer for Preview Tab */}
              {viewMode === "preview" && (
                <div className="p-3.5 bg-night border-t border-night-line flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setViewMode("code")}
                    className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg bg-night-raised border border-night-line hover:border-night-line text-chalk-dim hover:text-chalk cursor-pointer transition-all"
                  >
                    <FileCode className="w-4 h-4" />
                    <span>&larr; Back to Code Editor</span>
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => void handleAutoResponsive()}
                      disabled={aiFixing}
                      className="text-xs font-bold text-violet-600 hover:text-violet-700 transition-colors cursor-pointer"
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
