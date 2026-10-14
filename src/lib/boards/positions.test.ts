import { describe, expect, it } from "vitest";

import { positionAfterLast, positionBetween, repositionAfterMove, spacedPositions, withPositions } from "./positions";

const items = (...positions: number[]) => positions.map((position, index) => ({ id: `i${index}`, position }));

describe("positionBetween", () => {
  it("starts a list, adds at the end and at the start", () => {
    expect(positionBetween(undefined, undefined)).toBe(1024);
    expect(positionBetween(2048, undefined)).toBe(3072);
    expect(positionBetween(undefined, 1024)).toBe(0);
  });

  it("puts an item halfway between its neighbours", () => {
    expect(positionBetween(1024, 2048)).toBe(1536);
  });

  it("says when there is no room left between two neighbours", () => {
    expect(positionBetween(1, 1 + Number.EPSILON)).toBeNull();
    expect(positionBetween(5, 5)).toBeNull();
  });
});

describe("positionAfterLast", () => {
  it("goes after the highest position, whatever the order", () => {
    expect(positionAfterLast([])).toBe(1024);
    expect(positionAfterLast(items(3072, 1024))).toBe(4096);
  });
});

describe("repositionAfterMove", () => {
  it("only moves the item that moved", () => {
    const [a, b, c] = items(1024, 2048, 3072);
    // c dragged between a and b.
    expect(repositionAfterMove([a, c, b], c.id)).toEqual([{ id: c.id, position: 1536 }]);
  });

  it("spaces the whole list out again when there is no room left", () => {
    const ordered = [
      { id: "a", position: 1 },
      { id: "moved", position: 9000 },
      { id: "b", position: 1 + Number.EPSILON },
    ];
    expect(repositionAfterMove(ordered, "moved")).toEqual([
      { id: "a", position: 1024 },
      { id: "moved", position: 2048 },
      { id: "b", position: 3072 },
    ]);
  });

  it("does nothing for an unknown item", () => {
    expect(repositionAfterMove(items(1024), "nope")).toEqual([]);
  });
});

describe("withPositions", () => {
  it("applies the new positions and keeps the order", () => {
    expect(withPositions(items(1, 2), [{ id: "i1", position: 7 }])).toEqual([
      { id: "i0", position: 1 },
      { id: "i1", position: 7 },
    ]);
  });

  it("spaces positions evenly", () => {
    expect(spacedPositions(3)).toEqual([1024, 2048, 3072]);
  });
});
