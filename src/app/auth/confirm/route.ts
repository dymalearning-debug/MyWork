import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { HOME_PATH, LOGIN_PATH } from "@/lib/auth/paths";
import { createClient } from "@/lib/supabase/server";
import { REMEMBER_COOKIE, REMEMBER_COOKIE_OPTIONS } from "@/lib/supabase/session-cookies";

// Links of the emails (sign-up confirmation, password reset). Two forms:
// - MyWork's own templates (supabase/templates/, sent with Resend) and the end-to-end tests: a
//   `token_hash` and its `type` (email or recovery), checked here, which works in any browser.
// - Supabase's default emails (before Resend; such links may still be around): Supabase checks the
//   link, then sends the visitor here with a one-time `code`, which needs a cookie left by the
//   browser that asked for the email.
const LINK_TYPES: EmailOtpType[] = ["email", "signup", "recovery"];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const code = searchParams.get("code");
  const type = searchParams.get("type") as EmailOtpType | null;
  const isRecovery = type === "recovery";
  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, request.url));

  if ((tokenHash || code) && type && LINK_TYPES.includes(type)) {
    // An email link signs in with the default choice: stay signed in.
    (await cookies()).set(REMEMBER_COOKIE, "1", REMEMBER_COOKIE_OPTIONS);
    const supabase = await createClient({ remember: true });
    const { error } = tokenHash
      ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
      : await supabase.auth.exchangeCodeForSession(code!);

    if (!error) return redirectTo(isRecovery ? "/reset-password" : HOME_PATH);

    // Sign-up link opened in another browser: Supabase has already confirmed the address,
    // only the automatic sign-in is missing.
    if (code && !isRecovery && error.code === "pkce_code_verifier_not_found") {
      return redirectTo(`${LOGIN_PATH}?notice=confirmed`);
    }
  }

  // Expired, already used or malformed link. Supabase reports an expired link with an error
  // in the address (sometimes after a "#", which never reaches the server): no code, so we land here.
  return redirectTo(`/link-expired?type=${isRecovery ? "recovery" : "signup"}`);
}
