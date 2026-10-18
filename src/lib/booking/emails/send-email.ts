import "server-only";

import { createClient } from "@supabase/supabase-js";
import { after } from "next/server";
import { Resend } from "resend";

import { getRequestOrigin } from "@/lib/auth/origin";
import { getSupabaseEnv } from "@/lib/supabase/env";

import { deliverBookingEmails, type QueuedEmail } from "./deliver";

// The one sending module of the Rendez-vous emails (docs/booking.md, "E-mails"). The database
// saves each email in the queue (booking_emails) as "pending"; after the answer to the visitor,
// this module takes them (claim_booking_emails, with the sending secret), renders and sends them
// with Resend (./deliver.ts) and records each result (finish_booking_email).
// Without RESEND_API_KEY or BOOKING_EMAILS_SECRET (automatic tests on GitHub), nothing is sent and
// the emails stay "pending".

export async function sendBookingEmails(emailIds: string[]) {
  const apiKey = process.env.RESEND_API_KEY;
  const secret = process.env.BOOKING_EMAILS_SECRET;
  if (!apiKey || !secret) {
    for (const id of emailIds) console.info(`[booking-email] ${id}: not sent (no sending service configured).`);
    return;
  }
  if (emailIds.length === 0) return;
  const origin = await getRequestOrigin();

  after(async () => {
    try {
      const { url, publishableKey } = getSupabaseEnv();
      const supabase = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data, error } = await supabase.rpc("claim_booking_emails", { email_ids: emailIds, secret });
      if (error) throw error;

      const resend = new Resend(apiKey);
      await deliverBookingEmails((data ?? []) as QueuedEmail[], {
        origin,
        send: async (email, idempotencyKey) => {
          const { error } = await resend.emails.send(email, { idempotencyKey });
          return { error: error ? error.message : null };
        },
        finish: async (id, result) => {
          const { error } = await supabase.rpc("finish_booking_email", {
            email_id: id,
            result: result.status,
            error: result.error ?? null,
            secret,
          });
          if (error) console.error(`[booking-email] ${id}: result not saved`, error);
        },
      });
    } catch (error) {
      console.error("[booking-email] sending failed", error);
    }
  });
}
