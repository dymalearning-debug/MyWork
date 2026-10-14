import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { ProfileSettings } from "./settings";

// The signed-in user's own profile, for the private space: the sidebar, the profile menu and the
// Settings. RLS limits every read and change to their own row.

// photoUrl: the photo of the profile (docs/profile.md, "En-tête"), also the avatar of the sidebar.
export type OwnProfile = ProfileSettings & { isOnline: boolean; photoUrl: string | null };

export async function getOwnProfile(userId: string): Promise<OwnProfile> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("first_name, last_name, handle, is_online, photo_url")
    .eq("id", userId)
    .single();
  if (error) throw new Error(`Own profile read failed: ${error.message}`);
  return {
    firstName: data.first_name ?? "",
    lastName: data.last_name ?? "",
    handle: data.handle,
    isOnline: data.is_online,
    photoUrl: data.photo_url,
  };
}

// Saves the "Profil" page of the Settings. "unavailable": the handle is taken by another profile
// or reserved; "invalid": the database refused the format.
export async function updateOwnProfile(
  userId: string,
  values: ProfileSettings,
): Promise<"saved" | "unavailable" | "invalid"> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ first_name: values.firstName || null, last_name: values.lastName || null, handle: values.handle })
    .eq("id", userId)
    .select("handle")
    .single();
  if (!error) return "saved";
  // 23505: the handle of another profile (unique constraint); handle_unavailable: a reserved
  // word (check_handle_not_reserved); 23514: a check constraint (format, length).
  if (error.code === "23505" || error.message === "handle_unavailable") return "unavailable";
  if (error.code === "23514") return "invalid";
  throw new Error(`Own profile update failed: ${error.message}`);
}

// Live check of the Settings: the handle is free for this user (neither taken nor reserved).
export async function isHandleAvailable(handle: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_handle_available", { candidate: handle });
  if (error) throw new Error(`Handle check failed: ${error.message}`);
  return data === true;
}

// "Supprimer le compte": the account and everything linked to it (on delete cascade).
export async function deleteOwnAccount(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_own_account");
  if (error) throw new Error(`Account deletion failed: ${error.message}`);
}
