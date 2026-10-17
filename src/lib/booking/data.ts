import "server-only";

import { createClient } from "@/lib/supabase/server";

import { HISTORY_PAGE_SIZE, ROOM_CLOSES_AFTER_MINUTES, type BookingFilter, type BookingSettings, type DayOverride, type WeeklyRange } from "./rules";
import type { BookingSetup, OwnBooking } from "./types";

// The owner's side of the module ("Mes rendez-vous", "Disponibilités"), read and changed as the
// signed-in user: RLS limits everything to their own rows (docs/booking.md, "Données").

const BOOKING_COLUMNS =
  "id, start_at, end_at, status, cancelled_by, cancel_message, guest_name, guest_email, guest_role, guest_company, guest_message, guest_time_zone, code, reference, is_seen, created_at, cancelled_at";

type BookingRow = {
  id: string;
  start_at: string;
  end_at: string;
  status: OwnBooking["status"];
  cancelled_by: OwnBooking["cancelledBy"];
  cancel_message: string | null;
  guest_name: string;
  guest_email: string;
  guest_role: string | null;
  guest_company: string | null;
  guest_message: string;
  guest_time_zone: string;
  code: string;
  reference: string;
  is_seen: boolean;
  created_at: string;
  cancelled_at: string | null;
};

const toBooking = (row: BookingRow): OwnBooking => ({
  id: row.id,
  startAt: row.start_at,
  endAt: row.end_at,
  status: row.status,
  cancelledBy: row.cancelled_by,
  cancelMessage: row.cancel_message,
  guestName: row.guest_name,
  guestEmail: row.guest_email,
  guestRole: row.guest_role,
  guestCompany: row.guest_company,
  guestMessage: row.guest_message,
  guestTimeZone: row.guest_time_zone,
  code: row.code,
  reference: row.reference,
  isSeen: row.is_seen,
  createdAt: row.created_at,
  cancelledAt: row.cancelled_at,
});

// A booking stays "À venir" until its room closes, 30 minutes after its planned end: "Rejoindre"
// works until then.
const upcomingFrom = () => new Date(Date.now() - ROOM_CLOSES_AFTER_MINUTES * 60_000).toISOString();

// ——— "Disponibilités" ———

export async function getOwnBookingSetup(): Promise<BookingSetup> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_own_booking_setup");
  if (error) throw new Error(`Booking setup read failed: ${error.message}`);
  return data as BookingSetup;
}

export async function saveOwnBookingSetup(settings: BookingSettings, weekly: WeeklyRange[], overrides: DayOverride[]) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_own_booking_setup", { settings, weekly, overrides });
  if (error) throw new Error(`Booking setup save failed: ${error.message}`);
}

// The time zone of the owner (their bookings are listed in it). Europe/Paris before the first
// visit of "Disponibilités".
export async function getOwnTimeZone(): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("booking_settings").select("time_zone").maybeSingle();
  if (error) throw new Error(`Booking settings read failed: ${error.message}`);
  return data?.time_zone ?? "Europe/Paris";
}

// ——— "Mes rendez-vous" ———

export type OwnBookings = { bookings: OwnBooking[]; upcomingCount: number; hasMore: boolean };

// One filter of the list: "À venir" (the nearest first), "Passés" and "Annulés" (the latest
// first, 50 more at a time). The number of upcoming bookings is shown on its button.
export async function getOwnBookings(filter: BookingFilter, pages = 1): Promise<OwnBookings> {
  const supabase = await createClient();
  const from = upcomingFrom();
  const limit = HISTORY_PAGE_SIZE * pages;

  let query = supabase.from("bookings").select(BOOKING_COLUMNS);
  if (filter === "upcoming") query = query.eq("status", "confirmed").gt("end_at", from).order("start_at", { ascending: true });
  else if (filter === "past") query = query.eq("status", "confirmed").lte("end_at", from).order("start_at", { ascending: false });
  else query = query.eq("status", "cancelled").order("start_at", { ascending: false });
  if (filter !== "upcoming") query = query.limit(limit + 1);

  const [list, count] = await Promise.all([
    query,
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "confirmed").gt("end_at", from),
  ]);
  if (list.error) throw new Error(`Bookings read failed: ${list.error.message}`);
  if (count.error) throw new Error(`Bookings count failed: ${count.error.message}`);
  const rows = (list.data as BookingRow[]).map(toBooking);
  return {
    bookings: filter === "upcoming" ? rows : rows.slice(0, limit),
    upcomingCount: count.count ?? 0,
    hasMore: filter !== "upcoming" && rows.length > limit,
  };
}

export async function getOwnBooking(id: string): Promise<OwnBooking | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("bookings").select(BOOKING_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`Booking read failed: ${error.message}`);
  return data ? toBooking(data as BookingRow) : null;
}

// The red dot of "Mes rendez-vous" in the sidebar: upcoming bookings not seen yet.
export async function hasUnseenBookings(): Promise<boolean> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("status", "confirmed")
    .eq("is_seen", false)
    .gt("end_at", upcomingFrom());
  if (error) throw new Error(`Unseen bookings count failed: ${error.message}`);
  return (count ?? 0) > 0;
}

export async function markOwnBookingSeen(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("bookings").update({ is_seen: true }).eq("id", id).eq("is_seen", false);
  if (error) throw new Error(`Booking seen failed: ${error.message}`);
}

export type CancelResult = { status: "ok"; emailIds: string[] } | { status: "not_found" | "not_cancellable" | "invalid" };

export async function cancelOwnBooking(id: string, message: string): Promise<CancelResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cancel_own_booking", { booking_id: id, message });
  if (error) throw new Error(`Booking cancellation failed: ${error.message}`);
  return data as CancelResult;
}

// Only past or cancelled bookings can be deleted (checked by the database). false: nothing deleted.
export async function deleteOwnBooking(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("bookings").delete().eq("id", id).select("id");
  if (error) throw new Error(`Booking deletion failed: ${error.message}`);
  return data.length > 0;
}
