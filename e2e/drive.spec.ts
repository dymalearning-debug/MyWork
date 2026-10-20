import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, type Locator, type Page, test } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { login, openSettings } from "./helpers/auth";
import { adminClient, createUser, getProfile, setProfileOnline, signedInClient, userExists } from "./helpers/supabase-admin";

// Drive module (docs/drive.md): folders and files of "Mes fichiers", the uploads, the views, the
// selection, the visibility and the "Ressources" tab of the public profile, the storage, and the
// rules of the database (each user only reaches their own items; visitors only public files).

// A PNG image of the repository (the logo square), and a tiny PDF.
const PNG = readFileSync("public/brand/mywork-mark-512.png");
const PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 300 200]/Parent 2 0 R>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF",
);

type User = { id: string; email: string; password: string };

async function signIn(page: Page, user: User) {
  await page.goto("/login");
  await login(page, user.email, user.password);
  await expect(page).toHaveURL(/\/app$/);
}

// ——— Items made through the database, as the page does ———

async function addFolder(client: SupabaseClient, name: string, parentId: string | null = null) {
  const { data, error } = await client
    .from("drive_items")
    .insert({ parent_id: parentId, kind: "folder", name, category: "folder" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

// A file: its row, its content in the storage, then the end of the upload.
async function addFile(
  client: SupabaseClient,
  userId: string,
  name: string,
  { parentId = null, body = Buffer.from("contenu"), type = "text/plain", category = "document" }: {
    parentId?: string | null;
    body?: Buffer;
    type?: string;
    category?: string;
  } = {},
) {
  const { data, error } = await client
    .from("drive_items")
    .insert({ parent_id: parentId, kind: "file", name, category, mime_type: type, size: body.length })
    .select("id")
    .single();
  if (error) throw error;
  const id = data.id as string;
  const { error: uploadError } = await client.storage.from("drive-files").upload(`${userId}/${id}`, body, { contentType: type });
  if (uploadError) throw uploadError;
  const { error: completeError } = await client.rpc("complete_drive_upload", { item_id: id });
  if (completeError) throw completeError;
  return id;
}

async function itemsOf(userId: string) {
  const { data, error } = await adminClient()
    .from("drive_items")
    .select("id, name, kind, parent_id, visibility, is_featured, is_uploaded")
    .eq("user_id", userId)
    .order("name");
  if (error) throw error;
  return data as { id: string; name: string; kind: string; parent_id: string | null; visibility: string; is_featured: boolean; is_uploaded: boolean }[];
}

async function storedFiles(userId: string) {
  const { data } = await adminClient().storage.from("drive-files").list(userId);
  return (data ?? []).map((file) => file.name);
}

const anonymous = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

// ——— The page ———

const row = (page: Page, name: string) => page.getByRole("row").filter({ has: page.getByText(name, { exact: true }) });
const names = (page: Page) => page.getByRole("row").locator("td:nth-child(2)").allInnerTexts();

async function openMenu(page: Page, name: string) {
  await page.getByRole("button", { name: `Actions pour ${name}` }).click();
  await expect(page.getByRole("menu")).toBeVisible();
}

// "Nouveau › Importer des fichiers", then the files chosen in the window of the computer.
async function upload(page: Page, files: { name: string; mimeType: string; buffer: Buffer }[] | string[]) {
  await page.getByRole("button", { name: "Nouveau" }).press("Enter");
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByRole("menuitem", { name: "Importer des fichiers" }).click(),
  ]);
  await chooser.setFiles(files);
}

// Files dragged from the computer onto an element.
async function dropFiles(page: Page, target: Locator, files: { name: string; type: string; text: string }[]) {
  const dataTransfer = await page.evaluateHandle((list) => {
    const transfer = new DataTransfer();
    for (const file of list) transfer.items.add(new File([file.text], file.name, { type: file.type }));
    return transfer;
  }, files);
  await target.dispatchEvent("dragenter", { dataTransfer });
  await target.dispatchEvent("dragover", { dataTransfer });
  await target.dispatchEvent("drop", { dataTransfer });
}

// Drag and drop with the mouse, in small steps, as a person would.
async function dragWithMouse(page: Page, source: Locator, target: Locator) {
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error("Nothing to drag");
  // In the empty part of the name cell.
  await page.mouse.move(from.x + 200, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + 212, from.y + from.height / 2, { steps: 4 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 20 });
  await page.waitForTimeout(200);
  await page.mouse.up();
}

test.describe("Drive", () => {
  // Long journeys, against the online database and storage.
  test.describe.configure({ timeout: 120_000 });

  test("creates, opens, renames, moves and deletes folders", async ({ page }) => {
    const user = await createUser();
    await signIn(page, user);

    await page.getByRole("link", { name: "Mes fichiers" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Mes fichiers" })).toBeVisible();
    await expect(page.getByText("Aucun fichier pour l’instant")).toBeVisible();

    // A folder, from "Nouveau".
    await page.getByRole("button", { name: "Nouveau" }).press("Enter");
    await page.getByRole("menuitem", { name: "Nouveau dossier" }).click();
    const nameField = page.getByRole("dialog", { name: "Nouveau dossier" }).getByLabel("Nom");
    await expect(nameField).toHaveValue("Dossier sans titre");
    await nameField.fill("Clients");
    await page.getByRole("button", { name: "Créer" }).click();
    await expect(page.getByText("Dossier créé")).toBeVisible();

    // A second one with the same name is refused.
    await page.getByRole("button", { name: "Nouveau" }).press("Enter");
    await page.getByRole("menuitem", { name: "Nouveau dossier" }).click();
    await page.getByRole("dialog", { name: "Nouveau dossier" }).getByLabel("Nom").fill("clients");
    await page.getByRole("button", { name: "Créer" }).click();
    await expect(page.getByText("Un élément porte déjà ce nom dans ce dossier.")).toBeVisible();

    // Inside, a subfolder; back up through the breadcrumb.
    await page.getByRole("link", { name: "Clients", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Clients" })).toBeVisible();
    await page.getByRole("button", { name: "Nouveau" }).press("Enter");
    await page.getByRole("menuitem", { name: "Nouveau dossier" }).click();
    await page.getByRole("dialog", { name: "Nouveau dossier" }).getByLabel("Nom").fill("Acme");
    await page.getByRole("button", { name: "Créer" }).click();
    await page.getByRole("link", { name: "Acme", exact: true }).click();
    const breadcrumb = page.getByRole("navigation", { name: "Fil d’Ariane" });
    await expect(breadcrumb).toContainText("Mes fichiers");
    await expect(breadcrumb).toContainText("Clients");
    await expect(page.getByRole("heading", { level: 1, name: "Acme" })).toBeVisible();
    await breadcrumb.getByRole("link", { name: "Clients" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Clients" })).toBeVisible();

    // A file inside "Acme", so that the deletion has something to announce.
    const client = await signedInClient(user);
    const acme = (await itemsOf(user.id)).find((item) => item.name === "Acme")!;
    await addFile(client, user.id, "Contrat.txt", { parentId: acme.id });

    // Renamed.
    await openMenu(page, "Acme");
    await page.getByRole("menuitem", { name: "Renommer" }).click();
    await page.getByRole("dialog", { name: "Renommer" }).getByLabel("Nom").fill("Acme SA");
    await page.getByRole("button", { name: "Renommer" }).click();
    await expect(row(page, "Acme SA")).toBeVisible();

    // Moved to "Mes fichiers", with the "Déplacer" window.
    await openMenu(page, "Acme SA");
    await page.getByRole("menuitem", { name: "Déplacer" }).click();
    const move = page.getByRole("dialog", { name: "Déplacer" });
    // A folder cannot go into itself.
    await expect(move.getByRole("option", { name: "Acme SA" })).toBeDisabled();
    await move.getByRole("option", { name: "Mes fichiers" }).click();
    await move.getByRole("button", { name: "Déplacer ici" }).click();
    // The folder left stays hidden in the page: only the shown one counts.
    await expect(page.getByText("Ce dossier est vide").filter({ visible: true })).toBeVisible();
    await expect.poll(async () => (await itemsOf(user.id)).find((item) => item.name === "Acme SA")?.parent_id).toBeNull();

    // Deleted with its content, after a confirmation that says what goes.
    await breadcrumb.getByRole("link", { name: "Mes fichiers" }).click();
    await openMenu(page, "Acme SA");
    await page.getByRole("menuitem", { name: "Supprimer" }).click();
    const confirmation = page.getByRole("dialog", { name: "Supprimer cet élément ?" });
    await expect(confirmation).toContainText("Le dossier « Acme SA », avec 1 fichier, sera supprimé définitivement.");
    await confirmation.getByRole("button", { name: "Supprimer définitivement" }).click();
    await expect(page.getByText("Élément supprimé")).toBeVisible();
    await expect.poll(async () => (await itemsOf(user.id)).map((item) => item.name)).toEqual(["Clients"]);
    await expect.poll(() => storedFiles(user.id)).toEqual([]);
  });

  test("uploads files, refuses the wrong ones, previews and downloads", async ({ page }) => {
    const user = await createUser();
    const client = await signedInClient(user);
    const folderId = await addFolder(client, "Projets");
    await addFile(client, user.id, "Devis.pdf", { body: PDF, type: "application/pdf" });
    // A file of 50 MB and one byte, on the disk (too large to be given from memory).
    const tooLarge = join(tmpdir(), `Rush-${user.id}.mov`);
    writeFileSync(tooLarge, Buffer.alloc(50 * 1024 * 1024 + 1));
    await signIn(page, user);
    await page.goto("/app/drive");

    // From "Importer des fichiers": a numbered duplicate, a program and a file too large refused.
    await upload(page, [
      { name: "Devis.pdf", mimeType: "application/pdf", buffer: PDF },
      { name: "Logo.png", mimeType: "image/png", buffer: PNG },
      { name: "setup.exe", mimeType: "application/octet-stream", buffer: Buffer.from("MZ") },
    ]);
    await upload(page, [tooLarge]);
    const panel = page.getByRole("region", { name: "Envois" });
    await expect(panel).toBeVisible();
    await expect(panel.getByText("Refusé : les programmes ne sont pas acceptés")).toBeVisible();
    await expect(panel.getByText("Refusé : 50 Mo au plus par fichier")).toBeVisible();
    await expect(panel.getByText("2 envois terminés")).toBeVisible({ timeout: 60_000 });
    await expect(row(page, "Devis (2).pdf")).toBeVisible();
    await expect(row(page, "Logo.png")).toBeVisible();
    // The image got its thumbnail.
    const logo = (await itemsOf(user.id)).find((item) => item.name === "Logo.png")!;
    expect(await storedFiles(user.id)).toContain(`${logo.id}-thumb.webp`);
    await panel.getByRole("button", { name: "Fermer le panneau des envois" }).click();

    // Dragged from the computer onto a folder of the list: into that folder.
    await dropFiles(page, row(page, "Projets"), [{ name: "Notes.txt", type: "text/plain", text: "Bonjour" }]);
    await expect(panel.getByText("1 envoi terminé")).toBeVisible({ timeout: 60_000 });
    await expect.poll(async () => (await itemsOf(user.id)).find((item) => item.name === "Notes.txt")?.parent_id).toBe(folderId);

    // Downloaded under its name, from its menu.
    await openMenu(page, "Devis (2).pdf");
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("menuitem", { name: "Télécharger" }).click()]);
    expect(download.suggestedFilename()).toBe("Devis (2).pdf");

    // Preview of an image, then of a PDF with the arrows.
    await page.getByRole("button", { name: "Logo.png", exact: true }).click();
    const preview = page.getByRole("dialog", { name: "Logo.png" });
    await expect(preview.getByRole("img", { name: "Logo.png" })).toBeVisible();
    await preview.getByRole("button", { name: "Fichier précédent" }).click();
    await expect(page.getByRole("dialog", { name: "Devis.pdf" }).locator("iframe")).toBeVisible();
  });

  test("lists, sorts, filters, searches and pages the items", async ({ page }) => {
    const user = await createUser();
    const client = await signedInClient(user);
    await addFolder(client, "Zèbre");
    await addFolder(client, "Archives");
    await addFile(client, user.id, "Été 2026.txt");
    await addFile(client, user.id, "budget.csv", { category: "spreadsheet", type: "text/csv" });
    await addFile(client, user.id, "Photo.png", { body: PNG, type: "image/png", category: "image" });
    await signIn(page, user);
    await page.goto("/app/drive");

    // By name, folders first; reversed by the title of the column.
    await expect.poll(() => names(page)).toEqual(["Archives", "Zèbre", "budget.csv", "Été 2026.txt", "Photo.png"]);
    await page.getByRole("button", { name: "Nom" }).click();
    await expect(page).toHaveURL(/sort=name-desc/);
    await expect.poll(() => names(page)).toEqual(["Zèbre", "Archives", "Photo.png", "Été 2026.txt", "budget.csv"]);
    // By date, the most recent first, then the oldest.
    await page.getByRole("button", { name: "Modifié" }).click();
    await expect.poll(() => names(page)).toEqual(["Archives", "Zèbre", "Photo.png", "budget.csv", "Été 2026.txt"]);
    await page.getByRole("button", { name: "Modifié" }).click();
    await expect.poll(() => names(page)).toEqual(["Zèbre", "Archives", "Été 2026.txt", "budget.csv", "Photo.png"]);

    // The filter "Type".
    await page.getByRole("button", { name: "Type" }).click();
    await page.getByRole("menuitem", { name: "Feuilles de calcul" }).click();
    await expect.poll(() => names(page)).toEqual(["budget.csv"]);
    await page.getByRole("button", { name: "Retirer le filtre" }).click();

    // The search, without capitals nor accents; nothing found offers to clear.
    await page.getByRole("searchbox", { name: "Rechercher dans ce dossier" }).fill("ETE");
    await expect.poll(() => names(page)).toEqual(["Été 2026.txt"]);
    await page.getByRole("searchbox", { name: "Rechercher dans ce dossier" }).fill("zebre");
    await expect.poll(() => names(page)).toEqual(["Zèbre"]);
    await page.getByRole("searchbox", { name: "Rechercher dans ce dossier" }).fill("introuvable");
    await expect(page.getByText("Aucun élément ne correspond")).toBeVisible();
    await page.getByRole("button", { name: "Effacer les filtres" }).click();
    await expect.poll(() => names(page)).toHaveLength(5);

    // The grid, remembered on this device.
    await page.getByRole("button", { name: "Grille" }).click();
    await expect(page.getByRole("region", { name: "Dossiers" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("region", { name: "Fichiers" })).toBeVisible();
    await page.getByRole("button", { name: "Liste" }).click();

    // More than 50 items: pages.
    const { error } = await client
      .from("drive_items")
      .insert(Array.from({ length: 50 }, (_, index) => ({ kind: "folder", category: "folder", name: `Dossier ${String(index).padStart(2, "0")}` })));
    if (error) throw error;
    await page.goto("/app/drive");
    await expect(page.getByText("1–50 sur 55")).toBeVisible();
    await page.getByRole("link", { name: "Page suivante" }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText("51–55 sur 55")).toBeVisible();
    await expect.poll(() => names(page)).toEqual(["Dossier 49", "Zèbre", "budget.csv", "Été 2026.txt", "Photo.png"]);
  });

  test("moves, publishes and deletes a selection", async ({ page }) => {
    const user = await createUser();
    const client = await signedInClient(user);
    const target = await addFolder(client, "Livrables");
    await addFolder(client, "Brouillons");
    await addFile(client, user.id, "A.txt");
    await addFile(client, user.id, "B.txt");
    await addFile(client, user.id, "C.txt");
    await signIn(page, user);
    await page.goto("/app/drive");

    // Two files and a folder made public: only the files change.
    for (const name of ["A.txt", "B.txt", "Brouillons"]) await page.getByRole("checkbox", { name: `Sélectionner ${name}` }).click();
    await expect(page.getByText("3 sélectionnés")).toBeVisible();
    await page.getByRole("button", { name: "Rendre public" }).click();
    await expect(page.getByText("2 fichiers rendus publics")).toBeVisible();
    await expect.poll(async () => (await itemsOf(user.id)).filter((item) => item.visibility === "public").map((item) => item.name)).toEqual(["A.txt", "B.txt"]);
    await expect(row(page, "A.txt").getByText("Public")).toBeVisible();

    // Moved together, by dragging one of them onto a folder.
    await page.getByRole("checkbox", { name: "Sélectionner A.txt" }).click();
    await page.getByRole("checkbox", { name: "Sélectionner B.txt" }).click();
    await dragWithMouse(page, row(page, "A.txt"), row(page, "Livrables"));
    await expect(page.getByText("2 éléments déplacés")).toBeVisible();
    await expect.poll(async () => (await itemsOf(user.id)).filter((item) => item.parent_id === target).map((item) => item.name)).toEqual(["A.txt", "B.txt"]);

    // Deleted together.
    await page.getByRole("checkbox", { name: "Sélectionner Brouillons" }).click();
    await page.getByRole("checkbox", { name: "Sélectionner C.txt" }).click();
    await page.getByRole("toolbar", { name: "Actions de la sélection" }).getByRole("button", { name: "Supprimer" }).click();
    const confirmation = page.getByRole("dialog", { name: "Supprimer 2 éléments ?" });
    await expect(confirmation).toContainText("1 fichier et 1 dossier seront supprimés définitivement");
    await confirmation.getByRole("button", { name: "Supprimer définitivement" }).click();
    await expect(page.getByText("2 éléments supprimés")).toBeVisible();
    await expect.poll(async () => (await itemsOf(user.id)).map((item) => item.name)).toEqual(["A.txt", "B.txt", "Livrables"]);
  });

  test("public files go to the Ressources tab, featured or not, for visitors only when online", async ({ page, browser }) => {
    const user = await createUser({ name: "Inès Robert" });
    const client = await signedInClient(user);
    await addFile(client, user.id, "Kit média.pdf", { body: PDF, type: "application/pdf" });
    await addFile(client, user.id, "Tarifs.pdf", { body: PDF, type: "application/pdf" });
    const { handle } = await getProfile(user.id);
    await setProfileOnline(user.id, true);
    await signIn(page, user);
    await page.goto("/app/drive");

    // No public file: no tab, and the address is not found.
    const visitor = await browser.newPage();
    await visitor.goto(`/${handle}`);
    await expect(visitor.getByRole("navigation", { name: "Onglets du profil" }).getByRole("link")).toHaveText(["Profil"]);
    // "Page introuvable", with the code 200 in production (docs/public-profile.md, "Code de réponse").
    await visitor.goto(`/${handle}/resources`);
    await expect(visitor.getByRole("heading", { name: "Page introuvable" })).toBeVisible();

    // Made public from its menu: listed, and downloaded without signing in, under its name.
    await openMenu(page, "Kit média.pdf");
    await page.getByRole("menuitem", { name: "Rendre public" }).click();
    await expect(page.getByText("Fichier rendu public")).toBeVisible();
    await openMenu(page, "Tarifs.pdf");
    await page.getByRole("menuitem", { name: "Rendre public" }).click();
    await expect(row(page, "Tarifs.pdf").getByText("Public")).toBeVisible();
    await visitor.goto(`/${handle}`);
    await visitor.getByRole("link", { name: "Ressources" }).click();
    await expect(visitor.getByRole("heading", { name: "Ressources" })).toBeVisible();
    await expect(visitor.getByText("2 fichiers")).toBeVisible();
    const [download] = await Promise.all([
      visitor.waitForEvent("download"),
      visitor.getByRole("link", { name: "Télécharger Kit média.pdf" }).click(),
    ]);
    // The name travels in the address, which the storage turns into the file name
    // (Content-Disposition: filename*=UTF-8''Kit%20m%C3%A9dia.pdf). Not suggestedFilename(): the
    // headless Chromium of the tests names any download with an accent "download".
    expect(new URL(download.url()).searchParams.get("download")).toBe("Kit média.pdf");

    // Featured: in large at the top, out of the list. Another one replaces it.
    await openMenu(page, "Kit média.pdf");
    await page.getByRole("menuitem", { name: "Mettre en avant" }).click();
    await expect(page.getByText("Fichier mis en avant")).toBeVisible();
    await visitor.reload();
    const featured = visitor.getByRole("region", { name: "Ressource mise en avant" });
    await expect(featured.getByRole("heading", { name: "Kit média.pdf" })).toBeVisible();
    await expect(visitor.getByRole("heading", { name: "Autres ressources" })).toBeVisible();
    await expect(visitor.getByText("1 fichier", { exact: true })).toBeVisible();
    await openMenu(page, "Tarifs.pdf");
    await page.getByRole("menuitem", { name: "Mettre en avant" }).click();
    await expect.poll(async () => (await itemsOf(user.id)).filter((item) => item.is_featured).map((item) => item.name)).toEqual(["Tarifs.pdf"]);
    await visitor.reload();
    await expect(featured.getByRole("heading", { name: "Tarifs.pdf" })).toBeVisible();

    // Made private: gone from the tab, loses its featuring; its download is not found.
    const tarifs = (await itemsOf(user.id)).find((item) => item.name === "Tarifs.pdf")!;
    await openMenu(page, "Tarifs.pdf");
    await page.getByRole("menuitem", { name: "Rendre privé" }).click();
    await expect(page.getByText("Fichier rendu privé")).toBeVisible();
    await expect.poll(async () => (await itemsOf(user.id)).find((item) => item.name === "Tarifs.pdf")?.is_featured).toBe(false);
    await visitor.reload();
    await expect(featured).toBeHidden();
    await expect(visitor.getByRole("heading", { name: "Ressources" })).toBeVisible();
    expect((await visitor.request.get(`/${handle}/resources/${tarifs.id}`, { maxRedirects: 0 })).status()).toBe(404);

    // Offline: neither the tab nor the downloads.
    const kit = (await itemsOf(user.id)).find((item) => item.name === "Kit média.pdf")!;
    await setProfileOnline(user.id, false);
    // "Page introuvable", with the code 200 in production (docs/public-profile.md, "Code de réponse").
    await visitor.goto(`/${handle}/resources`);
    await expect(visitor.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
    expect((await visitor.request.get(`/${handle}/resources/${kit.id}`, { maxRedirects: 0 })).status()).toBe(404);
    const { error: signError } = await anonymous().storage.from("drive-files").createSignedUrl(`${user.id}/${kit.id}`, 60);
    expect(signError).not.toBeNull();
    await visitor.close();
  });

  test("shows the storage used, and the database refuses a file beyond the capacity", async ({ page }) => {
    const user = await createUser();
    const client = await signedInClient(user);
    await signIn(page, user);
    await page.goto("/app/drive");
    await expect(page.getByText("0 octet sur 1 Go")).toBeVisible();

    await upload(page, [{ name: "Logo.png", mimeType: "image/png", buffer: PNG }]);
    await expect(page.getByText("1 envoi terminé")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/Ko sur 1 Go/)).toBeVisible();

    // Its detail, with the keyboard (in development, the Next.js indicator sits over it).
    // A real Tab: the tooltip opens on a focus from the keyboard.
    await page.getByRole("button", { name: "Détail du stockage" }).focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(page.getByText("Ce qui occupe l’espace")).toBeVisible();
    for (const label of ["Mes fichiers", "Photo et images du profil", "Images des tableaux"]) {
      await expect(page.getByText(label, { exact: true }).filter({ visible: true }).last()).toBeVisible();
    }

    // The database checks too: a file larger than the room left is refused.
    const { error } = await client
      .from("drive_items")
      .insert({ kind: "file", name: "Énorme.bin", category: "other", size: 50 * 1024 * 1024 })
      .select("id");
    expect(error).toBeNull();
    const many = Array.from({ length: 21 }, (_, index) => ({ kind: "file", name: `Gros ${index}.bin`, category: "other", size: 50 * 1024 * 1024 }));
    const { error: fullError } = await client.from("drive_items").insert(many);
    expect(fullError?.message).toContain("drive_storage_full");
  });

  test("each user only reaches their own items; visitors never get a private file", async () => {
    const owner = await createUser();
    const other = await createUser();
    const ownerClient = await signedInClient(owner);
    const otherClient = await signedInClient(other);
    const folderId = await addFolder(ownerClient, "Secret");
    const fileId = await addFile(ownerClient, owner.id, "Bilan.txt", { parentId: folderId });
    await setProfileOnline(owner.id, true);

    // Another user sees nothing, changes nothing, downloads nothing, uploads nothing there.
    expect((await otherClient.from("drive_items").select("id").eq("user_id", owner.id)).data).toEqual([]);
    await otherClient.from("drive_items").update({ name: "Piraté" }).eq("id", fileId);
    await otherClient.from("drive_items").delete().eq("id", fileId);
    expect((await itemsOf(owner.id)).map((item) => item.name)).toEqual(["Bilan.txt", "Secret"]);
    expect((await otherClient.storage.from("drive-files").createSignedUrl(`${owner.id}/${fileId}`, 60)).error).not.toBeNull();
    expect((await otherClient.storage.from("drive-files").download(`${owner.id}/${fileId}`)).error).not.toBeNull();
    expect((await otherClient.from("drive_items").insert({ parent_id: folderId, kind: "folder", name: "Intrus", category: "folder" })).error).not.toBeNull();
    // Nor a file without a row of theirs: the storage refuses it.
    expect((await otherClient.storage.from("drive-files").upload(`${other.id}/${crypto.randomUUID()}`, Buffer.from("x"))).error).not.toBeNull();

    // A visitor, even of an online profile, never gets a private file.
    const visitor = anonymous();
    expect((await visitor.from("drive_items").select("id")).data ?? []).toEqual([]);
    expect((await visitor.storage.from("drive-files").createSignedUrl(`${owner.id}/${fileId}`, 60)).error).not.toBeNull();
    const { handle } = await getProfile(owner.id);
    const { data } = await visitor.rpc("get_public_drive_resources", { profile_handle: handle, page_offset: 0, page_limit: 50 });
    expect(data).toEqual({ featured: null, total: 0, items: [] });
  });

  test("deleting the account removes the items and their files", async ({ page }) => {
    const user = await createUser();
    const client = await signedInClient(user);
    await addFile(client, user.id, "Facture.txt");
    expect(await storedFiles(user.id)).toHaveLength(1);
    await signIn(page, user);

    const dialog = await openSettings(page);
    await dialog.getByRole("button", { name: "Supprimer le compte" }).click();
    await page.getByRole("dialog", { name: "Supprimer votre compte ?" }).getByRole("button", { name: "Supprimer définitivement" }).click();
    await expect(page).toHaveURL(/\/login\?notice=account-deleted$/);
    expect(await userExists(user.id)).toBe(false);
    expect(await itemsOf(user.id)).toEqual([]);
    expect(await storedFiles(user.id)).toEqual([]);
  });
});
