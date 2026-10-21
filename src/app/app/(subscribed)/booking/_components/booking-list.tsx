"use client";

import { CopyIcon, EllipsisIcon, EyeIcon, Trash2Icon, XCircleIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { OwnBookings } from "@/lib/booking/data";
import { dayHeading, formatTimeRange } from "@/lib/booking/format";
import { BOOKING_PATH, guestBookingPath, meetingPhase, type BookingFilter } from "@/lib/booking/rules";
import { localDay } from "@/lib/booking/time";
import type { OwnBooking } from "@/lib/booking/types";
import { useNow } from "@/lib/booking/use-now";
import { cn } from "@/lib/utils";

import { deleteBooking, markBookingSeen } from "../actions";
import { BookingDetailDialog, type BookingActions } from "./booking-detail-dialog";
import { CancelBookingDialog } from "./cancel-booking-dialog";
import { CopyAddressButton } from "./copy-address-button";
import { JoinButton } from "./join-button";

// The list of "Mes rendez-vous" (docs/booking.md, "La liste"), mockup "A · Agenda": three filters,
// the bookings grouped by day, one row each (hour, guest, their role, the start of their message,
// "Rejoindre" and the "…" menu). A click on a row opens the detail.

const FILTERS: { value: BookingFilter; label: string }[] = [
  { value: "upcoming", label: "À venir" },
  { value: "past", label: "Passés" },
  { value: "cancelled", label: "Annulés" },
];

const EMPTY: Record<BookingFilter, string> = {
  upcoming: "Aucun rendez-vous à venir",
  past: "Aucun rendez-vous passé",
  cancelled: "Aucun rendez-vous annulé",
};

const filterHref = (filter: BookingFilter, more = 1) => {
  const params = new URLSearchParams();
  if (filter !== "upcoming") params.set("filter", filter);
  if (more > 1) params.set("more", String(more));
  const query = params.toString();
  return query ? `${BOOKING_PATH}?${query}` : BOOKING_PATH;
};

export async function copyGuestLink(handle: string, booking: OwnBooking) {
  try {
    await navigator.clipboard.writeText(`${window.location.origin}${guestBookingPath(handle, booking.code)}`);
    toast.success("Lien de l'invité copié", { description: "Il permet de rejoindre la visio et d'annuler." });
  } catch {
    toast.error("Le lien n'a pas pu être copié.");
  }
}

export function BookingList({
  filter,
  pages,
  list,
  timeZone,
  serverNow,
  bookingPath,
  handle,
}: {
  filter: BookingFilter;
  pages: number;
  list: OwnBookings;
  timeZone: string;
  serverNow: string;
  bookingPath: string;
  handle: string;
}) {
  const now = useNow(serverNow, 15_000);
  const [detail, setDetail] = useState<OwnBooking | null>(null);
  const [cancelling, setCancelling] = useState<OwnBooking | null>(null);
  const [deleting, setDeleting] = useState<OwnBooking | null>(null);

  function open(booking: OwnBooking) {
    setDetail(booking);
    if (!booking.isSeen) void markBookingSeen(booking.id);
  }

  async function remove(booking: OwnBooking) {
    const result = await deleteBooking(booking.id);
    if (result.ok) toast.success("Rendez-vous supprimé", { description: `Les données de ${booking.guestName} ont été effacées.` });
    else toast.error("Le rendez-vous n'a pas pu être supprimé. Réessayez.");
  }

  // Grouped by day, in the owner's time zone.
  const today = localDay(now, timeZone);
  const groups: { day: string; bookings: OwnBooking[] }[] = [];
  for (const booking of list.bookings) {
    const day = localDay(new Date(booking.startAt), timeZone);
    const last = groups.at(-1);
    if (last?.day === day) last.bookings.push(booking);
    else groups.push({ day, bookings: [booking] });
  }

  const actions = {
    open,
    cancel: setCancelling,
    remove: setDeleting,
    copyLink: (booking: OwnBooking) => copyGuestLink(handle, booking),
  };

  return (
    <div className="flex flex-col gap-6 pt-6 pb-12">
      <div role="group" aria-label="Filtrer" className="flex">
        {FILTERS.map((f, index) => (
          <Link
            key={f.value}
            href={filterHref(f.value)}
            aria-current={f.value === filter ? "page" : undefined}
            className={cn(
              buttonVariants({ variant: f.value === filter ? "contrast" : "outline", size: "sm" }),
              index > 0 && "-ml-px",
            )}
          >
            {f.label}
            {f.value === "upcoming" && <span className="tabular-nums"> · {list.upcomingCount}</span>}
          </Link>
        ))}
      </div>

      {list.bookings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border border-dashed border-border px-6 py-16 text-center">
          <p className="font-heading text-2xl font-semibold">{EMPTY[filter]}</p>
          {filter === "upcoming" && (
            <>
              <p className="text-sm text-muted-foreground">Partagez votre profil public pour en recevoir.</p>
              <CopyAddressButton path={bookingPath} />
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.day} aria-label={dayHeading(group.day, today)}>
              <h2 className="eyebrow mb-1.5 text-muted-foreground">{dayHeading(group.day, today)}</h2>
              <ul className="border-t border-border">
                {group.bookings.map((booking) => (
                  <BookingRow key={booking.id} booking={booking} timeZone={timeZone} now={now} actions={actions} />
                ))}
              </ul>
            </section>
          ))}
          {list.hasMore && (
            <Link href={filterHref(filter, pages + 1)} scroll={false} className={cn(buttonVariants({ variant: "outline" }), "self-center")}>
              Afficher plus
            </Link>
          )}
        </div>
      )}

      <BookingDetailDialog
        booking={detail}
        timeZone={timeZone}
        now={now}
        onOpenChange={(isOpen) => !isOpen && setDetail(null)}
        actions={actions}
      />
      <CancelBookingDialog booking={cancelling} timeZone={timeZone} onOpenChange={(isOpen) => !isOpen && setCancelling(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(isOpen) => !isOpen && setDeleting(null)}
        title="Supprimer ce rendez-vous ?"
        description={
          deleting
            ? `Le rendez-vous avec ${deleting.guestName} et ses informations (nom, e-mail, message) seront effacés définitivement.`
            : ""
        }
        confirmLabel="Supprimer"
        onConfirm={() => deleting && void remove(deleting)}
      />
    </div>
  );
}


function BookingRow({ booking, timeZone, now, actions }: { booking: OwnBooking; timeZone: string; now: Date; actions: BookingActions }) {
  const start = new Date(booking.startAt);
  const end = new Date(booking.endAt);
  const role = [booking.guestRole, booking.guestCompany].filter(Boolean).join(" · ");
  const cancelled = booking.status === "cancelled";
  const isUpcoming = !cancelled && meetingPhase({ startAt: start, endAt: end, cancelled }, now) !== "over";

  return (
    <li className="group relative grid grid-cols-[120px_220px_minmax(0,1fr)_auto] items-center gap-5 border-b border-border px-4 py-3.5 transition-colors hover:bg-accent">
      <span className={cn("text-[15px] font-medium tabular-nums", cancelled && "text-muted-foreground line-through")}>
        {formatTimeRange(start, end, timeZone)}
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <button
          type="button"
          onClick={() => actions.open(booking)}
          className="flex items-center gap-2 truncate text-left text-[15px] font-medium outline-none after:absolute after:inset-0 focus-visible:underline"
        >
          <span className="truncate">{booking.guestName}</span>
          {!booking.isSeen && !cancelled && <span aria-label="Nouveau" role="img" className="size-1.5 shrink-0 rounded-full bg-primary" />}
        </button>
        {role && <span className="truncate text-[13px] text-muted-foreground">{role}</span>}
      </div>
      <span className="truncate text-sm text-muted-foreground">
        {cancelled ? `Annulé par ${booking.cancelledBy === "owner" ? "vous" : "l'invité"}` : booking.guestMessage}
      </span>
      <div className="relative z-10 flex items-center gap-1">
        {isUpcoming && <JoinButton booking={booking} timeZone={timeZone} now={now} />}
        <BookingMenu booking={booking} isUpcoming={isUpcoming} actions={actions} />
      </div>
    </li>
  );
}

function BookingMenu({ booking, isUpcoming, actions }: { booking: OwnBooking; isUpcoming: boolean; actions: BookingActions }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions pour ${booking.guestName}`} />}>
        <EllipsisIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuItem onClick={() => actions.open(booking)}>
          <EyeIcon />
          Voir le détail
        </DropdownMenuItem>
        {isUpcoming && (
          <DropdownMenuItem onClick={() => actions.copyLink(booking)}>
            <CopyIcon />
            Copier le lien de l&apos;invité
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {isUpcoming ? (
          <DropdownMenuItem variant="destructive" onClick={() => actions.cancel(booking)}>
            <XCircleIcon />
            Annuler le rendez-vous
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem variant="destructive" onClick={() => actions.remove(booking)}>
            <Trash2Icon />
            Supprimer
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
