import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { requireUser } from "@/lib/auth/user";
import { getOwnBoard, getOwnBoards } from "@/lib/boards/data";

import { BoardsSkeleton } from "../_components/boards-skeleton";
import { BoardsWorkspace } from "../_components/workspace";

export const metadata: Metadata = { title: "Mes tableaux · MyWork" };

// A board (docs/boards.md), at its own address. Another user's board, or a deleted one, is not
// found.
export default function BoardPage({ params }: PageProps<"/app/boards/[boardId]">) {
  return (
    <Suspense fallback={<BoardsSkeleton />}>
      <BoardContent params={params} />
    </Suspense>
  );
}

async function BoardContent({ params }: { params: PageProps<"/app/boards/[boardId]">["params"] }) {
  const user = await requireUser();
  const { boardId } = await params;
  const [boards, board] = await Promise.all([getOwnBoards(), getOwnBoard(boardId)]);
  if (!board) notFound();
  // A new workspace for each board: nothing of the previous one is kept.
  return <BoardsWorkspace key={board.id} userId={user.id} boards={boards} board={board} />;
}
