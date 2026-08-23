import type { ReactNode } from "react";

/**
 * The banner across the top of the landing screen.
 *
 * The one piece of colour on an otherwise white console, which is what makes it
 * work: it reads as a header rather than as another card because nothing else
 * on the page is filled.
 *
 * `action` is required rather than optional on purpose. The layout this is
 * drawn from puts a prominent button here, and a prominent button that does
 * nothing is worse than no button — so this component cannot be rendered
 * without wiring one to something the page already does.
 */
export function HeroBanner({
  title,
  body,
  action,
}: {
  title: string;
  body: ReactNode;
  action: { label: string; onClick: () => void };
}) {
  return (
    <div className="hero-banner rounded-xl px-6 py-7 sm:px-8">
      <div className="relative z-10 max-w-2xl">
        <h2 className="text-[20px] font-bold leading-tight tracking-tight text-white sm:text-[22px]">
          {title}
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-white/75">{body}</p>
        <button
          type="button"
          onClick={action.onClick}
          className="mt-5 cursor-pointer rounded-md bg-white px-4 py-2 text-[13px] font-semibold text-accent transition-colors hover:bg-night"
        >
          {action.label}
        </button>
      </div>
    </div>
  );
}
