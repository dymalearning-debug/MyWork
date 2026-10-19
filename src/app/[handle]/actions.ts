"use server";

import { isVisitTab } from "@/lib/dashboard/rules";
import { recordSignal, recordVisit } from "@/lib/dashboard/tracking";
import { getProfileContact, type ProfileContact } from "@/lib/public-profile/data";

// "Me contacter" (docs/profile.md, "Coordonnées"): the contact email and the phone are read only
// when a visitor clicks, so that robots gathering addresses never find them in the page.
// Same rules as the profile: null for an offline profile (except for its owner) or an unknown one.
export async function fetchProfileContact(handle: string): Promise<ProfileContact | null> {
  if (typeof handle !== "string") return null;
  try {
    const contact = await getProfileContact(handle);
    // A signal of the dashboard ("Me contacter" opened).
    if (contact) await recordSignal(handle, "contact");
    return contact;
  } catch (error) {
    console.error(error);
    return null;
  }
}

// A visit of a tab of the public profile, sent by the page once shown (docs/dashboard.md, "Visites
// du profil public"): robots that do not run the page are never counted.
export async function recordProfileVisit(handle: string, tab: string) {
  if (typeof handle !== "string" || !isVisitTab(tab)) return;
  await recordVisit(handle, tab);
}
