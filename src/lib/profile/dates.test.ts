import { describe, expect, it } from "vitest";

import {
  currentYearMonth,
  formatDay,
  formatDuration,
  formatPeriod,
  formatPeriodWithDuration,
  formatYearMonth,
  isValidYearMonth,
  monthsBetween,
} from "./dates";

const NOW = new Date("2026-10-13T10:00:00Z");

describe("formatYearMonth", () => {
  it("writes the month when there is one", () => {
    expect(formatYearMonth({ year: 2022, month: 3 })).toBe("mars 2022");
    expect(formatYearMonth({ year: 2021, month: 9 })).toBe("sept. 2021");
    expect(formatYearMonth({ year: 2021, month: 9 }, { long: true })).toBe("septembre 2021");
    expect(formatYearMonth({ year: 2022, month: null })).toBe("2022");
  });
});

describe("isValidYearMonth", () => {
  it("needs a year between 1900 and 2100, and a month between 1 and 12", () => {
    expect(isValidYearMonth({ year: 2022, month: null })).toBe(true);
    expect(isValidYearMonth({ year: 2022, month: 12 })).toBe(true);
    expect(isValidYearMonth({ year: 22, month: null })).toBe(false);
    expect(isValidYearMonth({ year: 2022, month: 13 })).toBe(false);
    expect(isValidYearMonth({ year: Number.NaN, month: null })).toBe(false);
  });
});

describe("durations", () => {
  it("counts both months, as LinkedIn does", () => {
    expect(monthsBetween({ year: 2024, month: 3 }, { year: 2026, month: 10 })).toBe(32);
    expect(monthsBetween({ year: 2021, month: 9 }, { year: 2024, month: 2 })).toBe(30);
    expect(monthsBetween({ year: 2026, month: 5 }, { year: 2026, month: 5 })).toBe(1);
  });

  it("takes a year alone from January to December", () => {
    expect(monthsBetween({ year: 2016, month: null }, { year: 2019, month: null })).toBe(48);
  });

  it("is written in years and months", () => {
    expect(formatDuration(32)).toBe("2 ans 8 mois");
    expect(formatDuration(12)).toBe("1 an");
    expect(formatDuration(13)).toBe("1 an 1 mois");
    expect(formatDuration(5)).toBe("5 mois");
  });
});

describe("periods", () => {
  it("joins the start and the end, or today", () => {
    expect(formatPeriod({ start: { year: 2022, month: 3 }, end: null, isCurrent: true })).toBe("mars 2022 – aujourd'hui");
    expect(formatPeriod({ start: { year: 2014, month: null }, end: { year: 2016, month: null }, isCurrent: false })).toBe(
      "2014 – 2016",
    );
    expect(formatPeriod({ start: { year: 2016, month: null }, end: { year: 2016, month: null }, isCurrent: false })).toBe("2016");
    expect(formatPeriod({ start: null, end: null, isCurrent: true }, { ongoing: "en cours" })).toBe("En cours");
    expect(formatPeriod({ start: null, end: null, isCurrent: false })).toBe("");
  });

  it("adds the length of a dated period", () => {
    expect(formatPeriodWithDuration({ start: { year: 2024, month: 3 }, end: null, isCurrent: true }, NOW)).toBe(
      "mars 2024 – aujourd'hui · 2 ans 8 mois",
    );
    expect(
      formatPeriodWithDuration({ start: { year: 2021, month: 9 }, end: { year: 2024, month: 2 }, isCurrent: false }, NOW),
    ).toBe("sept. 2021 – févr. 2024 · 2 ans 6 mois");
  });
});

describe("today in France", () => {
  it("is the month and the day in Paris", () => {
    expect(currentYearMonth(new Date("2026-12-31T23:30:00Z"))).toEqual({ year: 2027, month: 1 });
  });

  it("writes a day, with the year when it is not this one", () => {
    expect(formatDay("2026-11-03", NOW)).toBe("3 novembre");
    expect(formatDay("2027-01-01", NOW)).toBe("1er janvier 2027");
  });
});
