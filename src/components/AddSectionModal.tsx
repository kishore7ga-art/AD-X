import { useState } from "react";
import { X, ArrowRight, Layout, Info, GraduationCap, Users, Calendar, Mail, Briefcase, Award } from "lucide-react";
import { AddSectionButton } from "@/components/AddSectionButton";

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSectionType: (type: { id: string; name: string; description: string }) => void;
}

import { PLATFORM_SECTION_CATEGORIES } from "@/constants/categories";

export const SECTION_TYPES_LIST = PLATFORM_SECTION_CATEGORIES.map((cat) => ({
  ...cat,
  icon: cat.id === "about" || cat.id === "vision" ? Info : cat.id === "courses" || cat.id === "departments" || cat.id === "admission" ? GraduationCap : cat.id === "placements" ? Briefcase : cat.id === "testimonials" ? Users : cat.id === "highlights" || cat.id === "awards" ? Award : cat.id === "news" || cat.id === "events" ? Calendar : cat.id === "contact" || cat.id === "map" ? Mail : Layout,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm text-slate-900 font-sans">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-6 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-mono text-cyan-600 font-extrabold uppercase tracking-widest bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
              NEW SECTION
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">Select Section Category</h2>
            <p className="text-xs text-slate-500 mt-0.5">Choose a component category to add and build in the code studio.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
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
                className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                  isSelected
                    ? "bg-cyan-50/70 border-cyan-500 shadow-sm ring-2 ring-cyan-500/20"
                    : "bg-slate-50/60 border-slate-200/80 text-slate-700 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl ${isSelected ? "bg-cyan-500 text-white shadow-sm shadow-cyan-500/30" : "bg-white border border-slate-200 text-slate-600"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-extrabold ${isSelected ? "text-cyan-900" : "text-slate-900"}`}>
                      {type.name}
                    </h3>
                    <p className={`text-xs mt-1 leading-relaxed ${isSelected ? "text-cyan-700 font-medium" : "text-slate-500"}`}>
                      {type.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Continue Action */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-500">
            Selected: <strong className="text-slate-900 font-bold">{current.name}</strong>
          </span>

          <AddSectionButton
            onClick={() => {
              onSelectSectionType(current);
              onClose();
            }}
            label="Proceed to Code Studio"
            icon={<ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-slate-950" />}
            size="sm"
          />
        </div>

      </div>
    </div>
  );
}
