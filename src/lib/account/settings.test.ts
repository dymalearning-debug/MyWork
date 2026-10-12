import { describe, expect, it } from "vitest";

import {
  areValidProfileSettings,
  changeSummary,
  displayName,
  hasChanges,
  isProfileSettings,
  normalizeProfileSettings,
  type ProfileSettings,
} from "./settings";

const saved: ProfileSettings = { firstName: "Inès", lastName: "Robert", handle: "ines-robert" };

describe("normalizeProfileSettings", () => {
  it("trims the names and puts the handle in lowercase", () => {
    expect(normalizeProfileSettings({ firstName: "  Inès ", lastName: " ", handle: " Ines-Robert " })).toEqual({
      firstName: "Inès",
      lastName: "",
      handle: "ines-robert",
    });
  });
});

describe("areValidProfileSettings", () => {
  it("accepts empty names: they are optional", () => {
    expect(areValidProfileSettings({ firstName: "", lastName: "", handle: "ines-robert" })).toBe(true);
  });

  it("refuses a handle in the wrong format", () => {
    for (const handle of ["ir", "ines robert", "inès", "-ines", "a".repeat(31)]) {
      expect(areValidProfileSettings({ ...saved, handle }), handle).toBe(false);
    }
  });

  it("refuses names over 100 characters", () => {
    expect(areValidProfileSettings({ ...saved, firstName: "a".repeat(101) })).toBe(false);
    expect(areValidProfileSettings({ ...saved, lastName: "a".repeat(100) })).toBe(true);
  });
});

describe("isProfileSettings", () => {
  it("only accepts the three texts of the form", () => {
    expect(isProfileSettings(saved)).toBe(true);
    expect(isProfileSettings({ ...saved, handle: 3 })).toBe(false);
    expect(isProfileSettings({ firstName: "Inès" })).toBe(false);
    expect(isProfileSettings(null)).toBe(false);
  });
});

describe("hasChanges", () => {
  it("tells whether a field differs from the saved values", () => {
    expect(hasChanges(saved, { ...saved })).toBe(false);
    expect(hasChanges(saved, { ...saved, lastName: "Robert-Martin" })).toBe(true);
  });
});

describe("changeSummary", () => {
  it("names what changed, with the right agreement", () => {
    expect(changeSummary(saved, { ...saved, firstName: "Inés" })).toBe("Prénom modifié.");
    expect(changeSummary(saved, { ...saved, handle: "ines" })).toBe("Adresse du profil public modifiée.");
    expect(changeSummary(saved, { ...saved, firstName: "Jeanne", lastName: "Martin" })).toBe(
      "Prénom et nom modifiés.",
    );
    expect(changeSummary(saved, { firstName: "Jeanne", lastName: "Martin", handle: "jeanne-martin" })).toBe(
      "Prénom, nom et adresse du profil public modifiés.",
    );
  });

  it("is empty when nothing changed", () => {
    expect(changeSummary(saved, saved)).toBe("");
  });
});

describe("displayName", () => {
  it("is the first and last name, or the email address without them", () => {
    expect(displayName(saved, "ines@exemple.fr")).toBe("Inès Robert");
    expect(displayName({ firstName: "Inès", lastName: "" }, "ines@exemple.fr")).toBe("Inès");
    expect(displayName({ firstName: "", lastName: "" }, "ines@exemple.fr")).toBe("ines@exemple.fr");
  });
});
