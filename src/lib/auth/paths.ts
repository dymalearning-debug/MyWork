// Page access rules (docs/auth.md and docs/public-profile.md, "Accès aux pages").

export const APP_PATH = "/app";
export const HOME_PATH = "/app/profile";
export const LOGIN_PATH = "/login";
// The login page announces the deletion of the account (?notice=account-deleted, docs/settings.md).
export const ACCOUNT_DELETED_NOTICE = "account-deleted";

// Pages a signed-in visitor has no reason to see: sent to the app instead.
const SIGNED_OUT_ONLY = ["/login", "/signup"];

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

// The address tells where we are: /app is private, everything else is public
// (public profiles, authentication pages). The site address "/" leads to the private space
// until there is a landing page, so it is treated as private too.
export function isPrivatePath(pathname: string) {
  return pathname === "/" || matches(pathname, [APP_PATH]);
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
