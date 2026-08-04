import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { api, ApiError } from "@/api/client";
import { ModalDialog } from "@/components/ModalDialog";
import type { ModalDialogState } from "@/components/ModalDialog";

export type DefaultWebsiteSection = {
  id: string;
  title: string;
  sectionType: string;
  code: string;
  sortOrder: number;
};

export type DefaultWebsitePage = {
  slug: string;
  title: string;
  sections: DefaultWebsiteSection[];
};

export type DefaultWebsiteConfig = {
  pages: DefaultWebsitePage[];
};

export type LibraryVariant = {
  id: string;
  sectionType: string;
  variantName: string;
  componentKey: string;
  isActive: boolean;
};

const SECTION_CATEGORIES = [
  { id: "header", name: "Header & Navbar", bg: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { id: "hero", name: "Hero Banner", bg: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { id: "about", name: "About Us", bg: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  { id: "features", name: "Features / Highlights", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  { id: "stats", name: "Statistics", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { id: "courses", name: "Academics & Courses", bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  { id: "placements", name: "Placements & Careers", bg: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
  { id: "contact", name: "Contact & Map", bg: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  { id: "footer", name: "Footer", bg: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
];

const PRESET_SECTION_TEMPLATES = [
  {
    id: "preset-header-1",
    title: "Header & Navigation Bar",
    category: "header",
    icon: "🧭",
    description: "Classic responsive navbar with logo, menu links & CTA button.",
    code: `<section style="padding: 16px 32px; background: #0f172a; color: #ffffff; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 1px solid #1e293b; font-family: system-ui, sans-serif; box-sizing: border-box; max-width: 100%;">
  <div style="display: flex; align-items: center; gap: 12px;">
    <div style="width: 36px; height: 36px; background: #3b82f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 18px; color: #fff;">X</div>
    <span style="font-size: 20px; font-weight: 800; tracking-tight: -0.02em;">Madras Institute of Tech</span>
  </div>
  <nav style="display: flex; flex-wrap: wrap; align-items: center; gap: 24px; font-size: 14px; font-weight: 600; color: #cbd5e1;">
    <a href="#about" style="color: #cbd5e1; text-decoration: none;">About</a>
    <a href="#courses" style="color: #cbd5e1; text-decoration: none;">Academics</a>
    <a href="#placements" style="color: #cbd5e1; text-decoration: none;">Placements</a>
    <a href="#contact" style="color: #cbd5e1; text-decoration: none;">Contact</a>
  </nav>
  <button style="padding: 10px 20px; background: #3b82f6; color: #ffffff; border: none; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer;">Apply Admissions</button>
</section>`,
  },
  {
    id: "preset-hero-1",
    title: "Hero Banner (Modern Gradient)",
    category: "hero",
    icon: "🚀",
    description: "High impact hero section with headline, CTA buttons, and badge.",
    code: `<section style="padding: 80px 32px; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: #ffffff; text-align: center; border-radius: 16px; font-family: system-ui, sans-serif; box-sizing: border-box; max-width: 100%;">
  <span style="display: inline-block; padding: 6px 16px; background: rgba(99, 102, 241, 0.2); border: 1px solid rgba(129, 140, 248, 0.4); color: #c7d2fe; font-size: 12px; font-weight: 700; border-radius: 999px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px;">Admissions Open 2026-2027</span>
  <h1 style="font-size: 42px; font-weight: 900; margin: 0 0 16px 0; line-height: 1.2; letter-spacing: -0.02em;">Empowering Future Leaders & Engineers</h1>
  <p style="font-size: 18px; color: #94a3b8; max-width: 680px; margin: 0 auto 32px auto; line-height: 1.6;">Join a premier institution dedicated to academic excellence, innovation, cutting-edge research, and top global career placements.</p>
  <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 16px;">
    <button style="padding: 14px 28px; background: #6366f1; color: #ffffff; border: none; border-radius: 10px; font-weight: 800; font-size: 14px; cursor: pointer; box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.5);">Explore Programs</button>
    <button style="padding: 14px 28px; background: rgba(255, 255, 255, 0.08); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 10px; font-weight: 700; font-size: 14px; cursor: pointer;">Virtual Tour</button>
  </div>
</section>`,
  },
  {
    id: "preset-features-1",
    title: "Campus Highlights & Features",
    category: "features",
    icon: "🌟",
    description: "3-column feature grid showcasing campus infrastructure and labs.",
    code: `<section style="padding: 64px 32px; background: #09090b; color: #ffffff; font-family: system-ui, sans-serif; box-sizing: border-box; max-width: 100%;">
  <div style="text-align: center; max-width: 600px; margin: 0 auto 48px auto;">
    <h2 style="font-size: 32px; font-weight: 800; margin: 0 0 12px 0;">Why Choose Our Campus</h2>
    <p style="color: #a1a1aa; font-size: 15px; margin: 0;">World-class facilities designed for innovative learning and industry readiness.</p>
  </div>
  <div style="display: flex; flex-wrap: wrap; gap: 24px; justify-content: center;">
    <div style="flex: 1 1 280px; max-width: 380px; padding: 28px; background: #18181b; border: 1px solid #27272a; border-radius: 14px; box-sizing: border-box;">
      <div style="font-size: 32px; margin-bottom: 16px;">🔬</div>
      <h3 style="font-size: 20px; font-weight: 700; margin: 0 0 8px 0; color: #f4f4f5;">Advanced Research Labs</h3>
      <p style="color: #a1a1aa; font-size: 14px; line-height: 1.5; margin: 0;">State-of-the-art AI, Robotics, and Biotechnology research facilities.</p>
    </div>
    <div style="flex: 1 1 280px; max-width: 380px; padding: 28px; background: #18181b; border: 1px solid #27272a; border-radius: 14px; box-sizing: border-box;">
      <div style="font-size: 32px; margin-bottom: 16px;">📚</div>
      <h3 style="font-size: 20px; font-weight: 700; margin: 0 0 8px 0; color: #f4f4f5;">Digital Knowledge Center</h3>
      <p style="color: #a1a1aa; font-size: 14px; line-height: 1.5; margin: 0;">Access to over 100,000 journals, books, and online databases 24/7.</p>
    </div>
    <div style="flex: 1 1 280px; max-width: 380px; padding: 28px; background: #18181b; border: 1px solid #27272a; border-radius: 14px; box-sizing: border-box;">
      <div style="font-size: 32px; margin-bottom: 16px;">🏆</div>
      <h3 style="font-size: 20px; font-weight: 700; margin: 0 0 8px 0; color: #f4f4f5;">Top Tier Placements</h3>
      <p style="color: #a1a1aa; font-size: 14px; line-height: 1.5; margin: 0;">Over 95% placement rate with leading global tech companies.</p>
    </div>
  </div>
</section>`,
  },
  {
    id: "preset-stats-1",
    title: "Key Statistics Counters",
    category: "stats",
    icon: "📊",
    description: "4-column counter grid for students, faculty, and packages.",
    code: `<section style="padding: 56px 32px; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; color: #ffffff; font-family: system-ui, sans-serif; box-sizing: border-box; max-width: 100%;">
  <div style="display: flex; flex-wrap: wrap; justify-content: space-around; gap: 32px; text-align: center;">
    <div>
      <div style="font-size: 36px; font-weight: 900; color: #38bdf8;">15,000+</div>
      <div style="font-size: 13px; color: #94a3b8; font-weight: 600; margin-top: 4px; text-transform: uppercase;">Enrolled Students</div>
    </div>
    <div>
      <div style="font-size: 36px; font-weight: 900; color: #a855f7;">500+</div>
      <div style="font-size: 13px; color: #94a3b8; font-weight: 600; margin-top: 4px; text-transform: uppercase;">Expert Faculty</div>
    </div>
    <div>
      <div style="font-size: 36px; font-weight: 900; color: #34d399;">98%</div>
      <div style="font-size: 13px; color: #94a3b8; font-weight: 600; margin-top: 4px; text-transform: uppercase;">Placement Rate</div>
    </div>
    <div>
      <div style="font-size: 36px; font-weight: 900; color: #fbbf24;">48 LPA</div>
      <div style="font-size: 13px; color: #94a3b8; font-weight: 600; margin-top: 4px; text-transform: uppercase;">Highest Package</div>
    </div>
  </div>
</section>`,
  },
  {
    id: "preset-contact-1",
    title: "Contact Form & Campus Address",
    category: "contact",
    icon: "📍",
    description: "Split layout with contact form, address details, and email.",
    code: `<section style="padding: 64px 32px; background: #09090b; color: #ffffff; font-family: system-ui, sans-serif; box-sizing: border-box; max-width: 100%;">
  <div style="display: flex; flex-wrap: wrap; gap: 40px; justify-content: space-between;">
    <div style="flex: 1 1 300px;">
      <h2 style="font-size: 30px; font-weight: 800; margin: 0 0 16px 0;">Get in Touch</h2>
      <p style="color: #a1a1aa; font-size: 15px; margin-bottom: 28px; line-height: 1.6;">Have questions about admissions or programs? Send us a message and our counselor will reach out.</p>
      <div style="font-size: 14px; color: #e4e4e7;">
        <p style="margin: 8px 0;">📍 <strong>Address:</strong> 100 College Road, Academic Zone, Chennai 600028</p>
        <p style="margin: 8px 0;">📞 <strong>Phone:</strong> +91 44 2490 0000 / +91 98400 12345</p>
        <p style="margin: 8px 0;">✉️ <strong>Email:</strong> admissions@college.edu.in</p>
      </div>
    </div>
    <div style="flex: 1 1 320px; background: #18181b; padding: 32px; border-radius: 16px; border: 1px solid #27272a; box-sizing: border-box;">
      <h3 style="font-size: 20px; font-weight: 700; margin: 0 0 20px 0;">Send Enquiry</h3>
      <div style="margin-bottom: 16px;">
        <label style="display: block; font-size: 12px; font-weight: 700; color: #a1a1aa; margin-bottom: 6px;">Full Name</label>
        <input type="text" placeholder="John Doe" style="width: 100%; padding: 10px 14px; background: #09090b; border: 1px solid #3f3f46; border-radius: 8px; color: #fff; box-sizing: border-box;" />
      </div>
      <div style="margin-bottom: 16px;">
        <label style="display: block; font-size: 12px; font-weight: 700; color: #a1a1aa; margin-bottom: 6px;">Email Address</label>
        <input type="email" placeholder="john@example.com" style="width: 100%; padding: 10px 14px; background: #09090b; border: 1px solid #3f3f46; border-radius: 8px; color: #fff; box-sizing: border-box;" />
      </div>
      <button style="width: 100%; padding: 12px; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-weight: 800; cursor: pointer; margin-top: 8px;">Submit Request</button>
    </div>
  </div>
</section>`,
  },
  {
    id: "preset-footer-1",
    title: "Footer Section",
    category: "footer",
    icon: "🦶",
    description: "Clean footer with links, copyright & accreditation notice.",
    code: `<section style="padding: 48px 32px 24px 32px; background: #0f172a; color: #94a3b8; font-family: system-ui, sans-serif; border-top: 1px solid #1e293b; box-sizing: border-box; max-width: 100%;">
  <div style="display: flex; flex-wrap: wrap; justify-content: space-between; gap: 32px; margin-bottom: 40px;">
    <div style="max-width: 320px;">
      <h3 style="color: #ffffff; font-size: 18px; font-weight: 800; margin: 0 0 12px 0;">College Portal</h3>
      <p style="font-size: 13px; line-height: 1.6; margin: 0;">Approved by AICTE, Accredited with NAAC A++ Grade. Affiliated to State Technological University.</p>
    </div>
    <div>
      <h4 style="color: #ffffff; font-size: 14px; font-weight: 700; margin: 0 0 12px 0;">Quick Links</h4>
      <div style="display: flex; flex-direction: column; gap: 8px; font-size: 13px;">
        <a href="#about" style="color: #94a3b8; text-decoration: none;">About College</a>
        <a href="#courses" style="color: #94a3b8; text-decoration: none;">Departments</a>
        <a href="#placements" style="color: #94a3b8; text-decoration: none;">Placement Cell</a>
      </div>
  <div style="text-align: center; font-size: 12px; border-top: 1px solid #1e293b; padding-top: 20px; color: #64748b;">
    © 2026 College Campus Portal. All Rights Reserved. Powered by XITE.
  </div>
</section>`,
  },
];

function matchesSlug(slugA: string, slugB: string): boolean {
  if (!slugA || !slugB) return false;
  const normA = slugA.trim().toLowerCase().replace(/^\/+/, "");
  const normB = slugB.trim().toLowerCase().replace(/^\/+/, "");
  return normA === normB;
}

function SectionLivePreviewIframe({
  code,
  title,
  viewMode = "desktop",
}: {
  code: string;
  title?: string;
  viewMode?: "desktop" | "mobile";
}) {
  const displayTitle = title || "Empty Section Box";
  const bodyContent =
    code ||
    `<section style="padding: 60px 24px; text-align: center;"><h2>${displayTitle}</h2></section>`;

  const fullHtmlDoc = [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8"/>',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>',
    '  <script src="https://cdn.tailwindcss.com"></script>',
    '  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"/>',
    '  <link rel="preconnect" href="https://fonts.googleapis.com">',
    '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300..900;1,300..900&family=Outfit:wght@400..900&display=swap" rel="stylesheet">',
    "  <style>",
    "    *, ::before, ::after { box-sizing: border-box; }",
    '    html, body { margin: 0; padding: 0; background-color: #09090b; color: #ffffff; font-family: "Inter", system-ui, sans-serif; width: 100%; min-height: 100%; }',
    "    .container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 24px; box-sizing: border-box; }",
    "    .footer-bottom { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; font-size: 13px; }",
    "    .legal-links { display: flex; flex-wrap: wrap; gap: 16px; }",
    "    .legal-links a { color: inherit; text-decoration: none; font-weight: 500; }",
    "    .legal-links a:hover { text-decoration: underline; }",
    "    img { max-width: 100%; height: auto; }",
    "    a { color: inherit; }",
    "  </style>",
    "</head>",
    "<body>",
    "  " + bodyContent,
    "</body>",
    "</html>",
  ].join("\n");

  return (
    <div
      className={`w-full transition-all duration-300 ${
        viewMode === "mobile"
          ? "max-w-[375px] mx-auto border-4 border-slate-700 rounded-3xl overflow-hidden shadow-2xl my-2 min-h-[480px]"
          : "w-full min-h-[400px] rounded-2xl overflow-hidden border border-night-line bg-black"
      }`}
    >
      <iframe
        title="Live Section Sandbox"
        srcDoc={fullHtmlDoc}
        className="w-full h-full min-h-[400px] border-0 bg-black block"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}

export function DefaultWebsite() {
  const [config, setConfig] = useState<DefaultWebsiteConfig | null>(null);
  const [activeSlug, setActiveSlug] = useState<string>("/home");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit Section Modal State
  const [editingSection, setEditingSection] = useState<{
    pageSlug: string;
    section: DefaultWebsiteSection;
    index: number;
  } | null>(null);

  // Add Section Modal State
  const [addingSection, setAddingSection] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("hero");
  const [newCode, setNewCode] = useState("");
  const [editViewMode, setEditViewMode] = useState<"desktop" | "mobile">("desktop");

  function autoFormatResponsiveCode(rawCode: string): string {
    if (!rawCode) return rawCode;
    let code = rawCode;

    // Replace fixed px widths with max-width: 100% & box-sizing: border-box
    code = code.replace(/width:\s*(\d{3,4})px/gi, (match, p1) => {
      const num = parseInt(p1, 10);
      if (num > 360) {
        return "max-width: 100%; width: 100%; box-sizing: border-box;";
      }
      return match;
    });

    // Ensure flex containers wrap responsively on all screens
    code = code.replace(/display:\s*flex;?/gi, "display: flex; flex-wrap: wrap; ");

    // Ensure images are responsive
    code = code.replace(/<img /gi, '<img style="max-width: 100%; height: auto;" ');

    // Add box-sizing: border-box & max-width: 100% to section/footer tags
    if (!code.includes("box-sizing")) {
      code = code.replace(/<section style="/i, '<section style="box-sizing: border-box; max-width: 100%; ');
      code = code.replace(/<footer style="/i, '<footer style="box-sizing: border-box; max-width: 100%; ');
    }

    return code;
  }

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    setLoading(true);
    setStatusMsg(null);
    try {
      const data = await api.get<DefaultWebsiteConfig>("/api/v1/admin/default-website");
      setConfig(data);
      if (data?.pages && data.pages.length > 0 && !data.pages.some((p) => matchesSlug(p.slug, activeSlug))) {
        const firstPage = data.pages[0];
        if (firstPage) {
          setActiveSlug(firstPage.slug);
        }
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load default website configuration";
      setStatusMsg({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  }

  async function persistConfig(newConfig: DefaultWebsiteConfig) {
    setConfig(newConfig);
    setSaving(true);
    setStatusMsg(null);
    try {
      const updated = await api.put<DefaultWebsiteConfig>("/api/v1/admin/default-website", newConfig);
      setConfig(updated);
      setStatusMsg({ type: "success", text: "Default Website structure successfully saved & updated live!" });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to save configuration";
      setStatusMsg({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (!config) return;
    await persistConfig(config);
  }

  const activePage = config?.pages.find((p) => matchesSlug(p.slug, activeSlug)) || config?.pages[0];

  async function moveSection(index: number, direction: "up" | "down") {
    if (!config || !activePage) return;
    const targetSlug = activePage.slug;
    const sections = [...activePage.sections];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const itemA = sections[index];
    const itemB = sections[targetIdx];
    if (itemA && itemB) {
      sections[index] = itemB;
      sections[targetIdx] = itemA;
    }

    // re-assign sort orders
    sections.forEach((sec, idx) => {
      sec.sortOrder = idx;
    });

    const updatedPages = config.pages.map((p) =>
      matchesSlug(p.slug, targetSlug) ? { ...p, sections } : p
    );
    await persistConfig({ ...config, pages: updatedPages });
  }

  const [modalConfig, setModalConfig] = useState<ModalDialogState | null>(null);

  function removeSection(index: number) {
    if (!config || !activePage) return;
    const secTitle = activePage.sections[index]?.title || "this section box";

    setModalConfig({
      isOpen: true,
      type: "confirm",
      variant: "danger",
      title: `Remove ${secTitle}?`,
      message: `Are you sure you want to remove "${secTitle}" from the default website configuration?`,
      confirmText: "Remove Section Box",
      cancelText: "Keep Section Box",
      onCancel: () => setModalConfig(null),
      onConfirm: async () => {
        setModalConfig(null);
        const targetSlug = activePage?.slug || activeSlug;
        const sections = (activePage?.sections || []).filter((_, idx) => idx !== index);
        sections.forEach((sec, idx) => {
          sec.sortOrder = idx;
        });

        const updatedPages = config.pages.map((p) =>
          matchesSlug(p.slug, targetSlug) ? { ...p, sections } : p
        );
        await persistConfig({ ...config, pages: updatedPages });
      },
    });
  }

  async function handleSaveEditSection() {
    if (!config || !editingSection) return;
    const { pageSlug, section, index } = editingSection;

    const updatedPages = config.pages.map((p) => {
      if (!matchesSlug(p.slug, pageSlug)) return p;
      const secs = [...p.sections];
      secs[index] = section;
      return { ...p, sections: secs };
    });

    const updatedConfig = { ...config, pages: updatedPages };
    setEditingSection(null);
    await persistConfig(updatedConfig);
  }

  async function handleAddSectionSubmit() {
    if (!config || !newTitle.trim()) return;

    const targetSlug = activePage?.slug || activeSlug;
    const currentSections = activePage?.sections || [];

    const newSec: DefaultWebsiteSection = {
      id: `def-${Date.now()}`,
      title: newTitle.trim(),
      sectionType: newType,
      code:
        newCode.trim() ||
        `<section style="padding: 60px 24px; background: #09090b; color: #ffffff; text-align: center; border-radius: 12px; font-family: system-ui, sans-serif;">
  <h2 style="font-size: 28px; font-weight: 800;">${newTitle}</h2>
  <p style="color: #a1a1aa; margin-top: 8px;">Configured default section box for ${newTitle}</p>
</section>`,
      sortOrder: currentSections.length,
    };

    const updatedPages = config.pages.map((p) =>
      matchesSlug(p.slug, targetSlug) ? { ...p, sections: [...p.sections, newSec] } : p
    );

    const updatedConfig = { ...config, pages: updatedPages };

    setAddingSection(false);
    setNewTitle("");
    setNewCode("");

    await persistConfig(updatedConfig);
  }

  function getCategoryStyle(type: string) {
    const cat = SECTION_CATEGORIES.find((c) => c.id === type.toLowerCase());
    return cat?.bg || "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }

  return (
    <Shell title="Default Website Builder">
      <div className="space-y-6">
        {/* Header & Master Save Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-night-line bg-night-card p-6 shadow-xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
                Master Website Config
              </span>
              <h2 className="text-xl font-black tracking-tight text-chalk">Default Website For All Colleges</h2>
            </div>
            <p className="mt-1 text-xs text-chalk-dim/70 max-w-2xl">
              Each section box below defines the starting website layout for all users. Admin can add, edit code, and arrange section boxes for every page.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 rounded-xl bg-chalk px-6 py-3 text-xs font-black text-night shadow-lg transition hover:bg-chalk/90 active:scale-95 disabled:opacity-50"
          >
            <span>{saving ? "Saving Changes..." : "Save Default Website"}</span>
          </button>
        </div>

        {/* Status Notification */}
        {statusMsg ? (
          <div
            className={`rounded-xl border p-4 text-xs font-semibold ${
              statusMsg.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-rose-500/30 bg-rose-500/10 text-rose-400"
            }`}
          >
            {statusMsg.text}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-night-line bg-night-card p-16 text-center text-xs font-semibold text-chalk-dim/60">
            Loading Master Website Boxes...
          </div>
        ) : config ? (
          <div className="space-y-6">
            {/* Multi-Page Navigation Bar */}
            <div className="flex items-center gap-2 border-b border-night-line pb-3 overflow-x-auto">
              {config.pages.map((page) => {
                const isActive = page.slug === activeSlug;
                return (
                  <button
                    key={page.slug}
                    type="button"
                    onClick={() => setActiveSlug(page.slug)}
                    className={`flex items-center gap-2.5 rounded-xl px-5 py-3 text-xs font-black transition ${
                      isActive
                        ? "bg-chalk text-night shadow-md scale-[1.02]"
                        : "border border-night-line bg-night-card text-chalk-dim/70 hover:border-chalk-dim/40 hover:text-chalk"
                    }`}
                  >
                    <span>{page.title}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActive ? "bg-night/15 text-night" : "bg-night text-chalk-dim/60 border border-night-line"
                      }`}
                    >
                      {page.sections.length} Boxes
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-chalk">
                  {activePage?.title} Page — Section Mini-Boxes ({activePage?.sections.length || 0})
                </h3>
                <p className="text-xs text-chalk-dim/60">
                  Visual layout of default section boxes for route <code className="text-chalk bg-night px-1.5 py-0.5 rounded">{activeSlug}</code>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddingSection(true)}
                className="flex items-center gap-2 rounded-xl border border-chalk/30 bg-chalk/10 px-4 py-2.5 text-xs font-bold text-chalk transition hover:bg-chalk/20 active:scale-95"
              >
                <span>+ Add Section Box</span>
              </button>
            </div>

            {/* Visual Section Cards Grid (Mini-Boxes Layout) */}
            {activePage && activePage.sections.length > 0 ? (
              <div className="grid gap-6">
                {activePage.sections.map((sec, idx) => (
                  <div
                    key={sec.id || idx}
                    className="group overflow-hidden rounded-2xl border border-night-line bg-night-card p-6 shadow-xl transition-all hover:border-chalk-dim/40"
                  >
                    {/* Mini-Box Top Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-night-line pb-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-night font-mono text-xs font-black text-chalk border border-night-line">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-extrabold text-chalk">{sec.title}</h4>
                            <span
                              className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-extrabold uppercase ${getCategoryStyle(
                                sec.sectionType
                              )}`}
                            >
                              {sec.sectionType}
                            </span>
                          </div>
                          <span className="text-[11px] text-chalk-dim/50">
                            Section Box #{idx + 1} for {activePage.title}
                          </span>
                        </div>
                      </div>

                      {/* Mini-Box Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => moveSection(idx, "up")}
                          disabled={idx === 0}
                          className="rounded-lg border border-night-line bg-night px-3 py-1.5 text-xs font-bold text-chalk-dim transition hover:border-chalk-dim/40 hover:text-chalk disabled:opacity-20"
                        >
                          ↑ Move Up
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSection(idx, "down")}
                          disabled={idx === activePage.sections.length - 1}
                          className="rounded-lg border border-night-line bg-night px-3 py-1.5 text-xs font-bold text-chalk-dim transition hover:border-chalk-dim/40 hover:text-chalk disabled:opacity-20"
                        >
                          ↓ Move Down
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSection({ pageSlug: activeSlug, section: { ...sec }, index: idx })}
                          className="rounded-lg bg-chalk px-4 py-1.5 text-xs font-black text-night transition hover:bg-chalk/90"
                        >
                          Edit Code
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSection(idx)}
                          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-bold text-rose-400 transition hover:bg-rose-500/20"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Live HTML Mini-Preview Box */}
                    <div className="relative overflow-hidden rounded-xl border border-night-line bg-black p-2">
                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-chalk-dim/40 mb-2 px-2 pt-1">
                        Live Preview Sandbox
                      </div>
                      <SectionLivePreviewIframe code={sec.code} title={sec.title} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-night-line bg-night-card p-16 text-center space-y-3">
                <p className="text-sm font-bold text-chalk">No section boxes configured for {activePage?.title} yet.</p>
                <p className="text-xs text-chalk-dim/60">Click below to add a section box for this page.</p>
                <button
                  type="button"
                  onClick={() => setAddingSection(true)}
                  className="inline-block rounded-xl bg-chalk px-5 py-2.5 text-xs font-bold text-night hover:bg-chalk/90"
                >
                  + Add Section Box
                </button>
              </div>
            )}
          </div>
        ) : null}

        {/* Modal: Edit Code & Title Studio */}
        {editingSection ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-night/90 p-4 backdrop-blur-md">
            <div className="w-full max-w-6xl rounded-3xl border border-night-line bg-night-card p-6 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
              
              {/* Modal Top Header */}
              <div className="flex items-center justify-between border-b border-night-line pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
                      Live Studio Code Editor
                    </span>
                    <h3 className="text-lg font-black text-chalk">Edit Section Box — {editingSection.section.title}</h3>
                  </div>
                  <p className="text-xs text-chalk-dim/60 mt-0.5">
                    Modify title, category type, and section HTML source code with instant live render preview.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = autoFormatResponsiveCode(editingSection.section.code);
                      setEditingSection({
                        ...editingSection,
                        section: { ...editingSection.section, code: updated },
                      });
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 px-3.5 py-2 text-xs font-black text-amber-300 hover:bg-amber-500/30 transition shadow-sm cursor-pointer"
                    title="Automatically format code with responsive CSS & mobile flex-wrap"
                  >
                    <span>⚡ Auto Edit (Make Responsive)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingSection(null)}
                    className="text-xs font-bold text-chalk-dim/60 hover:text-chalk p-2"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>

              {/* Split Screen Grid: Preview vs Source Code */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Column: Live Section Preview Canvas */}
                <div className="space-y-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black tracking-wider text-neutral-400 uppercase flex items-center gap-2">
                      <span>👁️ Live Section Preview</span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                        Real-Time Render
                      </span>
                    </h4>

                    {/* Viewport Width Toggles */}
                    <div className="flex items-center gap-1 bg-night border border-night-line rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setEditViewMode("desktop")}
                        className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md transition ${
                          editViewMode === "desktop" ? "bg-chalk text-night shadow" : "text-chalk-dim hover:text-chalk"
                        }`}
                      >
                        🖥️ Desktop
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditViewMode("mobile")}
                        className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md transition ${
                          editViewMode === "mobile" ? "bg-chalk text-night shadow" : "text-chalk-dim hover:text-chalk"
                        }`}
                      >
                        📱 Mobile
                      </button>
                    </div>
                  </div>

                  {/* Live Render Canvas Box */}
                  <SectionLivePreviewIframe
                    code={editingSection.section.code}
                    title={editingSection.section.title}
                    viewMode={editViewMode}
                  />
                </div>

                {/* Right Column: Code Editor & Metadata Inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-chalk mb-1">Section Box Title *</label>
                    <input
                      type="text"
                      value={editingSection.section.title}
                      onChange={(e) =>
                        setEditingSection({
                          ...editingSection,
                          section: { ...editingSection.section, title: e.target.value },
                        })
                      }
                      className="w-full rounded-xl border border-night-line bg-night px-4 py-2.5 text-xs font-semibold text-chalk outline-none focus:border-chalk"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-chalk mb-1">Category / Type</label>
                    <select
                      value={editingSection.section.sectionType}
                      onChange={(e) =>
                        setEditingSection({
                          ...editingSection,
                          section: { ...editingSection.section, sectionType: e.target.value },
                        })
                      }
                      className="w-full rounded-xl border border-night-line bg-night px-4 py-2.5 text-xs font-semibold text-chalk outline-none focus:border-chalk"
                    >
                      {SECTION_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} ({cat.id.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-chalk">Section HTML Source Code</label>
                      <span className="text-[10px] font-mono text-neutral-400">
                        {editingSection.section.code.length.toLocaleString()} chars
                      </span>
                    </div>
                    <textarea
                      rows={12}
                      value={editingSection.section.code}
                      onChange={(e) =>
                        setEditingSection({
                          ...editingSection,
                          section: { ...editingSection.section, code: e.target.value },
                        })
                      }
                      className="w-full rounded-xl border border-night-line bg-night p-4 font-mono text-xs text-chalk outline-none focus:border-chalk leading-relaxed"
                    />
                  </div>
                </div>

              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-night-line">
                <span className="text-xs text-chalk-dim/60 font-mono">
                  Edits apply instantly to Default Website template
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingSection(null)}
                    className="rounded-xl border border-night-line px-5 py-2.5 text-xs font-bold text-chalk-dim hover:text-chalk"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditSection}
                    className="rounded-xl bg-chalk px-6 py-2.5 text-xs font-black text-night hover:bg-chalk/90 shadow-lg cursor-pointer"
                  >
                    Save Section Box
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Modal: Add New Section Box */}
        {addingSection ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-night/90 p-4 backdrop-blur-md">
            <div className="w-full max-w-6xl rounded-3xl border border-night-line bg-night-card p-6 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
              
              {/* Modal Top Header */}
              <div className="flex items-center justify-between border-b border-night-line pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
                      New Component Builder
                    </span>
                    <h3 className="text-lg font-black text-chalk">Add Section Box to {activePage?.title} Page</h3>
                  </div>
                  <p className="text-xs text-chalk-dim/60 mt-0.5">
                    Configure a new section box with title, category, and responsive HTML source code.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (newCode.trim()) {
                        setNewCode(autoFormatResponsiveCode(newCode));
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 px-3.5 py-2 text-xs font-black text-amber-300 hover:bg-amber-500/30 transition shadow-sm cursor-pointer"
                    title="Automatically format code with responsive CSS & mobile flex-wrap"
                  >
                    <span>⚡ Auto Edit (Make Responsive)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAddingSection(false)}
                    className="text-xs font-bold text-chalk-dim/60 hover:text-chalk p-2"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>

              {/* Quick Choose Preset Section Box Section */}
              <div className="bg-night border border-night-line rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-chalk flex items-center gap-2">
                    <span>✨ Select Quick Preset Section Template</span>
                    <span className="text-[10px] font-normal text-chalk-dim">Click any preset to auto-fill title, category & responsive code</span>
                  </h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {PRESET_SECTION_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => {
                        setNewTitle(tmpl.title);
                        setNewType(tmpl.category);
                        setNewCode(tmpl.code);
                      }}
                      className={`flex flex-col items-start text-left p-3 rounded-xl border transition cursor-pointer group ${
                        newTitle === tmpl.title
                          ? "bg-emerald-950/40 border-emerald-500/80 ring-1 ring-emerald-500/50"
                          : "bg-night-card border-night-line hover:border-chalk/40 hover:bg-night/60"
                      }`}
                    >
                      <span className="text-xl mb-1">{tmpl.icon}</span>
                      <span className="text-xs font-bold text-chalk group-hover:text-amber-300 transition-colors line-clamp-1">
                        {tmpl.title}
                      </span>
                      <span className="text-[10px] font-mono text-chalk-dim/60 uppercase mt-0.5">
                        {tmpl.category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Split Screen Grid: Preview vs Source Code */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Column: Live Section Preview Canvas */}
                <div className="space-y-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black tracking-wider text-neutral-400 uppercase flex items-center gap-2">
                      <span>👁️ Live Section Preview</span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                        Real-Time Render
                      </span>
                    </h4>

                    {/* Viewport Width Toggles */}
                    <div className="flex items-center gap-1 bg-night border border-night-line rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setEditViewMode("desktop")}
                        className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md transition ${
                          editViewMode === "desktop" ? "bg-chalk text-night shadow" : "text-chalk-dim hover:text-chalk"
                        }`}
                      >
                        🖥️ Desktop
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditViewMode("mobile")}
                        className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md transition ${
                          editViewMode === "mobile" ? "bg-chalk text-night shadow" : "text-chalk-dim hover:text-chalk"
                        }`}
                      >
                        📱 Mobile
                      </button>
                    </div>
                  </div>

                  {/* Live Render Canvas Box */}
                  <SectionLivePreviewIframe
                    code={newCode}
                    title={newTitle}
                    viewMode={editViewMode}
                  />
                </div>

                {/* Right Column: Code Editor & Metadata Inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-chalk mb-1">Section Box Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Hero Banner, Placement Stats, Contact Cards"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full rounded-xl border border-night-line bg-night px-4 py-2.5 text-xs font-semibold text-chalk outline-none focus:border-chalk"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-chalk mb-1">Category / Type</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      className="w-full rounded-xl border border-night-line bg-night px-4 py-2.5 text-xs font-semibold text-chalk outline-none focus:border-chalk"
                    >
                      {SECTION_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} ({cat.id.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-chalk">Section HTML Source Code</label>
                      <span className="text-[10px] font-mono text-neutral-400">
                        {newCode.length.toLocaleString()} chars
                      </span>
                    </div>
                    <textarea
                      rows={12}
                      placeholder="<section style='padding: 60px 24px...'>...</section>"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      className="w-full rounded-xl border border-night-line bg-night p-4 font-mono text-xs text-chalk outline-none focus:border-chalk leading-relaxed"
                    />
                  </div>
                </div>

              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-night-line">
                <span className="text-xs text-chalk-dim/60 font-mono">
                  New box will be added to {activePage?.title} template
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAddingSection(false)}
                    className="rounded-xl border border-night-line px-5 py-2.5 text-xs font-bold text-chalk-dim hover:text-chalk"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddSectionSubmit}
                    disabled={!newTitle.trim()}
                    className="rounded-xl bg-chalk px-6 py-2.5 text-xs font-black text-night hover:bg-chalk/90 shadow-lg cursor-pointer disabled:opacity-50"
                  >
                    Add Section Box
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {modalConfig && <ModalDialog {...modalConfig} />}
      </div>
    </Shell>
  );
}
