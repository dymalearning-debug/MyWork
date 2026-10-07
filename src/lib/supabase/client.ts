import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "./env";

// Supabase client for Client Components (code running in the browser).
export function createClient() {
  const { url, publishableKey } = getSupabaseEnv();
  return createBrowserClient(url, publishableKey);
}
