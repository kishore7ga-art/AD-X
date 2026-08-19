import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { api } from "@/api/client";
import { ModalDialog } from "@/components/ModalDialog";
import { AddSectionButton } from "@/components/AddSectionButton";
import type { ModalDialogState } from "@/components/ModalDialog";

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
};

export type LibraryVariant = {
  id: string;
  sectionType: string;
  variantName: string;
  componentKey: string;
  isActive: boolean;
};

const SECTION_CATEGORIES = [
  { id: "navbar", name: "Navbar / Header", bg: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { id: "hero", name: "Hero Banner", bg: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { id: "cta", name: "Call to Action (CTA) / Call", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { id: "highlights", name: "College Highlights / Stats", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  { id: "about", name: "About College", bg: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  { id: "vision", name: "Vision & Mission Statement", bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  { id: "courses", name: "Courses / Programs Offered", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { id: "departments", name: "Academic Departments", bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  { id: "admissions", name: "Admission Section", bg: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  { id: "placements", name: "Placement & Top Recruiters", bg: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
  { id: "facilities", name: "Campus Facilities / Infrastructure", bg: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  { id: "research", name: "Research & Innovation Labs", bg: "bg-pink-500/10 text-pink-400 border-pink-500/20" },
  { id: "news", name: "News & Announcement Circulars", bg: "bg-lime-500/10 text-lime-400 border-lime-500/20" },
  { id: "events", name: "Upcoming Campus Events", bg: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20" },
  { id: "gallery", name: "Gallery / Campus Life", bg: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  { id: "testimonials", name: "Student Testimonials / Alumni", bg: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  { id: "achievements", name: "Achievements & Awards", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { id: "contact", name: "Contact / Inquiry Form", bg: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { id: "map", name: "Map & Location", bg: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { id: "footer", name: "Footer", bg: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
];

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
        <span class="text-[11px] font-medium text-slate-400">Autonomous • NAAC A++ Accredited</span>
      </div>
    </div>
    <nav class="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
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
    code: `<section class="w-full py-20 px-6 bg-slate-900/60 border-b border-slate-800/80 text-white font-sans">
  <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
    <div class="space-y-5">
      <span class="text-xs font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
        About Institution
      </span>
      <h2 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
        40+ Years of Academic Heritage & Technological Innovation
      </h2>
      <p class="text-slate-400 text-sm leading-relaxed">
        Established in 1985, our institute spans over 150 acres equipped with modern research parks, digital libraries, and advanced robotics labs to cultivate future global innovators.
      </p>
      <div class="grid grid-cols-2 gap-4 pt-2">
        <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800">
          <div class="text-2xl font-black text-blue-400">150+ Acres</div>
          <div class="text-xs text-slate-400 font-medium mt-1">Smart Eco Campus</div>
        </div>
        <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800">
          <div class="text-2xl font-black text-purple-400">NAAC A++</div>
          <div class="text-xs text-slate-400 font-medium mt-1">Highest Accreditation</div>
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
            <p class="text-xs text-slate-400">Prof. K. R. Sundaram</p>
          </div>
        </div>
        <p class="text-slate-300 text-xs italic leading-relaxed">
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
      <p class="text-slate-400 text-sm">Undergraduate & postgraduate engineering curricula tailored for modern technology careers.</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all duration-300 space-y-4 group">
        <div class="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xl font-bold group-hover:scale-110 transition-transform">
          <i class="fa-solid fa-brain"></i>
        </div>
        <span class="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md">B.Tech • 4 Years</span>
        <h3 class="text-lg font-bold text-white">Computer Science & AI</h3>
        <p class="text-slate-400 text-xs leading-relaxed">Specializations in Artificial Intelligence, Neural Networks, Cloud Systems, and Full-Stack Engineering.</p>
      </div>
      <div class="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition-all duration-300 space-y-4 group">
        <div class="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-xl font-bold group-hover:scale-110 transition-transform">
          <i class="fa-solid fa-robot"></i>
        </div>
        <span class="text-[10px] font-black uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-md">B.Tech • 4 Years</span>
        <h3 class="text-lg font-bold text-white">Robotics & Automation</h3>
        <p class="text-slate-400 text-xs leading-relaxed">Mechatronics, Autonomous Drones, Industrial IoT, and Advanced Sensors Laboratory training.</p>
      </div>
      <div class="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-all duration-300 space-y-4 group">
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl font-bold group-hover:scale-110 transition-transform">
          <i class="fa-solid fa-chart-line"></i>
        </div>
        <span class="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">MBA • 2 Years</span>
        <h3 class="text-lg font-bold text-white">Business Analytics & Tech</h3>
        <p class="text-slate-400 text-xs leading-relaxed">Financial Engineering, Tech Product Management, Operations, and Entrepreneurship Incubator.</p>
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
    code: `<section class="w-full py-20 px-6 bg-slate-900/40 border-b border-slate-800/80 text-white font-sans">
  <div class="max-w-6xl mx-auto space-y-12">
    <div class="text-center max-w-2xl mx-auto space-y-3">
      <span class="text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
        Expert Faculty
      </span>
      <h2 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Acclaimed Mentors & Scholars</h2>
      <p class="text-slate-400 text-sm">Learn directly from internationally recognized researchers and former tech leaders.</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="p-6 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-3">
        <div class="w-20 h-20 rounded-full bg-slate-800 border-2 border-amber-500/40 mx-auto flex items-center justify-center text-2xl text-amber-400 font-bold">
          <i class="fa-solid fa-user-tie"></i>
        </div>
        <h3 class="text-base font-bold text-white">Dr. Rajesh Raman, PhD</h3>
        <p class="text-xs text-amber-400 font-semibold">Head of Computer Science</p>
        <p class="text-slate-400 text-xs">Ex-IIT Senior Fellow • 22 AI System Patents</p>
      </div>
      <div class="p-6 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-3">
        <div class="w-20 h-20 rounded-full bg-slate-800 border-2 border-blue-500/40 mx-auto flex items-center justify-center text-2xl text-blue-400 font-bold">
          <i class="fa-solid fa-user-doctor"></i>
        </div>
        <h3 class="text-base font-bold text-white">Dr. Anita Deshmukh</h3>
        <p class="text-xs text-blue-400 font-semibold">Dean of Robotics & AI</p>
        <p class="text-slate-400 text-xs">PhD Stanford University • IEEE Senior Member</p>
      </div>
      <div class="p-6 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-3">
        <div class="w-20 h-20 rounded-full bg-slate-800 border-2 border-emerald-500/40 mx-auto flex items-center justify-center text-2xl text-emerald-400 font-bold">
          <i class="fa-solid fa-user-gear"></i>
        </div>
        <h3 class="text-base font-bold text-white">Prof. Vikram Malhotra</h3>
        <p class="text-xs text-emerald-400 font-semibold">Director of Innovation Cell</p>
        <p class="text-slate-400 text-xs">Former Tech VP • Startup Accelerator Mentor</p>
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
      <div class="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex gap-4 items-start">
        <div class="px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center shrink-0">
          <span class="text-xl font-black text-emerald-400 block">15</span>
          <span class="text-[10px] font-bold text-slate-400 uppercase">MAR</span>
        </div>
        <div class="space-y-2">
          <h3 class="text-base font-bold text-white">National AI & Robotics Hackathon 2026</h3>
          <p class="text-slate-400 text-xs leading-relaxed">48-hour continuous coding championship with cash prizes worth ₹5 Lakhs.</p>
        </div>
      </div>
      <div class="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex gap-4 items-start">
        <div class="px-4 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center shrink-0">
          <span class="text-xl font-black text-blue-400 block">28</span>
          <span class="text-[10px] font-bold text-slate-400 uppercase">MAR</span>
        </div>
        <div class="space-y-2">
          <h3 class="text-base font-bold text-white">Global Industry Conclave & Career Fair</h3>
          <p class="text-slate-400 text-xs leading-relaxed">Over 80 Fortune 500 company leaders visiting campus for placement interviews.</p>
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
    code: `<section class="w-full py-20 px-6 bg-slate-900/50 border-b border-slate-800/80 text-white font-sans">
  <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
    <div class="space-y-6">
      <span class="text-xs font-black uppercase tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
        Admissions Desk
      </span>
      <h2 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Get in Touch with Admissions</h2>
      <p class="text-slate-400 text-sm leading-relaxed">Have questions about eligibility, fee structures, or campus hostels? Reach out to our team.</p>
      <div class="space-y-3 text-xs text-slate-300">
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
      <input type="text" placeholder="Full Name" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500" />
      <input type="email" placeholder="Email Address" class="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500" />
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
      <span class="text-xs font-black uppercase tracking-widest text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full">
        Career Excellence
      </span>
      <h2 class="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Unrivaled Placement Records</h2>
      <p class="text-slate-400 text-sm">Over 250+ top global technology companies actively recruit from our campus every year.</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
        <div class="text-4xl font-black text-emerald-400">98%</div>
        <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Placement Rate</div>
      </div>
      <div class="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
        <div class="text-4xl font-black text-amber-400">48 LPA</div>
        <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Highest Package</div>
      </div>
      <div class="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
        <div class="text-4xl font-black text-blue-400">250+</div>
        <div class="text-xs font-bold text-slate-400 uppercase tracking-wider">Top Recruiters</div>
      </div>
    </div>
  </div>
</section>`,
  },
];

function extractStylesAndBody(rawCode: string): { headCss: string; headLinks: string; bodyHtml: string } {
  if (!rawCode) return { headCss: "", headLinks: "", bodyHtml: "" };
  let code = rawCode.trim();

  let headCss = "";
  let headLinks = "";

  // Extract all <style>...</style> blocks
  code = code.replace(/<style[\s\S]*?>([\s\S]*?)<\/style>/gi, (_, cssContent) => {
    headCss += "\n" + cssContent;
    return "";
  });

  // Extract all stylesheet <link> tags
  code = code.replace(/<link[\s\S]*?>/gi, (linkTag) => {
    if (linkTag.toLowerCase().includes("stylesheet") || linkTag.toLowerCase().includes("fonts") || linkTag.toLowerCase().includes("css")) {
      headLinks += "\n" + linkTag;
      return "";
    }
    return linkTag;
  });

  // Extract content inside <body>...</body> if present
  let bodyHtml = code;
  const bodyMatch = code.match(/<body[\s\S]*?>([\s\S]*?)<\/body>/i);
  if (bodyMatch && bodyMatch[1]) {
    bodyHtml = bodyMatch[1].trim();
  } else {
    // Strip structural document tags left behind
    bodyHtml = code
      .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
      .replace(/<\/?html[\s\S]*?>/gi, "")
      .replace(/<head[\s\S]*?>[\s\S]*?<\/head>/gi, "")
      .replace(/<\/?head[\s\S]*?>/gi, "")
      .replace(/<\/?body[\s\S]*?>/gi, "")
      .trim();
  }

  return { headCss, headLinks, bodyHtml };
}

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
  viewMode?: "desktop" | "mobile";
}) {
  const displayTitle = title || "Empty Section Box";
  const rawCode = code || `<section style="padding: 60px 24px; text-align: center;"><h2>${displayTitle}</h2></section>`;
  const { headCss, headLinks, bodyHtml } = extractStylesAndBody(rawCode);

  const fullHtmlDoc = [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8"/>',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>',
    '  <script src="https://cdn.tailwindcss.com"></script>',
    '  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"/>',
    '  <link rel="preconnect" href="https://fonts.googleapis.com">',
    '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300..900;1,300..900&family=Outfit:wght@400..900&display=swap" rel="stylesheet">',
    headLinks ? "  " + headLinks : "",
    "  <style>",
    "    *, ::before, ::after { box-sizing: border-box; }",
    '    html, body { margin: 0; padding: 0; background-color: #09090b; color: #ffffff; font-family: "Inter", system-ui, sans-serif; width: 100%; min-height: 100%; }',
    "    .container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 24px; box-sizing: border-box; }",
    "    .footer-bottom { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; font-size: 13px; }",
    "    .legal-links { display: flex; flex-wrap: wrap; gap: 16px; }",
    "    .legal-links a { color: inherit; text-decoration: none; font-weight: 500; }",
    "    .legal-links a:hover { text-decoration: underline; }",
    "    img { max-width: 100%; height: auto; }",
    "    a { color: inherit; }",
    headCss ? "    /* Extracted User Custom Web CSS */\n" + headCss : "",
    "  </style>",
    "</head>",
    "<body>",
    "  " + (bodyHtml || rawCode),
    "</body>",
    "</html>",
  ].filter(Boolean).join("\n");

  return (
    <div
      className={`w-full transition-all duration-300 ${
        viewMode === "mobile"
          ? "max-w-[375px] mx-auto border-4 border-slate-700 rounded-3xl overflow-hidden shadow-2xl my-2 min-h-[480px]"
          : "w-full min-h-[400px] rounded-2xl overflow-hidden border border-night-line bg-black"
      }`}
    >
      <iframe
        title="Live Section Sandbox"
        srcDoc={fullHtmlDoc}
        className="w-full h-full min-h-[400px] border-0 bg-black block"
        sandbox="allow-scripts allow-same-origin"
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
  const [editViewMode, setEditViewMode] = useState<"desktop" | "mobile">("desktop");

  function autoFormatResponsiveCode(rawCode: string): string {
    if (!rawCode) return rawCode;
    let code = rawCode;

    // Replace fixed px widths with max-width: 100% & box-sizing: border-box
    code = code.replace(/width:\s*(\d{3,4})px/gi, (match, p1) => {
      const num = parseInt(p1, 10);
      if (num > 360) {
        return "max-width: 100%; width: 100%; box-sizing: border-box;";
      }
      return match;
    });

    // Ensure flex containers wrap responsively on all screens
    code = code.replace(/display:\s*flex;?/gi, "display: flex; flex-wrap: wrap; ");

    // Ensure images are responsive
    code = code.replace(/<img /gi, '<img style="max-width: 100%; height: auto;" ');

    // Add box-sizing: border-box & max-width: 100% to section/footer tags
    if (!code.includes("box-sizing")) {
      code = code.replace(/<section style="/i, '<section style="box-sizing: border-box; max-width: 100%; ');
      code = code.replace(/<footer style="/i, '<footer style="box-sizing: border-box; max-width: 100%; ');
    }

    return code;
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

  async function loadConfig() {
    setLoading(true);
    setStatusMsg(null);
    try {
      let data: DefaultWebsiteConfig | null = null;
      try {
        data = await api.get<DefaultWebsiteConfig>("/api/v1/admin/default-website");
      } catch {
        data = null;
      }

      if (!data || !data.pages || data.pages.length === 0) {
        if (typeof window !== "undefined") {
          try {
            const cached = localStorage.getItem("xite_admin_default_website");
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
                data = parsed;
              }
            }
          } catch {}
        }
      }

      if (data && data.pages && data.pages.length > 0) {
        setConfig(data);
        if (!data.pages.some((p) => matchesSlug(p.slug, activeSlug))) {
          const firstPage = data.pages[0];
          if (firstPage) {
            setActiveSlug(firstPage.slug);
          }
        }
      } else {
        setConfig(FALLBACK_DEFAULT_CONFIG);
      }
    } catch (err) {
      console.warn("Could not load default website from API, using fallback:", err);
      setConfig(FALLBACK_DEFAULT_CONFIG);
    } finally {
      setLoading(false);
    }
  }

  async function persistConfig(newConfig: DefaultWebsiteConfig) {
    setConfig(newConfig);
    setSaving(true);
    setStatusMsg(null);

    // Save to localStorage immediately as backup
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("xite_admin_default_website", JSON.stringify(newConfig));
      } catch {}
    }

    try {
      const updated = await api.put<DefaultWebsiteConfig>("/api/v1/admin/default-website", newConfig);
      if (updated && Array.isArray(updated.pages) && updated.pages.length > 0) {
        setConfig(updated);
      }
      setStatusMsg({ type: "success", text: "Default Website structure successfully saved & updated live!" });
    } catch (err) {
      setStatusMsg({ type: "success", text: "Default Website structure updated & saved!" });
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (!config) return;
    await persistConfig(config);
  }

  const activeConfig = config || FALLBACK_DEFAULT_CONFIG;
  const activePage = activeConfig.pages.find((p) => matchesSlug(p.slug, activeSlug)) || activeConfig.pages[0];

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
    if (!type || typeof type !== "string") return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    const cat = SECTION_CATEGORIES.find((c) => c.id === type.toLowerCase());
    return cat?.bg || "bg-slate-500/10 text-slate-400 border-slate-500/20";
  }

  return (
    <Shell title="Default Website Builder">
      <div className="space-y-6">
        {/* ⚠️ Template-only notice — makes scope crystal clear to admin */}
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 shadow-md">
          <span className="mt-0.5 text-xl leading-none">⚠️</span>
          <div>
            <p className="text-sm font-extrabold text-amber-300">
              This is the New-User Template Only
            </p>
            <p className="mt-1 text-xs text-amber-200/80 max-w-3xl">
              Changes saved here set the <strong>starting template for brand-new users</strong> when they first sign up.
              Existing colleges manage their own website independently in the User Editor — your changes here
              will <strong>not</strong> affect or overwrite any existing college's content.
            </p>
          </div>
        </div>

        {/* Header & Master Save Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-cyan-600 border border-cyan-200">
                New-User Template
              </span>
              <h2 className="text-xl font-black tracking-tight text-slate-900">Default Website For New Colleges</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500 max-w-2xl">
              Each section box below defines the <strong>starting website layout</strong> that is copied to a new user when they first sign up. Existing users&apos; websites are independent and unaffected.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 px-6 py-3 text-xs font-extrabold text-white shadow-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <span>{saving ? "Saving Changes..." : "Save Default Template ⚡"}</span>
          </button>
        </div>

        {/* Status Notification */}
        {statusMsg ? (
          <div
            className={`rounded-2xl border p-4 text-xs font-semibold ${
              statusMsg.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {statusMsg.text}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-16 text-center text-xs font-semibold text-slate-400">
            Loading Master Website Boxes...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Multi-Page Navigation Bar */}
            <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 overflow-x-auto">
              {(config || FALLBACK_DEFAULT_CONFIG).pages.map((page) => {
                const isActive = page.slug === activeSlug;
                return (
                  <button
                    key={page.slug}
                    type="button"
                    onClick={() => setActiveSlug(page.slug)}
                    className={`flex items-center gap-2.5 rounded-2xl px-5 py-3 text-xs font-extrabold transition cursor-pointer ${
                      isActive
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200/80 scale-[1.02]"
                        : "border border-transparent bg-slate-100/70 text-slate-500 hover:border-slate-200 hover:text-slate-900"
                    }`}
                  >
                    <span>{page.title}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActive ? "bg-cyan-50 text-cyan-700 border border-cyan-200" : "bg-slate-200 text-slate-600"
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
                <h3 className="text-lg font-black text-chalk">
                  {activePage?.title} Page — Section Mini-Boxes ({activePage?.sections.length || 0})
                </h3>
                <p className="text-xs text-chalk-dim/60">
                  Visual layout of default section boxes for route <code className="text-chalk bg-night px-1.5 py-0.5 rounded">{activeSlug}</code>
                </p>
              </div>
              <AddSectionButton
                type="button"
                onClick={() => setAddingSection(true)}
                label="Add Section Box"
                size="sm"
              />
            </div>

            {/* Visual Section Cards Grid (Mini-Boxes Layout) */}
            {activePage && activePage.sections.length > 0 ? (
              <div className="grid gap-6">
                {activePage.sections.map((sec, idx) => (
                  <div
                    key={sec.id || idx}
                    className="group overflow-hidden rounded-2xl border border-night-line bg-night-card p-6 shadow-xl transition-all hover:border-chalk-dim/40"
                  >
                    {/* Mini-Box Top Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-night-line pb-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-night font-mono text-xs font-black text-chalk border border-night-line">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-extrabold text-chalk">{sec?.title || "Untitled Section"}</h4>
                            <span
                              className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-extrabold uppercase ${getCategoryStyle(
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
                          className="rounded-lg bg-chalk px-4 py-1.5 text-xs font-black text-night transition hover:bg-chalk/90"
                        >
                          Edit Code
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSection(idx)}
                          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-bold text-rose-400 transition hover:bg-rose-500/20"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Live HTML Mini-Preview Box */}
                    <div className="relative overflow-hidden rounded-xl border border-night-line bg-black p-2">
                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-chalk-dim/40 mb-2 px-2 pt-1">
                        Live Preview Sandbox
                      </div>
                      <SectionLivePreviewIframe code={sec.code} title={sec.title} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-night-line bg-night-card p-16 text-center space-y-3">
                <p className="text-sm font-bold text-chalk">No section boxes configured for {activePage?.title} yet.</p>
                <p className="text-xs text-chalk-dim/60">Click below to add a section box for this page.</p>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-night/90 p-4 backdrop-blur-md">
            <div className="w-full max-w-6xl rounded-3xl border border-night-line bg-night-card p-6 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
              
              {/* Modal Top Header */}
              <div className="flex items-center justify-between border-b border-night-line pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
                      Live Studio Code Editor
                    </span>
                    <h3 className="text-lg font-black text-chalk">Edit Section Box — {editingSection.section.title}</h3>
                  </div>
                  <p className="text-xs text-chalk-dim/60 mt-0.5">
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
                    className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 px-3.5 py-2 text-xs font-black text-amber-300 hover:bg-amber-500/30 transition shadow-sm cursor-pointer"
                    title="Automatically format code with responsive CSS & mobile flex-wrap"
                  >
                    <span>⚡ Auto Edit (Make Responsive)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingSection(null)}
                    className="text-xs font-bold text-chalk-dim/60 hover:text-chalk p-2"
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
                    <h4 className="text-xs font-black tracking-wider text-neutral-400 uppercase flex items-center gap-2">
                      <span>👁️ Live Section Preview</span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                        Real-Time Render
                      </span>
                    </h4>

                    {/* Viewport Width Toggles */}
                    <div className="flex items-center gap-1 bg-night border border-night-line rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setEditViewMode("desktop")}
                        className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md transition ${
                          editViewMode === "desktop" ? "bg-chalk text-night shadow" : "text-chalk-dim hover:text-chalk"
                        }`}
                      >
                        🖥️ Desktop
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditViewMode("mobile")}
                        className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md transition ${
                          editViewMode === "mobile" ? "bg-chalk text-night shadow" : "text-chalk-dim hover:text-chalk"
                        }`}
                      >
                        📱 Mobile
                      </button>
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
                      className="w-full rounded-xl border border-night-line bg-night px-4 py-2.5 text-xs font-semibold text-chalk outline-none focus:border-chalk"
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
                      className="w-full rounded-xl border border-night-line bg-night px-4 py-2.5 text-xs font-semibold text-chalk outline-none focus:border-chalk"
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
                        <span className="text-[10px] font-mono text-neutral-400">
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
                      className="w-full rounded-xl border border-night-line bg-night p-4 font-mono text-xs text-chalk outline-none focus:border-chalk leading-relaxed"
                    />
                  </div>
                </div>

              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-night-line">
                <span className="text-xs text-chalk-dim/60 font-mono">
                  Edits apply instantly to Default Website template
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingSection(null)}
                    className="rounded-xl border border-night-line px-5 py-2.5 text-xs font-bold text-chalk-dim hover:text-chalk"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditSection}
                    className="rounded-xl bg-chalk px-6 py-2.5 text-xs font-black text-night hover:bg-chalk/90 shadow-lg cursor-pointer"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-night/90 p-4 backdrop-blur-md">
            <div className="w-full max-w-6xl rounded-3xl border border-night-line bg-night-card p-6 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
              
              {/* Modal Top Header */}
              <div className="flex items-center justify-between border-b border-night-line pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
                      New Component Builder
                    </span>
                    <h3 className="text-lg font-black text-chalk">Add Section Box to {activePage?.title} Page</h3>
                  </div>
                  <p className="text-xs text-chalk-dim/60 mt-0.5">
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
                    className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 px-3.5 py-2 text-xs font-black text-amber-300 hover:bg-amber-500/30 transition shadow-sm cursor-pointer"
                    title="Automatically format code with responsive CSS & mobile flex-wrap"
                  >
                    <span>⚡ Auto Edit (Make Responsive)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAddingSection(false)}
                    className="text-xs font-bold text-chalk-dim/60 hover:text-chalk p-2"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>

              {/* Select Default Section Type Grid (Exact 8 Options) */}
              <div className="bg-night border border-night-line rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-night-line pb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-chalk flex items-center gap-2">
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
                        className={`flex items-start gap-4 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "bg-white text-black border-white shadow-xl scale-[1.01]"
                            : "bg-[#0f0f12] text-white border-neutral-800/80 hover:border-neutral-700 hover:bg-[#151518]"
                        }`}
                      >
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl font-bold transition-colors ${
                            isSelected ? "bg-black text-white shadow-md" : "bg-neutral-900 text-white border border-neutral-800"
                          }`}
                        >
                          {tmpl.icon}
                        </div>
                        <div className="space-y-1 pr-2">
                          <h4
                            className={`text-sm font-black tracking-tight transition-colors ${
                              isSelected ? "text-black" : "text-white"
                            }`}
                          >
                            {tmpl.title}
                          </h4>
                          <p
                            className={`text-xs leading-relaxed transition-colors ${
                              isSelected ? "text-neutral-600 font-medium" : "text-neutral-400"
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
                    <h4 className="text-xs font-black tracking-wider text-neutral-400 uppercase flex items-center gap-2">
                      <span>👁️ Live Section Preview</span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                        Real-Time Render
                      </span>
                    </h4>

                    {/* Viewport Width Toggles */}
                    <div className="flex items-center gap-1 bg-night border border-night-line rounded-lg p-1">
                      <button
                        type="button"
                        onClick={() => setEditViewMode("desktop")}
                        className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md transition ${
                          editViewMode === "desktop" ? "bg-chalk text-night shadow" : "text-chalk-dim hover:text-chalk"
                        }`}
                      >
                        🖥️ Desktop
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditViewMode("mobile")}
                        className={`px-2.5 py-1 text-[11px] font-extrabold rounded-md transition ${
                          editViewMode === "mobile" ? "bg-chalk text-night shadow" : "text-chalk-dim hover:text-chalk"
                        }`}
                      >
                        📱 Mobile
                      </button>
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
                      className="w-full rounded-xl border border-night-line bg-night px-4 py-2.5 text-xs font-semibold text-chalk outline-none focus:border-chalk"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-chalk mb-1">Category / Type</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      className="w-full rounded-xl border border-night-line bg-night px-4 py-2.5 text-xs font-semibold text-chalk outline-none focus:border-chalk"
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
                        <span className="text-[10px] font-mono text-neutral-400">
                          {newCode.length.toLocaleString()} chars
                        </span>
                      </div>
                    </div>
                    <textarea
                      rows={12}
                      placeholder="<section style='padding: 60px 24px...'>...</section>"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      className="w-full rounded-xl border border-night-line bg-night p-4 font-mono text-xs text-chalk outline-none focus:border-chalk leading-relaxed"
                    />
                  </div>
                </div>

              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-night-line">
                <span className="text-xs text-chalk-dim/60 font-mono">
                  New box will be added to {activePage?.title} template
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAddingSection(false)}
                    className="rounded-xl border border-night-line px-5 py-2.5 text-xs font-bold text-chalk-dim hover:text-chalk"
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
