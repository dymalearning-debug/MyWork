"use client";

import { VideoIcon } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatTime } from "@/lib/booking/format";
import { meetingPhase, meetingWindow, ownerMeetPath } from "@/lib/booking/rules";
import type { OwnBooking } from "@/lib/booking/types";

// "Rejoindre": red and active from 15 minutes before the start until 30 minutes after the end;
// before, greyed, with "La salle ouvre à 10:15".
export function JoinButton({ booking, timeZone, now, size = "sm" }: { booking: OwnBooking; timeZone: string; now: Date; size?: "sm" | "default" }) {
  const start = new Date(booking.startAt);
  const end = new Date(booking.endAt);
  const phase = meetingPhase({ startAt: start, endAt: end, cancelled: booking.status === "cancelled" }, now);
  if (phase === "open") {
    return (
      <Link href={ownerMeetPath(booking.id)} className={buttonVariants({ size })}>
        <VideoIcon data-icon="inline-start" />
        Rejoindre
      </Link>
    );
  }
  if (phase !== "early") return null;
  return (
    <Tooltip>
      <TooltipTrigger render={<span tabIndex={0} className="outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />}>
        <Button size={size} variant="secondary" disabled aria-label={`Rejoindre, la salle ouvre à ${formatTime(meetingWindow(start, end).opensAt, timeZone)}`}>
          Rejoindre
        </Button>
      </TooltipTrigger>
      <TooltipContent>La salle ouvre à {formatTime(meetingWindow(start, end).opensAt, timeZone)}</TooltipContent>
    </Tooltip>
  );
}
