import { expect, type Page, test } from "@playwright/test";

import { login, openSettings } from "./helpers/auth";
import { anonymous, bookingsOf, emailsOf, placeBooking } from "./helpers/booking";
import {
  adminClient,
  createUser,
  getProfile,
  getSubscription,
  setProfileOnline,
  signedInClient,
  userExists,
  type TestSubscription,
} from "./helpers/supabase-admin";

// Subscription (docs/billing.md): no access without a subscription, "Choisissez votre formule",
// the access by state, Paramètres › Abonnement, the reminders. The test accounts get a test
// subscription written into the database; the payment page of Stripe is tested only where the
// test key of Stripe is there (not on GitHub).

async function signIn(page: Page, user: { email: string; password: string }, landing = /\/app$/) {
  await page.goto("/login");
  await login(page, user.email, user.password);
  await expect(page).toHaveURL(landing);
}

async function signedInWith(page: Page, subscription: TestSubscription) {
  const user = await createUser({ subscription });
  await signIn(page, user, subscription === "none" || subscription === "ended" ? /\/app\/subscribe$/ : /\/app$/);
  return user;
}

test.describe("without a subscription", () => {
  test("the private space is closed: only « Choisissez votre formule »", async ({ page }) => {
    const user = await signedInWith(page, "none");
    await expect(page.getByRole("heading", { name: "Choisissez votre formule" })).toBeVisible();
    await expect(page.getByText("Nouveau compte · Étape 2 sur 2")).toBeVisible();
    // The yearly plan, chosen by default, and the schedule of the trial.
    await expect(page.getByRole("radio", { name: "Formule annuelle" })).toBeChecked();
    const schedule = page.getByRole("region", { name: "Échéancier" });
    await expect(schedule).toContainText("Aujourd'hui0 €");
    await expect(schedule).toContainText("fin de l'essai50 €");
    await page.getByRole("radio", { name: "Formule mensuelle" }).click();
    await expect(schedule).toContainText("fin de l'essai5 €");
    await expect(page.getByRole("button", { name: "Démarrer mon essai de 7 jours" })).toBeVisible();

    // The redirection happens while the page streams: only its start is waited for.
    for (const path of ["/app", "/app/boards", "/app/profile", "/app/drive", "/app/booking"]) {
      await page.goto(path, { waitUntil: "commit" });
      await expect(page).toHaveURL(/\/app\/subscribe$/, { timeout: 30_000 });
      await expect(page.getByRole("heading", { name: "Choisissez votre formule" })).toBeVisible();
    }
    // The Settings stay open to it, to delete the account.
    await page.getByRole("button", { name: "Paramètres du compte" }).click();
    const settings = page.getByRole("dialog", { name: "Paramètres" });
    await expect(settings.getByRole("button", { name: "Supprimer le compte" })).toBeVisible();
    await settings.getByRole("button", { name: "Abonnement" }).click();
    await expect(settings).toContainText("Aucun abonnement en cours");
    await settings.getByRole("button", { name: "Fermer" }).first().click();
    await expect(settings).toBeHidden();
    expect(await userExists(user.id)).toBe(true);
  });

  test("the plan of the address is chosen", async ({ page }) => {
    await signedInWith(page, "none");
    await page.goto("/app/subscribe?plan=monthly");
    await expect(page.getByRole("radio", { name: "Formule mensuelle" })).toBeChecked();
  });

  test("the plan chosen at the sign-up is kept with the account", async ({ page }) => {
    const user = await createUser({ subscription: "none", metadata: { plan: "monthly" } });
    await signIn(page, user, /\/app\/subscribe$/);
    await expect(page.getByRole("radio", { name: "Formule mensuelle" })).toBeChecked();
  });

  test("the public profile cannot go online, and the boards stay closed to writing", async () => {
    const user = await createUser({ subscription: "none" });
    await expect(setProfileOnline(user.id, true)).rejects.toMatchObject({ message: "subscription_required" });

    const client = await signedInClient(user);
    const { error } = await client.from("drive_items").insert({ kind: "folder", name: "Dossier" });
    expect(error?.code).toBe("42501");
  });

  test("an ended subscription: the space is paused, without a new trial", async ({ page }) => {
    await signedInWith(page, "ended");
    await expect(page.getByRole("heading", { name: "Votre espace est en pause" })).toBeVisible();
    await expect(page.getByText("Vos données sont gardées jusqu'au")).toBeVisible();
    await expect(page.getByRole("region", { name: "Échéancier" })).toContainText("Pas de nouvel essai : 50 € sont prélevés aujourd'hui");
    await expect(page.getByRole("button", { name: "Me réabonner" })).toBeVisible();
  });
});

test.describe("with a subscription", () => {
  test("Paramètres › Abonnement shows the trial, the card, and asks before cancelling", async ({ page }) => {
    await signedInWith(page, "trialing");
    const settings = await openSettings(page);
    await settings.getByRole("button", { name: "Abonnement" }).click();
    await expect(settings.getByRole("heading", { name: "Abonnement" })).toBeVisible();
    await expect(settings).toContainText("Annuelle · 50 € par an");
    await expect(settings).toContainText("Essai gratuit");
    await expect(settings).toContainText("Premier prélèvement");
    await expect(settings).toContainText("Visa •••• 4242");
    await expect(settings).toContainText("Aucune facture pour l'instant. La première arrivera le");
    // Nothing to save here: the footer only closes.
    await expect(settings.getByRole("button", { name: "Enregistrer" })).toBeHidden();
    // The first "Fermer" is the button of the footer (the cross has the same name).
    await expect(settings.getByRole("button", { name: "Fermer" }).first()).toBeVisible();

    // During the trial, the cancellation stops everything at once, without Stripe's page.
    await settings.getByRole("button", { name: "Résilier" }).click();
    const confirmation = page.getByRole("dialog", { name: "Résilier votre abonnement ?" });
    await expect(confirmation).toContainText("Votre essai s'arrête tout de suite et rien ne vous sera prélevé.");
    await expect(confirmation).toContainText("votre espace est mis en pause");
    await expect(confirmation).toContainText("vos données sont gardées 90 jours");
    await expect(confirmation.getByRole("button", { name: "Résilier maintenant" })).toBeVisible();
    await confirmation.getByRole("button", { name: "Garder mon abonnement" }).click();
    await expect(confirmation).toBeHidden();
  });

  test("the links of the emails open Paramètres › Abonnement", async ({ page }) => {
    await signedInWith(page, "active");
    await page.goto("/app?settings=billing");
    const settings = page.getByRole("dialog", { name: "Paramètres" });
    await expect(settings.getByRole("heading", { name: "Abonnement" })).toBeVisible();
    await expect(settings).toContainText("Actif");
    await expect(settings).toContainText("Prochain prélèvement");
    await expect(page).toHaveURL(/\/app$/);
  });

  test("a cancellation asked for: the end date, the reminder, and « Reprendre mon abonnement »", async ({ page }) => {
    await signedInWith(page, "canceling");
    await expect(page.getByRole("region", { name: "Rappels" })).toContainText("Abonnement résilié");
    const settings = await openSettings(page);
    await settings.getByRole("button", { name: "Abonnement" }).click();
    await expect(settings).toContainText("Résiliée");
    await expect(settings).toContainText("Accès ouvert jusqu'au");
    await expect(settings.getByRole("button", { name: "Reprendre mon abonnement" })).toBeVisible();
  });

  test("a refused payment: a banner, the reminder, and the access stays open", async ({ page }) => {
    await signedInWith(page, "past_due");
    await expect(page.getByRole("alert").filter({ hasText: "Paiement refusé." })).toContainText(
      "Mettez à jour votre carte pour garder votre accès.",
    );
    await expect(page.getByRole("button", { name: "Mettre à jour ma carte" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Rappels" })).toContainText("Carte à changer");
    await page.goto("/app/boards");
    await expect(page).toHaveURL(/\/app\/boards$/);
  });

  test("the deletion of the account tells that the subscription stops", async ({ page }) => {
    await signedInWith(page, "trialing");
    const settings = await openSettings(page);
    await settings.getByRole("button", { name: "Supprimer le compte" }).click();
    await expect(page.getByRole("dialog", { name: "Supprimer votre compte ?" })).toContainText(
      "Votre abonnement sera arrêté immédiatement, sans remboursement",
    );
  });
});

// The changes saved by the server after Stripe (sync_subscription, with the billing secret):
// only where the secret is there (.env.local), as the server would call it.
test.describe("the end of a subscription", () => {
  test.skip(!process.env.BILLING_SECRET, "Needs BILLING_SECRET (.env.local).");

  test("puts the public profile offline, cancels the bookings to come, and back online after", async () => {
    const user = await createUser({ subscription: "none" });
    const { handle } = await getProfile(user.id);
    const sync = (status: string, eventId: string | null = null) =>
      anonymous().rpc("sync_subscription", {
        owner: user.id,
        snapshot: {
          customerId: `cus_e2e_${user.id.slice(0, 8)}`,
          subscriptionId: `sub_e2e_${user.id.slice(0, 8)}`,
          livemode: false,
          plan: "monthly",
          status,
          createdAt: new Date().toISOString(),
          trialEnd: null,
          currentPeriodEnd: new Date(Date.now() + 30 * 86_400_000).toISOString(),
          cancelAt: null,
          endedAt: status === "canceled" ? new Date().toISOString() : null,
          card: null,
          unpaid: null,
        },
        event_id: eventId,
        event_type: eventId ? "customer.subscription.updated" : null,
        secret: process.env.BILLING_SECRET,
      });

    const started = await sync("active");
    expect(started.error).toBeNull();
    expect(started.data).toMatchObject({ status: "ok", emails: ["welcome"] });
    await setProfileOnline(user.id, true);
    await placeBooking(user.id, new Date(Date.now() + 3 * 86_400_000));

    const eventId = `evt_e2e_${user.id}`;
    const ended = await sync("canceled", eventId);
    expect(ended.data).toMatchObject({ status: "ok", emails: ["ended"] });
    expect((ended.data as { bookingEmailIds: string[] }).bookingEmailIds).toHaveLength(1);
    expect(await getProfile(user.id)).toMatchObject({ is_online: false });
    expect((await bookingsOf(user.id))[0]).toMatchObject({ status: "cancelled", cancelled_by: "owner" });
    expect((await emailsOf(user.id)).map((email) => email.template)).toContain("guest_cancelled");
    const { data: publicProfile } = await anonymous().rpc("get_public_profile", { profile_handle: handle });
    expect(publicProfile).toEqual([]);

    // The same event again: handled once.
    expect((await sync("canceled", eventId)).data).toEqual({ status: "duplicate" });

    const back = await sync("active");
    expect(back.data).toMatchObject({ status: "ok" });
    expect(await getProfile(user.id)).toMatchObject({ is_online: true });
    expect(await getSubscription(user.id)).toMatchObject({ status: "active", trial_used: true });
  });

  test("refuses a wrong secret", async () => {
    const user = await createUser({ subscription: "none" });
    const { error } = await anonymous().rpc("sync_subscription", {
      owner: user.id,
      snapshot: {},
      event_id: null,
      event_type: null,
      secret: "wrong",
    });
    expect(error?.message).toBe("forbidden");
    expect(await getSubscription(user.id)).toBeNull();
  });
});

// Stripe's payment page in its test mode, with its test card: only where the test key of Stripe is
// there (.env.local). Signed up, paid, back on the dashboard with the welcome notification.
test.describe("the payment page of Stripe", () => {
  test.skip(
    !process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") || !process.env.BILLING_SECRET,
    "Needs the test key of Stripe and BILLING_SECRET (.env.local).",
  );
  test.setTimeout(120_000);

  // Signed up without a subscription, then the trial of the monthly plan with the test card: back
  // on the dashboard with the welcome notification.
  async function startTrial(page: Page) {
    const user = await signedInWith(page, "none");
    await page.getByRole("radio", { name: "Formule mensuelle" }).click();
    await page.getByRole("button", { name: "Démarrer mon essai de 7 jours" }).click();
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 });
    await expect(page.getByText("7 jours gratuits").first()).toBeVisible({ timeout: 30_000 });

    // Several payment methods: the card is chosen first, with a click on its line (Stripe covers it
    // with a button that Playwright does not see as visible).
    const cardLine = page.getByText("Carte", { exact: true });
    await expect(cardLine.or(page.locator("#cardNumber")).first()).toBeVisible({ timeout: 30_000 });
    if (!(await page.locator("#cardNumber").isVisible())) await cardLine.click({ force: true });
    await page.locator("#cardNumber").fill("4242 4242 4242 4242");
    await page.locator("#cardExpiry").fill("12 / 34");
    await page.locator("#cardCvc").fill("123");
    await page.locator("#billingName").fill("Jeanne Martin");
    const country = page.locator("#billingCountry");
    if (await country.isVisible()) await country.selectOption("FR");
    await page.locator("#billingAddressLine1").fill("1 rue de la Paix");
    await page.locator("#billingPostalCode").fill("75002");
    await page.locator("#billingLocality").fill("Paris");
    await page.getByRole("button", { name: "Démarrer la période d'essai" }).click();

    await page.waitForURL(/localhost:3000\/app$/, { timeout: 60_000 });
    await expect(page.getByText("Bienvenue dans MyWork")).toBeVisible();
    expect(await getSubscription(user.id)).toMatchObject({ status: "trialing", plan: "monthly", card_last4: "4242" });
    return user;
  }

  test("a trial cancelled stops at once: the space is paused", async ({ page }) => {
    const user = await startTrial(page);
    const settings = await openSettings(page);
    await settings.getByRole("button", { name: "Abonnement" }).click();
    await settings.getByRole("button", { name: "Résilier" }).click();
    await page.getByRole("dialog", { name: "Résilier votre abonnement ?" }).getByRole("button", { name: "Résilier maintenant" }).click();

    await expect(page).toHaveURL(/\/app\/subscribe$/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Votre espace est en pause" })).toBeVisible();
    expect(await getSubscription(user.id)).toMatchObject({ status: "canceled" });
    await page.goto("/app/boards", { waitUntil: "commit" });
    await expect(page).toHaveURL(/\/app\/subscribe$/, { timeout: 30_000 });
  });

  test("the deletion of the account stops the subscription", async ({ page }) => {
    const user = await startTrial(page);
    const settings = await openSettings(page);
    await settings.getByRole("button", { name: "Supprimer le compte" }).click();
    await page.getByRole("dialog", { name: "Supprimer votre compte ?" }).getByRole("button", { name: "Supprimer définitivement" }).click();
    await expect(page).toHaveURL(/\/login\?notice=account-deleted$/);
    expect(await userExists(user.id)).toBe(false);
  });
});

// Deleted with the account (on delete cascade), like the rest.
test("a subscription belongs to its account", async () => {
  const user = await createUser();
  expect(await getSubscription(user.id)).toMatchObject({ status: "trialing" });
  await adminClient().auth.admin.deleteUser(user.id);
  expect(await getSubscription(user.id)).toBeNull();
});
