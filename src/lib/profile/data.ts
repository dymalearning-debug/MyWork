import "server-only";

import { createClient } from "@/lib/supabase/server";

import { PROFILE_IMAGES_BUCKET, profileImagePath } from "./images";
import type { ProfileContent, StoredProfile } from "./types";

// "Mon profil": the signed-in user's whole profile, read and saved through the database functions
// (get_own_profile_content, save_own_profile), which only ever touch their own rows.

export async function getOwnProfileContent(): Promise<StoredProfile> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_own_profile_content");
  if (error || !data) throw new Error(`Own profile content read failed: ${error?.message ?? "no profile"}`);
  return data as StoredProfile;
}

// "invalid": the database refused a value or a limit (the app checks the same rules first).
export async function saveOwnProfileContent(content: ProfileContent): Promise<"saved" | "invalid"> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_own_profile", { content });
  if (!error) return "saved";
  // 23514: a check constraint; 22xxx: a value of the wrong type or format; P0001: a limit
  // (too_many_items, invalid_content); 23505: two skills with the same name.
  if (error.code === "23514" || error.code?.startsWith("22") || error.code === "P0001" || error.code === "23505") {
    console.error(`Profile save refused: ${error.message} ${error.details ?? ""}`);
    return "invalid";
  }
  throw new Error(`Profile save failed: ${error.message}`);
}

// Images of the user's folder that the saved profile no longer uses: replaced or removed photos,
// project images taken out, images sent but never saved. Removed after each save.
export async function removeUnusedImages(userId: string, content: ProfileContent) {
  const used = new Set(
    [content.photoUrl, ...content.projects.flatMap((project) => project.images)]
      .map((url) => (url ? profileImagePath(url) : null))
      .filter(Boolean),
  );
  const files = await listOwnImages(userId);
  const unused = files.filter((path) => !used.has(path));
  if (unused.length === 0) return;
  const supabase = await createClient();
  const { error } = await supabase.storage.from(PROFILE_IMAGES_BUCKET).remove(unused);
  if (error) throw new Error(`Unused images removal failed: ${error.message}`);
}

// Account deletion: the storage is not emptied by the cascade of the database (docs/profile.md,
// "Données"), so the images go first.
export async function removeAllOwnImages(userId: string) {
  const files = await listOwnImages(userId);
  if (files.length === 0) return;
  const supabase = await createClient();
  const { error } = await supabase.storage.from(PROFILE_IMAGES_BUCKET).remove(files);
  if (error) throw new Error(`Images removal failed: ${error.message}`);
}

async function listOwnImages(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(PROFILE_IMAGES_BUCKET).list(userId, { limit: 1000 });
  if (error) throw new Error(`Images listing failed: ${error.message}`);
  return data.filter((file) => file.id).map((file) => `${userId}/${file.name}`);
}
