"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  createChecklistItem,
  deleteChecklistItem,
  updateChecklistItem as saveItem,
} from "@/lib/boards/client";
import { positionAfterLast, repositionAfterMove, withPositions } from "@/lib/boards/positions";
import { checklistProgress, CHECKLIST_ITEM_MAX, cleanName, MAX_CHECKLIST_ITEMS } from "@/lib/boards/rules";
import { updateCard } from "@/lib/boards/state";
import type { Card, ChecklistItem } from "@/lib/boards/types";
import { cn } from "@/lib/utils";

import { useBoardChange } from "./board-store";
import { KEYBOARD_CODES, SCREEN_READER_INSTRUCTIONS, sortableAnnouncements, sortableCoordinates } from "./dnd";
import { InlineText } from "./inline-text";

// The checklist of a card (docs/boards.md, "Checklist"): one per card, without a name. Items are
// added one after the other, checked, renamed with a click, ordered by drag and drop, deleted.
export function ChecklistSection({
  card,
  addRequest,
}: {
  card: Card;
  // Changes each time "Checklist" is pressed on the right: opens the field of a new item.
  addRequest: number;
}) {
  const change = useBoardChange();
  const id = useId();
  const [adding, setAdding] = useState(addRequest > 0 && card.checklist.length === 0);
  const closeComposer = useCallback(() => setAdding(false), []);
  const progress = checklistProgress(card.checklist);
  const items = card.checklist;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableCoordinates, keyboardCodes: KEYBOARD_CODES }),
  );

  const [lastRequest, setLastRequest] = useState(addRequest);
  if (addRequest !== lastRequest) {
    setLastRequest(addRequest);
    if (items.length < MAX_CHECKLIST_ITEMS) setAdding(true);
  }

  const setItems = (next: (items: ChecklistItem[]) => ChecklistItem[]) => (board: Parameters<typeof updateCard>[0]) =>
    updateCard(board, card.id, (c) => ({ ...c, checklist: next(c.checklist) }));

  function changeItem(item: ChecklistItem, changes: Partial<Pick<ChecklistItem, "text" | "isDone">>, error: string) {
    change({
      apply: setItems((list) => list.map((i) => (i.id === item.id ? { ...i, ...changes } : i))),
      save: () => saveItem(item.id, changes),
      undo: setItems((list) => list.map((i) => (i.id === item.id ? { ...i, text: item.text, isDone: item.isDone } : i))),
      error,
    });
  }

  function remove(item: ChecklistItem) {
    change({
      apply: setItems((list) => list.filter((i) => i.id !== item.id)),
      save: () => deleteChecklistItem(item.id),
      undo: setItems((list) => [...list, item].sort((a, b) => a.position - b.position)),
      error: "L'élément n'a pas pu être supprimé. Réessayez.",
    });
  }

  function add(text: string) {
    const item: ChecklistItem = { id: crypto.randomUUID(), text, isDone: false, position: positionAfterLast(items) };
    change({
      apply: setItems((list) => [...list, item]),
      save: () => createChecklistItem({ id: item.id, cardId: card.id, text, position: item.position }),
      undo: setItems((list) => list.filter((i) => i.id !== item.id)),
      error: "L'élément n'a pas pu être ajouté. Réessayez.",
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const ordered = arrayMove(
      items,
      items.findIndex((item) => item.id === active.id),
      items.findIndex((item) => item.id === over.id),
    );
    const changes = repositionAfterMove(ordered, String(active.id));
    const previous = items;
    change({
      apply: setItems(() => withPositions(ordered, changes)),
      save: () => Promise.all(changes.map((c) => saveItem(c.id, { position: c.position }))),
      undo: setItems(() => previous),
      error: "L'élément n'a pas pu être déplacé. Réessayez.",
    });
  }

  if (items.length === 0 && !adding) return null;

  const labelOf = (itemId: string | number) => items.find((item) => item.id === itemId)?.text ?? "";
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5">
        <h3 className="eyebrow flex-1 text-muted-foreground">Checklist</h3>
        {items.length > 0 && (
          <span className={cn("text-xs text-muted-foreground tabular-nums", progress.complete && "text-success")}>
            {progress.percent} %
          </span>
        )}
      </div>
      {items.length > 0 && (
        <div
          role="progressbar"
          aria-label="Avancement de la checklist"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress.percent}
          aria-valuetext={`${progress.done} sur ${progress.total}`}
          className="relative h-0.5 bg-border"
        >
          <span
            className={cn("absolute inset-y-0 left-0 bg-foreground transition-all", progress.complete && "bg-success")}
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      )}
      <DndContext
        id={id}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
        accessibility={{
          announcements: sortableAnnouncements(labelOf, (itemId) => items.findIndex((i) => i.id === itemId) + 1, () => items.length),
          screenReaderInstructions: SCREEN_READER_INSTRUCTIONS,
        }}
      >
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col">
            {items.map((item) => (
              <ChecklistRow
                key={item.id}
                item={item}
                onToggle={(isDone) =>
                  changeItem(item, { isDone }, "L'élément n'a pas pu être enregistré. Réessayez.")
                }
                onRename={(text) => changeItem(item, { text }, "L'élément n'a pas pu être renommé. Réessayez.")}
                onRemove={() => remove(item)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      {adding ? (
        <ItemComposer
          count={items.length}
          onAdd={add}
          onClose={closeComposer}
        />
      ) : (
        items.length < MAX_CHECKLIST_ITEMS && (
          <Button variant="secondary" size="sm" className="self-start" onClick={() => setAdding(true)}>
            Ajouter un élément
          </Button>
        )
      )}
    </section>
  );
}

function ChecklistRow({
  item,
  onToggle,
  onRename,
  onRemove,
}: {
  item: ChecklistItem;
  onToggle: (isDone: boolean) => void;
  onRename: (text: string) => void;
  onRemove: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("group/item relative -ml-7 flex items-center gap-2.5 py-1 pl-7", isDragging && "z-10 bg-popover opacity-80")}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        aria-label={`Déplacer « ${item.text} »`}
        className="absolute left-0 inline-flex size-6 cursor-grab touch-none items-center justify-center text-muted-foreground opacity-0 transition-opacity outline-none group-hover/item:opacity-100 hover:text-foreground focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50"
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="size-3.5" />
      </button>
      <Checkbox checked={item.isDone} onCheckedChange={(checked) => onToggle(checked === true)} aria-label={item.text} />
      {renaming ? (
        <InlineText
          value={item.text}
          label="Texte de l'élément"
          maxLength={CHECKLIST_ITEM_MAX}
          onSave={onRename}
          onDone={() => setRenaming(false)}
          className="h-7 text-sm"
        />
      ) : (
        <span
          onClick={() => setRenaming(true)}
          className={cn(
            "min-w-0 flex-1 cursor-text text-sm break-words",
            item.isDone && "text-muted-foreground line-through",
          )}
        >
          {item.text}
        </span>
      )}
      {!renaming && (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Supprimer « ${item.text} »`}
          onClick={onRemove}
          className="opacity-0 group-hover/item:opacity-100 focus-visible:opacity-100"
        >
          <XIcon />
        </Button>
      )}
    </li>
  );
}

// "Ajouter un élément": Enter creates it and keeps an empty field for the next one; Escape closes.
function ItemComposer({ count, onAdd, onClose }: { count: number; onAdd: (text: string) => void; onClose: () => void }) {
  const [text, setText] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const full = count >= MAX_CHECKLIST_ITEMS;

  useEffect(() => {
    if (full) onClose();
    else input.current?.focus();
  }, [count, full, onClose]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = cleanName(text, CHECKLIST_ITEM_MAX);
    if (!value || full) return;
    setText("");
    onAdd(value);
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2"
      onBlur={(event) => {
        if (!text.trim() && !event.currentTarget.contains(event.relatedTarget as Node | null)) onClose();
      }}
    >
      <Input
        ref={input}
        value={text}
        maxLength={CHECKLIST_ITEM_MAX}
        placeholder="Ajouter un élément"
        aria-label="Nouvel élément de la checklist"
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            onClose();
          }
        }}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" variant="secondary">
          Ajouter
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Fermer
        </Button>
      </div>
    </form>
  );
}
