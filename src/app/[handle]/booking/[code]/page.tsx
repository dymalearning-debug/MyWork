import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { Logo } from "@/components/logo";
import { NOT_FOUND_TITLE } from "@/components/public-page";
import { getPublicBooking } from "@/lib/booking/public";
import { profileDisplayName, profileInitials } from "@/lib/profile/content";

import { GuestTicket } from "../_components/guest-ticket";

// The guest's page (docs/booking.md, "Page du rendez-vous"): their secret link, which is also the
// confirmation page. Works even if the profile went offline or bookings closed. A wrong code
// leads to the "Page introuvable" page. Never indexed.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/[handle]/booking/[code]">): Promise<Metadata> {
  const { handle, code } = await params;
  const booking = await getPublicBooking(handle, code);
  return {
    title: booking ? `Rendez-vous avec ${profileDisplayName(booking.owner)} · MyWork` : NOT_FOUND_TITLE,
    robots: { index: false, follow: false },
  };
}

export default async function GuestBookingPage({ params }: PageProps<"/[handle]/booking/[code]">) {
  const { handle, code } = await params;
  const booking = await getPublicBooking(handle, code);
  if (!booking) notFound();
  // The time of the visit (state of the room, countdown): never prerendered.
  await connection();

  return (
    <div className="flex min-h-svh flex-1 flex-col bg-spotlight">
      <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col gap-5 px-5 pt-7 pb-6">
        <GuestTicket
          handle={handle}
          code={code}
          serverNow={new Date().toISOString()}
          booking={{
            reference: booking.reference,
            startAt: booking.startAt,
            endAt: booking.endAt,
            status: booking.status,
            cancelledBy: booking.cancelledBy,
            cancelMessage: booking.cancelMessage,
            guestName: booking.guestName,
            guestTimeZone: booking.guestTimeZone,
            bookable: booking.bookable,
          }}
          owner={{
            name: profileDisplayName(booking.owner),
            initials: profileInitials(booking.owner),
            photoUrl: booking.owner.photoUrl,
          }}
        />
        <footer className="mt-auto flex justify-center pt-6 text-xs text-muted-foreground">
          <Link href="/" className="inline-flex items-center gap-2.5 transition-colors hover:text-foreground">
            <span>Créé avec</span>
            <Logo className="h-4 text-foreground" />
          </Link>
        </footer>
      </main>
    </div>
  );
}
