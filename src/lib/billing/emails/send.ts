import "server-only";

import { after } from "next/server";
import { Resend } from "resend";

import { getRequestOrigin } from "@/lib/auth/origin";
import { EMAIL_SENDER, isTestAddress } from "@/lib/emails/parts";

import { renderBillingEmail, type BillingEmailData, type BillingEmailKind } from "./templates";

// Sends the emails of the subscription with Resend, after the answer (to Stripe or to the
// subscriber). The database tells which ones (sync_subscription); each leaves once: Resend drops
// the same email asked for twice within a day (idempotency key), when the return from Stripe and
// the webhook arrive together. Without RESEND_API_KEY (automatic tests on GitHub), nothing is sent.
export async function sendBillingEmails(
  kinds: BillingEmailKind[],
  recipient: string | null,
  data: BillingEmailData,
  subscriptionId: string,
) {
  if (kinds.length === 0) return;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    for (const kind of kinds) console.info(`[billing-email] ${kind}: not sent (no sending service configured).`);
    return;
  }
  if (!recipient || isTestAddress(recipient)) return;
  const origin = await getRequestOrigin();

  after(async () => {
    const resend = new Resend(apiKey);
    for (const kind of kinds) {
      // A second cancellation (after taking the subscription back) gets its own goodbye.
      const key = `billing/${subscriptionId}/${kind}${kind === "goodbye" ? `/${data.cancelAt}` : ""}`;
      try {
        const rendered = renderBillingEmail(kind, data, origin);
        const { error } = await resend.emails.send(
          { from: EMAIL_SENDER, to: recipient, subject: rendered.subject, html: rendered.html, text: rendered.text },
          { idempotencyKey: key },
        );
        if (error) console.error(`[billing-email] ${key}: ${error.message}`);
      } catch (error) {
        console.error(`[billing-email] ${key}: sending failed`, error);
      }
    }
  });
}
