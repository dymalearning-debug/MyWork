import { describe, expect, it } from "vitest";

import {
  categoryOf,
  fileProblem,
  formatDate,
  formatSize,
  freeName,
  isBlockedName,
  MAX_FILE_BYTES,
  previewKind,
  splitExtension,
  thumbnailSize,
  typeLabel,
} from "./files";

describe("categoryOf", () => {
  it("uses the extension first", () => {
    expect(categoryOf("Devis.PDF", "")).toBe("document");
    expect(categoryOf("notes.md", "")).toBe("document");
    expect(categoryOf("Tarifs.xlsx", "")).toBe("spreadsheet");
    expect(categoryOf("export.csv", "text/plain")).toBe("spreadsheet");
    expect(categoryOf("Pitch.key", "")).toBe("presentation");
    expect(categoryOf("photo.HEIC", "")).toBe("image");
    expect(categoryOf("rush.mov", "")).toBe("video");
    expect(categoryOf("voix.m4a", "")).toBe("audio");
    expect(categoryOf("captures.7z", "")).toBe("archive");
  });

  it("falls back on the type given by the browser", () => {
    expect(categoryOf("scan", "application/pdf")).toBe("document");
    expect(categoryOf("image", "image/jpeg")).toBe("image");
    expect(categoryOf("clip", "video/mp4")).toBe("video");
    expect(categoryOf("data.bin", "application/octet-stream")).toBe("other");
    expect(categoryOf("Makefile", "")).toBe("other");
  });
});

describe("executables", () => {
  it("refuses programs, whatever the case", () => {
    for (const name of ["setup.exe", "Install.MSI", "run.bat", "x.ps1", "app.apk", "Image.dmg", "deploy.sh"]) {
      expect(isBlockedName(name)).toBe(true);
    }
    expect(isBlockedName("exe.pdf")).toBe(false);
    expect(isBlockedName("notes")).toBe(false);
  });
});

describe("fileProblem", () => {
  it("gives the reason of a refusal before sending", () => {
    expect(fileProblem({ name: "a.pdf", size: 10 }, 1000)).toBeNull();
    expect(fileProblem({ name: "a.exe", size: 10 }, 1000)).toMatch(/programmes/);
    expect(fileProblem({ name: "a.mov", size: MAX_FILE_BYTES + 1 }, Infinity)).toMatch(/50 Mo/);
    expect(fileProblem({ name: "a.pdf", size: 2000 }, 1000)).toMatch(/stockage plein/);
  });
});

describe("splitExtension", () => {
  it("keeps the last extension apart", () => {
    expect(splitExtension("Devis.final.pdf")).toEqual({ base: "Devis.final", extension: "pdf" });
    expect(splitExtension("README")).toEqual({ base: "README", extension: "" });
    expect(splitExtension(".env")).toEqual({ base: ".env", extension: "" });
    expect(splitExtension("trailing.")).toEqual({ base: "trailing.", extension: "" });
  });
});

describe("freeName", () => {
  it("keeps a free name", () => {
    expect(freeName("Devis.pdf", ["Autre.pdf"])).toBe("Devis.pdf");
  });

  it("numbers a name already taken, whatever the case", () => {
    expect(freeName("Devis.pdf", ["devis.pdf"])).toBe("Devis (2).pdf");
    expect(freeName("Devis.pdf", ["Devis.pdf", "Devis (2).pdf"])).toBe("Devis (3).pdf");
    expect(freeName("Notes", ["Notes"])).toBe("Notes (2)");
  });
});

describe("formatSize", () => {
  it("writes sizes as in Drive, in French", () => {
    expect(formatSize(0)).toBe("0 octet");
    expect(formatSize(512)).toBe("512 octets");
    expect(formatSize(94 * 1024)).toBe("94 Ko");
    expect(formatSize(860 * 1024)).toBe("860 Ko");
    expect(formatSize(4.8 * 1024 * 1024)).toBe("4,8 Mo");
    expect(formatSize(312 * 1024 * 1024)).toBe("312 Mo");
    expect(formatSize(1024 * 1024 * 1024)).toBe("1 Go");
    expect(formatSize(1023.8 * 1024)).toBe("1 Mo");
  });
});

describe("formatDate", () => {
  const now = new Date("2026-10-15T14:00:00Z");

  it("shows the time for today, in the time of France", () => {
    expect(formatDate("2026-10-15T08:32:00Z", now)).toBe("10:32");
  });

  it("shows the day otherwise", () => {
    expect(formatDate("2026-10-14T08:32:00Z", now)).toBe("14 oct. 2026");
  });
});

describe("previews and labels", () => {
  it("previews images and PDF only", () => {
    expect(previewKind("document", "application/pdf", "a.pdf")).toBe("pdf");
    expect(previewKind("image", "image/png", "a.png")).toBe("image");
    expect(previewKind("image", "image/heic", "a.heic")).toBeNull();
    expect(previewKind("video", "video/mp4", "a.mp4")).toBeNull();
  });

  it("names the type of a file", () => {
    expect(typeLabel("Kit.pdf", "document")).toBe("PDF");
    expect(typeLabel("Brief.docx", "document")).toBe("Document Word");
    expect(typeLabel("Portrait.jpg", "image")).toBe("Image JPG");
    expect(typeLabel("data", "other")).toBe("Fichier");
  });

  it("reduces thumbnails to 400 pixels, never enlarges", () => {
    expect(thumbnailSize(1600, 800)).toEqual({ width: 400, height: 200 });
    expect(thumbnailSize(200, 100)).toEqual({ width: 200, height: 100 });
  });
});
