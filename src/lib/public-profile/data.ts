import "server-only";

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";

import type { StoredProfile } from "@/lib/profile/types";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

import { isValidHandle } from "./handle";

// Data of the public pages (docs/public-profile.md, "Technique"). They ignore the session and read
// the data as an anonymous visitor would, even for the signed-in owner: what the owner sees is what
// visitors see, and a private field could not leak by mistake, since the database would refuse it.

// The public content of a profile (docs/profile.md, "Données"): never the sign-in address, nor
// the contact email and the phone, which "Me contacter" reads on demand.
export type PublicProfile = StoredProfile;

// preview: the owner looks at their own offline profile (with the "Hors ligne" banner).
export type ProfileView = { profile: PublicProfile; preview: boolean };

// The one public read of a profile, opened to anonymous visitors in the database
// (get_public_profile_content): one query per visit.
async function readPublicProfile(supabase: SupabaseClient, handle: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase.rpc("get_public_profile_content", { profile_handle: handle });
  if (error) throw new Error(`Public profile read failed: ${error.message}`);
  return (data as PublicProfile | null) ?? null;
}

function anonymousClient() {
  const { url, publishableKey } = getSupabaseEnv();
  return createSupabaseClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Reads as a visitor, then, for an offline profile, as its owner: both take the same path, so that
// nothing tells an existing account apart from an unknown handle.
async function readAsVisitorThenOwner<T>(read: (supabase: SupabaseClient) => Promise<T | null>) {
  const asVisitor = await read(anonymousClient());
  if (asVisitor) return { value: asVisitor, asOwner: false };
  const asOwner = await read(await createClient());
  return asOwner ? { value: asOwner, asOwner: true } : null;
}

// What a visit to /<handle> shows: the public profile, the owner's preview of their offline
// profile, or nothing (page not found). Shared by the layout, the pages and their metadata.
export const getProfileView = cache(async (handle: string): Promise<ProfileView | null> => {
  if (!isValidHandle(handle)) return null;
  const result = await readAsVisitorThenOwner((supabase) => readPublicProfile(supabase, handle));
  if (!result) return null;
  return { profile: result.value, preview: result.asOwner && !result.value.isOnline };
});

// The public profile for anonymous visitors only (share preview): never the owner's preview.
export async function getOnlineProfile(handle: string): Promise<PublicProfile | null> {
  if (!isValidHandle(handle)) return null;
  return readPublicProfile(anonymousClient(), handle);
}

export type ProfileContact = { email: string | null; phone: string | null };

// "Me contacter": the contact email and the phone, read only at the click, with the same rules as
// the profile (get_public_profile_contact).
export async function getProfileContact(handle: string): Promise<ProfileContact | null> {
  if (!isValidHandle(handle)) return null;
  const result = await readAsVisitorThenOwner(async (supabase) => {
    const { data, error } = await supabase
      .rpc("get_public_profile_contact", { profile_handle: handle })
      .maybeSingle();
    if (error) throw new Error(`Profile contact read failed: ${error.message}`);
    return (data as ProfileContact | null) ?? null;
  });
  return result?.value ?? null;
}
