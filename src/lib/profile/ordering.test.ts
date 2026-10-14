import { describe, expect, it } from "vitest";

import { groupExperiences, isExpired, sortCertifications, sortEducations, sortExperiences } from "./ordering";
import type { Certification, Education, Experience, YearMonth } from "./types";

const NOW = new Date("2026-10-13T10:00:00Z");
const ym = (year: number, month: number | null = null): YearMonth => ({ year, month });

function experience(id: string, fields: Partial<Experience>): Experience {
  return {
    id,
    title: id,
    company: "",
    location: "",
    employmentType: null,
    workMode: null,
    start: ym(2020),
    end: null,
    isCurrent: false,
    description: "",
    skills: [],
    ...fields,
  };
}

describe("sortExperiences", () => {
  it("puts current positions first, then the most recent", () => {
    const sorted = sortExperiences([
      experience("old", { start: ym(2016), end: ym(2019) }),
      experience("current", { start: ym(2024, 3), isCurrent: true }),
      experience("recent", { start: ym(2021, 9), end: ym(2024, 2) }),
      experience("older-current", { start: ym(2018, 1), isCurrent: true }),
    ]);
    expect(sorted.map((item) => item.id)).toEqual(["current", "older-current", "recent", "old"]);
  });
});

describe("groupExperiences", () => {
  it("groups positions in a row at the same company, with the total length", () => {
    const groups = groupExperiences(
      sortExperiences([
        experience("lead", { company: "Agence Mesa", start: ym(2018), end: ym(2019) }),
        experience("ux", { company: "agence mesa ", start: ym(2016), end: ym(2018) }),
        experience("freelance", { company: "Clinéo", start: ym(2021, 9), end: ym(2024, 2) }),
      ]),
      NOW,
    );
    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({ company: null, months: null });
    expect(groups[1].company).toBe("Agence Mesa");
    expect(groups[1].experiences.map((item) => item.id)).toEqual(["lead", "ux"]);
    expect(groups[1].months).toBe(48);
  });

  it("does not group positions without a company, nor positions apart", () => {
    const groups = groupExperiences(
      sortExperiences([
        experience("a", { company: "", start: ym(2024), isCurrent: true }),
        experience("b", { company: "", start: ym(2022), end: ym(2023) }),
      ]),
    );
    expect(groups).toHaveLength(2);
  });
});

describe("sortEducations", () => {
  it("puts ongoing ones first, then the most recent", () => {
    const education = (id: string, fields: Partial<Education>): Education => ({
      id,
      school: id,
      degree: "",
      field: "",
      start: null,
      end: null,
      isCurrent: false,
      description: "",
      ...fields,
    });
    const sorted = sortEducations([
      education("licence", { start: ym(2011), end: ym(2014) }),
      education("undated", {}),
      education("master", { start: ym(2014), end: ym(2016) }),
      education("mba", { start: ym(2025), isCurrent: true }),
    ]);
    expect(sorted.map((item) => item.id)).toEqual(["mba", "master", "licence", "undated"]);
  });
});

describe("certifications", () => {
  const certification = (id: string, fields: Partial<Certification>): Certification => ({
    id,
    name: id,
    issuer: "",
    credentialId: "",
    issued: null,
    expires: null,
    verificationUrl: "",
    ...fields,
  });

  it("go from the most recent to the oldest", () => {
    const sorted = sortCertifications([
      certification("a", { issued: ym(2020) }),
      certification("b", { issued: ym(2022, 10) }),
      certification("c", {}),
    ]);
    expect(sorted.map((item) => item.id)).toEqual(["b", "a", "c"]);
  });

  it("are expired once the expiry month has passed", () => {
    expect(isExpired(certification("a", { expires: ym(2024, 3) }), NOW)).toBe(true);
    expect(isExpired(certification("a", { expires: ym(2026, 10) }), NOW)).toBe(false);
    expect(isExpired(certification("a", {}), NOW)).toBe(false);
  });
});
