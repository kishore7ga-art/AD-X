import { useEffect, useRef, useState } from "react";
import { Eye, Sparkles, HelpCircle, Megaphone, Users } from "lucide-react";
import { buildSectionPreviewDocument } from "@/lib/section-runtime";

interface SectionThumbnailPreviewProps {
  name: string;
  category?: string | null;
  thumbnailUrl?: string | null;
  code?: string | null;
  className?: string;
  onQuickPreview?: () => void;
  compact?: boolean;
}

/**
 * Visual category fallback mockups when no custom image or HTML code is available.
 */
function CategoryMockupPreview({ category, name }: { category: string; name: string }) {
  const cat = (category || "").toLowerCase();

  if (cat.includes("faq")) {
    return (
      <div className="w-full h-full bg-slate-900 p-3 flex flex-col justify-between text-white select-none">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5">
          <div className="flex items-center gap-1.5 text-blue-400">
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Frequently Asked Questions</span>
          </div>
          <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">FAQ</span>
        </div>
        <div className="space-y-1.5 my-auto">
          <div className="bg-slate-800/90 rounded border border-slate-700 p-1.5 flex items-center justify-between">
            <div className="space-y-1 w-3/4">
              <div className="h-1.5 bg-slate-300 rounded w-5/6" />
              <div className="h-1 bg-slate-500 rounded w-1/2" />
            </div>
            <span className="text-[10px] text-blue-400 font-bold">−</span>
          </div>
          <div className="bg-slate-800/50 rounded border border-slate-700/60 p-1.5 flex items-center justify-between">
            <div className="h-1.5 bg-slate-400 rounded w-2/3" />
            <span className="text-[10px] text-slate-400 font-bold">+</span>
          </div>
          <div className="bg-slate-800/50 rounded border border-slate-700/60 p-1.5 flex items-center justify-between">
            <div className="h-1.5 bg-slate-400 rounded w-4/5" />
            <span className="text-[10px] text-slate-400 font-bold">+</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-800 font-mono">
          <span>Accordion Mode</span>
          <span className="text-emerald-400">Interactive</span>
        </div>
      </div>
    );
  }

  if (cat.includes("hero") || cat.includes("banner")) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 p-3 flex flex-col justify-between text-white select-none">
        <div className="flex items-center justify-between border-b border-indigo-800/40 pb-1.5">
          <div className="h-2 w-12 bg-indigo-400/60 rounded" />
          <div className="flex gap-1">
            <div className="h-1.5 w-6 bg-slate-500 rounded" />
            <div className="h-1.5 w-6 bg-slate-500 rounded" />
            <div className="h-1.5 w-6 bg-slate-500 rounded" />
          </div>
        </div>
        <div className="text-center space-y-1.5 py-1">
          <span className="inline-block bg-blue-500/20 text-blue-300 text-[8px] font-bold px-2 py-0.5 rounded-full border border-blue-400/30">
            CAMPUS EXCELLENCE 2026
          </span>
          <div className="h-2.5 bg-white rounded-full w-4/5 mx-auto" />
          <div className="h-1.5 bg-slate-400 rounded-full w-3/5 mx-auto" />
          <div className="flex justify-center gap-1.5 pt-1">
            <div className="h-4 w-14 bg-blue-500 rounded text-[7px] font-bold flex items-center justify-center text-white">Apply Now</div>
            <div className="h-4 w-14 bg-slate-800 border border-slate-700 rounded text-[7px] font-bold flex items-center justify-center text-slate-300">Explore</div>
          </div>
        </div>
        <div className="flex justify-around pt-1 border-t border-indigo-900/50 text-[8px] text-slate-400 font-mono">
          <span>#1 Ranked</span>
          <span>120+ Programs</span>
          <span>98% Placement</span>
        </div>
      </div>
    );
  }

  if (cat.includes("header") || cat.includes("navbar") || cat.includes("nav")) {
    return (
      <div className="w-full h-full bg-slate-900 p-3 flex flex-col justify-between text-white select-none">
        <div className="bg-slate-800/90 rounded-lg border border-slate-700 p-2 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded bg-blue-500 flex items-center justify-center text-[8px] font-black">X</div>
            <div className="h-2 w-16 bg-slate-200 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-1.5 w-8 bg-slate-400 rounded" />
            <div className="h-1.5 w-8 bg-slate-400 rounded" />
            <div className="h-1.5 w-8 bg-slate-400 rounded" />
          </div>
          <div className="h-3.5 w-12 bg-blue-600 rounded text-[7px] font-bold flex items-center justify-center">Contact</div>
        </div>
        <div className="text-center py-2 text-slate-500 text-[10px] italic">Header Navigation Bar</div>
        <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono border-t border-slate-800 pt-1">
          <span>Sticky Header</span>
          <span className="text-blue-400">Glassmorphism</span>
        </div>
      </div>
    );
  }

  if (cat.includes("cta") || cat.includes("call")) {
    return (
      <div className="w-full h-full bg-gradient-to-r from-violet-950 via-purple-900 to-indigo-950 p-3 flex flex-col justify-between text-white select-none">
        <div className="flex items-center gap-1 text-purple-300 text-[9px] font-bold uppercase">
          <Megaphone className="w-3 h-3" />
          <span>Call To Action</span>
        </div>
        <div className="text-center space-y-1.5">
          <div className="h-2.5 bg-white rounded-full w-5/6 mx-auto" />
          <div className="h-1.5 bg-purple-200/70 rounded-full w-2/3 mx-auto" />
          <div className="h-4 w-24 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[8px] font-black rounded mx-auto flex items-center justify-center shadow-lg">
            GET STARTED TODAY &rarr;
          </div>
        </div>
        <div className="flex items-center justify-between text-[9px] text-purple-300 font-mono border-t border-purple-800/40 pt-1">
          <span>High Conversion</span>
          <span>Banner</span>
        </div>
      </div>
    );
  }

  if (cat.includes("testimonials") || cat.includes("review")) {
    return (
      <div className="w-full h-full bg-slate-900 p-3 flex flex-col justify-between text-white select-none">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1">
          <div className="flex items-center gap-1 text-amber-400 text-[9px] font-bold">
            <Users className="w-3 h-3" />
            <span>Student Stories</span>
          </div>
          <span className="text-[8px] text-amber-400">★★★★★</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 my-auto">
          <div className="bg-slate-800/80 rounded border border-slate-700/70 p-1.5 space-y-1">
            <div className="h-1 bg-slate-300 rounded w-full" />
            <div className="h-1 bg-slate-300 rounded w-4/5" />
            <div className="flex items-center gap-1 pt-1">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <div className="h-1 bg-slate-400 rounded w-8" />
            </div>
          </div>
          <div className="bg-slate-800/80 rounded border border-slate-700/70 p-1.5 space-y-1">
            <div className="h-1 bg-slate-300 rounded w-full" />
            <div className="h-1 bg-slate-300 rounded w-4/5" />
            <div className="flex items-center gap-1 pt-1">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <div className="h-1 bg-slate-400 rounded w-8" />
            </div>
          </div>
        </div>
        <div className="text-[9px] text-slate-400 flex justify-between border-t border-slate-800 pt-1 font-mono">
          <span>Social Proof</span>
          <span className="text-amber-400">Verified Alumni</span>
        </div>
      </div>
    );
  }

  // Generic stylish component card mockup
  return (
    <div className="w-full h-full bg-slate-900 p-3 flex flex-col justify-between text-white select-none">
      <div className="flex items-center justify-between text-[10px] font-mono text-blue-400 font-bold border-b border-slate-800 pb-1.5">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>{category || "Section"}</span>
        </span>
        <span className="text-slate-500 font-mono text-[9px]">Live Component</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5 my-auto">
        <div className="bg-slate-800/90 rounded border border-slate-700 p-1.5 text-center space-y-1">
          <div className="w-3 h-3 bg-blue-500/30 text-blue-400 rounded mx-auto flex items-center justify-center text-[7px]">⚡</div>
          <div className="h-1 bg-slate-300 rounded w-4/5 mx-auto" />
          <div className="h-0.5 bg-slate-500 rounded w-3/5 mx-auto" />
        </div>
        <div className="bg-slate-800/90 rounded border border-slate-700 p-1.5 text-center space-y-1">
          <div className="w-3 h-3 bg-emerald-500/30 text-emerald-400 rounded mx-auto flex items-center justify-center text-[7px]">🎓</div>
          <div className="h-1 bg-slate-300 rounded w-4/5 mx-auto" />
          <div className="h-0.5 bg-slate-500 rounded w-3/5 mx-auto" />
        </div>
        <div className="bg-slate-800/90 rounded border border-slate-700 p-1.5 text-center space-y-1">
          <div className="w-3 h-3 bg-amber-500/30 text-amber-400 rounded mx-auto flex items-center justify-center text-[7px]">🏆</div>
          <div className="h-1 bg-slate-300 rounded w-4/5 mx-auto" />
          <div className="h-0.5 bg-slate-500 rounded w-3/5 mx-auto" />
        </div>
      </div>
      <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono border-t border-slate-800 pt-1">
        <span className="truncate max-w-[140px]">{name}</span>
        <span className="text-emerald-400">HTML/CSS</span>
      </div>
    </div>
  );
}

export function SectionThumbnailPreview({
  name,
  category = "component",
  thumbnailUrl,
  code,
  className = "",
  onQuickPreview,
}: SectionThumbnailPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.26);
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Measure container and compute real-time scale for iframe
  useEffect(() => {
    if (!containerRef.current || !code) return;
    const updateScale = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        if (width > 0) {
          setScale(width / 1024);
        }
      }
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [code]);

  const hasValidImage = Boolean(thumbnailUrl && !imgError && thumbnailUrl.trim().length > 0);
  const hasValidCode = Boolean(code && code.trim().length > 20);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full h-full overflow-hidden bg-slate-950 group/thumb select-none ${className}`}
    >
      {/* 1. Direct Image Thumbnail */}
      {hasValidImage ? (
        <img
          src={thumbnailUrl || ""}
          alt={name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      ) : hasValidCode ? (
        /* 2. Scaled Live HTML/CSS Mini-Iframe Preview */
        <div className="w-full h-full relative overflow-hidden bg-white">
          <div
            className="absolute top-0 left-0 origin-top-left pointer-events-none select-none transition-transform"
            style={{
              width: "1024px",
              height: "580px",
              transform: `scale(${scale})`,
            }}
          >
            <iframe
              title={name}
              srcDoc={buildSectionPreviewDocument(code!)}
              className="w-[1024px] h-[580px] border-0 bg-white"
              sandbox="allow-scripts allow-same-origin"
              tabIndex={-1}
              loading="lazy"
            />
          </div>
        </div>
      ) : (
        /* 3. High-Fidelity Category Mockup Graphic */
        <CategoryMockupPreview category={category || "component"} name={name} />
      )}

      {/* Hover Action Overlay & Quick Preview Trigger */}
      {onQuickPreview && (
        <div
          className={`absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] flex items-center justify-center transition-all duration-200 z-10 ${
            isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickPreview();
            }}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all transform hover:scale-105 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick Preview</span>
          </button>
        </div>
      )}
    </div>
  );
}
