import { describe, expect, it } from "vitest";

import { emptyProfileContent } from "@/lib/profile/content";
import type { StoredProfile } from "@/lib/profile/types";

import {
  formatDelta,
  formatLastSignal,
  formatTimeLeft,
  isRobot,
  missingText,
  profileCompleteness,
  reminders,
  requestIp,
  visitorKey,
} from "./rules";

const CHROME = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const LINKEDIN_APP = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [LinkedInApp]/9.30";

const profile = (changes: Partial<StoredProfile> = {}): StoredProfile => ({
  ...emptyProfileContent(),
  handle: "ines-robert",
  isOnline: true,
  hasContact: false,
  ...changes,
});

describe("visitors", () => {
  it("counts browsers, including the one of the LinkedIn app", () => {
    expect(isRobot(CHROME)).toBe(false);
    expect(isRobot(LINKEDIN_APP)).toBe(false);
  });

  it("leaves out robots and link previews", () => {
    for (const agent of [
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)",
      "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
      "facebookexternalhit/1.1",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.0.0 Safari/537.36",
      "curl/8.5.0",
      "",
      null,
    ]) {
      expect(isRobot(agent)).toBe(true);
    }
  });

  it("identifies a visitor by their address and browser, never a robot", () => {
    expect(visitorKey("203.0.113.7", CHROME)).toBe(`203.0.113.7|${CHROME}`);
    expect(visitorKey(null, CHROME)).toBe(`unknown|${CHROME}`);
    expect(visitorKey("203.0.113.7", "curl/8.5.0")).toBeNull();
  });

  it("reads the address behind the proxy", () => {
    expect(requestIp(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
    expect(requestIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(requestIp(new Headers())).toBeNull();
  });
});

describe("numbers and dates", () => {
  it("compares with the period before", () => {
    expect(formatDelta(18, 13, 7)).toBe("+5 par rapport aux 7 jours d'avant");
    expect(formatDelta(10, 12, 30)).toBe("−2 par rapport aux 30 jours d'avant");
    expect(formatDelta(4, 4, 7)).toBe("Autant que les 7 jours d'avant");
  });

  it("tells when a signal last happened", () => {
    const now = new Date("2026-10-20T14:00:00Z"); // 16:00 in Paris
    const zone = "Europe/Paris";
    expect(formatLastSignal(new Date("2026-10-20T13:59:40Z"), now, zone)).toBe("À l'instant");
    expect(formatLastSignal(new Date("2026-10-20T13:48:00Z"), now, zone)).toBe("Il y a 12 min");
    expect(formatLastSignal(new Date("2026-10-20T09:00:00Z"), now, zone)).toBe("Il y a 5 h");
    expect(formatLastSignal(new Date("2026-10-19T16:12:00Z"), now, zone)).toBe("Hier · 18:12");
    expect(formatLastSignal(new Date("2026-10-14T07:30:00Z"), now, zone)).toBe("14/10 · 09:30");
  });

  it("tells the time left before a booking", () => {
    expect(formatTimeLeft(12 * 60_000)).toBe("Dans 12 min");
    expect(formatTimeLeft((4 * 60 + 42) * 60_000)).toBe("Dans 4 h 42");
    expect(formatTimeLeft((2 * 60 + 5) * 60_000)).toBe("Dans 2 h 05");
    expect(formatTimeLeft(3 * 3_600_000)).toBe("Dans 3 h");
  });
});

describe("reminders", () => {
  const paths = { profile: "/app/profile", availability: "/app/booking/availability", drive: "/app/drive" };
  const complete = profile({
    photoUrl: "https://example.com/photo.webp",
    headline: "Designer produit",
    location: "Lyon",
    about: "J'accompagne les équipes produit.",
    contactEmail: "ines@example.com",
    links: [{ id: "l", url: "https://example.com", label: "" }],
    experiences: [{ id: "e" } as StoredProfile["experiences"][number]],
    educations: [{ id: "f" } as StoredProfile["educations"][number]],
    skills: [{ id: "s", name: "Figma", featured: true }],
    languages: [{ id: "g", name: "Anglais", level: "fluent" }],
  });

  it("measures how complete the profile is", () => {
    expect(profileCompleteness(complete)).toEqual({ percent: 100, missing: [] });
    const partial = profileCompleteness({ ...complete, languages: [], educations: [] });
    expect(partial).toEqual({ percent: 80, missing: ["votre formation", "vos langues"] });
    expect(profileCompleteness(profile()).percent).toBe(0);
  });

  it("says what is missing", () => {
    expect(missingText(["vos langues"])).toBe("Il manque vos langues.");
    expect(missingText(["votre formation", "vos langues"])).toBe("Il manque votre formation et vos langues.");
    expect(missingText(["a", "b", "c", "d"])).toBe("Il manque a, b et c…");
  });

  it("shows only what needs to be dealt with", () => {
    const base = { isOnline: true, bookingOpen: true, profile: complete, storageUsed: 100, storageCapacity: 1000 };
    expect(reminders(base, paths)).toEqual([]);

    const all = reminders({ ...base, isOnline: false, bookingOpen: false, profile: profile(), storageUsed: 820 }, paths);
    expect(all.map((r) => r.id)).toEqual(["offline", "booking", "profile", "storage"]);
    expect(all[3]).toMatchObject({ title: "Stockage", value: "82 %", tone: "warning" });

    const full = reminders({ ...base, storageUsed: 1200 }, paths);
    expect(full[0]).toMatchObject({ title: "Stockage plein", value: "100 %", tone: "destructive" });
  });
});
