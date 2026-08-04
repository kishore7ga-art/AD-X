import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { api, ApiError } from "@/api/client";

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
  { id: "hero", name: "Hero Banner", bg: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { id: "about", name: "About Us", bg: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  { id: "features", name: "Features / Highlights", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  { id: "stats", name: "Statistics", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { id: "courses", name: "Academics & Courses", bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  { id: "placements", name: "Placements & Careers", bg: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
  { id: "contact", name: "Contact & Map", bg: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  { id: "footer", name: "Footer", bg: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
];

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
        return `max-width: 100%; width: 100%; box-sizing: border-box;`;
      }
      return match;
    });

    // Ensure flex containers wrap responsively on all screens
    code = code.replace(/display:\s*flex;?/gi, "display: flex; flex-wrap: wrap; ");

    // Ensure images are responsive
    code = code.replace(/<img /gi, '<img style="max-width: 100%; height: auto;" ');

    // Add box-sizing: border-box & max-width: 100% to section tags
    if (!code.includes("box-sizing")) {
      code = code.replace(/<section style="/i, '<section style="box-sizing: border-box; max-width: 100%; ');
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
      if (data?.pages && data.pages.length > 0 && !data.pages.some((p) => p.slug === activeSlug)) {
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

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    setStatusMsg(null);
    try {
      const updated = await api.put<DefaultWebsiteConfig>("/api/v1/admin/default-website", config);
      setConfig(updated);
      setStatusMsg({ type: "success", text: "Default Website structure successfully saved!" });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to save configuration";
      setStatusMsg({ type: "error", text: msg });
    } finally {
      setSaving(false);
    }
  }

  const activePage = config?.pages.find((p) => p.slug === activeSlug);

  function moveSection(index: number, direction: "up" | "down") {
    if (!config || !activePage) return;
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
      p.slug === activeSlug ? { ...p, sections } : p
    );
    setConfig({ ...config, pages: updatedPages });
  }

  function removeSection(index: number) {
    if (!config || !activePage) return;
    if (!confirm("Are you sure you want to remove this section box from the default website?")) return;

    const sections = activePage.sections.filter((_, idx) => idx !== index);
    sections.forEach((sec, idx) => {
      sec.sortOrder = idx;
    });

    const updatedPages = config.pages.map((p) =>
      p.slug === activeSlug ? { ...p, sections } : p
    );
    setConfig({ ...config, pages: updatedPages });
  }

  function handleSaveEditSection() {
    if (!config || !editingSection) return;
    const { pageSlug, section, index } = editingSection;

    const updatedPages = config.pages.map((p) => {
      if (p.slug !== pageSlug) return p;
      const secs = [...p.sections];
      secs[index] = section;
      return { ...p, sections: secs };
    });

    setConfig({ ...config, pages: updatedPages });
    setEditingSection(null);
  }

  function handleAddSectionSubmit() {
    if (!config || !activePage || !newTitle.trim()) return;

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
      sortOrder: activePage.sections.length,
    };

    const updatedPages = config.pages.map((p) =>
      p.slug === activeSlug ? { ...p, sections: [...p.sections, newSec] } : p
    );
    setConfig({ ...config, pages: updatedPages });

    setAddingSection(false);
    setNewTitle("");
    setNewCode("");
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
                    <div className="relative overflow-hidden rounded-xl border border-night-line bg-black/90 p-4">
                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-chalk-dim/40 mb-2">
                        Live Preview Canvas
                      </div>
                      <div
                        className="pointer-events-none rounded-lg bg-black text-white p-2 min-h-[100px] overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: sec.code }}
                      />
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
                  <div className="w-full flex-1 min-h-[380px] bg-black border border-night-line rounded-2xl p-3 overflow-y-auto max-h-[500px]">
                    <div
                      className={`transition-all duration-300 ${
                        editViewMode === "mobile"
                          ? "max-w-[375px] mx-auto border-2 border-slate-700 rounded-xl overflow-hidden shadow-2xl my-2"
                          : "w-full"
                      }`}
                    >
                      <div
                        dangerouslySetInnerHTML={{
                          __html:
                            editingSection.section.code ||
                            `<div style="padding: 40px; text-align: center; color: #888;">Empty Section HTML Code</div>`,
                        }}
                      />
                    </div>
                  </div>
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
                  <div className="w-full flex-1 min-h-[380px] bg-black border border-night-line rounded-2xl p-3 overflow-y-auto max-h-[500px]">
                    <div
                      className={`transition-all duration-300 ${
                        editViewMode === "mobile"
                          ? "max-w-[375px] mx-auto border-2 border-slate-700 rounded-xl overflow-hidden shadow-2xl my-2"
                          : "w-full"
                      }`}
                    >
                      <div
                        dangerouslySetInnerHTML={{
                          __html:
                            newCode.trim() ||
                            `<section style="padding: 60px 24px; background: #09090b; color: #ffffff; text-align: center; border-radius: 12px; font-family: system-ui, sans-serif;">
  <h2 style="font-size: 28px; font-weight: 800;">${newTitle || "New Section Title"}</h2>
  <p style="color: #a1a1aa; margin-top: 8px;">Live HTML Preview Canvas for ${activePage?.title}</p>
</section>`,
                        }}
                      />
                    </div>
                  </div>
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
      </div>
    </Shell>
  );
}
