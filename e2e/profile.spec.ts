import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

import { expect, type Locator, type Page, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

import { login, openSettings } from "./helpers/auth";
import {
  adminClient,
  createUser,
  getProfile,
  getProfileContent,
  saveProfileContent,
  setProfileOnline,
  signedInClient,
} from "./helpers/supabase-admin";

// Profil module (docs/profile.md): "Mon profil" in the private space, the "Profil" tab of the
// public page, "Me contacter", the export of the CV, and the rules of the database.

const random = () => randomUUID().slice(0, 6);
const id = () => randomUUID();

// A PNG image of the repository (the logo square), for the photo and the project images.
const PNG = readFileSync("public/brand/mywork-mark-512.png");

async function signIn(page: Page, user: { email: string; password: string }) {
  await page.goto("/login");
  await login(page, user.email, user.password);
  await expect(page).toHaveURL(/\/app$/);
}

async function openMyProfile(page: Page) {
  await page.goto("/app/profile");
  await expect(page.getByRole("heading", { level: 1, name: "Mon profil" })).toBeVisible();
}

// Drag and drop with the keyboard: Space on the handle, the arrow up, Space again. A short pause
// between the keys lets the list measure itself, as a person would.
async function moveWithKeyboard(page: Page, handle: Locator, steps: number) {
  await handle.focus();
  await page.keyboard.press("Space");
  for (let step = 0; step < steps; step++) {
    await page.waitForTimeout(150);
    await page.keyboard.press("ArrowUp");
  }
  await page.waitForTimeout(150);
  await page.keyboard.press("Space");
}

async function saveMyProfile(page: Page) {
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Profil enregistré")).toBeVisible();
  await expect(page.getByText("Tout est enregistré")).toBeVisible();
}

const experience = (fields: Record<string, unknown>) => ({
  id: id(),
  title: "Designer",
  company: "",
  location: "",
  employmentType: null,
  workMode: null,
  start: { year: 2020, month: null },
  end: null,
  isCurrent: false,
  description: "",
  skills: [],
  ...fields,
});

test.describe("Mon profil, then the public page", () => {
  test("each section filled in Mon profil is on the public page; empty fields are not", async ({ page }) => {
    const r = random();
    const user = await createUser();
    const { handle } = await getProfile(user.id);
    await setProfileOnline(user.id, true);
    await signIn(page, user);
    await openMyProfile(page);

    // Header and contact details.
    await page.getByLabel("Prénom").fill("Inès");
    await page.getByLabel("Nom", { exact: true }).fill(`Robert${r}`);
    await page.getByLabel("Titre professionnel").fill("Product designer freelance");
    await page.getByLabel("Localisation").fill("Lyon, France");
    await page.getByLabel("Téléphone").fill("+33 6 12 34 56 78");
    await page.getByRole("button", { name: "Ajouter un lien" }).click();
    await page.getByLabel("Adresse du lien").fill("malt.fr/profile/ines");
    await expect(page.getByText("Modifications non enregistrées")).toBeVisible();

    // Skills first, so that one of them can be featured.
    await page.getByLabel("Nouvelle compétence").fill("Figma");
    await page.getByLabel("Nouvelle compétence").press("Enter");
    await page.getByLabel("Nouvelle compétence").fill("Design system");
    await page.getByLabel("Nouvelle compétence").press("Enter");
    await page.getByLabel("Présentation").fill("J'accompagne les équipes produit.\nDix ans d'expérience.");
    await page.locator("#section-about").getByRole("button", { name: "Figma" }).click();

    // Freelance offer.
    await page.getByLabel("TJM").fill("550");
    await page.getByRole("button", { name: "Ajouter une prestation" }).click();
    await page.getByLabel("Nom *").fill("Audit UX");

    // Experience: a current position.
    await page.getByRole("button", { name: "Ajouter une expérience" }).click();
    await page.getByLabel("Poste *").fill("Lead product designer");
    await page.getByLabel("Entreprise ou client").fill("Banque Rhône-Alpes");
    await page.getByLabel("Début : mois").selectOption("3");
    await page.getByLabel("Début : année").fill("2024");
    await page.getByText("Poste actuel").click();
    // A skill typed here joins the list.
    await page.getByLabel("Compétences utilisées").fill("Accessibilité");
    await page.getByLabel("Compétences utilisées").press("Enter");

    // Project, education, certification, language, recommendation.
    await page.getByRole("button", { name: "Ajouter un projet" }).click();
    await page.locator("#section-projects").getByLabel("Nom *").fill("Design system Rivage");
    await page.getByRole("button", { name: "Ajouter une formation" }).click();
    await page.getByLabel("Établissement *").fill("Strate École de design");
    await page.getByRole("button", { name: "Ajouter une certification" }).click();
    await page.locator("#section-certifications").getByLabel("Nom *").fill("RGAA");
    await page.getByRole("button", { name: "Ajouter une langue" }).click();
    await page.getByLabel("Langue", { exact: true }).fill("Anglais");
    await page.getByLabel("Niveau en Anglais").selectOption("fluent");
    await page.getByRole("button", { name: "Ajouter une recommandation" }).click();
    await page.getByLabel("Texte *").fill("Un travail remarquable.");
    await page.getByLabel("Auteur *").fill("Julien Marchand");

    await saveMyProfile(page);
    await expect(page.getByLabel("Adresse du lien")).toHaveValue("https://malt.fr/profile/ines");
    await expect(page.locator("#section-skills").getByLabel("Nom de la compétence")).toHaveCount(3);

    // Saved: still there after a reload.
    await page.reload();
    await expect(page.getByLabel("Titre professionnel")).toHaveValue("Product designer freelance");

    // The public page, as a visitor.
    const visitor = await page.context().browser()!.newPage();
    await visitor.goto(`/${handle}`);
    await expect(visitor).toHaveTitle(`Inès Robert${r} · MyWork`);
    await expect(visitor.getByRole("heading", { level: 1 })).toHaveText(`Inès Robert${r}`);
    await expect(visitor.getByText("Product designer freelance")).toBeVisible();
    await expect(visitor.getByText("Lyon, France")).toBeVisible();
    await expect(visitor.getByText("Dix ans d'expérience.")).toBeVisible();
    await expect(visitor.getByRole("heading", { name: "Offre freelance" })).toBeVisible();
    await expect(visitor.getByText("550 €")).toBeVisible();
    await expect(visitor.getByText("Audit UX")).toBeVisible();
    await expect(visitor.getByRole("heading", { name: "Lead product designer" })).toBeVisible();
    await expect(visitor.getByText(/mars 2024 – aujourd'hui/i)).toBeVisible();
    await expect(visitor.getByRole("button", { name: "Voir le projet Design system Rivage" })).toBeVisible();
    await expect(visitor.getByText("Strate École de design")).toBeVisible();
    await expect(visitor.getByText("RGAA")).toBeVisible();
    await expect(visitor.getByText("Courant")).toBeVisible();
    await expect(visitor.getByText("« Un travail remarquable. »")).toBeVisible();
    await expect(visitor.getByRole("link", { name: "Malt" })).toHaveAttribute("href", "https://malt.fr/profile/ines");
    await expect(visitor.locator("#profile-skills + ul")).toContainText("Accessibilité");
    // Empty fields and sections do not appear.
    await expect(visitor.getByText("Zone", { exact: true })).toHaveCount(0);
    await expect(visitor.getByText("Disponibilité", { exact: true })).toHaveCount(0);
    await visitor.close();
  });

  test("a mistake is pointed out, and nothing is saved until it is fixed", async ({ page }) => {
    const user = await createUser();
    await signIn(page, user);
    await openMyProfile(page);

    await page.getByLabel("Téléphone").fill("06 AB");
    await page.getByRole("button", { name: "Ajouter une expérience" }).click();
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Certains champs sont à corriger.")).toBeVisible();
    await expect(page.getByText(/6 à 20 caractères/)).toBeVisible();
    await expect(page.getByText("Champ obligatoire.")).toHaveCount(2);
    expect((await getProfileContent(user)).experiences).toEqual([]);
  });

  test("the freelance switch hides the offer from the public page and the CV, then brings it back", async ({ page }) => {
    const user = await createUser();
    const { handle } = await getProfile(user.id);
    await saveProfileContent(user, { dailyRate: 620, travelZone: "Lyon et environs" });
    await setProfileOnline(user.id, true);
    await signIn(page, user);
    await openMyProfile(page);

    const offer = page.locator("#section-freelance");
    await offer.getByRole("switch", { name: "Je propose mes services en freelance" }).click();
    await expect(offer.getByLabel("TJM")).toHaveCount(0);
    await saveMyProfile(page);

    await page.goto(`/${handle}`);
    await expect(page.getByText("620 €")).toHaveCount(0);
    await expect(page.getByText("Lyon et environs")).toHaveCount(0);
    await page.goto(`/${handle}/cv`);
    await expect(page.getByText("620 € HT / jour")).toHaveCount(0);

    // Switched on again: the offer is back, untouched.
    await openMyProfile(page);
    await page.locator("#section-freelance").getByRole("switch").click();
    await expect(page.locator("#section-freelance").getByLabel("TJM")).toHaveValue("620");
    await saveMyProfile(page);
    await page.goto(`/${handle}`);
    await expect(page.getByText("620 €")).toBeVisible();
    await page.goto(`/${handle}/cv`);
    await expect(page.getByText("620 € HT / jour")).toBeVisible();
  });

  test("Me contacter: the email and the phone are not in the page before the click", async ({ page }) => {
    const r = random();
    const user = await createUser();
    const { handle } = await getProfile(user.id);
    const contactEmail = `ines.${r}@exemple.fr`;
    await saveProfileContent(user, { contactEmail, phone: "+33 6 98 76 54 32" });
    await setProfileOnline(user.id, true);

    await page.goto(`/${handle}`);
    const html = await page.content();
    expect(html).not.toContain(contactEmail);
    expect(html).not.toContain("98 76 54 32");

    await page.getByRole("button", { name: "Me contacter" }).click();
    const panel = page.getByRole("dialog", { name: "Me contacter" });
    await expect(panel.getByText(contactEmail)).toBeVisible();
    await expect(panel.getByText("+33 6 98 76 54 32")).toBeVisible();
    await expect(panel.getByRole("link", { name: "Écrire" })).toHaveAttribute("href", `mailto:${contactEmail}`);
    await expect(panel.getByRole("link", { name: "Appeler" })).toHaveAttribute("href", "tel:+33698765432");
  });

  test("without contact details, there is no Me contacter button", async ({ page }) => {
    const user = await createUser();
    const { handle } = await getProfile(user.id);
    await saveProfileContent(user, { contactEmail: "" });
    await setProfileOnline(user.id, true);
    await page.goto(`/${handle}`);
    await expect(page.getByRole("button", { name: "Télécharger le CV" }).or(page.getByRole("link", { name: "Télécharger le CV" }))).toBeVisible();
    await expect(page.getByRole("button", { name: "Me contacter" })).toHaveCount(0);
  });
});

test.describe("order", () => {
  test("experiences by date: current first, positions at the same company grouped", async ({ page }) => {
    const user = await createUser();
    const { handle } = await getProfile(user.id);
    await saveProfileContent(user, {
      experiences: [
        experience({ title: "UX designer", company: "Agence Mesa", start: { year: 2016, month: null }, end: { year: 2018, month: null } }),
        experience({ title: "Lead product designer", company: "Banque", start: { year: 2024, month: 3 }, isCurrent: true }),
        experience({ title: "Lead designer", company: "Agence Mesa", start: { year: 2018, month: null }, end: { year: 2019, month: null } }),
      ],
    });
    await setProfileOnline(user.id, true);

    await page.goto(`/${handle}`);
    const timeline = page.locator("#profile-experiences + ol > li");
    await expect(timeline).toHaveCount(2);
    await expect(timeline.nth(0)).toContainText("Lead product designer");
    await expect(timeline.nth(1).getByRole("heading")).toHaveText("Agence Mesa");
    await expect(timeline.nth(1)).toContainText("2016 – 2019 · 4 ans");
    await expect(timeline.nth(1).locator("ol > li").nth(0)).toContainText("Lead designer");
    await expect(timeline.nth(1).locator("ol > li").nth(1)).toContainText("UX designer");
  });

  test("sections and lists move by hand", async ({ page }) => {
    const user = await createUser();
    const { handle } = await getProfile(user.id);
    await saveProfileContent(user, {
      about: "Bonjour.",
      educations: [{ id: id(), school: "Strate", degree: "", field: "", start: null, end: null, isCurrent: false, description: "" }],
      links: [
        { id: id(), url: "https://github.com/ines", label: "" },
        { id: id(), url: "https://malt.fr/ines", label: "" },
      ],
    });
    await setProfileOnline(user.id, true);
    await signIn(page, user);
    await openMyProfile(page);

    // Formation above À propos, with the keyboard (Space, arrows, Space).
    await page.getByRole("button", { name: "Ordre des sections" }).click();
    const order = page.locator("#section-order");
    await moveWithKeyboard(page, order.getByRole("button", { name: "Déplacer « Formation »" }), 4);
    await expect(order.getByRole("listitem").first()).toContainText("Formation");

    // Malt before GitHub.
    await moveWithKeyboard(page, page.getByRole("button", { name: "Déplacer « Malt »" }), 1);
    await saveMyProfile(page);
    await expect(page.getByText("Ordre des sections modifié")).toBeVisible();

    await page.goto(`/${handle}`);
    const headings = page.locator("main h2");
    await expect(headings.nth(0)).toHaveText("Formation");
    await expect(headings.nth(1)).toHaveText("À propos");
    const links = page.locator("#profile-links ~ a");
    await expect(links.nth(0)).toContainText("Malt");
    await expect(links.nth(1)).toContainText("GitHub");
  });
});

test.describe("photo", () => {
  test("sent, cropped, replaced, then removed (initials)", async ({ page }) => {
    const user = await createUser();
    const { handle } = await getProfile(user.id);
    await saveProfileContent(user, { firstName: "Inès", lastName: "Robert" });
    await setProfileOnline(user.id, true);
    await signIn(page, user);
    await openMyProfile(page);

    const header = page.locator("#section-header");
    await header.getByLabel("Fichier de la photo").setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: PNG });
    const crop = page.getByRole("dialog", { name: "Recadrer la photo" });
    await crop.getByRole("button", { name: "Valider" }).click();
    await expect(crop).toBeHidden();
    await saveMyProfile(page);
    await expect(page.getByText(/Photo ajoutée/)).toBeVisible();
    const first = (await getProfileContent(user)).photoUrl as string;
    expect(first).toContain(`/profile-images/${user.id}/`);

    // On the public page and in the sidebar.
    await expect(page.getByRole("button", { name: "Menu du profil" }).locator("img")).toHaveAttribute("src", first);
    await page.goto(`/${handle}`);
    await expect(page.locator("header img").first()).toHaveAttribute("src", first);

    // Replaced: the former image leaves the storage.
    await openMyProfile(page);
    await header.getByLabel("Fichier de la photo").setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: PNG });
    await crop.getByRole("button", { name: "Valider" }).click();
    await saveMyProfile(page);
    const second = (await getProfileContent(user)).photoUrl as string;
    expect(second).not.toBe(first);
    // The address may stay in a cache for a while: the file itself is checked.
    const files = async () => ((await adminClient().storage.from("profile-images").list(user.id)).data ?? []).map((file) => file.name);
    await expect.poll(files).toEqual([second.split("/").pop()]);

    // Removed: the initials.
    await header.getByRole("button", { name: "Retirer" }).click();
    await saveMyProfile(page);
    expect((await getProfileContent(user)).photoUrl).toBeNull();
    await page.goto(`/${handle}`);
    await expect(page.locator("header").getByText("IR", { exact: true })).toBeVisible();
  });

  test("a file in the wrong format is refused", async ({ page }) => {
    const user = await createUser();
    await signIn(page, user);
    await openMyProfile(page);
    await page.getByLabel("Fichier de la photo").setInputFiles({ name: "cv.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF") });
    await expect(page.getByText("Format non pris en charge : JPG, PNG ou WebP.")).toBeVisible();
  });
});

test.describe("first and last name, shared with the Settings", () => {
  test("changed in Mon profil, found in the Settings, and the other way round", async ({ page }) => {
    const r = random();
    const user = await createUser();
    await signIn(page, user);
    await openMyProfile(page);
    await page.getByLabel("Prénom").fill("Jeanne");
    await page.getByLabel("Nom", { exact: true }).fill(`Martin${r}`);
    await saveMyProfile(page);
    // The private space is refreshed: the sidebar shows the new name.
    await expect(page.getByRole("button", { name: "Menu du profil" })).toContainText(`Jeanne Martin${r}`);

    let dialog = await openSettings(page);
    await expect(dialog.getByLabel("Prénom")).toHaveValue("Jeanne");
    await dialog.getByLabel("Nom", { exact: true }).fill(`Durand${r}`);
    await dialog.getByRole("button", { name: "Enregistrer" }).click();
    await expect(dialog).toBeHidden();

    await openMyProfile(page);
    await expect(page.getByLabel("Nom", { exact: true })).toHaveValue(`Durand${r}`);
    dialog = await openSettings(page);
    await expect(dialog.getByLabel("Nom", { exact: true })).toHaveValue(`Durand${r}`);
  });
});

test.describe("leaving with changes not saved", () => {
  test("asks first; Ignorer les modifications leaves without saving", async ({ page }) => {
    const user = await createUser();
    await signIn(page, user);
    await openMyProfile(page);
    await page.getByLabel("Localisation").fill("Nantes");
    await page.getByRole("link", { name: "Tableau de bord", exact: true }).click();

    const question = page.getByRole("dialog", { name: "Enregistrer les modifications ?" });
    await expect(question).toBeVisible();
    await expect(page).toHaveURL(/\/app\/profile$/);
    await question.getByRole("button", { name: "Ignorer les modifications" }).click();
    await expect(page).toHaveURL(/\/app$/);
    expect((await getProfileContent(user)).location).toBe("");
  });

  test("Enregistrer saves, then leaves", async ({ page }) => {
    const user = await createUser();
    await signIn(page, user);
    await openMyProfile(page);
    await page.getByLabel("Localisation").fill("Nantes");
    await page.getByRole("link", { name: "Tableau de bord", exact: true }).click();
    await page.getByRole("dialog", { name: "Enregistrer les modifications ?" }).getByRole("button", { name: "Enregistrer" }).click();
    await expect(page).toHaveURL(/\/app$/);
    expect((await getProfileContent(user)).location).toBe("Nantes");
  });

  test("removing an item asks for a confirmation", async ({ page }) => {
    const user = await createUser();
    await saveProfileContent(user, { languages: [{ id: id(), name: "Anglais", level: null }] });
    await signIn(page, user);
    await openMyProfile(page);
    await page.getByRole("button", { name: "Supprimer la langue Anglais" }).click();
    const confirmation = page.getByRole("dialog", { name: "Supprimer cette langue ?" });
    await confirmation.getByRole("button", { name: "Annuler" }).click();
    await expect(page.getByLabel("Langue", { exact: true })).toHaveValue("Anglais");
    await page.getByRole("button", { name: "Supprimer la langue Anglais" }).click();
    await confirmation.getByRole("button", { name: "Supprimer" }).click();
    await expect(page.getByLabel("Langue", { exact: true })).toHaveCount(0);
    await saveMyProfile(page);
    await expect(page.getByText("Langue supprimée.")).toBeVisible();
  });
});

test.describe("export of the CV", () => {
  test("the PDF downloads from the public page, the PNG from Mon profil", async ({ page }) => {
    const r = random();
    const user = await createUser();
    const { handle } = await getProfile(user.id);
    await saveProfileContent(user, { firstName: "Inès", lastName: `Robert${r}`, headline: "Product designer" });
    await setProfileOnline(user.id, true);

    // The CV page holds the name, which the PDF prints.
    await page.goto(`/${handle}/cv`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(`Inès Robert${r}`);
    await expect(page.getByText(`/${handle}`)).toBeVisible();

    await page.goto(`/${handle}`);
    const [pdf] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "Télécharger le CV" }).click()]);
    expect(pdf.suggestedFilename()).toBe(`cv-${handle}.pdf`);
    const pdfBytes = await streamBytes(await pdf.createReadStream());
    expect(pdfBytes.subarray(0, 5).toString()).toBe("%PDF-");

    await signIn(page, user);
    await openMyProfile(page);
    const [png] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "Télécharger en PNG" }).click()]);
    expect(png.suggestedFilename()).toBe(`cv-${handle}.png`);
    const pngBytes = await streamBytes(await png.createReadStream());
    expect(pngBytes.subarray(1, 4).toString()).toBe("PNG");
  });
});

async function streamBytes(stream: NodeJS.ReadableStream) {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk as Buffer));
  return Buffer.concat(chunks);
}

test.describe("security, in the database", () => {
  test("a visitor reads nothing of an offline profile, neither the content nor the contact details", async () => {
    const user = await createUser();
    const { handle } = await getProfile(user.id);
    await saveProfileContent(user, { about: "Secret", phone: "0612345678" });

    const anonymous = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false },
    });
    expect((await anonymous.rpc("get_public_profile_content", { profile_handle: handle })).data).toBeNull();
    expect((await anonymous.rpc("get_public_profile_contact", { profile_handle: handle })).data).toEqual([]);

    // Online: the content, but never the contact details nor the sign-in address in it.
    await setProfileOnline(user.id, true);
    const { data } = await anonymous.rpc("get_public_profile_content", { profile_handle: handle });
    expect(data).toMatchObject({ about: "Secret", phone: "", contactEmail: "", hasContact: true });
    expect(JSON.stringify(data)).not.toContain(user.email);
    // Nor any table read directly.
    expect((await anonymous.from("profile_experiences").select("*")).error).not.toBeNull();
  });

  test("a user cannot change another user's profile", async () => {
    const owner = await createUser();
    const other = await createUser();
    await saveProfileContent(owner, { about: "Mon texte" });
    const client = await signedInClient(other);

    // The save only ever writes the signed-in user's own profile.
    await saveProfileContent(other, { about: "Piraté" });
    expect((await getProfileContent(owner)).about).toBe("Mon texte");
    // No direct write, nor a write in another user's folder of images.
    expect((await client.from("profile_links").insert({ user_id: owner.id, position: 1, url: "https://a.fr" })).error).not.toBeNull();
    const upload = await client.storage
      .from("profile-images")
      .upload(`${owner.id}/${random()}.png`, PNG, { contentType: "image/png" });
    expect(upload.error).not.toBeNull();
  });

  test("the limits of the lists are kept by the database too", async () => {
    const user = await createUser();
    const links = Array.from({ length: 11 }, () => ({ id: id(), url: "https://exemple.fr", label: "" }));
    await expect(saveProfileContent(user, { links })).rejects.toMatchObject({ message: "too_many_items" });
  });

  test("deleting the account removes its images too", async ({ page }) => {
    const user = await createUser();
    const client = await signedInClient(user);
    const path = `${user.id}/${random()}.png`;
    expect((await client.storage.from("profile-images").upload(path, PNG, { contentType: "image/png" })).error).toBeNull();

    await signIn(page, user);
    const dialog = await openSettings(page);
    await dialog.getByRole("button", { name: "Supprimer le compte" }).click();
    await page.getByRole("dialog", { name: "Supprimer votre compte ?" }).getByRole("button", { name: "Supprimer définitivement" }).click();
    await expect(page).toHaveURL(/\/login/);

    const { data } = await adminClient().storage.from("profile-images").list(user.id);
    expect(data ?? []).toEqual([]);
  });
});
