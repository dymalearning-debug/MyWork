import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseEnv } from "./env";
import { isRemembered, REMEMBER_COOKIE, withSessionPolicy } from "./session-cookies";

// Supabase client for Server Components, Server Functions and Route Handlers.
// Create a new one per request: it reads the user's session from the cookies.
// `remember` overrides the "Rester connecté" cookie, for the login action that is setting it.
export async function createClient({ remember }: { remember?: boolean } = {}) {
  const { url, publishableKey } = getSupabaseEnv();
  const cookieStore = await cookies();
  const keepSession = remember ?? isRemembered(cookieStore.get(REMEMBER_COOKIE)?.value);

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, withSessionPolicy(options, keepSession));
          }
        } catch {
          // Server Components cannot set cookies: the proxy refreshes the session instead.
        }
      },
    },
  });
}
