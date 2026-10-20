import { expect, test } from "@playwright/test";

import { login } from "./helpers/auth";
import { createUser } from "./helpers/supabase-admin";

// Landing page at the address of the site (docs/landing.md, "Tests"). Header buttons sit under the
// Next.js indicator in development: they are used with the keyboard.

test.describe("landing page", () => {
  test("a visitor sees the landing page, with login and sign-up links", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Header links lead to the blocks of the page.
    const nav = page.getByRole("navigation", { name: "Sections de la page" });
    await nav.getByRole("link", { name: "Tarif" }).click();
    await expect(page).toHaveURL(/\/#tarif$/);
    await expect(page.getByRole("heading", { name: "Un seul abonnement, tout compris" })).toBeInViewport();

    await page.getByRole("banner").getByRole("link", { name: "Se connecter" }).press("Enter");
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/");
    await page.getByRole("banner").getByRole("link", { name: "Essayer 7 jours" }).press("Enter");
    await expect(page).toHaveURL(/\/signup$/);
  });

  test("the hero shows an example profile, whose tabs change the address", async ({ page }) => {
    await page.goto("/");
    const showcase = page.getByRole("figure");
    await expect(showcase.getByText("hellomywork.com/ines-robert", { exact: true })).toBeVisible();

    await showcase.getByRole("tab", { name: "Rendez-vous" }).click();
    await expect(showcase.getByText("hellomywork.com/ines-robert/booking")).toBeVisible();
    await expect(showcase.getByText("Visio · 30 min")).toBeVisible();

    await showcase.getByRole("tab", { name: "Ressources" }).click();
    await expect(showcase.getByText("hellomywork.com/ines-robert/resources")).toBeVisible();
    await expect(showcase.getByText("Tarifs-2026.pdf")).toBeVisible();
  });

  test("the features block presents the four modules", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Sections de la page" })
      .getByRole("link", { name: "Fonctionnalités" })
      .click();
    await expect(page).toHaveURL(/\/#fonctionnalites$/);
    const block = page.getByRole("region", { name: "Quatre outils, un seul espace" });
    await expect(block).toBeInViewport();
    await expect(block.getByRole("heading", { level: 3 })).toHaveText([
      "Un profil pro qui vous ressemble.",
      "Vos clients réservent, vous tenez l'appel.",
      "Vos missions, carte par carte.",
      "Vos documents, rangés et partagés.",
    ]);
  });

  test("the replaced tools block compares five tools with MyWork, and leads to sign-up", async ({ page }) => {
    await page.goto("/#outils-remplaces");
    const block = page.getByRole("region", { name: "Moins d'outils à gérer, plus de temps pour vos clients" });
    const table = block.getByRole("table");
    for (const logo of ["LinkedIn", "Calendly", "Zoom", "Trello", "Google Drive"]) {
      await expect(table.getByRole("img", { name: logo })).toBeVisible();
    }
    await expect(table.getByRole("row", { name: /Total/ })).toContainText("5 €");

    await block.getByRole("link", { name: "Essayer 7 jours" }).press("Enter");
    await expect(page).toHaveURL(/\/signup$/);
  });

  test("the pricing block offers the monthly and the yearly plan, both leading to sign-up", async ({ page }) => {
    await page.goto("/#tarif");
    const block = page.getByRole("region", { name: "Un seul abonnement, tout compris" });
    await expect(block.getByRole("article", { name: "Mensuel" })).toContainText("5 €/mois");
    const yearly = block.getByRole("article", { name: "Annuel" });
    await expect(yearly).toContainText("50 €/an");
    await expect(yearly).toContainText("2 mois offerts");
    await expect(block).toContainText("7 jours d'essai gratuit");

    await block.getByRole("link", { name: "Essayer 7 jours, formule mensuelle" }).press("Enter");
    await expect(page).toHaveURL(/\/signup$/);

    await page.goto("/#tarif");
    await page.getByRole("link", { name: "Essayer 7 jours, formule annuelle" }).press("Enter");
    await expect(page).toHaveURL(/\/signup$/);
  });

  test("the FAQ shows its questions, with the same ones in the structured data", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Sections de la page" }).getByRole("link", { name: "FAQ" }).click();
    await expect(page).toHaveURL(/\/#faq$/);
    const block = page.getByRole("region", { name: "Questions fréquentes" });
    await expect(block).toBeInViewport();
    const shown = await block.getByRole("heading", { level: 3 }).allTextContents();
    expect(shown).toHaveLength(10);

    // Every displayed question is in the FAQPage data, with its answer, and nothing else.
    const jsonLd = JSON.parse((await block.locator('script[type="application/ld+json"]').textContent()) ?? "{}");
    expect(jsonLd["@type"]).toBe("FAQPage");
    expect(jsonLd.mainEntity.map((entry: { name: string }) => entry.name)).toEqual(shown);
    for (const entry of jsonLd.mainEntity) {
      await expect(block.getByText(entry.acceptedAnswer.text, { exact: true })).toBeVisible();
    }
  });

  test("a signed-in visitor still sees the landing page, with a link to the app", async ({ page }) => {
    const user = await createUser();
    await page.goto("/login");
    await login(page, user.email, user.password);
    await expect(page).toHaveURL(/\/app$/);

    await page.goto("/");
    const banner = page.getByRole("banner");
    await banner.getByRole("link", { name: "Ouvrir mon espace" }).press("Enter");
    await expect(page).toHaveURL(/\/app$/);
  });

  test("the footer of the public pages leads to the landing page", async ({ page }) => {
    await page.goto("/no-such-profile-here");
    await page
      .getByRole("contentinfo")
      .getByRole("link", { name: /Créé avec/ })
      .click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
