"use client";

import { ArrowRightIcon, ImageIcon, SquareCheckIcon, Trash2Icon, XIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteCard, updateCard as saveCard } from "@/lib/boards/client";
import { BOARD_IMAGE_TYPES } from "@/lib/boards/images";
import { positionAfterLast } from "@/lib/boards/positions";
import { CARD_TITLE_MAX, MAX_CARDS } from "@/lib/boards/rules";
import { findCard, insertCard, removeCard, updateCard } from "@/lib/boards/state";
import type { Card } from "@/lib/boards/types";

import { useBoardChange, useBoardStore } from "./board-store";
import { useImageUpload, CardImages } from "./card-images";
import { ChecklistSection } from "./checklist-section";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DescriptionField } from "./description-field";
import { InlineText } from "./inline-text";

// Window of a card (docs/boards.md, planche « Carte ouverte »): 820 px, the content on the left
// (title, description, checklist, images), the actions on the right. Everything is saved as it
// changes, field by field.
export function CardDialog({ cardId }: { cardId: string | null }) {
  const { board, closeCard } = useBoardStore();
  const found = cardId ? findCard(board, cardId) : null;
  return (
    <Dialog
      open={!!found}
      onOpenChange={(open, details) => {
        if (open) return;
        // Escape in a field being edited cancels the edit; the field handles it.
        const focused = document.activeElement;
        if (details.reason === "escape-key" && focused instanceof HTMLElement && focused.matches("input, textarea")) {
          details.cancel();
          return;
        }
        closeCard();
      }}
    >
      {found && <CardWindow key={found.card.id} card={found.card} listName={found.list.name} listId={found.list.id} />}
    </Dialog>
  );
}

function CardWindow({ card, listName, listId }: { card: Card; listName: string; listId: string }) {
  const { board, setBoard, closeCard } = useBoardStore();
  const change = useBoardChange();
  const [renaming, setRenaming] = useState(false);
  const [checklistRequest, setChecklistRequest] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dropping, setDropping] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  // The window itself takes the focus when it opens, rather than its first button.
  const popup = useRef<HTMLDivElement>(null);
  const { upload, sending } = useImageUpload(card);

  function rename(title: string) {
    const previous = card.title;
    change({
      apply: (b) => updateCard(b, card.id, (c) => ({ ...c, title })),
      save: () => saveCard(card.id, { title }),
      undo: (b) => updateCard(b, card.id, (c) => ({ ...c, title: previous })),
      error: "Le titre n'a pas pu être enregistré. Réessayez.",
    });
  }

  // "Déplacer": at the end of the chosen list.
  function moveTo(targetId: string) {
    const target = board.lists.find((list) => list.id === targetId);
    if (!target || target.id === listId) return;
    const moved = { ...card, position: positionAfterLast(target.cards) };
    change({
      apply: (b) => insertCard(b, target.id, moved),
      save: () => saveCard(card.id, { listId: target.id, position: moved.position }),
      undo: (b) => insertCard(b, listId, card),
      error: "La carte n'a pas pu être déplacée. Réessayez.",
    });
  }

  function remove() {
    closeCard();
    setBoard((b) => removeCard(b, card.id));
    deleteCard(
      card.id,
      card.images.map((image) => image.path),
    )
      .then(() => toast.success("Carte supprimée", { description: `« ${card.title} »` }))
      .catch((error) => {
        console.error(error);
        setBoard((b) => insertCard(b, listId, card));
        toast.error("La carte n'a pas pu être supprimée. Réessayez.");
      });
  }

  const hasFiles = (event: React.DragEvent) => event.dataTransfer.types.includes("Files");

  return (
    <DialogContent
      ref={popup}
      initialFocus={popup}
      showCloseButton={false}
      aria-describedby={undefined}
      className="top-12 grid max-h-[calc(100svh-6rem)] translate-y-0 grid-cols-[minmax(0,1fr)_176px] gap-x-7 gap-y-0 overflow-y-auto rounded-none bg-popover p-7 pb-8 data-[dropping=true]:ring-2 data-[dropping=true]:ring-ring sm:max-w-[820px]"
      data-dropping={dropping}
      onDragOver={(event) => {
        if (!hasFiles(event)) return;
        event.preventDefault();
        setDropping(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropping(false);
      }}
      onDrop={(event) => {
        if (!hasFiles(event)) return;
        event.preventDefault();
        setDropping(false);
        void upload(Array.from(event.dataTransfer.files));
      }}
      onPaste={(event) => {
        const files = Array.from(event.clipboardData.files);
        if (files.length === 0) return;
        event.preventDefault();
        void upload(files);
      }}
    >
      <div className="flex min-w-0 flex-col gap-7">
        <div>
          {renaming ? (
            <InlineText
              multiline
              value={card.title}
              label="Titre de la carte"
              maxLength={CARD_TITLE_MAX}
              onSave={rename}
              onDone={() => setRenaming(false)}
              className="py-0.5 font-heading text-[28px] leading-[34px] font-medium"
            />
          ) : (
            <DialogTitle
              className="cursor-text font-heading text-[28px] leading-[34px] font-medium break-words"
              onClick={() => setRenaming(true)}
            >
              {card.title}
            </DialogTitle>
          )}
          <p className="mt-1.5 text-[0.8125rem] text-muted-foreground">
            dans la liste <span className="underline underline-offset-3">{listName}</span>
          </p>
        </div>
        <DescriptionField card={card} />
        <ChecklistSection card={card} addRequest={checklistRequest} />
        <CardImages card={card} sending={sending} onAdd={() => fileInput.current?.click()} />
      </div>

      <div className="flex flex-col gap-1.5 pt-0.5">
        <div className="mb-4.5 flex justify-end">
          <DialogClose render={<Button variant="ghost" size="icon" aria-label="Fermer" />}>
            <XIcon className="size-4.5" />
          </DialogClose>
        </div>
        <p className="eyebrow mb-1 text-muted-foreground">Ajouter</p>
        <Button variant="secondary" size="sm" className="justify-start" onClick={() => setChecklistRequest((n) => n + 1)}>
          <SquareCheckIcon data-icon="inline-start" />
          Checklist
        </Button>
        <Button variant="secondary" size="sm" className="justify-start" onClick={() => fileInput.current?.click()}>
          <ImageIcon data-icon="inline-start" />
          Images
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept={BOARD_IMAGE_TYPES.join(",")}
          multiple
          hidden
          aria-label="Images à ajouter"
          onChange={(event) => {
            void upload(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
        <p className="eyebrow mt-4.5 mb-1 text-muted-foreground">Actions</p>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="secondary" size="sm" className="justify-start" />}>
            <ArrowRightIcon data-icon="inline-start" />
            Déplacer
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Vers la liste</DropdownMenuLabel>
              {board.lists.map((list) => {
                const current = list.id === listId;
                const full = !current && list.cards.length >= MAX_CARDS;
                return (
                  <DropdownMenuItem key={list.id} disabled={current || full} onClick={() => moveTo(list.id)}>
                    <span className="flex-1 truncate">{list.name}</span>
                    <span className="text-xs text-muted-foreground">{current ? "actuelle" : full ? "pleine" : ""}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="destructive" size="sm" className="justify-start" onClick={() => setConfirmDelete(true)}>
          <Trash2Icon data-icon="inline-start" />
          Supprimer
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Supprimer cette carte ?"
        description={`La carte « ${card.title} » sera supprimée, avec sa description, sa checklist et ses images.`}
        confirmLabel="Supprimer la carte"
        onConfirm={remove}
      />
    </DialogContent>
  );
}
