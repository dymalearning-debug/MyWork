import { createClient } from "@/lib/supabase/client";

import { BOARD_IMAGES_BUCKET, BOARD_IMAGE_MAX_SIDE, extensionOf, reducedSize, SIGNED_URL_SECONDS } from "./images";
import { LIMIT_MESSAGES, limitReached, type LimitKind } from "./rules";
import type { CardImage } from "./types";

// Writes of the Tableaux module, straight from the browser into the tables (docs/boards.md,
// "Données"): everything is saved as it changes, one row at a time. RLS limits them to the user's
// own rows; the database checks the limits. Ids are made here, so that a new row can be shown
// before it is saved.

export class BoardWriteError extends Error {
  constructor(
    message: string,
    readonly limit: LimitKind | null,
  ) {
    super(message);
  }
}

// What to tell the user when a write failed: the limit reached, or the fallback.
export function failureMessage(error: unknown, fallback: string) {
  return error instanceof BoardWriteError && error.limit ? LIMIT_MESSAGES[error.limit] : fallback;
}

function check(error: { message: string } | null, what: string) {
  if (error) throw new BoardWriteError(`${what} failed: ${error.message}`, limitReached(error.message));
}

const db = () => createClient();

// ——— Boards ———

// A new board, with its three starting lists, at the end of the user's boards.
export async function createBoard(name: string): Promise<string> {
  const { data, error } = await db().rpc("create_board", { board_name: name });
  check(error, "Board creation");
  return data as string;
}

export async function updateBoard(id: string, changes: { name?: string; position?: number }) {
  const { error } = await db().from("boards").update(changes).eq("id", id);
  check(error, "Board update");
}

// The board, its lists, cards and images. The images leave the storage first.
export async function deleteBoard(id: string, imagePaths: string[]) {
  await removeImageFiles(imagePaths);
  const { error } = await db().from("boards").delete().eq("id", id);
  check(error, "Board deletion");
}

// ——— Lists ———

export async function createList(list: { id: string; boardId: string; name: string; position: number }) {
  const { error } = await db()
    .from("board_lists")
    .insert({ id: list.id, board_id: list.boardId, name: list.name, position: list.position });
  check(error, "List creation");
}

export async function updateList(id: string, changes: { name?: string; position?: number }) {
  const { error } = await db().from("board_lists").update(changes).eq("id", id);
  check(error, "List update");
}

export async function deleteList(id: string, imagePaths: string[]) {
  await removeImageFiles(imagePaths);
  const { error } = await db().from("board_lists").delete().eq("id", id);
  check(error, "List deletion");
}

// ——— Cards ———

export async function createCard(card: { id: string; listId: string; title: string; position: number }) {
  const { error } = await db()
    .from("board_cards")
    .insert({ id: card.id, list_id: card.listId, title: card.title, position: card.position });
  check(error, "Card creation");
}

export async function updateCard(
  id: string,
  changes: { title?: string; description?: string; listId?: string; position?: number; coverImageId?: string | null },
) {
  const row: Record<string, unknown> = {};
  if (changes.title !== undefined) row.title = changes.title;
  if (changes.description !== undefined) row.description = changes.description;
  if (changes.listId !== undefined) row.list_id = changes.listId;
  if (changes.position !== undefined) row.position = changes.position;
  if (changes.coverImageId !== undefined) row.cover_image_id = changes.coverImageId;
  const { error } = await db().from("board_cards").update(row).eq("id", id);
  check(error, "Card update");
}

export async function deleteCard(id: string, imagePaths: string[]) {
  await removeImageFiles(imagePaths);
  const { error } = await db().from("board_cards").delete().eq("id", id);
  check(error, "Card deletion");
}

// ——— Checklist ———

export async function createChecklistItem(item: { id: string; cardId: string; text: string; position: number }) {
  const { error } = await db()
    .from("board_checklist_items")
    .insert({ id: item.id, card_id: item.cardId, text: item.text, position: item.position });
  check(error, "Checklist item creation");
}

export async function updateChecklistItem(id: string, changes: { text?: string; isDone?: boolean; position?: number }) {
  const row: Record<string, unknown> = {};
  if (changes.text !== undefined) row.text = changes.text;
  if (changes.isDone !== undefined) row.is_done = changes.isDone;
  if (changes.position !== undefined) row.position = changes.position;
  const { error } = await db().from("board_checklist_items").update(row).eq("id", id);
  check(error, "Checklist item update");
}

export async function deleteChecklistItem(id: string) {
  const { error } = await db().from("board_checklist_items").delete().eq("id", id);
  check(error, "Checklist item deletion");
}

// ——— Images ———

// Sends an image of a card: reduced to 1,600 pixels at most (animated GIFs are kept as they are),
// stored in the user's folder under a name nobody can guess, then added to the card. The file is
// removed again if the card refuses it (5 images at most).
export async function addCardImage(
  userId: string,
  image: { id: string; cardId: string; position: number },
  file: File,
): Promise<CardImage> {
  const blob = await reduceImage(file);
  const path = `${userId}/${crypto.randomUUID()}.${extensionOf(blob.type)}`;
  const storage = db().storage.from(BOARD_IMAGES_BUCKET);
  const { error: uploadError } = await storage.upload(path, blob, { contentType: blob.type, upsert: false });
  check(uploadError, "Image upload");
  const { error } = await db()
    .from("board_card_images")
    .insert({ id: image.id, card_id: image.cardId, path, position: image.position });
  if (error) {
    await storage.remove([path]);
    check(error, "Image creation");
  }
  const { data: signed } = await storage.createSignedUrl(path, SIGNED_URL_SECONDS);
  return { id: image.id, path, position: image.position, url: signed?.signedUrl ?? null };
}

export async function deleteCardImage(id: string, path: string) {
  const { error } = await db().from("board_card_images").delete().eq("id", id);
  check(error, "Image deletion");
  await removeImageFiles([path]);
}

// Files that no row uses any more. A failure leaves a file behind, without harm: it is removed
// with the account.
async function removeImageFiles(paths: string[]) {
  if (paths.length === 0) return;
  const { error } = await db().storage.from(BOARD_IMAGES_BUCKET).remove(paths);
  if (error) console.error(`Board images removal failed: ${error.message}`);
}

async function reduceImage(file: File): Promise<Blob> {
  if (file.type === "image/gif") return file;
  // An image the browser cannot read is sent as it is.
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const size = reducedSize(bitmap.width, bitmap.height, BOARD_IMAGE_MAX_SIDE);
  if (!size) {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) return file;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close();
  // PNG keeps its transparency; the others become JPEG, lighter.
  const type = file.type === "image/png" ? "image/png" : file.type === "image/webp" ? "image/webp" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.88));
  return blob ?? file;
}
