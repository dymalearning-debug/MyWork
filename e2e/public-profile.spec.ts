import { randomUUID } from "node:crypto";
import { readdirSync } from "node:fs";
import path from "node:path";

import { expect, type Page, test } from "@playwright/test";

import { login, openProfileSubmenu } from "./helpers/auth";
import { adminClient, createUser, getProfile, setProfileOnline, testEmail } from "./helpers/supabase-admin";

// Public profile skeleton (docs/public-profile.md): handle built by the database, access to the
// public pages, owner's preview of an offline profile, "Mon profil public" submenu.

// A few random characters, so that names built by the tests never meet a real account.
const random = () => randomUUID().slice(0, 6);

async function signIn(page: Page, user: { email: string; password: string }) {
  await page.goto("/login");
  await login(page, user.email, user.password);
  await expect(page).toHaveURL(/\/app$/);
}

test.describe("public handle, built by the database", () => {
  test("from the Google name, without accents nor punctuation", async () => {
    const r = random();
    const user = await createUser({ name: `Inès Œuvre-Çà ${r}` });
    expect((await getProfile(user.id)).handle).toBe(`ines-oeuvre-ca-${r}`);
  });

  test("-2 when the handle is already taken", async () => {
    const name = `Zoé ${random()}`;
    const first = await createUser({ name });
    const second = await createUser({ name });
    const handle = (await getProfile(first.id)).handle;
    expect((await getProfile(second.id)).handle).toBe(`${handle}-2`);
  });

  test("never a reserved word", async () => {
    const user = await createUser({ name: "Admin" });
    expect((await getProfile(user.id)).handle).toMatch(/^admin-\d+$/);
  });

  test("without a name: the start of the email address, what follows a + ignored", async () => {
    const email = testEmail().replace("@", "+alias@");
    const user = await createUser({ email });
    expect((await getProfile(user.id)).handle).toBe(email.split("+")[0]);
  });

  test("a name too short or without Latin letters: the email address", async () => {
    for (const name of ["Al", "李雷"]) {
      const user = await createUser({ name });
      expect((await getProfile(user.id)).handle, name).toBe(user.email.split("@")[0]);
    }
  });

  test("at most 30 characters, cut between two words", async () => {
    const r = random();
    const user = await createUser({ name: `${r} Marie-Charlotte Dupont-Aignan de la Tour` });
    expect((await getProfile(user.id)).handle).toBe(`${r}-marie-charlotte-dupont`);
  });

  test("every top-level address of the app is a reserved word", async () => {
    // Folders of src/app/ (route groups such as "(auth)" opened), files served at the root,
    // folders of public/.
    const metadataFiles = new Set(["icon", "apple-icon", "favicon", "opengraph-image", "twitter-image", "robots", "sitemap", "manifest"]);
    const addresses = new Set<string>();
    const visit = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory() && /^\(.+\)$/.test(entry.name)) visit(path.join(dir, entry.name));
        else if (entry.isDirectory() && !/^[_[]/.test(entry.name)) addresses.add(entry.name);
        else if (entry.isFile() && metadataFiles.has(entry.name.split(".")[0])) addresses.add(entry.name.split(".")[0]);
      }
    };
    visit(path.join(process.cwd(), "src", "app"));
    for (const entry of readdirSync(path.join(process.cwd(), "public"))) addresses.add(entry.split(".")[0]);

    const { data, error } = await adminClient().from("reserved_handles").select("handle");
    if (error) throw error;
    const reserved = new Set(data.map((row) => row.handle));
    expect([...addresses].filter((address) => !reserved.has(address))).toEqual([]);
    expect(addresses).toContain("login");
  });
});

test.describe("access to the public pages", () => {
  test("a visitor sees an online profile", async ({ page }) => {
    const user = await createUser();
    const { handle } = await getProfile(user.id);
    await setProfileOnline(user.id, true);

    const response = await page.goto(`/${handle}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: handle })).toBeVisible();
    // Without a name, the handle; an empty profile says so.
    await expect(page.getByText("Ce profil est encore vide.")).toBeVisible();
    await expect(page.getByText("Vous seul voyez cette page.")).toHaveCount(0);
    await expect(page).toHaveTitle(`${handle} · MyWork`);
  });

  // The status is 404 in development; in production, Next.js sends the page as it streams it,
  // with a 200 status and a "noindex" tag (docs/public-profile.md, "Technique"). Either way, both
  // answers are the same: nothing tells an existing account apart.
  test("an offline profile and an unknown handle give the same page not found", async ({ page }) => {
    const user = await createUser();
    const { handle } = await getProfile(user.id);

    const answers = [];
    for (const address of [`/${handle}`, `/e2e-unknown-${random()}`]) {
      const response = await page.goto(address);
      await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
      await expect(page.getByText("Cette adresse ne correspond à aucun profil public.")).toBeVisible();
      await expect(page).toHaveTitle("Page introuvable · MyWork");
      answers.push({ status: response?.status(), text: await page.locator("body").innerText() });
    }
    expect(answers[0]).toEqual(answers[1]);
  });

  test("the owner previews their offline profile, with the banner", async ({ page }) => {
    const user = await createUser();
    const { handle } = await getProfile(user.id);
    await signIn(page, user);

    const response = await page.goto(`/${handle}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("status").filter({ hasText: /Hors ligne/i })).toContainText("Vous seul voyez cette page.");
    await expect(page.getByRole("heading", { level: 1, name: handle })).toBeVisible();

    // Online: the strict view, the same for everyone, without the banner.
    await setProfileOnline(user.id, true);
    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: handle })).toBeVisible();
    await expect(page.getByText("Vous seul voyez cette page.")).toHaveCount(0);
  });

  test("an address with capitals leads to the lowercase one", async ({ page }) => {
    const user = await createUser();
    const { handle } = await getProfile(user.id);
    await setProfileOnline(user.id, true);
    await page.goto(`/${handle.toUpperCase()}`);
    await expect(page).toHaveURL(new RegExp(`/${handle}$`));
  });

  test("other unknown addresses get the same template, with a general sentence", async ({ page }) => {
    const user = await createUser();
    const { handle } = await getProfile(user.id);
    await setProfileOnline(user.id, true);

    const response = await page.goto(`/${handle}/not-a-module`);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
    await expect(page.getByText("Cette adresse ne correspond à aucune page.")).toBeVisible();
  });

  test("the private space stays closed to visitors", async ({ page }) => {
    await page.goto("/app/profile");
    await expect(page).toHaveURL(/\/login\?next=%2Fapp%2Fprofile$/);
    await page.goto("/app");
    await expect(page).toHaveURL(/\/login\?next=%2Fapp$/);
  });

  test("the former private profile address leads to /app/profile", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login\?next=%2Fapp%2Fprofile$/);
  });
});

test.describe("profile menu, Mon profil public", () => {
  test("the switch puts the profile online, then offline", async ({ page, browser }) => {
    const user = await createUser();
    const { handle } = await getProfile(user.id);
    await signIn(page, user);
    await openProfileSubmenu(page, "Mon profil public");

    const offline = page.getByRole("menuitemcheckbox", { name: "Profil hors ligne" });
    await expect(offline).toHaveAttribute("aria-checked", "false");
    await offline.click();
    const online = page.getByRole("menuitemcheckbox", { name: "Profil en ligne" });
    await expect(online).toHaveAttribute("aria-checked", "true");
    // The switch waits for the private space to be refreshed (its notification) before it takes
    // another click.
    await expect(page.getByText("Profil mis en ligne")).toBeVisible();
    await expect.poll(async () => (await getProfile(user.id)).is_online).toBe(true);

    // A visitor, in another browser, now sees the profile.
    const visitor = await browser.newContext();
    const visitorPage = await visitor.newPage();
    expect((await visitorPage.goto(`/${handle}`))?.status()).toBe(200);

    await online.click();
    await expect(page.getByRole("menuitemcheckbox", { name: "Profil hors ligne" })).toBeVisible();
    await expect.poll(async () => (await getProfile(user.id)).is_online).toBe(false);
    await visitorPage.goto(`/${handle}`);
    await expect(visitorPage.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
    await visitor.close();
  });

  // The menu is rebuilt each time it opens: it must show the state just saved, not the one
  // read when the page was loaded.
  test("the switch keeps its state when the menu is closed and opened again", async ({ page }) => {
    const user = await createUser();
    await signIn(page, user);
    // The dashboard, behind the menu, loads its tiles, then reloads them after each switch (its
    // reminder "Profil hors ligne"): the menu is used once the page is still.
    const offlineReminder = page.getByRole("region", { name: "Rappels", exact: true }).getByRole("link", { name: "Profil hors ligne" });
    await expect(offlineReminder).toBeVisible();
    // Escape closes the submenu, then the menu (both at once when the reloaded page took the focus
    // away from the submenu).
    const closeMenu = async () => {
      await page.keyboard.press("Escape");
      await expect(page.getByRole("menu")).not.toHaveCount(2);
      if ((await page.getByRole("menu").count()) > 0) await page.keyboard.press("Escape");
      await expect(page.getByRole("menu")).toHaveCount(0);
    };

    for (const name of ["Profil en ligne", "Profil hors ligne"]) {
      await openProfileSubmenu(page, "Mon profil public");
      await page.getByRole("menuitemcheckbox").click();
      await expect(page.getByRole("menuitemcheckbox", { name })).toBeVisible();
      await expect.poll(async () => (await getProfile(user.id)).is_online).toBe(name === "Profil en ligne");
      await expect(offlineReminder).toHaveCount(name === "Profil en ligne" ? 0 : 1);
      await closeMenu();

      await openProfileSubmenu(page, "Mon profil public");
      await expect(page.getByRole("menuitemcheckbox", { name })).toHaveAttribute(
        "aria-checked",
        String(name === "Profil en ligne"),
      );
      await closeMenu();
    }
  });

  test("copies the address of the public profile", async ({ page, context, baseURL }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const user = await createUser();
    const { handle } = await getProfile(user.id);
    await signIn(page, user);
    await openProfileSubmenu(page, "Mon profil public");

    await page.getByRole("menuitem", { name: "Copier l'adresse" }).click();
    await expect(page.getByRole("menuitem", { name: "Adresse copiée" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`${baseURL}/${handle}`);
  });

  test("opens the public profile in a new tab", async ({ page }) => {
    const user = await createUser();
    const { handle } = await getProfile(user.id);
    await signIn(page, user);
    await openProfileSubmenu(page, "Mon profil public");

    const [tab] = await Promise.all([
      page.waitForEvent("popup"),
      page.getByRole("menuitem", { name: /Ouvrir mon profil public/ }).click(),
    ]);
    await expect(tab).toHaveURL(new RegExp(`/${handle}$`));
    // Offline by default: the owner sees the preview.
    await expect(tab.getByText("Vous seul voyez cette page.")).toBeVisible();
  });
});
