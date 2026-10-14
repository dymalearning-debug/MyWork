import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

import { expect, type Locator, type Page, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

import { login, openSettings } from "./helpers/auth";
import { adminClient, createUser, signedInClient } from "./helpers/supabase-admin";

// Tableaux module (docs/boards.md): boards, lists, cards and the window of a card, the limits, and
// the rules of the database (each user only reaches their own boards and images).

// A PNG image of the repository (the logo square), for the images of the cards.
const PNG = readFileSync("public/brand/mywork-mark-512.png");

type User = { id: string; email: string; password: string };

async function signIn(page: Page, user: User) {
  await page.goto("/login");
  await login(page, user.email, user.password);
  await expect(page).toHaveURL(/\/app$/);
}

// A board made through the database, as "Nouveau tableau" does: with its three starting lists.
async function createBoard(user: User, name: string) {
  const client = await signedInClient(user);
  const { data, error } = await client.rpc("create_board", { board_name: name });
  if (error) throw error;
  return data as string;
}

async function listsOf(boardId: string) {
  const { data, error } = await adminClient()
    .from("board_lists")
    .select("id, name, position")
    .eq("board_id", boardId)
    .order("position");
  if (error) throw error;
  return data as { id: string; name: string; position: number }[];
}

async function cardTitles(listId: string) {
  const { data, error } = await adminClient().from("board_cards").select("title").eq("list_id", listId).order("position");
  if (error) throw error;
  return data.map((card) => card.title as string);
}

async function addCards(user: User, listId: string, titles: string[]) {
  const client = await signedInClient(user);
  const { data, error } = await client
    .from("board_cards")
    .insert(titles.map((title, index) => ({ list_id: listId, title, position: (index + 1) * 1024 })))
    .select("id");
  if (error) throw error;
  return data.map((card) => card.id as string);
}

const list = (page: Page, name: string) => page.getByRole("region", { name, exact: true });
const cardsOf = (scope: Locator) => scope.getByRole("list", { name: /^Cartes de/ }).getByRole("listitem");
const tile = (scope: Locator | Page, title: string) => scope.getByRole("button", { name: new RegExp(`^${title}`) });

// The list of the boards, on the name of the open board.
async function openBoardSwitcher(page: Page) {
  await page.getByRole("heading", { level: 1 }).getByRole("button").click();
  await expect(page.getByRole("menu")).toBeVisible();
}

// The settings of the board, opened with the keyboard (in development, the Next.js indicator sits over
// the button).
async function openBoardSettings(page: Page) {
  await page.getByRole("button", { name: "Réglages du tableau" }).press("Enter");
  await expect(page.getByRole("menu")).toBeVisible();
}

// Drag and drop with the keyboard: Space, the arrows, Space again. A short pause between the keys
// lets the board measure itself, as a person would.
async function moveWithKeyboard(page: Page, handle: Locator, key: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight", steps: number) {
  await handle.focus();
  await page.keyboard.press("Space");
  for (let step = 0; step < steps; step++) {
    await page.waitForTimeout(200);
    await page.keyboard.press(key);
  }
  await page.waitForTimeout(200);
  await page.keyboard.press("Space");
}

// Drag and drop with the mouse, in small steps, as a person would.
async function dragWithMouse(page: Page, source: Locator, target: Locator) {
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error("Nothing to drag");
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 12, from.y + from.height / 2, { steps: 4 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 20 });
  await page.waitForTimeout(200);
  await page.mouse.up();
}

test.describe("Boards", () => {
  // Long journeys, against the online database.
  test.describe.configure({ timeout: 90_000 });

  test("creates the first board, renames it, adds a second one, switches and deletes", async ({ page }) => {
    const user = await createUser();
    await signIn(page, user);

    await page.getByRole("link", { name: "Mes tableaux" }).click();
    await expect(page.getByRole("heading", { name: "Aucun tableau" })).toBeVisible();
    await page.getByRole("textbox", { name: "Nom du tableau" }).fill("Refonte Ondine");
    await page.getByRole("button", { name: "Créer mon premier tableau" }).click();

    await expect(page.getByRole("heading", { level: 1, name: "Refonte Ondine" })).toBeVisible();
    for (const name of ["À faire", "En cours", "Terminé"]) await expect(list(page, name)).toBeVisible();
    const firstUrl = page.url();
    const firstId = firstUrl.split("/").pop() as string;
    expect((await listsOf(firstId)).map((l) => l.name)).toEqual(["À faire", "En cours", "Terminé"]);

    // Renamed from its settings.
    await openBoardSettings(page);
    await page.getByRole("menuitem", { name: "Renommer" }).click();
    await page.getByRole("textbox", { name: "Nom du tableau" }).fill("Refonte Ondine v2");
    await page.getByRole("textbox", { name: "Nom du tableau" }).press("Enter");
    await expect(page.getByRole("heading", { level: 1, name: "Refonte Ondine v2" })).toBeVisible();
    await expect
      .poll(async () => (await adminClient().from("boards").select("name").eq("id", firstId).single()).data?.name)
      .toBe("Refonte Ondine v2");

    // A second board, from the list of the boards on the name of the board.
    await openBoardSwitcher(page);
    await expect(page.getByRole("menuitemradio", { name: /^Refonte Ondine v2/ })).toHaveAttribute("aria-checked", "true");
    await page.getByRole("menuitem", { name: "Nouveau tableau" }).click();
    const creation = page.getByRole("dialog", { name: "Nouveau tableau" });
    await creation.getByRole("textbox", { name: "Nom du tableau" }).fill("Prospection");
    await creation.getByRole("textbox", { name: "Nom du tableau" }).press("Enter");
    await expect(creation).toBeHidden();
    await expect(page.getByRole("heading", { level: 1, name: "Prospection" })).toBeVisible();

    // From one to the other.
    await openBoardSwitcher(page);
    await expect(page.getByRole("menuitemradio")).toHaveCount(2);
    await page.getByRole("menuitemradio", { name: /^Refonte Ondine v2/ }).click();
    await expect(page).toHaveURL(firstUrl);
    await expect(page.getByRole("heading", { level: 1, name: "Refonte Ondine v2" })).toBeVisible();

    // "Mes tableaux" reopens the last board seen.
    await openBoardSwitcher(page);
    await page.getByRole("menuitemradio", { name: /^Prospection/ }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Prospection" })).toBeVisible();
    await page.getByRole("link", { name: "Tableau de bord", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Tableau de bord" })).toBeVisible();
    await page.getByRole("link", { name: "Mes tableaux" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Prospection" })).toBeVisible();

    // Deleted after a confirmation, with everything in it.
    await openBoardSettings(page);
    await page.getByRole("menuitem", { name: "Supprimer" }).click();
    const confirmation = page.getByRole("dialog", { name: "Supprimer ce tableau ?" });
    await confirmation.getByRole("button", { name: "Supprimer le tableau" }).click();
    await expect(page.getByText("Tableau supprimé")).toBeVisible();
    await expect(page).toHaveURL(firstUrl);
    await openBoardSwitcher(page);
    await expect(page.getByRole("menuitemradio")).toHaveCount(1);
    await page.keyboard.press("Escape");
    const { data: boards } = await adminClient().from("boards").select("name").eq("user_id", user.id);
    expect(boards).toEqual([{ name: "Refonte Ondine v2" }]);
  });

  test("adds cards one after the other, moves them, and renames, moves and deletes lists", async ({ page }) => {
    const user = await createUser();
    const boardId = await createBoard(user, "Atelier");
    const [todoId, doingId] = (await listsOf(boardId)).map((l) => l.id);
    await signIn(page, user);
    await page.goto(`/app/boards/${boardId}`);

    // Quick add: Enter creates the card and opens an empty field for the next one.
    const todo = list(page, "À faire");
    await todo.getByRole("button", { name: "Ajouter une carte" }).click();
    const composer = page.getByLabel("Titre de la nouvelle carte");
    for (const title of ["Une", "Deux", "Trois"]) {
      await composer.fill(title);
      await composer.press("Enter");
      await expect(composer).toHaveValue("");
    }
    await composer.press("Escape");
    await expect(composer).toBeHidden();
    await expect(cardsOf(todo)).toHaveText(["Une", "Deux", "Trois"]);
    await expect.poll(() => cardTitles(todoId)).toEqual(["Une", "Deux", "Trois"]);

    // Within the list, with the keyboard.
    await moveWithKeyboard(page, tile(todo, "Trois"), "ArrowUp", 2);
    await expect(cardsOf(todo)).toHaveText(["Trois", "Une", "Deux"]);
    await expect.poll(() => cardTitles(todoId)).toEqual(["Trois", "Une", "Deux"]);

    // To another list, with the mouse.
    await dragWithMouse(page, tile(todo, "Une"), list(page, "En cours"));
    await expect(cardsOf(list(page, "En cours"))).toHaveText(["Une"]);
    await expect(cardsOf(todo)).toHaveText(["Trois", "Deux"]);
    await expect.poll(() => cardTitles(doingId)).toEqual(["Une"]);
    await expect.poll(() => cardTitles(todoId)).toEqual(["Trois", "Deux"]);

    // A list renamed with a click on its name.
    await todo.getByRole("heading", { name: "À faire" }).click();
    await page.getByLabel("Nom de la liste").fill("Backlog");
    await page.getByLabel("Nom de la liste").press("Enter");
    await expect(list(page, "Backlog")).toBeVisible();
    await expect.poll(async () => (await listsOf(boardId))[0].name).toBe("Backlog");

    // A list moved with the keyboard.
    await moveWithKeyboard(page, page.getByRole("button", { name: "Déplacer la liste « Terminé »" }), "ArrowLeft", 2);
    await expect.poll(async () => (await listsOf(boardId)).map((l) => l.name)).toEqual(["Terminé", "Backlog", "En cours"]);

    // A list deleted after a confirmation that tells how many cards go with it.
    await page.getByRole("button", { name: "Actions de la liste « En cours »" }).click();
    await page.getByRole("menuitem", { name: "Supprimer" }).click();
    const confirmation = page.getByRole("dialog", { name: "Supprimer cette liste ?" });
    await expect(confirmation).toContainText("avec sa carte");
    await confirmation.getByRole("button", { name: "Supprimer la liste" }).click();
    await expect(list(page, "En cours")).toBeHidden();
    await expect.poll(async () => (await listsOf(boardId)).map((l) => l.name)).toEqual(["Terminé", "Backlog"]);
    expect(await cardTitles(doingId)).toEqual([]);

    // A new list, after the last one.
    const adder = page.getByRole("button", { name: /Ajouter une liste/ });
    for (const name of ["En revue", "Quatre", "Cinq"]) {
      await adder.click();
      await page.getByLabel("Nom de la nouvelle liste").fill(name);
      await page.getByLabel("Nom de la nouvelle liste").press("Enter");
      await expect(list(page, name)).toBeVisible();
    }
    await expect
      .poll(async () => (await listsOf(boardId)).map((l) => l.name))
      .toEqual(["Terminé", "Backlog", "En revue", "Quatre", "Cinq"]);
    // The fifth list: "Ajouter une liste" goes away, and a notification says why.
    await expect(page.getByText("5 listes au plus")).toBeVisible();
    await expect(page.getByText("Supprimez une liste pour en ajouter une autre.")).toBeVisible();
    await expect(adder).toHaveCount(0);
  });

  test("limits: 10 boards, 5 lists, 20 cards, 20 checklist items and 5 images, in the interface and in the database", async ({
    page,
  }) => {
    const user = await createUser();
    const client = await signedInClient(user);
    const boardIds: string[] = [];
    for (let i = 1; i <= 10; i++) boardIds.push(await createBoard(user, `Tableau ${i}`));
    const eleventh = await client.rpc("create_board", { board_name: "Tableau 11" });
    expect(eleventh.error?.message).toContain("board_limit_reached");

    const boardId = boardIds[0];
    const [todoId, doingId] = (await listsOf(boardId)).map((l) => l.id);
    const { error: twoMore } = await client.from("board_lists").insert([
      { board_id: boardId, name: "Quatre", position: 4096 },
      { board_id: boardId, name: "Cinq", position: 5120 },
    ]);
    expect(twoMore).toBeNull();
    const sixth = await client.from("board_lists").insert({ board_id: boardId, name: "Six", position: 6144 });
    expect(sixth.error?.message).toContain("list_limit_reached");

    await addCards(user, todoId, Array.from({ length: 20 }, (_, i) => `Carte ${i + 1}`));
    const [otherCard] = await addCards(user, doingId, ["Ailleurs"]);
    const twentyFirst = await client.from("board_cards").insert({ list_id: todoId, title: "Carte 21", position: 99_999 });
    expect(twentyFirst.error?.message).toContain("card_limit_reached");
    // Moved into the full list: refused too.
    const moved = await client.from("board_cards").update({ list_id: todoId }).eq("id", otherCard);
    expect(moved.error?.message).toContain("card_limit_reached");

    const items = Array.from({ length: 20 }, (_, i) => ({ card_id: otherCard, text: `Élément ${i + 1}`, position: i + 1 }));
    expect((await client.from("board_checklist_items").insert(items)).error).toBeNull();
    const item21 = await client.from("board_checklist_items").insert({ card_id: otherCard, text: "De trop", position: 99 });
    expect(item21.error?.message).toContain("checklist_limit_reached");

    const images = Array.from({ length: 5 }, (_, i) => ({ card_id: otherCard, path: `${user.id}/${randomUUID()}.png`, position: i + 1 }));
    expect((await client.from("board_card_images").insert(images)).error).toBeNull();
    const image6 = await client.from("board_card_images").insert({ card_id: otherCard, path: `${user.id}/x.png`, position: 9 });
    expect(image6.error?.message).toContain("image_limit_reached");

    // The interface offers nothing beyond the limits.
    await signIn(page, user);
    await page.goto(`/app/boards/${boardId}`);
    await openBoardSwitcher(page);
    await expect(page.getByRole("menuitemradio")).toHaveCount(10);
    await expect(page.getByRole("menuitem", { name: /Nouveau tableau/ })).toHaveAttribute("aria-disabled", "true");
    await page.keyboard.press("Escape");
    await expect(list(page, "Cinq")).toBeVisible();
    await expect(page.getByRole("button", { name: /Ajouter une liste/ })).toHaveCount(0);
    const todo = list(page, "À faire");
    await expect(todo).toContainText("Liste pleine · 20 / 20");
    await expect(todo.getByRole("button", { name: "Ajouter une carte" })).toHaveCount(0);

    // A full list cannot receive a card from the window of a card either.
    await tile(list(page, "En cours"), "Ailleurs").click();
    const dialog = page.getByRole("dialog", { name: "Ailleurs" });
    await expect(dialog.getByRole("progressbar", { name: "Avancement de la checklist" })).toHaveAttribute("aria-valuetext", "0 sur 20");
    await expect(dialog.getByRole("button", { name: "Ajouter un élément" })).toHaveCount(0);
    await expect(dialog.getByRole("button", { name: "Ajouter une image" })).toHaveCount(0);
    await dialog.getByRole("button", { name: "Déplacer", exact: true }).click();
    await expect(page.getByRole("menuitem", { name: /À faire/ })).toHaveAttribute("aria-disabled", "true");
  });

  test("window of a card: description, checklist, images, move and deletion", async ({ page }) => {
    const user = await createUser();
    const boardId = await createBoard(user, "Atelier");
    const [, doingId, doneId] = (await listsOf(boardId)).map((l) => l.id);
    const [cardId] = await addCards(user, doingId, ["Maquettes du paiement"]);
    await signIn(page, user);
    await page.goto(`/app/boards/${boardId}`);

    await tile(list(page, "En cours"), "Maquettes du paiement").click();
    const dialog = page.getByRole("dialog", { name: "Maquettes du paiement" });
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`\\?card=${cardId}$`));
    await expect(dialog).toContainText("dans la liste En cours");

    // Description: Ctrl+B in bold, Shift+Enter goes to the line and carries on a list, Enter saves.
    await dialog.getByRole("button", { name: "Ajouter une description…" }).click();
    const description = dialog.getByLabel("Description");
    await description.pressSequentially("Parcours en trois");
    for (let i = 0; i < 5; i++) await description.press("Shift+ArrowLeft");
    await description.press("Control+b");
    await description.press("End");
    await description.press("Shift+Enter");
    await description.pressSequentially("- Panier");
    await description.press("Shift+Enter");
    await description.pressSequentially("Livraison");
    await expect(description).toHaveValue("Parcours en **trois**\n- Panier\n- Livraison");
    await description.press("Enter");
    await expect(description).toBeHidden();
    await expect(dialog.locator("strong", { hasText: "trois" })).toBeVisible();
    await expect(dialog.getByRole("listitem").filter({ hasText: "Panier" })).toBeVisible();
    await expect
      .poll(async () => (await adminClient().from("board_cards").select("description").eq("id", cardId).single()).data?.description)
      .toBe("Parcours en **trois**\n- Panier\n- Livraison");

    // Escape cancels the changes, and leaves the window open.
    await dialog.getByRole("button", { name: "Modifier" }).click();
    await description.press("End");
    await description.pressSequentially(" et paiement");
    await description.press("Escape");
    await expect(description).toBeHidden();
    await expect(dialog).toBeVisible();
    await expect(dialog).not.toContainText("et paiement");

    // Checklist: items added one after the other, three checked out of five.
    await dialog.getByRole("button", { name: "Checklist", exact: true }).click();
    const newItem = dialog.getByLabel("Nouvel élément de la checklist");
    for (const text of ["Panier", "Livraison", "Paiement", "Erreurs", "Mobile"]) {
      await newItem.fill(text);
      await newItem.press("Enter");
    }
    await newItem.press("Escape");
    for (const text of ["Panier", "Livraison", "Paiement"]) await dialog.getByRole("checkbox", { name: text }).click();
    await expect(dialog.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "60");
    await expect(dialog.getByText("60 %")).toBeVisible();

    // Images: the first one becomes the cover.
    await dialog.getByLabel("Images à ajouter").setInputFiles({ name: "maquette.png", mimeType: "image/png", buffer: PNG });
    await expect(dialog.getByText("Couverture")).toBeVisible();
    await expect(dialog.locator("img")).toHaveCount(1);
    await expect.poll(async () => (await adminClient().from("board_card_images").select("id").eq("card_id", cardId)).data?.length).toBe(1);

    // Closed: the card shows its cover and its badges.
    await dialog.getByRole("button", { name: "Fermer" }).click();
    await expect(dialog).toBeHidden();
    await expect(page).not.toHaveURL(/\?card=/);
    const card = tile(list(page, "En cours"), "Maquettes du paiement");
    await expect(card).toContainText("3/5");
    await expect(card.locator("img")).toHaveCount(1);

    // Reopened by its link; the checklist completed turns green on the card.
    await page.goto(`/app/boards/${boardId}?card=${cardId}`);
    await expect(dialog).toBeVisible();
    for (const text of ["Erreurs", "Mobile"]) await dialog.getByRole("checkbox", { name: text }).click();
    await expect(dialog.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    await expect(dialog.getByText("100 %")).toBeVisible();
    await expect.poll(async () => (await adminClient().from("board_checklist_items").select("id").eq("card_id", cardId).eq("is_done", true)).data?.length).toBe(5);

    // The image deleted from its menu, and from the storage.
    const { data: imageRow } = await adminClient().from("board_card_images").select("path").eq("card_id", cardId).single();
    await dialog.getByRole("button", { name: "Options de l'image 1" }).click();
    await page.getByRole("menuitem", { name: "Supprimer" }).click();
    await expect(dialog.locator("img")).toHaveCount(0);
    await expect.poll(async () => (await adminClient().from("board_card_images").select("id").eq("card_id", cardId)).data?.length).toBe(0);
    const folder = (imageRow?.path as string).split("/")[0];
    await expect.poll(async () => (await adminClient().storage.from("board-images").list(folder)).data?.length).toBe(0);

    // "Déplacer": to the end of another list.
    await dialog.getByRole("button", { name: "Déplacer", exact: true }).click();
    await page.getByRole("menuitem", { name: /Terminé/ }).click();
    await expect(dialog).toContainText("dans la liste Terminé");
    await expect.poll(() => cardTitles(doneId)).toEqual(["Maquettes du paiement"]);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(tile(list(page, "Terminé"), "Maquettes du paiement")).toContainText("5/5");

    // Deleted after a confirmation.
    await tile(list(page, "Terminé"), "Maquettes du paiement").click();
    await dialog.getByRole("button", { name: "Supprimer", exact: true }).click();
    await page.getByRole("dialog", { name: "Supprimer cette carte ?" }).getByRole("button", { name: "Supprimer la carte" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText("Carte supprimée")).toBeVisible();
    await expect(cardsOf(list(page, "Terminé"))).toHaveCount(0);
    await expect.poll(() => cardTitles(doneId)).toEqual([]);
  });

  test("security: a user never reaches the boards nor the images of another; a visitor reaches nothing", async ({ page }) => {
    const owner = await createUser();
    const other = await createUser();
    const boardId = await createBoard(owner, "Privé");
    const [todoId] = (await listsOf(boardId)).map((l) => l.id);
    const [cardId] = await addCards(owner, todoId, ["Secret"]);
    const ownerClient = await signedInClient(owner);
    const path = `${owner.id}/${randomUUID()}.png`;
    expect((await ownerClient.storage.from("board-images").upload(path, PNG, { contentType: "image/png" })).error).toBeNull();
    expect((await ownerClient.from("board_card_images").insert({ card_id: cardId, path, position: 1 })).error).toBeNull();

    // Another user reads nothing, changes nothing, adds nothing.
    const client = await signedInClient(other);
    for (const table of ["boards", "board_lists", "board_cards", "board_checklist_items", "board_card_images"]) {
      const { data } = await client.from(table).select("id");
      expect(data, table).toEqual([]);
    }
    await client.from("board_cards").update({ title: "Piraté" }).eq("id", cardId);
    await client.from("boards").delete().eq("id", boardId);
    expect((await adminClient().from("board_cards").select("title").eq("id", cardId).single()).data?.title).toBe("Secret");
    expect((await adminClient().from("boards").select("id").eq("id", boardId)).data).toHaveLength(1);
    expect((await client.from("board_lists").insert({ board_id: boardId, name: "Intrus", position: 1 })).error).not.toBeNull();
    expect((await client.from("board_cards").insert({ list_id: todoId, title: "Intrus", position: 1 })).error).not.toBeNull();
    expect((await client.storage.from("board-images").download(path)).error).not.toBeNull();
    expect((await client.storage.from("board-images").createSignedUrl(path, 60)).error).not.toBeNull();
    expect((await client.storage.from("board-images").upload(`${owner.id}/intrus.png`, PNG, { contentType: "image/png" })).error).not.toBeNull();

    // A visitor who is not signed in neither.
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false },
    });
    const { data: anonBoards } = await anon.from("boards").select("id");
    expect(anonBoards ?? []).toEqual([]);
    expect((await anon.rpc("create_board", { board_name: "Intrus" })).error).not.toBeNull();
    expect((await anon.storage.from("board-images").download(path)).error).not.toBeNull();

    // In the app: another user's board is not found; a visitor is sent to the login page.
    await signIn(page, other);
    await page.goto(`/app/boards/${boardId}`);
    await expect(page.getByRole("heading", { name: "Page introuvable" })).toBeVisible();
    await expect(page.getByText("Secret")).toHaveCount(0);
    await page.context().clearCookies();
    await page.goto(`/app/boards/${boardId}`);
    await expect(page).toHaveURL(/\/login\?next=/);
  });

  test("the deletion of the account removes its boards and their images", async ({ page }) => {
    const user = await createUser();
    const boardId = await createBoard(user, "À effacer");
    const [todoId] = (await listsOf(boardId)).map((l) => l.id);
    const [cardId] = await addCards(user, todoId, ["Carte"]);
    const client = await signedInClient(user);
    const path = `${user.id}/${randomUUID()}.png`;
    expect((await client.storage.from("board-images").upload(path, PNG, { contentType: "image/png" })).error).toBeNull();
    expect((await client.from("board_card_images").insert({ card_id: cardId, path, position: 1 })).error).toBeNull();

    await signIn(page, user);
    const dialog = await openSettings(page);
    await dialog.getByRole("button", { name: "Supprimer le compte" }).click();
    await page.getByRole("dialog", { name: "Supprimer votre compte ?" }).getByRole("button", { name: "Supprimer définitivement" }).click();
    await expect(page).toHaveURL(/\/login\?notice=account-deleted$/);

    expect((await adminClient().from("boards").select("id").eq("id", boardId)).data).toEqual([]);
    expect((await adminClient().from("board_cards").select("id").eq("id", cardId)).data).toEqual([]);
    expect((await adminClient().storage.from("board-images").list(user.id)).data).toEqual([]);
  });
});
