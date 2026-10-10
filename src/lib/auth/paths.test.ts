import { describe, expect, it } from "vitest";

import { isPublicPath, isSignedOutOnlyPath, safeNextPath } from "./paths";

describe("safeNextPath", () => {
  it("accepts paths inside the app", () => {
    expect(safeNextPath("/profile")).toBe("/profile");
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
  it("keeps the authentication pages public", () => {
    for (const path of ["/login", "/signup", "/forgot-password", "/reset-password", "/link-expired", "/auth/confirm", "/auth/callback", "/design"]) {
      expect(isPublicPath(path), path).toBe(true);
    }
  });

  it("makes everything else private", () => {
    for (const path of ["/", "/profile", "/loginx", "/authors"]) {
      expect(isPublicPath(path), path).toBe(false);
    }
  });

  it("sends signed-in visitors away from login and sign-up only", () => {
    expect(isSignedOutOnlyPath("/login")).toBe(true);
    expect(isSignedOutOnlyPath("/signup")).toBe(true);
    expect(isSignedOutOnlyPath("/forgot-password")).toBe(false);
  });
});
