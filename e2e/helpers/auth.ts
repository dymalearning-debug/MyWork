import { expect, type Page } from "@playwright/test";

// Login form and profile menu, shared by the end-to-end tests.

export async function login(page: Page, email: string, password: string, { remember = true } = {}) {
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  if (!remember) await page.getByRole("checkbox", { name: "Rester connecté" }).click();
  await page.getByRole("button", { name: "Se connecter" }).click();
}

export async function signOut(page: Page) {
  await page.getByRole("button", { name: "Menu du profil" }).click();
  await page.getByRole("menuitem", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL(/\/login$/);
}

// Opens the profile menu, then one of its submenus ("Mon profil public" or "Thème").
export async function openProfileSubmenu(page: Page, name: "Mon profil public" | "Thème") {
  await page.getByRole("button", { name: "Menu du profil" }).click();
  await page.getByRole("menuitem", { name }).click();
  await expect(page.getByRole("menu", { name })).toBeVisible();
}
