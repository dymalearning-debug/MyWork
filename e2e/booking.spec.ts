import { chromium, expect, type Page, test } from "@playwright/test";

import { formatDate, formatTime, timeZoneLabel } from "../src/lib/booking/format";
import { groupLabel } from "../src/lib/booking/overrides";
import { addDays, localDay, localTimeToInstant } from "../src/lib/booking/time";
import { login } from "./helpers/auth";
import {
  ALL_DAY,
  anonymous,
  book,
  bookingsOf,
  emailsOf,
  freeSlots,
  placeBooking,
  publicAvailability,
  setupBooking,
  tokenPayload,
} from "./helpers/booking";
import { adminClient, createUser, getProfile, setProfileOnline, signedInClient } from "./helpers/supabase-admin";

// Rendez-vous module (docs/booking.md, "Tests"): the owner's availability, the switch of the
// bookings, a visitor who books, the rules of the slots, the visitor's time zone, cancellations
// on both sides, the meeting room (checked at the level of its token: no test joins a real LiveKit
// room), the safety of the data, the limits against abuse, and the deletion of the account.

type User = { id: string; email: string; password: string };

const PARIS = "Europe/Paris";
const MINUTE = 60_000;
// The time zone of the test browser, the visitor's when not set: the computer's.
const HOST_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

async function signIn(page: Page, user: User) {
  await page.goto("/login");
  await login(page, user.email, user.password);
  await expect(page).toHaveURL(/\/app$/);
}

// An owner with an online profile and open bookings (all day, every day, 1 hour of notice).
async function owner(changes: Parameters<typeof setupBooking>[1] = {}) {
  const user = await createUser({ name: "Inès Robert" });
  const { handle } = await getProfile(user.id);
  await setupBooking(user, changes);
  await setProfileOnline(user.id, true);
  return { user, handle };
}

const slotName = (slot: Date, timeZone = PARIS) => `${formatDate(slot, timeZone)}, ${formatTime(slot, timeZone)}`;

test.describe("Rendez-vous", () => {
  test.describe.configure({ timeout: 120_000 });

  test("sets the availability and opens the bookings", async ({ page, browser }) => {
    const user = await createUser({ name: "Inès Robert" });
    const { handle } = await getProfile(user.id);
    await setProfileOnline(user.id, true);
    const visitor = await (await browser.newContext()).newPage();

    await signIn(page, user);
    await page.getByRole("link", { name: "Mes rendez-vous" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Mes rendez-vous" })).toBeVisible();
    await expect(page.getByText("Aucun rendez-vous à venir")).toBeVisible();

    // Closed by default: no tab, no button, and the address is not found.
    await visitor.goto(`/${handle}`);
    await expect(visitor.getByRole("link", { name: "Profil" })).toBeVisible();
    await expect(visitor.getByRole("link", { name: "Prendre rendez-vous" })).toHaveCount(0);
    await expect(visitor.getByRole("link", { name: "Rendez-vous" })).toHaveCount(0);
    await visitor.goto(`/${handle}/booking`);
    await expect(visitor.getByRole("heading", { name: "Page introuvable" })).toBeVisible();

    // Default hours: Monday to Friday, 9:00–12:00 and 14:00–18:00.
    await page.getByRole("link", { name: "Disponibilités" }).click();
    await expect(page.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    await expect(page.getByRole("checkbox", { name: "Lundi" })).toBeChecked();
    await expect(page.getByRole("checkbox", { name: "Samedi" })).not.toBeChecked();
    await expect(page.getByLabel("Lundi, début de la plage 1")).toHaveValue("540");
    await expect(page.getByLabel("Lundi, fin de la plage 2")).toHaveValue("1080");

    // Overlapping ranges are refused.
    await page.getByLabel("Mardi, début de la plage 2").selectOption("600");
    await expect(page.getByText("Ces plages se chevauchent.")).toBeVisible();
    await page.getByLabel("Mardi, début de la plage 2").selectOption("840");
    await expect(page.getByText("Ces plages se chevauchent.")).toHaveCount(0);

    // Saturday morning, the settings, a special day.
    await page.getByRole("checkbox", { name: "Samedi" }).click();
    await page.getByLabel("Samedi, retirer la plage 2").click();
    await page.getByLabel("Pause après un rendez-vous").selectOption("30");
    await page.getByLabel("Préavis minimum").selectOption("1440");
    await page.getByLabel("Réservable jusqu'à").selectOption("30");
    await page.getByLabel("Rendez-vous par jour").selectOption("2");
    await page.getByLabel("Fuseau horaire").selectOption(PARIS);

    const today = localDay(Date.now(), PARIS);
    const special = addDays(today, 3);
    await page.getByRole("button", { name: "Ajouter une date" }).click();
    const dialog = page.getByRole("dialog", { name: "Ajouter des jours particuliers" });
    if (special.slice(0, 7) !== today.slice(0, 7)) await dialog.getByRole("button", { name: "Mois suivant" }).click();
    await dialog.getByRole("button", { name: formatDate(new Date(localTimeToInstant(special, 720, PARIS)!), PARIS, { year: true }) }).click();
    await dialog.getByRole("button", { name: "Ajouter", exact: true }).click();
    await expect(page.getByText(groupLabel([special]), { exact: true })).toBeVisible();

    await page.getByRole("switch").click();
    await expect(page.getByText("Réservations ouvertes")).toBeVisible();
    await expect(page.getByText("Modifications non enregistrées")).toBeVisible();
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Disponibilités enregistrées")).toBeVisible();
    await expect(page.getByText("Tout est enregistré")).toBeVisible();

    const { data: setup } = await (await signedInClient(user)).rpc("get_own_booking_setup");
    expect(setup.settings).toEqual({
      isOpen: true,
      timeZone: PARIS,
      bufferMinutes: 30,
      noticeMinutes: 1440,
      horizonDays: 30,
      dailyLimit: 2,
    });
    expect(setup.weekly.filter((r: { weekday: number }) => r.weekday === 6)).toEqual([{ weekday: 6, start: 540, end: 720 }]);
    expect(setup.weekly.filter((r: { weekday: number }) => r.weekday === 7)).toEqual([]);
    expect(setup.overrides).toEqual([{ day: special, ranges: [] }]);

    // Open: the tab and the red button appear.
    await visitor.goto(`/${handle}`);
    await expect(visitor.getByRole("link", { name: "Rendez-vous", exact: true })).toBeVisible();
    await visitor.getByRole("link", { name: "Prendre rendez-vous" }).click();
    await expect(visitor).toHaveURL(new RegExp(`/${handle}/booking$`));
    await expect(visitor.getByText("Visio · 30 min")).toBeVisible();

    // Profile offline: not found, like the profile itself.
    await setProfileOnline(user.id, false);
    await visitor.goto(`/${handle}/booking`);
    await expect(visitor.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
    await setProfileOnline(user.id, true);

    // Leaving with changes not saved asks first.
    await page.getByLabel("Pause après un rendez-vous").selectOption("0");
    await page.getByRole("navigation", { name: "Mes rendez-vous" }).getByRole("link", { name: "Rendez-vous" }).click();
    const leave = page.getByRole("dialog", { name: "Enregistrer les modifications ?" });
    await expect(leave).toBeVisible();
    await leave.getByRole("button", { name: "Ignorer les modifications" }).click();
    await expect(page).toHaveURL(/\/app\/booking$/);

    // Closed again: the tab and the address disappear.
    await page.getByRole("link", { name: "Disponibilités" }).click();
    await page.getByRole("switch").click();
    await expect(page.getByText("Réservations fermées")).toBeVisible();
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Disponibilités enregistrées")).toBeVisible();
    await visitor.goto(`/${handle}`);
    await expect(visitor.getByRole("link", { name: "Prendre rendez-vous" })).toHaveCount(0);
    await visitor.goto(`/${handle}/booking`);
    await expect(visitor.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  });

  test("a visitor books a slot, the owner sees it", async ({ page, browser }) => {
    const { user, handle } = await owner();
    const visitorContext = await browser.newContext({ timezoneId: PARIS, locale: "fr-FR" });
    const visitor = await visitorContext.newPage();
    const [first] = await freeSlots(handle);

    await visitor.goto(`/${handle}/booking`);
    await expect(visitor.getByText("Choisissez un créneau.")).toBeVisible();
    await expect(visitor.getByRole("button", { name: "Continuer" })).toBeDisabled();
    await visitor.getByRole("button", { name: slotName(first) }).click();
    await expect(visitor.getByRole("button", { name: slotName(first) })).toHaveAttribute("aria-pressed", "true");
    await visitor.getByRole("button", { name: "Continuer" }).click();

    // The form: required fields, a valid email.
    await expect(visitor.getByText("Votre créneau")).toBeVisible();
    await visitor.getByRole("button", { name: "Confirmer le rendez-vous" }).click();
    await expect(visitor.getByText("Indiquez votre nom.")).toBeVisible();
    await expect(visitor.getByText("Indiquez votre adresse e-mail.")).toBeVisible();
    await expect(visitor.getByText("Dites en quelques mots l'objet du rendez-vous.")).toBeVisible();
    await visitor.getByLabel("Nom").fill("Marc Dubois");
    await visitor.getByLabel("E-mail").fill("marc.dubois@exemple");
    await visitor.getByLabel("Objet du rendez-vous").fill("Audit UX de notre parcours d'inscription.");
    await visitor.getByRole("button", { name: "Confirmer le rendez-vous" }).click();
    await expect(visitor.getByText("Cette adresse e-mail n'est pas valide.")).toBeVisible();
    await visitor.getByLabel("E-mail").fill("marc.dubois@exemple.fr");
    await visitor.getByLabel("Fonction").fill("Directeur produit");
    await visitor.getByLabel("Entreprise").fill("Alto");
    await expect(visitor.getByText("Vos informations sont transmises à Inès Robert, uniquement pour ce rendez-vous.")).toBeVisible();
    await visitor.getByRole("button", { name: "Confirmer le rendez-vous" }).click();

    // The confirmation is the guest's page, with the link and the calendar file.
    await expect(visitor).toHaveURL(new RegExp(`/${handle}/booking/[A-Za-z0-9_-]{24}$`));
    await expect(visitor.getByText("Rendez-vous confirmé")).toBeVisible();
    await expect(visitor.getByText("Lien du rendez-vous")).toBeVisible();
    await expect(visitor.getByText("Gardez ce lien : il permet de rejoindre la visio et d'annuler.")).toBeVisible();
    await expect(visitor.getByText("Un e-mail de confirmation vous sera envoyé")).toHaveCount(0);
    await expect(visitor.getByRole("button", { name: "Rejoindre la visio" })).toBeDisabled();
    const icsLink = await visitor.getByRole("link", { name: "Ajouter à l'agenda" }).getAttribute("href");
    const ics = await visitor.request.get(icsLink!);
    expect(ics.headers()["content-type"]).toContain("text/calendar");
    const icsText = await ics.text();
    expect(icsText).toContain("BEGIN:VCALENDAR");
    expect(icsText).toContain(`DTSTART:${first.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`);
    expect(icsText).toContain("SUMMARY:Rendez-vous avec Inès Robert");

    // Saved, with the two emails prepared and not sent.
    const [booking] = await bookingsOf(user.id);
    expect(booking).toMatchObject({ start_at: expect.any(String), status: "confirmed", is_seen: false, guest_name: "Marc Dubois" });
    expect(new Date(booking.start_at).getTime()).toBe(first.getTime());
    const emails = await emailsOf(user.id);
    expect(emails.map((e) => [e.template, e.status])).toEqual([
      ["guest_confirmation", "pending"],
      ["owner_new_booking", "pending"],
    ]);
    expect(emails[0].recipient).toBe("marc.dubois@exemple.fr");
    expect(emails[1].recipient).toBe(user.email);

    // The slot is gone, and its break with it; the slot right after the break appears.
    await visitor.goto(`/${handle}/booking`);
    await expect(visitor.getByText("Visio · 30 min")).toBeVisible();
    await expect(visitor.getByRole("button", { name: slotName(first) })).toHaveCount(0);
    const after = (await freeSlots(handle)).map((slot) => slot.getTime());
    expect(after).not.toContain(first.getTime());
    expect(after).not.toContain(first.getTime() + 30 * MINUTE);
    expect(after).toContain(first.getTime() + 45 * MINUTE);

    // The owner: a red dot in the sidebar and on the booking, until it is opened.
    await signIn(page, user);
    const nav = page.getByRole("navigation", { name: "Navigation principale" });
    await expect(nav.getByRole("img", { name: "Nouvelles réservations" })).toBeVisible();
    await nav.getByRole("link", { name: "Mes rendez-vous" }).click();
    await expect(page.getByRole("link", { name: "À venir · 1" })).toBeVisible();
    await expect(page.getByRole("img", { name: "Nouveau" })).toBeVisible();
    await expect(page.getByText("Directeur produit · Alto")).toBeVisible();
    await page.getByRole("button", { name: /^Marc Dubois/ }).click();
    const detail = page.getByRole("dialog", { name: "Marc Dubois" });
    await expect(detail.getByText("marc.dubois@exemple.fr")).toBeVisible();
    await expect(detail.getByText("Audit UX de notre parcours d'inscription.")).toBeVisible();
    await expect(detail.getByRole("button", { name: "Copier le lien de l'invité" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect.poll(async () => (await bookingsOf(user.id))[0].is_seen).toBe(true);
    await page.reload();
    await expect(page.getByRole("img", { name: "Nouveau" })).toHaveCount(0);
    await expect(nav.getByRole("img", { name: "Nouvelles réservations" })).toHaveCount(0);
  });

  test("a slot taken meanwhile, and two visitors at the same second", async ({ page }) => {
    const { handle } = await owner();
    const [first] = await freeSlots(handle);

    await page.goto(`/${handle}/booking`);
    await page.getByRole("button", { name: slotName(first, HOST_ZONE) }).click();
    await page.getByRole("button", { name: "Continuer" }).click();
    await page.getByLabel("Nom").fill("Marc Dubois");
    await page.getByLabel("E-mail").fill("marc.dubois@exemple.fr");
    await page.getByLabel("Objet du rendez-vous").fill("Un projet.");
    // Someone else takes it first.
    expect((await book(handle, first)).status).toBe("ok");
    await page.getByRole("button", { name: "Confirmer le rendez-vous" }).click();
    await expect(page.getByText("Ce créneau vient d'être réservé. Choisissez-en un autre.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuer" })).toBeDisabled();
    await expect(page.getByRole("button", { name: slotName(first, HOST_ZONE) })).toHaveCount(0);
    // The form is kept.
    const next = (await freeSlots(handle))[0];
    await page.getByRole("button", { name: slotName(next, HOST_ZONE) }).click();
    await page.getByRole("button", { name: "Continuer" }).click();
    await expect(page.getByLabel("Nom")).toHaveValue("Marc Dubois");
    await expect(page.getByLabel("Objet du rendez-vous")).toHaveValue("Un projet.");

    // Two bookings of the same slot at the same moment: only one goes through.
    const later = (await freeSlots(handle)).at(-1)!;
    const results = await Promise.all([book(handle, later), book(handle, later), book(handle, later)]);
    expect(results.map((r) => r.status).sort()).toEqual(["ok", "taken", "taken"]);
  });

  test("respects the notice, the horizon, the limit per day and the special days", async () => {
    const today = localDay(Date.now(), PARIS);
    const { user, handle } = await owner({
      noticeMinutes: 240,
      horizonDays: 14,
      dailyLimit: 2,
      overrides: [{ day: addDays(today, 5), ranges: [] }],
    });
    const at = (days: number, minutes: number) => new Date(localTimeToInstant(addDays(today, days), minutes, PARIS)!);
    const availability = (await publicAvailability(handle))!;
    const now = new Date(availability.now).getTime();
    const slots = await freeSlots(handle);

    // Notice: nothing before 4 hours from now.
    expect(slots[0].getTime()).toBeGreaterThanOrEqual(now + 240 * MINUTE);
    const tooSoon = new Date(Math.ceil((now + 90 * MINUTE) / (30 * MINUTE)) * 30 * MINUTE);
    expect((await book(handle, tooSoon)).status).toBe("taken");

    // Horizon: nothing beyond 14 days.
    expect(slots.at(-1)!.getTime()).toBeLessThan(now + 14 * 24 * 60 * MINUTE);
    expect((await book(handle, at(15, 600))).status).toBe("taken");

    // Special day, unavailable.
    expect(slots.some((slot) => localDay(slot, PARIS) === addDays(today, 5))).toBe(false);
    expect((await book(handle, at(5, 600))).status).toBe("taken");

    // Off the grid: only right after the break of a booking.
    expect((await book(handle, at(4, 615))).status).toBe("taken");
    expect((await book(handle, at(4, 600))).status).toBe("ok");
    expect((await book(handle, at(4, 645))).status).toBe("ok");

    // Limit per day: the day of two bookings is closed.
    expect((await book(handle, at(4, 900))).status).toBe("taken");
    expect((await freeSlots(handle)).some((slot) => localDay(slot, PARIS) === addDays(today, 4))).toBe(false);
    expect((await bookingsOf(user.id)).length).toBe(2);
  });

  test("shows the slots in the visitor's time zone", async ({ browser }) => {
    const { handle } = await owner({ weekly: ALL_DAY.map((r) => ({ ...r, start: 540, end: 600 })) });
    const [first] = await freeSlots(handle);
    const NEW_YORK = "America/New_York";
    const visitor = await (await browser.newContext({ timezoneId: NEW_YORK, locale: "fr-FR" })).newPage();
    await visitor.goto(`/${handle}/booking`);
    await expect(visitor.getByText(timeZoneLabel(NEW_YORK))).toBeVisible();
    await expect(visitor.getByRole("button", { name: slotName(first, NEW_YORK) })).toBeVisible();
    // 9:00 in Paris is 3:00 or 4:00 in New York.
    expect(["03:00", "04:00"]).toContain(formatTime(first, NEW_YORK));

    // The visitor can choose another time zone.
    await visitor.getByRole("button", { name: "changer" }).click();
    await visitor.getByLabel("Fuseau horaire").selectOption(PARIS);
    await expect(visitor.getByText("Heure de Paris")).toBeVisible();
    await expect(visitor.getByRole("button", { name: slotName(first, PARIS) })).toBeVisible();
  });

  test("cancels a booking on both sides", async ({ page, browser }) => {
    const { user, handle } = await owner();
    const slots = await freeSlots(handle);
    const byOwner = await book(handle, slots[0], { name: "Alice Martin" });
    const byGuest = await book(handle, slots[4], { name: "Bruno Petit" });

    // By the owner, with a message.
    await signIn(page, user);
    await page.goto("/app/booking");
    await page.getByRole("button", { name: "Actions pour Alice Martin" }).click();
    await page.getByRole("menuitem", { name: "Annuler le rendez-vous" }).click();
    const dialog = page.getByRole("dialog", { name: "Annuler le rendez-vous" });
    await expect(dialog.getByText(/Annuler le rendez-vous avec Alice Martin/)).toBeVisible();
    await dialog.getByLabel("Message pour l'invité").fill("Un imprévu ce jour-là.");
    await dialog.getByRole("button", { name: "Annuler le rendez-vous" }).click();
    await expect(page.getByText("Rendez-vous annulé", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Alice Martin" })).toHaveCount(0);
    await page.getByRole("link", { name: "Annulés" }).click();
    await expect(page.getByText("Annulé par vous")).toBeVisible();

    // The slot is free again, the guest's page says it, an email is prepared.
    expect((await freeSlots(handle)).map((s) => s.getTime())).toContain(slots[0].getTime());
    const visitor = await (await browser.newContext()).newPage();
    await visitor.goto(`/${handle}/booking/${byOwner.code}`);
    await expect(visitor.getByText("Rendez-vous annulé")).toBeVisible();
    await expect(visitor.getByText("Ce rendez-vous a été annulé par Inès Robert.")).toBeVisible();
    await expect(visitor.getByText("Un imprévu ce jour-là.")).toBeVisible();
    await expect(visitor.getByRole("link", { name: "Réserver un autre créneau" })).toBeVisible();
    await expect(visitor.getByRole("link", { name: "Ajouter à l'agenda" })).toHaveCount(0);

    // By the guest, with a reason.
    await visitor.goto(`/${handle}/booking/${byGuest.code}`);
    await visitor.getByRole("button", { name: "Annuler", exact: true }).click();
    const guestDialog = visitor.getByRole("dialog", { name: "Annuler le rendez-vous" });
    await guestDialog.getByLabel("Motif").fill("Réunion déplacée.");
    await guestDialog.getByRole("button", { name: "Annuler le rendez-vous" }).click();
    await expect(visitor.getByText("Vous avez annulé ce rendez-vous.")).toBeVisible();

    const bookings = await bookingsOf(user.id);
    expect(bookings.map((b) => [b.guest_name, b.status, b.cancelled_by, b.cancel_message])).toEqual([
      ["Alice Martin", "cancelled", "owner", "Un imprévu ce jour-là."],
      ["Bruno Petit", "cancelled", "guest", "Réunion déplacée."],
    ]);
    const emails = (await emailsOf(user.id)).filter((e) => e.template.endsWith("cancelled"));
    expect(emails.map((e) => [e.template, e.status, e.recipient])).toEqual([
      ["guest_cancelled", "pending", expect.stringContaining("@exemple.fr")],
      ["owner_cancelled", "pending", user.email],
    ]);

    // A cancelled booking is deleted for good.
    await page.reload();
    await expect(page.getByText("Annulé par l'invité")).toBeVisible();
    await page.getByRole("button", { name: "Actions pour Bruno Petit" }).click();
    await page.getByRole("menuitem", { name: "Supprimer" }).click();
    await page.getByRole("dialog", { name: "Supprimer ce rendez-vous ?" }).getByRole("button", { name: "Supprimer" }).click();
    await expect(page.getByText("Rendez-vous supprimé")).toBeVisible();
    expect((await bookingsOf(user.id)).map((b) => b.guest_name)).toEqual(["Alice Martin"]);
  });

  test("gives access to the meeting room only inside its window", async ({ page, browser }) => {
    const { user, handle } = await owner();
    const now = Date.now();
    const early = await placeBooking(user.id, new Date(now + 2 * 24 * 60 * MINUTE), { guestName: "Paul Early" });
    const open = await placeBooking(user.id, new Date(now + 10 * MINUTE), { guestName: "Claire Martin" });
    const over = await placeBooking(user.id, new Date(now - 2 * 60 * MINUTE), { guestName: "Olivier Passé" });
    const cancelled = await placeBooking(user.id, new Date(now + 5 * 60 * MINUTE), { guestName: "Chloé Annulée", status: "cancelled" });
    const visitor = await (await browser.newContext()).newPage();
    const guestToken = (code: string) => visitor.request.post(`/${handle}/booking/${code}/meet/token`);

    // Before the window: "come back later", and no token.
    await visitor.goto(`/${handle}/booking/${early.code}`);
    await expect(visitor.getByText(/avant l'ouverture de la salle/)).toBeVisible();
    await expect(visitor.getByRole("button", { name: "Rejoindre la visio" })).toBeDisabled();
    await visitor.goto(`/${handle}/booking/${early.code}/meet`);
    await expect(visitor.getByRole("heading", { name: "Revenez plus tard" })).toBeVisible();
    let response = await guestToken(early.code);
    expect(response.status()).toBe(403);
    expect(await response.json()).toMatchObject({ ok: false, reason: "early" });

    // Inside: a token for the room of this booking, two people at most, until the room closes.
    await visitor.goto(`/${handle}/booking/${open.code}`);
    await expect(visitor.getByText("C'est l'heure")).toBeVisible();
    await expect(visitor.getByText("La salle est ouverte.")).toBeVisible();
    await visitor.getByRole("link", { name: "Rejoindre la visio" }).click();
    await expect(visitor.getByRole("heading", { name: "Prêt à entrer ?" })).toBeVisible();
    response = await guestToken(open.code);
    expect(response.status()).toBe(200);
    const access = await response.json();
    expect(access.serverUrl).toMatch(/^wss:\/\//);
    const payload = tokenPayload(access.token);
    expect(payload.sub).toBe(`guest-${open.id}`);
    expect(payload.name).toBe("Claire Martin");
    expect(payload.video).toMatchObject({ room: `booking-${open.id}`, roomJoin: true });
    expect(payload.roomConfig).toMatchObject({ name: `booking-${open.id}`, maxParticipants: 2, emptyTimeout: 300 });
    // Valid until 30 minutes after the planned end.
    expect(payload.exp * 1000).toBeLessThanOrEqual(now + (10 + 30 + 30) * MINUTE + 60_000);

    // After the window, or cancelled: refused.
    response = await guestToken(over.code);
    expect(await response.json()).toMatchObject({ ok: false, reason: "over" });
    await visitor.goto(`/${handle}/booking/${over.code}`);
    await expect(visitor.getByText("Ce rendez-vous est terminé.")).toBeVisible();
    response = await guestToken(cancelled.code);
    expect(await response.json()).toMatchObject({ ok: false, reason: "cancelled" });

    // The owner: "Rejoindre" only for the open room, and their own token.
    await signIn(page, user);
    await page.goto("/app/booking");
    await expect(page.getByRole("link", { name: "Rejoindre" })).toHaveCount(1);
    await expect(page.getByRole("button", { name: /^Rejoindre, la salle ouvre à/ })).toBeDisabled();
    let ownerResponse = await page.request.post(`/app/booking/${open.id}/meet/token`);
    expect(ownerResponse.status()).toBe(200);
    expect(tokenPayload((await ownerResponse.json()).token).sub).toBe(`owner-${user.id}`);
    ownerResponse = await page.request.post(`/app/booking/${early.id}/meet/token`);
    expect(await ownerResponse.json()).toMatchObject({ ok: false, reason: "early" });
    await page.getByRole("link", { name: "Rejoindre" }).click();
    await expect(page).toHaveURL(new RegExp(`/app/booking/${open.id}/meet$`));
    await expect(page.getByRole("heading", { name: "Prêt à entrer ?" })).toBeVisible();

    // Another user gets nothing.
    const stranger = await createUser();
    const strangerPage = await (await browser.newContext()).newPage();
    await signIn(strangerPage, stranger);
    const strangerResponse = await strangerPage.request.post(`/app/booking/${open.id}/meet/token`);
    expect(strangerResponse.status()).toBe(404);
  });

  test("keeps each booking to its people, and limits abuse", async ({ page }) => {
    const { user, handle } = await owner();
    const other = await owner();
    const slots = await freeSlots(handle);
    const booked = await book(handle, slots[0]);

    // A wrong code, or a code under another profile: not found.
    await page.goto(`/${handle}/booking/${"A".repeat(24)}`);
    await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
    await page.goto(`/${other.handle}/booking/${booked.code}`);
    await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
    expect((await page.request.get(`/${other.handle}/booking/${booked.code}/ics`)).status()).toBe(404);

    // Visitors never reach the tables; the slots never tell who booked.
    const { data: rows, error } = await anonymous().from("bookings").select("*");
    expect(error ?? rows?.length === 0).toBeTruthy();
    const availability = (await publicAvailability(handle))!;
    expect(availability.busy.length).toBe(1);
    expect(Object.keys(availability.busy[0]).sort()).toEqual(["end", "start"]);
    expect(JSON.stringify(availability)).not.toContain("Marc");

    // Another user sees nothing of these bookings, and cannot cancel or delete them.
    const otherClient = await signedInClient(other.user);
    const { data: seen } = await otherClient.from("bookings").select("id");
    expect(seen).toEqual([]);
    const [bookingId] = (await bookingsOf(user.id)).map((b) => b.id);
    const { data: cancelResult } = await otherClient.rpc("cancel_own_booking", { booking_id: bookingId, message: "" });
    expect(cancelResult).toEqual({ status: "not_found" });
    await otherClient.from("bookings").delete().eq("id", bookingId);
    expect((await bookingsOf(user.id)).length).toBe(1);

    // 3 upcoming bookings at most for one email.
    const email = `limite.${Date.now()}@exemple.fr`;
    expect((await book(handle, slots[10], { email })).status).toBe("ok");
    expect((await book(handle, slots[12], { email })).status).toBe("ok");
    expect((await book(handle, slots[14], { email: email.toUpperCase() })).status).toBe("ok");
    expect((await book(handle, slots[16], { email })).status).toBe("limit_email");

    // 10 bookings an hour at most from one address.
    const ipHash = `test-${Date.now()}`;
    const results = [];
    for (let i = 0; i < 11; i++) results.push((await book(other.handle, (await freeSlots(other.handle))[0], { ipHash })).status);
    expect(results.slice(0, 10).every((status) => status === "ok")).toBe(true);
    expect(results[10]).toBe("limit_ip");

    // The hidden trap field turns robots away.
    await page.goto(`/${handle}/booking`);
    const slot = (await freeSlots(handle))[0];
    await page.getByRole("button", { name: slotName(slot, HOST_ZONE) }).click();
    await page.getByRole("button", { name: "Continuer" }).click();
    await page.getByLabel("Nom").fill("Robot");
    await page.getByLabel("E-mail").fill("robot@exemple.fr");
    await page.getByLabel("Objet du rendez-vous").fill("Spam");
    await page.locator("#guest-website").fill("https://spam.example", { force: true });
    await page.getByRole("button", { name: "Confirmer le rendez-vous" }).click();
    await expect(page.getByText("Certaines informations ont été refusées. Vérifiez le formulaire.")).toBeVisible();
    expect((await bookingsOf(user.id)).some((b) => b.guest_name === "Robot")).toBe(false);
  });

  test("the camera preview opens and stays open before entering the room", async () => {
    const { user, handle } = await owner();
    const open = await placeBooking(user.id, new Date(Date.now() + 5 * MINUTE));
    // A browser with a fake camera and microphone, already allowed.
    const browser = await chromium.launch({ args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
    try {
      const page = await (await browser.newContext({ permissions: ["camera", "microphone"] })).newPage();
      await page.goto(`http://localhost:3000/${handle}/booking/${open.code}/meet`);
      const preview = page.getByLabel("Aperçu de votre caméra");
      await expect(preview).toBeVisible();
      await page.waitForTimeout(3000);
      await expect(preview).toBeVisible();
      expect(await preview.evaluate((video: HTMLVideoElement) => video.readyState >= 2 && video.videoWidth > 0)).toBe(true);
      await expect(page.getByText("Caméra en cours d'ouverture")).toHaveCount(0);
    } finally {
      await browser.close();
    }
  });

  test("the deletion of the account erases the module", async () => {
    const { user, handle } = await owner();
    await book(handle, (await freeSlots(handle))[0]);
    const admin = adminClient();
    expect((await bookingsOf(user.id)).length).toBe(1);

    const { error } = await (await signedInClient(user)).rpc("delete_own_account");
    expect(error).toBeNull();
    for (const table of ["booking_settings", "booking_availability", "booking_overrides", "bookings", "booking_emails"]) {
      const { count } = await admin.from(table).select("*", { count: "exact", head: true }).eq("user_id", user.id);
      expect(count, table).toBe(0);
    }
  });
});

