"use server";

import { redirect } from "next/navigation";

import { LOGIN_PATH } from "@/lib/auth/paths";
import { createClient } from "@/lib/supabase/server";

// "Se déconnecter": only this device is signed out (scope "local").
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect(LOGIN_PATH);
}
