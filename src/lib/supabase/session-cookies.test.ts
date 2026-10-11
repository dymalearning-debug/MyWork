import { describe, expect, it } from "vitest";

import { isRemembered, withSessionPolicy } from "./session-cookies";

const supabaseDefaults = { path: "/", sameSite: "lax" as const, httpOnly: false, maxAge: 400 * 24 * 60 * 60 };

describe("Rester connecté", () => {
  it("is the default when no choice was recorded", () => {
    expect(isRemembered(undefined)).toBe(true);
    expect(isRemembered("1")).toBe(true);
    expect(isRemembered("0")).toBe(false);
  });

  it("keeps the 400-day session cookies when checked", () => {
    expect(withSessionPolicy(supabaseDefaults, true)).toEqual(supabaseDefaults);
  });

  it("turns them into cookies that end with the browser when unchecked", () => {
    const options = withSessionPolicy({ ...supabaseDefaults, expires: new Date() }, false);
    expect(options).toEqual({ path: "/", sameSite: "lax", httpOnly: false });
  });

  it("still lets sign-out delete the cookies", () => {
    expect(withSessionPolicy({ ...supabaseDefaults, maxAge: 0 }, false).maxAge).toBe(0);
  });
});
