"use server";

import { refresh } from "next/cache";

import { getCurrentUser } from "@/lib/auth/user";
import { normalizeProfileContent, validateProfileContent } from "@/lib/profile/content";
import { removeUnusedImages, saveOwnProfileContent } from "@/lib/profile/data";
import type { ProfileContent } from "@/lib/profile/types";

export type SaveProfileContentResult = { ok: true } | { ok: false; error: "invalid" | "failed" };

// "Enregistrer" in "Mon profil" (docs/profile.md, "Espace privé"): the whole profile at once.
// The values are cleaned and checked again here, then by the database. The private space is
// refreshed, so that the sidebar and the Settings show the new name and photo.
export async function saveProfile(input: ProfileContent): Promise<SaveProfileContentResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "failed" };

  let content: ProfileContent;
  try {
    content = normalizeProfileContent(input);
  } catch {
    // Not the shape of a profile.
    return { ok: false, error: "invalid" };
  }
  if (validateProfileContent(content).length > 0) return { ok: false, error: "invalid" };

  try {
    if ((await saveOwnProfileContent(content)) !== "saved") return { ok: false, error: "invalid" };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "failed" };
  }

  // Replaced or removed images leave the storage. The profile is saved even if this fails: they
  // will go at the next save.
  try {
    await removeUnusedImages(user.id, content);
  } catch (error) {
    console.error(error);
  }

  refresh();
  return { ok: true };
}
