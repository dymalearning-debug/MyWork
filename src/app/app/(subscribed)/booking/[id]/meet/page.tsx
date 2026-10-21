import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { MeetingRoom } from "@/components/meeting/meeting-room";
import { getOwnProfile } from "@/lib/account/profile";
import { requireUser } from "@/lib/auth/user";
import { getOwnBooking, getOwnTimeZone } from "@/lib/booking/data";
import { BOOKING_PATH, guestBookingPath, isUuid, ownerMeetPath } from "@/lib/booking/rules";
import { profileDisplayName } from "@/lib/profile/content";

export const metadata: Metadata = { title: "Visio · MyWork" };

// The owner's meeting room (docs/booking.md, "Visio"), opened by "Rejoindre" in "Mes rendez-vous".
// Over the whole window, above the sidebar.
export default function OwnerMeetPage({ params }: PageProps<"/app/booking/[id]/meet">) {
  return (
    <Suspense fallback={<div className="fixed inset-0 z-40 bg-background" />}>
      <OwnerMeet params={params} />
    </Suspense>
  );
}

async function OwnerMeet({ params }: { params: PageProps<"/app/booking/[id]/meet">["params"] }) {
  const user = await requireUser();
  const { id } = await params;
  const [booking, profile, timeZone] = await Promise.all([
    isUuid(id) ? getOwnBooking(id) : null,
    getOwnProfile(user.id),
    getOwnTimeZone(),
  ]);
  if (!booking) notFound();

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background">
      <MeetingRoom
        tokenUrl={`${ownerMeetPath(booking.id)}/token`}
        backHref={BOOKING_PATH}
        backLabel="Mes rendez-vous"
        shareLink={{ path: guestBookingPath(profile.handle, booking.code), label: "Copier le lien de l'invité" }}
        serverNow={new Date().toISOString()}
        startAt={booking.startAt}
        endAt={booking.endAt}
        cancelled={booking.status === "cancelled"}
        selfName={profileDisplayName(profile)}
        otherName={booking.guestName}
        timeZone={timeZone}
      />
    </div>
  );
}
