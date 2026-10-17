import { describe, expect, it } from "vitest";

import { DEFAULT_WEEKLY } from "./rules";
import { computeSlots, type AvailabilityRules } from "./slots";
import { localParts, localTimeToInstant } from "./time";

// Calcul des créneaux (docs/booking.md): grid, break, slot after a break, notice, horizon, limit,
// special days, changes of time in March and October.

const PARIS = "Europe/Paris";
// Monday 19 October 2026, midnight in Paris (summer time, UTC+2).
const MONDAY = new Date("2026-10-18T22:00:00Z");

const rules = (changes: Partial<AvailabilityRules> = {}): AvailabilityRules => ({
  timeZone: PARIS,
  bufferMinutes: 15,
  noticeMinutes: 240,
  horizonDays: 60,
  dailyLimit: null,
  weekly: DEFAULT_WEEKLY,
  overrides: [],
  busy: [],
  ...changes,
});

// A booking of 30 minutes at a local time, with its break.
const booked = (day: string, time: string, buffer = 15) => {
  const [h, m] = time.split(":").map(Number);
  const start = localTimeToInstant(day, h * 60 + m, PARIS)!;
  return { start: new Date(start), end: new Date(start + (30 + buffer) * 60_000) };
};

// The slots of a local day, as "09:00".
const timesOn = (slots: Date[], day: string, timeZone = PARIS) =>
  slots
    .map((slot) => localParts(slot, timeZone))
    .filter((parts) => parts.day === day)
    .map(({ minute }) => `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`);

const FULL_DAY = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];

describe("computeSlots", () => {
  it("proposes the 30-minute grid inside the ranges, ending before their end", () => {
    const slots = computeSlots(rules(), MONDAY);
    expect(timesOn(slots, "2026-10-19")).toEqual(FULL_DAY);
    // Closed on the weekend.
    expect(timesOn(slots, "2026-10-24")).toEqual([]);
    expect(timesOn(slots, "2026-10-25")).toEqual([]);
  });

  it("removes a booked slot and its break, and opens the slot right after the break", () => {
    const slots = computeSlots(rules({ busy: [booked("2026-10-19", "09:00")] }), MONDAY);
    expect(timesOn(slots, "2026-10-19").slice(0, 4)).toEqual(["09:45", "10:00", "10:30", "11:00"]);
  });

  it("booking the slot after a break removes the next grid slot in turn", () => {
    const busy = [booked("2026-10-19", "09:00"), booked("2026-10-19", "09:45")];
    const slots = computeSlots(rules({ busy }), MONDAY);
    expect(timesOn(slots, "2026-10-19").slice(0, 3)).toEqual(["10:30", "11:00", "11:30"]);
  });

  it("keeps a slot only if it leaves its own break before the next booking", () => {
    const slots = computeSlots(rules({ busy: [booked("2026-10-19", "10:00")] }), MONDAY);
    expect(timesOn(slots, "2026-10-19").slice(0, 4)).toEqual(["09:00", "10:45", "11:00", "11:30"]);
  });

  it("without a break, the next slot follows the booking at once", () => {
    const slots = computeSlots(rules({ bufferMinutes: 0, busy: [booked("2026-10-19", "09:00", 0)] }), MONDAY);
    expect(timesOn(slots, "2026-10-19").slice(0, 2)).toEqual(["09:30", "10:00"]);
  });

  it("with a break of 30 minutes, the grid simply skips a slot", () => {
    const slots = computeSlots(rules({ bufferMinutes: 30, busy: [booked("2026-10-19", "09:00", 30)] }), MONDAY);
    expect(timesOn(slots, "2026-10-19").slice(0, 2)).toEqual(["10:00", "10:30"]);
  });

  it("respects the minimum notice", () => {
    // Monday, 10:10 in Paris: with 4 hours of notice, nothing before 14:10.
    const now = new Date("2026-10-19T08:10:00Z");
    expect(timesOn(computeSlots(rules(), now), "2026-10-19")).toEqual(["14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"]);
    expect(timesOn(computeSlots(rules({ noticeMinutes: 1440 }), now), "2026-10-20")[0]).toBe("10:30");
  });

  it("respects the horizon", () => {
    const slots = computeSlots(rules({ horizonDays: 14 }), MONDAY);
    const last = localParts(slots.at(-1)!, PARIS);
    expect(last.day).toBe("2026-10-30");
    expect(timesOn(slots, "2026-11-02")).toEqual([]);
  });

  it("closes a day that reached its limit", () => {
    const slots = computeSlots(rules({ dailyLimit: 1, busy: [booked("2026-10-19", "09:00")] }), MONDAY);
    expect(timesOn(slots, "2026-10-19")).toEqual([]);
    expect(timesOn(slots, "2026-10-20")).toEqual(FULL_DAY);
    // Under the limit, the day stays open.
    const two = computeSlots(rules({ dailyLimit: 2, busy: [booked("2026-10-19", "09:00")] }), MONDAY);
    expect(timesOn(two, "2026-10-19")[0]).toBe("09:45");
  });

  it("applies special days: unavailable, or their own hours", () => {
    const overrides = [
      { day: "2026-10-20", ranges: [] },
      { day: "2026-10-24", ranges: [{ start: 600, end: 720 }] },
    ];
    const slots = computeSlots(rules({ overrides }), MONDAY);
    expect(timesOn(slots, "2026-10-20")).toEqual([]);
    expect(timesOn(slots, "2026-10-24")).toEqual(["10:00", "10:30", "11:00", "11:30"]);
  });

  it("keeps the owner's local hours across the change of time in October", () => {
    const slots = computeSlots(rules(), MONDAY);
    // Friday 23 October, summer time (UTC+2); Monday 26 October, winter time (UTC+1).
    expect(slots.find((s) => localParts(s, PARIS).day === "2026-10-23")!.toISOString()).toBe("2026-10-23T07:00:00.000Z");
    expect(slots.find((s) => localParts(s, PARIS).day === "2026-10-26")!.toISOString()).toBe("2026-10-26T08:00:00.000Z");
  });

  it("proposes each repeated hour of the October night once", () => {
    const overrides = [{ day: "2026-10-25", ranges: [{ start: 120, end: 180 }] }];
    const now = new Date("2026-10-20T00:00:00Z");
    const slots = computeSlots(rules({ overrides, noticeMinutes: 60 }), now);
    expect(timesOn(slots, "2026-10-25")).toEqual(["02:00", "02:30"]);
  });

  it("skips the hour that does not exist in March", () => {
    // Sunday 29 March 2026: in Paris, clocks go from 2:00 straight to 3:00.
    const overrides = [{ day: "2026-03-29", ranges: [{ start: 60, end: 240 }] }];
    const now = new Date("2026-03-20T00:00:00Z");
    const slots = computeSlots(rules({ overrides, noticeMinutes: 60 }), now);
    expect(timesOn(slots, "2026-03-29")).toEqual(["01:00", "01:30", "03:00", "03:30"]);
    // Friday 27 March (UTC+1) and Monday 30 March (UTC+2), both at 9:00 in Paris.
    expect(slots.find((s) => localParts(s, PARIS).day === "2026-03-27")!.toISOString()).toBe("2026-03-27T08:00:00.000Z");
    expect(slots.find((s) => localParts(s, PARIS).day === "2026-03-30")!.toISOString()).toBe("2026-03-30T07:00:00.000Z");
  });

  it("computes the slots in the owner's time zone, whatever the visitor's", () => {
    const slots = computeSlots(rules(), MONDAY);
    // 9:00 in Paris is 3:00 in New York.
    expect(timesOn(slots, "2026-10-19", "America/New_York")[0]).toBe("03:00");
  });
});
