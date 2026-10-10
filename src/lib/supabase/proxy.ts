import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnv } from "./env";
import { isRemembered, REMEMBER_COOKIE, withSessionPolicy } from "./session-cookies";

// Refreshes the Supabase session on every request (called by src/proxy.ts) and returns
// the response carrying the refreshed cookies, plus whether a user is signed in.
export async function updateSession(request: NextRequest) {
  const { url, publishableKey } = getSupabaseEnv();
  const keepSession = isRemembered(request.cookies.get(REMEMBER_COOKIE)?.value);
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, withSessionPolicy(options, keepSession));
        }
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });

  // Do not run code between createServerClient and getClaims: it refreshes the session if needed.
  const { data } = await supabase.auth.getClaims();

  return { response, isSignedIn: !!data?.claims };
}
