"use client";

import {
  closestCenter,
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, horizontalListSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { EllipsisIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  createList,
  deleteBoard,
  failureMessage,
  updateBoard,
  updateCard as saveCard,
  updateList as saveList,
} from "@/lib/boards/client";
import { positionAfterLast, repositionAfterMove, withPositions } from "@/lib/boards/positions";
import {
  BOARD_NAME_MAX,
  BOARDS_PATH,
  boardPath,
  cleanName,
  LAST_BOARD_COOKIE,
  LIMIT_MESSAGES,
  LIST_NAME_MAX,
  MAX_CARDS,
  MAX_LISTS,
} from "@/lib/boards/rules";
import { findCard, imagePathsOfCards, placeCard, removeList, updateList } from "@/lib/boards/state";
import type { Board, BoardList } from "@/lib/boards/types";

import { useBoardChange, useBoardStore } from "./board-store";
import { BoardListColumn } from "./board-list";
import { BoardSwitcher } from "./board-switcher";
import { CardFace } from "./card-tile";
import { ConfirmDialog } from "./confirm-dialog";
import { KEYBOARD_CODES, SCREEN_READER_INSTRUCTIONS, sortableCoordinates } from "./dnd";
import { InlineText } from "./inline-text";

// The open board (docs/boards.md, planche « Tableau »): its name and settings, then its lists side
// by side, which scroll horizontally beyond the screen. Lists and cards move by drag and drop:
// shown at once, saved at the drop, put back with a message if the save fails.
export function BoardView() {
  const { board, setBoard, openCard } = useBoardStore();
  const id = useId();
  const [active, setActive] = useState<{ type: "list" | "card"; id: string } | null>(null);
  // The board when the drag started, to put everything back if it is cancelled or not saved.
  const before = useRef<Board | null>(null);
  const dragging = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableCoordinates, keyboardCodes: KEYBOARD_CODES }),
  );

  // Lists only meet lists; cards meet cards, or the body of a list (an empty list).
  const collisions: CollisionDetection = (args) => {
    const type = args.active.data.current?.type;
    if (type === "list") {
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter((c) => c.data.current?.type === "list"),
      });
    }
    const targets = args.droppableContainers.filter((c) => c.data.current?.type !== "list");
    const within = pointerWithin({ ...args, droppableContainers: targets });
    if (within.length > 0) {
      const card = within.find((hit) => targets.find((c) => c.id === hit.id)?.data.current?.type === "card");
      return card ? [card] : within;
    }
    return closestCorners({ ...args, droppableContainers: targets });
  };

  function listOf(overId: string | number, overType: unknown, overData: Record<string, unknown> | undefined) {
    if (overType === "card") return findCard(board, String(overId))?.list ?? null;
    if (overType === "list-body") return board.lists.find((list) => list.id === overData?.listId) ?? null;
    return null;
  }

  function onDragStart({ active: dragged }: DragStartEvent) {
    before.current = board;
    dragging.current = true;
    setActive({ type: dragged.data.current?.type === "list" ? "list" : "card", id: String(dragged.id) });
  }

  // A card dragged over another list goes into it at once (a full list refuses it).
  function onDragOver({ active: dragged, over }: DragOverEvent) {
    if (dragged.data.current?.type !== "card" || !over) return;
    const from = findCard(board, String(dragged.id));
    const target = listOf(over.id, over.data.current?.type, over.data.current);
    if (!from || !target || target.id === from.list.id) return;
    if (target.cards.length >= MAX_CARDS) {
      toast.error(LIMIT_MESSAGES.card, { id: "list-full" });
      return;
    }
    let index = target.cards.length;
    if (over.data.current?.type === "card") {
      const overIndex = target.cards.findIndex((card) => card.id === over.id);
      const draggedTop = dragged.rect.current.translated?.top ?? 0;
      index = overIndex + (draggedTop > over.rect.top + over.rect.height / 2 ? 1 : 0);
    }
    setBoard((current) => placeCard(current, String(dragged.id), target.id, index));
  }

  function onDragEnd({ active: dragged, over }: DragEndEvent) {
    setActive(null);
    // The click that ends a drag does not open the card.
    setTimeout(() => (dragging.current = false), 0);
    const initial = before.current;
    before.current = null;
    if (!initial) return;
    if (dragged.data.current?.type === "list") moveList(initial, String(dragged.id), over?.id);
    else moveCard(initial, String(dragged.id), over ? String(over.id) : null);
  }

  function onDragCancel() {
    setActive(null);
    dragging.current = false;
    if (before.current) setBoard(before.current);
    before.current = null;
  }

  function moveList(initial: Board, listId: string, overId: string | number | undefined) {
    if (!overId || overId === listId) return;
    const ordered = arrayMove(
      board.lists,
      board.lists.findIndex((list) => list.id === listId),
      board.lists.findIndex((list) => list.id === overId),
    );
    const changes = repositionAfterMove(ordered, listId);
    setBoard({ ...board, lists: withPositions(ordered, changes) });
    Promise.all(changes.map((c) => saveList(c.id, { position: c.position }))).catch((error) => {
      console.error(error);
      setBoard(initial);
      toast.error(failureMessage(error, "La liste n'a pas pu être déplacée. Réessayez."));
    });
  }

  function moveCard(initial: Board, cardId: string, overId: string | null) {
    let current = board;
    const found = findCard(current, cardId);
    if (!found) return;
    // Within the same list: its place among the others.
    if (overId && overId !== cardId) {
      const overIndex = found.list.cards.findIndex((card) => card.id === overId);
      if (overIndex !== -1) {
        current = updateList(current, found.list.id, (list) => ({
          ...list,
          cards: arrayMove(list.cards, found.index, overIndex),
        }));
      }
    }
    const list = current.lists.find((l) => l.id === found.list.id) as BoardList;
    const origin = findCard(initial, cardId);
    const index = list.cards.findIndex((card) => card.id === cardId);
    if (origin && origin.list.id === list.id && origin.index === index) {
      setBoard(current);
      return;
    }
    const changes = repositionAfterMove(list.cards, cardId);
    setBoard(updateList(current, list.id, (l) => ({ ...l, cards: withPositions(l.cards, changes) })));
    const moved = origin?.list.id !== list.id;
    Promise.all(
      changes.map((c) =>
        saveCard(c.id, c.id === cardId && moved ? { listId: list.id, position: c.position } : { position: c.position }),
      ),
    ).catch((error) => {
      console.error(error);
      setBoard(initial);
      toast.error(failureMessage(error, "La carte n'a pas pu être déplacée. Réessayez."));
    });
  }

  const dragged = active?.type === "card" ? findCard(board, active.id)?.card : null;

  return (
    <div className="flex h-svh min-w-0 flex-1 flex-col">
      <BoardHeader />
      <DndContext
        id={id}
        sensors={sensors}
        collisionDetection={collisions}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
        accessibility={{ screenReaderInstructions: SCREEN_READER_INSTRUCTIONS }}
      >
        <div className="flex min-h-0 flex-1 items-start gap-3 overflow-x-auto px-8 py-6">
          <SortableContext items={board.lists.map((list) => list.id)} strategy={horizontalListSortingStrategy}>
            {board.lists.map((list) => (
              <BoardListColumn
                key={list.id}
                list={list}
                onOpenCard={(cardId) => {
                  if (!dragging.current) openCard(cardId);
                }}
              />
            ))}
          </SortableContext>
          <ListAdder />
        </div>
        <DragOverlay dropAnimation={null}>
          {dragged ? (
            <div className="w-[254px] cursor-grabbing">
              <CardFace card={dragged} lifted />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// Name of the board, which switches to another board, and its settings: rename, delete.
function BoardHeader() {
  const { board, boards } = useBoardStore();
  const change = useBoardChange();
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function rename(name: string) {
    const previous = board.name;
    change({
      apply: (b) => ({ ...b, name }),
      save: () => updateBoard(board.id, { name }),
      undo: (b) => ({ ...b, name: previous }),
      error: "Le tableau n'a pas pu être renommé. Réessayez.",
    });
  }

  async function remove() {
    setDeleting(true);
    try {
      await deleteBoard(board.id, imagePathsOfCards(board.lists.flatMap((list) => list.cards)));
      document.cookie = `${LAST_BOARD_COOKIE}=; path=/; max-age=0; samesite=lax`;
      toast.success("Tableau supprimé", { description: `« ${board.name} »` });
      // Straight to another board, or to "Créer mon premier tableau" when none is left.
      const next = boards.find((other) => other.id !== board.id);
      router.replace(next ? boardPath(next.id) : BOARDS_PATH);
    } catch (error) {
      console.error(error);
      setDeleting(false);
      toast.error("Le tableau n'a pas pu être supprimé. Réessayez.");
    }
  }

  return (
    <header className="flex items-center gap-3 border-b border-border px-8 py-5">
      {renaming ? (
        <InlineText
          value={board.name}
          label="Nom du tableau"
          maxLength={BOARD_NAME_MAX}
          onSave={rename}
          onDone={() => setRenaming(false)}
          className="h-8 max-w-xl font-heading text-[26px] font-medium"
        />
      ) : (
        <BoardSwitcher />
      )}
      <div className="flex-1" />
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="icon-sm" aria-label="Réglages du tableau" disabled={deleting} />}>
          <EllipsisIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setRenaming(true)}>
            <PencilIcon />
            Renommer
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2Icon />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Supprimer ce tableau ?"
        description={`Le tableau « ${board.name} » sera supprimé, avec ses listes, ses cartes et leurs images.`}
        confirmLabel="Supprimer le tableau"
        onConfirm={remove}
      />
    </header>
  );
}

// "Ajouter une liste", after the last list; gone once the limit is reached.
function ListAdder() {
  const { board } = useBoardStore();
  const change = useBoardChange();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  if (board.lists.length >= MAX_LISTS) return null;

  function add(event: React.FormEvent) {
    event.preventDefault();
    const value = cleanName(name, LIST_NAME_MAX);
    if (!value) return;
    const list: BoardList = { id: crypto.randomUUID(), name: value, position: positionAfterLast(board.lists), cards: [] };
    setName("");
    setAdding(false);
    change({
      apply: (b) => ({ ...b, lists: [...b.lists, list] }),
      save: () => createList({ id: list.id, boardId: board.id, name: list.name, position: list.position }),
      undo: (b) => removeList(b, list.id),
      error: "La liste n'a pas pu être ajoutée. Réessayez.",
      // The last list allowed: "Ajouter une liste" goes away, the notification says why.
      onSaved: () => {
        if (board.lists.length + 1 >= MAX_LISTS) {
          toast(`${MAX_LISTS} listes au plus`, {
            description: "Supprimez une liste pour en ajouter une autre.",
          });
        }
      },
    });
  }

  if (adding) {
    return (
      <form onSubmit={add} className="flex w-[272px] shrink-0 flex-col gap-2 border border-border bg-muted p-2">
        <Input
          autoFocus
          value={name}
          maxLength={LIST_NAME_MAX}
          placeholder="Nom de la liste"
          aria-label="Nom de la nouvelle liste"
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setAdding(false);
          }}
          onBlur={(event) => {
            if (!event.currentTarget.form?.contains(event.relatedTarget as Node | null)) setAdding(false);
          }}
          className="bg-background"
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm">
            Ajouter la liste
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
            Annuler
          </Button>
        </div>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setAdding(true)}
      className="flex h-11 w-[272px] shrink-0 items-center gap-2 border border-dashed border-input px-4 text-left text-sm text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <PlusIcon className="size-4" />
      Ajouter une liste
    </button>
  );
}
