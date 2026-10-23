// Page access rules (docs/auth.md and docs/public-profile.md, "Accès aux pages").

export const APP_PATH = "/app";
// Home of the private space, reached after login: the dashboard.
export const HOME_PATH = APP_PATH;
export const PROFILE_PATH = "/app/profile";
export const LOGIN_PATH = "/login";
// The login page announces the deletion of the account (?notice=account-deleted, docs/settings.md).
export const ACCOUNT_DELETED_NOTICE = "account-deleted";

// Return address of the email links (sign-up confirmation, password reset): /auth/confirm, which
// checks the link and opens the session. Without any query: the MyWork templates
// (supabase/templates/) add "?token_hash=…&type=…" themselves, and the type tells where to go next.
export function emailLinkTarget(origin: string) {
  return `${origin}/auth/confirm`;
}

// Pages a signed-in visitor has no reason to see: sent to the app instead.
const SIGNED_OUT_ONLY = ["/login", "/signup"];

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

// The address tells where we are: /app is private, everything else is public
// (landing page, public profiles, authentication pages).
export function isPrivatePath(pathname: string) {
  return matches(pathname, [APP_PATH]);
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
    // The resolved path is checked again: "/.//evil.com" becomes "//evil.com", another site.
    if (url.pathname.startsWith("//")) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
