"use server";

import { redirect } from "next/navigation";

import { LOGIN_PATH } from "@/lib/auth/paths";
import { getCurrentUser } from "@/lib/auth/user";
import { setOwnProfileOnline } from "@/lib/public-profile/own";
import { createClient } from "@/lib/supabase/server";

// "Se déconnecter": only this device is signed out (scope "local").
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect(LOGIN_PATH);
}

// Puts the public profile online or offline (docs/public-profile.md, "En ligne ou hors ligne").
// The public pages read the database on each visit: nothing to refresh.
export async function setProfileOnline(online: boolean): Promise<{ ok: true; online: boolean } | { ok: false }> {
  const user = await getCurrentUser();
  if (!user || typeof online !== "boolean") return { ok: false };
  try {
    return { ok: true, online: await setOwnProfileOnline(user.id, online) };
  } catch (error) {
    console.error(error);
    return { ok: false };
  }
}
