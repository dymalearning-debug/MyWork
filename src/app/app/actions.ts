"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { deleteOwnAccount, isHandleAvailable, updateOwnProfile } from "@/lib/account/profile";
import {
  areValidProfileSettings,
  isProfileSettings,
  normalizeProfileSettings,
  type ProfileSettings,
} from "@/lib/account/settings";
import { ACCOUNT_DELETED_NOTICE, LOGIN_PATH } from "@/lib/auth/paths";
import { getCurrentUser } from "@/lib/auth/user";
import { isValidHandle } from "@/lib/public-profile/handle";
import { setOwnProfileOnline } from "@/lib/public-profile/own";
import { createClient } from "@/lib/supabase/server";

// "Se déconnecter": only this device is signed out (scope "local").
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect(LOGIN_PATH);
}

// Puts the public profile online or offline (docs/public-profile.md, "En ligne ou hors ligne").
// The public pages read the database on each visit. The private space is refreshed, so that the
// profile menu, rebuilt each time it opens, shows the saved state.
export async function setProfileOnline(online: boolean): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user || typeof online !== "boolean") return { ok: false };
  try {
    await setOwnProfileOnline(user.id, online);
  } catch (error) {
    console.error(error);
    return { ok: false };
  }
  refresh();
  return { ok: true };
}

export type SaveProfileResult = { ok: true } | { ok: false; error: "unavailable" | "invalid" | "failed" };

// "Enregistrer" in the Settings (docs/settings.md): first and last name and the address of the
// public profile, saved together. The private space is refreshed, so that the sidebar and the
// profile menu show the new values.
export async function saveProfileSettings(input: ProfileSettings): Promise<SaveProfileResult> {
  const user = await getCurrentUser();
  if (!user || !isProfileSettings(input)) return { ok: false, error: "failed" };
  const values = normalizeProfileSettings(input);
  if (!areValidProfileSettings(values)) return { ok: false, error: "invalid" };
  try {
    const result = await updateOwnProfile(user.id, values);
    if (result !== "saved") return { ok: false, error: result };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "failed" };
  }
  refresh();
  return { ok: true };
}

export type HandleCheck = "available" | "unavailable" | "invalid";

// Live check of the address of the public profile, while the user types. null: the check failed,
// the save will tell.
export async function checkHandle(handle: string): Promise<HandleCheck | null> {
  const user = await getCurrentUser();
  if (!user || typeof handle !== "string") return null;
  const value = handle.trim().toLowerCase();
  if (!isValidHandle(value)) return "invalid";
  try {
    return (await isHandleAvailable(value)) ? "available" : "unavailable";
  } catch (error) {
    console.error(error);
    return null;
  }
}

// "Supprimer définitivement" (docs/settings.md): the account and every piece of data linked to it,
// then this device is signed out and the login page announces the deletion. The deleted user's
// session is no longer known to Supabase: the sign-out still clears it from this browser.
export async function deleteAccount(): Promise<{ ok: false }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  try {
    await deleteOwnAccount();
  } catch (error) {
    console.error(error);
    return { ok: false };
  }
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect(`${LOGIN_PATH}?notice=${ACCOUNT_DELETED_NOTICE}`);
}
