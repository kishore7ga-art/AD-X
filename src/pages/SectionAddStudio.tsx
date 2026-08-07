import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Upload, Save, ArrowLeft, Eye, FileCode, CheckCircle, AlertCircle } from "lucide-react";
import { Shell } from "@/components/Shell";
import { api } from "@/api/client";

const DEFAULT_STARTER_CODE = `<!-- Section Component: Hero Banner -->
<section style="background: #000; color: #fff; padding: 80px 24px; text-align: center; font-family: system-ui, sans-serif;">
  <div style="max-w: 800px; margin: 0 auto;">
    <span style="border: 1px solid #333; padding: 6px 16px; border-radius: 9999px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #ccc;">Official Campus Portal</span>
    <h1 style="font-size: 48px; font-weight: 900; margin-top: 24px; letter-spacing: -0.02em; line-height: 1.1;">Excellence in Higher Education & Innovation</h1>
    <p style="font-size: 16px; color: #888; margin-top: 16px; line-height: 1.6;">Empowering minds, advancing research, and building leaders for tomorrow's challenges.</p>
    <div style="margin-top: 32px; display: flex; justify-content: center; gap: 16px;">
      <a href="#explore" style="background: #fff; color: #000; padding: 12px 28px; border-radius: 12px; font-size: 14px; font-weight: 800; text-decoration: none;">Explore Programs</a>
      <a href="#contact" style="border: 1px solid #333; color: #fff; padding: 12px 28px; border-radius: 12px; font-size: 14px; font-weight: 800; text-decoration: none;">Contact Us</a>
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
  const [error, setError] = useState<string | null>(null);
  const [previewWidth, setPreviewWidth] = useState<string>("100%");

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

  const handleSaveToDatabase = async () => {
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      await api.post("/api/v1/admin/templates", {
        name: `${typeName} [${typeId}] - ${variantName}`,
        description: `Admin uploaded section for ${typeName}`,
        code: code,
        isPublished: true,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        navigate("/templates");
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save section to database");
    } finally {
      setSaving(false);
    }
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
              onClick={handleAutoResolutionOptimize}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-black text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer"
              title="Automatically optimize code layout & responsive CSS rules for Desktop, Tablet, and Mobile devices"
            >
              <span>⚡ Auto Resolution Code Edit</span>
            </button>

            <button
              onClick={handleSaveToDatabase}
              disabled={saving}
              className="flex items-center gap-2 bg-white text-black hover:bg-neutral-200 font-black text-xs px-6 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving to Database..." : saveSuccess ? "Saved to DB ✓" : "Save Section to DB"}</span>
            </button>
          </div>
        </div>

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
              <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-full border border-slate-800 shadow-inner">
                <button
                  type="button"
                  onClick={() => setPreviewWidth("100%")}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    previewWidth === "100%"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-md shadow-blue-600/30 scale-105 border border-blue-400/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  🖥️ Desktop (1200px)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewWidth("768px")}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    previewWidth === "768px"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-md shadow-blue-600/30 scale-105 border border-blue-400/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  📱 Tablet (768px)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewWidth("375px")}
                  className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    previewWidth === "375px"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black shadow-md shadow-blue-600/30 scale-105 border border-blue-400/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
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
                className="w-full h-full min-h-[400px] bg-black text-neutral-200 font-mono text-xs p-4 rounded-xl border border-neutral-900 focus:outline-none focus:border-white leading-relaxed resize-none"
              />
            </div>
          </div>

        </div>

      </div>
    </Shell>
  );
}
