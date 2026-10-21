"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { ArrowDownIcon, ArrowUpIcon, GlobeIcon, PinIcon } from "lucide-react";
import Link from "next/link";

import { FileIconFor } from "@/components/file-icon";
import { ProfilePhoto } from "@/components/profile-photo";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatSize } from "@/lib/drive/files";
import { folderPath, type Sort } from "@/lib/drive/rules";
import type { DriveItem } from "@/lib/drive/types";
import { cn } from "@/lib/utils";

import { useDrive } from "./drive-context";
import { ItemMenu } from "./item-menu";

// The items of a folder (docs/drive.md, "Affichage liste" and "Affichage grille"). Each item can
// be dragged onto a folder (or a step of the breadcrumb) to move it; a folder also receives files
// dragged from the computer.

// Draggable, and droppable for a folder.
function useItemDnd(item: DriveItem) {
  const drag = useDraggable({ id: item.id, data: { item } });
  const drop = useDroppable({ id: `folder:${item.id}`, data: { folderId: item.id }, disabled: item.kind !== "folder" });
  const { fileDropProps, dropFolderId } = useDrive();
  return {
    setNodeRef: (node: HTMLElement | null) => {
      drag.setNodeRef(node);
      drop.setNodeRef(node);
    },
    nodeProps: {
      ...drag.attributes,
      ...drag.listeners,
      // The keyboard opens and selects; moving is done with "Déplacer".
      tabIndex: undefined,
      role: undefined,
      "aria-roledescription": undefined,
      ...(item.kind === "folder" ? fileDropProps(item) : {}),
    },
    dragging: drag.isDragging,
    // Highlighted under a dragged item or files from the computer.
    over: (drop.isOver && !drag.isDragging) || dropFolderId === item.id,
  };
}

// The name: a link for a folder, a button (preview) for a file.
function ItemName({ item, className }: { item: DriveItem; className?: string }) {
  const { actions } = useDrive();
  if (item.kind === "folder") {
    return (
      <Link href={folderPath(item.id)} draggable={false} className={cn("truncate outline-none hover:underline focus-visible:underline", className)}>
        {item.name}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={() => actions.open(item)}
      className={cn("truncate text-left outline-none hover:underline focus-visible:underline", className)}
    >
      {item.name}
    </button>
  );
}

function Visibility({ item, compact = false }: { item: DriveItem; compact?: boolean }) {
  if (!item.isPublic) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      {item.isFeatured && (
        <span title="Mis en avant sur le profil" className="inline-flex text-foreground">
          <PinIcon aria-label="Mis en avant sur le profil" className="size-3.5" />
        </span>
      )}
      <Badge variant="contrast" className={compact ? "gap-1" : undefined}>
        <GlobeIcon data-icon="inline-start" />
        Public
      </Badge>
    </span>
  );
}

function SelectBox({ item, className }: { item: DriveItem; className?: string }) {
  const { selected, toggle } = useDrive();
  return (
    <Checkbox
      checked={selected.has(item.id)}
      onCheckedChange={(checked) => toggle(item.id, checked)}
      aria-label={`Sélectionner ${item.name}`}
      className={className}
    />
  );
}

// ——— List ———

export function ItemList({
  items,
  sort,
  onSort,
  allSelected,
  onSelectAll,
}: {
  items: DriveItem[];
  sort: Sort;
  onSort: (column: "name" | "date") => void;
  allSelected: boolean;
  onSelectAll: (selected: boolean) => void;
}) {
  const arrow = (column: "name" | "date") => {
    const active = column === "name" ? sort.startsWith("name") : sort.startsWith("date");
    if (!active) return null;
    // Down for the usual order (A → Z, the most recent first), up for the reverse.
    const Icon = sort === "name" || sort === "date" ? ArrowDownIcon : ArrowUpIcon;
    return <Icon aria-hidden className="size-3.5" />;
  };
  const ariaSort = (column: "name" | "date") => {
    if (column === "name") return sort === "name" ? "ascending" : sort === "name-desc" ? "descending" : undefined;
    return sort === "date-asc" ? "ascending" : sort === "date" ? "descending" : undefined;
  };

  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-12 pl-3.5">
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked) => onSelectAll(checked)}
              aria-label="Tout sélectionner"
            />
          </TableHead>
          <TableHead aria-sort={ariaSort("name")}>
            <SortButton label="Nom" onClick={() => onSort("name")} arrow={arrow("name")} />
          </TableHead>
          <TableHead className="w-40">
            <span className="eyebrow text-muted-foreground">Propriétaire</span>
          </TableHead>
          <TableHead className="w-36" aria-sort={ariaSort("date")}>
            <SortButton label="Modifié" onClick={() => onSort("date")} arrow={arrow("date")} />
          </TableHead>
          <TableHead className="w-28">
            <span className="eyebrow text-muted-foreground">Taille</span>
          </TableHead>
          <TableHead className="w-32">
            <span className="eyebrow text-muted-foreground">Visibilité</span>
          </TableHead>
          <TableHead className="w-14">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
      </TableBody>
    </Table>
  );
}

function SortButton({ label, onClick, arrow }: { label: string; onClick: () => void; arrow: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="eyebrow inline-flex items-center gap-1.5 text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground"
    >
      {label}
      {arrow}
    </button>
  );
}

function ItemRow({ item }: { item: DriveItem }) {
  const { owner, selected } = useDrive();
  const { setNodeRef, nodeProps, dragging, over } = useItemDnd(item);
  const isSelected = selected.has(item.id);
  return (
    <TableRow
      ref={setNodeRef}
      {...nodeProps}
      data-state={isSelected ? "selected" : undefined}
      className={cn("h-12", dragging && "opacity-40", over && "bg-primary/10 outline-1 -outline-offset-1 outline-primary")}
    >
      <TableCell className="pl-3.5">
        <SelectBox item={item} />
      </TableCell>
      <TableCell>
        <span className="flex min-w-0 items-center gap-3">
          <FileIconFor category={item.category} className="size-[18px] shrink-0 text-muted-foreground" />
          <ItemName item={item} className={item.kind === "folder" ? "font-medium" : undefined} />
        </span>
      </TableCell>
      <TableCell>
        <span className="inline-flex items-center gap-2 text-muted-foreground">
          <ProfilePhoto url={owner.photoUrl} initials={owner.initials} className="size-[22px] text-[10px]" />
          moi
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums">{formatDate(item.updatedAt)}</TableCell>
      <TableCell className="text-muted-foreground tabular-nums">{item.size === null ? "—" : formatSize(item.size)}</TableCell>
      <TableCell>
        <Visibility item={item} />
      </TableCell>
      <TableCell className="pr-2 text-right">
        <ItemMenu item={item} />
      </TableCell>
    </TableRow>
  );
}

// ——— Grid ———

export function ItemGrid({ items }: { items: DriveItem[] }) {
  const folders = items.filter((item) => item.kind === "folder");
  const files = items.filter((item) => item.kind === "file");
  return (
    <div className="flex flex-col gap-3.5">
      {folders.length > 0 && (
        <section aria-label="Dossiers" className="flex flex-col gap-3.5">
          <p className="eyebrow text-muted-foreground">Dossiers</p>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
            {folders.map((item) => (
              <FolderTile key={item.id} item={item} />
            ))}
          </ul>
        </section>
      )}
      {files.length > 0 && (
        <section aria-label="Fichiers" className={cn("flex flex-col gap-3.5", folders.length > 0 && "mt-2.5")}>
          <p className="eyebrow text-muted-foreground">Fichiers</p>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
            {files.map((item) => (
              <FileCard key={item.id} item={item} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

const tileClass = (selected: boolean, over: boolean, dragging: boolean) =>
  cn(
    "group/tile relative border bg-background transition-colors",
    selected ? "border-foreground bg-muted" : "border-border hover:border-foreground/40",
    over && "border-primary bg-primary/10",
    dragging && "opacity-40",
  );

function FolderTile({ item }: { item: DriveItem }) {
  const { selected } = useDrive();
  const { setNodeRef, nodeProps, dragging, over } = useItemDnd(item);
  const isSelected = selected.has(item.id);
  return (
    <li ref={setNodeRef} {...nodeProps} className={cn(tileClass(isSelected, over, dragging), "flex h-[52px] items-center gap-2.5 pr-1.5 pl-3")}>
      <SelectBox
        item={item}
        className={cn(!isSelected && "opacity-0 group-hover/tile:opacity-100 focus-visible:opacity-100")}
      />
      <FileIconFor category="folder" className="size-[18px] shrink-0 text-muted-foreground" />
      <ItemName item={item} className="min-w-0 flex-1 font-medium" />
      <ItemMenu item={item} />
    </li>
  );
}

function FileCard({ item }: { item: DriveItem }) {
  const { selected, actions } = useDrive();
  const { setNodeRef, nodeProps, dragging, over } = useItemDnd(item);
  const isSelected = selected.has(item.id);
  return (
    <li ref={setNodeRef} {...nodeProps} className={cn(tileClass(isSelected, over, dragging), "flex flex-col")}>
      <div className="relative flex h-[140px] items-center justify-center overflow-hidden border-b border-border bg-muted text-muted-foreground">
        {item.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed address, valid for an hour
          <img src={item.thumbnailUrl} alt="" draggable={false} className="size-full object-cover" />
        ) : (
          <FileIconFor category={item.category} strokeWidth={1.25} className="size-10" />
        )}
        {/* The whole picture opens the preview; the keyboard uses the name. */}
        <button type="button" tabIndex={-1} aria-hidden onClick={() => actions.open(item)} className="absolute inset-0" />
        <span
          className={cn(
            "absolute top-2.5 left-2.5 inline-flex bg-background",
            !isSelected && "opacity-0 group-hover/tile:opacity-100 focus-within:opacity-100",
          )}
        >
          <SelectBox item={item} />
        </span>
        <span className="absolute top-2.5 right-2.5">
          <Visibility item={item} compact />
        </span>
      </div>
      <div className="flex items-center gap-2.5 py-2 pr-1.5 pl-3">
        <FileIconFor category={item.category} className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex min-w-0 flex-1 flex-col">
          <ItemName item={item} className="font-medium" />
          <span className="text-xs text-muted-foreground tabular-nums">
            {item.size === null ? "—" : formatSize(item.size)} · {formatDate(item.updatedAt)}
          </span>
        </span>
        <ItemMenu item={item} />
      </div>
    </li>
  );
}
