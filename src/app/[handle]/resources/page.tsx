import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OfflineBanner, PublicPage, NOT_FOUND_TITLE } from "@/components/public-page";
import { isPublicBookingOpen } from "@/lib/booking/public";
import { getPublicResources } from "@/lib/drive/public";
import { pageCount } from "@/lib/drive/rules";
import { profileDisplayName } from "@/lib/profile/content";
import { getProfileView } from "@/lib/public-profile/data";

import { ProfileHeader } from "../_components/profile-header";
import { ResourcesTab } from "../_components/resources-tab";
import { VisitTracker } from "../_components/visit-tracker";

// "Ressources" tab of the public profile (docs/drive.md, "L'onglet « Ressources »"): the public
// files of the Drive. Without any, like an offline profile or an unknown handle, the address leads
// to the "Page introuvable" page. Outside the layout of the "Profil" tab, so that this page can be
// not found as a whole.
export const instant = false;

const pageOf = (value: string | string[] | undefined) => {
  const page = Number.parseInt(Array.isArray(value) ? (value[0] ?? "") : (value ?? ""), 10);
  return Number.isFinite(page) && page > 1 ? Math.min(page, 10_000) : 1;
};

export async function generateMetadata({ params }: PageProps<"/[handle]/resources">): Promise<Metadata> {
  const { handle } = await params;
  const [view, resources] = await Promise.all([getProfileView(handle), getPublicResources(handle, 1)]);
  const empty = !resources || (!resources.featured && resources.total === 0);
  return {
    title: view && !empty ? `Ressources · ${profileDisplayName(view.profile)} · MyWork` : NOT_FOUND_TITLE,
    robots: { index: false, follow: false },
  };
}

export default async function ResourcesPage({ params, searchParams }: PageProps<"/[handle]/resources">) {
  const { handle } = await params;
  const page = pageOf((await searchParams).page);
  const [view, resources, showBooking] = await Promise.all([
    getProfileView(handle),
    getPublicResources(handle, page),
    isPublicBookingOpen(handle),
  ]);
  if (!view || !resources || (!resources.featured && resources.total === 0)) notFound();
  if (page > pageCount(resources.total)) notFound();

  return (
    <PublicPage
      banner={view.preview ? <OfflineBanner /> : undefined}
      header={<ProfileHeader profile={view.profile} tab="resources" showResources showBooking={showBooking} />}
    >
      <VisitTracker handle={view.profile.handle} tab="resources" />
      <ResourcesTab handle={handle} resources={resources} page={page} />
    </PublicPage>
  );
}
