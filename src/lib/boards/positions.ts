// Order of boards, lists, cards and checklist items (docs/boards.md, "Données"): decimal positions,
// so that a moved item only needs a new position between its two neighbours, without renumbering
// the others. When two neighbours get too close, the whole list is spaced out again.

export const POSITION_STEP = 1024;

// A position between two neighbours (undefined: no neighbour on that side); null when there is no
// room left between them.
export function positionBetween(before: number | undefined, after: number | undefined): number | null {
  if (before === undefined && after === undefined) return POSITION_STEP;
  if (after === undefined) return (before as number) + POSITION_STEP;
  if (before === undefined) return after - POSITION_STEP;
  const middle = (before + after) / 2;
  return middle > before && middle < after ? middle : null;
}

// The position after the last item.
export function positionAfterLast(items: { position: number }[]) {
  return items.length === 0 ? POSITION_STEP : Math.max(...items.map((item) => item.position)) + POSITION_STEP;
}

// Evenly spaced positions, for a list spaced out again.
export function spacedPositions(count: number) {
  return Array.from({ length: count }, (_, index) => (index + 1) * POSITION_STEP);
}

// New positions of a list after one of its items moved to `index` (the list is already in its new
// order): only the moved item changes, unless there is no room left, then every item does.
// Returns the items whose position changes.
export function repositionAfterMove<T extends { id: string; position: number }>(
  ordered: T[],
  movedId: string,
): { id: string; position: number }[] {
  const index = ordered.findIndex((item) => item.id === movedId);
  if (index === -1) return [];
  const position = positionBetween(ordered[index - 1]?.position, ordered[index + 1]?.position);
  if (position !== null) return [{ id: movedId, position }];
  const spaced = spacedPositions(ordered.length);
  return ordered
    .map((item, i) => ({ id: item.id, position: spaced[i] }))
    .filter((item, i) => item.position !== ordered[i].position);
}

// Applies new positions to items, keeping their order.
export function withPositions<T extends { id: string; position: number }>(
  items: T[],
  changes: { id: string; position: number }[],
): T[] {
  if (changes.length === 0) return items;
  const byId = new Map(changes.map((change) => [change.id, change.position]));
  return items.map((item) => (byId.has(item.id) ? { ...item, position: byId.get(item.id) as number } : item));
}

export function byPosition<T extends { position: number }>(items: T[]) {
  return [...items].sort((a, b) => a.position - b.position);
}
