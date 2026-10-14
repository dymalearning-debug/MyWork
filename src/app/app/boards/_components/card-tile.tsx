"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ImageIcon, SquareCheckIcon, TextIcon } from "lucide-react";

import { checklistProgress } from "@/lib/boards/rules";
import { coverOf } from "@/lib/boards/state";
import type { Card } from "@/lib/boards/types";
import { cn } from "@/lib/utils";

// A card in its list (docs/boards.md, "Dans la liste"): the cover, the title, and the badges for
// the description, the checklist ("3/5", green once everything is checked) and the images.
// A click (or Enter) opens it; it moves by drag and drop, or with Space and the arrows.
export function SortableCardTile({ card, listId, onOpen }: { card: Card; listId: string; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "card", listId },
  });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} className={cn(isDragging && "opacity-40")}>
      <div
        {...attributes}
        {...listeners}
        onClick={onOpen}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onOpen();
            return;
          }
          listeners?.onKeyDown?.(event);
        }}
        className="block cursor-pointer outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <CardFace card={card} />
      </div>
    </li>
  );
}

export function CardFace({ card, lifted = false }: { card: Card; lifted?: boolean }) {
  const cover = coverOf(card);
  const progress = checklistProgress(card.checklist);
  const hasDescription = card.description.trim() !== "";
  const hasMeta = hasDescription || progress.total > 0 || card.images.length > 0;
  return (
    <div
      className={cn(
        "overflow-hidden border border-border bg-card px-3 py-2.5 text-card-foreground transition-colors hover:border-foreground",
        lifted && "border-foreground",
      )}
    >
      {cover && (
        <div className="-mx-3 -mt-2.5 mb-2.5 h-32 bg-muted">
          {cover.url && (
            // eslint-disable-next-line @next/next/no-img-element -- signed address, valid for an hour
            <img src={cover.url} alt="" className="size-full object-cover" />
          )}
        </div>
      )}
      <p className="text-sm leading-5 break-words">{card.title}</p>
      {hasMeta && (
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground tabular-nums">
          {hasDescription && (
            <span className="inline-flex items-center" title="Description">
              <TextIcon className="size-3.5" aria-hidden />
              <span className="sr-only">Description</span>
            </span>
          )}
          {progress.total > 0 && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5",
                progress.complete && "bg-success/12 px-1.5 py-px text-success",
              )}
              title="Checklist"
            >
              <SquareCheckIcon className="size-3.5" aria-hidden />
              <span className="sr-only">Checklist :</span>
              {progress.done}/{progress.total}
            </span>
          )}
          {card.images.length > 0 && (
            <span className="inline-flex items-center gap-1.5" title="Images">
              <ImageIcon className="size-3.5" aria-hidden />
              {card.images.length}
              <span className="sr-only">{card.images.length > 1 ? "images" : "image"}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
