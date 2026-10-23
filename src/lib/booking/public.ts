import "server-only";

import { createHash } from "node:crypto";

import { cache } from "react";

import { anonymousClient, readAsVisitorThenOwner } from "@/lib/public-profile/data";
import { isValidHandle } from "@/lib/public-profile/handle";

import { isBookingCode } from "./rules";
import { computeSlots } from "./slots";
import type { PublicAvailability, PublicBooking } from "./types";

// The public side of the module (docs/booking.md, "Profil public : onglet « Rendez-vous »" and
// "Page du rendez-vous"). Like the rest of the public page, read as an anonymous visitor would,
// then, for an offline profile, as its owner (preview). Visitors never reach the tables: only the
// functions of the database opened to them.

// Whether the "Rendez-vous" tab and the "Prendre rendez-vous" button are shown.
export const isPublicBookingOpen = cache(async (handle: string): Promise<boolean> => {
  if (!isValidHandle(handle)) return false;
  const result = await readAsVisitorThenOwner(async (supabase) => {
    const { data, error } = await supabase.rpc("is_public_booking_open", { profile_handle: handle });
    if (error) throw new Error(`Booking open read failed: ${error.message}`);
    return data ? true : null;
  });
  return !!result?.value;
});

// The free slots of a profile, as ISO instants, computed at each visit (never cached). null:
// unknown profile, offline, or bookings closed.
export async function getPublicSlots(handle: string): Promise<{ slots: string[]; availability: PublicAvailability } | null> {
  if (!isValidHandle(handle)) return null;
  const result = await readAsVisitorThenOwner(async (supabase) => {
    const { data, error } = await supabase.rpc("get_public_booking_availability", { profile_handle: handle });
    if (error) throw new Error(`Booking availability read failed: ${error.message}`);
    return (data as PublicAvailability | null) ?? null;
  });
  if (!result) return null;
  const availability = result.value;
  const slots = computeSlots(
    {
      ...availability,
      busy: availability.busy.map((b) => ({ start: new Date(b.start), end: new Date(b.end) })),
    },
    new Date(availability.now),
  );
  return { slots: slots.map((slot) => slot.toISOString()), availability };
}

export type BookResult =
  | { status: "ok"; code: string; emailIds: string[] }
  | { status: "closed" | "taken" | "invalid" | "limit_email" | "limit_ip" };

export type BookInput = {
  slotStart: string;
  name: string;
  email: string;
  role: string;
  company: string;
  message: string;
  timeZone: string;
  ip: string | null;
};

// A booking, always as an anonymous visitor: the profile must be online and bookings open (no
// booking from the owner's preview). The database checks every rule again, and asks for the
// secret of the module, so that only this server books (never a direct call to the API).
export async function bookPublicSlot(handle: string, input: BookInput): Promise<BookResult> {
  if (!isValidHandle(handle)) return { status: "closed" };
  const secret = process.env.BOOKING_EMAILS_SECRET;
  if (!secret) throw new Error("Missing BOOKING_EMAILS_SECRET (see .env.example).");
  const { data, error } = await anonymousClient().rpc("book_public_slot", {
    profile_handle: handle,
    slot_start: input.slotStart,
    guest_name: input.name,
    guest_email: input.email,
    guest_role: input.role,
    guest_company: input.company,
    guest_message: input.message,
    guest_time_zone: input.timeZone,
    // A fingerprint of the address, never the address itself (limit of 10 bookings an hour).
    ip_hash: input.ip ? createHash("sha256").update(`mywork-booking:${input.ip}`).digest("hex") : null,
    secret,
  });
  if (error) throw new Error(`Booking failed: ${error.message}`);
  return data as BookResult;
}

// A booking from its secret link, whatever the state of the profile. null: wrong code.
export const getPublicBooking = cache(async (handle: string, code: string): Promise<PublicBooking | null> => {
  if (!isValidHandle(handle) || !isBookingCode(code)) return null;
  const { data, error } = await anonymousClient().rpc("get_public_booking", { profile_handle: handle, booking_code: code });
  if (error) throw new Error(`Booking read failed: ${error.message}`);
  return (data as PublicBooking | null) ?? null;
});

export type PublicCancelResult = { status: "ok"; emailIds: string[] } | { status: "not_found" | "not_cancellable" | "invalid" };

export async function cancelPublicBooking(handle: string, code: string, reason: string): Promise<PublicCancelResult> {
  if (!isValidHandle(handle) || !isBookingCode(code)) return { status: "not_found" };
  const { data, error } = await anonymousClient().rpc("cancel_public_booking", {
    profile_handle: handle,
    booking_code: code,
    reason,
  });
  if (error) throw new Error(`Booking cancellation failed: ${error.message}`);
  return data as PublicCancelResult;
}
