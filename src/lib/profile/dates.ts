import type { YearMonth } from "./types";

// Dates of the profile (docs/profile.md, "Contenu"): the year is required, the month optional.
// "mars 2022", "2022", "mars 2022 – aujourd'hui · 2 ans 8 mois".

export const MONTH_NAMES = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

const SHORT_MONTH_NAMES = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

export const YEAR_MIN = 1900;
export const YEAR_MAX = 2100;

export function isValidYearMonth(value: YearMonth) {
  return (
    Number.isInteger(value.year) &&
    value.year >= YEAR_MIN &&
    value.year <= YEAR_MAX &&
    (value.month === null || (Number.isInteger(value.month) && value.month >= 1 && value.month <= 12))
  );
}

// "mars 2022" (short month names, as on LinkedIn), or "2022".
export function formatYearMonth(value: YearMonth, { long = false } = {}) {
  if (value.month === null) return String(value.year);
  return `${(long ? MONTH_NAMES : SHORT_MONTH_NAMES)[value.month - 1]} ${value.year}`;
}

// The month we are in, in France.
export function currentYearMonth(now = new Date()): YearMonth {
  const [year, month] = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "numeric" })
    .formatToParts(now)
    .filter((part) => part.type === "year" || part.type === "month")
    .map((part) => Number(part.value));
  return { year, month };
}

// Today, in France: YYYY-MM-DD.
export function today(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(now);
}

// For sorting: a missing month counts as January at the start of a period, December at its end.
function monthIndex(value: YearMonth, edge: "start" | "end") {
  return value.year * 12 + ((value.month ?? (edge === "start" ? 1 : 12)) - 1);
}

export function compareYearMonth(a: YearMonth, b: YearMonth, edge: "start" | "end" = "start") {
  return monthIndex(a, edge) - monthIndex(b, edge);
}

// Number of months of a period, both months included (as on LinkedIn): March to October is 8 months.
export function monthsBetween(start: YearMonth, end: YearMonth) {
  return Math.max(1, monthIndex(end, "end") - monthIndex(start, "start") + 1);
}

// "2 ans 8 mois", "1 an", "5 mois".
export function formatDuration(months: number) {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years > 1 ? "ans" : "an"}`);
  if (rest > 0) parts.push(`${rest} mois`);
  return parts.join(" ");
}

export type Period = { start: YearMonth | null; end: YearMonth | null; isCurrent: boolean };

// "mars 2022 – aujourd'hui", "2014 – 2016", "2016", "En cours". Empty without any date.
export function formatPeriod({ start, end, isCurrent }: Period, { ongoing = "aujourd'hui" } = {}) {
  const to = isCurrent ? ongoing : end ? formatYearMonth(end) : null;
  if (!start) return to && isCurrent ? capitalize(ongoing) : (to ?? "");
  const from = formatYearMonth(start);
  if (!to || to === from) return from;
  return `${from} – ${to}`;
}

// "mars 2022 – aujourd'hui · 2 ans 8 mois": the period and its length, when it has a start.
export function formatPeriodWithDuration(period: Period, now = new Date()) {
  const text = formatPeriod(period);
  if (!period.start) return text;
  const end = period.isCurrent ? currentYearMonth(now) : period.end;
  if (!end) return text;
  return `${text} · ${formatDuration(monthsBetween(period.start, end))}`;
}

// "3 novembre", or "3 novembre 2027" when it is not this year.
export function formatDay(isoDate: string, now = new Date()) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const sameYear = year === currentYearMonth(now).year;
  return `${day === 1 ? "1er" : day} ${MONTH_NAMES[month - 1]}${sameYear ? "" : ` ${year}`}`;
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
