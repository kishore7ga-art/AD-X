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
  // ─── Smart Auto-Responsive Engine ────────────────────────────────────────────
  // Fully rewrites inline styles + injects adaptive CSS.
  // Works on ANY HTML: headers, heroes, cards, grids, footers, etc.
  const handleAutoResolutionOptimize = () => {
    let html = code;

    // ── STEP 1: Rewrite all inline style="" attributes ──────────────────────────
    html = html.replace(/style="([^"]*)"/gi, (_match, styleStr: string) => {
      let s = styleStr;

      // 1a. Convert all fixed font-size px → clamp()
      s = s.replace(/font-size:\s*(\d+(\.\d+)?)(px)/gi, (_m: string, px: string) => {
        const v = parseFloat(px);
        if (v <= 10) return `font-size: ${v}px`;
        if (v <= 13) return `font-size: clamp(11px, ${(v / 16).toFixed(2)}vw, ${v}px)`;
        if (v <= 18) return `font-size: clamp(13px, ${(v / 14).toFixed(2)}vw, ${v}px)`;
        if (v <= 28) return `font-size: clamp(16px, ${(v / 12).toFixed(2)}vw, ${v}px)`;
        if (v <= 40) return `font-size: clamp(20px, ${(v / 10).toFixed(2)}vw, ${v}px)`;
        if (v <= 60) return `font-size: clamp(24px, ${(v / 9).toFixed(2)}vw, ${v}px)`;
        return `font-size: clamp(28px, ${(v / 8).toFixed(2)}vw, ${v}px)`;
      });

      // 1b. Convert fixed width: Npx → fluid (only on non-icon small values)
      s = s.replace(/(?<![a-z-])width:\s*(\d+)(px)/gi, (_m: string, px: string) => {
        const v = parseInt(px);
        if (v <= 60) return `width: ${v}px`; // icons/avatars stay fixed
        if (v <= 300) return `width: min(${v}px, 100%)`;
        return `width: 100%`; // large widths → full width
      });

      // 1c. max-width: large fixed → responsive
      s = s.replace(/max-width:\s*(\d+)(px)/gi, (_m: string, px: string) => {
        const v = parseInt(px);
        if (v >= 800) return `max-width: min(${v}px, 100%)`;
        return `max-width: ${v}px`;
      });

      // 1d. Fixed padding: top/bottom stay, left/right become fluid
      s = s.replace(/padding:\s*(\d+px)\s+(\d+px)(?:\s+(\d+px)\s+(\d+px))?/gi,
        (_m: string, t: string, r: string, b?: string, _l?: string) => {
          const rVal = parseInt(r);
          const fluidH = rVal >= 24 ? `clamp(12px, ${(rVal / 14).toFixed(1)}vw, ${rVal}px)` : r;
          return b ? `padding: ${t} ${fluidH} ${b} ${fluidH}` : `padding: ${t} ${fluidH}`;
        });

      // 1e. grid-template-columns: fixed → responsive auto-fit
      s = s.replace(/grid-template-columns:\s*repeat\((\d+),\s*1fr\)/gi, (_m: string, cols: string) => {
        const n = parseInt(cols);
        if (n <= 2) return `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`;
        if (n <= 4) return `grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))`;
        return `grid-template-columns: repeat(auto-fit, minmax(160px, 1fr))`;
      });
      s = s.replace(/grid-template-columns:\s*repeat\((\d+),\s*(\d+px)\)/gi, (_m: string, _cols: string, px: string) => {
        return `grid-template-columns: repeat(auto-fit, minmax(min(${px}, 100%), 1fr))`;
      });

      // 1f. Fixed gap → fluid gap
      s = s.replace(/(?<![a-z-])gap:\s*(\d+)(px)/gi, (_m: string, px: string) => {
        const v = parseInt(px);
        if (v <= 8) return `gap: ${v}px`;
        return `gap: clamp(8px, ${(v / 16).toFixed(1)}vw, ${v}px)`;
      });

      // 1g. height: Npx on non-icon elements → min-height
      s = s.replace(/(?<![a-z-])height:\s*(\d+)(px)/gi, (_m: string, px: string) => {
        const v = parseInt(px);
        if (v <= 60) return `height: ${v}px`; // keep small fixed heights (icons/badges)
        if (v <= 200) return `min-height: ${v}px; height: auto`;
        return `min-height: ${Math.round(v * 0.6)}px; height: auto`;
      });

      // 1h. border-radius: huge fixed → clamp
      s = s.replace(/border-radius:\s*(\d+)(px)/gi, (_m: string, px: string) => {
        const v = parseInt(px);
        if (v > 20) return `border-radius: clamp(8px, ${(v / 20).toFixed(1)}vw, ${v}px)`;
        return `border-radius: ${v}px`;
      });

      return `style="${s}"`;
    });

    // ── STEP 2: Make images always responsive ───────────────────────────────────
    html = html.replace(/<img\b([^>]*)>/gi, (_m: string, attrs: string) => {
      let a = attrs;
      if (!a.includes('max-width')) {
        if (a.includes('style="')) {
          a = a.replace(/style="([^"]*)"/i, (_ms: string, s: string) => `style="${s}; max-width: 100%; height: auto; display: block;"`);
        } else {
          a += ` style="max-width: 100%; height: auto; display: block;"`;
        }
      }
      return `<img${a}>`;
    });

    // ── STEP 3: Inject complete responsive style block ──────────────────────────
    const responsiveCSS = `
<style id="auto-responsive-engine">
/* ── Auto-Responsive Engine: Generated by XITE Admin Studio ── */

/* Base reset */
*, *::before, *::after { box-sizing: border-box !important; }
html { -webkit-text-size-adjust: 100%; }

/* All block-level elements constrained */
section, article, aside, main, header, footer, nav, div, figure {
  max-width: 100% !important;
  box-sizing: border-box !important;
}

/* Images & media always fluid */
img, video, iframe, svg, canvas, picture, embed {
  max-width: 100% !important;
  height: auto !important;
}

/* Headings – fluid clamp scale */
h1 { font-size: clamp(22px, 5vw, 56px) !important; line-height: 1.15 !important; }
h2 { font-size: clamp(18px, 4vw, 40px) !important; line-height: 1.2 !important; }
h3 { font-size: clamp(15px, 3vw, 28px) !important; }
h4 { font-size: clamp(13px, 2.5vw, 22px) !important; }
h5, h6 { font-size: clamp(12px, 2vw, 18px) !important; }

/* Buttons – full fluid */
button, a[href], [role="button"], input[type="submit"], input[type="button"] {
  cursor: pointer !important;
  max-width: 100% !important;
}

/* ── Desktop (≥1024px) ─────────────────────────────────────── */
@media (min-width: 1024px) {
  header, [class*="header"], [class*="navbar"] {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    width: 100% !important;
    flex-wrap: nowrap !important;
  }
  .hamburger-toggle-btn, .mobile-drawer-menu, [class*="hamburger"], [class*="mobile-menu"] {
    display: none !important;
  }
  .desktop-nav-links, nav, header nav, header ul {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    flex-wrap: nowrap !important;
    gap: clamp(10px, 1.5vw, 28px) !important;
  }
  [style*="grid-template-columns"] {
    display: grid !important;
  }
}

/* ── Tablet (640px – 1023px) ───────────────────────────────── */
@media (min-width: 640px) and (max-width: 1023px) {
  header, [class*="header"], [class*="navbar"] {
    padding-left: clamp(16px, 3vw, 32px) !important;
    padding-right: clamp(16px, 3vw, 32px) !important;
  }
  [style*="grid-template-columns"] {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)) !important;
    display: grid !important;
    gap: 16px !important;
  }
  [style*="display: flex"], [style*="display:flex"] {
    flex-wrap: wrap !important;
  }
  nav a, .nav-links a, header a {
    font-size: 13px !important;
    white-space: nowrap !important;
  }
}

/* ── Mobile (≤639px) ───────────────────────────────────────── */
@media (max-width: 639px) {
  /* Padding: every section gets safe horizontal padding */
  section, header, footer, article, aside, main, .card, [class*="section"] {
    padding-left: clamp(14px, 5vw, 24px) !important;
    padding-right: clamp(14px, 5vw, 24px) !important;
    min-width: 0 !important;
  }

  /* Header: stacks logo + hamburger in a row, hides desktop nav */
  header, [class*="header"], [class*="navbar"] {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    justify-content: space-between !important;
    flex-wrap: wrap !important;
    padding-top: 12px !important;
    padding-bottom: 12px !important;
    width: 100% !important;
    position: relative !important;
  }

  /* Desktop nav: hidden on mobile */
  .desktop-nav-links, header > nav, header ul, [class*="nav-links"] {
    display: none !important;
  }

  /* Mobile drawer: shown when active */
  .mobile-drawer-menu[style*="display: flex"],
  .mobile-drawer-menu[style*="display:flex"],
  [data-mobile-open] {
    display: flex !important;
    flex-direction: column !important;
    width: 100% !important;
    gap: 10px !important;
  }

  /* Hamburger button: always visible on mobile */
  .hamburger-toggle-btn, [class*="hamburger"], [class*="mobile-toggle"] {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  /* All flex rows → wrap */
  [style*="display: flex"], [style*="display:flex"] {
    flex-wrap: wrap !important;
    min-width: 0 !important;
  }

  /* All grids → single column */
  [style*="grid-template-columns"],
  [style*="display: grid"], [style*="display:grid"] {
    grid-template-columns: 1fr !important;
    display: grid !important;
    gap: 16px !important;
  }

  /* Cards full width */
  [class*="card"], [class*="Card"], .card {
    width: 100% !important;
    min-width: 0 !important;
  }

  /* Buttons: full width on mobile */
  a[style*="padding"], button, [role="button"] {
    display: block !important;
    width: 100% !important;
    text-align: center !important;
    box-sizing: border-box !important;
  }

  /* Button row: stack vertically */
  div:has(> a[style*="padding"]) {
    flex-direction: column !important;
    align-items: stretch !important;
    width: 100% !important;
  }

  /* Headings tight on mobile */
  h1 { font-size: clamp(22px, 7vw, 36px) !important; letter-spacing: -0.02em !important; }
  h2 { font-size: clamp(18px, 6vw, 28px) !important; }
  h3 { font-size: clamp(15px, 5vw, 22px) !important; }

  /* Text readable on small screens */
  p, span, li { font-size: clamp(13px, 3.5vw, 16px) !important; line-height: 1.6 !important; }

  /* Tables → scroll */
  table { display: block !important; overflow-x: auto !important; width: 100% !important; }

  /* Iframes/embeds → constrained */
  iframe { max-width: 100% !important; }
}

/* ── Hamburger Toggle Script ────────────────────────────────── */
</style>
<script id="auto-responsive-hamburger">
(function() {
  function initHamburger() {
    var btn = document.querySelector('.hamburger-toggle-btn, [class*="hamburger-btn"], [aria-label*="Navigation"]');
    var drawer = document.querySelector('.mobile-drawer-menu, [class*="mobile-drawer"], [class*="mobile-menu"]');
    if (btn && drawer) {
      btn.addEventListener('click', function() {
        var isOpen = drawer.style.display === 'flex';
        drawer.style.display = isOpen ? 'none' : 'flex';
        drawer.style.flexDirection = 'column';
        drawer.style.gap = '10px';
        drawer.style.width = '100%';
        drawer.style.padding = '16px 0';
      });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHamburger);
  } else {
    initHamburger();
  }
})();
</script>`;

    // Remove old auto-responsive block if present, then inject new one
    html = html.replace(/<style id="auto-responsive[^"]*">[\s\S]*?<\/style>/gi, '');
    html = html.replace(/<script id="auto-responsive[^"]*">[\s\S]*?<\/script>/gi, '');

    // Inject at the very end of the outermost closing tag
    const closingTags = ['</section>', '</footer>', '</header>', '</article>', '</div>'];
    let injected = false;
    for (const tag of closingTags) {
      const idx = html.lastIndexOf(tag);
      if (idx !== -1) {
        html = html.slice(0, idx + tag.length) + '\n' + responsiveCSS;
        injected = true;
        break;
      }
    }
    if (!injected) {
      html = html + '\n' + responsiveCSS;
    }

    setCode(html);
    setOptSuccess(true);
    setTimeout(() => setOptSuccess(false), 3500);
  };

  const handleSaveToDatabase = async () => {
    if (!code.trim()) { setError('Please paste HTML code first.'); return; }
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    // Extract body content from full HTML documents
    let cleanCode = code.trim();
    if (/^<!DOCTYPE/i.test(cleanCode) || /<html[\s>]/i.test(cleanCode)) {
      const bodyMatch = cleanCode.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      cleanCode = bodyMatch?.[1]?.trim() || cleanCode
        .replace(/^<!DOCTYPE[^>]*>/i, '').replace(/<html[^>]*>/i, '')
        .replace(/<\/html>/i, '').replace(/<head[\s\S]*?<\/head>/i, '').trim();
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
