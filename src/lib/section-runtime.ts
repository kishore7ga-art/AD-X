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

/** Stylesheets the environment loads, in order. */
export const SECTION_RUNTIME_STYLESHEET_HREFS: readonly string[] = [
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css",
  "https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300..900;1,300..900&family=Outfit:wght@400..900&display=swap",
];

/** The same stylesheets as markup, for the iframe document. */
export const SECTION_RUNTIME_HEAD_LINKS: string = [
  '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"/>',
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300..900;1,300..900&family=Outfit:wght@400..900&display=swap" rel="stylesheet">',
].join("\n  ");

/**
 * The base stylesheet every section renders against.
 *
 * @param scope  A selector for the element that plays the part of `<body>` when
 *               sections are rendered inline in a page, or `null` for a document
 *               of their own (the Admin iframe), where `html, body` is the subject.
 */
export function sectionRuntimeCss(scope: string | null): string {
  // `:where()` keeps the scope weightless, so a scoped rule and its document-level
  // twin lose and win exactly the same cascade fights.
  const at = scope ? `:where(${scope})` : null;
  const root = at ?? "html, body";
  const universal = at
    ? `${at}, ${at} *, ${at} *::before, ${at} *::after`
    : "*, ::before, ::after";
  const sel = (selector: string) => (at ? `${at} ${selector}` : selector);

  // Inline, the canvas inherits from a page that has opinions the iframe does not:
  // `globals.css` antialiases text, asks for `optimizeLegibility`, and hides every
  // scrollbar in the app. All three are inherited or universal, so they reach into
  // section markup and change how it renders. The canvas starts from the browser's
  // defaults instead — which is where the iframe starts.
  const hostReset = at
    ? `
${at} { -webkit-font-smoothing: auto; -moz-osx-font-smoothing: auto; text-rendering: auto; }
${at}, ${at} * { scrollbar-width: auto; -ms-overflow-style: auto; }
${at} ::-webkit-scrollbar { display: revert; width: revert; height: revert; }
`
    : "";

  return `
${universal} { box-sizing: border-box; }${hostReset}
${root} { margin: 0; padding: 0; background-color: #09090b; color: #ffffff; font-family: "Inter", system-ui, sans-serif; width: 100%; min-height: 100%; }
${sel(".container")} { width: 100%; max-width: 1200px; margin: 0 auto; padding: 24px; box-sizing: border-box; }
${sel(".footer-bottom")} { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; font-size: 13px; }
${sel(".legal-links")} { display: flex; flex-wrap: wrap; gap: 16px; }
${sel(".legal-links a")} { color: inherit; text-decoration: none; font-weight: 500; }
${sel(".legal-links a:hover")} { text-decoration: underline; }
${sel("img")} { max-width: 100%; height: auto; }
${sel("a")} { color: inherit; }

/* Media the author dropped in at its natural size must not push the page sideways. */
${sel("video")}, ${sel("svg")}, ${sel("iframe")} { max-width: 100%; }

/* The responsive navbar contract. Header sections ship a desktop nav, an "Apply"
   button and a hamburger; which of the three is visible is the environment's call,
   not the section's, so that every header behaves the same way at the same width. */
@media (min-width: 901px) {
  ${sel(".desktop-nav-links")} { display: flex !important; visibility: visible !important; opacity: 1 !important; }
  ${sel(".desktop-apply-btn")} { display: inline-flex !important; visibility: visible !important; }
  ${sel(".hamburger-toggle-btn")} { display: none !important; }
  ${sel(".mobile-drawer-menu:not(.active)")} { display: none !important; }
}
@media (max-width: 900px) {
  ${sel(".desktop-nav-links")} { display: none !important; }
  ${sel(".hamburger-toggle-btn")} { display: inline-flex !important; }
  ${sel(".mobile-drawer-menu.active")} { display: block !important; }
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

  // Extract all <style>...</style> blocks
  code = code.replace(/<style[\s\S]*?>([\s\S]*?)<\/style>/gi, (_, cssContent: string) => {
    headCss += "\n" + cssContent;
    return "";
  });

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
  const { headCss, headLinks, bodyHtml } = extractStylesAndBody(code);

  return [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8"/>',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>',
    `  <script src="${SECTION_RUNTIME_TAILWIND_CDN_SRC}"></script>`,
    "  " + SECTION_RUNTIME_HEAD_LINKS,
    headLinks ? "  " + headLinks : "",
    "  <style>",
    sectionRuntimeCss(null),
    headCss ? "    /* Extracted User Custom Web CSS */\n" + headCss : "",
    "  </style>",
    "</head>",
    "<body>",
    "  " + (bodyHtml || code),
    "</body>",
    "</html>",
  ]
    .filter(Boolean)
    .join("\n");
}
