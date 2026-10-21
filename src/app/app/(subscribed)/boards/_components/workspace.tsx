"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { CARD_PARAM, LAST_BOARD_COOKIE } from "@/lib/boards/rules";
import { cardCount } from "@/lib/boards/state";
import type { Board, BoardSummary } from "@/lib/boards/types";

import { BoardStoreContext } from "./board-store";
import { BoardView } from "./board-view";
import { CardDialog } from "./card-dialog";

// Pages of the boards (docs/boards.md): the open board; its name switches to the others.
// The board lives in the browser while it is open: each change is shown at once, then saved.
export function BoardsWorkspace({
  userId,
  boards,
  board: initialBoard,
}: {
  userId: string;
  boards: BoardSummary[];
  board: Board;
}) {
  const [board, setBoard] = useState(initialBoard);
  // A page left stays in the document: when it comes back with fresh data from the server, that
  // data replaces what was shown.
  const [received, setReceived] = useState(initialBoard);
  if (received !== initialBoard) {
    setReceived(initialBoard);
    setBoard(initialBoard);
  }
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const openCardId = searchParams.get(CARD_PARAM);

  // "Mes tableaux" reopens the last board seen on this device.
  useEffect(() => {
    document.cookie = `${LAST_BOARD_COOKIE}=${board.id}; path=/; max-age=31536000; samesite=lax`;
  }, [board.id]);

  // The open board shows its name and its number of cards as they change.
  const shownBoards = boards.map((summary) =>
    summary.id === board.id ? { ...summary, name: board.name, cardCount: cardCount(board) } : summary,
  );

  // The address of an open card (?card=<id>) can be reopened.
  const store = {
    userId,
    board,
    boards: shownBoards,
    setBoard,
    openCard: (cardId: string) => window.history.pushState(null, "", `${pathname}?${CARD_PARAM}=${cardId}`),
    closeCard: () => window.history.replaceState(null, "", pathname),
  };

  return (
    <BoardStoreContext.Provider value={store}>
      <div className="flex h-svh">
        <BoardView />
      </div>
      <CardDialog cardId={openCardId} />
    </BoardStoreContext.Provider>
  );
}
