// Profil module (docs/profile.md): the professional profile, filled in "Mon profil" and shown in the
// "Profil" tab of the public page. The same shape travels from the database functions
// (profile_content, save_own_profile) to the screens: no mapping layer in between.

// "mars 2022" or "2022": the year is required, the month is optional.
export type YearMonth = { year: number; month: number | null };

// Sections below the header, in the order chosen by hand (docs/profile.md, "Ordre des sections").
export const SECTION_IDS = [
  "about",
  "freelance",
  "experiences",
  "projects",
  "educations",
  "certifications",
  "skills",
  "languages",
  "recommendations",
] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export const SECTION_LABELS: Record<SectionId, string> = {
  about: "À propos",
  freelance: "Offre freelance",
  experiences: "Expériences",
  projects: "Projets",
  educations: "Formation",
  certifications: "Certifications",
  skills: "Compétences",
  languages: "Langues",
  recommendations: "Recommandations",
};

// On the public page, on a computer: the career at the left, boxes at the right.
export const RIGHT_COLUMN_SECTIONS: SectionId[] = ["freelance", "skills", "languages"];

export const AVAILABILITIES = ["unspecified", "available", "available_from", "unavailable"] as const;
export type Availability = (typeof AVAILABILITIES)[number];

export const WORK_MODES = ["remote", "onsite", "hybrid"] as const;
export type WorkMode = (typeof WORK_MODES)[number];
export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  remote: "À distance",
  onsite: "Sur site",
  hybrid: "Hybride",
};

export const EMPLOYMENT_TYPES = [
  "freelance",
  "permanent",
  "fixed_term",
  "internship",
  "apprenticeship",
  "temporary",
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  freelance: "Freelance",
  permanent: "CDI",
  fixed_term: "CDD",
  internship: "Stage",
  apprenticeship: "Alternance",
  temporary: "Intérim",
};

export const LANGUAGE_LEVELS = ["basic", "intermediate", "fluent", "bilingual", "native"] as const;
export type LanguageLevel = (typeof LANGUAGE_LEVELS)[number];
export const LANGUAGE_LEVEL_LABELS: Record<LanguageLevel, string> = {
  basic: "Notions",
  intermediate: "Intermédiaire",
  fluent: "Courant",
  bilingual: "Bilingue",
  native: "Langue maternelle",
};

export type ProfileLink = { id: string; url: string; label: string };
export type Service = { id: string; name: string; description: string };
export type Experience = {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: EmploymentType | null;
  workMode: WorkMode | null;
  start: YearMonth | null;
  end: YearMonth | null;
  isCurrent: boolean;
  description: string;
  skills: string[];
};
export type Education = {
  id: string;
  school: string;
  degree: string;
  field: string;
  start: YearMonth | null;
  end: YearMonth | null;
  isCurrent: boolean;
  description: string;
};
export type Certification = {
  id: string;
  name: string;
  issuer: string;
  credentialId: string;
  issued: YearMonth | null;
  // null: "N'expire pas".
  expires: YearMonth | null;
  verificationUrl: string;
};
export type Project = {
  id: string;
  name: string;
  description: string;
  start: YearMonth | null;
  end: YearMonth | null;
  isCurrent: boolean;
  url: string;
  experienceId: string | null;
  images: string[];
  skills: string[];
};
export type Skill = { id: string; name: string; featured: boolean };
export type Language = { id: string; name: string; level: LanguageLevel | null };
export type Recommendation = {
  id: string;
  text: string;
  author: string;
  authorRole: string;
  authorCompany: string;
  authorUrl: string;
  date: YearMonth | null;
};

// Everything "Mon profil" edits and saves at once. Empty texts are "".
export type ProfileContent = {
  firstName: string;
  lastName: string;
  headline: string;
  location: string;
  photoUrl: string | null;
  contactEmail: string;
  phone: string;
  about: string;
  isFreelance: boolean;
  availability: Availability;
  // YYYY-MM-DD, with "available_from" only.
  availableFrom: string | null;
  workModes: WorkMode[];
  travelZone: string;
  dailyRate: number | null;
  sectionOrder: SectionId[];
  links: ProfileLink[];
  services: Service[];
  experiences: Experience[];
  educations: Education[];
  certifications: Certification[];
  projects: Project[];
  skills: Skill[];
  languages: Language[];
  recommendations: Recommendation[];
};

// A profile as the database returns it. On the public page, contactEmail and phone are always
// empty: hasContact tells whether "Me contacter" has something to show.
export type StoredProfile = ProfileContent & { handle: string; isOnline: boolean; hasContact: boolean };

// Lists of the profile and their limits, a safeguard for the SaaS (same numbers as the database).
export const LIST_LIMITS = {
  links: 10,
  services: 10,
  experiences: 50,
  educations: 20,
  certifications: 30,
  projects: 30,
  skills: 50,
  languages: 10,
  recommendations: 20,
} as const;
export type ListName = keyof typeof LIST_LIMITS;

export const FEATURED_SKILLS_MAX = 5;
export const PROJECT_IMAGES_MAX = 5;

// Lengths of the texts, as in docs/profile.md (same numbers as the database).
export const MAX_LENGTH = {
  name: 100,
  headline: 100,
  location: 100,
  contactEmail: 254,
  about: 2600,
  travelZone: 100,
  serviceName: 80,
  serviceDescription: 500,
  short: 100,
  experienceDescription: 2000,
  educationDescription: 1000,
  projectDescription: 2000,
  skill: 50,
  language: 50,
  recommendation: 1500,
  url: 500,
} as const;

export const DAILY_RATE_MAX = 100000;
