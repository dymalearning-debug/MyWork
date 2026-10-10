import type { CookieOptions } from "@supabase/ssr";

// "Rester connecté" (docs/auth.md). The choice made at login is kept in a small cookie:
// "0" when unchecked. Absent (email links, sign-up) means the default: stay signed in.
export const REMEMBER_COOKIE = "mw-remember";

export const REMEMBER_COOKIE_OPTIONS: CookieOptions = {
  path: "/",
  sameSite: "lax",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 400 * 24 * 60 * 60,
};

export function isRemembered(cookieValue: string | undefined): boolean {
  return cookieValue !== "0";
}

// Supabase writes its session cookies for 400 days (the browser maximum).
// When the user did not ask to stay signed in, drop the expiry: the browser then
// forgets the session when it closes. Deletions (maxAge 0) are kept as they are.
export function withSessionPolicy(options: CookieOptions, remember: boolean): CookieOptions {
  if (remember) return options;
  if (options.maxAge !== undefined && options.maxAge <= 0) return options;
  const sessionOnly = { ...options };
  delete sessionOnly.maxAge;
  delete sessionOnly.expires;
  return sessionOnly;
}
