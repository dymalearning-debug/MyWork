import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { HOME_PATH } from "@/lib/auth/paths";
import { createClient } from "@/lib/supabase/server";
import { REMEMBER_COOKIE, REMEMBER_COOKIE_OPTIONS } from "@/lib/supabase/session-cookies";

// Links of the emails (sign-up confirmation, password reset). Checked by token_hash, which works
// even when the link is opened in another browser than the one that asked for it.
const LINK_TYPES: EmailOtpType[] = ["email", "signup", "recovery"];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const isRecovery = type === "recovery";

  if (tokenHash && type && LINK_TYPES.includes(type)) {
    // An email link signs in with the default choice: stay signed in.
    (await cookies()).set(REMEMBER_COOKIE, "1", REMEMBER_COOKIE_OPTIONS);
    const supabase = await createClient({ remember: true });
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(new URL(isRecovery ? "/reset-password" : HOME_PATH, request.url));
    }
  }

  // Expired, already used or malformed link.
  const expired = new URL("/link-expired", request.url);
  expired.searchParams.set("type", isRecovery ? "recovery" : "signup");
  return NextResponse.redirect(expired);
}
