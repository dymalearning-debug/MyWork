"use client";

import { BoldIcon, ItalicIcon, LinkIcon, ListIcon } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { updateCard as saveCard } from "@/lib/boards/client";
import {
  descriptionKeyAction,
  insertLink,
  newLine,
  toggleBullets,
  toggleWrap,
  type TextEdit,
} from "@/lib/boards/markdown";
import { DESCRIPTION_MAX } from "@/lib/boards/rules";
import { updateCard } from "@/lib/boards/state";
import type { Card } from "@/lib/boards/types";

import { useBoardChange } from "./board-store";
import { MarkdownView } from "./markdown-view";

// Description of a card (docs/boards.md, "Description"): shown formatted; a click edits it, with a
// small toolbar. As in an AI chat: Enter saves, Shift+Enter goes to the line (and carries on a
// list), Escape cancels, Ctrl+B and Ctrl+I put the selection in bold or italic. A click elsewhere
// saves too, so that a long text is never lost.
export function DescriptionField({ card }: { card: Card }) {
  const change = useBoardChange();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(card.description);
  const field = useRef<HTMLTextAreaElement>(null);
  const editor = useRef<HTMLDivElement>(null);
  // Selection to put back after a change made by a key or a button.
  const selection = useRef<{ start: number; end: number } | null>(null);
  // Whether an edit is under way: saved or cancelled once only.
  const open = useRef(false);

  // The text takes the focus as soon as it is shown, before the window would take it back.
  useLayoutEffect(() => {
    if (editing) field.current?.focus();
  }, [editing]);

  useLayoutEffect(() => {
    if (!editing || !field.current) return;
    if (selection.current) {
      field.current.setSelectionRange(selection.current.start, selection.current.end);
      selection.current = null;
    }
  }, [draft, editing]);

  function start() {
    setDraft(card.description);
    selection.current = { start: card.description.length, end: card.description.length };
    open.current = true;
    setEditing(true);
  }

  function save() {
    if (!open.current) return;
    open.current = false;
    setEditing(false);
    const value = draft.replace(/\s+$/, "").slice(0, DESCRIPTION_MAX);
    if (value === card.description) return;
    const previous = card.description;
    change({
      apply: (board) => updateCard(board, card.id, (c) => ({ ...c, description: value })),
      save: () => saveCard(card.id, { description: value }),
      undo: (board) => updateCard(board, card.id, (c) => ({ ...c, description: previous })),
      error: "La description n'a pas pu être enregistrée. Réessayez.",
    });
  }

  function cancel() {
    open.current = false;
    setDraft(card.description);
    setEditing(false);
  }

  function edit(make: (value: string, start: number, end: number) => TextEdit) {
    const textarea = field.current;
    if (!textarea) return;
    const result = make(draft, textarea.selectionStart, textarea.selectionEnd);
    if (result.value.length > DESCRIPTION_MAX) return;
    selection.current = { start: result.selectionStart, end: result.selectionEnd };
    setDraft(result.value);
    textarea.focus();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    const action = descriptionKeyAction({
      key: event.key,
      shiftKey: event.shiftKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      altKey: event.altKey,
      isComposing: event.nativeEvent.isComposing,
    });
    if (!action) return;
    event.preventDefault();
    if (action === "save") save();
    else if (action === "cancel") {
      // The Escape key cancels the edit, not the window of the card.
      event.stopPropagation();
      cancel();
    } else if (action === "newline") edit(newLine);
    else if (action === "bold") edit((v, s, e) => toggleWrap(v, s, e, "**"));
    else if (action === "italic") edit((v, s, e) => toggleWrap(v, s, e, "*"));
  }

  // Buttons of the editor do not take the focus away from the text: no save on their click.
  const keepFocus = (event: React.MouseEvent) => event.preventDefault();

  if (!editing) {
    return (
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h3 className="eyebrow flex-1 text-muted-foreground">Description</h3>
          {card.description && (
            <Button variant="ghost" size="xs" onClick={start}>
              Modifier
            </Button>
          )}
        </div>
        {card.description ? (
          <div className="cursor-text" onClick={start}>
            <MarkdownView value={card.description} />
          </div>
        ) : (
          <button
            type="button"
            onClick={start}
            className="min-h-16 bg-muted px-3.5 py-3 text-left text-sm text-muted-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Ajouter une description…
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-2">
      <h3 className="eyebrow text-muted-foreground">Description</h3>
      <div
        ref={editor}
        onBlur={(event) => {
          if (!editor.current?.contains(event.relatedTarget as Node | null)) save();
        }}
        className="flex flex-col gap-2"
      >
        <div className="border border-ring ring-3 ring-ring/30">
          <div role="toolbar" aria-label="Mise en forme" className="flex gap-0.5 border-b border-border p-1">
            <ToolButton label="Gras (Ctrl+B)" onMouseDown={keepFocus} onClick={() => edit((v, s, e) => toggleWrap(v, s, e, "**"))}>
              <BoldIcon />
            </ToolButton>
            <ToolButton label="Italique (Ctrl+I)" onMouseDown={keepFocus} onClick={() => edit((v, s, e) => toggleWrap(v, s, e, "*"))}>
              <ItalicIcon />
            </ToolButton>
            <ToolButton label="Liste à puces" onMouseDown={keepFocus} onClick={() => edit(toggleBullets)}>
              <ListIcon />
            </ToolButton>
            <ToolButton label="Lien" onMouseDown={keepFocus} onClick={() => edit(insertLink)}>
              <LinkIcon />
            </ToolButton>
          </div>
          <textarea
            ref={field}
            value={draft}
            maxLength={DESCRIPTION_MAX}
            aria-label="Description"
            placeholder="Ajouter une description…"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKeyDown}
            className="field-sizing-content block max-h-[50svh] min-h-30 w-full resize-none bg-transparent px-3.5 py-3 text-sm leading-6 outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onMouseDown={keepFocus} onClick={save}>
            Enregistrer
          </Button>
          <Button variant="ghost" size="sm" onMouseDown={keepFocus} onClick={cancel}>
            Annuler
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            <Kbd>Entrée</Kbd> enregistre · <Kbd>Maj</Kbd> + <Kbd>Entrée</Kbd> va à la ligne
          </span>
        </div>
      </div>
    </section>
  );
}

function ToolButton({
  label,
  children,
  ...props
}: { label: string; children: React.ReactNode } & Pick<React.ComponentProps<typeof Button>, "onClick" | "onMouseDown">) {
  return (
    <Button type="button" variant="ghost" size="icon-sm" className="size-7" aria-label={label} title={label} {...props}>
      {children}
    </Button>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="border border-border px-1.5 font-sans text-[0.6875rem] text-muted-foreground">{children}</kbd>;
}
