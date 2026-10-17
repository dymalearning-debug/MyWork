import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NOT_FOUND_TITLE, OfflineBanner, PublicPage } from "@/components/public-page";
import { getPublicSlots } from "@/lib/booking/public";
import { hasPublicResources } from "@/lib/drive/public";
import { profileDisplayName } from "@/lib/profile/content";
import { getProfileView } from "@/lib/public-profile/data";

import { ProfileHeader } from "../_components/profile-header";
import { BookingFlow } from "./_components/booking-flow";

// "Rendez-vous" tab of the public profile (docs/booking.md, "Profil public : onglet
// « Rendez-vous »"): the free slots of the week, the form, then the guest's page. Bookings closed,
// profile offline or unknown: the "Page introuvable" page. The slots are computed at each visit,
// never cached.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/[handle]/booking">): Promise<Metadata> {
  const { handle } = await params;
  const [view, slots] = await Promise.all([getProfileView(handle), getPublicSlots(handle)]);
  return {
    title: view && slots ? `Rendez-vous · ${profileDisplayName(view.profile)} · MyWork` : NOT_FOUND_TITLE,
    robots: { index: false, follow: false },
  };
}

export default async function BookingTabPage({ params }: PageProps<"/[handle]/booking">) {
  const { handle } = await params;
  const [view, slots, showResources] = await Promise.all([getProfileView(handle), getPublicSlots(handle), hasPublicResources(handle)]);
  if (!view || !slots) notFound();
  const { availability } = slots;

  return (
    <PublicPage
      banner={view.preview ? <OfflineBanner /> : undefined}
      header={<ProfileHeader profile={view.profile} tab="booking" showBooking showResources={showResources} />}
    >
      <BookingFlow
        handle={view.profile.handle}
        ownerName={profileDisplayName(view.profile)}
        hasContact={view.profile.hasContact}
        slots={slots.slots}
        serverNow={availability.now}
        ownerTimeZone={availability.timeZone}
        horizonDays={availability.horizonDays}
        weekly={availability.weekly}
        overrides={availability.overrides}
      />
    </PublicPage>
  );
}
