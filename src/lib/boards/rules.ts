// Rules of the Tableaux module (docs/boards.md): limits and lengths, also checked by the database
// (supabase/migrations/20261014120000_add_boards_module.sql).

export const BOARDS_PATH = "/app/boards";
export const boardPath = (boardId: string) => `${BOARDS_PATH}/${boardId}`;
// A card is opened by its address: /app/boards/<id>?card=<id>.
export const CARD_PARAM = "card";

// The last board seen, reopened by "Mes tableaux" (one cookie per device).
export const LAST_BOARD_COOKIE = "mywork-last-board";

export const MAX_BOARDS = 10;
export const MAX_LISTS = 5;
export const MAX_CARDS = 20;
export const MAX_CHECKLIST_ITEMS = 20;
export const MAX_IMAGES = 5;

export const BOARD_NAME_MAX = 60;
export const LIST_NAME_MAX = 50;
export const CARD_TITLE_MAX = 200;
export const DESCRIPTION_MAX = 10_000;
export const CHECKLIST_ITEM_MAX = 200;

export const DEFAULT_LISTS = ["À faire", "En cours", "Terminé"];

// Names and titles: spaces at both ends removed, inner runs of spaces kept as typed.
// null when nothing is left.
export function cleanName(value: string, max: number) {
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

export type LimitKind = "board" | "list" | "card" | "checklist" | "image";

export const LIMIT_MESSAGES: Record<LimitKind, string> = {
  board: `${MAX_BOARDS} tableaux au plus.`,
  list: `${MAX_LISTS} listes au plus par tableau.`,
  card: `Cette liste est pleine : ${MAX_CARDS} cartes au plus.`,
  checklist: `${MAX_CHECKLIST_ITEMS} éléments au plus dans la checklist.`,
  image: `${MAX_IMAGES} images au plus par carte.`,
};

// The limit the database refused, from its error message (check_board_limits), or null.
export function limitReached(message: string | undefined): LimitKind | null {
  const match = message?.match(/\b(board|list|card|checklist|image)_limit_reached\b/);
  return match ? (match[1] as LimitKind) : null;
}

// "3/5" on a card, and whether everything is checked.
export function checklistProgress(items: { isDone: boolean }[]) {
  const done = items.filter((item) => item.isDone).length;
  return {
    done,
    total: items.length,
    complete: items.length > 0 && done === items.length,
    percent: items.length === 0 ? 0 : Math.round((done / items.length) * 100),
  };
}
