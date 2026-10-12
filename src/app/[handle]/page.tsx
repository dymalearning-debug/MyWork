import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NOT_FOUND_TITLE } from "@/components/public-page";
import { getProfileView } from "@/lib/public-profile/data";

// Waits for the profile, like the layout.
export const instant = false;

// Provisional title and share preview, enriched with the CV. Not indexed while the page is empty.
export async function generateMetadata({ params }: PageProps<"/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const view = await getProfileView(handle);
  return {
    title: view ? `${view.profile.handle} · MyWork` : NOT_FOUND_TITLE,
    robots: { index: false, follow: false },
  };
}

// "Profil" tab, home of the public profile: each module will add a preview of its content here.
export default async function PublicProfilePage({ params }: PageProps<"/[handle]">) {
  const { handle } = await params;
  if (!(await getProfileView(handle))) notFound();

  return <p className="text-sm text-muted-foreground">Contenu à venir.</p>;
}
