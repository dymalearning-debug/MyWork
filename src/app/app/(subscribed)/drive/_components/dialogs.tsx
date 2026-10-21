"use client";

import { ChevronRightIcon, FolderIcon, HardDriveIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listFolders } from "@/lib/drive/client";
import { splitExtension } from "@/lib/drive/files";
import { cleanName, ITEM_NAME_MAX } from "@/lib/drive/rules";
import { cn } from "@/lib/utils";

// Small windows of "Mes fichiers": a name (new folder, rename), and the destination of a move.

// "Nouveau dossier" or "Renommer": the name is selected, without its extension for a file.
export function NameDialog({
  open,
  onOpenChange,
  title,
  initialName,
  keepExtension,
  submitLabel,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initialName: string;
  keepExtension: boolean;
  submitLabel: string;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState(initialName);
  const input = useRef<HTMLInputElement>(null);
  const value = cleanName(name);

  useEffect(() => {
    const field = input.current;
    if (!open || !field) return;
    const end = keepExtension ? splitExtension(initialName).base.length : initialName.length;
    // After the opening animation has placed the focus.
    const timer = window.setTimeout(() => {
      field.focus();
      field.setSelectionRange(0, end);
    }, 30);
    return () => window.clearTimeout(timer);
  }, [open, initialName, keepExtension]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!value) return;
            onOpenChange(false);
            if (value !== initialName) onSubmit(value);
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="drive-item-name">Nom</Label>
            <Input
              ref={input}
              id="drive-item-name"
              value={name}
              maxLength={ITEM_NAME_MAX}
              autoComplete="off"
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="contrast" disabled={!value}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type Folder = { id: string; name: string; parentId: string | null };

// "Déplacer": the tree of the folders, from "Mes fichiers". The moved folders and their subfolders
// cannot be chosen, nor the current folder.
export function MoveDialog({
  open,
  onOpenChange,
  count,
  movedIds,
  currentFolderId,
  onMove,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  movedIds: string[];
  currentFolderId: string | null;
  onMove: (folderId: string | null) => void;
}) {
  const [folders, setFolders] = useState<Folder[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [target, setTarget] = useState<string | null>(currentFolderId);

  useEffect(() => {
    if (!open) return;
    let active = true;
    listFolders()
      .then((list) => active && setFolders(list))
      .catch((error: unknown) => {
        console.error(error);
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [open]);

  const children = new Map<string | null, Folder[]>();
  for (const folder of folders ?? []) children.set(folder.parentId, [...(children.get(folder.parentId) ?? []), folder]);
  const moved = new Set(movedIds);

  const rows: { folder: Folder; depth: number; disabled: boolean }[] = [];
  const walk = (parentId: string | null, depth: number, disabled: boolean) => {
    for (const folder of children.get(parentId) ?? []) {
      const off = disabled || moved.has(folder.id);
      rows.push({ folder, depth, disabled: off });
      walk(folder.id, depth + 1, off);
    }
  };
  walk(null, 1, false);

  const title = count > 1 ? `Déplacer ${count} éléments` : "Déplacer";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div role="listbox" aria-label="Destination" className="max-h-80 overflow-y-auto border border-border">
          <TreeRow
            label="Mes fichiers"
            icon={<HardDriveIcon className="size-4" />}
            depth={0}
            selected={target === null}
            disabled={false}
            onSelect={() => setTarget(null)}
          />
          {folders === null && !failed && <p className="px-3 py-2 text-sm text-muted-foreground">Chargement…</p>}
          {failed && <p className="px-3 py-2 text-sm text-destructive">Les dossiers n’ont pas pu être chargés.</p>}
          {rows.map(({ folder, depth, disabled }) => (
            <TreeRow
              key={folder.id}
              label={folder.name}
              icon={<FolderIcon className="size-4" />}
              depth={depth}
              selected={target === folder.id}
              disabled={disabled}
              onSelect={() => setTarget(folder.id)}
            />
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            variant="contrast"
            disabled={target === currentFolderId || folders === null}
            onClick={() => {
              onOpenChange(false);
              onMove(target);
            }}
          >
            Déplacer ici
            <ChevronRightIcon data-icon="inline-end" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TreeRow({
  label,
  icon,
  depth,
  selected,
  disabled,
  onSelect,
}: {
  label: string;
  icon: React.ReactNode;
  depth: number;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={onSelect}
      style={{ paddingLeft: `${12 + depth * 20}px` }}
      className={cn(
        "flex w-full items-center gap-2.5 py-2 pr-3 text-left text-sm outline-none",
        selected ? "bg-foreground text-background" : "hover:bg-muted focus-visible:bg-muted",
        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
      )}
    >
      <span className={cn("shrink-0", selected ? "text-background" : "text-muted-foreground")}>{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}
