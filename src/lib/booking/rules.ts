// Rules of the Rendez-vous module (docs/booking.md): addresses, settings and their values, the
// meeting window. The same values are checked by the database
// (supabase/migrations/20261016120000_add_booking_module.sql).

export const BOOKING_PATH = "/app/booking";
export const AVAILABILITY_PATH = "/app/booking/availability";
export const ownerMeetPath = (bookingId: string) => `${BOOKING_PATH}/${bookingId}/meet`;

// Public addresses: the tab, the guest's page (their secret link), its room and its calendar file.
export const publicBookingPath = (handle: string) => `/${handle}/booking`;
export const guestBookingPath = (handle: string, code: string) => `/${handle}/booking/${code}`;
export const guestMeetPath = (handle: string, code: string) => `${guestBookingPath(handle, code)}/meet`;
export const guestIcsPath = (handle: string, code: string) => `${guestBookingPath(handle, code)}/ics`;

// The secret code of a link: 24 characters, letters, digits, "-" and "_" (made by the database).
export const isBookingCode = (code: string) => /^[A-Za-z0-9_-]{24}$/.test(code);
export const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

// ——— Duration and grid ———

// Fixed duration, not a setting (docs/booking.md, "Réglages").
export const DURATION_MINUTES = 30;
// Slots start on a 30-minute grid; hours are chosen with the same step.
export const GRID_MINUTES = 30;
export const DAY_MINUTES = 24 * 60;

// ——— Settings ———

export type BookingSettings = {
  isOpen: boolean;
  timeZone: string;
  bufferMinutes: number;
  noticeMinutes: number;
  horizonDays: number;
  dailyLimit: number | null;
};

export const DEFAULT_TIME_ZONE = "Europe/Paris";

export const BUFFER_OPTIONS = [
  { value: 0, label: "Aucune" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
] as const;

export const NOTICE_OPTIONS = [
  { value: 60, label: "1 h" },
  { value: 120, label: "2 h" },
  { value: 240, label: "4 h" },
  { value: 720, label: "12 h" },
  { value: 1440, label: "24 h" },
  { value: 2880, label: "48 h" },
] as const;

export const HORIZON_OPTIONS = [
  { value: 14, label: "2 semaines" },
  { value: 30, label: "1 mois" },
  { value: 60, label: "2 mois" },
  { value: 90, label: "3 mois" },
] as const;

export const DAILY_LIMIT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

// ——— Hours ———

// A range of a day, in minutes from midnight, in the owner's time zone.
export type TimeRange = { start: number; end: number };
// weekday: 1 (Monday) to 7 (Sunday).
export type WeeklyRange = TimeRange & { weekday: number };
// A special day ("yyyy-MM-dd"): its own ranges, or none (unavailable all day).
export type DayOverride = { day: string; ranges: TimeRange[] };

export const WEEKDAY_NAMES = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"] as const;

// "09:00", from minutes after midnight ("24:00" for the end of the day).
export function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

// The hours of the lists, every 30 minutes: 00:00 to 23:30 for a start, 00:30 to 24:00 for an end.
export const START_TIMES = Array.from({ length: DAY_MINUTES / GRID_MINUTES }, (_, i) => i * GRID_MINUTES);
export const END_TIMES = START_TIMES.map((minutes) => minutes + GRID_MINUTES);

export function isValidRange(range: TimeRange) {
  return (
    Number.isInteger(range.start) &&
    Number.isInteger(range.end) &&
    range.start % GRID_MINUTES === 0 &&
    range.end % GRID_MINUTES === 0 &&
    range.start >= 0 &&
    range.end <= DAY_MINUTES &&
    range.end - range.start >= DURATION_MINUTES
  );
}

export function rangesOverlap(ranges: TimeRange[]) {
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  return sorted.some((range, i) => i > 0 && range.start < sorted[i - 1].end);
}

export function sortRanges(ranges: TimeRange[]) {
  return [...ranges].sort((a, b) => a.start - b.start);
}

// Default hours (docs/booking.md, "Horaires de la semaine"): Monday to Friday, 9:00–12:00 and
// 14:00–18:00. The database gives the same at the first visit.
export const DEFAULT_WEEKLY: WeeklyRange[] = [1, 2, 3, 4, 5].flatMap((weekday) => [
  { weekday, start: 540, end: 720 },
  { weekday, start: 840, end: 1080 },
]);

// ——— Meeting window (docs/booking.md, "Visio") ———

// The room opens 15 minutes before the start, and closes 30 minutes after the planned end.
export const ROOM_OPENS_BEFORE_MINUTES = 15;
export const ROOM_CLOSES_AFTER_MINUTES = 30;
// "La salle ferme dans 5 minutes".
export const ROOM_CLOSING_WARNING_MINUTES = 5;

const MINUTE = 60_000;

export function meetingWindow(startAt: Date, endAt: Date) {
  return {
    opensAt: new Date(startAt.getTime() - ROOM_OPENS_BEFORE_MINUTES * MINUTE),
    closesAt: new Date(endAt.getTime() + ROOM_CLOSES_AFTER_MINUTES * MINUTE),
  };
}

// Where a booking stands, for its page and "Rejoindre": too early, room open, over, cancelled.
export type MeetingPhase = "early" | "open" | "over" | "cancelled";

export function meetingPhase(booking: { startAt: Date; endAt: Date; cancelled: boolean }, now: Date): MeetingPhase {
  if (booking.cancelled) return "cancelled";
  const { opensAt, closesAt } = meetingWindow(booking.startAt, booking.endAt);
  if (now < opensAt) return "early";
  if (now < closesAt) return "open";
  return "over";
}

// ——— The visitor's form (docs/booking.md, "Le formulaire") ———

export const NAME_MAX = 100;
export const EMAIL_MAX = 254;
export const ROLE_MAX = 100;
export const COMPANY_MAX = 100;
export const MESSAGE_MAX = 1000;
// The counter of the message shows near the limit.
export const MESSAGE_COUNTER_FROM = 800;
export const CANCEL_MESSAGE_MAX = 1000;

export const isValidEmail = (email: string) => email.length <= EMAIL_MAX && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

export type GuestForm = { name: string; email: string; role: string; company: string; message: string };
export type GuestFormErrors = Partial<Record<keyof GuestForm, string>>;

export function guestFormErrors(form: GuestForm): GuestFormErrors {
  const errors: GuestFormErrors = {};
  const name = form.name.trim();
  const email = form.email.trim();
  const message = form.message.trim();
  if (!name) errors.name = "Indiquez votre nom.";
  else if (name.length > NAME_MAX) errors.name = `${NAME_MAX} caractères au plus.`;
  if (!email) errors.email = "Indiquez votre adresse e-mail.";
  else if (!isValidEmail(email)) errors.email = "Cette adresse e-mail n'est pas valide.";
  if (form.role.trim().length > ROLE_MAX) errors.role = `${ROLE_MAX} caractères au plus.`;
  if (form.company.trim().length > COMPANY_MAX) errors.company = `${COMPANY_MAX} caractères au plus.`;
  if (!message) errors.message = "Dites en quelques mots l'objet du rendez-vous.";
  else if (message.length > MESSAGE_MAX) errors.message = `${MESSAGE_MAX} caractères au plus.`;
  return errors;
}

// ——— "Mes rendez-vous" ———

export const BOOKING_FILTERS = ["upcoming", "past", "cancelled"] as const;
export type BookingFilter = (typeof BOOKING_FILTERS)[number];
export const parseFilter = (value: unknown): BookingFilter =>
  BOOKING_FILTERS.includes(value as BookingFilter) ? (value as BookingFilter) : "upcoming";
// "Passés" and "Annulés" load 50 more at a time ("Afficher plus").
export const HISTORY_PAGE_SIZE = 50;

// The message of a list of ranges, if it is not valid ("Disponibilités").
export function rangesError(ranges: TimeRange[]) {
  if (ranges.some((range) => range.end <= range.start)) return "La fin d'une plage doit suivre son début.";
  if (ranges.some((range) => !isValidRange(range))) return `Une plage dure au moins ${DURATION_MINUTES} minutes.`;
  if (rangesOverlap(ranges)) return "Ces plages se chevauchent.";
  return null;
}
