"use client"

import { DashboardMosaic } from "@/app/app/_components/dashboard/dashboard-mosaic"
import type { OwnBooking } from "@/lib/booking/types"
import type { Dashboard } from "@/lib/dashboard/data"
import type { Reminder } from "@/lib/dashboard/rules"

import { ModuleHeading } from "./showcase"

// The real tiles of the dashboard (docs/dashboard.md), with fictional data (Inès Robert): the time
// is frozen on Tuesday 20 October 2026, 09:48 in Paris, twelve minutes before her first booking.

const NOW = "2026-10-20T07:48:00Z"

const booking = (fields: Partial<OwnBooking>): OwnBooking => ({
  id: "d0",
  startAt: "2026-10-20T08:00:00Z",
  endAt: "2026-10-20T08:30:00Z",
  status: "confirmed",
  cancelledBy: null,
  cancelMessage: null,
  guestName: "Camille Laurent",
  guestEmail: "camille.laurent@exemple.fr",
  guestRole: "Responsable produit",
  guestCompany: "Alan",
  guestMessage: "Refonte de l'espace adhérent.",
  guestTimeZone: "Europe/Paris",
  code: "AbCdEfGhIjKlMnOpQrStUvWx",
  reference: "K7QM-2XR9",
  isSeen: true,
  createdAt: "2026-10-17T09:00:00Z",
  cancelledAt: null,
  ...fields,
})

const BOOKINGS = [
  booking({}),
  booking({
    id: "d1",
    startAt: "2026-10-20T12:30:00Z",
    endAt: "2026-10-20T13:00:00Z",
    guestName: "Hugo Martin",
    guestRole: "Chargé de recrutement",
    guestCompany: "Doctolib",
    isSeen: false,
  }),
]

const VISITS = [1, 3, 2, 0, 2, 4, 1, 2, 3, 1, 0, 2, 5, 3, 2, 1, 2, 3, 0, 2, 4, 2, 1, 2, 4, 1, 3, 5, 2, 1]

const DASHBOARD: Dashboard = {
  visitors7: 18,
  visitorsPrevious7: 13,
  visitors30: 64,
  visitorsPrevious30: 52,
  daily: VISITS.map((visitors, i) => {
    const day = new Date(Date.UTC(2026, 8, 21 + i))
    return { day: day.toISOString().slice(0, 10), visitors }
  }),
  tabs: { profile: 64, booking: 21, resources: 12 },
  signals: {
    bookings: { count: 4, lastAt: "2026-10-20T05:48:00Z" },
    contact: { count: 7, lastAt: "2026-10-19T16:12:00Z" },
    cv: { count: 11, lastAt: "2026-10-20T02:48:00Z" },
    resources: { count: 9, lastAt: "2026-10-19T09:40:00Z", top: { name: "Étude de cas Alan.pdf", count: 6 } },
  },
  isOnline: true,
  bookingOpen: true,
  storageUsed: 820 * 1024 * 1024,
  storageCapacity: 1024 * 1024 * 1024,
}

const REMINDERS: Reminder[] = [
  { id: "profile", title: "Profil complet", value: "80 %", detail: "Il manque votre formation et vos langues.", href: "#" },
  { id: "storage", title: "Stockage", value: "80 %", detail: "Supprimez des fichiers pour libérer de la place.", href: "#", tone: "warning" },
]

export function DashboardBricks() {
  return (
    <div>
      <ModuleHeading module="Tableau de bord" title="Mosaïque" />
      <DashboardMosaic dashboard={DASHBOARD} reminders={REMINDERS} bookings={BOOKINGS} next={null} timeZone="Europe/Paris" serverNow={NOW} />
    </div>
  )
}
