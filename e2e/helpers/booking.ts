import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { computeSlots } from "../../src/lib/booking/slots";
import { adminClient, signedInClient } from "./supabase-admin";

// Rendez-vous module (docs/booking.md), for the end-to-end tests: the owner's settings through the
// same database functions as "Disponibilités", bookings made as a visitor would, or placed by the
// administrator at a given time (the meeting window, past bookings).

type User = { id: string; email: string; password: string };

export type SetupChanges = {
  isOpen?: boolean;
  timeZone?: string;
  bufferMinutes?: number;
  noticeMinutes?: number;
  horizonDays?: number;
  dailyLimit?: number | null;
  weekly?: { weekday: number; start: number; end: number }[];
  overrides?: { day: string; ranges: { start: number; end: number }[] }[];
};

// Every day, all day: slots at any time of the test run.
export const ALL_DAY = [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({ weekday, start: 0, end: 1440 }));

export async function setupBooking(user: User, changes: SetupChanges = {}) {
  const client = await signedInClient(user);
  const { data, error } = await client.rpc("get_own_booking_setup");
  if (error) throw error;
  const current = data as { settings: Record<string, unknown>; weekly: unknown[]; overrides: unknown[] };
  const { weekly, overrides, ...settings } = changes;
  const { error: saveError } = await client.rpc("save_own_booking_setup", {
    settings: { ...current.settings, isOpen: true, noticeMinutes: 60, ...settings },
    weekly: weekly ?? ALL_DAY,
    overrides: overrides ?? [],
  });
  if (saveError) throw saveError;
}

export const anonymous = (): SupabaseClient =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

type Availability = {
  now: string;
  timeZone: string;
  bufferMinutes: number;
  noticeMinutes: number;
  horizonDays: number;
  dailyLimit: number | null;
  weekly: { weekday: number; start: number; end: number }[];
  overrides: { day: string; ranges: { start: number; end: number }[] }[];
  busy: { start: string; end: string }[];
};

export async function publicAvailability(handle: string) {
  const { data, error } = await anonymous().rpc("get_public_booking_availability", { profile_handle: handle });
  if (error) throw error;
  return data as Availability | null;
}

// The free slots of a profile, as the tab computes them.
export async function freeSlots(handle: string) {
  const availability = await publicAvailability(handle);
  if (!availability) return [];
  return computeSlots(
    { ...availability, busy: availability.busy.map((b) => ({ start: new Date(b.start), end: new Date(b.end) })) },
    new Date(availability.now),
  );
}

let guestCount = 0;

// A booking as a visitor makes it (the same database function as the form).
export async function book(
  handle: string,
  slot: Date | string,
  guest: Partial<{ name: string; email: string; role: string; company: string; message: string; timeZone: string; ipHash: string }> = {},
) {
  guestCount += 1;
  const { data, error } = await anonymous().rpc("book_public_slot", {
    profile_handle: handle,
    slot_start: typeof slot === "string" ? slot : slot.toISOString(),
    guest_name: guest.name ?? "Marc Dubois",
    guest_email: guest.email ?? `marc.${Date.now()}.${guestCount}@exemple.test`,
    guest_role: guest.role ?? "Directeur produit",
    guest_company: guest.company ?? "Alto",
    guest_message: guest.message ?? "Audit de notre parcours d'inscription.",
    guest_time_zone: guest.timeZone ?? "Europe/Paris",
    ip_hash: guest.ipHash ?? null,
  });
  if (error) throw error;
  return data as { status: string; code?: string; emailIds?: string[] };
}

// A booking placed by the administrator, at any time (even in the past): for the meeting window.
export async function placeBooking(
  userId: string,
  start: Date,
  { status = "confirmed", guestName = "Claire Martin", bufferMinutes = 15 }: { status?: "confirmed" | "cancelled"; guestName?: string; bufferMinutes?: number } = {},
) {
  const end = new Date(start.getTime() + 30 * 60_000);
  const { data, error } = await adminClient()
    .from("bookings")
    .insert({
      user_id: userId,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      blocked_until: new Date(end.getTime() + bufferMinutes * 60_000).toISOString(),
      guest_name: guestName,
      guest_email: "claire.martin@exemple.test",
      guest_role: "Recruteuse",
      guest_company: "Talentis",
      guest_message: "Poste de lead designer en CDI.",
      status,
      cancelled_by: status === "cancelled" ? "owner" : null,
      cancelled_at: status === "cancelled" ? new Date().toISOString() : null,
    })
    .select("id, code")
    .single();
  if (error) throw error;
  return data as { id: string; code: string };
}

export async function bookingsOf(userId: string) {
  const { data, error } = await adminClient()
    .from("bookings")
    .select("id, start_at, status, cancelled_by, cancel_message, is_seen, guest_name, code")
    .eq("user_id", userId)
    .order("start_at");
  if (error) throw error;
  return data as { id: string; start_at: string; status: string; cancelled_by: string | null; cancel_message: string | null; is_seen: boolean; guest_name: string; code: string }[];
}

export async function emailsOf(userId: string) {
  const { data, error } = await adminClient()
    .from("booking_emails")
    .select("template, recipient, status, data")
    .eq("user_id", userId)
    .order("created_at");
  if (error) throw error;
  return data as { template: string; recipient: string; status: string; data: Record<string, unknown> }[];
}

// The payload of a LiveKit token (a JWT), to check what it grants.
export function tokenPayload(token: string) {
  return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")) as {
    exp: number;
    sub: string;
    name?: string;
    video?: { room?: string; roomJoin?: boolean };
    roomConfig?: { name?: string; maxParticipants?: number; emptyTimeout?: number };
  };
}
