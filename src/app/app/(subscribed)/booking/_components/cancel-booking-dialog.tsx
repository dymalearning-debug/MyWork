"use client";

import { LoaderCircleIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatTime } from "@/lib/booking/format";
import { CANCEL_MESSAGE_MAX } from "@/lib/booking/rules";
import type { OwnBooking } from "@/lib/booking/types";

import { cancelBooking } from "../actions";

// "Annuler le rendez-vous" (docs/booking.md, "Annuler un rendez-vous (propriétaire)"): a small
// window with an optional message for the guest. The slot is free again; the email to the guest
// is prepared.
export function CancelBookingDialog({
  booking,
  timeZone,
  onOpenChange,
}: {
  booking: OwnBooking | null;
  timeZone: string;
  onOpenChange: (open: boolean) => void;
}) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function confirm() {
    if (!booking) return;
    startTransition(async () => {
      const result = await cancelBooking(booking.id, message.trim());
      if (!result.ok) {
        toast.error("Le rendez-vous n'a pas pu être annulé. Réessayez.");
        return;
      }
      toast.success("Rendez-vous annulé", { description: `Le créneau est de nouveau libre. ${booking.guestName} sera prévenu par e-mail quand l'envoi sera branché.` });
      setMessage("");
      onOpenChange(false);
    });
  }

  const start = booking ? new Date(booking.startAt) : null;

  return (
    <Dialog
      open={!!booking}
      onOpenChange={(open) => {
        if (pending) return;
        onOpenChange(open);
        if (!open) setMessage("");
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Annuler le rendez-vous</DialogTitle>
          <DialogDescription>
            {booking && start
              ? `Annuler le rendez-vous avec ${booking.guestName}, ${formatDate(start, timeZone).toLowerCase()} à ${formatTime(start, timeZone)} ?`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="cancel-message">
            Message pour l&apos;invité <span className="font-normal text-muted-foreground">· facultatif</span>
          </Label>
          <Textarea
            id="cancel-message"
            value={message}
            maxLength={CANCEL_MESSAGE_MAX}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Un imprévu, une autre date à proposer…"
            className="min-h-24"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Retour
          </Button>
          <Button variant="destructive" disabled={pending} onClick={confirm}>
            {pending && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
            Annuler le rendez-vous
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
