import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NOT_FOUND_TITLE } from "@/components/public-page";
import { profileDisplayName } from "@/lib/profile/content";
import { getProfileView } from "@/lib/public-profile/data";

import { ProfileTab } from "../_components/profile-sections";

// Waits for the profile, like the layout.
export const instant = false;

// Tab title "Prénom Nom · MyWork" and share preview: the name, the title and the start of the
// presentation (docs/profile.md, "Page publique"). Still not indexed by search engines.
export async function generateMetadata({ params }: PageProps<"/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const view = await getProfileView(handle);
  if (!view) return { title: NOT_FOUND_TITLE, robots: { index: false, follow: false } };

  const { profile } = view;
  const name = profileDisplayName(profile);
  const about = profile.about.replace(/\s+/g, " ");
  const summary = about.length > 160 ? `${about.slice(0, 157).trimEnd()}…` : about;
  const description = [profile.headline, summary].filter(Boolean).join(" · ") || undefined;
  return {
    title: `${name} · MyWork`,
    description,
    robots: { index: false, follow: false },
    openGraph: { title: name, description, type: "profile" },
    twitter: { card: "summary_large_image", title: name, description },
  };
}

// "Profil" tab, home of the public profile: the Profil module (docs/profile.md).
export default async function PublicProfilePage({ params }: PageProps<"/[handle]">) {
  const { handle } = await params;
  const view = await getProfileView(handle);
  if (!view) notFound();

  return <ProfileTab profile={view.profile} />;
}
