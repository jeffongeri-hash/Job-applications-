/**
 * Local profile store backed by localStorage.
 * Syncs to job-ops RxResume profile where possible.
 */

export interface WorkExperience {
  id: string;
  company: string;
  title: string;
  location?: string;
  startDate: string;       // "YYYY-MM"
  endDate?: string;        // "YYYY-MM" or undefined = present
  current: boolean;
  description: string;
  technologies?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  grade?: string;
  notes?: string;
}

export interface Skill {
  id: string;
  name: string;
  level: "beginner" | "intermediate" | "advanced" | "expert";
  category: string;
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  summary?: string;
  nationality?: string;
  rightToWork?: string;   // e.g. "UK citizen", "Requires sponsorship"
}

export interface SearchPreferences {
  keywords: string[];
  locations: string[];
  remotePreference: "any" | "remote" | "hybrid" | "onsite";
  jobTypes: ("full_time" | "part_time" | "contract" | "internship")[];
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  experienceLevels: ("entry" | "mid" | "senior" | "lead")[];
  companySizes: ("startup" | "mid" | "enterprise")[];
  blacklistedKeywords: string[];
  blacklistedCompanies: string[];
  requireSponsor: boolean;
  requireVisaSupport: boolean;
}

export interface AutoApplySettings {
  enabled: boolean;
  requireReview: boolean;        // pause for human review before submitting
  coverLetterEnabled: boolean;
  coverLetterStyle: "formal" | "casual" | "concise";
  autoSkipBelow: number;         // score threshold
  maxDailyApplications: number;
  excludeStatuses: string[];
  customAnswers: { question: string; answer: string }[];
}

export interface ResumeFile {
  name: string;
  uploadedAt: number;
  dataUrl?: string;   // base64 for preview
  rxresumeId?: string;
}

export interface Profile {
  personal: PersonalInfo;
  experience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  searchPrefs: SearchPreferences;
  autoApply: AutoApplySettings;
  resume?: ResumeFile;
  lastUpdated: number;
}

const KEY = "jobops_profile_v1";

export const DEFAULT_PROFILE: Profile = {
  personal: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
    summary: "",
    rightToWork: "",
  },
  experience: [],
  education: [],
  skills: [],
  searchPrefs: {
    keywords: [],
    locations: [],
    remotePreference: "any",
    jobTypes: ["full_time"],
    salaryCurrency: "GBP",
    experienceLevels: ["mid", "senior"],
    companySizes: ["startup", "mid", "enterprise"],
    blacklistedKeywords: [],
    blacklistedCompanies: [],
    requireSponsor: false,
    requireVisaSupport: false,
  },
  autoApply: {
    enabled: false,
    requireReview: true,
    coverLetterEnabled: true,
    coverLetterStyle: "formal",
    autoSkipBelow: 65,
    maxDailyApplications: 10,
    excludeStatuses: [],
    customAnswers: [],
  },
  lastUpdated: 0,
};

export function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT_PROFILE);
    return { ...structuredClone(DEFAULT_PROFILE), ...JSON.parse(raw) };
  } catch {
    return structuredClone(DEFAULT_PROFILE);
  }
}

export function saveProfile(profile: Profile): void {
  profile.lastUpdated = Date.now();
  localStorage.setItem(KEY, JSON.stringify(profile));
}

export function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Build a plain-text resume summary from the profile for AI prompts */
export function buildResumeText(profile: Profile): string {
  const p = profile.personal;
  const lines: string[] = [];

  lines.push(`# ${p.fullName}`);
  if (p.email) lines.push(`Email: ${p.email}`);
  if (p.phone) lines.push(`Phone: ${p.phone}`);
  if (p.location) lines.push(`Location: ${p.location}`);
  if (p.rightToWork) lines.push(`Right to work: ${p.rightToWork}`);
  if (p.linkedinUrl) lines.push(`LinkedIn: ${p.linkedinUrl}`);
  if (p.summary) lines.push(`\n## Summary\n${p.summary}`);

  if (profile.experience.length) {
    lines.push("\n## Experience");
    profile.experience.forEach((e) => {
      lines.push(`\n### ${e.title} at ${e.company} (${e.startDate} – ${e.current ? "Present" : e.endDate})`);
      if (e.location) lines.push(`Location: ${e.location}`);
      lines.push(e.description);
      if (e.technologies) lines.push(`Technologies: ${e.technologies}`);
    });
  }

  if (profile.education.length) {
    lines.push("\n## Education");
    profile.education.forEach((e) => {
      lines.push(`\n### ${e.degree} in ${e.field} — ${e.institution} (${e.startDate} – ${e.current ? "Present" : e.endDate})`);
      if (e.grade) lines.push(`Grade: ${e.grade}`);
    });
  }

  if (profile.skills.length) {
    lines.push("\n## Skills");
    const byCategory = profile.skills.reduce<Record<string, string[]>>((acc, s) => {
      (acc[s.category] = acc[s.category] ?? []).push(s.name);
      return acc;
    }, {});
    Object.entries(byCategory).forEach(([cat, skills]) => {
      lines.push(`${cat}: ${skills.join(", ")}`);
    });
  }

  return lines.join("\n");
}
