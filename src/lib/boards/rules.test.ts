import { describe, expect, it } from "vitest";

import { boardImageProblem, reducedSize } from "./images";
import { checklistProgress, cleanName, limitReached } from "./rules";
import { cardCount, coverOf, findCard, insertCard, placeCard } from "./state";
import type { Board, Card } from "./types";

const card = (id: string, position: number, fields: Partial<Card> = {}): Card => ({
  id,
  title: id,
  description: "",
  position,
  coverImageId: null,
  checklist: [],
  images: [],
  ...fields,
});

const board: Board = {
  id: "b",
  name: "Tableau",
  lists: [
    { id: "todo", name: "À faire", position: 1024, cards: [card("a", 1024), card("b", 2048)] },
    { id: "done", name: "Terminé", position: 2048, cards: [card("c", 1024)] },
  ],
};

describe("limits", () => {
  it("recognizes the limit the database refused", () => {
    expect(limitReached("card_limit_reached")).toBe("card");
    expect(limitReached("Board creation failed: board_limit_reached")).toBe("board");
    expect(limitReached("duplicate key")).toBeNull();
    expect(limitReached(undefined)).toBeNull();
  });

  it("cleans names: no spaces around, cut at the limit, nothing when empty", () => {
    expect(cleanName("  Refonte  ", 60)).toBe("Refonte");
    expect(cleanName("x".repeat(70), 60)).toHaveLength(60);
    expect(cleanName("   ", 60)).toBeNull();
  });
});

describe("checklistProgress", () => {
  it("counts the checked items, complete once everything is checked", () => {
    const item = (isDone: boolean) => ({ isDone });
    expect(checklistProgress([item(true), item(false), item(true), item(false), item(true)])).toEqual({
      done: 3,
      total: 5,
      complete: false,
      percent: 60,
    });
    expect(checklistProgress([item(true)]).complete).toBe(true);
    expect(checklistProgress([]).complete).toBe(false);
  });
});

describe("images", () => {
  it("accepts JPG, PNG, WebP and GIF up to 5 MB", () => {
    expect(boardImageProblem({ type: "image/gif", size: 1000 })).toBeNull();
    expect(boardImageProblem({ type: "image/svg+xml", size: 1000 })).toMatch(/Format/);
    expect(boardImageProblem({ type: "image/png", size: 6 * 1024 * 1024 })).toMatch(/5 Mo/);
  });

  it("reduces large images to 1,600 pixels at most, keeping their shape", () => {
    expect(reducedSize(4000, 3000)).toEqual({ width: 1600, height: 1200 });
    expect(reducedSize(1000, 3200)).toEqual({ width: 500, height: 1600 });
    expect(reducedSize(1600, 900)).toBeNull();
  });
});

describe("board state", () => {
  it("finds a card and counts the cards", () => {
    expect(findCard(board, "c")?.list.id).toBe("done");
    expect(cardCount(board)).toBe(3);
  });

  it("places a dragged card in another list at an index", () => {
    const moved = placeCard(board, "a", "done", 0);
    expect(moved.lists[0].cards.map((c) => c.id)).toEqual(["b"]);
    expect(moved.lists[1].cards.map((c) => c.id)).toEqual(["a", "c"]);
  });

  it("puts a card back in a list in the order of the positions", () => {
    const moved = insertCard(board, "todo", card("c", 1536));
    expect(moved.lists[0].cards.map((c) => c.id)).toEqual(["a", "c", "b"]);
    expect(moved.lists[1].cards).toEqual([]);
  });

  it("shows the chosen cover only while its image exists", () => {
    const image = { id: "i", path: "u/i.png", position: 1, url: null };
    expect(coverOf(card("x", 1, { coverImageId: "i", images: [image] }))).toBe(image);
    expect(coverOf(card("x", 1, { coverImageId: "gone", images: [image] }))).toBeNull();
  });
});
