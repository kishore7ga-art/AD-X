/**
 * The four editor themes.
 *
 * ── What this replaces ─────────────────────────────────────────────────────
 *
 * Choosing a theme used to run a find-and-replace over every section's stored
 * HTML: a dozen hardcoded hex values, swapped for a dozen others, written back
 * into `sec.code` and autosaved. Three consequences, all of them observed:
 *
 *  1. It was destructive and one-way. `#2563eb` became `#f59e0b`, and switching
 *     back turned *every* `#f59e0b` blue — including the ones the section was
 *     authored with. A tenant who tried two themes could not get their original
 *     colours back, because the information needed to do it had been overwritten.
 *  2. It missed almost everything. Only twelve exact hex strings in four exact
 *     CSS property spellings were matched, so `rgb(37,99,235)`, `#2563EB`,
 *     `background:#2563eb` with no space, and every colour inside a `<style>`
 *     block were left as they were. A "theme switch" recoloured some buttons
 *     and left the page otherwise untouched, which reads as a broken feature.
 *  3. It could not be instant across pages. The rewrite only touched the
 *     sections currently in state — the page being looked at. Other pages kept
 *     the old colours until they were opened and re-themed, so a site could be
 *     half one theme and half another.
 *
 * ── What happens instead ───────────────────────────────────────────────────
 *
 * Nothing is written to `sec.code`, ever. Two mechanisms, both reversible:
 *
 *  1. `themeStylesheet()` emits all four themes' tokens as CSS custom
 *     properties, keyed on a `data-xite-theme` attribute. Switching the theme
 *     sets one attribute on one element. Every section under it retints in the
 *     same frame — no refetch, no re-render of section markup, no reload, and
 *     no dependency on which page happens to be open.
 *  2. `tokenizeSectionCss()` rewrites brand colours to `var(--xite-…, #original)`
 *     *at render time only*. The original hex stays in the file as the
 *     fallback, so a section renders identically with no theme applied, and
 *     removing the theme restores it exactly. This is what lets the tokens
 *     reach colours the old approach could not: it runs over the section's
 *     `<style>` blocks and its inline `style` attributes alike, and it
 *     understands `#rgb`, `#rrggbb` in any case, and `rgb()`/`rgba()`.
 */

export type EditorThemeId =
  | "black-and-white"
  | "white-and-black"
  | "black-white"
  | "white-black"
  | "academic-blue"
  | "emerald-gold"
  | "crimson-slate"
  | "midnight-purple"
  | "custom";

export type EditorFontId = "inter" | "outfit" | "serif";

export type ColorPalette = {
  id: string;
  name: string;
  description?: string;
  primary: string;
  secondary: string;
  type: "default" | "custom";
};

export interface ColorTokenMap {
  light1: string; // Page Canvas / Primary Background
  light2: string; // Card Background / Secondary Layer
  accent: string; // CTA Buttons, Hyperlinks, Active Rings
  dark1: string;  // Secondary text, Borders, Muted Icons
  dark2: string;  // Primary Headings, High-Contrast Text
}

export interface PalettePreset {
  id: string;
  name: string;
  description?: string;
  tokens: ColorTokenMap;
  isCustom?: boolean;
}

export interface SectionThemeDerived {
  lightest: { bg: string; text: string; accent: string };
  light:    { bg: string; text: string; accent: string };
  bright:   { bg: string; text: string; accent: string };
  dark:     { bg: string; text: string; accent: string };
  darkest:  { bg: string; text: string; accent: string };
}

export const DEFAULT_SQUARESPACE_PALETTES: readonly PalettePreset[] = [
  {
    id: "white-black",
    name: "White & Black",
    description: "Light monochrome canvas with deep accents",
    tokens: {
      light1: "#FFFFFF",
      light2: "#F4F4F5",
      accent: "#09090B",
      dark1: "#27272A",
      dark2: "#09090B",
    },
  },
  {
    id: "black-white",
    name: "Black & White",
    description: "Classic high contrast dark palette",
    tokens: {
      light1: "#18181B",
      light2: "#27272A",
      accent: "#FAFAFA",
      dark1: "#A1A1AA",
      dark2: "#FAFAFA",
    },
  },
  {
    id: "custom",
    name: "Custom Palette",
    description: "Click to customize",
    isCustom: true,
    tokens: {
      light1: "#FFFFFF",
      light2: "#EFF6FF",
      accent: "#2563EB",
      dark1: "#334155",
      dark2: "#0F172A",
    },
  },
] as const;

export const DEFAULT_PALETTES: readonly ColorPalette[] = [
  {
    id: "black-white",
    name: "Black & White",
    description: "Classic monochrome",
    primary: "#000000",
    secondary: "#FFFFFF",
    type: "default",
  },
  {
    id: "white-black",
    name: "White & Black",
    description: "Light monochrome",
    primary: "#FFFFFF",
    secondary: "#000000",
    type: "default",
  },
];

export type EditorThemeTokens = {
  /** Page background, and the background of full-bleed bands. */
  surface: string;
  /** Cards, panels and anything raised off the surface. */
  surfaceRaised: string;
  /** Navbar background. Usually the darkest value in the theme. */
  header: string;
  /** Footer background. */
  footer: string;
  /** Buttons, links, active states — the colour the brand is recognised by. */
  accent: string;
  /** Accent text on a dark surface: the same hue, lightened to stay legible. */
  accentSoft: string;
  /** Text on the accent colour. */
  onAccent: string;
  /** Body text. */
  text: string;
  /** Secondary text, captions, metadata. */
  textMuted: string;
  /** Hairlines and dividers. */
  border: string;
  /** Primary brand colour (maps to main accent/buttons). */
  primary?: string;
  /** Secondary brand colour (maps to secondary elements/highlights). */
  secondary?: string;
  /** Text on secondary colour. */
  onSecondary?: string;
  /** Accent border color (ensures light/white accents stay visible on light backgrounds). */
  accentBorder?: string;
  /** Secondary border color (ensures light/white secondary elements stay visible). */
  secondaryBorder?: string;
};

export type EditorTheme = {
  id: EditorThemeId;
  name: string;
  description: string;
  /** The two colours the picker shows as a swatch. */
  swatch: { base: string; accent: string };
  tokens: EditorThemeTokens;
};

/**
 * Default dual-preset themes:
 * 1. Black & White (Classic monochrome: Primary #000000, Secondary #FFFFFF)
 * 2. White & Black (Light monochrome: Primary #FFFFFF, Secondary #000000)
 */
export const DEFAULT_DUAL_THEMES: readonly EditorTheme[] = [
  {
    id: "black-and-white",
    name: "Black & White",
    description: "Classic monochrome",
    swatch: { base: "#ffffff", accent: "#000000" },
    tokens: {
      surface: "#000000",
      surfaceRaised: "#141416",
      header: "#000000",
      footer: "#000000",
      accent: "#000000",
      accentSoft: "rgba(0, 0, 0, 0.16)",
      onAccent: "#ffffff",
      text: "#ffffff",
      textMuted: "#a1a1aa",
      border: "rgba(255, 255, 255, 0.16)",
    },
  },
  {
    id: "white-and-black",
    name: "White & Black",
    description: "Light monochrome",
    swatch: { base: "#000000", accent: "#ffffff" },
    tokens: {
      surface: "#ffffff",
      surfaceRaised: "#f4f4f5",
      header: "#ffffff",
      footer: "#f8fafc",
      accent: "#ffffff",
      accentSoft: "rgba(255, 255, 255, 0.16)",
      onAccent: "#000000",
      text: "#000000",
      textMuted: "#71717a",
      border: "rgba(0, 0, 0, 0.12)",
    },
  },
] as const;

/**
 * All themes supported by the engine.
 * The default two (Black & White, White & Black) lead the list,
 * followed by the 4 platform themes for full backwards compatibility.
 */
export const EDITOR_THEMES: readonly EditorTheme[] = [
  ...DEFAULT_DUAL_THEMES,
  {
    id: "academic-blue",
    name: "Academic Navy",
    description: "Deep navy with a clear institutional blue. The platform default.",
    swatch: { base: "#0f172a", accent: "#2563eb" },
    tokens: {
      surface: "#0f172a",
      surfaceRaised: "#1e293b",
      header: "#0d1527",
      footer: "#090d16",
      accent: "#2563eb",
      accentSoft: "#60a5fa",
      onAccent: "#ffffff",
      text: "#f8fafc",
      textMuted: "#94a3b8",
      border: "rgba(148, 163, 184, 0.22)",
    },
  },
  {
    id: "emerald-gold",
    name: "Emerald & Gold",
    description: "Forest green with a warm gold accent. Reads as established and formal.",
    swatch: { base: "#064e3b", accent: "#f59e0b" },
    tokens: {
      surface: "#022c22",
      surfaceRaised: "#064e3b",
      header: "#01201a",
      footer: "#01201a",
      accent: "#f59e0b",
      accentSoft: "#fbbf24",
      onAccent: "#1c1917",
      text: "#f0fdf4",
      textMuted: "#a7c4b5",
      border: "rgba(167, 196, 181, 0.22)",
    },
  },
  {
    id: "crimson-slate",
    name: "Crimson Maroon",
    description: "Maroon and rose. The traditional heritage-institution palette.",
    swatch: { base: "#881337", accent: "#e11d48" },
    tokens: {
      surface: "#4c0519",
      surfaceRaised: "#881337",
      header: "#3b0413",
      footer: "#3b0413",
      accent: "#e11d48",
      accentSoft: "#fb7185",
      onAccent: "#ffffff",
      text: "#fff1f2",
      textMuted: "#e5a3b3",
      border: "rgba(229, 163, 179, 0.24)",
    },
  },
  {
    id: "midnight-purple",
    name: "Midnight Obsidian",
    description: "Near-black with a violet accent. The most modern of the four.",
    swatch: { base: "#180828", accent: "#a855f7" },
    tokens: {
      surface: "#0d0418",
      surfaceRaised: "#180828",
      header: "#080211",
      footer: "#080211",
      accent: "#a855f7",
      accentSoft: "#c084fc",
      onAccent: "#ffffff",
      text: "#faf5ff",
      textMuted: "#b8a4cc",
      border: "rgba(184, 164, 204, 0.24)",
    },
  },
] as const;

export const EDITOR_THEME_IDS = [...EDITOR_THEMES.map((t) => t.id), "custom"] as const;
export const DEFAULT_THEME_ID: EditorThemeId = "academic-blue";

export type EditorFont = {
  id: EditorFontId;
  name: string;
  description: string;
  /** The full stack, including fallbacks a browser will actually have. */
  stack: string;
  /** The Google Fonts families to load, or none for a system stack. */
  families: readonly string[];
  /**
   * The weight range this family actually ships, in Google Fonts' syntax.
   *
   * Per family rather than one list for all three, for two reasons and both of
   * them bit. Asking for weights a family does not have is not harmless:
   * `Playfair+Display:wght@100..900` is answered with **HTTP 400**, and since
   * every family is requested in one URL, that one bad range would take down
   * the stylesheet for all of them. And a range that is narrower than what the
   * family ships is the thin-font bug — see `themeFontsHref`.
   */
  weights: string;
};

export const EDITOR_FONTS: readonly EditorFont[] = [
  {
    id: "inter",
    name: "Inter",
    description: "Clean modern sans-serif. High readability at small sizes.",
    stack: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
    families: ["Inter"],
    weights: "100..900",
  },
  {
    id: "outfit",
    name: "Outfit",
    description: "Geometric sans with a technical feel.",
    stack: "'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif",
    families: ["Outfit"],
    weights: "100..900",
  },
  {
    id: "serif",
    name: "Playfair Display",
    description: "Classic academic serif. Formal, high contrast.",
    stack: "'Playfair Display', Georgia, 'Times New Roman', serif",
    families: ["Playfair Display"],
    weights: "400..900",
  },
] as const;

export const EDITOR_FONT_IDS = EDITOR_FONTS.map((f) => f.id);
export const DEFAULT_FONT_ID: EditorFontId = "inter";

export function normalizeHex(hex: string): string {
  if (!hex || typeof hex !== "string") return "#000000";
  let clean = hex.trim();
  if (!clean.startsWith("#")) {
    clean = "#" + clean;
  }
  if (/^#[0-9a-fA-F]{3}$/.test(clean)) {
    clean = `#${clean[1]}${clean[1]}${clean[2]}${clean[2]}${clean[3]}${clean[3]}`;
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(clean)) {
    return "#000000";
  }
  return clean.toUpperCase();
}

export function isValidHex(hex: string): boolean {
  if (!hex || typeof hex !== "string") return false;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex.trim());
}

/**
 * Derives the active default palette ID if current primary and secondary colors
 * match a default palette, or returns 'custom'.
 */
export function getMatchingPaletteId(
  primaryColor: string,
  secondaryColor: string,
): EditorThemeId {
  const normPrimary = normalizeHex(primaryColor);
  const normSecondary = normalizeHex(secondaryColor);

  if (normPrimary === "#000000" && normSecondary === "#FFFFFF") {
    return "black-white";
  }
  if (normPrimary === "#FFFFFF" && normSecondary === "#000000") {
    return "white-black";
  }
  return "custom";
}

export function normalizeThemeId(id: string | null | undefined): EditorThemeId {
  if (!id) return DEFAULT_THEME_ID;
  if (id === "black-white") return "black-and-white";
  if (id === "white-black") return "white-and-black";
  return id as EditorThemeId;
}

export function themeById(id: string | null | undefined): EditorTheme {
  const norm = normalizeThemeId(id);
  return (
    EDITOR_THEMES.find((t) => t.id === norm || t.id === id) ??
    EDITOR_THEMES.find((t) => t.id === DEFAULT_THEME_ID) ??
    EDITOR_THEMES[0]!
  );
}

export function fontById(id: string | null | undefined): EditorFont {
  return EDITOR_FONTS.find((f) => f.id === id) ?? EDITOR_FONTS[0]!;
}

/* ── Tokenising a section's colours ─────────────────────────────────────── */

/**
 * The colours the section library is authored in, and the token each maps to.
 *
 * These are the values that actually appear in the platform's own default
 * sections and in the Admin Studio's templates — read out of them rather than
 * guessed. A colour not on this list is left exactly as the author wrote it,
 * which is the point: a photograph's overlay tint or a chart's series colour is
 * not a brand colour and must not move when the theme does.
 */
const COLOUR_TOKENS: ReadonlyArray<readonly [string, keyof EditorTheme["tokens"]]> = [
  // Institutional blues — the default theme's accent.
  ["#2563eb", "accent"],
  ["#3b82f6", "accent"],
  ["#1d4ed8", "accent"],
  ["#38bdf8", "accentSoft"],
  ["#60a5fa", "accentSoft"],
  ["#7dd3fc", "accentSoft"],
  // The other three themes' accents, so a section authored under one theme
  // still moves when a tenant selects another.
  ["#f59e0b", "accent"],
  ["#eab308", "accent"],
  ["#fbbf24", "accentSoft"],
  ["#fde047", "accentSoft"],
  ["#e11d48", "accent"],
  ["#f43f5e", "accent"],
  ["#fb7185", "accentSoft"],
  ["#a855f7", "accent"],
  ["#9333ea", "accent"],
  ["#c084fc", "accentSoft"],
  // Surfaces from the default sections.
  ["#0f172a", "surface"],
  ["#0b1329", "surface"],
  ["#1e293b", "surfaceRaised"],
  ["#334155", "surfaceRaised"],
  ["#0d1527", "header"],
  ["#090d16", "footer"],
  ["#09090b", "surface"],
  // Text.
  ["#ffffff", "text"],
  ["#f8fafc", "text"],
  ["#cbd5e1", "textMuted"],
  ["#94a3b8", "textMuted"],
  ["#64748b", "textMuted"],
];

const TOKEN_FOR_HEX: ReadonlyMap<string, string> = new Map(
  COLOUR_TOKENS.map(([hex, token]) => [hex, token]),
);

/** `#abc` -> `#aabbcc`, so short and long forms hit the same map entry. */
function expandHex(hex: string): string {
  const body = hex.slice(1);
  if (body.length !== 3) return hex.toLowerCase();
  return `#${body[0]}${body[0]}${body[1]}${body[1]}${body[2]}${body[2]}`.toLowerCase();
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("")}`;
}

/**
 * One `var(--xite-…, fallback)` this pass has already produced.
 *
 * Matched so it can be skipped. Without it the pass is not idempotent: a
 * second run sees the `#2563eb` sitting in the fallback and wraps the whole
 * thing again, producing `var(--xite-accent, var(--xite-accent, #2563eb))`,
 * and a third nests it deeper. That is not hypothetical — inline text editing
 * reads a section's markup back out of the live DOM, which is the tokenised
 * copy, so every edit would have added a layer.
 *
 * The inner alternation allows one level of nested parentheses so an
 * `rgba(…)` fallback is consumed as part of the same match.
 */
const EXISTING_TOKEN = /var\(--xite-[a-z-]+\s*,\s*(?:[^()]|\([^()]*\))*\)/i;
const HEX = /#(?:[0-9a-f]{3}|[0-9a-f]{6})\b/i;
const RGB = /rgba?\(\s*\d+\s*[, ]\s*\d+\s*[, ]\s*\d+\s*(?:[,/]\s*[\d.]+\s*)?\)/i;

/** One scanner: an existing token is passed through, a colour is replaced. */
const COLOUR_SCAN = new RegExp(
  `${EXISTING_TOKEN.source}|${HEX.source}|${RGB.source}`,
  "gi",
);

const RGB_PARTS = /rgba?\(\s*(\d+)\s*[, ]\s*(\d+)\s*[, ]\s*(\d+)\s*(?:[,/]\s*([\d.]+)\s*)?\)/i;

/**
 * One CSS string with its brand colours turned into theme variables.
 *
 * Every replacement keeps the original value as the `var()` fallback, so this
 * is lossless: with no theme applied the section renders byte-identically to
 * how it was authored, and a token that is somehow undefined falls back rather
 * than rendering as nothing.
 *
 * `rgba()` keeps its alpha by going through `color-mix`, so a 40%-opacity
 * overlay stays a 40%-opacity overlay rather than becoming a solid block.
 *
 * ── The alpha was applied twice ───────────────────────────────────────────
 *
 * The `color-mix` wrapper used to carry the *original* `rgba()` as the
 * variable's fallback:
 *
 *     rgba(255,255,255,0.4)
 *       -> color-mix(in srgb, var(--xite-text, rgba(255,255,255,0.4)) 40%, transparent)
 *
 * With no theme set the variable is undefined, the fallback is used, and the
 * fallback already carries the 0.4 — which the mix then applies again. Every
 * translucent value in the library came out at **alpha squared**: a hairline at
 * `rgba(255,255,255,0.4)` rendered at 0.16, a card border at `0.14` rendered at
 * 0.0198 and was invisible. In the Admin's iframe, which has no theme layer and
 * no tokeniser, the same declaration rendered as written. It is the whole
 * explanation for "the borders disappear in the editor".
 *
 * The fallback is the opaque colour now, so the mix is the only place the alpha
 * is applied. `detokenizeCss` rebuilds the original `rgba()` from the two
 * halves, and the pass only runs when that rebuild is exact — an alpha of
 * `0.125` would come back as `0.13`, so it is left alone rather than rounded.
 *
 * Idempotent: running it twice produces the same string as running it once.
 */
export function tokenizeCss(css: string): string {
  if (!css) return css;

  return css.replace(COLOUR_SCAN, (match) => {
    // Already tokenised — by an earlier pass, or by a section author who wrote
    // the variable themselves. Either way it is finished.
    if (match.slice(0, 4).toLowerCase() === "var(") return match;

    if (match[0] === "#") {
      const token = TOKEN_FOR_HEX.get(expandHex(match));
      return token ? `var(--xite-${kebab(token)}, ${match})` : match;
    }

    const parts = match.match(RGB_PARTS);
    if (!parts) return match;

    const token = TOKEN_FOR_HEX.get(rgbToHex(Number(parts[1]), Number(parts[2]), Number(parts[3])));
    if (!token) return match;

    const alpha = parts[4];
    if (alpha === undefined || Number(alpha) >= 1) {
      return `var(--xite-${kebab(token)}, ${match})`;
    }

    // Only when the round trip is exact. `detokenizeCss` reads the alpha back
    // out of the percentage, and a percentage is a whole number — so `0.4`
    // survives and `0.125` would come back as `0.13`, which is a section
    // quietly redrawn by an edit that touched a word of copy.
    const percent = Number(alpha) * 100;
    if (!Number.isInteger(percent) || percent <= 0) return match;

    // `color-mix` with transparent is how an opacity is applied to a colour
    // that is not known until the theme is. The fallback is the *opaque*
    // colour: the mix is what applies the alpha, and a fallback that carried it
    // too would apply it twice.
    const opaque = `rgb(${Number(parts[1])}, ${Number(parts[2])}, ${Number(parts[3])})`;
    return `color-mix(in srgb, var(--xite-${kebab(token)}, ${opaque}) ${percent}%, transparent)`;
  });
}

/**
 * The inverse: `var(--xite-accent, #2563eb)` back to `#2563eb`.
 *
 * The editor saves a section by reading its markup back out of the live DOM —
 * that is how inline text editing captures an edit — and what is in the DOM is
 * the tokenised copy. Without this pass, editing one word in a section would
 * write theme variables into the stored markup, and a section carrying
 * `var(--xite-…)` renders in the *viewer's* theme wherever it is later pasted
 * rather than in the colours its author chose.
 *
 * So tokens exist between the store and the screen, and nowhere else. What is
 * saved is what was authored.
 */
export function detokenizeCss(css: string): string {
  if (!css || !css.includes("--xite-")) return css;

  let previous: string;
  let out = css;

  // Looped because a `color-mix` unwraps in two steps, and a single pass would
  // leave the wrapper behind.
  do {
    previous = out;
    /**
     * The translucent form, rebuilt whole.
     *
     * `tokenizeCss` splits an `rgba()` into an opaque colour and a percentage,
     * so both halves are needed to put it back. Stripping the wrapper and
     * keeping the fallback — which is what this used to do — returned the
     * *opaque* colour, so a `rgba(255,255,255,0.14)` hairline was saved back as
     * solid white the first time anyone corrected a typo in that section.
     */
    out = out.replace(
      /color-mix\(in srgb,\s*var\(--xite-[a-z-]+\s*,\s*rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)\s*\)\s*(\d+)%\s*,\s*transparent\)/gi,
      (_full, r: string, g: string, b: string, percent: string) =>
        `rgba(${r}, ${g}, ${b}, ${Number(percent) / 100})`,
    );
    // Anything else wrapped in a mix — a hand-written one, or a form an older
    // build produced — keeps its fallback rather than being dropped.
    out = out.replace(
      /color-mix\(in srgb,\s*(var\(--xite-[a-z-]+\s*,\s*(?:[^()]|\([^()]*\))*\))\s*\d+%\s*,\s*transparent\)/gi,
      "$1",
    );
    out = out.replace(
      /var\(--xite-[a-z-]+\s*,\s*((?:[^()]|\([^()]*\))*)\)/gi,
      (_full, fallback: string) => fallback.trim(),
    );
  } while (out !== previous);

  return out;
}

function kebab(token: string): string {
  return token.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

/**
 * A section's markup, with its colours tokenised.
 *
 * Both channels: `<style>` blocks and `style="…"` attributes. Only those — the
 * pass never touches text content, so a section that mentions "#2563eb" in a
 * code sample keeps saying it.
 */
export function tokenizeSectionHtml(html: string): string {
  return mapSectionCss(html, tokenizeCss);
}

/**
 * A section's markup with every theme variable resolved back to its original
 * colour. The exact inverse of `tokenizeSectionHtml`.
 *
 * Applied on the way *out* of the canvas, so what reaches the database is the
 * markup as authored rather than as rendered.
 */
export function detokenizeSectionHtml(html: string): string {
  return mapSectionCss(html, detokenizeCss);
}

/** Applies `transform` to a section's `<style>` blocks and `style` attributes. */
function mapSectionCss(html: string, transform: (css: string) => string): string {
  if (!html) return html;

  const withStyleBlocks = html.replace(
    /(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi,
    (_full, open: string, css: string, close: string) => `${open}${transform(css)}${close}`,
  );

  return withStyleBlocks.replace(
    /\sstyle\s*=\s*(["'])([\s\S]*?)\1/gi,
    (_full, quote: string, css: string) => ` style=${quote}${transform(css)}${quote}`,
  );
}

/* ── The stylesheet ─────────────────────────────────────────────────────── */

/**
 * All four themes and all three font packs, as one static stylesheet.
 *
 * Static on purpose. Every theme's tokens are present at all times and the
 * `data-xite-theme` attribute selects between them, so switching costs one
 * attribute write — no stylesheet regeneration, no reflow of the section
 * markup, and nothing to re-fetch. That is what "instantly, across all
 * sections, without a page reload" means mechanically.
 *
 * The default theme's tokens are also emitted on the bare scope, so a canvas
 * that has not had the attribute set yet still resolves every `var()` rather
 * than silently falling back to two dozen unrelated original colours.
 */
export function themeStylesheet(scope: string): string {
  const blocks: string[] = [];

  const declarations = (theme: EditorTheme) => {
    const lines = Object.entries(theme.tokens).map(([name, value]) => `  --xite-${kebab(name)}: ${value};`);
    const light1 = theme.tokens.surface;
    const light2 = theme.tokens.surfaceRaised;
    const accent = theme.tokens.accent;
    const dark1 = theme.tokens.textMuted || theme.tokens.secondary || theme.tokens.border;
    const dark2 = theme.tokens.text;
    lines.push(`  --theme-light-1: ${light1};`);
    lines.push(`  --theme-light-2: ${light2};`);
    lines.push(`  --theme-accent: ${accent};`);
    lines.push(`  --theme-dark-1: ${dark1};`);
    lines.push(`  --theme-dark-2: ${dark2};`);
    return lines.join("\n");
  };

  /**
   * No unconditional default block. This is the fix, and it was the bug.
   *
   * This function used to open with the default theme's tokens on the bare
   * scope - `.xite-site-canvas { --xite-header: #0d1527; ... }` - so every
   * token was defined on every canvas whether or not a tenant had ever chosen
   * a theme.
   *
   * That is what made a section look one way in the Admin and another way
   * everywhere else, for every section, permanently. A tokenised colour is
   * `var(--xite-header, <authored>)`: the author's value survives as the
   * fallback and is used wherever the variable is undefined. The Admin
   * previews in an iframe carrying no theme layer at all, so the fallback won
   * and the section rendered as authored. The editor and the published site
   * both inject this stylesheet, so the variable was always defined and the
   * default palette always won - a green header came out navy, a maroon one
   * came out navy, and no setting a tenant could see was responsible.
   *
   * Dropping the `data-xite-theme` attribute was not enough on its own,
   * because this block was never gated on that attribute in the first place.
   *
   * Tokens come only from the four blocks below, each of which requires
   * `[data-xite-theme="..."]`. No theme chosen, no tokens, and every
   * `var(--xite-..., <authored>)` resolves to what the author wrote - which is
   * what the Admin shows, and what the comment in `SectionRuntimeAssets` has
   * always claimed already happened.
   */
  for (const theme of EDITOR_THEMES) {
    blocks.push(`${scope}[data-xite-theme="${theme.id}"] {\n${declarations(theme)}\n}`);
    if (theme.id === "black-white" || theme.id === "black-and-white") {
      blocks.push(`${scope}[data-xite-theme="black-white"] {\n${declarations(theme)}\n}`);
      blocks.push(`${scope}[data-xite-theme="black-and-white"] {\n${declarations(theme)}\n}`);
    } else if (theme.id === "white-black" || theme.id === "white-and-black") {
      blocks.push(`${scope}[data-xite-theme="white-black"] {\n${declarations(theme)}\n}`);
      blocks.push(`${scope}[data-xite-theme="white-and-black"] {\n${declarations(theme)}\n}`);
    }
  }

  for (const font of EDITOR_FONTS) {
    blocks.push(`${scope}[data-xite-font="${font.id}"] {\n  --xite-font: ${font.stack};\n}`);
  }

  // The font token has to reach elements whose own `font-family` was written by
  // the section author, so this one rule is `!important` — it is the only place
  // in the theme layer that overrides rather than supplies, and it applies only
  // when a font pack has been explicitly chosen.
  blocks.push(
    `${scope}[data-xite-font] :where(*):not(i):not(svg):not([class*="icon"]) { font-family: var(--xite-font) !important; }`,
  );

  return blocks.join("\n\n");
}

/**
 * Converts a 5-token Squarespace ColorTokenMap to the full EditorThemeTokens schema.
 */
export function colorTokenMapToThemeTokens(tokens: ColorTokenMap): EditorThemeTokens {
  const primContrast = calculateOppositeContrast(tokens.accent);
  const secContrast = calculateOppositeContrast(tokens.dark1);
  return {
    surface: tokens.light1,
    surfaceRaised: tokens.light2,
    header: tokens.dark2,
    footer: tokens.dark2,
    accent: tokens.accent,
    accentSoft: primContrast.softBackground,
    onAccent: primContrast.textColor,
    accentBorder: primContrast.borderColor,
    text: tokens.dark2,
    textMuted: tokens.dark1,
    border: "rgba(0, 0, 0, 0.12)",
    primary: tokens.accent,
    secondary: tokens.dark1,
    onSecondary: secContrast.textColor,
    secondaryBorder: secContrast.borderColor,
  };
}

/**
 * Converts partial or full EditorThemeTokens to a 5-token ColorTokenMap.
 */
export function themeTokensToColorTokenMap(tokens: Partial<EditorThemeTokens>): ColorTokenMap {
  return {
    light1: tokens.surface || "#FFFFFF",
    light2: tokens.surfaceRaised || "#F4F4F5",
    accent: tokens.accent || tokens.primary || "#2563EB",
    dark1: tokens.textMuted || tokens.secondary || "#27272A",
    dark2: tokens.text || "#09090B",
  };
}

/**
 * Generates an accessible 5-token ColorTokenMap from a single brand seed color.
 * Algorithm computes:
 * - light1: tint-mixed 98% lightness
 * - light2: 92% tint of the seed color
 * - dark1: 35% shade of the seed color
 * - dark2: 10% ultra-dark tone for high contrast headings
 */
export function generateTokensFromSeed(seedHex: string): ColorTokenMap {
  const norm = normalizeHex(seedHex);
  const { r, g, b } = hexToRgb(norm);
  const hsl = rgbToHsl(r, g, b);

  return {
    accent: norm,
    light1: hslToHex(hsl.h, Math.min(hsl.s, 15), 98),
    light2: hslToHex(hsl.h, Math.min(hsl.s, 25), 92),
    dark1: hslToHex(hsl.h, Math.min(hsl.s, 30), 35),
    dark2: hslToHex(hsl.h, Math.min(hsl.s, 40), 10),
  };
}

/**
 * Derives the 5 section themes (lightest, light, bright, dark, darkest)
 * from a 5-token ColorTokenMap.
 */
export function deriveSectionThemes(
  tokens: ColorTokenMap,
  autoGenerateWcag = true
): SectionThemeDerived {
  const accentContrast = calculateOppositeContrast(tokens.accent);
  const brightText = autoGenerateWcag ? accentContrast.textColor : tokens.light1;
  const brightAccent = accentContrast.isLight ? tokens.dark2 : tokens.light1;

  return {
    lightest: {
      bg: tokens.light1,
      text: tokens.dark2,
      accent: tokens.accent,
    },
    light: {
      bg: tokens.light2,
      text: tokens.dark2,
      accent: tokens.accent,
    },
    bright: {
      bg: tokens.accent,
      text: brightText,
      accent: brightAccent,
    },
    dark: {
      bg: tokens.dark1,
      text: tokens.light1,
      accent: tokens.accent,
    },
    darkest: {
      bg: tokens.dark2,
      text: tokens.light1,
      accent: tokens.accent,
    },
  };
}

/**
 * Dynamically applies CSS custom properties directly to the root / canvas element.
 * Injects both Squarespace --theme-* and backward-compatible --xite-* variables.
 */
export function applyThemeTokens(
  tokens: ColorTokenMap,
  targetElement?: HTMLElement | null
): void {
  const target = targetElement ?? (typeof document !== "undefined" ? document.documentElement : null);
  if (!target) return;

  target.style.setProperty("--theme-light-1", tokens.light1);
  target.style.setProperty("--theme-light-2", tokens.light2);
  target.style.setProperty("--theme-accent", tokens.accent);
  target.style.setProperty("--theme-dark-1", tokens.dark1);
  target.style.setProperty("--theme-dark-2", tokens.dark2);

  // Backward compatibility with --xite-* variables
  target.style.setProperty("--xite-accent", tokens.accent);
  target.style.setProperty("--xite-primary", tokens.accent);
  target.style.setProperty("--xite-secondary", tokens.dark1);
  target.style.setProperty("--xite-surface", tokens.light1);
  target.style.setProperty("--xite-surface-raised", tokens.light2);
  target.style.setProperty("--xite-text", tokens.dark2);
  target.style.setProperty("--xite-text-muted", tokens.dark1);
  target.style.setProperty("--xite-bg", tokens.light1);
}

/**
 * The Google Fonts URL for every family the three packs need, loaded once.
 *
 * ── The thin-font bug ─────────────────────────────────────────────────────
 *
 * This asked for `wght@400;500;600;700;800;900` — for every family, from one
 * hard-coded list. So 100, 200 and 300 were never downloaded, and any section
 * authored with `font-weight: 300` had no font file to render in. The browser
 * does not report that. It either synthesises a light face by thinning the
 * outlines of the regular one, which looks wrong in a way that is hard to
 * name, or it simply uses the regular weight, so text the author made light
 * came out at normal weight and the setting appeared to do nothing.
 *
 * The ranges come from each font's own entry now, because the two failure
 * modes pull in opposite directions: too narrow and light weights silently
 * vanish, too wide and Google Fonts answers **HTTP 400** — Playfair Display
 * has nothing below 400 — which, since all three families share one URL,
 * would leave every page on the platform with no webfont at all.
 *
 * These are variable fonts, so the wider range costs no extra requests and
 * very little extra weight: it widens the axis inside the same file.
 */
export function themeFontsHref(): string {
  const seen = new Set<string>();
  const parts: string[] = [];

  for (const font of EDITOR_FONTS) {
    for (const family of font.families) {
      if (seen.has(family)) continue;
      seen.add(family);
      parts.push(`family=${family.replace(/\s+/g, "+")}:wght@${font.weights}`);
    }
  }

  return `https://fonts.googleapis.com/css2?${parts.join("&")}&display=swap`;
}

/**
 * The two brand colours a preset starts the tenant off with.
 *
 * "Black & White" starts with Primary = #000000, Secondary = #ffffff.
 * "White & Black" starts with Primary = #ffffff, Secondary = #000000.
 */
export function presetBrandTokens(theme: EditorTheme): EditorThemeTokens {
  const isWb = theme.id === "white-and-black" || (theme.id as string) === "white-black";
  const isBw = theme.id === "black-and-white" || (theme.id as string) === "black-white";
  const primary = theme.tokens.primary ?? (isWb ? "#ffffff" : isBw ? "#000000" : theme.swatch.accent);
  const secondary = theme.tokens.secondary ?? (isWb ? "#000000" : isBw ? "#ffffff" : theme.swatch.base);
  const primContrast = calculateOppositeContrast(primary);
  const secContrast = calculateOppositeContrast(secondary);
  return {
    ...theme.tokens,
    primary,
    accent: primary,
    accentSoft: primContrast.softBackground,
    onAccent: primContrast.textColor,
    accentBorder: primContrast.borderColor,
    secondary,
    onSecondary: secContrast.textColor,
    secondaryBorder: secContrast.borderColor,
  };
}

/**
 * Emits CSS rules for a custom theme's tokens.
 * Specifically scopes customization to brand action elements (buttons, badges, highlights)
 * while preserving natural section surfaces, dark heroes, and card layouts as authored.
 *
 * The block matches any chosen theme, not only `custom`, and at one notch
 * higher specificity than the preset blocks in `themeStylesheet`. That is how
 * a tenant keeps the White & Black template — surfaces, text, header — while
 * replacing just the primary or secondary colour: the preset supplies
 * everything, and this block overrides the brand colours on top of it.
 */
export function customThemeCss(scope: string, tokens: EditorThemeTokens | ColorTokenMap): string {
  const isColorMap = "light1" in tokens;
  const tokenMap: ColorTokenMap = isColorMap
    ? (tokens as ColorTokenMap)
    : themeTokensToColorTokenMap(tokens as EditorThemeTokens);
  const themeTokens: EditorThemeTokens = isColorMap
    ? colorTokenMapToThemeTokens(tokens as ColorTokenMap)
    : (tokens as EditorThemeTokens);

  const primary = themeTokens.primary || themeTokens.accent || tokenMap.accent || "#000000";
  // Fall back cleanly to the token's secondary or surface or pure white
  const secondary = themeTokens.secondary || themeTokens.surface || tokenMap.dark1 || "#ffffff";

  /**
   * Text and borders are always computed from the colour they sit on, never
   * read from the tokens. A white button therefore always gets black text and
   * a visible edge even if a stale `onAccent: #ffffff` came along with it —
   * see `calculateOppositeContrast` for the rule.
   */
  const primContrast = calculateOppositeContrast(primary);
  const secContrast = calculateOppositeContrast(secondary);

  const onPrimary = primContrast.textColor;
  const onSecondary = secContrast.textColor;
  const primaryBorder = primContrast.borderColor;
  const secondaryBorder = secContrast.borderColor;
  const accentSoft = primContrast.softBackground;

  const declarations = [
    `  --theme-light-1: ${tokenMap.light1};`,
    `  --theme-light-2: ${tokenMap.light2};`,
    `  --theme-accent: ${tokenMap.accent};`,
    `  --theme-dark-1: ${tokenMap.dark1};`,
    `  --theme-dark-2: ${tokenMap.dark2};`,
    `  --xite-accent: ${primary};`,
    `  --xite-primary: ${primary};`,
    `  --xite-on-accent: ${onPrimary};`,
    `  --xite-accent-soft: ${accentSoft};`,
    `  --xite-accent-border: ${primaryBorder};`,
    `  --xite-secondary: ${secondary};`,
    `  --xite-on-secondary: ${onSecondary};`,
    `  --xite-secondary-border: ${secondaryBorder};`,
    `  --xite-surface: ${tokenMap.light1};`,
    `  --xite-surface-raised: ${tokenMap.light2};`,
    `  --xite-text: ${tokenMap.dark2};`,
    `  --xite-text-muted: ${tokenMap.dark1};`,
    `  --xite-bg: ${tokenMap.light1};`,
  ].join("\n");

  return `${scope}[data-xite-theme][data-xite-theme] {\n${declarations}\n}`;
}

/* ── Color Palette Algorithms & Harmonies ────────────────────────────────── */

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  if (!hex || typeof hex !== "string") return { r: 0, g: 0, b: 0 };
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
    return { r: 0, g: 0, b: 0 };
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 0, g: 0, b: 0 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  const toHex = (n: number) => {
    const val = Math.max(0, Math.min(255, Math.round((n + m) * 255)));
    return val.toString(16).padStart(2, "0");
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  // Applied per channel rather than destructured out of a mapped array: this
  // module is mirrored into xite-admin, which compiles with
  // noUncheckedIndexedAccess, and an array index is `T | undefined` there.
  const linear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

export interface ContrastColorResult {
  /** High-contrast opposite text color: pure black (#000000) or pure white (#ffffff) */
  textColor: string;
  /** Whether the background is considered light */
  isLight: boolean;
  /** Visible border for buttons so white/light buttons never vanish on white surfaces */
  borderColor: string;
  /** Translucent soft tint for badges/pills */
  softBackground: string;
  /** Hover color */
  hoverColor: string;
}

/**
 * Opposite-contrast text: for any colour a tenant picks, the text on it is
 * whichever of pure black or pure white reads better against it.
 *
 * "Better" is the WCAG contrast ratio, (L1 + 0.05) / (L2 + 0.05). Against a
 * background of luminance L, white text scores 1.05 / (L + 0.05) and black
 * text scores (L + 0.05) / 0.05; black wins once L exceeds ≈0.179. So a white
 * button gets black text (21:1), a black one white text, and a mid colour like
 * amber gets black rather than a white that would only reach ~2.4:1.
 *
 * Also returns a border so a light button never blends into a light surface,
 * and a hover shade one step towards the text colour.
 */
export function calculateOppositeContrast(hex: string): ContrastColorResult {
  const luminance = getRelativeLuminance(hex);
  const { r, g, b } = hexToRgb(hex);
  const hsl = rgbToHsl(r, g, b);

  const whiteTextRatio = 1.05 / (luminance + 0.05);
  const blackTextRatio = (luminance + 0.05) / 0.05;
  const isLight = blackTextRatio >= whiteTextRatio;
  const textColor = isLight ? "#000000" : "#ffffff";

  let borderColor: string;
  if (luminance > 0.75) {
    // Very light/white: needs a visible border to prevent blending with white canvas
    borderColor = "#cbd5e1";
  } else if (luminance < 0.08) {
    // Very dark/black: subtle border
    borderColor = "rgba(255, 255, 255, 0.22)";
  } else {
    borderColor = hex;
  }

  const softBackground = isLight
    ? `rgba(${r}, ${g}, ${b}, 0.16)`
    : `rgba(${r}, ${g}, ${b}, 0.25)`;

  const hoverColor = isLight
    ? hslToHex(hsl.h, hsl.s, Math.max(0, hsl.l - 7))
    : hslToHex(hsl.h, hsl.s, Math.min(100, hsl.l + 8));

  return {
    textColor,
    isLight,
    borderColor,
    softBackground,
    hoverColor,
  };
}

export type HarmonyMode = "complementary" | "analogous" | "triadic" | "monochromatic" | "split";

/**
 * Generates an accessible, mathematically harmonic palette using color science algorithms.
 */
export function generateHarmonicPalette(
  seedHex: string,
  mode: HarmonyMode = "complementary",
  isDark: boolean = true
): EditorThemeTokens {
  const { r, g, b } = hexToRgb(seedHex);
  const hsl = rgbToHsl(r, g, b);

  let accentHue = hsl.h;
  let secondaryHue = hsl.h;

  switch (mode) {
    case "complementary":
      secondaryHue = (hsl.h + 180) % 360;
      break;
    case "analogous":
      secondaryHue = (hsl.h + 35) % 360;
      break;
    case "triadic":
      secondaryHue = (hsl.h + 120) % 360;
      break;
    case "monochromatic":
      secondaryHue = hsl.h;
      break;
    case "split":
      secondaryHue = (hsl.h + 150) % 360;
      break;
  }

  const accentHex = hslToHex(accentHue, Math.max(75, hsl.s), isDark ? 56 : 48);
  const accentSoftHex = hslToHex(accentHue, Math.max(70, hsl.s), isDark ? 74 : 32);
  const onAccentHex = getRelativeLuminance(accentHex) > 0.4 ? "#09090b" : "#ffffff";

  if (isDark) {
    // Dark mode palette
    const surfaceHex = hslToHex(secondaryHue, Math.min(25, hsl.s * 0.3), 6);
    const surfaceRaisedHex = hslToHex(secondaryHue, Math.min(30, hsl.s * 0.4), 11);
    const headerHex = hslToHex(secondaryHue, Math.min(20, hsl.s * 0.25), 4);
    const footerHex = hslToHex(secondaryHue, Math.min(20, hsl.s * 0.25), 4);
    const textHex = "#f8fafc";
    const textMutedHex = hslToHex(secondaryHue, 15, 68);

    return {
      surface: surfaceHex,
      surfaceRaised: surfaceRaisedHex,
      header: headerHex,
      footer: footerHex,
      accent: accentHex,
      accentSoft: accentSoftHex,
      onAccent: onAccentHex,
      text: textHex,
      textMuted: textMutedHex,
      border: "rgba(255, 255, 255, 0.14)",
    };
  } else {
    // Light mode palette
    const surfaceHex = "#ffffff";
    const surfaceRaisedHex = hslToHex(secondaryHue, 18, 96);
    const headerHex = "#ffffff";
    const footerHex = hslToHex(secondaryHue, 15, 97);
    const textHex = "#0f172a";
    const textMutedHex = hslToHex(secondaryHue, 18, 42);

    return {
      surface: surfaceHex,
      surfaceRaised: surfaceRaisedHex,
      header: headerHex,
      footer: footerHex,
      accent: accentHex,
      accentSoft: accentSoftHex,
      onAccent: onAccentHex,
      text: textHex,
      textMuted: textMutedHex,
      border: "rgba(0, 0, 0, 0.10)",
    };
  }
}

/**
 * Curated algorithmic trending palettes ready for one-click application.
 */
export const TRENDING_ALGORITHMIC_PALETTES: readonly {
  name: string;
  category: string;
  swatch: { base: string; accent: string };
  tokens: EditorThemeTokens;
}[] = [
  {
    name: "Cyberpunk Neon",
    category: "High Contrast",
    swatch: { base: "#090414", accent: "#a855f7" },
    tokens: {
      surface: "#090414",
      surfaceRaised: "#160b29",
      header: "#05020c",
      footer: "#05020c",
      accent: "#a855f7",
      accentSoft: "#c084fc",
      onAccent: "#ffffff",
      text: "#faf5ff",
      textMuted: "#b8a4cc",
      border: "rgba(168, 85, 247, 0.25)",
    },
  },
  {
    name: "Ocean Deep",
    category: "Complementary",
    swatch: { base: "#041424", accent: "#0284c7" },
    tokens: {
      surface: "#041424",
      surfaceRaised: "#0b2238",
      header: "#020c17",
      footer: "#020c17",
      accent: "#0284c7",
      accentSoft: "#38bdf8",
      onAccent: "#ffffff",
      text: "#f0f9ff",
      textMuted: "#94b8d6",
      border: "rgba(56, 189, 248, 0.22)",
    },
  },
  {
    name: "Sunset Amber",
    category: "Warm Analogous",
    swatch: { base: "#170c06", accent: "#f97316" },
    tokens: {
      surface: "#170c06",
      surfaceRaised: "#26150b",
      header: "#0e0603",
      footer: "#0e0603",
      accent: "#f97316",
      accentSoft: "#fb923c",
      onAccent: "#ffffff",
      text: "#fff7ed",
      textMuted: "#d4a78c",
      border: "rgba(249, 115, 22, 0.22)",
    },
  },
  {
    name: "Forest & Sage",
    category: "Natural Harmony",
    swatch: { base: "#051811", accent: "#10b981" },
    tokens: {
      surface: "#051811",
      surfaceRaised: "#0a291e",
      header: "#030f0a",
      footer: "#030f0a",
      accent: "#10b981",
      accentSoft: "#34d399",
      onAccent: "#051811",
      text: "#ecfdf5",
      textMuted: "#86b9a3",
      border: "rgba(16, 185, 129, 0.22)",
    },
  },
  {
    name: "Nordic Minimal",
    category: "Clean Light",
    swatch: { base: "#ffffff", accent: "#2563eb" },
    tokens: {
      surface: "#ffffff",
      surfaceRaised: "#f1f5f9",
      header: "#ffffff",
      footer: "#f8fafc",
      accent: "#2563eb",
      accentSoft: "#60a5fa",
      onAccent: "#ffffff",
      text: "#0f172a",
      textMuted: "#64748b",
      border: "rgba(15, 23, 42, 0.12)",
    },
  },
  {
    name: "Crimson Velvet",
    category: "Dramatic Monochrome",
    swatch: { base: "#18040a", accent: "#f43f5e" },
    tokens: {
      surface: "#18040a",
      surfaceRaised: "#290913",
      header: "#0d0205",
      footer: "#0d0205",
      accent: "#f43f5e",
      accentSoft: "#fb7185",
      onAccent: "#ffffff",
      text: "#fff1f2",
      textMuted: "#cca0aa",
      border: "rgba(244, 63, 94, 0.22)",
    },
  },
] as const;

/**
 * Generates a completely randomized yet harmonious and readable palette.
 */
export function generateRandomHarmonicPalette(): { name: string; tokens: EditorThemeTokens } {
  const randomHue = Math.floor(Math.random() * 360);
  const modes: HarmonyMode[] = ["complementary", "analogous", "triadic", "split"];
  const randomMode = modes[Math.floor(Math.random() * modes.length)]!;
  const isDark = Math.random() > 0.3;

  const names = [
    "Aurora Borealis",
    "Solar Flare",
    "Nebula Dream",
    "Midnight Echo",
    "Emerald Horizon",
    "Cosmic Velvet",
    "Electric Prism",
    "Zenith Dawn",
  ];
  const name = names[Math.floor(Math.random() * names.length)]!;
  const seed = hslToHex(randomHue, 85, 52);

  return {
    name,
    tokens: generateHarmonicPalette(seed, randomMode, isDark),
  };
}
