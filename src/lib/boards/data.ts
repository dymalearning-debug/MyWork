import "server-only";

import { createClient } from "@/lib/supabase/server";

import { BOARD_IMAGES_BUCKET, SIGNED_URL_SECONDS } from "./images";
import { byPosition } from "./positions";
import type { Board, BoardSummary, Card } from "./types";

// Reads of the Tableaux module, for the signed-in user: RLS limits them to their own rows.

// The boards of the second column, with their number of cards.
export async function getOwnBoards(): Promise<BoardSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("boards")
    .select("id, name, position, board_lists(board_cards(count))")
    .order("position");
  if (error) throw new Error(`Boards read failed: ${error.message}`);
  return data.map((board) => ({
    id: board.id,
    name: board.name,
    position: board.position,
    cardCount: (board.board_lists as { board_cards: { count: number }[] }[]).reduce(
      (total, list) => total + (list.board_cards[0]?.count ?? 0),
      0,
    ),
  }));
}

type CardRow = {
  id: string;
  title: string;
  description: string;
  position: number;
  cover_image_id: string | null;
  board_checklist_items: { id: string; text: string; is_done: boolean; position: number }[];
  board_card_images: { id: string; path: string; position: number }[];
};

// A whole board: its lists, their cards, the checklists and the images (with signed addresses).
// null: no such board for this user (another user's board, or deleted).
export async function getOwnBoard(boardId: string): Promise<Board | null> {
  if (!/^[0-9a-f-]{36}$/i.test(boardId)) return null;
  const supabase = await createClient();
  const { data: board, error } = await supabase
    .from("boards")
    .select(
      "id, name, board_lists(id, name, position, board_cards(id, title, description, position, cover_image_id, board_checklist_items(id, text, is_done, position), board_card_images!board_card_images_card_id_user_id_fkey(id, path, position)))",
    )
    .eq("id", boardId)
    .maybeSingle();
  if (error) throw new Error(`Board read failed: ${error.message}`);
  if (!board) return null;

  const lists = board.board_lists as { id: string; name: string; position: number; board_cards: CardRow[] }[];
  const paths = lists.flatMap((list) => list.board_cards.flatMap((card) => card.board_card_images.map((i) => i.path)));
  const urls = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed, error: signError } = await supabase.storage
      .from(BOARD_IMAGES_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_SECONDS);
    if (signError) console.error(`Board images signing failed: ${signError.message}`);
    for (const item of signed ?? []) if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  }

  return {
    id: board.id,
    name: board.name,
    lists: byPosition(lists).map((list) => ({
      id: list.id,
      name: list.name,
      position: list.position,
      cards: byPosition(list.board_cards).map(
        (card): Card => ({
          id: card.id,
          title: card.title,
          description: card.description,
          position: card.position,
          coverImageId: card.cover_image_id,
          checklist: byPosition(card.board_checklist_items).map((item) => ({
            id: item.id,
            text: item.text,
            isDone: item.is_done,
            position: item.position,
          })),
          images: byPosition(card.board_card_images).map((image) => ({
            id: image.id,
            path: image.path,
            position: image.position,
            url: urls.get(image.path) ?? null,
          })),
        }),
      ),
    })),
  };
}

// Account deletion: the storage is not emptied by the cascade of the database, so the images of
// the cards go first (docs/boards.md, "Données"). Page by page: up to 5,000 images per account.
export async function removeAllOwnBoardImages(userId: string) {
  const supabase = await createClient();
  const storage = supabase.storage.from(BOARD_IMAGES_BUCKET);
  for (;;) {
    const { data, error } = await storage.list(userId, { limit: 1000 });
    if (error) throw new Error(`Board images listing failed: ${error.message}`);
    const files = data.filter((file) => file.id).map((file) => `${userId}/${file.name}`);
    if (files.length === 0) return;
    const { error: removeError } = await storage.remove(files);
    if (removeError) throw new Error(`Board images removal failed: ${removeError.message}`);
    if (files.length < 1000) return;
  }
}
