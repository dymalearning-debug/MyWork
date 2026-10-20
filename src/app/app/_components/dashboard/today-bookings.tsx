"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/booking/format";
import { BOOKING_PATH, AVAILABILITY_PATH, meetingPhase } from "@/lib/booking/rules";
import type { OwnBooking } from "@/lib/booking/types";
import { useNow } from "@/lib/booking/use-now";
import { formatTimeLeft } from "@/lib/dashboard/rules";
import { cn } from "@/lib/utils";

import { JoinButton } from "../../booking/_components/join-button";

// The tile "Rendez-vous" of the dashboard (docs/dashboard.md, "Rendez-vous du jour"): the number of
// today's bookings, then each of them, the nearest first. "Rejoindre" once its room is open,
// otherwise the time left; refreshed every 30 seconds.
export function TodayBookings({
  bookings,
  next,
  timeZone,
  serverNow,
}: {
  bookings: OwnBooking[];
  next: OwnBooking | null;
  timeZone: string;
  serverNow: string;
}) {
  const now = useNow(serverNow, 30_000);

  return (
    <section aria-labelledby="dashboard-bookings" className="flex flex-col gap-5 border-r border-b border-border p-7 md:col-span-2 xl:row-span-2">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="dashboard-bookings" className="eyebrow text-muted-foreground">
          Rendez-vous
        </h2>
        <Link href={BOOKING_PATH} className={cn(buttonVariants({ variant: "link", size: "xs" }), "px-0")}>
          Tout voir
        </Link>
      </div>
      <p className="flex items-baseline gap-4">
        <span className="font-heading text-7xl leading-none font-medium tabular-nums">{bookings.length}</span>
        <span>aujourd&apos;hui</span>
      </p>
      {bookings.length === 0 ? (
        <p className="border-t border-border pt-4 text-sm text-muted-foreground">
          Aucun rendez-vous aujourd&apos;hui.
          {next ? (
            <> Le prochain : {formatDate(new Date(next.startAt), timeZone)} à {formatTime(new Date(next.startAt), timeZone)}.</>
          ) : (
            <>
              {" "}
              <Link href={AVAILABILITY_PATH} className="text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground">
                Mes disponibilités
              </Link>
            </>
          )}
        </p>
      ) : (
        <ul className="flex flex-col border-t border-border">
          {bookings.map((booking) => (
            <BookingRow key={booking.id} booking={booking} timeZone={timeZone} now={now} />
          ))}
        </ul>
      )}
    </section>
  );
}

function BookingRow({ booking, timeZone, now }: { booking: OwnBooking; timeZone: string; now: Date }) {
  const start = new Date(booking.startAt);
  const end = new Date(booking.endAt);
  const phase = meetingPhase({ startAt: start, endAt: end, cancelled: false }, now);
  const role = [booking.guestRole, booking.guestCompany].filter(Boolean).join(" · ");

  return (
    <li className="flex items-center gap-4 border-b border-border py-4 last:border-b-0">
      <span className={cn("flex w-16 flex-col tabular-nums", phase === "over" && "text-muted-foreground")}>
        <span className="font-medium">{formatTime(start, timeZone)}</span>
        <span className="text-xs text-muted-foreground">{formatTime(end, timeZone)}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <Link href={BOOKING_PATH} className="flex items-center gap-2 text-sm font-medium outline-none hover:underline focus-visible:underline">
          <span className="truncate">{booking.guestName}</span>
          {!booking.isSeen && <span role="img" aria-label="Nouveau" className="size-1.5 shrink-0 rounded-full bg-primary" />}
        </Link>
        {role && <span className="truncate text-[13px] text-muted-foreground">{role}</span>}
      </span>
      {phase === "open" ? (
        <JoinButton booking={booking} timeZone={timeZone} now={now} />
      ) : (
        <span className="text-[13px] text-muted-foreground tabular-nums">
          {phase === "over" ? "Terminé" : formatTimeLeft(start.getTime() - now.getTime())}
        </span>
      )}
    </li>
  );
}
