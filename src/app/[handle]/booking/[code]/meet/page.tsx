import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { MeetingRoom } from "@/components/meeting/meeting-room";
import { NOT_FOUND_TITLE } from "@/components/public-page";
import { getPublicBooking } from "@/lib/booking/public";
import { guestBookingPath } from "@/lib/booking/rules";
import { profileDisplayName } from "@/lib/profile/content";

// The guest's meeting room (docs/booking.md, "Visio"): the preparation screen, then the room. The
// access itself is given by the server, only inside the window of the room.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/[handle]/booking/[code]/meet">): Promise<Metadata> {
  const { handle, code } = await params;
  const booking = await getPublicBooking(handle, code);
  return {
    title: booking ? `Visio avec ${profileDisplayName(booking.owner)} · MyWork` : NOT_FOUND_TITLE,
    robots: { index: false, follow: false },
  };
}

export default async function GuestMeetPage({ params }: PageProps<"/[handle]/booking/[code]/meet">) {
  const { handle, code } = await params;
  const booking = await getPublicBooking(handle, code);
  if (!booking) notFound();
  await connection();

  return (
    <MeetingRoom
      tokenUrl={`${guestBookingPath(handle, code)}/meet/token`}
      backHref={guestBookingPath(handle, code)}
      backLabel="Mon rendez-vous"
      shareLink={{ path: guestBookingPath(handle, code), label: "Copier le lien" }}
      serverNow={new Date().toISOString()}
      startAt={booking.startAt}
      endAt={booking.endAt}
      cancelled={booking.status === "cancelled"}
      selfName={booking.guestName}
      otherName={profileDisplayName(booking.owner)}
      timeZone={booking.guestTimeZone}
    />
  );
}
