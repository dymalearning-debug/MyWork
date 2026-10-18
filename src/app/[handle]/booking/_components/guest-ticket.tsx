"use client";

import { CalendarPlusIcon, CheckIcon, CopyIcon, LoaderCircleIcon, VideoIcon } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { ProfilePhoto } from "@/components/profile-photo";
import { StatusDot } from "@/components/status-dot";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { dayParts, formatCountdown, formatTime, timeZoneLabel } from "@/lib/booking/format";
import {
  CANCEL_MESSAGE_MAX,
  guestBookingPath,
  guestIcsPath,
  guestMeetPath,
  meetingPhase,
  meetingWindow,
  publicBookingPath,
} from "@/lib/booking/rules";
import { localDay } from "@/lib/booking/time";
import { useBrowserTimeZone, useOrigin } from "@/lib/booking/use-browser";
import { useNow } from "@/lib/booking/use-now";
import { cn } from "@/lib/utils";

import { cancelGuestBooking } from "../actions";

// The guest's ticket (docs/booking.md, "Page du rendez-vous"), mockup "Public — Page de l'invité
// (mobile)", direction "B · Semainier": the state as a label and the short reference; the ticket
// (the day, the hour, the two participants, then the state of the room: countdown, open room, over
// or cancelled); "Ajouter à l'agenda" and "Annuler" while it is to come; the link to keep.

export type TicketBooking = {
  reference: string;
  startAt: string;
  endAt: string;
  status: "confirmed" | "cancelled";
  cancelledBy: "owner" | "guest" | null;
  cancelMessage: string | null;
  guestName: string;
  guestTimeZone: string;
  bookable: boolean;
};

const STATUS_LABELS = {
  early: "Rendez-vous confirmé",
  open: "C'est l'heure",
  over: "Rendez-vous passé",
  cancelled: "Rendez-vous annulé",
} as const;

export function GuestTicket({
  handle,
  code,
  serverNow,
  booking,
  owner,
}: {
  handle: string;
  code: string;
  serverNow: string;
  booking: TicketBooking;
  owner: { name: string; initials: string; photoUrl: string | null };
}) {
  const now = useNow(serverNow);
  // The visitor's time zone, from their browser.
  const timeZone = useBrowserTimeZone(booking.guestTimeZone);
  const [cancelling, setCancelling] = useState(false);

  const start = new Date(booking.startAt);
  const end = new Date(booking.endAt);
  const cancelled = booking.status === "cancelled";
  const phase = meetingPhase({ startAt: start, endAt: end, cancelled }, now);
  const { opensAt } = meetingWindow(start, end);
  const parts = dayParts(localDay(start, timeZone));
  const upcoming = phase === "early" || phase === "open";
  // The guest can cancel until the start.
  const cancellable = !cancelled && now < start;
  const struck = cancelled ? "text-muted-foreground line-through" : "";
  const guestInitials = booking.guestName
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <div className="flex items-center justify-between">
        <span className={cn("eyebrow", phase === "cancelled" ? "text-destructive" : "text-muted-foreground")}>{STATUS_LABELS[phase]}</span>
        <span className="eyebrow text-muted-foreground tabular-nums">N° {booking.reference}</span>
      </div>

      <article className="flex flex-col border border-border bg-background" aria-label="Votre rendez-vous">
        <div className="flex flex-col gap-4.5 px-5 py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="eyebrow text-muted-foreground">{parts.weekday}</span>
              <span className={cn("font-heading text-[64px] leading-[0.9] font-medium tabular-nums", struck)}>{parts.date}</span>
              <span className="text-[15px]">{parts.monthYear}</span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="eyebrow text-muted-foreground">{timeZoneLabel(timeZone)}</span>
              <span className={cn("font-heading text-[40px] leading-none font-medium tabular-nums", struck)}>{formatTime(start, timeZone)}</span>
              <span className="text-sm text-muted-foreground tabular-nums">jusqu&apos;à {formatTime(end, timeZone)}</span>
            </div>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2.5 border-t border-border pt-4">
            <span className="flex min-w-0 items-center gap-2.5">
              <ProfilePhoto url={owner.photoUrl} initials={owner.initials} className="size-9 text-sm" />
              <span className="truncate text-sm">{owner.name}</span>
            </span>
            <VideoIcon aria-label="en visio" className="size-4 text-muted-foreground" />
            <span className="flex min-w-0 items-center justify-end gap-2.5">
              <span className="text-sm">Vous</span>
              <span aria-hidden className="flex size-9 shrink-0 items-center justify-center border border-border bg-muted text-sm">
                {guestInitials}
              </span>
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3.5 border-t border-dashed border-border p-5">
          {phase === "early" && (
            <>
              <div className="flex flex-col gap-1">
                <span className="font-heading text-[44px] leading-none font-medium tabular-nums" role="timer">
                  {formatCountdown(opensAt.getTime() - now.getTime())}
                </span>
                <span className="text-sm text-muted-foreground">
                  avant l&apos;ouverture de la salle, à <span className="tabular-nums">{formatTime(opensAt, timeZone)}</span>. Revenez à ce
                  moment-là.
                </span>
              </div>
              <Button size="lg" variant="secondary" disabled className="w-full">
                Rejoindre la visio
              </Button>
            </>
          )}
          {phase === "open" && (
            <>
              <span className="flex items-center gap-2 text-[15px]">
                <StatusDot tone="success" pulse />
                La salle est ouverte.
              </span>
              <Link href={guestMeetPath(handle, code)} className={cn(buttonVariants({ size: "lg" }), "w-full")}>
                <VideoIcon data-icon="inline-start" />
                Rejoindre la visio
              </Link>
            </>
          )}
          {phase === "over" && <span className="text-[15px]">Ce rendez-vous est terminé.</span>}
          {phase === "cancelled" && (
            <>
              <span className="text-[15px] text-destructive">
                {booking.cancelledBy === "owner" ? `Ce rendez-vous a été annulé par ${owner.name}.` : "Vous avez annulé ce rendez-vous."}
              </span>
              {booking.cancelMessage && (
                <p className="bg-muted px-4 py-3 font-heading text-[17px] leading-relaxed whitespace-pre-line italic">{booking.cancelMessage}</p>
              )}
            </>
          )}
          {(phase === "over" || phase === "cancelled") && booking.bookable && (
            <Link href={publicBookingPath(handle)} className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}>
              Réserver un autre créneau
            </Link>
          )}
        </div>
      </article>

      {upcoming && (
        <div className="grid grid-cols-2 gap-2">
          <a href={guestIcsPath(handle, code)} download className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-3")}>
            <CalendarPlusIcon data-icon="inline-start" className="max-sm:hidden" />
            Ajouter à l&apos;agenda
          </a>
          <Button variant="outline" size="lg" className="px-3 text-destructive" disabled={!cancellable} onClick={() => setCancelling(true)}>
            Annuler
          </Button>
        </div>
      )}

      {upcoming && <KeepLink path={guestBookingPath(handle, code)} />}

      <CancelDialog
        open={cancelling}
        onOpenChange={setCancelling}
        handle={handle}
        code={code}
        description={`Annuler le rendez-vous avec ${owner.name}, ${parts.weekday} ${parts.date} ${parts.monthYear.replace(/\s\d{4}$/, "")} à ${formatTime(start, timeZone)} ?`}
      />
    </>
  );
}

// The link of the booking, to keep (it is also in the confirmation email).
function KeepLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  const origin = useOrigin();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  return (
    <div className="flex flex-col gap-2.5 border border-dashed border-border p-5">
      <span className="eyebrow text-muted-foreground">Lien du rendez-vous</span>
      <span className="text-sm break-all tabular-nums">{`${origin.replace(/^https?:\/\//, "")}${path}`}</span>
      <span className="text-[13px] text-muted-foreground">Gardez ce lien : il permet de rejoindre la visio et d&apos;annuler.</span>
      <Button
        variant="outline"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(`${window.location.origin}${path}`);
          } catch {
            toast.error("Le lien n'a pas pu être copié.");
            return;
          }
          setCopied(true);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
        {copied ? "Lien copié" : "Copier le lien"}
      </Button>
    </div>
  );
}

function CancelDialog({
  open,
  onOpenChange,
  handle,
  code,
  description,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  handle: string;
  code: string;
  description: string;
}) {
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Annuler le rendez-vous</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cancel-reason">
            Motif <span className="font-normal text-muted-foreground">· facultatif</span>
          </Label>
          <Textarea id="cancel-reason" value={reason} maxLength={CANCEL_MESSAGE_MAX} onChange={(event) => setReason(event.target.value)} className="min-h-24" />
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Retour
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await cancelGuestBooking(handle, code, reason);
                if (!result.ok) {
                  toast.error("Le rendez-vous n'a pas pu être annulé. Réessayez.");
                  return;
                }
                toast.success("Rendez-vous annulé", { description: "Le créneau est de nouveau libre." });
                onOpenChange(false);
              })
            }
          >
            {pending && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
            Annuler le rendez-vous
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
