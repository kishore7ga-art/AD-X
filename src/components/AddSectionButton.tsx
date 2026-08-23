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
        textSize: "text-[11px] font-bold",
        iconSize: "w-3 h-3",
        gap: "gap-1",
      },
      sm: {
        trackPadding: "p-[2px]",
        buttonPadding: "px-3 py-1.5",
        textSize: "text-xs font-bold",
        iconSize: "w-3.5 h-3.5",
        gap: "gap-1.5",
      },
      md: {
        trackPadding: "p-[3px]",
        buttonPadding: "px-5 py-2",
        textSize: "text-xs font-bold sm:text-sm",
        iconSize: "w-4 h-4",
        gap: "gap-2",
      },
      lg: {
        trackPadding: "p-[4px]",
        buttonPadding: "px-7 py-3",
        textSize: "text-sm font-bold sm:text-base",
        iconSize: "w-5 h-5",
        gap: "gap-2.5",
      },
    }[size];

    /*
     * The primary action: a plain blue button.
     *
     * It has been a frosted capsule with a prismatic conic-gradient edge, and
     * then a black pill with a long drop shadow. Both were treatments that only
     * work when they are the loudest thing on the screen. On a console surface
     * every panel is white with a hairline, so a button that lifts off the page
     * and grows on hover is the only moving part in the room — it draws the eye
     * on every screen it appears on, including the ones where saving is not
     * what you came to do. Flat, blue, and the same size at rest as under the
     * cursor.
     *
     * The API is untouched: same props, same sizes, same handlers. `sizeConfig`
     * still carries `trackPadding` because the wrapper is what callers position
     * against, and removing it would shift every layout this appears in.
     */
    return (
      <div
        className={`relative inline-flex items-center justify-center group select-none ${sizeConfig.trackPadding} ${className}`}
      >
        <button
          ref={ref}
          {...props}
          className={`relative z-10 inline-flex items-center justify-center ${sizeConfig.gap} ${sizeConfig.buttonPadding} ${sizeConfig.textSize} text-white bg-accent hover:bg-accent-hover rounded-md cursor-pointer transition-colors duration-150 border-none outline-none disabled:opacity-50 disabled:pointer-events-none`}
          style={style}
        >
          {icon !== undefined ? (
            icon
          ) : (
            <Plus className={`${sizeConfig.iconSize} text-white stroke-[2.5]`} />
          )}
          <span className="tracking-tight font-semibold">{label}</span>
        </button>
      </div>
    );
  }
);

AddSectionButton.displayName = "AddSectionButton";
