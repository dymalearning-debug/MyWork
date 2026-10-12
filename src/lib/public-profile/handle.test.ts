import { describe, expect, it } from "vitest";

import { isValidHandle, publicProfilePath } from "./handle";

describe("isValidHandle", () => {
  it("accepts lowercase letters, digits and dashes, 3 to 30 characters", () => {
    for (const handle of ["ines-robert", "ines-robert-2", "abc", "a".repeat(30), "2026"]) {
      expect(isValidHandle(handle), handle).toBe(true);
    }
  });

  it("refuses anything else", () => {
    for (const handle of [
      "ab",
      "j2",
      "a".repeat(31),
      "Ines-Robert",
      "inès-robert",
      "ines_robert",
      "ines.robert",
      "-ines",
      "ines-",
      "ines--robert",
      "ines robert",
      "favicon.ico",
      "",
    ]) {
      expect(isValidHandle(handle), handle).toBe(false);
    }
  });
});

describe("publicProfilePath", () => {
  it("is the handle at the root of the site", () => {
    expect(publicProfilePath("ines-robert")).toBe("/ines-robert");
  });
});
