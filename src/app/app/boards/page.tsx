import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { requireUser } from "@/lib/auth/user";
import { getOwnBoards } from "@/lib/boards/data";
import { boardPath, LAST_BOARD_COOKIE } from "@/lib/boards/rules";

import { BoardsSkeleton } from "./_components/boards-skeleton";
import { EmptyBoards } from "./_components/empty-boards";

export const metadata: Metadata = { title: "Mes tableaux · MyWork" };

// "Mes tableaux" (docs/boards.md, "Navigation"): opens the last board seen on this device, else
// the first one. A new account has none: the page offers to create the first.
export default function BoardsPage() {
  return (
    <Suspense fallback={<BoardsSkeleton />}>
      <BoardsHome />
    </Suspense>
  );
}

async function BoardsHome() {
  await requireUser();
  const boards = await getOwnBoards();
  if (boards.length === 0) return <EmptyBoards />;
  const last = (await cookies()).get(LAST_BOARD_COOKIE)?.value;
  redirect(boardPath((boards.find((board) => board.id === last) ?? boards[0]).id));
}
