import "server-only";

import { headers } from "next/headers";

import { isValidHandle } from "@/lib/public-profile/handle";
import { createClient } from "@/lib/supabase/server";

import { isRobot, requestIp, visitorKey, type VisitTab } from "./rules";

// Visits and signals of the public profile (docs/dashboard.md). Recorded as whoever visits, with
// their session if they have one: the database leaves out the owner, and an offline profile. A
// failure never reaches the visitor: the page works the same, the visit is just not counted.

export async function recordVisit(handle: string, tab: VisitTab) {
  if (!isValidHandle(handle)) return;
  const h = await headers();
  const key = visitorKey(requestIp(h), h.get("user-agent"));
  if (!key) return;
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("record_profile_visit", { profile_handle: handle, visit_tab: tab, visitor_key: key });
    if (error) console.error(`Visit record failed: ${error.message}`);
  } catch (error) {
    console.error(error);
  }
}

// "Me contacter" opened, the CV or a public file downloaded (itemId: the file).
export async function recordSignal(handle: string, kind: "contact" | "cv" | "resource", itemId?: string) {
  if (!isValidHandle(handle)) return;
  const h = await headers();
  if (isRobot(h.get("user-agent"))) return;
  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("record_profile_event", {
      profile_handle: handle,
      event_kind: kind,
      item_id: itemId ?? null,
    });
    if (error) console.error(`Signal record failed: ${error.message}`);
  } catch (error) {
    console.error(error);
  }
}
