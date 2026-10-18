import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { emailLinkTarget } from "./paths";

// The button of the MyWork emails (supabase/templates/), filled in as Supabase does, must lead to
// /auth/confirm with a token_hash and a type that the page understands.
const template = (name: string) => readFileSync(path.resolve(import.meta.dirname, "../../../supabase/templates", name), "utf8");

function link(name: string) {
  const href = template(name).match(/href="(\{\{ \.RedirectTo \}\}[^"]*)"/)?.[1];
  if (!href) throw new Error(`No link in ${name}`);
  return new URL(
    href
      .replace("{{ .RedirectTo }}", emailLinkTarget("https://hellomywork.com"))
      .replace("{{ .TokenHash }}", "abc123")
      .replace(/&amp;/g, "&"),
  );
}

describe("email links", () => {
  it("confirms the address", () => {
    const url = link("confirmation.html");
    expect(url.pathname).toBe("/auth/confirm");
    expect(url.searchParams.get("token_hash")).toBe("abc123");
    expect(url.searchParams.getAll("type")).toEqual(["email"]);
  });

  it("resets the password", () => {
    const url = link("recovery.html");
    expect(url.pathname).toBe("/auth/confirm");
    expect(url.searchParams.get("token_hash")).toBe("abc123");
    expect(url.searchParams.getAll("type")).toEqual(["recovery"]);
  });
});
