"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon } from "lucide-react";
import { useId } from "react";

import { cn } from "@/lib/utils";

// Lists ordered by hand (links, projects, skills, sections…): drag and drop with the handle, or
// with the keyboard (Space on the handle, the arrows, Space again).

export type DragHandle = { label: string; props: React.HTMLAttributes<HTMLButtonElement> };

const SCREEN_READER_INSTRUCTIONS = {
  draggable:
    "Pour déplacer cet élément, appuyez sur Espace ou Entrée, puis utilisez les flèches. Appuyez de nouveau sur Espace ou Entrée pour le déposer, ou sur Échap pour annuler.",
};

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  itemLabel,
  className,
  children,
}: {
  items: T[];
  onReorder: (items: T[]) => void;
  itemLabel: (item: T) => string;
  className?: string;
  children: (item: T, handle: React.ReactNode) => React.ReactNode;
}) {
  const id = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const labelOf = (itemId: string | number) => {
    const item = items.find((candidate) => candidate.id === itemId);
    return item ? itemLabel(item) : "";
  };
  const positionOf = (itemId: string | number) => items.findIndex((item) => item.id === itemId) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `« ${labelOf(active.id)} » saisi, position ${positionOf(active.id)} sur ${items.length}.`,
    onDragOver: ({ active, over }) =>
      over ? `« ${labelOf(active.id)} » en position ${positionOf(over.id)} sur ${items.length}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `« ${labelOf(active.id)} » déposé en position ${positionOf(over.id)} sur ${items.length}.` : undefined,
    onDragCancel: ({ active }) => `Déplacement de « ${labelOf(active.id)} » annulé.`,
  };

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((item) => item.id === active.id);
    const to = items.findIndex((item) => item.id === over.id);
    if (from !== -1 && to !== -1) onReorder(arrayMove(items, from, to));
  }

  return (
    <DndContext
      id={id}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{ announcements, screenReaderInstructions: SCREEN_READER_INSTRUCTIONS }}
    >
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <ul className={cn("flex flex-col gap-2", className)}>
          {items.map((item) => (
            <SortableRow key={item.id} id={item.id} label={itemLabel(item)}>
              {(handle) => children(item, handle)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: (handle: React.ReactNode) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      aria-label={`Déplacer « ${label || "élément sans nom"} »`}
      className="inline-flex size-8 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <GripVerticalIcon className="size-4" />
    </button>
  );
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("relative", isDragging && "z-10 opacity-80")}
    >
      {children(handle)}
    </li>
  );
}
