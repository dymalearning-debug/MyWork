"use client";

import { ChevronDownIcon, ChevronUpIcon, CircleAlertIcon, PlusIcon } from "lucide-react";
import { createContext, useContext } from "react";

import { Button } from "@/components/ui/button";
import type { ListName, ProfileContent } from "@/lib/profile/types";
import { cn } from "@/lib/utils";

import type { FieldErrors } from "./fields";

// What every section of "Mon profil" needs: the values being edited, the errors to show, the
// items unfolded, and the confirmation before a removal.

export type ContentUpdate = Partial<ProfileContent> | ((content: ProfileContent) => Partial<ProfileContent>);

export type Editor = {
  userId: string;
  content: ProfileContent;
  update: (change: ContentUpdate) => void;
  errors: FieldErrors;
  // Whether an item has an error (to mark it while it is folded).
  hasErrors: (prefix: string) => boolean;
  isExpanded: (id: string) => boolean;
  toggle: (id: string) => void;
  // The item just added: unfolded, its first field focused.
  justAdded: string | null;
  add: <L extends ListName>(list: L, item: ProfileContent[L][number]) => void;
  // Asks for a confirmation, then removes the item.
  remove: (list: ListName, id: string, name: string) => void;
};

export const EditorContext = createContext<Editor | null>(null);

export function useEditor() {
  const editor = useContext(EditorContext);
  if (!editor) throw new Error("useEditor outside of the profile editor");
  return editor;
}

// Replaces one item of a list.
export function patchItem<L extends ListName>(
  list: L,
  id: string,
  patch: Partial<ProfileContent[L][number]>,
): (content: ProfileContent) => Partial<ProfileContent> {
  return (content) => ({
    [list]: (content[list] as ProfileContent[L][number][]).map((item) => (item.id === id ? { ...item, ...patch } : item)),
  });
}

// One section of the form, with its title (and, for the freelance offer, its switch).
export function EditorSection({
  id,
  title,
  action,
  children,
}: {
  id: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={`section-${id}`}
      aria-labelledby={`section-${id}-title`}
      className="flex scroll-mt-8 flex-col gap-5 border-t border-border py-10 first-of-type:border-t-0"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id={`section-${id}-title`} className="font-heading text-2xl font-semibold">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

// An item of a list (experience, project…), folded on one line, unfolded in place to be edited.
export function ItemCard({
  id,
  errorPrefix,
  title,
  subtitle,
  handle,
  children,
}: {
  id: string;
  errorPrefix: string;
  title: string;
  subtitle?: string;
  handle?: React.ReactNode;
  children: React.ReactNode;
}) {
  const editor = useEditor();
  const expanded = editor.isExpanded(id);
  const invalid = editor.hasErrors(errorPrefix);
  const panelId = `item-${id}`;
  return (
    <div className={cn("border bg-card", expanded ? "border-foreground/40" : "border-border", invalid && "border-destructive")}>
      <div className="flex items-center gap-1 py-1.5 pr-1.5 pl-1.5">
        {handle ?? <span className="w-1.5" />}
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => editor.toggle(id)}
          className="flex min-w-0 flex-1 items-center gap-3 px-1.5 py-1 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="min-w-0 flex-1">
            <span className={cn("block truncate text-sm font-medium", !title && "text-muted-foreground")}>
              {title || "Sans titre"}
            </span>
            {subtitle && <span className="block truncate text-xs text-muted-foreground tabular-nums">{subtitle}</span>}
          </span>
          {invalid && <CircleAlertIcon aria-label="À corriger" className="size-4 shrink-0 text-destructive" />}
          {expanded ? (
            <ChevronUpIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDownIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          )}
        </button>
      </div>
      {expanded && (
        <div id={panelId} className="flex flex-col gap-5 border-t border-border px-5 pt-5 pb-4">
          {children}
        </div>
      )}
    </div>
  );
}

// "Supprimer" at the bottom of an unfolded item.
export function ItemFooter({ list, id, name }: { list: ListName; id: string; name: string }) {
  const editor = useEditor();
  return (
    <div className="flex justify-between gap-3 border-t border-border pt-3">
      <Button type="button" variant="ghost" size="sm" onClick={() => editor.remove(list, id, name)}>
        Supprimer
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => editor.toggle(id)}>
        Replier
      </Button>
    </div>
  );
}

// "Ajouter…" under a list, disabled at its limit.
export function AddButton({ label, disabled, onClick }: { label: string; disabled?: boolean; onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" className="self-start" disabled={disabled} onClick={onClick}>
      <PlusIcon data-icon="inline-start" />
      {label}
    </Button>
  );
}
