import { useState } from "react";
import { X, ArrowRight, Layout, Info, GraduationCap, Users, Calendar, Mail, Briefcase, Award, Megaphone, HelpCircle } from "lucide-react";
import { AddSectionButton } from "@/components/AddSectionButton";
import { PLATFORM_SECTION_CATEGORIES } from "@/constants/categories";
import type { SectionCategoryId } from "@/lib/sections/categories";

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSectionType: (type: { id: string; name: string; description: string }) => void;
}

/**
 * One icon per category, keyed by the canonical id.
 *
 * A lookup rather than the nested ternary this replaces, which compared against
 * `admission` and `awards` — ids the platform does not use. Those two branches
 * had been dead since the aliases were introduced, and nothing said so until the
 * ids became a union type.
 *
 * `Record<SectionCategoryId, ...>` is the point: a category added to the shared
 * list without an icon here fails the build.
 */
const ICON_FOR_CATEGORY: Record<SectionCategoryId, typeof Layout> = {
  navbar: Layout,
  hero: Layout,
  cta: Megaphone,
  highlights: Award,
  about: Info,
  vision: Info,
  courses: GraduationCap,
  departments: GraduationCap,
  admissions: GraduationCap,
  placements: Briefcase,
  facilities: Layout,
  research: Layout,
  news: Calendar,
  events: Calendar,
  gallery: Layout,
  testimonials: Users,
  achievements: Award,
  faq: HelpCircle,
  contact: Mail,
  map: Mail,
  footer: Layout,
};

export const SECTION_TYPES_LIST = PLATFORM_SECTION_CATEGORIES.map((cat) => ({
  ...cat,
  icon: ICON_FOR_CATEGORY[cat.id] ?? Layout,
}));

export function AddSectionModal({
  isOpen,
  onClose,
  onSelectSectionType,
}: AddSectionModalProps) {
  const [selectedType, setSelectedType] = useState<string>("hero");

  if (!isOpen) return null;

  const current = SECTION_TYPES_LIST.find((s) => s.id === selectedType) || SECTION_TYPES_LIST[0]!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-chalk/40 backdrop-blur-sm text-chalk font-sans">
      <div className="w-full max-w-2xl bg-white border border-night-line rounded-xl p-6 shadow-lg space-y-6 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-night-line pb-4">
          <div>
            <span className="text-[10px] font-mono text-accent font-semibold uppercase tracking-widest bg-accent/10 px-2.5 py-0.5 rounded-full border border-amber-200">
              NEW SECTION
            </span>
            <h2 className="text-xl font-bold text-chalk tracking-tight mt-1">Select Section Category</h2>
            <p className="text-xs text-chalk-dim mt-0.5">Choose a component category to add and build in the code studio.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-night text-chalk-dim hover:text-chalk transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section List Grid */}
        <div className="grid gap-3 sm:grid-cols-2 max-h-[60vh] overflow-y-auto pr-1">
          {SECTION_TYPES_LIST.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            return (
              <div
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`p-4 rounded-lg border transition-all cursor-pointer select-none ${
                  isSelected
                    ? "bg-night border-chalk shadow-sm ring-2 ring-chalk/15"
                    : "bg-night border-night-line text-chalk hover:border-night-line hover:bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-lg ${isSelected ? "bg-accent text-night shadow-sm shadow-chalk/25" : "bg-white border border-night-line text-chalk-dim"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-semibold ${isSelected ? "text-chalk" : "text-chalk"}`}>
                      {type.name}
                    </h3>
                    <p className={`text-xs mt-1 leading-relaxed ${isSelected ? "text-chalk-dim font-medium" : "text-chalk-dim"}`}>
                      {type.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Continue Action */}
        <div className="pt-4 border-t border-night-line flex items-center justify-between">
          <span className="text-xs font-mono text-chalk-dim">
            Selected: <strong className="text-chalk font-bold">{current.name}</strong>
          </span>

          <AddSectionButton
            onClick={() => {
              onSelectSectionType(current);
              onClose();
            }}
            label="Proceed to Code Studio"
            icon={<ArrowRight className="w-4 h-4 text-night" />}
            size="sm"
          />
        </div>

      </div>
    </div>
  );
}
