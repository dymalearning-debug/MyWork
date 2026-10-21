import { formatTime } from "@/lib/booking/format";
import { addDays, localDay } from "@/lib/booking/time";
import type { StoredProfile } from "@/lib/profile/types";

// Rules of the dashboard (docs/dashboard.md): who is counted as a visitor, the reminders, and how
// numbers and dates read.

// The tabs of the public profile whose visits are counted (same names as the database).
export const VISIT_TABS = ["profile", "booking", "resources"] as const;
export type VisitTab = (typeof VISIT_TABS)[number];

export const VISIT_TAB_LABELS: Record<VisitTab, string> = {
  profile: "Profil",
  booking: "Rendez-vous",
  resources: "Ressources",
};

export const isVisitTab = (value: unknown): value is VisitTab => VISIT_TABS.includes(value as VisitTab);

// Robots are not visitors: search engines, link previews (LinkedIn, Slack…), headless browsers,
// scripts. Most of them never run the page's script, which records the visit; this catches the rest.
// The browser inside the LinkedIn app ("LinkedInApp") is a real visitor: only "LinkedInBot" is not.
const BOT_PATTERN =
  /bot\b|bot\/|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|embedly|headless|lighthouse|python|curl|wget|node-fetch|axios|go-http|java\//i;

export function isRobot(userAgent: string | null | undefined) {
  return !userAgent || BOT_PATTERN.test(userAgent);
}

// What identifies a visitor for a day: their IP address and their browser. Only its hash with a
// salt of the day is kept (record_profile_visit). Vercel always gives the address; without one (a
// computer of development), the browser alone. null: a robot.
export function visitorKey(ip: string | null | undefined, userAgent: string | null | undefined) {
  if (isRobot(userAgent)) return null;
  return `${ip || "unknown"}|${userAgent}`.slice(0, 1000);
}

// The IP address of a request, behind Vercel.
export function requestIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || null;
}

// "+5 par rapport aux 7 jours d'avant".
export function formatDelta(current: number, previous: number, days: number) {
  const diff = current - previous;
  if (diff === 0) return `Autant que les ${days} jours d'avant`;
  return `${diff > 0 ? "+" : "−"}${Math.abs(diff)} par rapport aux ${days} jours d'avant`;
}

// When a signal last happened: "À l'instant", "Il y a 12 min", "Il y a 5 h" (today), "Hier · 18:12",
// "14/10 · 09:30".
export function formatLastSignal(at: Date, now: Date, timeZone: string) {
  const minutes = Math.floor((now.getTime() - at.getTime()) / 60_000);
  const day = localDay(at, timeZone);
  const today = localDay(now, timeZone);
  if (day === today) {
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    return `Il y a ${Math.floor(minutes / 60)} h`;
  }
  if (day === addDays(today, -1)) return `Hier · ${formatTime(at, timeZone)}`;
  const [, month, date] = day.split("-");
  return `${date}/${month} · ${formatTime(at, timeZone)}`;
}

// "Dans 4 h 42", "Dans 12 min": the time left before a booking.
export function formatTimeLeft(milliseconds: number) {
  const minutes = Math.max(1, Math.ceil(milliseconds / 60_000));
  if (minutes < 60) return `Dans ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `Dans ${hours} h` : `Dans ${hours} h ${String(rest).padStart(2, "0")}`;
}

// ——— Reminders ———

// What a complete profile has: each item counts the same (10 % each).
const PROFILE_ITEMS: { label: string; filled: (profile: StoredProfile) => boolean }[] = [
  { label: "votre photo", filled: (p) => !!p.photoUrl },
  { label: "votre titre", filled: (p) => !!p.headline.trim() },
  { label: "votre localisation", filled: (p) => !!p.location.trim() },
  { label: "votre présentation", filled: (p) => !!p.about.trim() },
  { label: "vos coordonnées", filled: (p) => !!p.contactEmail.trim() || !!p.phone.trim() },
  { label: "vos liens", filled: (p) => p.links.length > 0 },
  { label: "vos expériences", filled: (p) => p.experiences.length > 0 },
  { label: "votre formation", filled: (p) => p.educations.length > 0 },
  { label: "vos compétences", filled: (p) => p.skills.length > 0 },
  { label: "vos langues", filled: (p) => p.languages.length > 0 },
];

// "Profil complet à 80 %", and what is missing.
export function profileCompleteness(profile: StoredProfile) {
  const missing = PROFILE_ITEMS.filter((item) => !item.filled(profile)).map((item) => item.label);
  const percent = Math.round(((PROFILE_ITEMS.length - missing.length) / PROFILE_ITEMS.length) * 100);
  return { percent, missing };
}

// "Il manque vos langues et votre formation." (the first three at most, "…" beyond).
export function missingText(missing: string[]) {
  if (missing.length === 0) return "";
  const shown = missing.slice(0, 3);
  const list = shown.length === 1 ? shown[0] : `${shown.slice(0, -1).join(", ")} et ${shown.at(-1)}`;
  return `Il manque ${list}${missing.length > 3 ? "…" : "."}`;
}

// The storage reminder shows from 80 % of the capacity, like the indicator of the Drive.
export const STORAGE_WARNING_RATIO = 0.8;

export type Reminder = {
  // trial, canceling, past_due: the subscription (src/lib/billing/rules.ts).
  id: "offline" | "booking" | "profile" | "storage" | "trial" | "canceling" | "past_due";
  title: string;
  detail: string;
  href: string;
  value?: string;
  tone?: "warning" | "destructive";
};

export type ReminderInput = {
  isOnline: boolean;
  bookingOpen: boolean;
  profile: StoredProfile;
  storageUsed: number;
  storageCapacity: number;
};

export const formatPercent = (ratio: number) => `${Math.round(ratio * 100)} %`;

// The reminders of the dashboard, in this order; each disappears once dealt with.
export function reminders(input: ReminderInput, paths: { profile: string; availability: string; drive: string }): Reminder[] {
  const list: Reminder[] = [];
  if (!input.isOnline) {
    list.push({
      id: "offline",
      title: "Profil hors ligne",
      detail: "Votre profil n'est visible par personne. Mettez-le en ligne depuis le menu du profil.",
      href: paths.profile,
    });
  }
  if (!input.bookingOpen) {
    list.push({
      id: "booking",
      title: "Réservations fermées",
      detail: "Personne ne peut prendre rendez-vous avec vous.",
      href: paths.availability,
    });
  }
  const { percent, missing } = profileCompleteness(input.profile);
  if (missing.length > 0) {
    list.push({ id: "profile", title: "Profil complet", value: `${percent} %`, detail: missingText(missing), href: paths.profile });
  }
  const ratio = input.storageCapacity > 0 ? input.storageUsed / input.storageCapacity : 0;
  if (ratio >= STORAGE_WARNING_RATIO) {
    list.push({
      id: "storage",
      title: ratio >= 1 ? "Stockage plein" : "Stockage",
      value: formatPercent(Math.min(ratio, 1)),
      detail: "Supprimez des fichiers pour libérer de la place.",
      href: paths.drive,
      tone: ratio >= 1 ? "destructive" : "warning",
    });
  }
  return list;
}
