"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { EllipsisIcon, PencilIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createCard, deleteList, updateList as saveList } from "@/lib/boards/client";
import { positionAfterLast } from "@/lib/boards/positions";
import { CARD_TITLE_MAX, cleanName, LIMIT_MESSAGES, LIST_NAME_MAX, MAX_CARDS } from "@/lib/boards/rules";
import { imagePathsOfCards, insertList, removeCard, removeList, updateList } from "@/lib/boards/state";
import type { BoardList, Card } from "@/lib/boards/types";
import { cn } from "@/lib/utils";

import { useBoardChange, useBoardStore } from "./board-store";
import { SortableCardTile } from "./card-tile";
import { ConfirmDialog } from "./confirm-dialog";
import { InlineText } from "./inline-text";

// A list of a board (docs/boards.md, "Listes"): 272 px wide, its name (changed with a click), its
// menu, its cards, and "Ajouter une carte" at the bottom.
export function BoardListColumn({ list, onOpenCard }: { list: BoardList; onOpenCard: (cardId: string) => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id,
    data: { type: "list" },
  });
  // The whole list also receives cards, even when it is empty.
  const { setNodeRef: setBodyRef } = useDroppable({ id: `body:${list.id}`, data: { type: "list-body", listId: list.id } });
  const { setBoard } = useBoardStore();
  const change = useBoardChange();
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [composing, setComposing] = useState(false);
  const full = list.cards.length >= MAX_CARDS;

  function rename(name: string) {
    const previous = list.name;
    change({
      apply: (board) => updateList(board, list.id, (l) => ({ ...l, name })),
      save: () => saveList(list.id, { name }),
      undo: (board) => updateList(board, list.id, (l) => ({ ...l, name: previous })),
      error: "La liste n'a pas pu être renommée. Réessayez.",
    });
  }

  function remove() {
    const removed = list;
    setBoard((board) => removeList(board, list.id));
    deleteList(list.id, imagePathsOfCards(list.cards))
      .then(() => toast.success("Liste supprimée", { description: `« ${removed.name} »` }))
      .catch((error) => {
        console.error(error);
        setBoard((board) => insertList(board, removed));
        toast.error("La liste n'a pas pu être supprimée. Réessayez.");
      });
  }

  const count = list.cards.length;
  return (
    <section
      ref={(node) => {
        setNodeRef(node);
        setBodyRef(node);
      }}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      aria-label={list.name}
      className={cn(
        "flex max-h-full w-[272px] shrink-0 flex-col gap-2 border border-border bg-muted p-2",
        isDragging && "z-10 opacity-60",
      )}
    >
      <div className="flex items-center gap-2 py-0.5 pr-0 pl-2">
        {renaming ? (
          <InlineText
            value={list.name}
            label="Nom de la liste"
            maxLength={LIST_NAME_MAX}
            onSave={rename}
            onDone={() => setRenaming(false)}
            className="h-7 text-sm font-semibold"
          />
        ) : (
          <div
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Déplacer la liste « ${list.name} »`}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                setRenaming(true);
                return;
              }
              listeners?.onKeyDown?.(event);
            }}
            className="flex min-w-0 flex-1 cursor-grab items-center gap-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing"
          >
            <h2 className="min-w-0 flex-1 cursor-text truncate text-sm font-semibold" onClick={() => setRenaming(true)}>
              {list.name}
            </h2>
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" className="size-7" aria-label={`Actions de la liste « ${list.name} »`} />}
          >
            <EllipsisIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
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
      </div>

      <div className="-mx-1 flex flex-col overflow-y-auto px-1">
        <SortableContext items={list.cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-2" aria-label={`Cartes de « ${list.name} »`}>
            {list.cards.map((card) => (
              <SortableCardTile key={card.id} card={card} listId={list.id} onOpen={() => onOpenCard(card.id)} />
            ))}
          </ul>
        </SortableContext>
        {composing && <CardComposer list={list} onClose={() => setComposing(false)} />}
      </div>

      {!composing &&
        (full ? (
          <p className="px-2 py-1.5 text-xs text-muted-foreground tabular-nums">
            Liste pleine · {MAX_CARDS} / {MAX_CARDS}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setComposing(true)}
            className="flex h-8 items-center gap-2 px-2 text-left text-sm text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <PlusIcon className="size-4" />
            Ajouter une carte
          </button>
        ))}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Supprimer cette liste ?"
        description={
          count === 0
            ? `La liste « ${list.name} » sera supprimée.`
            : `La liste « ${list.name} » sera supprimée, avec ${count === 1 ? "sa carte" : `ses ${count} cartes`}.`
        }
        confirmLabel="Supprimer la liste"
        onConfirm={remove}
      />
    </section>
  );
}

// Quick add, as in Trello: Enter creates the card and opens an empty field for the next one;
// Escape, the cross or a click elsewhere closes it.
function CardComposer({ list, onClose }: { list: BoardList; onClose: () => void }) {
  const change = useBoardChange();
  const [title, setTitle] = useState("");
  const field = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    field.current?.focus();
    field.current?.scrollIntoView({ block: "nearest" });
  }, [list.cards.length]);

  function add() {
    const value = cleanName(title.replace(/\s*\n\s*/g, " "), CARD_TITLE_MAX);
    if (!value) return;
    if (list.cards.length >= MAX_CARDS) {
      toast.error(LIMIT_MESSAGES.card);
      return;
    }
    const card: Card = {
      id: crypto.randomUUID(),
      title: value,
      description: "",
      position: positionAfterLast(list.cards),
      coverImageId: null,
      checklist: [],
      images: [],
    };
    setTitle("");
    change({
      apply: (board) => updateList(board, list.id, (l) => ({ ...l, cards: [...l.cards, card] })),
      save: () => createCard({ id: card.id, listId: list.id, title: card.title, position: card.position }),
      undo: (board) => removeCard(board, card.id),
      error: "La carte n'a pas pu être ajoutée. Réessayez.",
    });
    if (list.cards.length + 1 >= MAX_CARDS) onClose();
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <textarea
        ref={field}
        value={title}
        maxLength={CARD_TITLE_MAX}
        rows={2}
        aria-label="Titre de la nouvelle carte"
        placeholder="Titre de la carte"
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return;
          if (event.key === "Enter") {
            event.preventDefault();
            add();
          } else if (event.key === "Escape") {
            event.preventDefault();
            onClose();
          }
        }}
        onBlur={(event) => {
          // A click on "Ajouter" keeps the field open; anywhere else closes it.
          if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node | null)) onClose();
        }}
        className="field-sizing-content min-h-16 w-full resize-none border border-ring bg-card px-3 py-2.5 text-sm leading-5 outline-none ring-3 ring-ring/30 placeholder:text-muted-foreground"
      />
      <div className="flex items-center gap-2">
        <Button size="sm" onMouseDown={(event) => event.preventDefault()} onClick={add}>
          Ajouter
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Fermer" onMouseDown={(event) => event.preventDefault()} onClick={onClose}>
          <XIcon />
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">
          <kbd className="border border-border px-1.5 font-sans text-[0.6875rem]">Entrée</kbd> ajoute
        </span>
      </div>
    </div>
  );
}
