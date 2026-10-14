import { byPosition } from "./positions";
import type { Board, BoardList, Card } from "./types";

// Changes of a board in the browser, shown at once while they are saved (docs/boards.md,
// "Technique"). Pure functions: they return a new board.

export function findCard(board: Board, cardId: string): { list: BoardList; card: Card; index: number } | null {
  for (const list of board.lists) {
    const index = list.cards.findIndex((card) => card.id === cardId);
    if (index !== -1) return { list, card: list.cards[index], index };
  }
  return null;
}

export function updateList(board: Board, listId: string, change: (list: BoardList) => BoardList): Board {
  return { ...board, lists: board.lists.map((list) => (list.id === listId ? change(list) : list)) };
}

export function updateCard(board: Board, cardId: string, change: (card: Card) => Card): Board {
  return {
    ...board,
    lists: board.lists.map((list) =>
      list.cards.some((card) => card.id === cardId)
        ? { ...list, cards: list.cards.map((card) => (card.id === cardId ? change(card) : card)) }
        : list,
    ),
  };
}

export function removeList(board: Board, listId: string): Board {
  return { ...board, lists: board.lists.filter((list) => list.id !== listId) };
}

export function insertList(board: Board, list: BoardList): Board {
  return { ...board, lists: byPosition([...board.lists.filter((other) => other.id !== list.id), list]) };
}

export function removeCard(board: Board, cardId: string): Board {
  return {
    ...board,
    lists: board.lists.map((list) =>
      list.cards.some((card) => card.id === cardId)
        ? { ...list, cards: list.cards.filter((card) => card.id !== cardId) }
        : list,
    ),
  };
}

// A card put back in a list, in the order of the positions (new card, card moved by "Déplacer",
// card restored after a failed save).
export function insertCard(board: Board, listId: string, card: Card): Board {
  const without = removeCard(board, card.id);
  return updateList(without, listId, (list) => ({ ...list, cards: byPosition([...list.cards, card]) }));
}

// A card moved to a list at an index, while it is dragged: the order on screen, positions come at
// the drop.
export function placeCard(board: Board, cardId: string, listId: string, index: number): Board {
  const found = findCard(board, cardId);
  if (!found) return board;
  const without = removeCard(board, cardId);
  return updateList(without, listId, (list) => {
    const cards = [...list.cards];
    cards.splice(Math.max(0, Math.min(index, cards.length)), 0, found.card);
    return { ...list, cards };
  });
}

// The cover shown on a card: its chosen image, if it still exists.
export function coverOf(card: Card) {
  return card.coverImageId ? (card.images.find((image) => image.id === card.coverImageId) ?? null) : null;
}

export function cardCount(board: Board) {
  return board.lists.reduce((total, list) => total + list.cards.length, 0);
}

// Every image file of a list or of a board, removed from the storage with it.
export function imagePathsOfCards(cards: Card[]) {
  return cards.flatMap((card) => card.images.map((image) => image.path));
}
