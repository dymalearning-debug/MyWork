import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

import { LOGIN_PATH } from "./paths";

// Data Access Layer: the one place that tells who is signed in.
// Pages and Server Actions call it themselves; the proxy is only a first gate.

export type CurrentUser = {
  id: string;
  email: string;
  // Google profile photo, when the account was created or linked with Google.
  avatarUrl: string | null;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  // getClaims verifies the session token's signature, unlike getSession.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const metadata = (claims.user_metadata ?? {}) as Record<string, unknown>;
  const avatar = metadata.avatar_url ?? metadata.picture;
  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "",
    avatarUrl: typeof avatar === "string" ? avatar : null,
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(LOGIN_PATH);
  return user;
}
