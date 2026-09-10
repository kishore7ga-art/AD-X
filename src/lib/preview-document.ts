import { API_BASE } from "@/env";
import { buildSectionPreviewDocument } from "@/lib/section-runtime";

/**
 * The preview iframe's document, with the API's origin supplied.
 *
 * An uploaded image is stored as `/uploads/<file>` — a path on the API. In
 * the iframe that resolves against the Admin's own origin, which has no
 * such route, so the preview showed a broken image for exactly the assets
 * a tenant had uploaded. `buildSectionPreviewDocument` is the mirrored,
 * environment-free runtime and cannot know the API's address; this is the
 * one place in the Admin that hands it over.
 */
export function previewDocument(code: string, options: { title?: string } = {}): string {
  return buildSectionPreviewDocument(code, { ...options, assetBase: API_BASE });
}
