import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { NOT_FOUND_TITLE, OfflineBanner } from "@/components/public-page";
import { profileDisplayName } from "@/lib/profile/content";
import { publicProfilePath } from "@/lib/public-profile/handle";
import { getProfileContact, getProfileView } from "@/lib/public-profile/data";

import { CvSheet } from "../_components/cv-sheet";

// The CV of a profile (docs/profile.md, "Export du CV"): the A4 page that the preview shows and
// that the export prints (cv/pdf, and the PNG of "Mon profil"). Same access rules as the profile.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/[handle]/cv">): Promise<Metadata> {
  const { handle } = await params;
  const view = await getProfileView(handle);
  return {
    title: view ? `CV · ${profileDisplayName(view.profile)} · MyWork` : NOT_FOUND_TITLE,
    robots: { index: false, follow: false },
  };
}

export default async function CvPage({ params }: PageProps<"/[handle]/cv">) {
  const { handle } = await params;
  const view = await getProfileView(handle);
  if (!view) notFound();
  const contact = await getProfileContact(handle);
  const host = (await headers()).get("host");

  return (
    // Always in the light theme, on a grey background around the sheet (white when printed).
    <div className="light flex min-h-svh flex-1 flex-col bg-muted text-foreground print:bg-background">
      {view.preview && (
        <div className="print:hidden">
          <OfflineBanner />
        </div>
      )}
      <div className="py-10 print:py-0">
        <CvSheet
          profile={view.profile}
          contact={contact}
          publicAddress={view.profile.isOnline && host ? `${host}${publicProfilePath(handle)}` : null}
        />
      </div>
    </div>
  );
}
