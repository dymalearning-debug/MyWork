import { describe, expect, it } from "vitest";

import { isPrivatePath, isSignedOutOnlyPath, safeNextPath } from "./paths";

describe("safeNextPath", () => {
  it("accepts paths inside the app", () => {
    expect(safeNextPath("/app/profile")).toBe("/app/profile");
    expect(safeNextPath("/boards/42?tab=done#top")).toBe("/boards/42?tab=done#top");
  });

  it("refuses anything that could lead to another site", () => {
    for (const next of [
      "https://evil.com",
      "//evil.com",
      "/\\evil.com",
      "\\\\evil.com",
      "evil.com",
      "javascript:alert(1)",
      "",
      undefined,
      ["/profile"],
    ]) {
      expect(safeNextPath(next), String(next)).toBeNull();
    }
  });
});

describe("page access", () => {
  it("makes /app private", () => {
    for (const path of ["/app", "/app/profile", "/app/boards/42"]) {
      expect(isPrivatePath(path), path).toBe(true);
    }
  });

  it("keeps everything else public: landing page, profiles, authentication pages", () => {
    for (const path of [
      "/",
      "/ines-robert",
      "/ines-robert/cv",
      "/apple",
      "/application",
      "/login",
      "/signup",
      "/forgot-password",
      "/reset-password",
      "/link-expired",
      "/auth/confirm",
      "/auth/callback",
      "/design",
    ]) {
      expect(isPrivatePath(path), path).toBe(false);
    }
  });

  it("sends signed-in visitors away from login and sign-up only", () => {
    expect(isSignedOutOnlyPath("/login")).toBe(true);
    expect(isSignedOutOnlyPath("/signup")).toBe(true);
    expect(isSignedOutOnlyPath("/forgot-password")).toBe(false);
  });
});
