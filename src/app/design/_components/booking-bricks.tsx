"use client"

import { BookingFlow } from "@/app/[handle]/booking/_components/booking-flow"
import { GuestTicket } from "@/app/[handle]/booking/_components/guest-ticket"
import { BookingList } from "@/app/app/booking/_components/booking-list"
import { DEFAULT_WEEKLY } from "@/lib/booking/rules"
import type { OwnBooking } from "@/lib/booking/types"

import { ModuleHeading } from "./showcase"

// The real components of the Rendez-vous module (docs/booking.md), with fictional data (Inès
// Robert and her guests): the week of the public tab, the guest's ticket, the list of
// "Mes rendez-vous". The time is frozen on Friday 16 October 2026, 10:00 in Paris.

const NOW = "2026-10-16T08:00:00Z"

// Free slots of the week of 19 October, in Paris (UTC+2), with a booking on Monday at 9:00.
const at = (day: number, time: string) => {
  const [h, m] = time.split(":").map(Number)
  return new Date(Date.UTC(2026, 9, day, h - 2, m)).toISOString()
}
const GRID = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"]
const SLOTS = [
  ...["09:45", "10:00", "10:30", "11:00", "11:30", "14:00", "15:00", "16:30", "17:00"].map((t) => at(19, t)),
  ...GRID.map((t) => at(20, t)),
  ...GRID.filter((_, i) => i % 3 !== 0).map((t) => at(21, t)),
  ...GRID.map((t) => at(23, t)),
]

const booking = (fields: Partial<OwnBooking>): OwnBooking => ({
  id: "b0",
  startAt: at(19, "09:00"),
  endAt: at(19, "09:30"),
  status: "confirmed",
  cancelledBy: null,
  cancelMessage: null,
  guestName: "Marc Dubois",
  guestEmail: "marc.dubois@exemple.fr",
  guestRole: "Directeur produit",
  guestCompany: "Alto",
  guestMessage: "Audit UX de notre parcours d'inscription.",
  guestTimeZone: "Europe/Paris",
  code: "k7Qm2xR9aB3dE5fG7hJ9kL1m",
  reference: "K7QM-2XR9",
  isSeen: true,
  createdAt: "2026-10-14T09:12:00Z",
  cancelledAt: null,
  ...fields,
})

const BOOKINGS: OwnBooking[] = [
  booking({
    id: "b1",
    startAt: at(16, "10:15"),
    endAt: at(16, "10:45"),
    guestName: "Claire Martin",
    guestRole: "Recruteuse",
    guestCompany: "Talentis",
    guestMessage: "Poste de lead designer en CDI, équipe de huit personnes, démarrage en janvier.",
  }),
  booking({ id: "b2", guestName: "Thomas Leroy", guestRole: "Dirigeant", guestCompany: "Studio Nord", guestMessage: "Refonte de notre application mobile, cadrage et devis." }),
  booking({
    id: "b3",
    startAt: at(19, "15:30"),
    endAt: at(19, "16:00"),
    guestName: "Sarah Benali",
    guestRole: "Freelance",
    guestCompany: null,
    guestMessage: "Je cherche une designer pour une mission de trois mois.",
    isSeen: false,
  }),
  booking({ id: "b4", startAt: at(20, "10:30"), endAt: at(20, "11:00"), isSeen: false }),
]

export function BookingBricks() {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <ModuleHeading module="Module · Rendez-vous" title="Prendre rendez-vous (onglet public)" />
        <div className="border border-border p-6">
          <BookingFlow
            handle="ines-robert"
            ownerName="Inès Robert"
            hasContact
            slots={SLOTS}
            serverNow={NOW}
            ownerTimeZone="Europe/Paris"
            horizonDays={60}
            weekly={DEFAULT_WEEKLY}
            overrides={[{ day: "2026-10-22", ranges: [] }]}
          />
        </div>
      </div>
      <div className="grid gap-10 lg:grid-cols-[400px_minmax(0,1fr)]">
        <div>
          <ModuleHeading module="Module · Rendez-vous" title="Page de l'invité" />
          <div className="flex flex-col gap-5 border border-border bg-spotlight p-5">
            <GuestTicket
              handle="ines-robert"
              code="k7Qm2xR9aB3dE5fG7hJ9kL1m"
              serverNow={NOW}
              booking={{
                reference: "K7QM-2XR9",
                startAt: at(20, "10:30"),
                endAt: at(20, "11:00"),
                status: "confirmed",
                cancelledBy: null,
                cancelMessage: null,
                guestName: "Marc Dubois",
                guestTimeZone: "Europe/Paris",
                bookable: true,
              }}
              owner={{ name: "Inès Robert", initials: "IR", photoUrl: null }}
            />
          </div>
        </div>
        <div>
          <ModuleHeading module="Module · Rendez-vous" title="Mes rendez-vous" />
          <BookingList
            filter="upcoming"
            pages={1}
            list={{ bookings: BOOKINGS, upcomingCount: BOOKINGS.length, hasMore: false }}
            timeZone="Europe/Paris"
            serverNow={NOW}
            bookingPath="/ines-robert/booking"
            handle="ines-robert"
          />
        </div>
      </div>
    </div>
  )
}
