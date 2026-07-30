/**
 * The shapes this panel reads, mirroring `xite-B/src/library-service.ts`.
 *
 * Hand-copied, and that is a cost worth naming rather than hiding: these can drift
 * from the API's own types, and the symptom would be a column rendering
 * `undefined` rather than a build failure. The two repos already carry twelve
 * files as manual copies for the same reason — they deploy independently — and
 * adding a thirteenth for one page's payload was not worth it. If this panel grows
 * past a handful of screens, generating these from `/openapi.json` is the fix.
 */

export type TemplateStats = {
  templates: { total: number; published: number; draft: number; archived: number };
  library: { total: number; active: number; retired: number };
  byType: { sectionType: string; active: number }[];
  collegesOnTemplates: number;
};

export type LibraryVariant = {
  id: string;
  sectionType: string;
  variantName: string;
  componentKey: string;
  isActive: boolean;
  createdByEmail: string | null;
  /** Colleges using it. Non-zero means it can be retired but never removed. */
  inUse: number;
};

export type TemplateSlot = {
  slotId: string;
  sectionType: string;
  order: number;
  isRequired: boolean;
  leadVariantId: string | null;
  leadVariantName: string | null;
  leadComponentKey: string | null;
};

export type TemplateRow = {
  id: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  isPublished: boolean;
  /** ISO string, or null for a template still on offer. */
  archivedAt: string | null;
  createdAt: string;
  createdByEmail: string | null;
  slots: TemplateSlot[];
  colleges: number;
  collegeSections: number;
  /**
   * Whether a real row delete would be safe. Computed by the API because only it
   * can see that `college_sections` cascades from `sections` cascades from
   * `templates`.
   */
  deletable: boolean;
};
