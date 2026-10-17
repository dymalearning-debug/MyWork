import { addDays, localDay, parseDay, type Day } from "./time";

// How dates and hours of the module read (docs/booking.md): "10:30 – 11:00", "Mardi 20 octobre",
// "Heure de Paris". Always in a given time zone: the visitor's for them, the owner's for the owner.

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

// Formatters are costly to build: one per set of options and time zone.
const formatters = new Map<string, Intl.DateTimeFormat>();
function formatter(timeZone: string, options: Intl.DateTimeFormatOptions) {
  const key = `${timeZone}|${JSON.stringify(options)}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat("fr-FR", { ...options, timeZone });
    formatters.set(key, f);
  }
  return f;
}

// A calendar day, formatted as itself (at noon UTC, read in UTC: never shifted).
const dayAsDate = (day: Day) => {
  const { year, month, date } = parseDay(day);
  return new Date(Date.UTC(year, month - 1, date, 12));
};

// "10:30".
export function formatTime(instant: Date, timeZone: string) {
  return formatter(timeZone, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(instant);
}

// "10:30 – 11:00".
export function formatTimeRange(start: Date, end: Date, timeZone: string) {
  return `${formatTime(start, timeZone)} – ${formatTime(end, timeZone)}`;
}

// "Mardi 20 octobre", of a day.
export function formatDay(day: Day, { year = false }: { year?: boolean } = {}) {
  const text = formatter("UTC", { weekday: "long", day: "numeric", month: "long", ...(year && { year: "numeric" }) }).format(
    dayAsDate(day),
  );
  return capitalize(text.replace(/\b1 /, "1er "));
}

// "Mardi 20 octobre", of an instant in a time zone.
export const formatDate = (instant: Date, timeZone: string, options?: { year?: boolean }) =>
  formatDay(localDay(instant, timeZone), options);

// "mar. 20 oct.", for the subjects of the emails.
export function formatShortDate(instant: Date, timeZone: string) {
  return formatter(timeZone, { weekday: "short", day: "numeric", month: "short" }).format(instant);
}

// The pieces of a day, for the ticket and the columns of the week: "mardi", "20", "octobre 2026",
// "mar.".
export function dayParts(day: Day) {
  const date = dayAsDate(day);
  return {
    weekday: formatter("UTC", { weekday: "long" }).format(date),
    shortWeekday: formatter("UTC", { weekday: "short" }).format(date),
    date: String(parseDay(day).date),
    monthYear: formatter("UTC", { month: "long", year: "numeric" }).format(date),
  };
}

// Heading of a day in "Mes rendez-vous": "Aujourd'hui · vendredi 16 octobre", "Demain · …", or
// "Lundi 19 octobre".
export function dayHeading(day: Day, today: Day) {
  const text = formatDay(day);
  if (day === today) return `Aujourd'hui · ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
  if (day === addDays(today, 1)) return `Demain · ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
  return text;
}

// "Semaine du 19 au 25 octobre", or "Du 26 octobre au 1er novembre" across two months.
export function weekLabel(monday: Day) {
  const sunday = addDays(monday, 6);
  const first = parseDay(monday);
  const last = parseDay(sunday);
  const month = (day: Day) => formatter("UTC", { month: "long" }).format(dayAsDate(day));
  const nth = (n: number) => (n === 1 ? "1er" : String(n));
  if (first.month === last.month) return `Semaine du ${nth(first.date)} au ${nth(last.date)} ${month(sunday)}`;
  return `Du ${nth(first.date)} ${month(monday)} au ${nth(last.date)} ${month(sunday)}`;
}

// "19 – 25 octobre" (mobile).
export function shortWeekLabel(monday: Day) {
  const sunday = addDays(monday, 6);
  const month = (day: Day) => formatter("UTC", { month: "long" }).format(dayAsDate(day));
  const first = parseDay(monday);
  const last = parseDay(sunday);
  if (first.month === last.month) return `${first.date} – ${last.date} ${month(sunday)}`;
  return `${first.date} ${month(monday)} – ${last.date} ${month(sunday)}`;
}

// French names of a few cities of the time zones; the others keep the name of their zone.
const CITY_NAMES: Record<string, string> = {
  Brussels: "Bruxelles",
  London: "Londres",
  Lisbon: "Lisbonne",
  Rome: "Rome",
  Berlin: "Berlin",
  Vienna: "Vienne",
  Athens: "Athènes",
  Warsaw: "Varsovie",
  Prague: "Prague",
  Copenhagen: "Copenhague",
  Stockholm: "Stockholm",
  Moscow: "Moscou",
  Algiers: "Alger",
  Casablanca: "Casablanca",
  Tunis: "Tunis",
  Dakar: "Dakar",
  Montreal: "Montréal",
  New_York: "New York",
  Los_Angeles: "Los Angeles",
  Mexico_City: "Mexico",
  Sao_Paulo: "São Paulo",
  Singapore: "Singapour",
  Tokyo: "Tokyo",
  Reunion: "La Réunion",
  Martinique: "Martinique",
  Guadeloupe: "Guadeloupe",
  Noumea: "Nouméa",
  Tahiti: "Tahiti",
};

// "Heure de Paris", "Heure de New York", "Heure UTC".
export function timeZoneLabel(timeZone: string) {
  if (timeZone === "UTC" || timeZone === "Etc/UTC") return "Heure UTC";
  const city = timeZone.split("/").at(-1) ?? timeZone;
  const name = CITY_NAMES[city] ?? city.replaceAll("_", " ");
  return /^[AEIOUÉ]/i.test(name) ? `Heure d'${name}` : `Heure de ${name}`;
}

// A countdown: "01:42:10", and "3 j 14:42:10" beyond a day.
export function formatCountdown(milliseconds: number) {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const clock = [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":");
  return days > 0 ? `${days} j ${clock}` : clock;
}
