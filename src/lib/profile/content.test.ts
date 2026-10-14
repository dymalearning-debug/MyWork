import { describe, expect, it } from "vitest";

import {
  availabilityText,
  contentChangeSummary,
  emptyProfileContent,
  formatDailyRate,
  hasContentChanges,
  isSectionFilled,
  isValidPhone,
  normalizeProfileContent,
  normalizeSectionOrder,
  parseDailyRate,
  profileDisplayName,
  profileInitials,
  validateProfileContent,
} from "./content";
import type { Experience, ProfileContent } from "./types";

const NOW = new Date("2026-10-13T10:00:00Z");

function content(fields: Partial<ProfileContent> = {}): ProfileContent {
  return { ...emptyProfileContent(), ...fields };
}

function experience(fields: Partial<Experience> = {}): Experience {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Product designer",
    company: "",
    location: "",
    employmentType: null,
    workMode: null,
    start: { year: 2022, month: 3 },
    end: null,
    isCurrent: true,
    description: "",
    skills: [],
    ...fields,
  };
}

describe("phone", () => {
  it("accepts digits, spaces, +, dots, dashes and brackets, 6 to 20 characters", () => {
    for (const phone of ["+33 6 12 34 56 78", "06.12.34.56.78", "(0)6-12-34", "123456"]) {
      expect(isValidPhone(phone), phone).toBe(true);
    }
    for (const phone of ["12345", "06 12 34 56 78 90 12 34", "06 12 AB", "+-()..", "tel:0612"]) {
      expect(isValidPhone(phone), phone).toBe(false);
    }
  });
});

describe("daily rate", () => {
  it("reads a whole amount in euros", () => {
    expect(parseDailyRate("550")).toBe(550);
    expect(parseDailyRate(" 1 200 € ")).toBe(1200);
    expect(parseDailyRate("550,50")).toBeNull();
    expect(parseDailyRate("")).toBeNull();
  });

  it("is shown per day, before tax", () => {
    expect(formatDailyRate(550)).toBe("550 € HT / jour");
    expect(formatDailyRate(1200).replace(/\s/g, " ")).toBe("1 200 € HT / jour");
  });

  it("is refused at 0 or above 100 000", () => {
    expect(validateProfileContent(content({ dailyRate: 0 }))).toEqual([expect.objectContaining({ field: "dailyRate" })]);
    expect(validateProfileContent(content({ dailyRate: 550 }))).toEqual([]);
  });
});

describe("availability", () => {
  it("says nothing when it is not given, or without the freelance offer", () => {
    expect(availabilityText(content(), NOW)).toBeNull();
    expect(availabilityText(content({ availability: "available", isFreelance: false }), NOW)).toBeNull();
  });

  it("gives the date, then « Disponible » once it has passed", () => {
    expect(availabilityText(content({ availability: "available_from", availableFrom: "2026-11-03" }), NOW)).toEqual({
      text: "Disponible à partir du 3 novembre",
      available: true,
    });
    expect(availabilityText(content({ availability: "available_from", availableFrom: "2026-10-13" }), NOW)?.text).toBe(
      "Disponible",
    );
    expect(availabilityText(content({ availability: "unavailable" }), NOW)).toEqual({
      text: "Indisponible",
      available: false,
    });
  });
});

describe("normalizeProfileContent", () => {
  it("trims the texts and keeps the line breaks", () => {
    const next = normalizeProfileContent(content({ firstName: "  Inès ", about: "  Ligne 1\r\nLigne 2  " }));
    expect(next.firstName).toBe("Inès");
    expect(next.about).toBe("Ligne 1\nLigne 2");
  });

  it("adds https:// to the links", () => {
    const next = normalizeProfileContent(content({ links: [{ id: "l", url: "malt.fr/ines", label: "" }] }));
    expect(next.links[0].url).toBe("https://malt.fr/ines");
  });

  it("empties what no longer applies", () => {
    const next = normalizeProfileContent(
      content({
        availability: "available",
        availableFrom: "2026-11-03",
        experiences: [experience({ isCurrent: true, end: { year: 2025, month: null } })],
      }),
    );
    expect(next.availableFrom).toBeNull();
    expect(next.experiences[0].end).toBeNull();
  });

  it("adds the skills typed in an experience to the list, once", () => {
    const next = normalizeProfileContent(
      content({
        skills: [{ id: "s", name: "Figma", featured: true }],
        experiences: [experience({ skills: ["figma", " Design system ", "design system"] })],
      }),
    );
    expect(next.experiences[0].skills).toEqual(["figma", "Design system"]);
    expect(next.skills.map((skill) => skill.name)).toEqual(["Figma", "Design system"]);
  });

  it("drops a project's experience that no longer exists", () => {
    const next = normalizeProfileContent(
      content({
        projects: [
          {
            id: "p",
            name: "Rivage",
            description: "",
            start: null,
            end: null,
            isCurrent: false,
            url: "",
            experienceId: "gone",
            images: [],
            skills: [],
          },
        ],
      }),
    );
    expect(next.projects[0].experienceId).toBeNull();
  });
});

describe("normalizeSectionOrder", () => {
  it("keeps every section once, the missing ones at the end", () => {
    expect(normalizeSectionOrder(["projects", "about", "projects", "unknown"])).toEqual([
      "projects",
      "about",
      "freelance",
      "experiences",
      "educations",
      "certifications",
      "skills",
      "languages",
      "recommendations",
    ]);
  });
});

describe("validateProfileContent", () => {
  it("accepts an empty profile: everything is optional", () => {
    expect(validateProfileContent(normalizeProfileContent(content()))).toEqual([]);
  });

  it("needs the required fields of a list item", () => {
    const issues = validateProfileContent(content({ experiences: [experience({ title: "", start: null })] }));
    expect(issues.map((issue) => issue.field)).toEqual([
      "experiences.11111111-1111-4111-8111-111111111111.title",
      "experiences.11111111-1111-4111-8111-111111111111.start",
    ]);
  });

  it("refuses an end before the start, a bad year, a bad address", () => {
    const issues = validateProfileContent(
      content({
        experiences: [experience({ isCurrent: false, start: { year: 2022, month: 3 }, end: { year: 2021, month: null } })],
        links: [{ id: "l", url: "https://exemple", label: "" }],
        educations: [
          {
            id: "e",
            school: "Strate",
            degree: "",
            field: "",
            start: { year: 214, month: null },
            end: null,
            isCurrent: false,
            description: "",
          },
        ],
      }),
    );
    expect(issues.map((issue) => issue.message)).toEqual([
      "Adresse web invalide (http ou https).",
      "La fin précède le début.",
      "Année à 4 chiffres, entre 1900 et 2100.",
    ]);
  });

  it("limits the lists and the featured skills", () => {
    const skills = Array.from({ length: 6 }, (_, index) => ({ id: `${index}`, name: `S${index}`, featured: true }));
    expect(validateProfileContent(content({ skills })).map((issue) => issue.field)).toEqual(["featuredSkills"]);
    const links = Array.from({ length: 11 }, (_, index) => ({ id: `${index}`, url: "https://exemple.fr", label: "" }));
    expect(validateProfileContent(content({ links })).map((issue) => issue.field)).toEqual(["links"]);
  });
});

describe("hasContentChanges", () => {
  it("ignores the order of the keys, which the database does not keep", () => {
    const saved = content({ experiences: [experience()] });
    const reordered = JSON.parse(JSON.stringify(saved, Object.keys(saved).sort())) as ProfileContent;
    reordered.experiences = [{ ...experience(), start: { month: 3, year: 2022 } as never }];
    expect(hasContentChanges(saved, reordered)).toBe(false);
    expect(hasContentChanges(saved, { ...saved, headline: "Designer" })).toBe(true);
  });
});

describe("contentChangeSummary", () => {
  it("says what was added, changed or removed, with the right agreement", () => {
    const saved = content({ photoUrl: "https://a/1.webp", experiences: [experience()] });
    expect(
      contentChangeSummary(saved, {
        ...saved,
        photoUrl: "https://a/2.webp",
        experiences: [...saved.experiences, experience({ id: "2" })],
      }),
    ).toBe("Photo modifiée, expérience ajoutée.");
    expect(contentChangeSummary(saved, { ...saved, experiences: [] })).toBe("Expérience supprimée.");
    expect(
      contentChangeSummary(content(), {
        ...content(),
        projects: ["a", "b"].map((id) => ({
          id,
          name: id,
          description: "",
          start: null,
          end: null,
          isCurrent: false,
          url: "",
          experienceId: null,
          images: [],
          skills: [],
        })),
      }),
    ).toBe("2 projets ajoutés.");
  });

  it("tells a new order apart", () => {
    const links = [
      { id: "a", url: "https://a.fr", label: "" },
      { id: "b", url: "https://b.fr", label: "" },
    ];
    expect(contentChangeSummary(content({ links }), content({ links: [links[1], links[0]] }))).toBe(
      "Ordre des liens modifié.",
    );
  });

  it("keeps three changes at most", () => {
    expect(
      contentChangeSummary(content(), content({ photoUrl: "https://a/1.webp", headline: "Designer", phone: "0612345678", about: "Bonjour" })),
    ).toBe("Photo ajoutée, en-tête modifié, coordonnées modifiées, …");
  });
});

describe("display", () => {
  it("shows the name, or the handle without one", () => {
    expect(profileDisplayName({ firstName: "Inès", lastName: "Robert", handle: "ines-robert" })).toBe("Inès Robert");
    expect(profileDisplayName({ firstName: "", lastName: "", handle: "ines-robert" })).toBe("ines-robert");
    expect(profileInitials({ firstName: "inès", lastName: "Robert", handle: "x" })).toBe("IR");
    expect(profileInitials({ firstName: "", lastName: "", handle: "ines-robert" })).toBe("I");
  });

  it("hides empty sections", () => {
    expect(isSectionFilled(content(), "about")).toBe(false);
    expect(isSectionFilled(content({ skills: [{ id: "s", name: "Figma", featured: true }] }), "about")).toBe(true);
    expect(isSectionFilled(content({ dailyRate: 550 }), "freelance")).toBe(true);
    expect(isSectionFilled(content({ dailyRate: 550, isFreelance: false }), "freelance")).toBe(false);
    expect(isSectionFilled(content({ experiences: [experience()] }), "experiences")).toBe(true);
  });
});
