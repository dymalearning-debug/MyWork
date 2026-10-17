import type { BookingSettings, DayOverride, WeeklyRange } from "./rules";

// Shapes of the module's data, as the pages receive them (dates as ISO strings, in UTC).

// "Disponibilités": what the page shows and saves. bookedDays: the days that already have bookings
// (warning on a special day).
export type BookingSetup = {
  isNew: boolean;
  settings: BookingSettings;
  weekly: WeeklyRange[];
  overrides: DayOverride[];
  bookedDays: { day: string; count: number }[];
};

// A booking of "Mes rendez-vous".
export type OwnBooking = {
  id: string;
  startAt: string;
  endAt: string;
  status: "confirmed" | "cancelled";
  cancelledBy: "owner" | "guest" | null;
  cancelMessage: string | null;
  guestName: string;
  guestEmail: string;
  guestRole: string | null;
  guestCompany: string | null;
  guestMessage: string;
  guestTimeZone: string;
  code: string;
  reference: string;
  isSeen: boolean;
  createdAt: string;
  cancelledAt: string | null;
};

// What the slots of the public tab are computed from (get_public_booking_availability).
export type PublicAvailability = {
  now: string;
  timeZone: string;
  bufferMinutes: number;
  noticeMinutes: number;
  horizonDays: number;
  dailyLimit: number | null;
  weekly: WeeklyRange[];
  overrides: DayOverride[];
  busy: { start: string; end: string }[];
};

// A booking seen through its secret link (get_public_booking).
export type PublicBooking = {
  id: string;
  reference: string;
  startAt: string;
  endAt: string;
  status: "confirmed" | "cancelled";
  cancelledBy: "owner" | "guest" | null;
  cancelMessage: string | null;
  guestName: string;
  guestTimeZone: string;
  owner: { handle: string; firstName: string; lastName: string; photoUrl: string | null };
  bookable: boolean;
};
