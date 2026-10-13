import { randomUUID } from "node:crypto";

import { expect, type Page, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

import { login, openProfileSubmenu, openSettings } from "./helpers/auth";
import { adminClient, createUser, getProfile, setProfileOnline, userExists } from "./helpers/supabase-admin";

// Settings, page "Profil" (docs/settings.md): first and last name, address of the public profile,
// deletion of the account, notifications.

// A few random characters, so that names built by the tests never meet a real account.
const random = () => randomUUID().slice(0, 6);

async function signIn(page: Page, user: { email: string; password: string }) {
  await page.goto("/login");
  await login(page, user.email, user.password);
  await expect(page).toHaveURL(/\/app$/);
}

test.describe("first and last name, built by the database", () => {
  test("from the Google name: the first word, then the rest", async () => {
    const r = random();
    const user = await createUser({ name: `Inès  Robert ${r}` });
    expect(await getProfile(user.id)).toMatchObject({ first_name: "Inès", last_name: `Robert ${r}` });
  });

  test("given_name and family_name when Google gives them", async () => {
    const r = random();
    const user = await createUser({
      name: `Jean Pierre Dupont ${r}`,
      metadata: { given_name: "Jean Pierre", family_name: `Dupont ${r}` },
    });
    expect(await getProfile(user.id)).toMatchObject({ first_name: "Jean Pierre", last_name: `Dupont ${r}` });
  });

  test("none for an account created with an email address", async () => {
    const user = await createUser();
    expect(await getProfile(user.id)).toMatchObject({ first_name: null, last_name: null });
  });
});

test.describe("Settings dialog", () => {
  test("opens from the profile menu, with the saved values", async ({ page }) => {
    const r = random();
    const user = await createUser({ name: `Inès Robert${r}` });
    const { handle } = await getProfile(user.id);
    await signIn(page, user);
    // At the bottom of the sidebar, the name instead of the email address.
    await expect(page.getByRole("button", { name: "Menu du profil" })).toContainText(`Inès Robert${r}`);

    const dialog = await openSettings(page);
    await expect(dialog.getByRole("button", { name: "Profil", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(dialog.getByLabel("Prénom")).toHaveValue("Inès");
    await expect(dialog.getByLabel("Nom", { exact: true })).toHaveValue(`Robert${r}`);
    const email = dialog.getByLabel("Adresse e-mail");
    await expect(email).toHaveValue(user.email);
    await expect(email).toBeDisabled();
    await expect(dialog.getByLabel("Adresse de mon profil public")).toHaveValue(handle);
    await expect(dialog.getByRole("button", { name: "Enregistrer" })).toBeDisabled();

    // The help next to the address of the public profile.
    await dialog.getByRole("button", { name: "À quoi sert cette adresse ?" }).hover();
    await expect(page.getByText("L'adresse de la page que vous partagez avec vos clients et recruteurs.")).toBeVisible();
  });

  test("saves the names: notification, sidebar, database", async ({ page }) => {
    const user = await createUser();
    await signIn(page, user);
    // Without a name, the sidebar shows the email address.
    await expect(page.getByRole("button", { name: "Menu du profil" })).toContainText(user.email);

    const dialog = await openSettings(page);
    await dialog.getByLabel("Prénom").fill("Jeanne");
    await dialog.getByLabel("Nom", { exact: true }).fill("  Martin ");
    await expect(dialog.getByText("Modifications non enregistrées")).toBeVisible();
    await dialog.getByRole("button", { name: "Enregistrer" }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText("Paramètres enregistrés")).toBeVisible();
    await expect(page.getByText("Prénom et nom modifiés.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Menu du profil" })).toContainText("Jeanne Martin");
    expect(await getProfile(user.id)).toMatchObject({ first_name: "Jeanne", last_name: "Martin" });

    // Emptied: no name any more, the sidebar shows the email address again.
    const again = await openSettings(page);
    await again.getByLabel("Prénom").fill("");
    await again.getByLabel("Nom", { exact: true }).fill("");
    await again.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByRole("button", { name: "Menu du profil" })).toContainText(user.email);
    expect(await getProfile(user.id)).toMatchObject({ first_name: null, last_name: null });
  });

  test("address of the public profile: taken, reserved, wrong format, then free", async ({ page }) => {
    const other = await createUser();
    const { handle: taken } = await getProfile(other.id);
    const user = await createUser();
    const { handle: before } = await getProfile(user.id);
    await setProfileOnline(user.id, true);
    await signIn(page, user);

    const dialog = await openSettings(page);
    const address = dialog.getByLabel("Adresse de mon profil public");
    const status = dialog.locator("#settings-handle-status");
    const save = dialog.getByRole("button", { name: "Enregistrer" });

    for (const handle of [taken, "admin"]) {
      await address.fill(handle);
      await expect(status).toHaveText("Cette adresse n'est pas disponible.");
      await expect(save).toBeDisabled();
    }

    await address.fill("ab");
    await expect(status).toContainText("3 à 30 caractères");
    await expect(save).toBeDisabled();

    // Capitals are turned into lowercase as the user types.
    const after = `E2E-${random()}`;
    await address.fill(after);
    await expect(address).toHaveValue(after.toLowerCase());
    await expect(status).toHaveText("Disponible");
    await expect(dialog.getByText(`/${before}, ne fonctionnera plus`)).toBeVisible();
    await save.click();

    await expect(page.getByText("Adresse du profil public modifiée.")).toBeVisible();
    await expect.poll(async () => (await getProfile(user.id)).handle).toBe(after.toLowerCase());

    // The profile now answers at its new address only: no redirection from the former one.
    await page.goto(`/${after.toLowerCase()}`);
    await expect(page.getByRole("heading", { name: "Page de profil" })).toBeVisible();
    await page.goto(`/${before}`);
    await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
  });

  test("closing with unsaved changes asks first; Annuler closes without saving", async ({ page }) => {
    const user = await createUser({ name: `Inès Robert${random()}` });
    await signIn(page, user);
    const question = page.getByRole("dialog", { name: "Enregistrer les modifications ?" });

    // The cross, then "Ignorer les modifications": nothing saved.
    let dialog = await openSettings(page);
    await dialog.getByLabel("Prénom").fill("Jeanne");
    await dialog.getByRole("button", { name: "Fermer" }).click();
    await expect(question).toBeVisible();
    await question.getByRole("button", { name: "Ignorer les modifications" }).click();
    await expect(question).toBeHidden();
    await expect(dialog).toBeHidden();
    expect((await getProfile(user.id)).first_name).toBe("Inès");

    // Opened again: the saved values. Escape, then "Enregistrer" in the question: saved.
    dialog = await openSettings(page);
    await expect(dialog.getByLabel("Prénom")).toHaveValue("Inès");
    await dialog.getByLabel("Prénom").fill("Jeanne");
    await page.keyboard.press("Escape");
    await expect(question).toBeVisible();
    await question.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Prénom modifié.")).toBeVisible();
    await expect.poll(async () => (await getProfile(user.id)).first_name).toBe("Jeanne");

    // "Annuler" closes at once, without the question and without saving.
    dialog = await openSettings(page);
    await dialog.getByLabel("Prénom").fill("Louise");
    await dialog.getByRole("button", { name: "Annuler" }).click();
    await expect(dialog).toBeHidden();
    await expect(question).toBeHidden();
    expect((await getProfile(user.id)).first_name).toBe("Jeanne");
  });

  test("deletes the account and all its data, after a confirmation", async ({ page }) => {
    const user = await createUser();
    await signIn(page, user);
    const confirmation = page.getByRole("dialog", { name: "Supprimer votre compte ?" });

    let dialog = await openSettings(page);
    await dialog.getByRole("button", { name: "Supprimer le compte" }).click();
    await expect(confirmation).toContainText("Toutes les données liées à votre compte seront supprimées");
    await confirmation.getByRole("button", { name: "Annuler" }).click();
    await expect(confirmation).toBeHidden();
    expect(await userExists(user.id)).toBe(true);

    dialog = page.getByRole("dialog", { name: "Paramètres" });
    await dialog.getByRole("button", { name: "Supprimer le compte" }).click();
    await confirmation.getByRole("button", { name: "Supprimer définitivement" }).click();

    await expect(page).toHaveURL(/\/login\?notice=account-deleted$/);
    await expect(page.getByText("Compte supprimé")).toBeVisible();
    await expect(page.getByText("Toutes les données liées à votre compte ont été supprimées.")).toBeVisible();
    expect(await userExists(user.id)).toBe(false);
    const { data: profiles } = await adminClient().from("profiles").select("id").eq("id", user.id);
    expect(profiles).toEqual([]);

    // Signed out: the private space is closed, and the account cannot sign in any more.
    await page.goto("/app/profile");
    await expect(page).toHaveURL(/\/login\?next=%2Fapp%2Fprofile$/);
    await login(page, user.email, user.password);
    await expect(page.getByText("E-mail ou mot de passe incorrect")).toBeVisible();
  });

  test("a notification confirms the online switch too", async ({ page }) => {
    const user = await createUser();
    await signIn(page, user);
    await openProfileSubmenu(page, "Mon profil public");
    await page.getByRole("menuitemcheckbox", { name: "Profil hors ligne" }).click();
    await expect(page.getByText("Profil mis en ligne")).toBeVisible();
  });
});

// The database enforces the rules itself, whatever calls it: a user cannot take a reserved word
// or another profile's address, nor change another profile.
test("the database refuses a reserved or taken address, and other profiles", async () => {
  const other = await createUser();
  const { handle: taken } = await getProfile(other.id);
  const user = await createUser();
  const { handle } = await getProfile(user.id);

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: user.password });
  if (signInError) throw signInError;

  for (const candidate of ["admin", taken]) {
    const { error } = await supabase.from("profiles").update({ handle: candidate }).eq("id", user.id);
    expect(error, candidate).not.toBeNull();
  }
  const { data: available } = await supabase.rpc("is_handle_available", { candidate: taken });
  expect(available).toBe(false);

  const { data: changed } = await supabase.from("profiles").update({ first_name: "Pirate" }).eq("id", other.id).select();
  expect(changed).toEqual([]);
  expect((await getProfile(other.id)).first_name).toBeNull();
  expect((await getProfile(user.id)).handle).toBe(handle);
});
