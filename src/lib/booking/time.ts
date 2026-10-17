import { TZDate } from "@date-fns/tz";

// Dates and time zones of the module (docs/booking.md, "Technique"): everything is stored in UTC;
// the owner's hours are local times of their time zone, turned into instants day by day, so that
// "9:00" stays 9:00 across the changes of time.

// A calendar day, "yyyy-MM-dd", with no time zone.
export type Day = string;

const pad = (n: number) => String(n).padStart(2, "0");

export function dayOf(year: number, month: number, date: number): Day {
  // Through UTC: plain calendar arithmetic, never shifted by a change of time.
  const d = new Date(Date.UTC(year, month - 1, date));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function parseDay(day: Day) {
  const [year, month, date] = day.split("-").map(Number);
  return { year, month, date };
}

export function addDays(day: Day, days: number): Day {
  const { year, month, date } = parseDay(day);
  return dayOf(year, month, date + days);
}

// 1 (Monday) to 7 (Sunday).
export function isoWeekday(day: Day) {
  const { year, month, date } = parseDay(day);
  const weekday = new Date(Date.UTC(year, month - 1, date)).getUTCDay();
  return weekday === 0 ? 7 : weekday;
}

// The Monday of the week of a day.
export function weekStart(day: Day): Day {
  return addDays(day, 1 - isoWeekday(day));
}

// The local day and minute of an instant in a time zone.
export function localParts(instant: Date | number, timeZone: string) {
  const z = new TZDate(typeof instant === "number" ? instant : instant.getTime(), timeZone);
  return {
    day: dayOf(z.getFullYear(), z.getMonth() + 1, z.getDate()),
    minute: z.getHours() * 60 + z.getMinutes(),
    second: z.getSeconds() + z.getMilliseconds(),
  };
}

export const localDay = (instant: Date | number, timeZone: string) => localParts(instant, timeZone).day;

// The instant of a local time ("the day, at 9:00, in Paris"). null when that time does not exist
// that day (the hour skipped in March).
export function localTimeToInstant(day: Day, minute: number, timeZone: string): number | null {
  const { year, month, date } = parseDay(day);
  const instant = new TZDate(year, month - 1, date, Math.floor(minute / 60), minute % 60, timeZone).getTime();
  const back = localParts(instant, timeZone);
  return back.day === day && back.minute === minute ? instant : null;
}

// Whether the runtime knows a time zone.
export function isKnownTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("fr-FR", { timeZone });
    return true;
  } catch {
    return false;
  }
}

// The time zones of the list "Fuseau horaire".
export function timeZoneList(): string[] {
  const zones = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
  return zones.includes("UTC") ? zones : [...zones, "UTC"];
}
