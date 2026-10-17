"use client";

import { ArrowLeftIcon } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { formatDate, formatTime, formatTimeRange } from "@/lib/booking/format";
import { meetingPhase, meetingWindow } from "@/lib/booking/rules";
import { useNow } from "@/lib/booking/use-now";
import { cn } from "@/lib/utils";

import type { MeetingDetails } from "./meeting-client";

// The meeting room of a booking (docs/booking.md, "Visio"), for the owner and for the guest. Out of
// the window of the room (15 minutes before the start, 30 minutes after the planned end), or for a
// cancelled booking, a message and a way back: no token is asked for. Inside, the preparation
// screen then the room, loaded only in the browser (LiveKit).
const MeetingClient = dynamic(() => import("./meeting-client").then((m) => m.MeetingClient), {
  ssr: false,
  loading: () => <div className="flex-1 bg-background" />,
});

export function MeetingRoom(props: Omit<MeetingDetails, "closesAt"> & { serverNow: string; cancelled: boolean }) {
  const { serverNow, cancelled, ...details } = props;
  const now = useNow(serverNow);
  const start = new Date(details.startAt);
  const end = new Date(details.endAt);
  const phase = meetingPhase({ startAt: start, endAt: end, cancelled }, now);
  const { opensAt, closesAt } = meetingWindow(start, end);

  if (phase === "open") return <MeetingClient {...details} closesAt={closesAt.toISOString()} />;

  const message =
    phase === "early"
      ? `La salle de visio ouvrira ${formatDate(start, details.timeZone).toLowerCase()} à ${formatTime(opensAt, details.timeZone)}, 15 minutes avant le rendez-vous. Revenez à ce moment-là.`
      : phase === "over"
        ? "Ce rendez-vous est terminé : la salle est fermée."
        : "Ce rendez-vous a été annulé.";

  return (
    <div className="flex min-h-svh flex-1 flex-col bg-spotlight">
      <header className="flex items-center gap-4 border-b border-border px-6 py-4">
        <Logo className="h-5" />
        <span className="text-sm text-muted-foreground">
          Rendez-vous avec <strong className="font-medium text-foreground">{details.otherName}</strong>
        </span>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-6 py-16">
        <p className="eyebrow text-muted-foreground tabular-nums">
          {formatDate(start, details.timeZone)} · {formatTimeRange(start, end, details.timeZone)}
        </p>
        <h1 className="font-heading text-4xl font-medium">{phase === "early" ? "Revenez plus tard" : "Salle fermée"}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{message}</p>
        <Link href={details.backHref} className={cn(buttonVariants({ variant: "outline" }), "self-start")}>
          <ArrowLeftIcon data-icon="inline-start" />
          Retour
        </Link>
      </main>
    </div>
  );
}
