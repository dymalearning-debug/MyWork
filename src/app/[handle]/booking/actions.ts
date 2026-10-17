"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";

import { sendBookingEmails } from "@/lib/booking/emails/send-email";
import { bookPublicSlot, cancelPublicBooking } from "@/lib/booking/public";
import { CANCEL_MESSAGE_MAX, guestBookingPath, guestFormErrors, type GuestForm } from "@/lib/booking/rules";
import { isKnownTimeZone } from "@/lib/booking/time";

// Server Actions of the public side (docs/booking.md): booking a slot, cancelling from the guest's
// link. Open to anyone; the database checks every rule again.

export type BookSlotResult =
  | { status: "ok"; path: string }
  | { status: "taken" | "closed" | "limit_email" | "limit_ip" | "invalid" | "failed" };

// "Confirmer le rendez-vous". `website` is the hidden trap field: a person never fills it, simple
// robots do (docs/booking.md, "Protection contre les abus").
export async function bookSlot(
  handle: string,
  input: GuestForm & { slotStart: string; timeZone: string; website: string },
): Promise<BookSlotResult> {
  if (typeof handle !== "string" || !input || typeof input !== "object") return { status: "invalid" };
  const form: GuestForm = {
    name: String(input.name ?? ""),
    email: String(input.email ?? ""),
    role: String(input.role ?? ""),
    company: String(input.company ?? ""),
    message: String(input.message ?? ""),
  };
  if (input.website) return { status: "invalid" };
  if (Object.keys(guestFormErrors(form)).length > 0) return { status: "invalid" };
  const slotStart = new Date(String(input.slotStart));
  if (Number.isNaN(slotStart.getTime())) return { status: "invalid" };

  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || null;
  try {
    const result = await bookPublicSlot(handle, {
      slotStart: slotStart.toISOString(),
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role.trim(),
      company: form.company.trim(),
      message: form.message.trim(),
      timeZone: typeof input.timeZone === "string" && isKnownTimeZone(input.timeZone) ? input.timeZone : "",
      ip,
    });
    if (result.status !== "ok") return { status: result.status };
    await sendBookingEmails(result.emailIds);
    return { status: "ok", path: guestBookingPath(handle, result.code) };
  } catch (error) {
    console.error(error);
    return { status: "failed" };
  }
}

// "Annuler le rendez-vous", by the guest, with an optional reason.
export async function cancelGuestBooking(handle: string, code: string, reason: string): Promise<{ ok: boolean }> {
  if (typeof handle !== "string" || typeof code !== "string" || typeof reason !== "string" || reason.length > CANCEL_MESSAGE_MAX) {
    return { ok: false };
  }
  try {
    const result = await cancelPublicBooking(handle, code, reason.trim());
    if (result.status !== "ok") return { ok: false };
    await sendBookingEmails(result.emailIds);
  } catch (error) {
    console.error(error);
    return { ok: false };
  }
  refresh();
  return { ok: true };
}
