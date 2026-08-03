import { useState } from "react";
import { X, ArrowRight, Layout, Info, GraduationCap, Users, Calendar, Mail, Briefcase, Award } from "lucide-react";

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSectionType: (type: { id: string; name: string; description: string }) => void;
}

export const SECTION_TYPES_LIST = [
  {
    id: "hero",
    name: "Hero Banner",
    description: "Main lead banner, masthead, and headline CTA for the top of the page.",
    icon: Layout,
  },
  {
    id: "about",
    name: "About Us",
    description: "College history, mission statement, leadership quote, and campus overview.",
    icon: Info,
  },
  {
    id: "courses",
    name: "Academics & Courses",
    description: "Degree programs, department grid, curriculum accordion, and course catalog.",
    icon: GraduationCap,
  },
  {
    id: "faculty",
    name: "Faculty Roster",
    description: "Professors, department heads, research scholars, and faculty grid.",
    icon: Users,
  },
  {
    id: "events",
    name: "Events & News",
    description: "Upcoming campus events, academic calendar, and campus news highlights.",
    icon: Calendar,
  },
  {
    id: "contact",
    name: "Contact & Map",
    description: "Campus address, interactive location map, contact form, and helpline numbers.",
    icon: Mail,
  },
  {
    id: "placements",
    name: "Placements & Careers",
    description: "Placement statistics, top recruiters, salary packages, and career cell info.",
    icon: Briefcase,
  },
  {
    id: "scholarships",
    name: "Scholarships & Grants",
    description: "Financial aid, merit scholarships, eligibility criteria, and application links.",
    icon: Award,
  },
];

export function AddSectionModal({
  isOpen,
  onClose,
  onSelectSectionType,
}: AddSectionModalProps) {
  const [selectedType, setSelectedType] = useState<string>("hero");

  if (!isOpen) return null;

  const current = SECTION_TYPES_LIST.find((s) => s.id === selectedType) || SECTION_TYPES_LIST[0]!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md text-white font-sans">
      <div className="w-full max-w-2xl bg-black border border-white/20 rounded-2xl p-6 shadow-2xl space-y-6 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">What section do you want to add?</h2>
            <p className="text-xs text-neutral-400 mt-1">Select a section category to upload code and build your component.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-neutral-900 text-neutral-400 hover:text-white transition-all cursor-pointer"
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
                className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
                  isSelected
                    ? "bg-white text-black border-white shadow-lg"
                    : "bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-900"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isSelected ? "bg-black text-white" : "bg-neutral-900 text-neutral-300"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-extrabold ${isSelected ? "text-black" : "text-white"}`}>
                      {type.name}
                    </h3>
                    <p className={`text-xs mt-1 leading-relaxed ${isSelected ? "text-neutral-700" : "text-neutral-400"}`}>
                      {type.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Continue Action */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs font-mono text-neutral-400">
            Selected: <strong className="text-white font-bold">{current.name}</strong>
          </span>

          <button
            onClick={() => {
              onSelectSectionType(current);
              onClose();
            }}
            className="flex items-center gap-2 bg-white text-black hover:bg-neutral-200 px-6 py-2.5 rounded-xl font-black text-xs shadow-lg transition-all cursor-pointer"
          >
            <span>Proceed to Code Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
