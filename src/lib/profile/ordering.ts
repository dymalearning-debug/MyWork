import { compareYearMonth, currentYearMonth, monthsBetween, type Period } from "./dates";
import type { Certification, Education, Experience, YearMonth } from "./types";

// Automatic order of the dated lists (docs/profile.md, "Ordre des sections"): ongoing first, then
// from the most recent to the oldest. Experiences of the same company in a row are grouped.

// Most recent first: ongoing, then by end, then by start. Undated items go last.
function compareByDate(a: Period, b: Period) {
  if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
  const aEnd = a.isCurrent ? null : (a.end ?? a.start);
  const bEnd = b.isCurrent ? null : (b.end ?? b.start);
  if (aEnd && bEnd) {
    const byEnd = compareYearMonth(bEnd, aEnd, "end");
    if (byEnd !== 0) return byEnd;
  } else if (aEnd || bEnd) {
    return aEnd ? -1 : 1;
  }
  if (a.start && b.start) return compareYearMonth(b.start, a.start);
  if (a.start || b.start) return a.start ? -1 : 1;
  return 0;
}

// Array.prototype.sort is stable: items with the same dates keep the order they were entered in.
export function sortExperiences(experiences: Experience[]) {
  return [...experiences].sort(compareByDate);
}

export function sortEducations(educations: Education[]) {
  return [...educations].sort(compareByDate);
}

export function sortCertifications(certifications: Certification[]) {
  return [...certifications].sort((a, b) => {
    if (a.issued && b.issued) return compareYearMonth(b.issued, a.issued);
    if (a.issued || b.issued) return a.issued ? -1 : 1;
    return 0;
  });
}

// A certification past its expiry date stays shown, with "Expirée en mars 2024".
export function isExpired(certification: Certification, now = new Date()) {
  return !!certification.expires && compareYearMonth(certification.expires, currentYearMonth(now), "end") < 0;
}

export type ExperienceGroup = {
  // The company, for a group of several positions; null for a position on its own.
  company: string | null;
  experiences: Experience[];
  // Total length of the group, from its first start to its last end (or today).
  months: number | null;
};

function companyKey(experience: Experience) {
  return experience.company.trim().toLocaleLowerCase("fr");
}

// Positions in a row at the same company (same name) are grouped under it, with the total length,
// as on LinkedIn. Expects experiences sorted by sortExperiences.
export function groupExperiences(sorted: Experience[], now = new Date()): ExperienceGroup[] {
  const groups: ExperienceGroup[] = [];
  for (const experience of sorted) {
    const last = groups[groups.length - 1];
    const key = companyKey(experience);
    if (last && key && companyKey(last.experiences[0]) === key) last.experiences.push(experience);
    else groups.push({ company: null, experiences: [experience], months: null });
  }
  for (const group of groups) {
    if (group.experiences.length < 2) continue;
    group.company = group.experiences[0].company.trim();
    group.months = totalMonths(group.experiences, now);
  }
  return groups;
}

function totalMonths(experiences: Experience[], now: Date) {
  const starts = experiences.map((experience) => experience.start).filter((start): start is YearMonth => !!start);
  if (starts.length === 0) return null;
  const first = starts.reduce((a, b) => (compareYearMonth(a, b) <= 0 ? a : b));
  const ends = experiences.map((experience) =>
    experience.isCurrent ? currentYearMonth(now) : (experience.end ?? experience.start),
  );
  const last = ends
    .filter((end): end is YearMonth => !!end)
    .reduce((a, b) => (compareYearMonth(a, b, "end") >= 0 ? a : b));
  return monthsBetween(first, last);
}
