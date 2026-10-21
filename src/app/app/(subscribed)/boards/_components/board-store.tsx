"use client";

import { createContext, useContext } from "react";
import { toast } from "sonner";

import { failureMessage } from "@/lib/boards/client";
import type { Board, BoardSummary } from "@/lib/boards/types";

// The open board, shared by its lists, its cards and the window of a card. Each change is shown at
// once, then saved; when the save fails, the change is undone and a notification says why
// (docs/boards.md, "Technique").

export type BoardStore = {
  userId: string;
  board: Board;
  // Every board of the user, for the second column.
  boards: BoardSummary[];
  setBoard: React.Dispatch<React.SetStateAction<Board>>;
  openCard: (cardId: string) => void;
  closeCard: () => void;
};

export const BoardStoreContext = createContext<BoardStore | null>(null);

export function useBoardStore() {
  const store = useContext(BoardStoreContext);
  if (!store) throw new Error("useBoardStore outside of a board");
  return store;
}

export type Change = {
  // The change, shown at once.
  apply: (board: Board) => Board;
  // Its saving.
  save: () => Promise<unknown>;
  // How to undo it if the save fails.
  undo: (board: Board) => Board;
  // What to say when it fails (a limit reached has its own message).
  error: string;
  // Once saved.
  onSaved?: () => void;
};

export function useBoardChange() {
  const { setBoard } = useBoardStore();
  return (change: Change) => {
    setBoard(change.apply);
    change
      .save()
      .then(() => change.onSaved?.())
      .catch((error: unknown) => {
        console.error(error);
        setBoard(change.undo);
        toast.error(failureMessage(error, change.error));
      });
  };
}
