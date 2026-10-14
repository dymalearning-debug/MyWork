import { formatDay, isValidYearMonth, compareYearMonth, today } from "./dates";
import { isValidUrl, normalizeUrl } from "./links";
import {
  AVAILABILITIES,
  DAILY_RATE_MAX,
  FEATURED_SKILLS_MAX,
  LIST_LIMITS,
  MAX_LENGTH,
  PROJECT_IMAGES_MAX,
  SECTION_IDS,
  WORK_MODES,
  type Availability,
  type ListName,
  type ProfileContent,
  type SectionId,
  type StoredProfile,
  type YearMonth,
} from "./types";

// Rules of the profile content (docs/profile.md, "Contenu"): cleaning, checks, what changed.
// Shared by "Mon profil" (in the browser) and the save action (on the server), which applies them
// again; the database checks the same limits once more.

export function emptyProfileContent(): ProfileContent {
  return {
    firstName: "",
    lastName: "",
    headline: "",
    location: "",
    photoUrl: null,
    contactEmail: "",
    phone: "",
    about: "",
    isFreelance: true,
    availability: "unspecified",
    availableFrom: null,
    workModes: [],
    travelZone: "",
    dailyRate: null,
    sectionOrder: [...SECTION_IDS],
    links: [],
    services: [],
    experiences: [],
    educations: [],
    certifications: [],
    projects: [],
    skills: [],
    languages: [],
    recommendations: [],
  };
}

// The editable part of a stored profile.
export function toProfileContent(stored: StoredProfile): ProfileContent {
  const content: Partial<StoredProfile> = { ...stored };
  delete content.handle;
  delete content.isOnline;
  delete content.hasContact;
  return content as ProfileContent;
}

// ——— Cleaning ———

// Line breaks are kept (texts without other formatting), spaces around are removed.
const clean = (text: string) => text.replace(/\r\n?/g, "\n").trim();
// One line: inner runs of spaces count as one.
const cleanLine = (text: string) => text.replace(/\s+/g, " ").trim();

const PHONE_PATTERN = /^[0-9 +.()-]{6,20}$/;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function isValidPhone(phone: string) {
  return PHONE_PATTERN.test(phone) && /\d/.test(phone);
}

export function isValidEmail(email: string) {
  return email.length <= MAX_LENGTH.contactEmail && EMAIL_PATTERN.test(email);
}

// "550", "550 €", " 1 200 " give 550 and 1200; anything else is not a daily rate.
export function parseDailyRate(input: string): number | null {
  const digits = input.replace(/[\s  €]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  return Number(digits);
}

function dedupe<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const value = key(item);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

const skillKey = (name: string) => name.toLocaleLowerCase("fr");

// Every section once, in the order chosen, the missing ones at the end in the default order.
export function normalizeSectionOrder(order: readonly string[]): SectionId[] {
  const known = order.filter((id): id is SectionId => (SECTION_IDS as readonly string[]).includes(id));
  return dedupe([...known, ...SECTION_IDS], (id) => id);
}

function normalizeSkillNames(names: string[]) {
  return dedupe(names.map(cleanLine).filter(Boolean), skillKey);
}

// What the user typed, cleaned up before the checks and the save. Fields that no longer apply are
// emptied (the end of a current position, the date of an availability that has none).
export function normalizeProfileContent(content: ProfileContent): ProfileContent {
  const experiences = content.experiences.map((experience) => ({
    ...experience,
    title: cleanLine(experience.title),
    company: cleanLine(experience.company),
    location: cleanLine(experience.location),
    end: experience.isCurrent ? null : experience.end,
    description: clean(experience.description),
    skills: normalizeSkillNames(experience.skills),
  }));
  const projects = content.projects.map((project) => ({
    ...project,
    name: cleanLine(project.name),
    description: clean(project.description),
    end: project.isCurrent ? null : project.end,
    url: normalizeUrl(project.url),
    experienceId:
      project.experienceId && experiences.some((experience) => experience.id === project.experienceId)
        ? project.experienceId
        : null,
    skills: normalizeSkillNames(project.skills),
  }));

  // A skill typed in an experience or a project is added to the list (docs/profile.md, "Compétences").
  const skills = dedupe(
    content.skills.map((skill) => ({ ...skill, name: cleanLine(skill.name) })).filter((skill) => skill.name),
    (skill) => skillKey(skill.name),
  );
  for (const name of [...experiences, ...projects].flatMap((item) => item.skills)) {
    if (!skills.some((skill) => skillKey(skill.name) === skillKey(name))) {
      skills.push({ id: crypto.randomUUID(), name, featured: false });
    }
  }

  const availability: Availability = (AVAILABILITIES as readonly string[]).includes(content.availability)
    ? content.availability
    : "unspecified";

  return {
    firstName: cleanLine(content.firstName),
    lastName: cleanLine(content.lastName),
    headline: cleanLine(content.headline),
    location: cleanLine(content.location),
    photoUrl: content.photoUrl || null,
    contactEmail: content.contactEmail.trim(),
    phone: cleanLine(content.phone),
    about: clean(content.about),
    isFreelance: content.isFreelance,
    availability,
    availableFrom: availability === "available_from" ? content.availableFrom || null : null,
    workModes: WORK_MODES.filter((mode) => content.workModes.includes(mode)),
    travelZone: cleanLine(content.travelZone),
    dailyRate: content.dailyRate,
    sectionOrder: normalizeSectionOrder(content.sectionOrder),
    links: content.links.map((link) => ({ ...link, url: normalizeUrl(link.url), label: cleanLine(link.label) })),
    services: content.services.map((service) => ({
      ...service,
      name: cleanLine(service.name),
      description: clean(service.description),
    })),
    experiences,
    educations: content.educations.map((education) => ({
      ...education,
      school: cleanLine(education.school),
      degree: cleanLine(education.degree),
      field: cleanLine(education.field),
      end: education.isCurrent ? null : education.end,
      description: clean(education.description),
    })),
    certifications: content.certifications.map((certification) => ({
      ...certification,
      name: cleanLine(certification.name),
      issuer: cleanLine(certification.issuer),
      credentialId: cleanLine(certification.credentialId),
      verificationUrl: normalizeUrl(certification.verificationUrl),
    })),
    projects,
    skills,
    languages: content.languages.map((language) => ({ ...language, name: cleanLine(language.name) })),
    recommendations: content.recommendations.map((recommendation) => ({
      ...recommendation,
      text: clean(recommendation.text),
      author: cleanLine(recommendation.author),
      authorRole: cleanLine(recommendation.authorRole),
      authorCompany: cleanLine(recommendation.authorCompany),
      authorUrl: normalizeUrl(recommendation.authorUrl),
    })),
  };
}

// ——— Checks ———

// A problem with a field: "experiences.<id>.title", "phone", "projects"… and what to do.
export type ContentIssue = { field: string; message: string };

const REQUIRED = "Champ obligatoire.";
const BAD_URL = "Adresse web invalide (http ou https).";
const BAD_DATE = "Année à 4 chiffres, entre 1900 et 2100.";
const END_BEFORE_START = "La fin précède le début.";

function tooLong(max: number) {
  return `${max.toLocaleString("fr-FR")} caractères au plus.`;
}

// Every problem of a cleaned content (normalizeProfileContent). Empty: it can be saved.
export function validateProfileContent(content: ProfileContent): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const add = (field: string, message: string) => issues.push({ field, message });
  const text = (field: string, value: string, max: number, required = false) => {
    if (required && !value) add(field, REQUIRED);
    else if (value.length > max) add(field, tooLong(max));
  };
  const url = (field: string, value: string, required = false) => {
    if (!value) {
      if (required) add(field, REQUIRED);
    } else if (!isValidUrl(value)) add(field, BAD_URL);
  };
  const date = (field: string, value: YearMonth | null, required = false) => {
    if (!value) {
      if (required) add(field, REQUIRED);
    } else if (!isValidYearMonth(value)) add(field, BAD_DATE);
  };
  const period = (prefix: string, start: YearMonth | null, end: YearMonth | null, startRequired = false) => {
    date(`${prefix}.start`, start, startRequired);
    date(`${prefix}.end`, end);
    if (start && end && isValidYearMonth(start) && isValidYearMonth(end) && compareYearMonth(end, start, "end") < 0) {
      add(`${prefix}.end`, END_BEFORE_START);
    }
  };

  text("firstName", content.firstName, MAX_LENGTH.name);
  text("lastName", content.lastName, MAX_LENGTH.name);
  text("headline", content.headline, MAX_LENGTH.headline);
  text("location", content.location, MAX_LENGTH.location);
  if (content.contactEmail && !isValidEmail(content.contactEmail)) add("contactEmail", "Adresse e-mail invalide.");
  if (content.phone && !isValidPhone(content.phone)) {
    add("phone", "6 à 20 caractères : chiffres, espaces, +, points, tirets et parenthèses.");
  }
  text("about", content.about, MAX_LENGTH.about);

  if (content.availability === "available_from" && !content.availableFrom) add("availableFrom", "Choisissez une date.");
  text("travelZone", content.travelZone, MAX_LENGTH.travelZone);
  if (content.dailyRate !== null && !(Number.isInteger(content.dailyRate) && content.dailyRate >= 1 && content.dailyRate <= DAILY_RATE_MAX)) {
    add("dailyRate", `Un montant entier en euros, jusqu'à ${DAILY_RATE_MAX.toLocaleString("fr-FR")}.`);
  }

  for (const list of Object.keys(LIST_LIMITS) as ListName[]) {
    if (content[list].length > LIST_LIMITS[list]) add(list, `${LIST_LIMITS[list]} au plus.`);
  }

  for (const link of content.links) url(`links.${link.id}.url`, link.url, true);
  for (const link of content.links) text(`links.${link.id}.label`, link.label, MAX_LENGTH.short);
  for (const service of content.services) {
    text(`services.${service.id}.name`, service.name, MAX_LENGTH.serviceName, true);
    text(`services.${service.id}.description`, service.description, MAX_LENGTH.serviceDescription);
  }
  for (const experience of content.experiences) {
    const prefix = `experiences.${experience.id}`;
    text(`${prefix}.title`, experience.title, MAX_LENGTH.short, true);
    text(`${prefix}.company`, experience.company, MAX_LENGTH.short);
    text(`${prefix}.location`, experience.location, MAX_LENGTH.short);
    period(prefix, experience.start, experience.end, true);
    text(`${prefix}.description`, experience.description, MAX_LENGTH.experienceDescription);
  }
  for (const education of content.educations) {
    const prefix = `educations.${education.id}`;
    text(`${prefix}.school`, education.school, MAX_LENGTH.short, true);
    text(`${prefix}.degree`, education.degree, MAX_LENGTH.short);
    text(`${prefix}.field`, education.field, MAX_LENGTH.short);
    period(prefix, education.start, education.end);
    text(`${prefix}.description`, education.description, MAX_LENGTH.educationDescription);
  }
  for (const certification of content.certifications) {
    const prefix = `certifications.${certification.id}`;
    text(`${prefix}.name`, certification.name, MAX_LENGTH.short, true);
    text(`${prefix}.issuer`, certification.issuer, MAX_LENGTH.short);
    text(`${prefix}.credentialId`, certification.credentialId, MAX_LENGTH.short);
    date(`${prefix}.issued`, certification.issued);
    date(`${prefix}.expires`, certification.expires);
    if (
      certification.issued &&
      certification.expires &&
      isValidYearMonth(certification.issued) &&
      isValidYearMonth(certification.expires) &&
      compareYearMonth(certification.expires, certification.issued, "end") < 0
    ) {
      add(`${prefix}.expires`, "L'expiration précède l'obtention.");
    }
    url(`${prefix}.verificationUrl`, certification.verificationUrl);
  }
  for (const project of content.projects) {
    const prefix = `projects.${project.id}`;
    text(`${prefix}.name`, project.name, MAX_LENGTH.short, true);
    text(`${prefix}.description`, project.description, MAX_LENGTH.projectDescription);
    period(prefix, project.start, project.end);
    url(`${prefix}.url`, project.url);
    if (project.images.length > PROJECT_IMAGES_MAX) add(`${prefix}.images`, `${PROJECT_IMAGES_MAX} images au plus.`);
  }
  for (const skill of content.skills) text(`skills.${skill.id}.name`, skill.name, MAX_LENGTH.skill, true);
  if (content.skills.filter((skill) => skill.featured).length > FEATURED_SKILLS_MAX) {
    add("featuredSkills", `${FEATURED_SKILLS_MAX} compétences phares au plus.`);
  }
  for (const language of content.languages) {
    text(`languages.${language.id}.name`, language.name, MAX_LENGTH.language, true);
  }
  for (const recommendation of content.recommendations) {
    const prefix = `recommendations.${recommendation.id}`;
    text(`${prefix}.text`, recommendation.text, MAX_LENGTH.recommendation, true);
    text(`${prefix}.author`, recommendation.author, MAX_LENGTH.short, true);
    text(`${prefix}.authorRole`, recommendation.authorRole, MAX_LENGTH.short);
    text(`${prefix}.authorCompany`, recommendation.authorCompany, MAX_LENGTH.short);
    url(`${prefix}.authorUrl`, recommendation.authorUrl);
    date(`${prefix}.date`, recommendation.date);
  }
  return issues;
}

// ——— What changed ———

// JSON with the keys of each object sorted: the database (jsonb) does not keep their order.
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

const same = (a: unknown, b: unknown) => stableStringify(a) === stableStringify(b);

export function hasContentChanges(saved: ProfileContent, current: ProfileContent) {
  return !same(saved, current);
}

type Noun = { one: string; many: string; feminine: boolean };

const LIST_NOUNS: Record<ListName, Noun> = {
  links: { one: "lien", many: "liens", feminine: false },
  services: { one: "prestation", many: "prestations", feminine: true },
  experiences: { one: "expérience", many: "expériences", feminine: true },
  educations: { one: "formation", many: "formations", feminine: true },
  certifications: { one: "certification", many: "certifications", feminine: true },
  projects: { one: "projet", many: "projets", feminine: false },
  skills: { one: "compétence", many: "compétences", feminine: true },
  languages: { one: "langue", many: "langues", feminine: true },
  recommendations: { one: "recommandation", many: "recommandations", feminine: true },
};

function counted(noun: Noun, count: number, verb: string) {
  const ending = `${noun.feminine ? "e" : ""}${count > 1 ? "s" : ""}`;
  return count > 1 ? `${count} ${noun.many} ${verb}${ending}` : `${noun.one} ${verb}${ending}`;
}

const HEADER_FIELDS = ["firstName", "lastName", "headline", "location"] as const;
const FREELANCE_FIELDS = ["isFreelance", "availability", "availableFrom", "workModes", "travelZone", "dailyRate"] as const;

// Detail of the notification after a save: "Expérience ajoutée, photo modifiée." Three changes at
// most, then "…". Empty when nothing changed.
export function contentChangeSummary(saved: ProfileContent, next: ProfileContent) {
  const changes: string[] = [];
  if (saved.photoUrl !== next.photoUrl) {
    changes.push(!saved.photoUrl ? "photo ajoutée" : !next.photoUrl ? "photo retirée" : "photo modifiée");
  }
  if (HEADER_FIELDS.some((field) => saved[field] !== next[field])) changes.push("en-tête modifié");
  if (saved.contactEmail !== next.contactEmail || saved.phone !== next.phone) changes.push("coordonnées modifiées");
  if (saved.about !== next.about) changes.push("présentation modifiée");
  if (FREELANCE_FIELDS.some((field) => !same(saved[field], next[field]))) changes.push("offre freelance modifiée");
  if (!same(saved.sectionOrder, next.sectionOrder)) changes.push("ordre des sections modifié");

  for (const list of Object.keys(LIST_NOUNS) as ListName[]) {
    const before = new Map<string, unknown>(saved[list].map((item) => [item.id, item]));
    const after = new Map<string, unknown>(next[list].map((item) => [item.id, item]));
    const added = [...after.keys()].filter((id) => !before.has(id)).length;
    const removed = [...before.keys()].filter((id) => !after.has(id)).length;
    const modified = [...after.keys()].filter((id) => before.has(id) && !same(before.get(id), after.get(id))).length;
    const noun = LIST_NOUNS[list];
    if (added) changes.push(counted(noun, added, "ajouté"));
    if (modified) changes.push(counted(noun, modified, "modifié"));
    if (removed) changes.push(counted(noun, removed, "supprimé"));
    const keptOrder = (ids: string[], other: Map<string, unknown>) => ids.filter((id) => other.has(id));
    if (!added && !removed && !modified && !same(keptOrder([...before.keys()], after), keptOrder([...after.keys()], before))) {
      changes.push(`ordre des ${noun.many} modifié`);
    }
  }

  if (changes.length === 0) return "";
  const shown = changes.slice(0, 3).join(", ");
  const text = `${shown}${changes.length > 3 ? ", …" : "."}`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ——— Display ———

// What the header and the freelance box say about the availability. Once the date has passed,
// "Disponible". Nothing for "Non précisée".
export function availabilityText(
  content: Pick<ProfileContent, "isFreelance" | "availability" | "availableFrom">,
  now = new Date(),
): { text: string; available: boolean } | null {
  if (!content.isFreelance) return null;
  switch (content.availability) {
    case "available":
      return { text: "Disponible", available: true };
    case "available_from":
      if (!content.availableFrom || content.availableFrom <= today(now)) return { text: "Disponible", available: true };
      return { text: `Disponible à partir du ${formatDay(content.availableFrom, now)}`, available: true };
    case "unavailable":
      return { text: "Indisponible", available: false };
    default:
      return null;
  }
}

// "550 € HT / jour".
export function formatDailyRate(rate: number) {
  return `${rate.toLocaleString("fr-FR")} € HT / jour`;
}

// The name shown at the top of the public page: first and last name, or the handle without them.
export function profileDisplayName(profile: { firstName: string; lastName: string; handle: string }) {
  return `${profile.firstName} ${profile.lastName}`.trim() || profile.handle;
}

// Initials of the photo placeholder: "IR"; the first letter of the handle without a name.
export function profileInitials(profile: { firstName: string; lastName: string; handle: string }) {
  const initials = [profile.firstName, profile.lastName]
    .map((name) => name.trim().charAt(0))
    .join("")
    .toUpperCase();
  return initials || profile.handle.charAt(0).toUpperCase();
}

// Whether a section has something to show on the public page (an empty section does not appear).
export function isSectionFilled(content: ProfileContent, section: SectionId) {
  switch (section) {
    case "about":
      return !!content.about || content.skills.some((skill) => skill.featured);
    case "freelance":
      return (
        content.isFreelance &&
        (content.availability !== "unspecified" ||
          content.services.length > 0 ||
          content.workModes.length > 0 ||
          !!content.travelZone ||
          content.dailyRate !== null)
      );
    default:
      return content[section].length > 0;
  }
}
