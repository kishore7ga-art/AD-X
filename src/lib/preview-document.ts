import { API_BASE } from "@/env";
import { buildSectionPreviewDocument } from "@/lib/section-runtime";
import { DEFAULT_FONT_ID, DEFAULT_THEME_ID, themeStylesheet } from "@/lib/editor-themes";

/**
 * The preview iframe's document, with the API's origin and the theme supplied.
 *
 * ── The API origin ─────────────────────────────────────────────────────────
 *
 * An uploaded image is stored as `/uploads/<file>` — a path on the API. In
 * the iframe that resolves against the Admin's own origin, which has no
 * such route, so the preview showed a broken image for exactly the assets
 * a tenant had uploaded. `buildSectionPreviewDocument` is the mirrored,
 * environment-free runtime and cannot know the API's address; this is the
 * one place in the Admin that hands it over.
 *
 * ── The theme, and the bug it fixes ────────────────────────────────────────
 *
 * This preview carried no theme at all, and that was the whole of the reported
 * "the Editor invents a background" problem. A section configured with no
 * background measured, in Chromium:
 *
 *   editor canvas root  rgb(255, 255, 255)
 *   published site      rgb(255, 255, 255)   <- identical, as designed
 *   Admin preview       rgb(9, 9, 11)        <- the odd one out
 *
 * The section is transparent on all three; nothing forces a background onto it.
 * What differed was the canvas behind it. The runtime paints its root
 * `var(--xite-surface, #09090b)`, and with no `data-xite-theme` stamped on this
 * document the variable never resolved — so an administrator reviewed every
 * section against near-black however the site it was bound for actually looked.
 * The Editor was right and this was wrong, which is the reverse of how it reads
 * from the Admin's side.
 *
 * ── Which theme ────────────────────────────────────────────────────────────
 *
 * The platform default, because that is what a college actually receives when
 * it is created. A template is platform-wide and belongs to no tenant, so there
 * is no single "correct" theme to show it in; the honest choice is the one the
 * next college will see. A tenant who later picks a different theme diverges
 * from this preview by their own decision, which is the intended behaviour
 * rather than a mismatch.
 *
 * `themeStylesheet` is the same function the editor canvas and the published
 * site call, from the same mirrored module, so there is exactly one definition
 * of what a theme is across all four surfaces.
 */
export function previewDocument(
  code: string,
  options: { title?: string; themeId?: string | null; fontId?: string | null } = {},
): string {
  const themeId = options.themeId ?? DEFAULT_THEME_ID;
  const fontId = options.fontId ?? DEFAULT_FONT_ID;

  return buildSectionPreviewDocument(code, {
    title: options.title,
    assetBase: API_BASE,
    // Scoped to `html`, which is where the document stamps the attribute.
    themeCss: themeStylesheet("html"),
    themeId,
    fontId,
  });
}
