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

    /*
     * The primary action, as one ink pill.
     *
     * This used to be a frosted capsule wrapped in a prismatic conic-gradient
     * edge — a treatment that only reads as glass when there is something dark
     * behind it to refract. On the light surface it was a grey lozenge with a
     * rainbow fringe, competing with the pastel tiles for the eye while saying
     * less than they do. Ink says "this is the action" with no colour at all,
     * which is the whole reason the accent is ink here.
     *
     * The API is untouched: same props, same sizes, same handlers.
     */
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-full group select-none transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] ${sizeConfig.trackPadding} ${className}`}
      >
        <button
          ref={ref}
          {...props}
          className={`relative z-10 inline-flex items-center justify-center ${sizeConfig.gap} ${sizeConfig.buttonPadding} ${sizeConfig.textSize} text-night bg-accent hover:bg-accent-hover rounded-full shadow-[0_8px_22px_-10px_rgba(27,27,37,0.75)] hover:shadow-[0_12px_28px_-10px_rgba(27,27,37,0.85)] cursor-pointer transition-all duration-200 border-none outline-none disabled:opacity-50 disabled:pointer-events-none`}
          style={style}
        >
          {icon !== undefined ? (
            icon
          ) : (
            <Plus className={`${sizeConfig.iconSize} text-night transition-transform duration-300 group-hover:rotate-90 stroke-[2.5]`} />
          )}
          <span className="tracking-tight font-extrabold">{label}</span>
        </button>
      </div>
    );
  }
);

AddSectionButton.displayName = "AddSectionButton";
