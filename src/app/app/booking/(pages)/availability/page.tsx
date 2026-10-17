import type { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { requireUser } from "@/lib/auth/user";
import { getOwnBookingSetup } from "@/lib/booking/data";

import { AvailabilityEditor } from "../../_components/availability-editor";

export const metadata: Metadata = { title: "Disponibilités · MyWork" };

// "Disponibilités" (docs/booking.md): the switch of the bookings, the hours of the week, the
// special days and the settings, saved together. The settings are created at the first visit.
export default function AvailabilityPage() {
  return (
    <Suspense fallback={<AvailabilitySkeleton />}>
      <AvailabilityContent />
    </Suspense>
  );
}

async function AvailabilityContent() {
  await requireUser();
  const setup = await getOwnBookingSetup();
  return <AvailabilityEditor setup={setup} serverNow={new Date().toISOString()} />;
}

function AvailabilitySkeleton() {
  return (
    <div className="flex flex-col gap-5 pt-5">
      <Skeleton className="h-16 w-full max-w-xl" />
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map((index) => (
            <Skeleton key={index} className="h-11 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
