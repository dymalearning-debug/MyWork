// Shapes of the Tableaux module in the app (docs/boards.md). Ordered by position.

export type BoardSummary = { id: string; name: string; position: number; cardCount: number };

export type ChecklistItem = { id: string; text: string; isDone: boolean; position: number };

// url: a signed address, valid for an hour (the bucket is private).
export type CardImage = { id: string; path: string; position: number; url: string | null };

export type Card = {
  id: string;
  title: string;
  description: string;
  position: number;
  coverImageId: string | null;
  checklist: ChecklistItem[];
  images: CardImage[];
};

export type BoardList = { id: string; name: string; position: number; cards: Card[] };

export type Board = { id: string; name: string; lists: BoardList[] };
