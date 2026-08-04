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
  const [addingSection, setAddingSection] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("features");
  const [newCode, setNewCode] = useState("");

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    setLoading(true);
    setStatusMsg(null);
    try {
      const data = await api.get<DefaultWebsiteConfig>("/api/v1/admin/default-website");
      setConfig(data);
      if (data.pages && data.pages.length > 0 && !data.pages.some((p) => p.slug === activeSlug)) {
        setActiveSlug(data.pages[0].slug);
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

    const temp = sections[index];
    sections[index] = sections[targetIdx];
    sections[targetIdx] = temp;

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
    if (!confirm("Are you sure you want to remove this section from the default website?")) return;

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
      code: newCode.trim() || `<section style="padding: 60px 24px; background: #18181b; color: #ffffff; text-align: center;"><h2>${newTitle}</h2></section>`,
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

  return (
    <Shell title="Default Website Builder">
      <div className="space-y-6">
        {/* Header & Description Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-night-line bg-night-card p-6">
          <div>
            <h2 className="text-lg font-bold text-chalk">Platform Master Template</h2>
            <p className="mt-1 text-xs text-chalk-dim/70">
              Configure the default website pages and section mini-boxes for all colleges. When a new college opens the editor, these sections automatically populate their starting website.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="rounded-xl bg-chalk px-5 py-2.5 text-xs font-bold text-night transition hover:bg-chalk/90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Default Website"}
            </button>
          </div>
        </div>

        {/* Status Alerts */}
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
          <div className="rounded-2xl border border-night-line bg-night-card p-12 text-center text-xs text-chalk-dim/60">
            Loading Default Website Configuration...
          </div>
        ) : config ? (
          <div className="space-y-6">
            {/* Multi-Page Tabs Selector */}
            <div className="flex items-center gap-2 border-b border-night-line pb-2 overflow-x-auto">
              {config.pages.map((page) => {
                const isActive = page.slug === activeSlug;
                return (
                  <button
                    key={page.slug}
                    type="button"
                    onClick={() => setActiveSlug(page.slug)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                      isActive
                        ? "bg-chalk text-night shadow-sm"
                        : "text-chalk-dim/70 hover:bg-night-line hover:text-chalk"
                    }`}
                  >
                    <span>{page.title}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${
                        isActive ? "bg-night/10 text-night" : "bg-night-line text-chalk-dim/60"
                      }`}
                    >
                      {page.sections.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Page Header & Add Section Button */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-chalk">
                  {activePage?.title} Page Sections ({activePage?.sections.length || 0})
                </h3>
                <p className="text-xs text-chalk-dim/60">
                  Ordered section mini-boxes for <span className="font-mono text-chalk">{activeSlug}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAddingSection(true)}
                className="rounded-xl border border-night-line bg-night-card px-4 py-2 text-xs font-bold text-chalk transition hover:border-chalk-dim/40 hover:bg-night-line"
              >
                + Add Section Mini-Box
              </button>
            </div>

            {/* Section Mini-Boxes List */}
            {activePage && activePage.sections.length > 0 ? (
              <div className="grid gap-4">
                {activePage.sections.map((sec, idx) => (
                  <div
                    key={sec.id || idx}
                    className="flex flex-col gap-4 rounded-2xl border border-night-line bg-night-card p-5 transition hover:border-chalk-dim/30 md:flex-row md:items-center md:justify-between"
                  >
                    {/* Left: Index, Title & Section Type */}
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-night-line bg-night text-xs font-black text-chalk-dim">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-chalk">{sec.title}</h4>
                          <span className="rounded-md border border-night-line bg-night px-2 py-0.5 font-mono text-[10px] font-bold text-chalk-dim/80 uppercase">
                            {sec.sectionType}
                          </span>
                        </div>
                        <p className="mt-1 font-mono text-[11px] text-chalk-dim/50 truncate max-w-[400px]">
                          {sec.code.slice(0, 80)}...
                        </p>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moveSection(idx, "up")}
                        disabled={idx === 0}
                        className="rounded-lg border border-night-line px-3 py-1.5 text-xs font-semibold text-chalk-dim transition hover:bg-night-line hover:text-chalk disabled:opacity-30"
                      >
                        ↑ Up
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(idx, "down")}
                        disabled={idx === activePage.sections.length - 1}
                        className="rounded-lg border border-night-line px-3 py-1.5 text-xs font-semibold text-chalk-dim transition hover:bg-night-line hover:text-chalk disabled:opacity-30"
                      >
                        ↓ Down
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSection({ pageSlug: activeSlug, section: { ...sec }, index: idx })}
                        className="rounded-lg border border-night-line bg-night px-3.5 py-1.5 text-xs font-bold text-chalk transition hover:bg-night-line"
                      >
                        Edit Code
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSection(idx)}
                        className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3.5 py-1.5 text-xs font-bold text-rose-400 transition hover:bg-rose-500/20"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-night-line bg-night-card p-12 text-center text-xs text-chalk-dim/50">
                No section mini-boxes configured for this page yet. Click "+ Add Section Mini-Box" to add one.
              </div>
            )}
          </div>
        ) : null}

        {/* Modal: Edit Section Code & Details */}
        {editingSection ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 p-4 backdrop-blur-xs">
            <div className="w-full max-w-3xl rounded-2xl border border-night-line bg-night-card p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-night-line pb-4">
                <h3 className="text-base font-extrabold text-chalk">Edit Section Mini-Box</h3>
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="text-xs font-bold text-chalk-dim/60 hover:text-chalk"
                >
                  ✕ Close
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-chalk mb-1">Section Title</label>
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
                  <label className="block text-xs font-bold text-chalk mb-1">Section Category/Type</label>
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
                    <option value="hero">Hero Banner</option>
                    <option value="about">About Us</option>
                    <option value="features">Features / Highlights</option>
                    <option value="stats">Statistics</option>
                    <option value="courses">Academics & Courses</option>
                    <option value="placements">Placements</option>
                    <option value="contact">Contact Us</option>
                    <option value="footer">Footer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-chalk mb-1">HTML Code</label>
                  <textarea
                    rows={12}
                    value={editingSection.section.code}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        section: { ...editingSection.section, code: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-night-line bg-night p-4 font-mono text-xs text-chalk outline-none focus:border-chalk"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-night-line">
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="rounded-xl border border-night-line px-4 py-2 text-xs font-bold text-chalk-dim hover:text-chalk"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditSection}
                  className="rounded-xl bg-chalk px-5 py-2 text-xs font-bold text-night hover:bg-chalk/90"
                >
                  Save Section
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Modal: Add New Section Mini-Box */}
        {addingSection ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-night/80 p-4 backdrop-blur-xs">
            <div className="w-full max-w-xl rounded-2xl border border-night-line bg-night-card p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-night-line pb-4">
                <h3 className="text-base font-extrabold text-chalk">
                  Add Section Mini-Box to {activePage?.title}
                </h3>
                <button
                  type="button"
                  onClick={() => setAddingSection(false)}
                  className="text-xs font-bold text-chalk-dim/60 hover:text-chalk"
                >
                  ✕ Close
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-chalk mb-1">Section Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Key Features Grid"
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
                    <option value="hero">Hero Banner</option>
                    <option value="about">About Us</option>
                    <option value="features">Features / Highlights</option>
                    <option value="stats">Statistics</option>
                    <option value="courses">Academics & Courses</option>
                    <option value="placements">Placements</option>
                    <option value="contact">Contact Us</option>
                    <option value="footer">Footer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-chalk mb-1">Custom Section HTML (Optional)</label>
                  <textarea
                    rows={6}
                    placeholder="<section style='padding: 60px 24px...'>...</section>"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full rounded-xl border border-night-line bg-night p-4 font-mono text-xs text-chalk outline-none focus:border-chalk"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-night-line">
                <button
                  type="button"
                  onClick={() => setAddingSection(false)}
                  className="rounded-xl border border-night-line px-4 py-2 text-xs font-bold text-chalk-dim hover:text-chalk"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddSectionSubmit}
                  disabled={!newTitle.trim()}
                  className="rounded-xl bg-chalk px-5 py-2 text-xs font-bold text-night hover:bg-chalk/90 disabled:opacity-50"
                >
                  Add Mini-Box
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Shell>
  );
}
