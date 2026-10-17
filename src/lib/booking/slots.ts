import { DURATION_MINUTES, GRID_MINUTES, type DayOverride, type TimeRange, type WeeklyRange } from "./rules";
import { addDays, isoWeekday, localDay, localParts, localTimeToInstant, type Day } from "./time";

// Computation of the free slots (docs/booking.md, "Calcul des créneaux"). A pure function: the
// same rules are checked again by the database when a visitor books (book_public_slot).
//
// - Slots start on a 30-minute grid inside the ranges of the day, and end before the end of the
//   range. The ranges are those of the special day, if there is one, else of the weekday.
// - A slot is removed when it overlaps a booking or the break after it, and when it would not leave
//   its own break before the next booking.
// - Right after a booking, the next slot starts at the end of its break, even off the grid.
// - Removed too: slots before the notice, beyond the horizon, and every slot of a day that reached
//   its limit.
// - Hours are local times of the owner's time zone, changes of time included.

const MINUTE = 60_000;

// A confirmed booking, without its guest: from its start to the end of its break.
export type BusyPeriod = { start: Date; end: Date };

export type AvailabilityRules = {
  timeZone: string;
  bufferMinutes: number;
  noticeMinutes: number;
  horizonDays: number;
  dailyLimit: number | null;
  weekly: WeeklyRange[];
  overrides: DayOverride[];
  busy: BusyPeriod[];
};

// The ranges of a day of the owner: those of the special day, else those of the weekday.
export function rangesOfDay(rules: Pick<AvailabilityRules, "weekly" | "overrides">, day: Day): TimeRange[] {
  const override = rules.overrides.find((o) => o.day === day);
  if (override) return override.ranges;
  const weekday = isoWeekday(day);
  return rules.weekly.filter((range) => range.weekday === weekday);
}

// Whether a day has hours at all in the week ("Fermé" otherwise), special days aside.
export function isOpenWeekday(rules: Pick<AvailabilityRules, "weekly">, day: Day) {
  const weekday = isoWeekday(day);
  return rules.weekly.some((range) => range.weekday === weekday);
}

// The free slots, as their start instants, in order.
export function computeSlots(rules: AvailabilityRules, now: Date): Date[] {
  const { timeZone, bufferMinutes } = rules;
  const earliest = now.getTime() + rules.noticeMinutes * MINUTE;
  const latest = now.getTime() + rules.horizonDays * 24 * 60 * MINUTE;
  const busy = rules.busy.map((b) => ({ start: b.start.getTime(), end: b.end.getTime() }));
  // Bookings per local day, for the limit.
  const perDay = new Map<Day, number>();
  for (const b of busy) {
    const day = localDay(b.start, timeZone);
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
  }

  const slots = new Set<number>();
  const firstDay = addDays(localDay(now, timeZone), -1);
  const lastDay = addDays(localDay(latest, timeZone), 1);
  for (let day = firstDay; day <= lastDay; day = addDays(day, 1)) {
    const ranges = rangesOfDay(rules, day);
    if (ranges.length === 0) continue;
    if (rules.dailyLimit !== null && (perDay.get(day) ?? 0) >= rules.dailyLimit) continue;

    const candidates: number[] = [];
    for (const range of ranges) {
      // The grid.
      for (let minute = range.start; minute + DURATION_MINUTES <= range.end; minute += GRID_MINUTES) {
        const instant = localTimeToInstant(day, minute, timeZone);
        if (instant !== null) candidates.push(instant);
      }
      // Right after a break, off the grid.
      for (const b of busy) {
        const local = localParts(b.end, timeZone);
        if (local.day !== day || local.second !== 0) continue;
        if (local.minute >= range.start && local.minute + DURATION_MINUTES <= range.end) candidates.push(b.end);
      }
    }

    for (const start of candidates) {
      if (start < earliest || start >= latest) continue;
      // The slot and its own break must not overlap any booking and its break.
      const end = start + (DURATION_MINUTES + bufferMinutes) * MINUTE;
      if (busy.some((b) => start < b.end && b.start < end)) continue;
      slots.add(start);
    }
  }
  return [...slots].sort((a, b) => a - b).map((t) => new Date(t));
}
