import { dayParts } from "./format";
import type { DayOverride, TimeRange } from "./rules";
import { addDays, parseDay, type Day } from "./time";

// The special days of "Disponibilités", shown in groups: following days with the same hours make
// one line ("2 – 6 novembre · Indisponible").

export type OverrideGroup = { days: Day[]; ranges: TimeRange[] };

const sameRanges = (a: TimeRange[], b: TimeRange[]) =>
  a.length === b.length && a.every((range, i) => range.start === b[i].start && range.end === b[i].end);

export function groupOverrides(overrides: DayOverride[]): OverrideGroup[] {
  const sorted = [...overrides].sort((a, b) => a.day.localeCompare(b.day));
  const groups: OverrideGroup[] = [];
  for (const o of sorted) {
    const last = groups.at(-1);
    if (last && addDays(last.days.at(-1)!, 1) === o.day && sameRanges(last.ranges, o.ranges)) last.days.push(o.day);
    else groups.push({ days: [o.day], ranges: o.ranges });
  }
  return groups;
}

const month = (day: Day) => dayParts(day).monthYear.replace(/\s+\d{4}$/, "");

// "Jeu. 22 octobre", "2 – 6 novembre", "30 octobre – 3 novembre".
export function groupLabel(days: Day[]) {
  const first = days[0];
  const last = days.at(-1)!;
  if (days.length === 1) {
    const { shortWeekday, date } = dayParts(first);
    return `${shortWeekday.charAt(0).toUpperCase()}${shortWeekday.slice(1)} ${date === "1" ? "1er" : date} ${month(first)}`;
  }
  if (parseDay(first).month === parseDay(last).month) return `${parseDay(first).date} – ${parseDay(last).date} ${month(last)}`;
  return `${parseDay(first).date} ${month(first)} – ${parseDay(last).date} ${month(last)}`;
}
