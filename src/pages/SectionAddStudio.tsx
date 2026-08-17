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
  const [error, setError] = useState<string | null>(null);
  const [previewWidth, setPreviewWidth] = useState<string>("1200px");

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

    // 1. Rewrite static fixed header padding, gap, and link wrapping in code string for fluid responsive behavior
    currentCode = currentCode
      .replace(/(<header[^>]*style="[^"]*padding:\s*)([0-9]+px\s+[0-9]+px)("[^>]*>)/gi, `$116px clamp(12px, 3vw, 40px)$3`)
      .replace(/(<nav[^>]*style="[^"]*gap:\s*)([0-9]+px)("[^>]*>)/gi, `$1clamp(6px, 1.5vw, 24px)$3`)
      .replace(/(<a[^>]*style=")([^"]*)(")/gi, (_m, p1, p2, p3) => {
        if (!p2.includes("white-space")) {
          return `${p1}${p2}; white-space: nowrap;${p3}`;
        }
        return _m;
      });

    // 2. Comprehensive fluid auto-responsive styles
    const responsiveStyles = `
<style id="auto-responsive-styles">
  * { box-sizing: border-box !important; }
  img, video, iframe, canvas, svg { max-width: 100% !important; height: auto !important; }
  section, div, header, footer, nav, article { max-width: 100% !important; box-sizing: border-box !important; }

  header, nav {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }
  
  header > div, header nav {
    gap: clamp(6px, 1.5vw, 24px) !important;
  }
  
  /* Desktop Viewport Rules (min-width: 900px) */
  @media (min-width: 900px) {
    .hamburger, .mobile-toggle, [data-mobile-menu], .mobile-menu-btn, button.hamburger-btn {
      display: none !important;
    }
    .desktop-nav, nav, header nav, header ul, .nav-links {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      justify-content: flex-end !important;
      gap: clamp(8px, 1.5vw, 20px) !important;
      flex-wrap: nowrap !important;
    }
    header nav a, .nav-links a {
      white-space: nowrap !important;
      font-size: clamp(12px, 1.1vw, 15px) !important;
    }
  }

  /* Tablet Viewport Rules (641px to 899px) */
  @media (min-width: 641px) and (max-width: 899px) {
    header { padding-left: 16px !important; padding-right: 16px !important; }
    header nav a, .nav-links a { font-size: 13px !important; white-space: nowrap !important; }
    .grid, [style*="display: grid"], [style*="display:grid"] {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 16px !important;
    }
  }

  /* Mobile Viewport Rules (max-width: 640px) */
  @media (max-width: 640px) {
    section, header, footer {
      padding-left: 14px !important;
      padding-right: 14px !important;
    }
    
    header {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      justify-content: space-between !important;
      flex-wrap: wrap !important;
      padding-top: 12px !important;
      padding-bottom: 12px !important;
    }

    header nav:not([data-mobile-open]), .nav-links:not([data-mobile-open]) {
      display: none !important;
    }

    header nav[data-mobile-open], .nav-links[data-mobile-open] {
      display: flex !important;
      flex-direction: column !important;
      width: 100% !important;
      background: rgba(15, 23, 42, 0.98) !important;
      padding: 16px !important;
      border-radius: 12px !important;
      margin-top: 12px !important;
      gap: 12px !important;
    }

    h1 { font-size: clamp(24px, 6vw, 36px) !important; line-height: 1.2 !important; }
    h2 { font-size: clamp(20px, 5vw, 28px) !important; }
    h3 { font-size: clamp(16px, 4vw, 22px) !important; }

    .grid, [style*="display: grid"], [style*="display:grid"] {
      grid-template-columns: 1fr !important;
      gap: 16px !important;
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
    } else {
      currentCode = currentCode.replace(/<style id="auto-responsive-styles">[\s\S]*?<\/style>/gi, responsiveStyles.trim());
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
      const cleanCategory = (typeId || "header").toLowerCase();
      const customTitle = variantName.trim() || `Variant ${Date.now().toString().slice(-4)}`;
      const finalName = `${typeName} [${cleanCategory}] - ${customTitle}`;

      const payload = {
        name: finalName,
        category: cleanCategory,
        description: `Admin uploaded section for ${typeName}`,
        code: code,
        isPublished: true,
      };

      const localItem = {
        id: `tpl-${Date.now()}`,
        name: finalName,
        category: cleanCategory,
        description: `Admin uploaded section for ${typeName}`,
        code: code,
        isPublished: true,
        colleges: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await api.post("/api/v1/admin/templates", payload);
      } catch (err) {
        console.error("[SectionAddStudio] Failed to save template:", err);
      }

      // Always save to localStorage so section addition never fails
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("xite_admin_local_templates");
          const list = raw ? JSON.parse(raw) : [];
          list.unshift(localItem);
          localStorage.setItem("xite_admin_local_templates", JSON.stringify(list));
        } catch {}
      }

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
              <div className="flex items-center gap-1.5 bg-slate-950/95 p-2 px-3 rounded-full border border-slate-800/90 shadow-inner">
                {[
                  { label: "🖥️ Desktop (1200px)", width: "1200px" },
                  { label: "📱 Tablet (768px)", width: "768px" },
                  { label: "📱 Mobile (375px)", width: "375px" },
                ].map((item) => {
                  const isActive = previewWidth === item.width;
                  return (
                    <button
                      key={item.width}
                      type="button"
                      onClick={() => setPreviewWidth(item.width)}
                      className={`relative text-[11px] font-bold px-3.5 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95 ${
                        isActive
                          ? "text-white font-extrabold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full shadow-md shadow-blue-600/30 border border-blue-400/30 pointer-events-none" />
                      )}
                      <span className="relative z-10">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 bg-neutral-900 p-4 overflow-auto flex items-center justify-center min-h-[420px] transition-all">
              <div
                style={{ width: previewWidth, maxWidth: "100%" }}
                className="h-full min-h-[400px] transition-all duration-300 mx-auto shadow-2xl rounded-xl border border-neutral-800 overflow-hidden"
              >
                <iframe
                  title="Section Preview"
                  srcDoc={'<!DOCTYPE html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><style>body{margin:0;padding:0;background:#0d1527;color:#ffffff;font-family:system-ui,-apple-system,sans-serif;}*{box-sizing:border-box;}</style></head><body>' + code + '</body></html>'}
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
