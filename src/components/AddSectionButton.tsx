import React from "react";
import { Plus } from "lucide-react";

export interface AddSectionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  icon?: React.ReactNode;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export const AddSectionButton = React.forwardRef<HTMLButtonElement, AddSectionButtonProps>(
  ({ label = "Add Section", icon, size = "md", className = "", style, ...props }, ref) => {
    const sizeConfig = {
      xs: {
        trackPadding: "p-[1.5px]",
        buttonPadding: "px-2.5 py-1",
        textSize: "text-[11px] font-black",
        iconSize: "w-3 h-3",
        gap: "gap-1",
      },
      sm: {
        trackPadding: "p-[2px]",
        buttonPadding: "px-3 py-1.5",
        textSize: "text-xs font-black",
        iconSize: "w-3.5 h-3.5",
        gap: "gap-1.5",
      },
      md: {
        trackPadding: "p-[3px]",
        buttonPadding: "px-5 py-2",
        textSize: "text-xs font-black sm:text-sm",
        iconSize: "w-4 h-4",
        gap: "gap-2",
      },
      lg: {
        trackPadding: "p-[4px]",
        buttonPadding: "px-7 py-3",
        textSize: "text-sm font-black sm:text-base",
        iconSize: "w-5 h-5",
        gap: "gap-2.5",
      },
    }[size];

    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-full group select-none transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] ${sizeConfig.trackPadding} ${className}`}
      >
        {/* 1. Outer Translucent Glass Track Capsule */}
        <div className="absolute inset-0 rounded-full border border-night-line bg-gradient-to-b from-slate-200/50 via-slate-300/30 to-slate-400/40 backdrop-blur-xl shadow-lg transition-all duration-300 group-hover:border-night-line group-hover:from-slate-100/60 group-hover:to-slate-300/50" />

        {/* 2. Prismatic / Liquid Chromatic Edge Glow (Bottom Rainbow Spectrum Refraction) */}
        <div
          className="absolute inset-[-1px] rounded-full pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden"
          style={{
            padding: "2px",
            background:
              "conic-gradient(from 120deg at 50% 50%, rgba(255, 255, 255, 0.95) 0deg, rgba(255, 0, 100, 0.95) 40deg, rgba(255, 190, 0, 0.95) 90deg, rgba(0, 230, 180, 0.95) 140deg, rgba(0, 180, 255, 0.95) 190deg, rgba(140, 0, 255, 0.95) 250deg, rgba(255, 255, 255, 0.95) 360deg)",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            filter: "drop-shadow(0px 2px 6px rgba(0, 180, 255, 0.4))",
          }}
        />

        {/* 3. The Pill Button Element */}
        <button
          ref={ref}
          {...props}
          className={`relative z-10 inline-flex items-center justify-center ${sizeConfig.gap} ${sizeConfig.buttonPadding} ${sizeConfig.textSize} text-chalk bg-gradient-to-b from-white via-slate-50 to-slate-100/95 rounded-full shadow-[0_6px_20px_rgba(0,0,0,0.12),inset_0_1.5px_1px_rgba(255,255,255,1),inset_0_-2px_4px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.18),inset_0_1.5px_1px_rgba(255,255,255,1)] hover:text-slate-950 cursor-pointer transition-all duration-200 border-none outline-none disabled:opacity-50 disabled:pointer-events-none`}
          style={style}
        >
          {icon !== undefined ? (
            icon
          ) : (
            <Plus className={`${sizeConfig.iconSize} text-chalk group-hover:text-slate-950 transition-transform duration-300 group-hover:rotate-90 stroke-[2.5]`} />
          )}
          <span className="tracking-tight font-extrabold">{label}</span>
        </button>
      </div>
    );
  }
);

AddSectionButton.displayName = "AddSectionButton";
