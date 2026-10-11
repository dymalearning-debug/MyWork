import { NextResponse, type NextRequest } from "next/server";

import { HOME_PATH, LOGIN_PATH, safeNextPath } from "@/lib/auth/paths";
import { createClient } from "@/lib/supabase/server";

// Return from Google: exchanges the one-time code for a session.
// The "Rester connecté" choice was stored in a cookie before leaving for Google.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const next = safeNextPath(searchParams.get("next")) ?? HOME_PATH;
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Cancelled on Google's screen, or the code is no longer valid.
  return NextResponse.redirect(new URL(`${LOGIN_PATH}?error=google`, request.url));
}
