"use client";

import { ChevronDownIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { boardPath, MAX_BOARDS } from "@/lib/boards/rules";

import { useBoardStore } from "./board-store";
import { NewBoardForm } from "./new-board-form";

// The name of the open board, which opens the list of the boards (docs/boards.md, "Navigation"):
// a click on another one opens it; "Nouveau tableau" at the bottom.
export function BoardSwitcher() {
  const { board, boards } = useBoardStore();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const full = boards.length >= MAX_BOARDS;

  return (
    <>
      <h1 className="min-w-0">
        <DropdownMenu>
          <DropdownMenuTrigger
            title="Changer de tableau"
            className="group flex max-w-full items-center gap-2 font-heading text-[26px] leading-8 font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span className="truncate">{board.name}</span>
            <ChevronDownIcon className="size-5 shrink-0 text-muted-foreground transition-transform group-aria-expanded:rotate-180" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Mes tableaux</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={board.id}>
                {boards.map((item) => (
                  <DropdownMenuRadioItem
                    key={item.id}
                    value={item.id}
                    closeOnClick
                    onClick={() => item.id !== board.id && router.push(boardPath(item.id))}
                  >
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={full} onClick={() => setCreating(true)}>
              <PlusIcon />
              Nouveau tableau
              {full && <span className="ml-auto text-xs text-muted-foreground">{MAX_BOARDS} au plus</span>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </h1>
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau tableau</DialogTitle>
          </DialogHeader>
          <NewBoardForm closeOnBlur={false} onDone={() => setCreating(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
