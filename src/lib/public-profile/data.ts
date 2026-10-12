import "server-only";

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";

import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

import { isValidHandle } from "./handle";

// Data of the public pages (docs/public-profile.md, "Technique"). They ignore the session and read
// the data as an anonymous visitor would, even for the signed-in owner: what the owner sees is what
// visitors see, and a private field could not leak by mistake, since the database would refuse it.

export type PublicProfile = {
  handle: string;
  isOnline: boolean;
};

// preview: the owner looks at their own offline profile (with the "Hors ligne" banner).
export type ProfileView = { profile: PublicProfile; preview: boolean };

// The one public read of a profile, opened to anonymous visitors in the database
// (get_public_profile): never the email.
async function readPublicProfile(supabase: SupabaseClient, handle: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase.rpc("get_public_profile", { profile_handle: handle }).maybeSingle();
  if (error) throw new Error(`Public profile read failed: ${error.message}`);
  const row = data as { handle: string; is_online: boolean } | null;
  return row && { handle: row.handle, isOnline: row.is_online };
}

function anonymousClient() {
  const { url, publishableKey } = getSupabaseEnv();
  return createSupabaseClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// What a visit to /<handle> shows: the public profile, the owner's preview of their offline
// profile, or nothing (page not found). Shared by the layout, the pages and their metadata.
export const getProfileView = cache(async (handle: string): Promise<ProfileView | null> => {
  if (!isValidHandle(handle)) return null;

  const publicProfile = await readPublicProfile(anonymousClient(), handle);
  if (publicProfile) return { profile: publicProfile, preview: false };

  // Offline or unknown: both take the same path, so that nothing tells an existing account apart.
  // Only the owner of an offline profile can read it, through their own session.
  const ownProfile = await readPublicProfile(await createClient(), handle);
  if (ownProfile) return { profile: ownProfile, preview: !ownProfile.isOnline };
  return null;
});
