"use server";

import { refresh } from "next/cache";

import { getCurrentUser } from "@/lib/auth/user";
import { cancelOwnBooking, deleteOwnBooking, markOwnBookingSeen, saveOwnBookingSetup } from "@/lib/booking/data";
import { sendBookingEmails } from "@/lib/booking/emails/send-email";
import {
  BUFFER_OPTIONS,
  CANCEL_MESSAGE_MAX,
  DAILY_LIMIT_OPTIONS,
  HORIZON_OPTIONS,
  isUuid,
  isValidRange,
  NOTICE_OPTIONS,
  rangesOverlap,
  type BookingSettings,
  type DayOverride,
  type WeeklyRange,
} from "@/lib/booking/rules";
import { isKnownTimeZone } from "@/lib/booking/time";

// Server Actions of "Mes rendez-vous" (docs/booking.md). Each checks the user again; the database
// checks the rules again (RLS, functions). The private space is refreshed afterwards, so that the
// list, the counters and the red dot of the sidebar follow.

const isSettings = (value: unknown): value is BookingSettings => {
  const s = value as BookingSettings;
  return (
    !!s &&
    typeof s.isOpen === "boolean" &&
    typeof s.timeZone === "string" &&
    isKnownTimeZone(s.timeZone) &&
    BUFFER_OPTIONS.some((o) => o.value === s.bufferMinutes) &&
    NOTICE_OPTIONS.some((o) => o.value === s.noticeMinutes) &&
    HORIZON_OPTIONS.some((o) => o.value === s.horizonDays) &&
    (s.dailyLimit === null || (DAILY_LIMIT_OPTIONS as readonly number[]).includes(s.dailyLimit))
  );
};

const isDay = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

function areValidHours(weekly: unknown, overrides: unknown): weekly is WeeklyRange[] {
  if (!Array.isArray(weekly) || !Array.isArray(overrides) || weekly.length > 7 * 12 || overrides.length > 366) return false;
  for (let weekday = 1; weekday <= 7; weekday++) {
    const ranges = (weekly as WeeklyRange[]).filter((r) => r.weekday === weekday);
    if (!ranges.every(isValidRange) || rangesOverlap(ranges)) return false;
  }
  if (!(weekly as WeeklyRange[]).every((r) => Number.isInteger(r.weekday) && r.weekday >= 1 && r.weekday <= 7)) return false;
  const days = new Set<string>();
  for (const o of overrides as DayOverride[]) {
    if (!isDay(o?.day) || days.has(o.day) || !Array.isArray(o.ranges) || o.ranges.length > 12) return false;
    if (!o.ranges.every(isValidRange) || rangesOverlap(o.ranges)) return false;
    days.add(o.day);
  }
  return true;
}

// "Enregistrer" of "Disponibilités": the switch, the hours, the special days and the settings,
// all at once.
export async function saveAvailability(input: {
  settings: BookingSettings;
  weekly: WeeklyRange[];
  overrides: DayOverride[];
}): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user || !input || !isSettings(input.settings) || !areValidHours(input.weekly, input.overrides)) return { ok: false };
  const settings: BookingSettings = {
    isOpen: input.settings.isOpen,
    timeZone: input.settings.timeZone,
    bufferMinutes: input.settings.bufferMinutes,
    noticeMinutes: input.settings.noticeMinutes,
    horizonDays: input.settings.horizonDays,
    dailyLimit: input.settings.dailyLimit,
  };
  const weekly = input.weekly.map(({ weekday, start, end }) => ({ weekday, start, end }));
  const overrides = input.overrides.map(({ day, ranges }) => ({ day, ranges: ranges.map(({ start, end }) => ({ start, end })) }));
  try {
    await saveOwnBookingSetup(settings, weekly, overrides);
  } catch (error) {
    console.error(error);
    return { ok: false };
  }
  refresh();
  return { ok: true };
}

// A booking opened in "Mes rendez-vous": its red dot goes away.
export async function markBookingSeen(id: string) {
  const user = await getCurrentUser();
  if (!user || typeof id !== "string" || !isUuid(id)) return;
  try {
    await markOwnBookingSeen(id);
  } catch (error) {
    console.error(error);
    return;
  }
  refresh();
}

// "Annuler le rendez-vous", with an optional message for the guest: the slot is free again, the
// email to the guest is prepared.
export async function cancelBooking(id: string, message: string): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user || typeof id !== "string" || !isUuid(id) || typeof message !== "string" || message.length > CANCEL_MESSAGE_MAX) {
    return { ok: false };
  }
  try {
    const result = await cancelOwnBooking(id, message);
    if (result.status !== "ok") return { ok: false };
    await sendBookingEmails(result.emailIds);
  } catch (error) {
    console.error(error);
    return { ok: false };
  }
  refresh();
  return { ok: true };
}

// "Supprimer": a past or cancelled booking, for good, with its guest's data.
export async function deleteBooking(id: string): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user || typeof id !== "string" || !isUuid(id)) return { ok: false };
  try {
    if (!(await deleteOwnBooking(id))) return { ok: false };
  } catch (error) {
    console.error(error);
    return { ok: false };
  }
  refresh();
  return { ok: true };
}
