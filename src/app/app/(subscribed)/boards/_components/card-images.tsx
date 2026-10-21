"use client";

import { ChevronLeftIcon, ChevronRightIcon, EllipsisIcon, ImageIcon, ImageOffIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { addCardImage, deleteCardImage, failureMessage, updateCard as saveCard } from "@/lib/boards/client";
import { boardImageProblem } from "@/lib/boards/images";
import { positionAfterLast } from "@/lib/boards/positions";
import { LIMIT_MESSAGES, MAX_IMAGES } from "@/lib/boards/rules";
import { updateCard } from "@/lib/boards/state";
import type { Card, CardImage } from "@/lib/boards/types";

import { useBoardChange, useBoardStore } from "./board-store";

// Sends images to a card, one after the other (docs/boards.md, "Images"): 5 per card, 5 MB each,
// JPG, PNG, WebP or GIF. The first image of a card becomes its cover.
export function useImageUpload(card: Card) {
  const { userId, setBoard } = useBoardStore();
  const [sending, setSending] = useState(0);

  async function upload(files: File[]) {
    const images = files.filter((file) => file.type.startsWith("image/"));
    if (images.length === 0) return;
    let room = MAX_IMAGES - card.images.length - sending;
    let position = positionAfterLast(card.images) + sending * 1024;
    let needsCover = card.images.length === 0 && sending === 0 && card.coverImageId === null;
    for (const file of images) {
      const problem = boardImageProblem(file);
      if (problem) {
        toast.error(problem, { description: file.name });
        continue;
      }
      if (room <= 0) {
        toast.error(LIMIT_MESSAGES.image);
        break;
      }
      room -= 1;
      const imagePosition = position;
      position += 1024;
      const cover = needsCover;
      needsCover = false;
      setSending((count) => count + 1);
      try {
        const image = await addCardImage(userId, { id: crypto.randomUUID(), cardId: card.id, position: imagePosition }, file);
        setBoard((board) =>
          updateCard(board, card.id, (c) => ({
            ...c,
            images: [...c.images, image].sort((a, b) => a.position - b.position),
            coverImageId: cover ? image.id : c.coverImageId,
          })),
        );
        if (cover) await saveCard(card.id, { coverImageId: image.id });
      } catch (error) {
        console.error(error);
        toast.error(failureMessage(error, "L'image n'a pas pu être envoyée. Réessayez."), { description: file.name });
      } finally {
        setSending((count) => count - 1);
      }
    }
  }

  return { upload, sending };
}

export function CardImages({
  card,
  sending,
  onAdd,
}: {
  card: Card;
  sending: number;
  onAdd: () => void;
}) {
  const change = useBoardChange();
  const { setBoard } = useBoardStore();
  const [viewing, setViewing] = useState<number | null>(null);

  if (card.images.length === 0 && sending === 0) return null;

  function setCover(imageId: string | null) {
    const previous = card.coverImageId;
    change({
      apply: (board) => updateCard(board, card.id, (c) => ({ ...c, coverImageId: imageId })),
      save: () => saveCard(card.id, { coverImageId: imageId }),
      undo: (board) => updateCard(board, card.id, (c) => ({ ...c, coverImageId: previous })),
      error: "La couverture n'a pas pu être changée. Réessayez.",
    });
  }

  // The image leaves the card and the storage. When it was the cover, the next first image takes
  // its place.
  function remove(image: CardImage) {
    const wasCover = card.coverImageId === image.id;
    const rest = card.images.filter((i) => i.id !== image.id);
    const nextCover = wasCover ? (rest[0]?.id ?? null) : card.coverImageId;
    const before = card;
    setViewing(null);
    setBoard((board) => updateCard(board, card.id, (c) => ({ ...c, images: rest, coverImageId: nextCover })));
    deleteCardImage(image.id, image.path)
      .then(async () => {
        if (wasCover && nextCover) await saveCard(card.id, { coverImageId: nextCover });
        toast.success("Image supprimée");
      })
      .catch((error) => {
        console.error(error);
        setBoard((board) =>
          updateCard(board, card.id, (c) => ({ ...c, images: before.images, coverImageId: before.coverImageId })),
        );
        toast.error("L'image n'a pas pu être supprimée. Réessayez.");
      });
  }

  const full = card.images.length + sending >= MAX_IMAGES;
  return (
    <section className="flex flex-col gap-2">
      <h3 className="eyebrow text-muted-foreground">Images</h3>
      <ul className="flex flex-wrap gap-2">
        {card.images.map((image, index) => {
          const isCover = image.id === card.coverImageId;
          return (
            <li key={image.id} className="group/image relative h-[88px] w-[136px] bg-muted">
              <button
                type="button"
                onClick={() => setViewing(index)}
                aria-label={`Agrandir l'image ${index + 1}`}
                className="block size-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {image.url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- signed address, valid for an hour
                  <img src={image.url} alt="" className="size-full object-cover" />
                ) : (
                  <ImageIcon className="m-auto size-5 text-muted-foreground" />
                )}
              </button>
              {isCover && (
                <Badge variant="outline" className="pointer-events-none absolute top-1.5 left-1.5 h-4.5 bg-popover px-1.5 text-[0.5625rem]">
                  Couverture
                </Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="secondary"
                      size="icon-xs"
                      aria-label={`Options de l'image ${index + 1}`}
                      className="absolute top-1.5 right-1.5 opacity-0 group-hover/image:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100"
                    />
                  }
                >
                  <EllipsisIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {isCover ? (
                    <DropdownMenuItem onClick={() => setCover(null)}>
                      <ImageOffIcon />
                      Retirer la couverture
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => setCover(image.id)}>
                      <ImageIcon />
                      Utiliser en couverture
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem variant="destructive" onClick={() => remove(image)}>
                    <Trash2Icon />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          );
        })}
        {Array.from({ length: sending }, (_, index) => (
          <li key={`sending-${index}`} aria-label="Envoi en cours">
            <Skeleton className="h-[88px] w-[136px]" />
          </li>
        ))}
        {!full && (
          <li>
            <Button
              variant="outline"
              className="h-[88px] w-[88px] flex-col gap-1 tabular-nums"
              aria-label="Ajouter une image"
              onClick={onAdd}
            >
              <PlusIcon />
              {card.images.length} / {MAX_IMAGES}
            </Button>
          </li>
        )}
      </ul>
      <ImageViewer images={card.images} index={viewing} onIndexChange={setViewing} />
    </section>
  );
}

// An image shown large, with the arrows to go to the others (also with the keyboard).
function ImageViewer({
  images,
  index,
  onIndexChange,
}: {
  images: CardImage[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
}) {
  const image = index === null ? null : images[index];
  const go = (step: number) => index !== null && onIndexChange((index + step + images.length) % images.length);
  return (
    <Dialog open={!!image} onOpenChange={(open) => !open && onIndexChange(null)}>
      <DialogContent
        className="flex max-h-[calc(100svh-4rem)] flex-col items-center gap-3 bg-popover p-3 sm:max-w-[min(1200px,calc(100%-4rem))]"
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") go(-1);
          if (event.key === "ArrowRight") go(1);
        }}
      >
        <DialogTitle className="sr-only">
          Image {(index ?? 0) + 1} sur {images.length}
        </DialogTitle>
        {image?.url && (
          // eslint-disable-next-line @next/next/no-img-element -- signed address, valid for an hour
          <img src={image.url} alt="" className="max-h-[calc(100svh-9rem)] max-w-full object-contain" />
        )}
        {images.length > 1 && (
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon-sm" aria-label="Image précédente" onClick={() => go(-1)}>
              <ChevronLeftIcon />
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {(index ?? 0) + 1} / {images.length}
            </span>
            <Button variant="ghost" size="icon-sm" aria-label="Image suivante" onClick={() => go(1)}>
              <ChevronRightIcon />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
