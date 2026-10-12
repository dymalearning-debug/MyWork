import "server-only";

import { createClient } from "@/lib/supabase/server";

// "Profil en ligne" / "Profil hors ligne", from the profile menu. RLS limits the change to the
// signed-in user's own row. Their profile itself is read by getOwnProfile (src/lib/account/profile.ts).
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
