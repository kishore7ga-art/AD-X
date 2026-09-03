import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { api } from "@/api/client";
import { ModalDialog } from "@/components/ModalDialog";
import { PLATFORM_SECTION_CATEGORIES } from "@/constants/categories";
import { AddSectionButton } from "@/components/AddSectionButton";
import type { ModalDialogState } from "@/components/ModalDialog";
import {
  SECTION_DEVICE_PRESETS,
  buildSectionPreviewDocument,
  normalizeSectionCode,
  type SectionDevicePreset,
} from "@/lib/section-runtime";

/** The device ladder, as the preview's toggle. */
const DEVICE_TOGGLES: { group: SectionDevicePreset["group"]; label: string }[] = [
  { group: "desktop", label: "🖥️ Desktop" },
  { group: "tablet", label: "📐 Tablet" },
  { group: "mobile", label: "📱 Mobile" },
];

export type DefaultWebsiteSection = {
  id: string;
  title: string;
  sectionType: string;
  code: string;
  sortOrder: number;
};

export type DefaultWebsitePage = {
  slug: string;
  title: string;
  sections: DefaultWebsiteSection[];
};

export type DefaultWebsiteConfig = {
  pages: DefaultWebsitePage[];
  /**
   * How many times the server has written this config.
   *
   * Read with the config and sent back with every save. The API refuses a save
   * whose version has been overtaken, which is what stops a tab left open since
   * before someone else's change from writing its stale copy back over the top
   * — the failure that put `/home` back to six sections after it had been
   * filled to twenty.
   */
  version?: number;
};

export type LibraryVariant = {
  id: string;
  sectionType: string;
  variantName: string;
  componentKey: string;
  isActive: boolean;
};

/**
 * The badge colour each category is drawn in.
 *
 * Colours only. This screen used to declare the whole list again — a fourth
 * copy of the twenty ids, beside `constants/categories.ts`, the shared
 * `lib/sections/categories.ts` and the editor's own — and a fourth copy is a
 * fourth chance to drift. The last time these lists disagreed, `cta` was spelt
 * differently in one of them and every Call to Action template an admin
 * published was invisible in the editor and could never be swapped, with
 * nothing anywhere reporting it.
 *
 * Names and order come from the shared list now, so a category added there
 * appears here; a category with no colour listed falls back to the neutral
 * badge rather than being dropped from the dropdown.
 */
const CATEGORY_BADGE: Record<string, string> = {
  navbar: "bg-blue-50 text-blue-600 border-blue-200",
  hero: "bg-purple-50 text-purple-600 border-purple-200",
  cta: "bg-emerald-50 text-emerald-600 border-emerald-200",
  highlights: "bg-amber-50 text-amber-600 border-amber-200",
  about: "bg-amber-50 text-amber-600 border-amber-200",
  vision: "bg-indigo-50 text-indigo-600 border-indigo-200",
  courses: "bg-emerald-50 text-emerald-600 border-emerald-200",
  departments: "bg-amber-50 text-amber-600 border-amber-200",
  admissions: "bg-violet-50 text-violet-600 border-violet-200",
  placements: "bg-orange-50 text-orange-600 border-orange-200",
  facilities: "bg-orange-50 text-orange-600 border-orange-200",
  research: "bg-pink-50 text-pink-600 border-pink-200",
  news: "bg-lime-50 text-lime-600 border-lime-200",
  events: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200",
  gallery: "bg-rose-50 text-rose-600 border-rose-200",
  testimonials: "bg-yellow-50 text-yellow-600 border-yellow-200",
  achievements: "bg-emerald-50 text-emerald-600 border-emerald-200",
  contact: "bg-blue-50 text-blue-600 border-blue-200",
  map: "bg-purple-50 text-purple-600 border-purple-200",
  footer: "bg-night text-chalk-dim border-night-line",
};

const NEUTRAL_BADGE = "bg-night text-chalk-dim border-night-line";

const SECTION_CATEGORIES = PLATFORM_SECTION_CATEGORIES.map((category) => ({
  id: category.id,
  name: category.name,
  bg: CATEGORY_BADGE[category.id] ?? NEUTRAL_BADGE,
}));

const PRESET_SECTION_TEMPLATES = [
  {
    id: "preset-header",
    title: "Header & Navigation",
    category: "header",
    icon: "📰",
    subtitle: "Top navigation bar, college logo, menu links, and header call-to-action.",
    code: `<header class="w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-50 px-6 py-4 transition-all">
  <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20">
        <i class="fa-solid fa-graduation-cap"></i>
      </div>
      <div>
        <span class="text-lg font-black tracking-tight text-white block leading-none">Madras Institute of Tech</span>
        <span class="text-[11px] font-medium text-chalk-dim">Autonomous • NAAC A++ Accredited</span>
      </div>
    </div>
    <nav class="hidden md:flex items-center gap-8 text-sm font-semibold text-chalk-dim">
      <a href="#about" class="hover:text-blue-400 transition-colors">About</a>
      <a href="#courses" class="hover:text-blue-400 transition-colors">Academics</a>
      <a href="#faculty" class="hover:text-blue-400 transition-colors">Faculty</a>
      <a href="#events" class="hover:text-blue-400 transition-colors">Events</a>
      <a href="#placements" class="hover:text-blue-400 transition-colors">Placements</a>
    </nav>
    <div class="flex items-center gap-3">
      <a href="#contact" class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all hover:scale-105">
        Apply Admissions <i class="fa-solid fa-arrow-right ml-1.5"></i>
      </a>
    </div>
  </div>
</header>`,
  },
  {
    id: "preset-hero",
    title: "Hero Banner",
    category: "hero",
    icon: "🖼️",
    subtitle: "Main lead banner, masthead, and headline CTA for the top of the page.",
    code: `<section style="background: #ffffff; color: #0f172a; padding: 80px 24px 60px 24px; text-align: center; font-family: system-ui, sans-serif; width: 100%; box-sizing: border-box; border-bottom: 1px solid #e2e8f0;">
  <div style="max-width: 960px; margin: 0 auto;">
    <span style="background: #ffe4e6; border: 1px solid #f43f5e; color: #e11d48; padding: 6px 20px; border-radius: 9999px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block;">ADMISSIONS OPEN 2026–2027</span>
    <h1 style="font-size: 56px; font-weight: 900; margin-top: 24px; line-height: 1.15; color: #0f172a; letter-spacing: -0.02em;">Empowering Minds, Shaping Tomorrow's Leaders</h1>
    <p style="font-size: 18px; color: #64748b; margin-top: 20px; line-height: 1.6; max-width: 840px; margin-left: auto; margin-right: auto; font-weight: 500;">Join a world-class academic community dedicated to innovation, groundbreaking research, and personal growth. Discover over 120 undergraduate and graduate programs tailored for your future.</p>
    <div style="margin-top: 36px; display: flex; justify-content: center; gap: 16px; flex-wrap: wrap;">
      <a href="#admissions" style="background: #ef4444; color: #ffffff; padding: 14px 36px; border-radius: 12px; font-size: 15px; font-weight: 800; text-decoration: none; box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.4); display: inline-block;">Apply Now</a>
      <a href="#courses" style="background: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1; padding: 14px 36px; border-radius: 12px; font-size: 15px; font-weight: 800; text-decoration: none; display: inline-block;">Explore Programs</a>
    </div>
    <div style="margin-top: 60px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; border-top: 1px solid #e2e8f0; padding-top: 32px;">
      <div>
        <div style="font-size: 28px; font-weight: 900; color: #0f172a;">#12</div>
        <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.05em;">NATIONAL RANK</div>
      </div>
      <div>
        <div style="font-size: 28px; font-weight: 900; color: #0f172a;">120+</div>
        <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.05em;">ACADEMIC MAJORS</div>
      </div>
      <div>
        <div style="font-size: 28px; font-weight: 900; color: #0f172a;">96%</div>
        <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.05em;">GRADUATE PLACEMENT</div>
      </div>
      <div>
        <div style="font-size: 28px; font-weight: 900; color: #0f172a;">10:1</div>
        <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.05em;">STUDENT-FACULTY RATIO</div>
      </div>
    </div>
  </div>
</section>`,
  },
  {
    id: "preset-about",
    title: "About Us",
    category: "about",
    icon: "ℹ️",
    subtitle: "College history, mission statement, leadership quote, and campus overview.",
    code: `<section class="w-full py-20 px-6 bg-night border-b border-slate-800/80 text-white font-sans">
  <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
    <div class="space-y-5">
      <span class="text-xs font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
        About Institution
      </span>
      <h2 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
        40+ Years of Academic Heritage & Technological Innovation
      </h2>
      <p class="text-chalk-dim text-sm leading-relaxed">
        Established in 1985, our institute spans over 150 acres equipped with modern research parks, digital libraries, and advanced robotics labs to cultivate future global innovators.
      </p>
      <div class="grid grid-cols-2 gap-4 pt-2">
        <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800">
          <div class="text-2xl font-black text-blue-400">150+ Acres</div>
          <div class="text-xs text-chalk-dim font-medium mt-1">Smart Eco Campus</div>
        </div>
        <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800">
          <div class="text-2xl font-black text-purple-400">NAAC A++</div>
          <div class="text-xs text-chalk-dim font-medium mt-1">Highest Accreditation</div>
        </div>
      </div>
    </div>
    <div class="relative">
      <div class="rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 p-6 space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xl font-bold">
            <i class="fa-solid fa-quote-left"></i>
          </div>
          <div>
            <h4 class="font-bold text-white text-sm">Director's Vision</h4>
            <p class="text-xs text-chalk-dim">Prof. K. R. Sundaram</p>
          </div>
        </div>
        <p class="text-chalk-dim text-xs italic leading-relaxed">
          "Our mission is to empower every student with practical engineering knowledge, ethical values, and global industry opportunities."
        </p>
      </div>
    </div>
  </div>
</section>`,
  },
  {
    id: "preset-courses",
    title: "Academics & Courses",
    category: "courses",
    icon: "🎓",
    subtitle: "Degree programs, department grid, curriculum accordion, and course catalog.",
    code: `<section class="w-full py-20 px-6 bg-slate-950 border-b border-slate-800/80 text-white font-sans">
  <div class="max-w-6xl mx-auto space-y-12">
    <div class="text-center max-w-2xl mx-auto space-y-3">
      <span class="text-xs font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
        Academic Programs
      </span>
      <h2 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Industry-Focused Degree Offerings</h2>
      <p class="text-chalk-dim text-sm">Undergraduate & postgraduate engineering curricula tailored for modern technology careers.</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="p-6 rounded-3xl bg-night border border-slate-800 hover:border-blue-500/50 transition-all duration-300 space-y-4 group">
        <div class="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xl font-bold group-hover:scale-110 transition-transform">
          <i class="fa-solid fa-brain"></i>
        </div>
        <span class="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md">B.Tech • 4 Years</span>
        <h3 class="text-lg font-bold text-white">Computer Science & AI</h3>
        <p class="text-chalk-dim text-xs leading-relaxed">Specializations in Artificial Intelligence, Neural Networks, Cloud Systems, and Full-Stack Engineering.</p>
      </div>
      <div class="p-6 rounded-3xl bg-night border border-slate-800 hover:border-purple-500/50 transition-all duration-300 space-y-4 group">
        <div class="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-xl font-bold group-hover:scale-110 transition-transform">
          <i class="fa-solid fa-robot"></i>
        </div>
        <span class="text-[10px] font-black uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-md">B.Tech • 4 Years</span>
        <h3 class="text-lg font-bold text-white">Robotics & Automation</h3>
        <p class="text-chalk-dim text-xs leading-relaxed">Mechatronics, Autonomous Drones, Industrial IoT, and Advanced Sensors Laboratory training.</p>
      </div>
      <div class="p-6 rounded-3xl bg-night border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 space-y-4 group">
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl font-bold group-hover:scale-110 transition-transform">
          <i class="fa-solid fa-chart-line"></i>
        </div>
        <span class="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">MBA • 2 Years</span>
        <h3 class="text-lg font-bold text-white">Business Analytics & Tech</h3>
        <p class="text-chalk-dim text-xs leading-relaxed">Financial Engineering, Tech Product Management, Operations, and Entrepreneurship Incubator.</p>
      </div>
    </div>
  </div>
</section>`,
  },
  {
    id: "preset-faculty",
    title: "Faculty Roster",
    category: "faculty",
    icon: "👥",
    subtitle: "Professors, department heads, research scholars, and faculty grid.",
    code: `<section class="w-full py-20 px-6 bg-night border-b border-slate-800/80 text-white font-sans">
  <div class="max-w-6xl mx-auto space-y-12">
    <div class="text-center max-w-2xl mx-auto space-y-3">
      <span class="text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
        Expert Faculty
      </span>
      <h2 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Acclaimed Mentors & Scholars</h2>
      <p class="text-chalk-dim text-sm">Learn directly from internationally recognized researchers and former tech leaders.</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="p-6 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-3">
        <div class="w-20 h-20 rounded-full bg-night-raised border-2 border-amber-500/40 mx-auto flex items-center justify-center text-2xl text-amber-400 font-bold">
          <i class="fa-solid fa-user-tie"></i>
        </div>
        <h3 class="text-base font-bold text-white">Dr. Rajesh Raman, PhD</h3>
        <p class="text-xs text-amber-400 font-semibold">Head of Computer Science</p>
        <p class="text-chalk-dim text-xs">Ex-IIT Senior Fellow • 22 AI System Patents</p>
      </div>
      <div class="p-6 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-3">
        <div class="w-20 h-20 rounded-full bg-night-raised border-2 border-blue-500/40 mx-auto flex items-center justify-center text-2xl text-blue-400 font-bold">
          <i class="fa-solid fa-user-doctor"></i>
        </div>
        <h3 class="text-base font-bold text-white">Dr. Anita Deshmukh</h3>
        <p class="text-xs text-blue-400 font-semibold">Dean of Robotics & AI</p>
        <p class="text-chalk-dim text-xs">PhD Stanford University • IEEE Senior Member</p>
      </div>
      <div class="p-6 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-3">
        <div class="w-20 h-20 rounded-full bg-night-raised border-2 border-emerald-500/40 mx-auto flex items-center justify-center text-2xl text-emerald-400 font-bold">
          <i class="fa-solid fa-user-gear"></i>
        </div>
        <h3 class="text-base font-bold text-white">Prof. Vikram Malhotra</h3>
        <p class="text-xs text-emerald-400 font-semibold">Director of Innovation Cell</p>
        <p class="text-chalk-dim text-xs">Former Tech VP • Startup Accelerator Mentor</p>
      </div>
    </div>
  </div>
</section>`,
  },
  {
    id: "preset-events",
    title: "Events & News",
    category: "events",
    icon: "📅",
    subtitle: "Upcoming campus events, academic calendar, and campus news highlights.",
    code: `<section class="w-full py-20 px-6 bg-slate-950 border-b border-slate-800/80 text-white font-sans">
  <div class="max-w-6xl mx-auto space-y-12">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <span class="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
          Campus Life
        </span>
        <h2 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-3">Upcoming Events & Highlights</h2>
      </div>
      <a href="#events" class="text-xs font-bold text-emerald-400 hover:underline">View Full Academic Calendar →</a>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="p-6 rounded-3xl bg-night border border-slate-800 flex gap-4 items-start">
        <div class="px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center shrink-0">
          <span class="text-xl font-black text-emerald-400 block">15</span>
          <span class="text-[10px] font-bold text-chalk-dim uppercase">MAR</span>
        </div>
        <div class="space-y-2">
          <h3 class="text-base font-bold text-white">National AI & Robotics Hackathon 2026</h3>
          <p class="text-chalk-dim text-xs leading-relaxed">48-hour continuous coding championship with cash prizes worth ₹5 Lakhs.</p>
        </div>
      </div>
      <div class="p-6 rounded-3xl bg-night border border-slate-800 flex gap-4 items-start">
        <div class="px-4 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center shrink-0">
          <span class="text-xl font-black text-blue-400 block">28</span>
          <span class="text-[10px] font-bold text-chalk-dim uppercase">MAR</span>
        </div>
        <div class="space-y-2">
          <h3 class="text-base font-bold text-white">Global Industry Conclave & Career Fair</h3>
          <p class="text-chalk-dim text-xs leading-relaxed">Over 80 Fortune 500 company leaders visiting campus for placement interviews.</p>
        </div>
      </div>
    </div>
  </div>
</section>`,
  },
  {
    id: "preset-contact",
    title: "Contact & Map",
    category: "contact",
    icon: "✉️",
    subtitle: "Campus address, interactive location map, contact form, and helpline numbers.",
    code: `<section class="w-full py-20 px-6 bg-night border-b border-slate-800/80 text-white font-sans">
  <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
    <div class="space-y-6">
      <span class="text-xs font-black uppercase tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
        Admissions Desk
      </span>
      <h2 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Get in Touch with Admissions</h2>
      <p class="text-chalk-dim text-sm leading-relaxed">Have questions about eligibility, fee structures, or campus hostels? Reach out to our team.</p>
      <div class="space-y-3 text-xs text-chalk-dim">
        <div class="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
          <i class="fa-solid fa-location-dot text-rose-400 text-base"></i>
          <span>100 College Road, Academic Zone, Chennai 600028</span>
        </div>
        <div class="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
          <i class="fa-solid fa-phone text-blue-400 text-base"></i>
          <span>+91 44 2490 0000 / +91 98400 12345</span>
        </div>
        <div class="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
          <i class="fa-solid fa-envelope text-emerald-400 text-base"></i>
          <span>admissions@college.edu.in</span>
        </div>
      </div>
    </div>
    <div class="p-8 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
      <h3 class="text-lg font-bold text-white">Send Admission Enquiry</h3>
      <input type="text" placeholder="Full Name" class="w-full bg-night border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500" />
      <input type="email" placeholder="Email Address" class="w-full bg-night border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500" />
      <button class="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer">
        Submit Request <i class="fa-solid fa-paper-plane ml-1"></i>
      </button>
    </div>
  </div>
</section>`,
  },
  {
    id: "preset-placements",
    title: "Placements & Careers",
    category: "placements",
    icon: "💼",
    subtitle: "Placement statistics, top recruiters, salary packages, and career cell info.",
    code: `<section class="w-full py-20 px-6 bg-slate-950 text-white font-sans">
  <div class="max-w-6xl mx-auto space-y-12 text-center">
    <div class="space-y-3 max-w-2xl mx-auto">
      <span class="text-xs font-black uppercase tracking-widest text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full">
        Career Excellence
      </span>
      <h2 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Unrivaled Placement Records</h2>
      <p class="text-chalk-dim text-sm">Over 250+ top global technology companies actively recruit from our campus every year.</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="p-8 rounded-3xl bg-night border border-slate-800 space-y-2">
        <div class="text-4xl font-black text-emerald-400">98%</div>
        <div class="text-xs font-bold text-chalk-dim uppercase tracking-wider">Placement Rate</div>
      </div>
      <div class="p-8 rounded-3xl bg-night border border-slate-800 space-y-2">
        <div class="text-4xl font-black text-amber-400">48 LPA</div>
        <div class="text-xs font-bold text-chalk-dim uppercase tracking-wider">Highest Package</div>
      </div>
      <div class="p-8 rounded-3xl bg-night border border-slate-800 space-y-2">
        <div class="text-4xl font-black text-blue-400">250+</div>
        <div class="text-xs font-bold text-chalk-dim uppercase tracking-wider">Top Recruiters</div>
      </div>
    </div>
  </div>
</section>`,
  },
];

function matchesSlug(slugA?: string, slugB?: string): boolean {
  if (!slugA || !slugB || typeof slugA !== "string" || typeof slugB !== "string") return false;
  const normA = slugA.trim().toLowerCase().replace(/^\/+/, "");
  const normB = slugB.trim().toLowerCase().replace(/^\/+/, "");
  return normA === normB;
}

function SectionLivePreviewIframe({
  code,
  title,
  viewMode = "desktop",
}: {
  code: string;
  title?: string;
  viewMode?: SectionDevicePreset["group"];
}) {
  // Widths come from the one device ladder in `@/lib/section-runtime`, so the
  // Admin's "Tablet" is the editor's "Tablet" is the site preview's "Tablet".
  const frameWidth = SECTION_DEVICE_PRESETS.find((preset) => preset.group === viewMode)?.width ?? "100%";
  // The document is built by `@/lib/section-runtime`, which the published site
  // builds its own environment from as well. This preview is the reference
  // rendering — a section that looks right here has to look identical live — and
  // the only way to keep that true is for there to be one definition of what
  // "here" is.
  const fullHtmlDoc = buildSectionPreviewDocument(code, { title });

  return (
    <div
      className={`w-full transition-all duration-300 ${
        viewMode === "desktop"
          ? "w-full min-h-[400px] rounded-2xl overflow-hidden border border-night-line bg-black"
          : "mx-auto border-4 border-slate-700 rounded-3xl overflow-hidden shadow-2xl my-2 min-h-[480px]"
      }`}
      style={viewMode === "desktop" ? undefined : { maxWidth: frameWidth }}
    >
      <iframe
        title="Live Section Sandbox"
        srcDoc={fullHtmlDoc}
        className="w-full h-full min-h-[400px] border-0 bg-night block"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        allow="autoplay; fullscreen"
      />
    </div>
  );
}

export function DefaultWebsite() {
  const [config, setConfig] = useState<DefaultWebsiteConfig | null>(null);
  const [activeSlug, setActiveSlug] = useState<string>("/home");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit Section Modal State
  const [editingSection, setEditingSection] = useState<{
    pageSlug: string;
    section: DefaultWebsiteSection;
    index: number;
  } | null>(null);

  // Add Section Modal State
  const [addingSection, setAddingSection] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("hero");
  const [newCode, setNewCode] = useState("");
  const [editViewMode, setEditViewMode] = useState<SectionDevicePreset["group"]>("desktop");

  /**
   * Brings a section up to date with the responsive engine.
   *
   * What was here rewrote the markup: every `width: NNNpx` over 360 became
   * `width: 100%`, every `display: flex` gained `flex-wrap: wrap` at *all*
   * widths, and every `<img>` was given a `style` attribute — in front of the
   * one the author had already written, which HTML then discarded. Desktop
   * layouts were being altered to fix mobile, permanently, in stored data.
   *
   * The engine does this in CSS now, only below the tablet breakpoint and
   * without touching what is saved.
   */
  function autoFormatResponsiveCode(rawCode: string): string {
    return normalizeSectionCode(rawCode);
  }

const FALLBACK_DEFAULT_CONFIG: DefaultWebsiteConfig = {
  pages: [
    {
      slug: "/home",
      title: "Home",
      sections: [
        {
          id: "preset-header",
          title: "Navbar / Header",
          sectionType: "navbar",
          code: PRESET_SECTION_TEMPLATES.find((p) => p.category === "header" || p.category === "navbar")?.code || `<header style="background: #0d1527; color: #ffffff; padding: 18px 40px; display: flex; align-items: center; justify-content: space-between; font-family: system-ui, sans-serif; width: 100%; box-sizing: border-box;"><span>GREENFIELD UNIVERSITY</span></header>`,
          sortOrder: 0,
        },
        {
          id: "preset-footer",
          title: "Footer",
          sectionType: "footer",
          code: `<footer style="background: #090d16; color: #94a3b8; padding: 40px 40px; font-family: system-ui, sans-serif; width: 100%; box-sizing: border-box; border-top: 1px solid #1e293b; text-align: center;"><p style="font-size: 13px; font-weight: 700; color: #cbd5e1; margin: 0;">© 2026 Greenfield University. All Rights Reserved.</p></footer>`,
          sortOrder: 1,
        },
      ],
    },
    { slug: "/about", title: "About Us", sections: [] },
    { slug: "/courses", title: "Academics", sections: [] },
    { slug: "/events", title: "Events", sections: [] },
    { slug: "/contact", title: "Contact", sections: [] },
  ],
};

  useEffect(() => {
    loadConfig();
  }, []);

  /**
   * The config, from the server.
   *
   * The API is the only source. `localStorage` used to stand in whenever the
   * request came back empty, and that is how a stale copy from an earlier
   * session became the config on screen — after which the next edit PUT it back
   * over whatever the server had, silently reverting work. A recovery copy is
   * still written on every save, but it is offered rather than applied: if it
   * disagrees with the server the operator is told, and restoring it is a
   * button, not something that happens while nobody is looking.
   *
   * A failed load is now a failure on screen too. It used to fall through to
   * `FALLBACK_DEFAULT_CONFIG` — five pages, two sections — which is
   * indistinguishable from "the platform default really is nearly empty", and
   * saving from that state overwrites the real config with the fallback.
   */
  async function loadConfig() {
    setLoading(true);
    setStatusMsg(null);
    try {
      const data = await api.get<DefaultWebsiteConfig>("/api/v1/admin/default-website");

      if (data && Array.isArray(data.pages) && data.pages.length > 0) {
        setConfig(data);
        if (!data.pages.some((p) => matchesSlug(p.slug, activeSlug))) {
          const firstPage = data.pages[0];
          if (firstPage) setActiveSlug(firstPage.slug);
        }
        setRecovery(unsavedRecovery(data));
      } else {
        setConfig(FALLBACK_DEFAULT_CONFIG);
        setStatusMsg({
          type: "error",
          text: "The server returned no pages. Showing the built-in fallback — do not save from here, it would replace the real default website.",
        });
      }
    } catch (err) {
      // Deliberately not the fallback: saving from it would overwrite the real
      // config with two sections, and the operator would have had no way to
      // know the screen was not showing the truth.
      setConfig(null);
      setStatusMsg({
        type: "error",
        text: `Could not load the default website: ${err instanceof Error ? err.message : "the request failed"}. Nothing is shown rather than a guess — reload once the API is reachable.`,
      });
    } finally {
      setLoading(false);
    }
  }

  /**
   * The last locally-saved copy, if it does not match what the server returned.
   *
   * Only surfaced when the two disagree, because that is the only case where it
   * tells the operator something: a save that reported failure, or a tab closed
   * mid-edit. Identical copies are the normal case and would be noise.
   */
  const [recovery, setRecovery] = useState<{ savedAt: string; config: DefaultWebsiteConfig } | null>(null);

  function unsavedRecovery(server: DefaultWebsiteConfig) {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem("xite_admin_default_website");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const config = parsed?.config;
      if (!config || !Array.isArray(config.pages) || config.pages.length === 0) return null;

      const tally = (c: DefaultWebsiteConfig) =>
        c.pages.reduce((sum, p) => sum + (p.sections?.length || 0), 0);
      if (tally(config) === tally(server)) return null;

      return { savedAt: String(parsed.savedAt || ""), config };
    } catch {
      return null;
    }
  }

  /**
   * Save the config, and say what actually happened.
   *
   * ── The bug this is the fix for ──────────────────────────────────────────
   *
   * The `catch` here read
   *
   *     setStatusMsg({ type: "success", text: "…updated & saved!" });
   *
   * so **every** failed save reported success — an expired admin session, a
   * rejected body, an API that never answered. This screen routes every action
   * through this function: add a section, edit one, delete one, reorder,
   * Save. All of them said "saved" and none of them had. The operator found
   * out on the next reload, when the server served what it still had, and the
   * only description available for that is "it saved and then it was gone".
   *
   * ── And the localStorage copy ────────────────────────────────────────────
   *
   * This also wrote the config to `localStorage` before the request, and
   * `loadConfig` read it back whenever the API returned nothing. A cache that
   * feeds the load path is a cache that can be saved back: a stale copy from a
   * previous session became the config on screen, and the next edit PUT it over
   * whatever the server had. The write stays — it is a genuine safety net for a
   * page half-built when a session expires — but it is stamped, and `loadConfig`
   * no longer treats it as a source. See there.
   */
  async function persistConfig(newConfig: DefaultWebsiteConfig) {
    setConfig(newConfig);
    setSaving(true);
    setStatusMsg(null);

    // A recovery copy, never a source. See loadConfig.
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "xite_admin_default_website",
          JSON.stringify({ savedAt: new Date().toISOString(), config: newConfig }),
        );
      } catch {}
    }

    try {
      const updated = await api.put<DefaultWebsiteConfig>("/api/v1/admin/default-website", {
        ...newConfig,
        // The version this screen was built from. See DefaultWebsiteConfig.
        version: newConfig.version ?? config?.version,
      });
      if (!updated || !Array.isArray(updated.pages) || updated.pages.length === 0) {
        throw new Error("the server returned no pages");
      }
      setConfig(updated);
      const boxes = updated.pages.reduce((sum, p) => sum + (p.sections?.length || 0), 0);
      setStatusMsg({
        type: "success",
        text: `Saved — ${boxes} section boxes across ${updated.pages.length} pages, live for new colleges.`,
      });
    } catch (err) {
      /**
       * A refusal, not a failure.
       *
       * The server rejects a save built on a version it has moved past. That is
       * the whole point of the version, so this reloads rather than offering a
       * retry that would re-send the same stale copy: the operator sees what is
       * actually stored, and the local copy is still on the recovery banner if
       * their version was the one worth keeping.
       */
      const status = (err as { status?: number } | null)?.status;
      if (status === 409) {
        setSaving(false);
        // Before the message, not after: `loadConfig` clears the status line on
        // entry, so setting it first would show it for the length of a fetch.
        await loadConfig();
        setStatusMsg({
          type: "error",
          text: `NOT saved — ${err instanceof Error ? err.message : "the default website changed elsewhere."} What the server has is now on screen; your version is offered above if you want it instead.`,
        });
        return;
      }

      setStatusMsg({
        type: "error",
        text: `NOT saved: ${err instanceof Error ? err.message : "the request failed"}. Reload the page to see what the server actually has.`,
      });
    } finally {
      setSaving(false);
    }
  }

  /**
   * Bring a page — or all five — up to all twenty section categories.
   *
   * The composition happens on the server, not here. It reads the template
   * library to decide what each category should be, and a browser doing that
   * would need the twenty fallback blocks as well, which is a second copy of
   * markup the backend already owns. So this posts an instruction and renders
   * what comes back.
   *
   * Non-destructive and idempotent: a page keeps every section it already has,
   * a leftover is kept after the twenty, and pressing it twice changes nothing.
   * Said in the confirmation, because a button that rewrites five pages should
   * say what it will not do.
   */
  const [filling, setFilling] = useState(false);

  function handleFillSections(scope: "page" | "all") {
    const targetPage = activeConfig.pages.find((p) => matchesSlug(p.slug, activeSlug));
    const targetSlug = targetPage?.slug || activeSlug;

    setModalConfig({
      isOpen: true,
      type: "confirm",
      variant: "info",
      title: scope === "all" ? "Add every section to all pages?" : `Add every section to ${targetPage?.title || targetSlug}?`,
      message:
        (scope === "all"
          ? "All five pages will be brought up to the full set of 20 section categories, in the order a college website is read — navbar first, footer last."
          : `${targetPage?.title || targetSlug} will be brought up to the full set of 20 section categories, in the order a college website is read — navbar first, footer last.`) +
        "\n\nSections you have already arranged are kept exactly as they are and moved into their category's place. Anything that belongs to no category stays after the twenty. Where the Templates library has a published design for a category it is used; only the categories with no template get a built-in starter.",
      confirmText: scope === "all" ? "Add to all pages" : "Add to this page",
      onCancel: () => setModalConfig(null),
      onConfirm: async () => {
        setModalConfig(null);
        setFilling(true);
        setStatusMsg(null);
        try {
          const updated = await api.post<DefaultWebsiteConfig>(
            "/api/v1/admin/default-website/fill",
            scope === "all" ? {} : { slugs: [targetSlug] },
          );
          if (updated && Array.isArray(updated.pages) && updated.pages.length > 0) {
            setConfig(updated);
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem("xite_admin_default_website", JSON.stringify(updated));
              } catch {}
            }
            const filled = scope === "all" ? updated.pages : updated.pages.filter((p) => matchesSlug(p.slug, targetSlug));
            const total = filled.reduce((sum, p) => sum + (p.sections?.length || 0), 0);
            setStatusMsg({
              type: "success",
              text: `${total} section boxes across ${filled.length} page${filled.length === 1 ? "" : "s"} — saved and live for new colleges.`,
            });
          } else {
            setStatusMsg({ type: "error", text: "The server returned no pages. Nothing was changed." });
          }
        } catch (err) {
          setStatusMsg({
            type: "error",
            text: `Could not add the sections: ${err instanceof Error ? err.message : "the request failed"}. Nothing was changed.`,
          });
        } finally {
          setFilling(false);
        }
      },
    });
  }

  async function handleSave() {
    if (!config) return;
    await persistConfig(config);
  }

  const activeConfig = config || FALLBACK_DEFAULT_CONFIG;
  const activePage = activeConfig.pages.find((p) => matchesSlug(p.slug, activeSlug)) || activeConfig.pages[0];
  const totalSectionBoxes = (config?.pages || []).reduce((sum, p) => sum + (p.sections?.length || 0), 0);
  const activePageSectionsCount = activePage?.sections?.length || 0;

  async function moveSection(index: number, direction: "up" | "down") {
    const currentConfig = config || FALLBACK_DEFAULT_CONFIG;
    const targetPage = currentConfig.pages.find((p) => matchesSlug(p.slug, activeSlug)) || currentConfig.pages[0];
    if (!targetPage) return;

    const targetSlug = targetPage.slug;
    const sections = [...targetPage.sections];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const itemA = sections[index];
    const itemB = sections[targetIdx];
    if (itemA && itemB) {
      sections[index] = itemB;
      sections[targetIdx] = itemA;
    }

    // re-assign sort orders
    sections.forEach((sec, idx) => {
      sec.sortOrder = idx;
    });

    const updatedPages = currentConfig.pages.map((p) =>
      matchesSlug(p.slug, targetSlug) ? { ...p, sections } : p
    );
    await persistConfig({ ...currentConfig, pages: updatedPages });
  }

  const [modalConfig, setModalConfig] = useState<ModalDialogState | null>(null);

  function removeSection(index: number) {
    const currentConfig = config || FALLBACK_DEFAULT_CONFIG;
    const targetPage = currentConfig.pages.find((p) => matchesSlug(p.slug, activeSlug)) || currentConfig.pages[0];
    if (!targetPage) return;

    const secTitle = targetPage.sections[index]?.title || "this section box";

    setModalConfig({
      isOpen: true,
      type: "confirm",
      variant: "danger",
      title: `Remove ${secTitle}?`,
      message: `Are you sure you want to remove "${secTitle}" from the default website configuration?`,
      confirmText: "Remove Section Box",
      cancelText: "Keep Section Box",
      onCancel: () => setModalConfig(null),
      onConfirm: async () => {
        setModalConfig(null);
        const targetSlug = targetPage?.slug || activeSlug;
        const sections = (targetPage?.sections || []).filter((_, idx) => idx !== index);
        sections.forEach((sec, idx) => {
          sec.sortOrder = idx;
        });

        const updatedPages = currentConfig.pages.map((p) =>
          matchesSlug(p.slug, targetSlug) ? { ...p, sections } : p
        );
        await persistConfig({ ...currentConfig, pages: updatedPages });
      },
    });
  }

  function handleDeleteAllSections(scope: "page" | "all") {
    const currentConfig = config || FALLBACK_DEFAULT_CONFIG;
    const targetPage = currentConfig.pages.find((p) => matchesSlug(p.slug, activeSlug)) || currentConfig.pages[0];
    const targetSlug = targetPage?.slug || activeSlug;
    const pageTitle = targetPage?.title || targetSlug;

    const totalCount =
      scope === "all"
        ? currentConfig.pages.reduce((sum, p) => sum + (p.sections?.length || 0), 0)
        : targetPage?.sections?.length || 0;

    if (totalCount === 0) return;

    setModalConfig({
      isOpen: true,
      type: "confirm",
      variant: "danger",
      title:
        scope === "all"
          ? "Delete All Default Sections Across All Pages?"
          : `Delete All Sections on ${pageTitle}?`,
      message:
        scope === "all"
          ? `Are you sure you want to permanently delete all ${totalCount} default section boxes across all ${currentConfig.pages.length} pages (${currentConfig.pages.map((p) => p.title).join(", ")})?\n\nNew colleges signing up will receive clean empty pages until sections are added again. Existing colleges' websites will not be affected.`
          : `Are you sure you want to delete all ${totalCount} default section boxes on the "${pageTitle}" page?\n\nNew colleges signing up will receive an empty ${pageTitle} page until sections are added again. Existing colleges' websites will not be affected.`,
      confirmText: scope === "all" ? "Delete All Default Sections" : `Delete All on ${pageTitle}`,
      cancelText: "Keep Section Boxes",
      onCancel: () => setModalConfig(null),
      onConfirm: async () => {
        setModalConfig(null);
        const updatedPages = currentConfig.pages.map((p) => {
          if (scope === "all" || matchesSlug(p.slug, targetSlug)) {
            return { ...p, sections: [] };
          }
          return p;
        });

        await persistConfig({ ...currentConfig, pages: updatedPages });
      },
    });
  }

  const cleanCanvasWrapperFromCode = (rawCode: string): string => {
  if (!rawCode) return "";

  let clean = rawCode;

  // 1. Remove canvas containment <style> blocks
  clean = clean.replace(/<style[^>]*>[\s\S]*?\.section-canvas-box[\s\S]*?<\/style>/gi, "");

  // 2. Un-escape HTML entities if present (&lt;, &gt;, &amp;)
  clean = clean.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

  // 3. Strip outer wrapper divs injected by canvas rendering
  clean = clean.replace(/^<div[^>]*class="[^"]*(?:section-canvas-box|section-wrapper-container|items-center|overflow-hidden)[^"]*"[^>]*>([\s\S]*)<\/div>$/i, (_match, inner) => {
    return inner ? inner.trim() : _match;
  });

  // 4. Strip nested wrapper divs containing [&>*:first-child] or section-canvas-box
  clean = clean.replace(/<div[^>]*class="[^"]*\[&[^"]*"[^>]*>([\s\S]*?)<\/div>/gi, "$1");
  clean = clean.replace(/<div[^>]*class="[^"]*section-canvas-box[^"]*"[^>]*>([\s\S]*?)<\/div>/gi, "$1");

  // 5. Strip any top-level wrapper div with w-full overflow-hidden flex flex-col
  clean = clean.replace(/^<div[^>]*class="[^"]*w-full overflow-hidden flex flex-col[^"]*"[^>]*>([\s\S]*)<\/div>$/i, "$1");

  return clean.trim();
};

  async function handleSaveEditSection() {
    if (!editingSection || !config) return;

    const { pageSlug, index, section } = editingSection;
    const currentConfig = config;

    const sanitizedSection = {
      ...section,
      code: cleanCanvasWrapperFromCode(section.code),
    };

    const updatedPages = currentConfig.pages.map((p) => {
      if (!matchesSlug(p.slug, pageSlug)) return p;
      const secs = [...p.sections];
      secs[index] = sanitizedSection;
      return { ...p, sections: secs };
    });

    const updatedConfig = { ...currentConfig, pages: updatedPages };
    setEditingSection(null);
    await persistConfig(updatedConfig);
  }

  async function handleAddSectionSubmit() {
    if (!newTitle.trim()) return;

    const currentConfig = config || FALLBACK_DEFAULT_CONFIG;
    const targetPage = currentConfig.pages.find((p) => matchesSlug(p.slug, activeSlug)) || currentConfig.pages[0];
    const targetSlug = targetPage?.slug || activeSlug;
    const currentSections = targetPage?.sections || [];

    const newSec: DefaultWebsiteSection = {
      id: `def-${Date.now()}`,
      title: newTitle.trim(),
      sectionType: newType,
      code:
        newCode.trim() ||
        `<section style="padding: 60px 24px; background: #09090b; color: #ffffff; text-align: center; border-radius: 12px; font-family: system-ui, sans-serif;">
  <h2 style="font-size: 28px; font-weight: 800;">${newTitle}</h2>
  <p style="color: #a1a1aa; margin-top: 8px;">Configured default section box for ${newTitle}</p>
</section>`,
      sortOrder: currentSections.length,
    };

    const updatedPages = currentConfig.pages.map((p) =>
      matchesSlug(p.slug, targetSlug) ? { ...p, sections: [...p.sections, newSec] } : p
    );

    const updatedConfig = { ...currentConfig, pages: updatedPages };

    setAddingSection(false);
    setNewTitle("");
    setNewCode("");

    await persistConfig(updatedConfig);
  }

  function getCategoryStyle(type?: string) {
    if (!type || typeof type !== "string") return NEUTRAL_BADGE;
    return CATEGORY_BADGE[type.toLowerCase()] ?? NEUTRAL_BADGE;
  }

  return (
    <Shell title="Default Website Builder">
      <div className="space-y-6">
        {/* ⚠️ Template-only notice — makes scope crystal clear to admin */}
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-md">
          <span className="mt-0.5 text-xl leading-none">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-amber-700">
              This is the New-User Template Only
            </p>
            <p className="mt-1 text-xs text-amber-700 max-w-3xl">
              Changes saved here set the <strong>starting template for brand-new users</strong> when they first sign up.
              Existing colleges manage their own website independently in the User Editor — your changes here
              will <strong>not</strong> affect or overwrite any existing college's content.
            </p>
          </div>
        </div>

        {/* Header & Master Save Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-night-line bg-white p-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent border border-blue-200">
                New-User Template
              </span>
              <h2 className="text-xl font-bold tracking-tight text-chalk">Default Website For New Colleges</h2>
            </div>
            <p className="mt-1 text-xs text-chalk-dim max-w-2xl">
              Each section box below defines the <strong>starting website layout</strong> that is copied to a new user when they first sign up. Existing users&apos; websites are independent and unaffected.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {totalSectionBoxes > 0 && (
              <button
                type="button"
                onClick={() => handleDeleteAllSections("all")}
                disabled={saving || loading || filling}
                className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 px-5 py-3 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                title="Delete all default section boxes across all pages"
              >
                <span>🗑️ Delete All Default Sections</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-2 rounded-lg bg-accent hover:bg-accent-hover px-6 py-3 text-xs font-semibold text-white shadow-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <span>{saving ? "Saving Changes..." : "Save Default Template ⚡"}</span>
            </button>
          </div>
        </div>

        {/* Status Notification */}
        {statusMsg ? (
          <div
            className={`rounded-lg border p-4 text-xs font-semibold ${
              statusMsg.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {statusMsg.text}
          </div>
        ) : null}

        {/*
          A local copy the server does not have.

          Offered, never applied. It appears only when the two disagree, which
          means either a save that failed or a tab closed mid-edit — and in both
          cases the operator is the one who knows which version is right.
        */}
        {recovery && !loading ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold text-amber-700">
              A copy saved in this browser
              {recovery.savedAt ? ` at ${new Date(recovery.savedAt).toLocaleString()}` : ""} does not
              match what the server has. It holds{" "}
              {recovery.config.pages.reduce((sum, p) => sum + (p.sections?.length || 0), 0)} section
              boxes; the server has{" "}
              {(config?.pages || []).reduce((sum, p) => sum + (p.sections?.length || 0), 0)}.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const restore = recovery.config;
                  setRecovery(null);
                  void persistConfig(restore);
                }}
                className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 cursor-pointer"
              >
                Save the local copy to the server
              </button>
              <button
                type="button"
                onClick={() => setRecovery(null)}
                className="rounded-lg border border-amber-300 px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 cursor-pointer"
              >
                Keep the server&apos;s
              </button>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-xl border border-night-line bg-white p-16 text-center text-xs font-semibold text-chalk-dim">
            Loading Master Website Boxes...
          </div>
        ) : !config ? (
          /* The load failed. Deliberately no fallback config on screen: saving
             from one would replace the real default website with it. */
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-12 text-center">
            <p className="text-sm font-bold text-rose-700">The default website could not be loaded.</p>
            <p className="mx-auto mt-2 max-w-lg text-xs text-rose-700">
              Nothing is shown rather than a guess — editing from a guess would overwrite the real
              configuration. Check that you are still signed in, then try again.
            </p>
            <button
              type="button"
              onClick={() => void loadConfig()}
              className="mt-5 rounded-lg bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-rose-700 cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Multi-Page Navigation Bar */}
            <div className="flex items-center gap-2 border-b border-night-line pb-3 overflow-x-auto">
              {(config || FALLBACK_DEFAULT_CONFIG).pages.map((page) => {
                const isActive = page.slug === activeSlug;
                return (
                  <button
                    key={page.slug}
                    type="button"
                    onClick={() => setActiveSlug(page.slug)}
                    className={`flex items-center gap-2.5 rounded-lg px-5 py-3 text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? "bg-white text-chalk  border border-night-line scale-[1.02]"
                        : "border border-transparent bg-night text-chalk-dim hover:border-night-line hover:text-chalk"
                    }`}
                  >
                    <span>{page.title}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActive ? "bg-accent/10 text-accent border border-blue-200" : "bg-night text-chalk-dim"
                      }`}
                    >
                      {page.sections.length} Boxes
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-chalk">
                  {activePage?.title} Page — Section Mini-Boxes ({activePage?.sections.length || 0})
                </h3>
                <p className="text-xs text-chalk-dim">
                  Visual layout of default section boxes for route <code className="text-chalk bg-night px-1.5 py-0.5 rounded">{activeSlug}</code>
                </p>
              </div>
              {/*
                Three actions, narrowest first.

                "Add Section Box" opens the editor for one section. The two
                beside it fill in every category the page is missing — the
                whole-set action, which is what a new page actually needs and
                what previously took twenty passes through the same form.
              */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleFillSections("page")}
                  disabled={filling || saving || loading}
                  className="rounded-lg border border-night-line bg-white px-4 py-2.5 text-xs font-semibold text-chalk transition hover:border-chalk/25 hover:bg-night disabled:opacity-50 cursor-pointer"
                >
                  {filling ? "Adding…" : "Add all 20 to this page"}
                </button>
                <button
                  type="button"
                  onClick={() => handleFillSections("all")}
                  disabled={filling || saving || loading}
                  className="rounded-lg border border-night-line bg-white px-4 py-2.5 text-xs font-semibold text-chalk transition hover:border-chalk/25 hover:bg-night disabled:opacity-50 cursor-pointer"
                >
                  {filling ? "Adding…" : "Add all 20 to every page"}
                </button>
                {activePageSectionsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteAllSections("page")}
                    disabled={filling || saving || loading}
                    className="rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2.5 text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                    title={`Delete all default sections on ${activePage?.title || "this page"}`}
                  >
                    🗑️ Delete all on this page
                  </button>
                )}
                {totalSectionBoxes > 0 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteAllSections("all")}
                    disabled={filling || saving || loading}
                    className="rounded-lg border border-rose-300 bg-rose-100 hover:bg-rose-200 text-rose-700 px-4 py-2.5 text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                    title="Delete all default section boxes across all pages"
                  >
                    🗑️ Delete All Default Sections
                  </button>
                )}
                <AddSectionButton
                  type="button"
                  onClick={() => setAddingSection(true)}
                  label="Add Section Box"
                  size="sm"
                />
              </div>
            </div>

            {/* Visual Section Cards Grid (Mini-Boxes Layout) */}
            {activePage && activePage.sections.length > 0 ? (
              <div className="grid gap-6">
                {activePage.sections.map((sec, idx) => (
                  <div
                    key={sec.id || idx}
                    className="group overflow-hidden rounded-lg border border-night-line bg-night-card p-6 shadow-md transition-all hover:border-chalk-dim/40"
                  >
                    {/* Mini-Box Top Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-night-line pb-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-night font-mono text-xs font-bold text-chalk border border-night-line">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-semibold text-chalk">{sec?.title || "Untitled Section"}</h4>
                            <span
                              className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase ${getCategoryStyle(
                                sec?.sectionType
                              )}`}
                            >
                              {sec?.sectionType || "SECTION"}
                            </span>
                          </div>
                          <span className="text-[11px] text-chalk-dim/50">
                            Section Box #{idx + 1} for {activePage.title}
                          </span>
                        </div>
                      </div>

                      {/* Mini-Box Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => moveSection(idx, "up")}
                          disabled={idx === 0}
                          className="rounded-lg border border-night-line bg-night px-3 py-1.5 text-xs font-bold text-chalk-dim transition hover:border-chalk-dim/40 hover:text-chalk disabled:opacity-20"
                        >
                          ↑ Move Up
                        </button>
                        <button
                          type="button"
                          onClick={() => moveSection(idx, "down")}
                          disabled={idx === activePage.sections.length - 1}
                          className="rounded-lg border border-night-line bg-night px-3 py-1.5 text-xs font-bold text-chalk-dim transition hover:border-chalk-dim/40 hover:text-chalk disabled:opacity-20"
                        >
                          ↓ Move Down
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSection({ pageSlug: activeSlug, section: { ...sec, code: cleanCanvasWrapperFromCode(sec.code) }, index: idx })}
                          className="rounded-lg bg-chalk px-4 py-1.5 text-xs font-bold text-night transition hover:bg-chalk/90"
                        >
                          Edit Code
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSection(idx)}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Live HTML Mini-Preview Box */}
                    <div className="relative overflow-hidden rounded-lg border border-night-line bg-night p-2">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-chalk-dim/40 mb-2 px-2 pt-1">
                        Live Preview Sandbox
                      </div>
                      <SectionLivePreviewIframe code={sec.code} title={sec.title} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-night-line bg-night-card p-16 text-center space-y-3">
                <p className="text-sm font-bold text-chalk">No section boxes configured for {activePage?.title} yet.</p>
                <p className="text-xs text-chalk-dim">Click below to add a section box for this page.</p>
                <div className="pt-2">
                  <AddSectionButton
                    type="button"
                    onClick={() => setAddingSection(true)}
                    label="Add Section Box"
                    size="md"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal: Edit Code & Title Studio */}
        {editingSection ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-chalk/40 p-4 backdrop-blur-md">
            <div className="w-full max-w-6xl rounded-xl border border-night-line bg-night-card p-6 shadow-lg space-y-6 max-h-[92vh] overflow-y-auto">
              
              {/* Modal Top Header */}
              <div className="flex items-center justify-between border-b border-night-line pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 border border-emerald-200">
                      Live Studio Code Editor
                    </span>
                    <h3 className="text-lg font-bold text-chalk">Edit Section Box — {editingSection.section.title}</h3>
                  </div>
                  <p className="text-xs text-chalk-dim mt-0.5">
                    Modify title, category type, and section HTML source code with instant live render preview.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = autoFormatResponsiveCode(editingSection.section.code);
                      setEditingSection({
                        ...editingSection,
                        section: { ...editingSection.section, code: updated },
                      });
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-100 border border-amber-300 px-3.5 py-2 text-xs font-bold text-amber-700 hover:bg-amber-500/30 transition shadow-sm cursor-pointer"
                    title="Automatically format code with responsive CSS & mobile flex-wrap"
                  >
                    <span>⚡ Auto Edit (Make Responsive)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingSection(null)}
                    className="text-xs font-bold text-chalk-dim hover:text-chalk p-2"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>

              {/* Split Screen Grid: Preview vs Source Code */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Column: Live Section Preview Canvas */}
                <div className="space-y-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold tracking-wider text-chalk-dim uppercase flex items-center gap-2">
                      <span>👁️ Live Section Preview</span>
                      <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-200/40 px-2 py-0.5 rounded">
                        Real-Time Render
                      </span>
                    </h4>

                    {/* Viewport Width Toggles */}
                    <div className="flex items-center gap-1 bg-night border border-night-line rounded-lg p-1">
                      {DEVICE_TOGGLES.map((device) => (
                        <button
                          key={device.group}
                          type="button"
                          onClick={() => setEditViewMode(device.group)}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition ${
                            editViewMode === device.group ? "bg-chalk text-night shadow" : "text-chalk-dim hover:text-chalk"
                          }`}
                        >
                          {device.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Render Canvas Box */}
                  <SectionLivePreviewIframe
                    code={editingSection.section.code}
                    title={editingSection.section.title}
                    viewMode={editViewMode}
                  />
                </div>

                {/* Right Column: Code Editor & Metadata Inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-chalk mb-1">Section Box Title *</label>
                    <input
                      type="text"
                      value={editingSection.section.title}
                      onChange={(e) =>
                        setEditingSection({
                          ...editingSection,
                          section: { ...editingSection.section, title: e.target.value },
                        })
                      }
                      className="w-full rounded-lg border border-night-line bg-night px-4 py-2.5 text-xs font-semibold text-chalk outline-none focus:border-chalk"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-chalk mb-1">Category / Type</label>
                    <select
                      value={editingSection.section.sectionType}
                      onChange={(e) =>
                        setEditingSection({
                          ...editingSection,
                          section: { ...editingSection.section, sectionType: e.target.value },
                        })
                      }
                      className="w-full rounded-lg border border-night-line bg-night px-4 py-2.5 text-xs font-semibold text-chalk outline-none focus:border-chalk"
                    >
                      {SECTION_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} ({cat.id.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-chalk">Section HTML Source Code</label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 rounded-lg border border-chalk/30 bg-chalk/10 px-3 py-1 text-xs font-bold text-chalk hover:bg-chalk/20 cursor-pointer transition shadow-sm">
                          <span>📁 Upload HTML File</span>
                          <input
                            type="file"
                            accept=".html,.htm,.txt"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const text = event.target?.result as string;
                                  if (text) {
                                    setEditingSection({
                                      ...editingSection,
                                      section: { ...editingSection.section, code: text },
                                    });
                                  }
                                };
                                reader.readAsText(file);
                              }
                            }}
                          />
                        </label>
                        <span className="text-[10px] font-mono text-chalk-dim">
                          {editingSection.section.code.length.toLocaleString()} chars
                        </span>
                      </div>
                    </div>
                    <textarea
                      rows={12}
                      value={editingSection.section.code}
                      onChange={(e) =>
                        setEditingSection({
                          ...editingSection,
                          section: { ...editingSection.section, code: e.target.value },
                        })
                      }
                      className="w-full rounded-lg border border-night-line bg-night p-4 font-mono text-xs text-chalk outline-none focus:border-chalk leading-relaxed"
                    />
                  </div>
                </div>

              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-night-line">
                <span className="text-xs text-chalk-dim font-mono">
                  Edits apply instantly to Default Website template
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingSection(null)}
                    className="rounded-lg border border-night-line px-5 py-2.5 text-xs font-bold text-chalk-dim hover:text-chalk"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditSection}
                    className="rounded-lg bg-chalk px-6 py-2.5 text-xs font-bold text-night hover:bg-chalk/90 shadow-lg cursor-pointer"
                  >
                    Save Section Box
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Modal: Add New Section Box */}
        {addingSection ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-chalk/40 p-4 backdrop-blur-md">
            <div className="w-full max-w-6xl rounded-xl border border-night-line bg-night-card p-6 shadow-lg space-y-6 max-h-[92vh] overflow-y-auto">
              
              {/* Modal Top Header */}
              <div className="flex items-center justify-between border-b border-night-line pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 border border-emerald-200">
                      New Component Builder
                    </span>
                    <h3 className="text-lg font-bold text-chalk">Add Section Box to {activePage?.title} Page</h3>
                  </div>
                  <p className="text-xs text-chalk-dim mt-0.5">
                    Configure a new section box with title, category, and responsive HTML source code.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (newCode.trim()) {
                        setNewCode(autoFormatResponsiveCode(newCode));
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-100 border border-amber-300 px-3.5 py-2 text-xs font-bold text-amber-700 hover:bg-amber-500/30 transition shadow-sm cursor-pointer"
                    title="Automatically format code with responsive CSS & mobile flex-wrap"
                  >
                    <span>⚡ Auto Edit (Make Responsive)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAddingSection(false)}
                    className="text-xs font-bold text-chalk-dim hover:text-chalk p-2"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>

              {/* Select Default Section Type Grid (Exact 8 Options) */}
              <div className="bg-night border border-night-line rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-night-line pb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-chalk flex items-center gap-2">
                    <span>✨ Select Default Section Box Category</span>
                    <span className="text-[10px] font-normal text-chalk-dim">Choose from official section types below to auto-populate layout</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PRESET_SECTION_TEMPLATES.map((tmpl) => {
                    const isSelected = newTitle === tmpl.title || newType === tmpl.category;
                    return (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => {
                          setNewTitle(tmpl.title);
                          setNewType(tmpl.category);
                          setNewCode(tmpl.code);
                        }}
                        className={`flex items-start gap-4 p-4 rounded-lg border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-accent text-night border-chalk shadow-md scale-[1.01]"
                            : "bg-white text-chalk border-night-line hover:border-chalk/25 hover:bg-night"
                        }`}
                      >
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl font-bold transition-colors ${
                            isSelected ? "bg-white/15 text-night shadow-md" : "bg-night text-chalk border border-night-line"
                          }`}
                        >
                          {tmpl.icon}
                        </div>
                        <div className="space-y-1 pr-2">
                          <h4
                            className={`text-sm font-bold tracking-tight transition-colors ${
                              isSelected ? "text-night" : "text-chalk"
                            }`}
                          >
                            {tmpl.title}
                          </h4>
                          <p
                            className={`text-xs leading-relaxed transition-colors ${
                              isSelected ? "text-night/70 font-medium" : "text-chalk-dim"
                            }`}
                          >
                            {tmpl.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Split Screen Grid: Preview vs Source Code */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Column: Live Section Preview Canvas */}
                <div className="space-y-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold tracking-wider text-chalk-dim uppercase flex items-center gap-2">
                      <span>👁️ Live Section Preview</span>
                      <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-200/40 px-2 py-0.5 rounded">
                        Real-Time Render
                      </span>
                    </h4>

                    {/* Viewport Width Toggles */}
                    <div className="flex items-center gap-1 bg-night border border-night-line rounded-lg p-1">
                      {DEVICE_TOGGLES.map((device) => (
                        <button
                          key={device.group}
                          type="button"
                          onClick={() => setEditViewMode(device.group)}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition ${
                            editViewMode === device.group ? "bg-chalk text-night shadow" : "text-chalk-dim hover:text-chalk"
                          }`}
                        >
                          {device.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Render Canvas Box */}
                  <SectionLivePreviewIframe
                    code={newCode}
                    title={newTitle}
                    viewMode={editViewMode}
                  />
                </div>

                {/* Right Column: Code Editor & Metadata Inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-chalk mb-1">Section Box Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Hero Banner, Placement Stats, Contact Cards"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full rounded-lg border border-night-line bg-night px-4 py-2.5 text-xs font-semibold text-chalk outline-none focus:border-chalk"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-chalk mb-1">Category / Type</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      className="w-full rounded-lg border border-night-line bg-night px-4 py-2.5 text-xs font-semibold text-chalk outline-none focus:border-chalk"
                    >
                      {SECTION_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name} ({cat.id.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-chalk">Section HTML Source Code</label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 rounded-lg border border-chalk/30 bg-chalk/10 px-3 py-1 text-xs font-bold text-chalk hover:bg-chalk/20 cursor-pointer transition shadow-sm">
                          <span>📁 Upload HTML File</span>
                          <input
                            type="file"
                            accept=".html,.htm,.txt"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const text = event.target?.result as string;
                                  if (text) {
                                    setNewCode(text);
                                  }
                                };
                                reader.readAsText(file);
                              }
                            }}
                          />
                        </label>
                        <span className="text-[10px] font-mono text-chalk-dim">
                          {newCode.length.toLocaleString()} chars
                        </span>
                      </div>
                    </div>
                    <textarea
                      rows={12}
                      placeholder="<section style='padding: 60px 24px...'>...</section>"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      className="w-full rounded-lg border border-night-line bg-night p-4 font-mono text-xs text-chalk outline-none focus:border-chalk leading-relaxed"
                    />
                  </div>
                </div>

              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-night-line">
                <span className="text-xs text-chalk-dim font-mono">
                  New box will be added to {activePage?.title} template
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAddingSection(false)}
                    className="rounded-lg border border-night-line px-5 py-2.5 text-xs font-bold text-chalk-dim hover:text-chalk"
                  >
                    Cancel
                  </button>
                  <AddSectionButton
                    type="button"
                    onClick={handleAddSectionSubmit}
                    disabled={!newTitle.trim()}
                    label="Add Section Box"
                    size="md"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {modalConfig && <ModalDialog {...modalConfig} />}
      </div>
    </Shell>
  );
}
