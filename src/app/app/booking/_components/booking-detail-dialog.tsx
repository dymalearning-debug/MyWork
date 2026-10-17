"use client";

import { CheckIcon, CopyIcon, MailIcon, Trash2Icon, XCircleIcon } from "lucide-react";
import { useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate, formatTimeRange, timeZoneLabel } from "@/lib/booking/format";
import { meetingPhase } from "@/lib/booking/rules";
import type { OwnBooking } from "@/lib/booking/types";

import { JoinButton } from "./join-button";

export type BookingActions = {
  open: (booking: OwnBooking) => void;
  cancel: (booking: OwnBooking) => void;
  remove: (booking: OwnBooking) => void;
  copyLink: (booking: OwnBooking) => void;
};

// The detail of a booking (docs/booking.md, "La liste"): date and time, the guest (email with
// "Copier" and "Écrire", role, company), the whole message, the date of the booking, the guest's
// link (useful while the emails are not sent), and the actions.
export function BookingDetailDialog({
  booking,
  timeZone,
  now,
  onOpenChange,
  actions,
}: {
  booking: OwnBooking | null;
  timeZone: string;
  now: Date;
  onOpenChange: (open: boolean) => void;
  actions: BookingActions;
}) {
  return (
    <Dialog open={!!booking} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px]">{booking && <Detail booking={booking} timeZone={timeZone} now={now} actions={actions} close={() => onOpenChange(false)} />}</DialogContent>
    </Dialog>
  );
}

function Detail({
  booking,
  timeZone,
  now,
  actions,
  close,
}: {
  booking: OwnBooking;
  timeZone: string;
  now: Date;
  actions: BookingActions;
  close: () => void;
}) {
  const start = new Date(booking.startAt);
  const end = new Date(booking.endAt);
  const cancelled = booking.status === "cancelled";
  const phase = meetingPhase({ startAt: start, endAt: end, cancelled }, now);
  const isUpcoming = phase === "early" || phase === "open";

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <p className="eyebrow text-muted-foreground">{formatDate(start, timeZone)}</p>
          {cancelled ? (
            <Badge variant="destructive">Annulé</Badge>
          ) : phase === "over" ? (
            <Badge variant="secondary">Passé</Badge>
          ) : (
            <Badge variant="success">Confirmé</Badge>
          )}
        </div>
        <DialogTitle className="font-heading text-[28px] leading-tight font-medium">{booking.guestName}</DialogTitle>
        <DialogDescription className="tabular-nums">
          {formatTimeRange(start, end, timeZone)} · Visio · {timeZoneLabel(timeZone)}
        </DialogDescription>
      </DialogHeader>

      <dl className="flex flex-col border-t border-border text-sm">
        <Row term="E-mail">
          <span className="flex items-center gap-1">
            <span className="truncate">{booking.guestEmail}</span>
            <CopyButton value={booking.guestEmail} label="Copier l'e-mail" />
            <a href={`mailto:${booking.guestEmail}`} className={buttonVariants({ variant: "ghost", size: "xs" })}>
              <MailIcon data-icon="inline-start" />
              Écrire
            </a>
          </span>
        </Row>
        {booking.guestRole && <Row term="Fonction">{booking.guestRole}</Row>}
        {booking.guestCompany && <Row term="Entreprise">{booking.guestCompany}</Row>}
        <Row term="Réservé le">
          <span className="tabular-nums">
            {formatDate(new Date(booking.createdAt), timeZone, { year: true })}
          </span>
        </Row>
        <Row term="Référence">
          <span className="tabular-nums">{booking.reference}</span>
        </Row>
      </dl>

      <div className="flex flex-col gap-1.5">
        <p className="eyebrow text-muted-foreground">Objet du rendez-vous</p>
        <p className="max-h-48 overflow-y-auto bg-muted px-4 py-3 text-sm leading-6 whitespace-pre-line">{booking.guestMessage}</p>
      </div>

      {cancelled && (
        <p className="text-sm text-destructive">
          Annulé par {booking.cancelledBy === "owner" ? "vous" : "l'invité"}
          {booking.cancelMessage ? ` : « ${booking.cancelMessage} »` : "."}
        </p>
      )}

      <div className="flex items-center gap-2 border-t border-border pt-4">
        {isUpcoming && (
          <>
            <JoinButton booking={booking} timeZone={timeZone} now={now} size="sm" />
            <Button variant="outline" size="sm" onClick={() => actions.copyLink(booking)}>
              <CopyIcon data-icon="inline-start" />
              Copier le lien de l&apos;invité
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="ml-auto"
              onClick={() => {
                close();
                actions.cancel(booking);
              }}
            >
              <XCircleIcon data-icon="inline-start" />
              Annuler le rendez-vous
            </Button>
          </>
        )}
        {!isUpcoming && (
          <Button
            variant="destructive"
            className="ml-auto"
            onClick={() => {
              close();
              actions.remove(booking);
            }}
          >
            <Trash2Icon data-icon="inline-start" />
            Supprimer
          </Button>
        )}
      </div>
    </>
  );
}

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] items-center gap-3 border-b border-border py-2">
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  return (
    <Button
      variant="ghost"
      size="xs"
      aria-label={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          return;
        }
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <CheckIcon data-icon="inline-start" /> : <CopyIcon data-icon="inline-start" />}
      {copied ? "Copié" : "Copier"}
    </Button>
  );
}
