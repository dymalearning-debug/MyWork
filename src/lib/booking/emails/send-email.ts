import "server-only";

// The one sending module of the Rendez-vous emails (docs/booking.md, "E-mails"). Each email is
// first saved in the queue (booking_emails) by the database, with its recipient, its template, its
// data and its state ("pending": not sent). This version sends nothing: it only writes a line in
// the logs. With Resend, it will read the queue, render each email (./templates.ts), attach the
// .ics file (../ics.ts) when the template asks for it, send it and mark it "sent".

export async function sendBookingEmails(emailIds: string[]) {
  for (const id of emailIds) {
    console.info(`[booking-email] ${id}: prepared, not sent (no sending service yet).`);
  }
}
