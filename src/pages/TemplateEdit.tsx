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
  const [previewWidth, setPreviewWidth] = useState<string>("1200px");

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
  // Runs 100% locally in the browser — no API key, no network, no rate limits.
  // Transforms any HTML section code to be fully responsive across all devices.
  const handleAIOptimize = async () => {
    const currentCode = code.trim();
    if (!currentCode) {
      setError("Please paste or write section code before using Auto Responsive Fix.");
      return;
    }

    setAiFixing(true);
    setAiFixSuccess(false);
    setOptSuccess(false);
    setError(null);

    try {
      // Small delay so the button state renders before heavy processing
      await new Promise((r) => setTimeout(r, 80));

      const result = applyAutoResponsive(currentCode);
      setCode(result);
      setAiFixSuccess(true);
      setTimeout(() => setAiFixSuccess(false), 5000);
    } catch (err: any) {
      setError(`Auto Responsive fix failed: ${err?.message || "Unknown error"}`);
    } finally {
      setAiFixing(false);
    }
  };

  /**
   * Local auto-responsive transformation algorithm.
   * Applies 12 rules to make any HTML section render beautifully on all screen sizes.
   */
  const applyAutoResponsive = (raw: string): string => {
    let html = raw;

    // ── 1. Ensure viewport meta tag exists ─────────────────────────────────────
    if (!html.includes("viewport")) {
      html = html.replace(
        /<head([^>]*)>/i,
        `<head$1>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />`
      );
      if (!html.includes("viewport")) {
        html = `<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n` + html;
      }
    }

    // ── 2. Fluid font sizes — convert large fixed px to clamp() ───────────────
    html = html.replace(/font-size:\s*(\d+(?:\.\d+)?)px/gi, (_m, px) => {
      const n = parseFloat(px);
      if (n >= 48) return `font-size: clamp(28px, ${(n / 14).toFixed(1)}vw, ${n}px)`;
      if (n >= 32) return `font-size: clamp(20px, ${(n / 14).toFixed(1)}vw, ${n}px)`;
      if (n >= 20) return `font-size: clamp(14px, ${(n / 16).toFixed(1)}vw, ${n}px)`;
      if (n >= 14) return `font-size: clamp(12px, ${(n / 18).toFixed(1)}vw, ${n}px)`;
      return `font-size: ${n}px`;
    });

    // ── 3. Fixed pixel widths → fluid max-width + 100% width ──────────────────
    // Only converts container-level widths (>= 600px), not small icon sizes
    html = html.replace(/\bwidth:\s*(\d+)px/gi, (_m, px) => {
      const n = parseInt(px, 10);
      if (n >= 1000) return `width: 100%; max-width: ${n}px`;
      if (n >= 600) return `width: 100%; max-width: ${n}px`;
      return _m;
    });

    // ── 4. Fluid padding — large fixed padding → clamp() ─────────────────────
    html = html.replace(/\bpadding:\s*(\d+)px\s+(\d+)px/gi, (_m, v, h) => {
      const vn = parseInt(v, 10), hn = parseInt(h, 10);
      const vr = vn > 40 ? `clamp(24px, ${(vn / 10).toFixed(1)}vw, ${vn}px)` : `${vn}px`;
      const hr = hn > 40 ? `clamp(16px, ${(hn / 12).toFixed(1)}vw, ${hn}px)` : `${hn}px`;
      return `padding: ${vr} ${hr}`;
    });
    html = html.replace(/\bpadding:\s*(\d+)px\s+(\d+)px\s+(\d+)px\s+(\d+)px/gi, (_m, t, r, b, l) => {
      const conv = (n: string) => {
        const v = parseInt(n, 10);
        return v > 40 ? `clamp(20px, ${(v / 10).toFixed(1)}vw, ${v}px)` : `${v}px`;
      };
      return `padding: ${conv(t)} ${conv(r)} ${conv(b)} ${conv(l)}`;
    });

    // ── 5. Remove fixed/sticky positioning (breaks mobile layout) ─────────────
    html = html.replace(/position:\s*fixed/gi, "position: relative");
    html = html.replace(/position:\s*sticky/gi, "position: relative");

    // ── 6. Make CSS Grid responsive — multi-column → auto-fit/minmax ──────────
    // Convert repeat(N, 1fr) where N > 2 to auto-fit so columns wrap naturally
    html = html.replace(/grid-template-columns:\s*repeat\(([3-9]|\d{2,}),\s*1fr\)/gi, (_m, n) => {
      const count = parseInt(n, 10);
      const minW = count >= 4 ? "200px" : "240px";
      return `grid-template-columns: repeat(auto-fit, minmax(${minW}, 1fr))`;
    });
    // Convert explicit 3/4 column definitions
    html = html.replace(/grid-template-columns:\s*1fr\s+1fr\s+1fr\s+1fr/gi, "grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))");
    html = html.replace(/grid-template-columns:\s*1fr\s+1fr\s+1fr/gi, "grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))");

    // ── 7. Make Flexbox wrap ───────────────────────────────────────────────────
    // Add flex-wrap: wrap to flex containers that don't have it
    html = html.replace(/(display:\s*flex[^"';]*?)(?!\bflex-wrap\b)/gi, (_m, p1) => {
      if (p1.includes("flex-wrap") || p1.includes("flex-direction: column")) return _m;
      return p1 + "; flex-wrap: wrap";
    });

    // ── 8. Fluid max-width containers — ensure mx-auto centering ─────────────
    html = html.replace(/class="([^"]*max-w-[^"]*)"/gi, (_m, cls) => {
      if (cls.includes("mx-auto") || cls.includes("m-auto")) return _m;
      return `class="${cls} mx-auto"`;
    });
    // Add margin: 0 auto to inline max-width styles
    html = html.replace(/(max-width:\s*\d+(?:px|%|rem|vw)[^"';]*?)(?!margin)/gi, (_m, p1) => {
      if (p1.includes("margin")) return _m;
      return p1 + "; margin-left: auto; margin-right: auto";
    });

    // ── 9. Make images responsive ─────────────────────────────────────────────
    html = html.replace(/<img([^>]*?)>/gi, (_m, attrs) => {
      if (attrs.includes("max-width")) return _m;
      const hasStyle = /style=/i.test(attrs);
      if (hasStyle) {
        return `<img${attrs.replace(/style="([^"]*)"/i, 'style="$1; max-width: 100%; height: auto;"')}>`;
      }
      return `<img${attrs} style="max-width: 100%; height: auto;">`;
    });

    // ── 10. Inject comprehensive responsive CSS block ─────────────────────────
    const responsiveStyles = `
<style data-xite-responsive="true">
  /* ═══ XITE Auto-Responsive Engine ════════════════════════════════════════ */
  *, *::before, *::after { box-sizing: border-box; }

  /* Fluid images & media */
  img, video, iframe, svg { max-width: 100%; height: auto; display: block; }

  /* Container fluid constraint */
  body > *, section, header, footer, nav, main, article, aside {
    max-width: 100%;
    overflow-x: hidden;
  }

  /* ── Mobile (≤ 640px) ─────────────────────────────────────────────────── */
  @media (max-width: 640px) {
    /* Stack all flex rows vertically */
    [style*="display: flex"], [style*="display:flex"],
    .flex, .d-flex {
      flex-wrap: wrap !important;
    }
    /* Single column grids */
    [style*="grid-template-columns"],
    .grid { grid-template-columns: 1fr !important; }

    /* Full width buttons */
    a[style*="border-radius"], button[style*="border-radius"],
    .btn, button { width: auto; max-width: 100%; }

    /* Scale down huge text */
    h1 { font-size: clamp(26px, 7vw, 48px) !important; line-height: 1.2 !important; }
    h2 { font-size: clamp(20px, 5.5vw, 36px) !important; }
    h3 { font-size: clamp(16px, 4.5vw, 28px) !important; }
    p  { font-size: clamp(13px, 3.5vw, 16px) !important; line-height: 1.65 !important; }

    /* Breathable padding on mobile */
    section, header, footer { padding-left: 16px !important; padding-right: 16px !important; }
    [style*="padding: 80px"], [style*="padding: 100px"], [style*="padding: 120px"] {
      padding-top: 40px !important; padding-bottom: 40px !important;
    }

    /* Hide desktop nav links, show hamburger hint */
    nav ul, nav ol, header nav { display: none !important; }
    .mobile-menu-toggle, .hamburger { display: flex !important; }

    /* Prevent text overflow */
    * { word-break: break-word; overflow-wrap: break-word; }
  }

  /* ── Tablet (641px – 1024px) ──────────────────────────────────────────── */
  @media (min-width: 641px) and (max-width: 1024px) {
    /* Max 2 columns */
    [style*="grid-template-columns: repeat(auto-fit"] {
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important;
    }
    h1 { font-size: clamp(28px, 4vw, 52px) !important; }
    h2 { font-size: clamp(22px, 3.5vw, 40px) !important; }
    section, header, footer { padding-left: 32px !important; padding-right: 32px !important; }
  }

  /* ── Desktop (> 1024px) ───────────────────────────────────────────────── */
  @media (min-width: 1025px) {
    .hamburger, .mobile-menu-toggle { display: none !important; }
    nav ul, nav ol, header nav { display: flex !important; }
  }
</style>`;

    // Insert before closing </head> or at the very beginning
    if (/<\/head>/i.test(html)) {
      html = html.replace(/<\/head>/i, `${responsiveStyles}\n</head>`);
    } else if (/<body[^>]*>/i.test(html)) {
      html = html.replace(/<body([^>]*)>/i, `<body$1>\n${responsiveStyles}`);
    } else {
      html = responsiveStyles + "\n" + html;
    }

    // ── 11. Add hamburger toggle for headers missing one ───────────────────────
    if (/<header/i.test(html) && !html.includes("hamburger") && !html.includes("mobile-menu")) {
      const hamburgerScript = `
<script>
(function() {
  var toggle = document.querySelector('.hamburger, .mobile-menu-toggle');
  var nav = document.querySelector('header nav, header ul, header .nav-links');
  if (toggle && nav) {
    toggle.addEventListener('click', function() {
      nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
      nav.style.flexDirection = 'column';
      nav.style.width = '100%';
      nav.style.padding = '12px 0';
    });
  }
})();
</script>`;
      html = html.replace(/<\/body>/i, `${hamburgerScript}\n</body>`);
      if (!html.includes("</body>")) html += hamburgerScript;
    }

    // ── 12. Box-sizing and overflow safety on root elements ────────────────────
    html = html.replace(/(<(?:section|header|footer|div|main|article)[^>]*style="[^"]*)"(?=[^>]*>)/gi, (_m, p1) => {
      if (p1.includes("box-sizing")) return _m;
      return `${p1}; box-sizing: border-box; max-width: 100%; overflow-x: hidden;"`;
    });

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
              onClick={() => void handleAIOptimize()}
              disabled={aiFixing}
              className={`flex items-center gap-2 text-black font-black text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                aiFixSuccess
                  ? "bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 hover:to-green-400"
                  : "bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500"
              }`}
              title="Send this section code to Gemini AI for responsive fixes — backend-secured, API key never exposed to browser"
            >
              <span>
                {aiFixing ? "⏳ AI Fixing..." : aiFixSuccess ? "✓ AI Fixed" : "✦ AI Fix & Responsive"}
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
            <span>✦ AI Fix complete! The section has been optimized for Desktop (1200px), Tablet (768px), and Mobile (375px). Review and save when ready.</span>
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
                  srcDoc={'<!DOCTYPE html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><style>body{margin:0;padding:0;font-family:system-ui,-apple-system,sans-serif;}*{box-sizing:border-box;}</style></head><body>' + previewCode + '</body></html>'}
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
                onClick={() => void handleAIOptimize()}
                disabled={aiFixing}
                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                  aiFixSuccess
                    ? "text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500 hover:text-black"
                    : "text-violet-300 bg-violet-500/20 border border-violet-500/40 hover:bg-violet-500 hover:text-black"
                }`}
              >
                {aiFixing ? "⏳ AI Fixing..." : aiFixSuccess ? "✓ AI Fixed" : "✦ AI Fix & Responsive"}
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
