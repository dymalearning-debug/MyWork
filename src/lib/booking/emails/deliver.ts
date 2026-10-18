import { buildIcs } from "../ics";
import { renderBookingEmail, type BookingEmailData, type BookingEmailTemplate } from "./templates";

// Rendering and sending of the Rendez-vous emails taken from the queue (docs/booking.md,
// "E-mails"). Pure logic: the queue and Resend are passed in, so that the unit tests can replace
// them. The real ones are wired in ./send-email.ts.

export const BOOKING_EMAIL_SENDER = "MyWork <noreply@hellomywork.com>";

export type QueuedEmail = {
  id: string;
  booking_id: string;
  template: BookingEmailTemplate;
  recipient: string;
  data: BookingEmailData[BookingEmailTemplate];
};

export type OutgoingEmail = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: { filename: string; content: string; contentType: string }[];
};

export type EmailResult = { status: "sent" | "failed" | "abandoned"; error?: string };

export type DeliveryDeps = {
  origin: string;
  send: (email: OutgoingEmail, idempotencyKey: string) => Promise<{ error: string | null }>;
  finish: (id: string, result: EmailResult) => Promise<void>;
};

// Addresses reserved for tests and examples (RFC 2606 and 6761): never sent, so that the
// automatic tests do not harm the reputation of the domain.
export function isTestAddress(address: string) {
  const domain = address.trim().toLowerCase().split("@")[1] ?? "";
  if (!domain) return true;
  return (
    /(^|\.)example\.(com|net|org)$/.test(domain) || /\.(test|example|invalid|localhost)$/.test(domain)
  );
}

export function buildBookingEmail(email: QueuedEmail, origin: string): OutgoingEmail {
  const rendered = renderBookingEmail(email.template, email.data, origin);
  const outgoing: OutgoingEmail = {
    from: BOOKING_EMAIL_SENDER,
    to: email.recipient,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  };
  if (rendered.withIcs) {
    const link = `${origin}${email.data.path}`;
    const other =
      email.template === "owner_new_booking" ? email.data.guestName : (email.data as BookingEmailData["guest_confirmation"]).ownerName;
    const ics = buildIcs({
      uid: `${email.booking_id}@mywork`,
      start: new Date(email.data.startAt),
      end: new Date(email.data.endAt),
      summary: `Rendez-vous avec ${other}`,
      description: `Visio · 30 min. Rejoindre la visio (15 minutes avant) : ${link}`,
      url: link,
    });
    outgoing.attachments = [{ filename: "rendez-vous.ics", content: ics, contentType: "text/calendar; charset=utf-8" }];
  }
  return outgoing;
}

// Each email on its own: one failure does not stop the others.
export async function deliverBookingEmails(emails: QueuedEmail[], deps: DeliveryDeps) {
  for (const email of emails) {
    let result: EmailResult;
    if (isTestAddress(email.recipient)) {
      result = { status: "abandoned", error: "test address" };
    } else {
      try {
        const { error } = await deps.send(buildBookingEmail(email, deps.origin), `booking-email/${email.id}`);
        result = error ? { status: "failed", error } : { status: "sent" };
      } catch (error) {
        result = { status: "failed", error: error instanceof Error ? error.message : String(error) };
      }
    }
    if (result.status === "failed") console.error(`[booking-email] ${email.id}: ${result.error}`);
    await deps.finish(email.id, result);
  }
}
