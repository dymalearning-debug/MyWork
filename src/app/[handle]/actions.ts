"use server";

import { getProfileContact, type ProfileContact } from "@/lib/public-profile/data";

// "Me contacter" (docs/profile.md, "Coordonnées"): the contact email and the phone are read only
// when a visitor clicks, so that robots gathering addresses never find them in the page.
// Same rules as the profile: null for an offline profile (except for its owner) or an unknown one.
export async function fetchProfileContact(handle: string): Promise<ProfileContact | null> {
  if (typeof handle !== "string") return null;
  try {
    return await getProfileContact(handle);
  } catch (error) {
    console.error(error);
    return null;
  }
}
