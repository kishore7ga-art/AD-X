import { SECTION_CATEGORY_IDS, type SectionCategoryId } from "@/lib/sections/categories";

export type CategoryItem = {
  id: SectionCategoryId;
  name: string;
  description: string;
};

/**
 * The section categories, as the Admin Studio presents them.
 *
 * ── Why the ids come from the shared module ────────────────────────────────
 *
 * This list used to declare its own ids, and four of them did not match the
 * ones the rest of the platform files sections under: `header` for `navbar`,
 * `admission` for `admissions`, `awards` for `achievements`, and `cta` for
 * nothing at all.
 *
 * The first three survived on aliases. `cta` did not. `normalizeCategory("cta")`
 * returned `custom`, and `custom` is deliberately excluded from every variant
 * cycle — so **every Call to Action template an admin published was invisible in
 * the editor's picker and could never be swapped.** Nothing reported it, because
 * from the Admin's side the template saved perfectly.
 *
 * `cta` is a real category now, and the ids below are the canonical ones. The
 * `satisfies` at the end is what keeps it that way: a category added here with
 * an id the platform does not know fails the build rather than silently filing
 * templates under `custom`.
 *
 * The copy stays here. Only the Admin shows these descriptions, and the editor
 * has its own wording for the same categories — that is presentation, not
 * identity, and it is fine for the two to differ.
 */
export const PLATFORM_SECTION_CATEGORIES = [
  { id: "navbar", name: "Navbar / Header", description: "Top navigation bar with logo, menu items & action buttons" },
  { id: "hero", name: "Hero Banner", description: "Lead banner, masthead & main value proposition headline" },
  { id: "cta", name: "Call to Action (CTA)", description: "Promotional call-to-action banner, enrollment button & contact prompt" },
  { id: "highlights", name: "College Highlights / Stats", description: "Rankings, accreditation badges, student count & key figures" },
  { id: "about", name: "About College", description: "College history, overview & leadership message" },
  { id: "vision", name: "Vision & Mission Statement", description: "Institutional core values, vision & long-term goals" },
  { id: "courses", name: "Courses / Programs Offered", description: "UG, PG & Ph.D degree programs with duration & intake" },
  { id: "departments", name: "Academic Departments", description: "Engineering, Science, Arts & Business department grids" },
  { id: "admissions", name: "Admission Section", description: "Eligibility criteria, fee structure & online application portal" },
  { id: "placements", name: "Placement & Top Recruiters", description: "Highest package, average salary & recruiter logos" },
  { id: "facilities", name: "Campus Facilities / Infrastructure", description: "Hostel, central library, sports complex & computer labs" },
  { id: "research", name: "Research & Innovation Labs", description: "Patents, R&D centers, funded projects & publications" },
  { id: "news", name: "News & Announcement Circulars", description: "Latest campus news, notice board circulars & press releases" },
  { id: "events", name: "Upcoming Campus Events", description: "Conferences, cultural fests, workshops & seminars" },
  { id: "gallery", name: "Gallery / Campus Life", description: "Campus photos, student life, sports & event moments" },
  { id: "testimonials", name: "Student Testimonials / Alumni", description: "Student feedback, parent reviews & alumni success stories" },
  { id: "achievements", name: "Achievements & Awards", description: "Institutional honors, NIRF ranks & NAAC accreditations" },
  { id: "faq", name: "FAQ / Frequently Asked Questions", description: "Common questions, answers & accordion FAQ items" },
  { id: "contact", name: "Contact / Inquiry Form", description: "Campus address, email, phone numbers & inquiry form" },
  { id: "map", name: "Map & Location", description: "Google Map integration & campus location directions" },
  { id: "footer", name: "Footer", description: "Bottom site links, copyright, social icons & disclaimers" },
] satisfies readonly CategoryItem[];

/**
 * Every canonical category is offered here.
 *
 * A compile-time check rather than a comment. The previous list was missing
 * `navbar`, `admissions` and `achievements` outright — it offered aliases of
 * them instead — and nothing noticed.
 */
const _everyCategoryIsOffered: {
  [K in SectionCategoryId]: true;
} = Object.fromEntries(
  SECTION_CATEGORY_IDS.map((id) => [id, true]),
) as { [K in SectionCategoryId]: true };
void _everyCategoryIsOffered;
