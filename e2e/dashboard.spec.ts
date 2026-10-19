import { expect, type Browser, type Page, test } from "@playwright/test";

import { login } from "./helpers/auth";
import { anonymous, placeBooking } from "./helpers/booking";
import { adminClient, createUser, getProfile, setProfileOnline } from "./helpers/supabase-admin";

// Tableau de bord (docs/dashboard.md): today's bookings, the visits of the public profile (once a
// day per visitor, never the owner nor an offline profile), the signals and the reminders.

async function signIn(page: Page, user: { email: string; password: string }) {
  await page.goto("/login");
  await login(page, user.email, user.password);
  await expect(page).toHaveURL(/\/app$/);
}

// A visitor of their own: another address (Vercel gives it in x-forwarded-for).
async function visitAs(browser: Browser, ip: string, path: string) {
  const context = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": ip } });
  const page = await context.newPage();
  await page.goto(path);
  return { context, page };
}

async function visitsOf(userId: string) {
  const { data, error } = await adminClient().from("profile_visits").select("tab, visitor, day").eq("user_id", userId);
  if (error) throw error;
  return data as { tab: string; visitor: string; day: string }[];
}

async function eventsOf(userId: string) {
  const { data, error } = await adminClient().from("profile_events").select("kind, item_name").eq("user_id", userId);
  if (error) throw error;
  return data as { kind: string; item_name: string | null }[];
}

const tile = (page: Page, name: string) => page.getByRole("region", { name, exact: true });

// Few sign-ins: Supabase allows 30 every 5 minutes from one address, for the whole run.
test("a new account: nothing yet and the reminders; then today's bookings only", async ({ page }) => {
  const user = await createUser({ name: "Inès Robert" });
  await signIn(page, user);

  await expect(page.getByRole("heading", { level: 1, name: "Tableau de bord" })).toBeVisible();
  await expect(tile(page, "Rendez-vous")).toContainText("Aucun rendez-vous aujourd'hui.");
  await expect(tile(page, "Visiteurs sur 7 jours")).toContainText("0");
  await expect(tile(page, "Visiteurs sur 30 jours")).toContainText("0");
  await expect(tile(page, "Réservations")).toContainText("Aucun pour l'instant");

  const reminders = tile(page, "Rappels");
  await expect(reminders.getByRole("link", { name: "Profil hors ligne" })).toBeVisible();
  await expect(reminders.getByRole("link", { name: "Réservations fermées" })).toHaveAttribute("href", "/app/booking/availability");
  await expect(reminders.getByRole("link", { name: /Profil complet/ })).toHaveAttribute("href", "/app/profile");
  await expect(reminders.getByRole("link", { name: /Stockage/ })).toHaveCount(0);

  // Bookings: only today's, with Rejoindre once the room is open.
  const now = Date.now();
  await placeBooking(user.id, new Date(now + 5 * 60_000), { guestName: "Camille Laurent" });
  await placeBooking(user.id, new Date(now + 26 * 3_600_000), { guestName: "Sarah Benali" });
  await page.reload();
  const bookings = tile(page, "Rendez-vous");
  await expect(bookings).toContainText("1aujourd'hui");
  await expect(bookings.getByRole("link", { name: /Camille Laurent/ })).toBeVisible();
  await expect(bookings.getByRole("img", { name: "Nouveau" })).toBeVisible();
  await expect(bookings.getByRole("link", { name: "Rejoindre" })).toBeVisible();
  await expect(bookings).not.toContainText("Sarah Benali");
  // Both bookings are signals of the last 30 days.
  await expect(tile(page, "Réservations")).toContainText("2");
});

test("visits: once a day per visitor, per tab; never the owner, nor an offline profile", async ({ browser, page }) => {
  const user = await createUser({ name: "Inès Robert" });
  const { handle } = await getProfile(user.id);
  await setProfileOnline(user.id, true);

  const first = await visitAs(browser, "203.0.113.10", `/${handle}`);
  await first.page.reload();
  const second = await visitAs(browser, "203.0.113.11", `/${handle}`);
  await expect.poll(async () => (await visitsOf(user.id)).length).toBe(2);
  const visits = await visitsOf(user.id);
  expect(visits.every((v) => v.tab === "profile" && /^[0-9a-f]{64}$/.test(v.visitor))).toBe(true);
  // Never the address itself.
  expect(visits.some((v) => v.visitor.includes("203.0.113"))).toBe(false);

  // The owner, signed in, looks at their profile: not counted.
  await signIn(page, user);
  await page.goto(`/${handle}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.waitForLoadState("networkidle");

  // Offline: the page is not found, nothing is counted.
  await setProfileOnline(user.id, false);
  const third = await visitAs(browser, "203.0.113.12", `/${handle}`);
  await expect(third.page.getByText("Page introuvable")).toBeVisible();
  // A visit recorded directly, without the page, for an offline profile: refused too.
  await anonymous().rpc("record_profile_visit", { profile_handle: handle, visit_tab: "profile", visitor_key: "198.51.100.1|Test" });
  await setProfileOnline(user.id, true);
  expect(await visitsOf(user.id)).toHaveLength(2);

  await page.goto("/app");
  await expect(tile(page, "Visiteurs sur 7 jours")).toContainText("2");
  await expect(tile(page, "Visiteurs sur 7 jours")).toContainText("+2 par rapport aux 7 jours d'avant");
  await expect(tile(page, "Par onglet · 30 jours")).toContainText(/Profil\s*2/);

  for (const visit of [first, second, third]) await visit.context.close();
});

test("signals: Me contacter, and the rules of the database", async ({ browser, page }) => {
  const user = await createUser({ name: "Inès Robert" });
  const { handle } = await getProfile(user.id);
  const { error } = await adminClient().from("profiles").update({ contact_email: "ines.robert@exemple.test" }).eq("id", user.id);
  if (error) throw error;
  await setProfileOnline(user.id, true);

  const visitor = await visitAs(browser, "203.0.113.20", `/${handle}`);
  await visitor.page.getByRole("button", { name: "Me contacter" }).click();
  await expect(visitor.page.getByRole("dialog", { name: "Me contacter" })).toContainText("ines.robert@exemple.test");
  await expect.poll(async () => (await eventsOf(user.id)).map((e) => e.kind)).toEqual(["contact"]);

  // A CV downloaded; a file that is not a public file of the profile: not a signal.
  await anonymous().rpc("record_profile_event", { profile_handle: handle, event_kind: "cv" });
  await anonymous().rpc("record_profile_event", {
    profile_handle: handle,
    event_kind: "resource",
    item_id: "00000000-0000-0000-0000-000000000000",
  });
  // The owner opening their own "Me contacter": not a signal.
  await signIn(page, user);
  await page.goto(`/${handle}`);
  await page.getByRole("button", { name: "Me contacter" }).click();
  await expect(page.getByRole("dialog", { name: "Me contacter" })).toContainText("ines.robert@exemple.test");
  expect((await eventsOf(user.id)).map((e) => e.kind).sort()).toEqual(["contact", "cv"]);

  // Visitors cannot read the visits nor the signals.
  const { data } = await anonymous().from("profile_events").select("kind");
  expect(data ?? []).toEqual([]);

  await page.goto("/app");
  await expect(tile(page, "« Me contacter »")).toContainText("1");
  await expect(tile(page, "« Me contacter »")).toContainText(/Dernier : (à l'instant|il y a \d+ min)/);
  await expect(tile(page, "CV téléchargés")).toContainText("1");
  await expect(tile(page, "Ressources")).toContainText("0");

  await visitor.context.close();
});
