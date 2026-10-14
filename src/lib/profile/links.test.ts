import { describe, expect, it } from "vitest";

import { isValidUrl, linkText, normalizeUrl, shortUrl, siteOf } from "./links";

describe("normalizeUrl", () => {
  it("adds https:// when it is missing", () => {
    expect(normalizeUrl(" linkedin.com/in/ines-robert ")).toBe("https://linkedin.com/in/ines-robert");
    expect(normalizeUrl("localhost:3000/x")).toBe("https://localhost:3000/x");
    expect(normalizeUrl("HTTP://exemple.fr")).toBe("http://exemple.fr");
    expect(normalizeUrl("")).toBe("");
  });

  it("leaves other schemes, which are then refused", () => {
    expect(normalizeUrl("javascript:alert(1)")).toBe("javascript:alert(1)");
    expect(isValidUrl(normalizeUrl("javascript:alert(1)"))).toBe(false);
    expect(isValidUrl(normalizeUrl("mailto:ines@exemple.fr"))).toBe(false);
  });
});

describe("isValidUrl", () => {
  it("accepts http and https addresses of a site", () => {
    expect(isValidUrl("https://ines-robert.fr")).toBe(true);
    expect(isValidUrl("http://exemple.fr/a?b=c")).toBe(true);
    expect(isValidUrl("https://exemple")).toBe(false);
    expect(isValidUrl("https://exemple .fr")).toBe(false);
  });
});

describe("siteOf", () => {
  it("recognizes known sites, with or without www and subdomains", () => {
    expect(siteOf("https://www.linkedin.com/in/ines")).toEqual({ key: "linkedin", name: "LinkedIn" });
    expect(siteOf("https://fr.linkedin.com/in/ines")).toMatchObject({ key: "linkedin" });
    expect(siteOf("https://github.com/ines")).toMatchObject({ key: "github", name: "GitHub" });
    expect(siteOf("https://www.malt.fr/profile/ines")).toMatchObject({ key: "malt", name: "Malt" });
    expect(siteOf("https://twitter.com/ines")).toMatchObject({ key: "x" });
    expect(siteOf("https://ines.substack.com")).toMatchObject({ key: "substack" });
  });

  it("falls back to a globe and the address of the site", () => {
    expect(siteOf("https://www.ines-robert.fr/portfolio")).toEqual({ key: "globe", name: "ines-robert.fr" });
    // Not fooled by a lookalike domain.
    expect(siteOf("https://notlinkedin.com")).toMatchObject({ key: "globe" });
  });
});

describe("linkText and shortUrl", () => {
  it("show the label, or the name of the site", () => {
    expect(linkText({ url: "https://malt.fr/profile/ines", label: "" })).toBe("Malt");
    expect(linkText({ url: "https://malt.fr/profile/ines", label: " Mon Malt " })).toBe("Mon Malt");
    expect(shortUrl("https://www.malt.fr/profile/ines/")).toBe("malt.fr/profile/ines");
  });
});
