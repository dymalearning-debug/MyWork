import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { PublicProfile } from "./data";

// The signed-in user's own public profile, for the profile menu of the private space
// ("Mon profil public"). RLS limits the read to their own row.
export async function getOwnPublicProfile(userId: string): Promise<PublicProfile> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("handle, is_online")
    .eq("id", userId)
    .single();
  if (error) throw new Error(`Own profile read failed: ${error.message}`);
  return { handle: data.handle, isOnline: data.is_online };
}

// "Profil en ligne" / "Profil hors ligne". Only the online switch is editable (RLS and grants).
export async function setOwnProfileOnline(userId: string, online: boolean): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ is_online: online })
    .eq("id", userId)
    .select("is_online")
    .single();
  if (error) throw new Error(`Online switch failed: ${error.message}`);
  return data.is_online;
}
