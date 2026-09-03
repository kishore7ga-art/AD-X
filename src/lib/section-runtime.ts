/**
 * The one definition of the environment a section's HTML renders inside.
 *
 * A section is stored as a raw HTML string. It has no component, no props and no
 * stylesheet of its own beyond whatever `<style>` block the author typed — so what
 * it *looks* like is decided entirely by the document around it. That is why the
 * Admin preview and the published site drifted: the Admin renders each section in
 * an `<iframe srcDoc>` carrying Tailwind's CDN build, Font Awesome, Inter, and a
 * short base stylesheet, while the site injected the same HTML into the Next.js
 * document, where a different Tailwind (v4, compiled), a different preflight and
 * the app's own `globals.css` were in scope. Same input, two environments, two
 * renderings — and no amount of patching either side alone could converge them.
 *
 * So the environment is defined once, here, and both sides build from it:
 *   - Admin  (`xite-admin`)  — `buildSectionPreviewDocument()` for the iframe.
 *   - Site   (`xite-F`)      — `sectionRuntimeCss(scope)` injected into the page.
 *
 * The scoped form is not an approximation of the document form. Every declaration
 * is the same, in the same order; only the subject changes, from `html, body` to
 * the element standing in for the body. The selectors are wrapped in `:where()`
 * so scoping adds *zero* specificity — a section's own `.container { padding: 0 }`
 * outranks the runtime's `.container` inline exactly as it does inside the iframe.
 * Without `:where()` the scoped copy would quietly win fights the iframe copy
 * loses, which is the subtler half of the same bug.
 *
 * MIRRORED FILE — a byte-identical copy lives at
 * `xite-admin/src/lib/section-runtime.ts`. Change it in both, or the two
 * environments start drifting again and the drift is invisible until a college
 * looks at its own published site.
 */

/** Tailwind's Play CDN. Admin sections are authored with Tailwind classes, and
 *  a compiled build cannot know class names that arrive as runtime strings. */
export const SECTION_RUNTIME_TAILWIND_CDN_SRC = "https://cdn.tailwindcss.com";

/**
 * The container every section is measured against.
 *
 * Not the viewport. A section is rendered at three different widths on three
 * different surfaces — full width on a published site, inside a 375px frame in
 * the editor, inside an iframe in the Admin — and only in the first two does the
 * viewport happen to be the width the section actually gets. In the editor's
 * mobile mode the viewport is the whole browser window, so `@media (max-width:
 * 900px)` does not fire and a 375px-wide canvas renders the *desktop* navbar,
 * while the Admin's iframe (whose viewport really is 375px) shows the mobile one.
 * Same section, same breakpoint, two answers.
 *
 * Querying the container instead gives one answer everywhere, because the
 * container is the box the section occupies on every surface.
 */
export const SECTION_CONTAINER_NAME = "xite";

/**
 * Every width the platform makes a decision at, in one place.
 *
 * These were previously spread across five files and disagreed: the navbar
 * swapped at 900, the Admin's auto-responsive engine used 1024 and 640, and the
 * device switchers offered their own ladders. A section could therefore be
 * "tablet" to one part of the system and "desktop" to another.
 *
 * `nav` keeps its historical 900 deliberately — headers have been authored
 * against it, and moving it would restyle sections nobody asked to change.
 */
export const SECTION_BREAKPOINTS = {
  /** At or below: one column, fluid type, wrapped rows. */
  mobile: 640,
  /** At or below: fewer columns, contained widths, trimmed spacing. */
  tablet: 1024,
  /** At or below: hamburger. Above: the desktop nav. */
  nav: 900,
} as const;

export type SectionDevicePreset = {
  id: string;
  label: string;
  /** A CSS width for the canvas. "100%" means "however wide the page is". */
  width: string;
  group: "desktop" | "tablet" | "mobile";
};

/**
 * The device ladder the Admin preview, the editor and the site preview all offer.
 *
 * One list, so "Tablet" means the same width in all three and a section checked
 * in one is checked in the others.
 */
export const SECTION_DEVICE_PRESETS: readonly SectionDevicePreset[] = [
  { id: "full", label: "Full Width (100%)", width: "100%", group: "desktop" },
  { id: "desktop-wide", label: "Desktop Widescreen", width: "1200px", group: "desktop" },
  { id: "desktop-compact", label: "Desktop Compact", width: "1024px", group: "desktop" },
  { id: "tablet", label: "Tablet", width: "768px", group: "tablet" },
  { id: "tablet-mini", label: "Tablet Mini", width: "640px", group: "tablet" },
  { id: "mobile", label: "Mobile M", width: "375px", group: "mobile" },
  { id: "mobile-large", label: "Mobile L", width: "425px", group: "mobile" },
];

/** The widths in one device group, in the order the switchers cycle through them. */
export function sectionDeviceWidths(group: SectionDevicePreset["group"]): string[] {
  return SECTION_DEVICE_PRESETS.filter((preset) => preset.group === group).map((p) => p.width);
}

/**
 * What one press of a device button should do.
 *
 * Pressing the group you are already in advances to the next width inside it;
 * pressing a different group enters it at its first width. That is one rule, and
 * every switcher on the platform now gets it from here.
 *
 * It was written out by hand in each dock instead — the editor toolbar as a
 * chain of `if (viewportWidth === "1200px") nextIdx = 2`, the site preview as
 * its own modulo — so the two agreed only for as long as nobody added a preset.
 * Adding one to `SECTION_DEVICE_PRESETS` would have extended the preview's cycle
 * and silently left the toolbar's hard-coded indices skipping it, which is the
 * failure this ladder exists to prevent.
 */
export function nextSectionDeviceWidth(
  group: SectionDevicePreset["group"],
  current: string,
): string {
  const widths = sectionDeviceWidths(group);
  // A group with no presets cannot be entered; returning `current` leaves the
  // canvas where it is rather than setting its width to `undefined`.
  if (widths.length === 0) return current;

  const index = widths.indexOf(current);
  if (index < 0) return widths[0]!;
  return widths[(index + 1) % widths.length]!;
}

/** The group a canvas width belongs to, or `null` if it is not a preset. */
export function sectionDeviceGroupOf(width: string): SectionDevicePreset["group"] | null {
  return SECTION_DEVICE_PRESETS.find((preset) => preset.width === width)?.group ?? null;
}

/**
 * Stylesheets the environment loads, in order.
 *
 * The weight ranges are the full ones the two families ship — 100 to 900 —
 * rather than the 300-and-up they used to be. A section authored with
 * `font-weight: 100` or `200` had no font file to render in, so the browser
 * either synthesised a thin face or quietly used the nearest weight it had;
 * either way the author's setting appeared not to work. Both are variable
 * fonts, so the wider axis is the same file and the same request.
 */
export const SECTION_RUNTIME_STYLESHEET_HREFS: readonly string[] = [
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css",
  "https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&family=Outfit:wght@100..900&display=swap",
];

/** The same stylesheets as markup, for the iframe document. */
export const SECTION_RUNTIME_HEAD_LINKS: string = [
  '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"/>',
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,100..900;1,100..900&family=Outfit:wght@100..900&display=swap" rel="stylesheet">',
].join("\n  ");

/**
 * Every inherited CSS property.
 *
 * These are the only properties that can reach a section from an ancestor, so
 * this list is the complete boundary between the host document and the canvas.
 * Resetting all of them is the difference between containment and a running
 * list of symptoms — see `hostReset` in `sectionRuntimeCss`.
 *
 * Taken from the CSS specifications' "Inherited: yes" entries. Kept as data so
 * the rule that uses it stays one line, and so adding a property is adding a
 * string rather than editing a template literal.
 */
const INHERITED_PROPERTIES = [
  // Text and font
  "color",
  "font",
  "font-family",
  "font-size",
  "font-style",
  "font-variant",
  "font-weight",
  "font-stretch",
  "font-feature-settings",
  "font-variation-settings",
  "font-kerning",
  "font-optical-sizing",
  "line-height",
  "letter-spacing",
  "word-spacing",
  "text-align",
  "text-align-last",
  "text-indent",
  "text-transform",
  "text-shadow",
  "text-rendering",
  "text-underline-position",
  "text-underline-offset",
  "text-decoration-color",
  "text-decoration-style",
  "text-decoration-thickness",
  "text-emphasis",
  "-webkit-font-smoothing",
  "-moz-osx-font-smoothing",
  "-webkit-text-size-adjust",
  "-webkit-text-stroke",
  "-webkit-tap-highlight-color",
  "font-synthesis",
  "hyphens",
  "tab-size",
  "white-space",
  "word-break",
  "overflow-wrap",
  "line-break",
  "quotes",
  "hanging-punctuation",
  // Writing mode and direction
  "direction",
  "writing-mode",
  "text-orientation",
  "text-combine-upright",
  "unicode-bidi",
  // Lists
  "list-style",
  "list-style-type",
  "list-style-position",
  "list-style-image",
  // Tables
  "border-collapse",
  "border-spacing",
  "caption-side",
  "empty-cells",
  // Interaction and rendering
  "cursor",
  "visibility",
  "pointer-events",
  "image-rendering",
  "color-scheme",
  "caret-color",
  "accent-color",
  "scrollbar-color",
  "scrollbar-width",
  "print-color-adjust",
] as const;

/**
 * The base stylesheet every section renders against.
 *
 * @param scope  A selector for the element that plays the part of `<body>` when
 *               sections are rendered inline in a page, or `null` for a document
 *               of their own (the Admin iframe), where `html, body` is the subject.
 */
export function sectionRuntimeCss(
  scope: string | null,
  options: { fillViewport?: boolean } = {},
): string {
  /**
   * Whether the canvas should be at least a screenful tall.
   *
   * True for a published site and for the Admin's preview iframe: a short page
   * should end in the site's own background rather than in a strip of whatever
   * is behind it.
   *
   * False for the editor, where it is actively wrong. The editor's canvas sits
   * on the studio's own white surface, so reserving height paints a band of the
   * *site's* background below the last section — a dark rectangle with nothing
   * in it, which reads as a section that failed to load rather than as the end
   * of the page. Defaults to true so the two surfaces that want it keep it
   * without opting in.
   */
  const fillViewport = options.fillViewport ?? true;

  // `:where()` keeps the scope weightless, so a scoped rule and its document-level
  // twin lose and win exactly the same cascade fights.
  const at = scope ? `:where(${scope})` : null;
  const root = at ?? "html, body";
  const universal = at
    ? `${at}, ${at} *, ${at} *::before, ${at} *::after`
    : "*, ::before, ::after";
  const sel = (selector: string) => (at ? `${at} ${selector}` : selector);

  /**
   * The containment layer: everything the host document must not be able to say
   * about a section.
   *
   * ── Why this is a list and not three properties ───────────────────────────
   *
   * A section is authored against the Admin's iframe, which inherits nothing,
   * and ships into the application's document, which inherits a great deal:
   * `<html class="dark bg-black text-white font-sans antialiased scroll-smooth">`,
   * a `globals.css` that sets font smoothing and text rendering on `body` and
   * hides every scrollbar on `*`, and — because `globals.css` does
   * `@import "tailwindcss"` while sections are compiled by the Tailwind Play
   * CDN — *two* preflights from two different Tailwind majors.
   *
   * The same HTML therefore renders one way where it was designed and another
   * way where it ships, for reasons no one authoring a section can see.
   *
   * This used to undo exactly three properties, named after the three symptoms
   * somebody had chased down. That is a list that grows one incident at a time,
   * and it is silently wrong the moment anyone adds a global style to the app.
   *
   * ── What it does instead ──────────────────────────────────────────────────
   *
   * Every *inherited* CSS property is reset on the canvas to the value it would
   * have in a bare document. Inherited properties are the only ones that can
   * cross into section markup from an ancestor, so resetting them at the canvas
   * boundary is complete rather than anecdotal: whatever the app sets on `html`
   * or `body`, a section starts from the same place the iframe starts from.
   *
   * `revert` is the mechanism — it rolls a property back to the user-agent
   * value, which is precisely "what the iframe would have done".
   *
   * ── And the preflights ────────────────────────────────────────────────────
   *
   * A reset on the canvas cannot undo a preflight, because preflight rules
   * target the elements themselves (`h1`, `ul`, `img`) rather than being
   * inherited. So the base rules a section is entitled to assume are restated
   * for the elements the two Tailwind majors disagree about. `:where()` keeps
   * them at zero specificity, so a section's own CSS — and its Tailwind classes
   * — still win.
   *
   * Only in the scoped case. In the iframe there is no host to contain.
   */
  const hostReset = at
    ? `
/* Inherited properties, back to the user-agent values. */
${at} {
  ${INHERITED_PROPERTIES.map((property) => `${property}: revert;`).join("\n  ")}
}

/* Scrollbars: globals.css hides every one in the app, with a rule on *. */
${at}, ${at} * { scrollbar-width: auto; -ms-overflow-style: auto; }
${at} ::-webkit-scrollbar { display: revert; width: revert; height: revert; }

/* The base styles two Tailwind preflights disagree about, restated at zero
   specificity so a section's own CSS and its utility classes still win.

   The universal rule first, and it is not redundant. Tailwind 4 — the app's
   own build — zeroes margin and padding on *every* element, with one rule on
   the universal selector. Tailwind 3, which is what compiles sections, does
   not: it zeroes them element by element (h1-h6, p, ul, blockquote, figure)
   and leaves everything else at the user-agent value. So an element on
   neither of v3's lists — an option, a td, a fieldset, a legend — keeps its
   browser padding in the Admin's iframe and loses it in the editor, and no
   rule named after an element could have covered all of them.

   revert here returns to the user-agent value; v3's preflight then sets its
   own on the elements it covers, because an element selector outranks
   :where(). Which is exactly the Admin's cascade, reproduced. */
${at} :where(*), ${at} :where(*)::before, ${at} :where(*)::after { margin: revert; padding: revert; }
${at} :where(h1, h2, h3, h4, h5, h6) { font-size: revert; font-weight: revert; margin: revert; }
${at} :where(ul, ol) { list-style: revert; margin: revert; padding: revert; }
${at} :where(p, blockquote, figure, dl, dd, pre) { margin: revert; }
${at} :where(b, strong) { font-weight: revert; }
${at} :where(em, i) { font-style: revert; }
${at} :where(small) { font-size: revert; }
${at} :where(hr) { border: revert; height: revert; color: revert; }
${at} :where(table) { border-collapse: revert; }
${at} :where(button, input, select, textarea) { font: revert; color: revert; letter-spacing: revert; }
${at} :where(button) { cursor: revert; background-color: revert; }
${at} :where(img, svg, video, canvas, audio, iframe, embed, object) { display: revert; vertical-align: revert; }
`
    : "";

  return `
${universal} { box-sizing: border-box; }${hostReset}
${root} { margin: 0; padding: 0; background-color: var(--xite-surface, #09090b); color: var(--xite-text, #ffffff); font-family: var(--xite-font, "Inter", system-ui, sans-serif); width: 100%;${fillViewport ? " min-height: 100%;" : ""} }

/* The box every section is measured against. On the canvas rather than on the
   root element: containment on <html> would make it the containing block for
   fixed-position descendants, which is a layout change nobody asked for. */
${at ?? "body"} { container: ${SECTION_CONTAINER_NAME} / inline-size; }
${sel(".container")} { width: 100%; max-width: 1200px; margin: 0 auto; padding: 24px; box-sizing: border-box; }
${sel(".footer-bottom")} { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; font-size: 13px; }
${sel(".legal-links")} { display: flex; flex-wrap: wrap; gap: 16px; }
${sel(".legal-links a")} { color: inherit; text-decoration: none; font-weight: 500; }
${sel(".legal-links a:hover")} { text-decoration: underline; }
${sel("img")} { max-width: 100%; height: auto; }
${sel("a")} { color: inherit; }

/* Media the author dropped in at its natural size must not push the page sideways. */
${sel("video")}, ${sel("svg")}, ${sel("iframe")} { max-width: 100%; }

/* Background Video Container & Video Layout for all devices (Desktop, Tablet, Mobile) */
${sel(".xite-bg-video-container")} {
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
  overflow: hidden !important;
  pointer-events: none !important;
  z-index: 0 !important;
}
${sel(".xite-bg-video-container video")}, ${sel("video.xite-bg-video")} {
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  pointer-events: none !important;
}
:where(header, section, footer, div, main):has(> .xite-bg-video-container) > :not(.xite-bg-video-container) {
  position: relative;
  z-index: 1;
}

/* The section toolbar's Animation control's entire vocabulary. Global rather
   than scoped — a @keyframes name is not a selector, and every surface a
   section renders on (this canvas, the Admin's preview iframe, the published
   site) needs the same six names to resolve the same way. Adding one here
   means adding it to the Animation dropdown in section-schema.ts too. */
@keyframes xite-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes xite-slide-up { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
@keyframes xite-slide-down { from { opacity: 0; transform: translateY(-24px); } to { opacity: 1; transform: translateY(0); } }
@keyframes xite-slide-left { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
@keyframes xite-slide-right { from { opacity: 0; transform: translateX(-24px); } to { opacity: 1; transform: translateX(0); } }
@keyframes xite-zoom-in { from { opacity: 0; transform: scale(.92); } to { opacity: 1; transform: scale(1); } }
`.trim();
}

/**
 * The responsive engine.
 *
 * Sections are authored as desktop HTML with inline styles — `width: 1200px`,
 * `grid-template-columns: repeat(4, 1fr)`, `font-size: 56px`, `padding: 80px`.
 * Nothing in that markup knows about a phone, and asking whoever writes the next
 * section to remember is how a platform ends up with two hundred sections and no
 * two of them responsive in the same way.
 *
 * So the environment does it. Three properties make that safe:
 *
 * 1. **Desktop is untouched.** Every rule lives inside a container query with a
 *    max-width. Above ${SECTION_BREAKPOINTS.tablet}px the engine emits nothing,
 *    so the layout the author approved is the layout that ships.
 *
 * 2. **It only reaches markup that needs it.** The selectors match on inline
 *    `style` attributes — `[style*="grid-template-columns"]` — which is exactly
 *    the hand-written desktop CSS that cannot adapt. A section built with
 *    Tailwind classes carries its own responsive variants and is left alone.
 *
 * 3. **`!important`, deliberately.** An inline style outranks every stylesheet
 *    rule that is not important, and inline styles are the entire problem here.
 *    This is the one place in the codebase where it is the right tool.
 *
 * Sizes are in `cqi` — 1% of the container's inline size — rather than `vw`, so a
 * heading in a 375px editor frame is the size it will be on a 375px phone.
 *
 * @param scope  As `sectionRuntimeCss`: a selector, or `null` for a document.
 */
export function sectionResponsiveCss(scope: string | null): string {
  const at = scope ? `:where(${scope})` : null;
  const sel = (selector: string) => (at ? `${at} ${selector}` : selector);
  const list = (...selectors: string[]) => selectors.map(sel).join(",\n  ");
  const q = (condition: string) => `@container ${SECTION_CONTAINER_NAME} (${condition})`;
  const { mobile, tablet, nav } = SECTION_BREAKPOINTS;

  /** Vertical rhythm authored for a desktop viewport. */
  const TALL_PADDING = [80, 96, 100, 120, 140, 160]
    .flatMap((px) => [
      `[style*="padding: ${px}px"]`,
      `[style*="padding:${px}px"]`,
      `[style*="padding-top: ${px}px"]`,
      `[style*="padding-top:${px}px"]`,
    ]);

  return `
/* ── The navbar contract ────────────────────────────────────────────────────
   Header sections ship a desktop nav, an action button and a hamburger, and
   which of the three is visible is the environment's call rather than each
   section's — so that every header behaves the same way at the same width. */
${q(`min-width: ${nav + 1}px`)} {
  ${sel(".desktop-nav-links")} { display: flex !important; visibility: visible !important; opacity: 1 !important; }
  ${sel(".desktop-apply-btn")} { display: inline-flex !important; visibility: visible !important; }
  ${sel(".hamburger-toggle-btn")} { display: none !important; }
  ${sel(".mobile-drawer-menu:not(.active)")} { display: none !important; }
}
${q(`max-width: ${nav}px`)} {
  ${sel(".desktop-nav-links")} { display: none !important; }
  ${sel(".hamburger-toggle-btn")} { display: inline-flex !important; }
  ${sel(".mobile-drawer-menu.active")} { display: block !important; }

  /* Headers that do not use the class convention above still have to fit.
     Most of the real library builds its navigation as a plain flex row of
     <nav><ul><li>, which the contract never touched — so those headers ran
     straight off the side of the page at tablet width and below, by as much as
     220px. They wrap instead. Wrapping rather than hiding, because a section
     with no hamburger has nowhere to put the links: a nav on two lines is
     usable, a nav past the edge of the screen is not. */
  ${list("header nav", "header ul", "header > div", "nav ul", "footer ul", "footer nav")} {
    flex-wrap: wrap !important;
    min-width: 0 !important;
  }

  /* A flex child will not shrink below its content unless it is told it may. */
  ${list("header nav > *", "header ul > *", "nav ul > *")} {
    min-width: 0 !important;
  }
}

/* ── Tablet ─────────────────────────────────────────────────────────────────
   Nothing collapses yet. Fixed desktop widths give up their pixels, and grids
   fit as many columns as the space honestly allows instead of keeping the four
   they were authored with. */
${q(`max-width: ${tablet}px`)} {
  /* Any inline width, whatever it says.
     This was a list of the widths somebody had thought of — 1200, 1280, 1366,
     1440, 1536, 1600, 1920 — and the real section library is full of 980, 1024,
     1100, 1120, 1300, 1350, 1380, 1420 and 1560, none of which it matched. An
     enumeration is a list of the sections that happen to work today; matching on
     the *presence* of a width is what makes this hold for sections nobody has
     written yet. Max-width rather than width, so nothing is stretched — an
     element narrower than the space keeps the size it asked for. */
  ${sel('[style*="width"]')}, ${sel("[width]")} {
    max-width: 100% !important;
  }

  /* A min-width larger than the screen is the one declaration max-width cannot
     save you from: it wins, and the layout overflows anyway. */
  ${sel('[style*="min-width"]')} {
    min-width: 0 !important;
  }

  ${list("section", "header", "footer", "main", "nav", "article", "aside")} {
    max-width: 100% !important;
  }

  /* auto-fit rather than a fixed count: a 2-up stays 2-up, a 4-up becomes 3 or
     2 as the space decides, and a grid added next year is handled already. */
  ${sel('[style*="grid-template-columns"]')} {
    grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr)) !important;
  }

  /* Below this width the pointer is a finger. A nav or footer link is a line of
     text about 20px tall, which is under every touch-target guideline there is;
     it costs nothing to give it the few pixels. Inline links inside prose are
     left alone — they are exempt, and padding them would overlap the lines
     above and below. */
  ${list(
    "nav a",
    "header a",
    "footer a",
    ".legal-links a",
    ".desktop-nav-links a",
    ".mobile-drawer-menu a",
  )} {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
  }

  ${sel('[style*="gap: 48px"]')}, ${sel('[style*="gap:48px"]')} { gap: 32px !important; }
}

/* ── Mobile ─────────────────────────────────────────────────────────────────
   One column, fluid type, and spacing that leaves room for content. */
${q(`max-width: ${mobile}px`)} {
  ${sel('[style*="grid-template-columns"]')} { grid-template-columns: 1fr !important; }

  /* Rows of buttons, stat blocks and nav items wrap instead of overflowing. */
  ${sel('[style*="display: flex"]:not([style*="flex-direction: column"])')},
  ${sel('[style*="display:flex"]:not([style*="flex-direction:column"])')} {
    flex-wrap: wrap !important;
  }

  /* Headline scale, tied to the container so the editor's 375px frame and a
     375px phone agree to the pixel. */
  ${sel("h1")} { font-size: clamp(26px, 7.4cqi, 44px) !important; line-height: 1.18 !important; }
  ${sel("h2")} { font-size: clamp(21px, 5.6cqi, 34px) !important; line-height: 1.24 !important; }
  ${sel("h3")} { font-size: clamp(18px, 4.4cqi, 26px) !important; line-height: 1.3 !important; }

  /* Desktop gutters are wider than a phone can spare. */
  ${list("section", "header", "footer", "main", ".container")} {
    padding-left: clamp(16px, 4.5cqi, 24px) !important;
    padding-right: clamp(16px, 4.5cqi, 24px) !important;
  }

  ${list(...TALL_PADDING)} {
    padding-top: clamp(32px, 9cqi, 48px) !important;
    padding-bottom: clamp(32px, 9cqi, 48px) !important;
  }

  /* A table is the one element that cannot be made to fit; let it scroll itself
     rather than dragging the page sideways with it. */
  ${sel("table")} { display: block !important; width: 100% !important; overflow-x: auto !important; }

  /* Last line of defence. Clip rather than hidden, so nothing becomes a scroll
     container and sticky positioning keeps working. */
  ${list("section", "header", "footer", "main", "nav")} { overflow-x: clip; }

  /* A white-space: nowrap is a promise the screen cannot keep. It is right on a
     desktop nav that must stay on one line and fatal at 375px, where the line
     simply leaves the page — and the real library carries seventeen of them.
     Buttons and badges keep it: they are short by nature, and wrapping them
     looks broken in a way overflowing does not. */
  ${list("p", "li", "td", "th", "h1", "h2", "h3", "h4", "h5", "h6")}[style*="nowrap"],
  ${sel('nav [style*="nowrap"]')},
  ${sel('header [style*="nowrap"]')},
  ${sel('footer [style*="nowrap"]')} {
    white-space: normal !important;
  }

  /* A long URL or an unbroken word should wrap, not overflow. */
  ${list("p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "a", "span", "td", "th")} {
    overflow-wrap: break-word;
  }
}
`.trim();
}

/**
 * Pulls a section's own CSS and links out of its markup and hands back the part
 * that is actually markup.
 *
 * Two reasons this exists rather than the code being dropped in whole. In the
 * iframe the `<style>` belongs in `<head>`, after the base stylesheet, so the
 * author's CSS wins. Inline, a browser *ignores* `<style>` and `<link>` set
 * through `innerHTML` altogether — the rules never take effect — so the caller
 * has to move them into `document.head` by hand. Same split serves both.
 */
export function extractStylesAndBody(rawCode: string): {
  headCss: string;
  headLinks: string;
  bodyHtml: string;
} {
  let code = (rawCode || "").trim();

  let headCss = "";
  let headLinks = "";

  // Extract all <style>...</style> blocks.
  //
  // Except one: sections edited before the engine existed carry a baked-in copy
  // of an older auto-responsive stylesheet, stamped `data-xite-auto-responsive`
  // by the Admin's "make responsive" button. It is a frozen fork of the engine —
  // viewport-based, its own breakpoints — and leaving it in means those sections
  // are responsive in a way no new section is, forever. It is dropped so every
  // section, old and new, is handled by the one engine that can still be fixed.
  code = code.replace(
    /<style([^>]*)>([\s\S]*?)<\/style>/gi,
    (_full, attrs: string, cssContent: string) => {
      if (/data-xite-auto-responsive/i.test(attrs)) return "";
      headCss += "\n" + cssContent;
      return "";
    },
  );

  // Extract all stylesheet <link> tags
  code = code.replace(/<link[\s\S]*?>/gi, (linkTag: string) => {
    if (
      linkTag.toLowerCase().includes("stylesheet") ||
      linkTag.toLowerCase().includes("fonts") ||
      linkTag.toLowerCase().includes("css")
    ) {
      headLinks += "\n" + linkTag;
      return "";
    }
    return linkTag;
  });

  /**
   * Document-level metadata, dropped wherever it appears.
   *
   * A section is a fragment of a page, and `<title>`, `<meta>` and `<base>`
   * describe the whole page. Sections in the library carry them anyway (most
   * were authored as standalone HTML files), and the wrapper strip below only
   * removes the ones that happen to sit inside a `<head>`. One that does not
   * survives into the canvas, where the browser hoists it: a header section
   * shipping `<title>Seoul National University Header</title>` puts that
   * string into the document beside the tenant's own page title, which is the
   * one field the whole SEO chain exists to get right. `<base>` is worse than
   * cosmetic: it silently repoints every relative URL on the page.
   *
   * Before the `<body>` extraction, so it catches them inside a document
   * wrapper and outside one alike.
   */
  code = code
    .replace(/<title\b[^>]*>[\s\S]*?<\/title\s*>/gi, "")
    .replace(/<meta\b[^>]*>/gi, "")
    .replace(/<base\b[^>]*>/gi, "");

  // Extract content inside <body>...</body> if present.
  //
  // Every tag name below carries a `\b`, which is not decoration: `<head[\s\S]*?>`
  // matches the opening tag of `<header>`, and `</head>` matches `</header>`, so
  // the "strip the document wrapper" pass used to delete every navbar section
  // whole — background, padding, nav links and all — leaving only the loose
  // children behind. That is why headers looked wrong in the Admin preview and
  // wrong in a *different* way on the site.
  let bodyHtml = code;
  const bodyMatch = code.match(/<body\b[^>]*>([\s\S]*?)<\/body\s*>/i);
  if (bodyMatch && bodyMatch[1]) {
    bodyHtml = bodyMatch[1].trim();
  } else {
    // Strip structural document tags left behind
    bodyHtml = code
      .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
      .replace(/<\/?html\b[^>]*>/gi, "")
      .replace(/<head\b[^>]*>[\s\S]*?<\/head\s*>/gi, "")
      .replace(/<\/?head\b[^>]*>/gi, "")
      .replace(/<\/?body\b[^>]*>/gi, "")
      .trim();
  }

  return { headCss, headLinks, bodyHtml };
}

/**
 * A section's markup, ready to inject into a canvas.
 *
 * **This is the only correct way to render a section into a shared document,**
 * and it exists because there used to be two.
 *
 * The published site and the preview called `extractStylesAndBody` and rendered
 * `bodyHtml` — the markup with its `<style>` and `<link>` tags lifted out —
 * because `useSectionRuntime` has already taken that CSS, fenced it to this
 * section's id and put it in the one runtime stylesheet.
 *
 * The editor had its own, weaker stripper that removed the document wrapper and
 * **left every `<style>` block in the markup** — and, when the section was a
 * full document, explicitly copied the contents of `<head>` back in. So in the
 * editor each section's CSS was injected twice: once fenced, and once
 * unfenced into the whole page.
 *
 * The unfenced copy is the bug people actually saw. A section whose stylesheet
 * says `h2 { color: #e11d48 }` or `.container { padding: 0 }` restyled *every
 * other section on the page*, and with several sections open the last one in
 * the DOM won every conflict — so sections appeared to lose their own styling
 * for no reason, and the editor disagreed with the live site it is supposed to
 * be showing. Fencing was working perfectly; a second, unfenced copy was
 * defeating it.
 *
 * One function now, called by the editor and by the site, so the two cannot
 * drift apart again.
 */
export function sectionCanvasHtml(rawCode: string): string {
  const { bodyHtml } = extractStylesAndBody(rawCode || "");
  // Inline `style="width: 40vw"` needs the same substitution the section's
  // stylesheet gets, or half of a section is container-relative and half of it
  // is window-relative. `recomposeSectionCode` puts it back on the way out.
  return `<div class="section-canvas-box">${mapInlineStyles(bodyHtml, viewportUnitsToContainer)}</div>`;
}

/**
 * A section's stored code, rebuilt after its markup was edited on the canvas.
 *
 * The inverse of `sectionCanvasHtml`, and the reason that function can safely
 * strip a section's CSS out of the canvas at all.
 *
 * Inline text editing captures an edit by reading the section's markup back out
 * of the live DOM. The canvas deliberately holds no `<style>` or `<link>` — the
 * runtime lifted them out and fenced them — so what comes back is body markup
 * and nothing else. Saving that verbatim would delete the section's entire
 * stylesheet the first time somebody corrected a typo.
 *
 * So the head is taken from the section as stored and the body from the canvas.
 * The result is normalised — several `<style>` blocks become one, and the stale
 * `data-xite-auto-responsive` fork is dropped, both by `extractStylesAndBody` —
 * which is the same normalisation every other read of a section already applies.
 */
export function recomposeSectionCode(originalCode: string, newBodyHtml: string): string {
  const { headCss, headLinks } = extractStylesAndBody(originalCode || "");

  const parts: string[] = [];
  if (headLinks.trim()) parts.push(headLinks.trim());
  if (headCss.trim()) parts.push(`<style>\n${headCss.trim()}\n</style>`);
  // The canvas renders `vw` as `cqw`; what is stored is what the author wrote.
  // Idempotent, so it costs nothing on markup that never held one.
  parts.push(mapInlineStyles((newBodyHtml || "").trim(), containerUnitsToViewport));

  return parts.filter(Boolean).join("\n");
}

/**
 * Rewrites a section's own width-based `@media` rules as container queries.
 *
 * A section that ships `@media (max-width: 900px) { .nav { display: none } }` is
 * asking "is the space I am in narrower than 900px?" — and on two of the three
 * surfaces the viewport is not that space. In the editor's 375px frame the
 * viewport is the whole window, so the rule never fires and the mobile check
 * shows a desktop navbar; in the Admin's iframe the viewport *is* 375px, so it
 * does. The author's intent is the container in both cases, so that is what it
 * gets asked about.
 *
 * Only conditions made entirely of width features are translated. Anything else
 * — `print`, `prefers-reduced-motion`, `orientation`, `hover` — is about the
 * device rather than the space, and is left exactly as written.
 */
export function viewportMediaToContainer(css: string): string {
  return css.replace(/@media([^{]+)\{/gi, (full, rawCondition: string) => {
    const condition = rawCondition.trim();

    // Drop a leading media type: everything here is a screen.
    const withoutType = condition.replace(/^(?:only\s+)?(?:screen|all)(?:\s+and\s+)?/i, "").trim();
    if (!withoutType) return full;

    const clauses = withoutType.split(/\s+and\s+/i).map((clause) => clause.trim());
    const isWidthClause = (clause: string) =>
      /^\(\s*(?:min-|max-)?width\s*:\s*[^)]+\)$/i.test(clause);

    if (!clauses.every(isWidthClause)) return full;

    return `@container ${SECTION_CONTAINER_NAME} ${clauses.join(" and ")} {`;
  });
}

/**
 * One `@import`, and the reason it is not a one-line regex.
 *
 * The rule this replaced was
 *
 *     /@import\s+(?:url\(\s*)?["']?([^"')\s;]+)["']?\s*\)?[^;]*;/
 *
 * whose href stops at the first `;`. Google Fonts puts semicolons **inside the
 * URL** — `family=EB+Garamond:ital,wght@0,600;0,700;1,400` is the ordinary
 * shape of a multi-weight request — so the match ended mid-URL and left the
 * tail of it sitting at the top of the stylesheet:
 *
 *     0,700;1,400&family=Open+Sans:wght@700;800&display=swap');
 *     .penn-header { position: relative; z-index: 9999; ... }
 *
 * A CSS parser meeting that skips to the end of the next block to resynchronise
 * — so **the section's first rule was eaten as well**. Two failures from one
 * regex, both silent: the section rendered in a fallback font *and* lost
 * whatever its opening rule said. On the platform's own default header that was
 * `position: relative; z-index: 9999`, which is what keeps a sticky navbar
 * above the section under it.
 *
 * The alternation closes the URL on its own delimiter — a quote or the closing
 * paren — rather than on the first `;` it meets.
 */
const IMPORT_RULE =
  /@import\s+(?:url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)|"([^"]*)"|'([^']*)')[^;]*;/gi;

/**
 * A section's `@import`s, lifted out of its CSS and returned as hrefs.
 *
 * Every surface has to do this, for two different reasons that happen to have
 * the same answer.
 *
 * Inline — the editor and the published site — `@import` cannot survive at all:
 * `CSSStyleSheet.replaceSync()`, which the fencing pass uses to parse and
 * re-scope the CSS, discards `@import` outright, and the rule is only legal at
 * the very top of a stylesheet while every section's CSS is concatenated after
 * the runtime blocks.
 *
 * In the Admin's iframe it was legal and **still did nothing**, for the same
 * positional reason: `buildSectionPreviewDocument` puts the section's CSS after
 * `sectionRuntimeCss` inside one `<style>`, so the `@import` was no longer the
 * first thing in the sheet and the browser ignored it. Silently — that is what
 * ignoring an `@import` looks like. Every section importing its own webfont was
 * previewed in a fallback: the platform's default header is authored in EB
 * Garamond and the Admin has been showing it in Georgia.
 *
 * So both sides load it as a `<link>` instead, which has no position rule.
 */
export function extractCssImports(css: string): { css: string; hrefs: string[] } {
  const hrefs: string[] = [];
  const stripped = (css || "").replace(IMPORT_RULE, (_full, ...groups: unknown[]) => {
    const href = groups.slice(0, 5).find((group): group is string => typeof group === "string");
    const trimmed = href?.trim();
    if (trimmed && !hrefs.includes(trimmed)) hrefs.push(trimmed);
    return "";
  });
  return { css: stripped, hrefs };
}

/**
 * Width-relative viewport units, asked about the container instead.
 *
 * ── The bug this is the fix for ────────────────────────────────────────────
 *
 * Sections in this library are full-bleed, and the way they stay full-bleed at
 * every width is `vw`: `padding: clamp(0.75rem, 1.2vw, 1.5rem) clamp(1rem,
 * 3.5vw, 4rem)` on a header bar, `font-size: clamp(2.3rem, 3.4vw, 4rem)` on a
 * wordmark, `width: clamp(38px, 4vw, 56px)` on a crest. The platform's own
 * default header uses eleven of them.
 *
 * `vw` is 1% of **the viewport**, and only on one of the three surfaces is the
 * viewport the box the section actually occupies:
 *
 * | | the section is this wide | `100vw` is |
 * | :--- | :--- | :--- |
 * | Admin preview | the iframe | the iframe — *the same* |
 * | Editor canvas | the selected width, 1440 | the studio window, 1920 |
 * | Published site | the window | the window — *the same* |
 *
 * So the editor resolved every one of those against the operator's monitor.
 * On a 1920px window showing a 1440px canvas the header's side padding came
 * out at 64px instead of 50, the wordmark at 62px instead of 49, and the nav
 * gaps proportionally wider — a header visibly taller and looser than the one
 * the Admin had just shown, from markup neither side had touched. Nothing in
 * the section is wrong, and nothing in either stylesheet disagrees; the unit
 * simply means two different numbers in two different documents.
 *
 * It also made the editor's own device switcher lie: selecting Phone narrowed
 * the canvas to 390px while `vw` went on answering 1920.
 *
 * ── The fix ───────────────────────────────────────────────────────────────
 *
 * `cqw` is 1% of the query container's inline size, and the query container is
 * `.xite-site-canvas` — the box the section occupies, on every surface. So the
 * author's intent ("one percent of my own width") is asked of the thing that
 * actually has that width, which is the same substitution
 * `viewportMediaToContainer` already makes for a section's `@media` rules and
 * for the same reason.
 *
 * On a published site at full width the two are the same number, so nothing
 * about a live page changes. In the Admin's iframe they are the same number
 * too, give or take a scrollbar — which is why this is applied on all three
 * surfaces rather than only on the one that was wrong. A rewrite that ran on
 * one surface would be a second environment to keep in step.
 *
 * `vh`, `vmin` and `vmax` are **left alone**. There is no container-relative
 * height unit unless the container declares `container-type: size`, which
 * needs a height the canvas does not have — it is as tall as its sections. So
 * `vh` still means the window, which is right on the published site and in the
 * editor and wrong only in the Admin's fixed-height iframe. See
 * SECTION-ARCHITECTURE.md §9.
 */
export function viewportUnitsToContainer(css: string): string {
  // A number, then `vw`, and only where a unit can legally be: not inside an
  // identifier (`--vw-scale`), not inside a word (`review`).
  return css.replace(/(^|[^\w.-])(-?(?:\d+\.?\d*|\.\d+))vw\b/gi, "$1$2cqw");
}

/** The inverse, for markup read back out of the canvas. See `sectionCanvasHtml`. */
export function containerUnitsToViewport(css: string): string {
  return css.replace(/(^|[^\w.-])(-?(?:\d+\.?\d*|\.\d+))cqw\b/gi, "$1$2vw");
}

/**
 * Applies `transform` to every inline `style="…"` attribute in `html`.
 *
 * Sections are authored as desktop HTML with inline styles, so a rewrite that
 * only reached `<style>` blocks would reach about half of them.
 */
export function mapInlineStyles(html: string, transform: (css: string) => string): string {
  if (!html) return html;
  return html.replace(
    /\sstyle\s*=\s*(["'])([\s\S]*?)\1/gi,
    (_full, quote: string, css: string) => ` style=${quote}${transform(css)}${quote}`,
  );
}

/**
 * Remaps `html`/`body` selectors in a section's own CSS onto the element that
 * plays the body's part inline.
 *
 * `body { background: #0b1120 }` inside a section paints the whole iframe in the
 * Admin. Inline there is one real `body` shared by every section, so the same
 * rule has to land on that section's own box instead — otherwise one section
 * repaints its neighbours, which the iframe could never do.
 */
export function remapDocumentSelectors(css: string, scope: string): string {
  return css
    .replace(/(^|[\s,{}])html\s*,\s*body\s*\{/gi, `$1${scope} {`)
    .replace(/(^|[\s,{}])body\s*\{/gi, `$1${scope} {`)
    .replace(/(^|[\s,{}])html\s*\{/gi, `$1${scope} {`);
}

/**
 * Brings a section's stored code up to date with the engine.
 *
 * Sections edited before the engine existed were put through a "make responsive"
 * button that wrote its own stylesheet *into the section* and, in one of its two
 * versions, rewrote the markup. Both are now the engine's job, done centrally to
 * every section on every surface — so what those passes left behind is no longer
 * help, it is a second opinion that cannot be updated.
 *
 * Non-destructive by design: it removes what an automated pass added and changes
 * nothing an author wrote.
 */
export function normalizeSectionCode(rawCode: string): string {
  if (!rawCode) return rawCode;
  let code = rawCode;

  // The frozen fork of the engine.
  code = code.replace(/<style[^>]*data-xite-auto-responsive[^>]*>[\s\S]*?<\/style>\s*/gi, "");

  // `<img style="max-width: 100%; height: auto;" style="…author…">`. HTML keeps
  // the *first* attribute of a duplicated pair, so this silently threw away
  // whatever the author had written — every such image has been rendering
  // unstyled since. The engine caps image width anyway, so the injected one goes.
  code = code.replace(
    /(<img\b[^>]*?)\sstyle="max-width:\s*100%;\s*height:\s*auto;"\s*(?=[^>]*\sstyle=)/gi,
    "$1 ",
  );

  // A full document that will be previewed on its own still wants this.
  if (/<head[\s>]/i.test(code) && !/name=["']viewport["']/i.test(code)) {
    code = code.replace(
      /<head\b([^>]*)>/i,
      `<head$1>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />`,
    );
  }

  return code;
}

/**
 * A complete, standalone document for one section — the Admin preview's iframe.
 *
 * This is the reference rendering. Anything the published site does differently
 * is, by definition, the bug.
 */
export function buildSectionPreviewDocument(
  rawCode: string,
  options: { title?: string } = {},
): string {
  const displayTitle = options.title || "Empty Section Box";
  const code =
    rawCode ||
    `<section style="padding: 60px 24px; text-align: center;"><h2>${displayTitle}</h2></section>`;
  const extracted = extractStylesAndBody(code);
  const { headLinks, bodyHtml } = extracted;
  // The section's own `@import`s, as `<link>`s — see `extractCssImports`. In
  // the iframe they were legal and inert, which is the harder kind of broken.
  const { css: headCss, hrefs } = extractCssImports(extracted.headCss);
  const importedLinks = hrefs
    .map((href) => `<link rel="stylesheet" href="${href}"/>`)
    .join("\n  ");

  return [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8"/>',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>',
    `  <script src="${SECTION_RUNTIME_TAILWIND_CDN_SRC}"></script>`,
    "  " + SECTION_RUNTIME_HEAD_LINKS,
    headLinks ? "  " + headLinks : "",
    importedLinks ? "  " + importedLinks : "",
    "  <style>",
    sectionRuntimeCss(null),
    sectionResponsiveCss(null),
    headCss
      ? "    /* Extracted User Custom Web CSS */\n" +
        viewportUnitsToContainer(viewportMediaToContainer(headCss))
      : "",
    "  </style>",
    "</head>",
    "<body>",
    "  " + mapInlineStyles(bodyHtml || code, viewportUnitsToContainer),
    "  <script>",
    "    (function() {",
    "      function autoPlayAllVideos() {",
    '        var vids = document.querySelectorAll("video");',
    "        vids.forEach(function(v) {",
    "          v.muted = true;",
    "          v.defaultMuted = true;",
    "          v.playsInline = true;",
    '          v.setAttribute("muted", "");',
    '          v.setAttribute("autoplay", "");',
    '          v.setAttribute("loop", "");',
    '          v.setAttribute("playsinline", "");',
    '          v.setAttribute("webkit-playsinline", "");',
    "          if (v.paused) {",
    "            var p = v.play();",
    "            if (p && p.catch) p.catch(function() {});",
    "          }",
    "        });",
    "      }",
    '      if (document.readyState === "loading") {',
    '        document.addEventListener("DOMContentLoaded", autoPlayAllVideos);',
    "      } else {",
    "        autoPlayAllVideos();",
    "      }",
    '      window.addEventListener("load", autoPlayAllVideos);',
    "      try {",
    "        var obs = new MutationObserver(autoPlayAllVideos);",
    "        obs.observe(document.documentElement, { childList: true, subtree: true });",
    "      } catch(e) {}",
    "    })();",
    "  </script>",
    "</body>",
    "</html>",
  ]
    .filter(Boolean)
    .join("\n");
}
