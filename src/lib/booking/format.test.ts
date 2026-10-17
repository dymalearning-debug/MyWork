import { describe, expect, it } from "vitest";

import { renderBookingEmail, SAMPLE_EMAILS, type OwnerNewBookingData } from "./emails/templates";
import { dayHeading, formatCountdown, formatDate, formatDay, formatTimeRange, timeZoneLabel, weekLabel } from "./format";
import { buildIcs } from "./ics";
import { guestFormErrors, meetingPhase, meetingWindow } from "./rules";
import { weekStart } from "./time";

// Formats of the dates and hours, the .ics file, the emails, the meeting window and the form.

describe("formats", () => {
  const start = new Date("2026-10-20T08:30:00Z");
  const end = new Date("2026-10-20T09:00:00Z");

  it("reads dates and hours in the given time zone", () => {
    expect(formatTimeRange(start, end, "Europe/Paris")).toBe("10:30 – 11:00");
    expect(formatTimeRange(start, end, "America/New_York")).toBe("04:30 – 05:00");
    expect(formatDate(start, "Europe/Paris")).toBe("Mardi 20 octobre");
    expect(formatDate(start, "Europe/Paris", { year: true })).toBe("Mardi 20 octobre 2026");
    expect(formatDay("2026-11-01")).toBe("Dimanche 1er novembre");
  });

  it("writes today and tomorrow in full", () => {
    expect(dayHeading("2026-10-16", "2026-10-16")).toBe("Aujourd'hui · vendredi 16 octobre");
    expect(dayHeading("2026-10-17", "2026-10-16")).toBe("Demain · samedi 17 octobre");
    expect(dayHeading("2026-10-19", "2026-10-16")).toBe("Lundi 19 octobre");
  });

  it("labels weeks, from Monday to Sunday", () => {
    expect(weekStart("2026-10-22")).toBe("2026-10-19");
    expect(weekStart("2026-10-25")).toBe("2026-10-19");
    expect(weekLabel("2026-10-19")).toBe("Semaine du 19 au 25 octobre");
    expect(weekLabel("2026-10-26")).toBe("Du 26 octobre au 1er novembre");
  });

  it("names time zones by their city", () => {
    expect(timeZoneLabel("Europe/Paris")).toBe("Heure de Paris");
    expect(timeZoneLabel("America/New_York")).toBe("Heure de New York");
    expect(timeZoneLabel("Europe/Athens")).toBe("Heure d'Athènes");
    expect(timeZoneLabel("UTC")).toBe("Heure UTC");
  });

  it("counts down in hours, minutes and seconds", () => {
    expect(formatCountdown((1 * 3600 + 42 * 60 + 10) * 1000)).toBe("01:42:10");
    expect(formatCountdown((3 * 86400 + 14 * 3600 + 5) * 1000)).toBe("3 j 14:00:05");
    expect(formatCountdown(-5)).toBe("00:00:00");
  });
});

describe("meeting window", () => {
  const booking = { startAt: new Date("2026-10-20T08:30:00Z"), endAt: new Date("2026-10-20T09:00:00Z"), cancelled: false };

  it("opens 15 minutes before and closes 30 minutes after the planned end", () => {
    const { opensAt, closesAt } = meetingWindow(booking.startAt, booking.endAt);
    expect(opensAt.toISOString()).toBe("2026-10-20T08:15:00.000Z");
    expect(closesAt.toISOString()).toBe("2026-10-20T09:30:00.000Z");
    expect(meetingPhase(booking, new Date("2026-10-20T08:14:59Z"))).toBe("early");
    expect(meetingPhase(booking, new Date("2026-10-20T08:15:00Z"))).toBe("open");
    expect(meetingPhase(booking, new Date("2026-10-20T09:29:59Z"))).toBe("open");
    expect(meetingPhase(booking, new Date("2026-10-20T09:30:00Z"))).toBe("over");
    expect(meetingPhase({ ...booking, cancelled: true }, new Date("2026-10-20T08:30:00Z"))).toBe("cancelled");
  });
});

describe("guest form", () => {
  const valid = { name: "Marc Dubois", email: "marc@exemple.fr", role: "", company: "", message: "Un projet" };

  it("requires the name, a valid email and the message", () => {
    expect(guestFormErrors(valid)).toEqual({});
    expect(Object.keys(guestFormErrors({ ...valid, name: " ", email: "marc@", message: "" })).sort()).toEqual([
      "email",
      "message",
      "name",
    ]);
    expect(guestFormErrors({ ...valid, message: "x".repeat(1001) }).message).toBeDefined();
  });
});

describe("calendar file", () => {
  it("is a valid event in UTC, with escaped text and folded lines", () => {
    const ics = buildIcs({
      uid: "K7QM-2XR9@mywork",
      start: new Date("2026-10-20T08:30:00Z"),
      end: new Date("2026-10-20T09:00:00Z"),
      summary: "Rendez-vous avec Inès Robert",
      description: "Visio, 30 min; lien : https://exemple.fr/ines-robert/booking/abc",
      url: "https://exemple.fr/ines-robert/booking/abc",
      now: new Date("2026-10-16T10:00:00Z"),
    });
    expect(ics).toContain("BEGIN:VEVENT\r\n");
    expect(ics).toContain("DTSTART:20261020T083000Z\r\n");
    expect(ics).toContain("DTEND:20261020T090000Z\r\n");
    expect(ics).toContain("DESCRIPTION:Visio\\, 30 min\\; lien");
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    for (const line of ics.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });
});

describe("emails", () => {
  it("renders the four templates with their subjects, in the recipient's time zone", () => {
    const rendered = SAMPLE_EMAILS.map((email) => renderBookingEmail(email.template, email.data, "https://exemple.fr"));
    expect(rendered.map((email) => email.subject)).toEqual([
      "Rendez-vous confirmé avec Inès Robert",
      "Nouveau rendez-vous : Marc Dubois, mar. 20 oct. à 10:30",
      "Rendez-vous annulé : Inès Robert, mar. 20 oct. à 10:30",
      "Rendez-vous annulé : Marc Dubois, mar. 20 oct. à 10:30",
    ]);
    expect(rendered[0].html).toContain("Mardi 20 octobre à 10:30");
    expect(rendered[0].html).toContain("https://exemple.fr/ines-robert/booking/k7Qm2xR9aB3dE5fG7hJ9kL1m");
    expect(rendered[0].html).toContain("La salle ouvre à 10:15");
    expect(rendered.map((email) => email.withIcs)).toEqual([true, true, false, false]);
    expect(rendered[2].html).toContain("#a3261f");
  });

  it("escapes what the guest typed", () => {
    const email = renderBookingEmail(
      "owner_new_booking",
      { ...(SAMPLE_EMAILS[1].data as OwnerNewBookingData), message: "<script>alert(1)</script>" },
      "https://exemple.fr",
    );
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
  });
});
