import { describe, expect, it, vi } from "vitest";

import { BOOKING_EMAIL_SENDER, buildBookingEmail, deliverBookingEmails, isTestAddress, type QueuedEmail } from "./deliver";
import { SAMPLE_EMAILS } from "./templates";

const ORIGIN = "https://hellomywork.com";

const queued = (index: number, recipient = "marc.dubois@gmail.com"): QueuedEmail => ({
  id: `email-${index}`,
  booking_id: "booking-1",
  template: SAMPLE_EMAILS[index].template,
  recipient,
  data: SAMPLE_EMAILS[index].data,
});

describe("isTestAddress", () => {
  it("recognizes the addresses reserved for tests", () => {
    expect(isTestAddress("e2e-1@mywork-tests.example.com")).toBe(true);
    expect(isTestAddress("someone@example.org")).toBe(true);
    expect(isTestAddress("a@b.test")).toBe(true);
    expect(isTestAddress("")).toBe(true);
  });

  it("lets real addresses through", () => {
    expect(isTestAddress("marc.dubois@gmail.com")).toBe(false);
    expect(isTestAddress("contact@myexample.com")).toBe(false);
    expect(isTestAddress("delivered@resend.dev")).toBe(false);
  });
});

describe("buildBookingEmail", () => {
  it("sends from MyWork, with the calendar file for a confirmation", () => {
    const email = buildBookingEmail(queued(0), ORIGIN);
    expect(email.from).toBe(BOOKING_EMAIL_SENDER);
    expect(email.to).toBe("marc.dubois@gmail.com");
    expect(email.subject).toBe("Rendez-vous confirmé avec Inès Robert");
    expect(email.html).toContain(`${ORIGIN}/ines-robert/booking/k7Qm2xR9aB3dE5fG7hJ9kL1m`);
    expect(email.attachments).toHaveLength(1);
    const ics = email.attachments![0];
    expect(ics.filename).toBe("rendez-vous.ics");
    expect(ics.content).toContain("UID:booking-1@mywork");
    expect(ics.content).toContain("DTSTART:20261020T083000Z");
    expect(ics.content).toContain("SUMMARY:Rendez-vous avec Inès Robert");
  });

  it("names the guest in the owner's calendar file", () => {
    const email = buildBookingEmail(queued(1), ORIGIN);
    expect(email.attachments![0].content).toContain("SUMMARY:Rendez-vous avec Marc Dubois");
  });

  it("attaches nothing to a cancellation", () => {
    expect(buildBookingEmail(queued(2), ORIGIN).attachments).toBeUndefined();
    expect(buildBookingEmail(queued(3), ORIGIN).attachments).toBeUndefined();
  });
});

describe("deliverBookingEmails", () => {
  it("sends each email once and records each result", async () => {
    const send = vi
      .fn()
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: "Invalid `to` field" })
      .mockRejectedValueOnce(new Error("network down"));
    const finish = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(console, "error").mockImplementation(() => {});

    await deliverBookingEmails(
      [queued(0), queued(1), queued(2), queued(3, "e2e-1@mywork-tests.example.com")],
      { origin: ORIGIN, send, finish },
    );

    expect(send).toHaveBeenCalledTimes(3);
    expect(send.mock.calls.map((call) => call[1])).toEqual(["booking-email/email-0", "booking-email/email-1", "booking-email/email-2"]);
    expect(finish.mock.calls).toEqual([
      ["email-0", { status: "sent" }],
      ["email-1", { status: "failed", error: "Invalid `to` field" }],
      ["email-2", { status: "failed", error: "network down" }],
      ["email-3", { status: "abandoned", error: "test address" }],
    ]);
  });
});
