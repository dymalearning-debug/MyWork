import type { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { getOwnProfile } from "@/lib/account/profile";
import { requireUser } from "@/lib/auth/user";
import { getOwnBookings, getOwnTimeZone } from "@/lib/booking/data";
import { parseFilter, publicBookingPath } from "@/lib/booking/rules";

import { BookingList } from "../_components/booking-list";

export const metadata: Metadata = { title: "Mes rendez-vous · MyWork" };

// "Mes rendez-vous", tab "Rendez-vous" (docs/booking.md, "La liste"): the bookings grouped by day,
// filtered by "À venir", "Passés" or "Annulés" (?filter=), "Afficher plus" for the last two
// (?more=2, 3…).
export default function BookingPage({ searchParams }: PageProps<"/app/booking">) {
  return (
    <Suspense fallback={<BookingListSkeleton />}>
      <BookingContent searchParams={searchParams} />
    </Suspense>
  );
}

async function BookingContent({ searchParams }: { searchParams: PageProps<"/app/booking">["searchParams"] }) {
  const user = await requireUser();
  const params = await searchParams;
  const filter = parseFilter(params.filter);
  const more = Math.min(Math.max(Number.parseInt(String(params.more ?? "1"), 10) || 1, 1), 100);
  const [list, timeZone, profile] = await Promise.all([getOwnBookings(filter, more), getOwnTimeZone(), getOwnProfile(user.id)]);

  return (
    <BookingList
      filter={filter}
      pages={more}
      list={list}
      timeZone={timeZone}
      serverNow={new Date().toISOString()}
      bookingPath={publicBookingPath(profile.handle)}
      handle={profile.handle}
    />
  );
}

function BookingListSkeleton() {
  return (
    <div className="flex flex-col gap-5 pt-6">
      <Skeleton className="h-8 w-72" />
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
