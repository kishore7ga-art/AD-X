export type CategoryItem = {
  id: string;
  name: string;
  description: string;
};

export const PLATFORM_SECTION_CATEGORIES: CategoryItem[] = [
  { id: "header", name: "Navbar / Header", description: "Top navigation bar with logo, menu items & action buttons" },
  { id: "hero", name: "Hero Banner", description: "Lead banner, masthead & main value proposition headline" },
  { id: "cta", name: "Call to Action (CTA) / Call", description: "Promotional call-to-action banner, enrollment button & contact prompt" },
  { id: "highlights", name: "College Highlights / Stats", description: "Rankings, accreditation badges, student count & Key figures" },
  { id: "about", name: "About College", description: "College history, overview & leadership message" },
  { id: "vision", name: "Vision & Mission Statement", description: "Institutional core values, vision & long-term goals" },
  { id: "courses", name: "Courses / Programs Offered", description: "UG, PG & Ph.D degree programs with duration & intake" },
  { id: "departments", name: "Academic Departments", description: "Engineering, Science, Arts & Business department grids" },
  { id: "admission", name: "Admission Section", description: "Eligibility criteria, fee structure & online application portal" },
  { id: "placements", name: "Placement & Top Recruiters", description: "Highest package, average salary & recruiter logos" },
  { id: "facilities", name: "Campus Facilities / Infrastructure", description: "Hostel, central library, sports complex & computer labs" },
  { id: "research", name: "Research & Innovation Labs", description: "Patents, R&D centers, funded projects & publications" },
  { id: "news", name: "News & Announcement Circulars", description: "Latest campus news, notice board circulars & press releases" },
  { id: "events", name: "Upcoming Campus Events", description: "Conferences, cultural fests, workshops & seminars" },
  { id: "gallery", name: "Gallery / Campus Life", description: "Campus photos, student life, sports & event moments" },
  { id: "testimonials", name: "Student Testimonials / Alumni", description: "Student feedback, parent reviews & alumni success stories" },
  { id: "awards", name: "Achievements & Awards", description: "Institutional honors, NIRF ranks & NAAC accreditations" },
  { id: "contact", name: "Contact / Inquiry Form", description: "Campus address, email, phone numbers & inquiry form" },
  { id: "map", name: "Map & Location", description: "Google Map integration & campus location directions" },
  { id: "footer", name: "Footer", description: "Bottom site links, copyright, social icons & disclaimers" },
];
