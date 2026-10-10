// Page access rules (docs/auth.md, "Accès aux pages").

export const HOME_PATH = "/profile";
export const LOGIN_PATH = "/login";

// Pages a signed-in visitor has no reason to see: sent to the app instead.
const SIGNED_OUT_ONLY = ["/login", "/signup"];

// Pages anyone can open. Everything else requires being signed in.
// /reset-password checks the session itself (it comes from an email link).
const PUBLIC = [
  ...SIGNED_OUT_ONLY,
  "/forgot-password",
  "/reset-password",
  "/link-expired",
  "/auth",
  "/design",
];

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isPublicPath(pathname: string) {
  return matches(pathname, PUBLIC);
}

export function isSignedOutOnlyPath(pathname: string) {
  return matches(pathname, SIGNED_OUT_ONLY);
}

// The return address after login (`next`) only accepts paths inside the app, never another site.
export function safeNextPath(next: unknown): string | null {
  if (typeof next !== "string" || next.length === 0) return null;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return null;
  try {
    // Resolving against a dummy origin catches tricks such as "/%2F%2Fevil.com" or "/\tevil.com".
    const url = new URL(next, "http://mywork.invalid");
    if (url.origin !== "http://mywork.invalid") return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
