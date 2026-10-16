"use client";

import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { FileIconFor } from "@/components/file-icon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { fileUrl } from "@/lib/drive/client";
import { formatDate, formatSize, previewKind, typeLabel } from "@/lib/drive/files";
import type { FileCategory } from "@/lib/drive/rules";
import type { DriveItem } from "@/lib/drive/types";

// Preview of a file (docs/drive.md, "Ouvrir un élément"), in a large window: images and PDF are
// shown; the other types show their icon, their details and "Télécharger". Arrows (and the keys
// ← →) go to the previous or next file of the folder.
export function PreviewDialog({
  userId,
  files,
  fileId,
  onFileChange,
  onDownload,
}: {
  userId: string;
  files: DriveItem[];
  fileId: string | null;
  onFileChange: (id: string | null) => void;
  onDownload: (item: DriveItem) => void;
}) {
  const index = files.findIndex((file) => file.id === fileId);
  const file = index >= 0 ? files[index] : null;
  const previous = index > 0 ? files[index - 1] : null;
  const next = index >= 0 && index < files.length - 1 ? files[index + 1] : null;

  const [urls, setUrls] = useState<Record<string, string | "failed">>({});
  const kind = file ? previewKind(file.category as FileCategory, file.mimeType, file.name) : null;
  const url = file ? urls[file.id] : undefined;

  useEffect(() => {
    if (!file || !kind || urls[file.id]) return;
    let active = true;
    fileUrl(userId, file, false)
      .then((signed) => active && setUrls((current) => ({ ...current, [file.id]: signed })))
      .catch((error: unknown) => {
        console.error(error);
        if (active) setUrls((current) => ({ ...current, [file.id]: "failed" }));
      });
    return () => {
      active = false;
    };
  }, [file, kind, urls, userId]);

  return (
    <Dialog open={!!file} onOpenChange={(open) => !open && onFileChange(null)}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[calc(100svh-4rem)] max-w-[calc(100vw-4rem)] flex-col gap-0 p-0 sm:max-w-[calc(100vw-4rem)]"
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" && previous) onFileChange(previous.id);
          if (event.key === "ArrowRight" && next) onFileChange(next.id);
        }}
      >
        {file && (
          <>
            <div className="flex items-center gap-3 border-b border-border py-2 pr-2 pl-5">
              <FileIconFor category={file.category} className="size-[18px] shrink-0 text-muted-foreground" />
              <DialogTitle className="min-w-0 flex-1 truncate font-sans text-base font-medium">{file.name}</DialogTitle>
              <Button variant="outline" size="sm" onClick={() => onDownload(file)}>
                <DownloadIcon data-icon="inline-start" />
                Télécharger
              </Button>
              <DialogClose render={<Button variant="ghost" size="icon" aria-label="Fermer l’aperçu" />}>
                <XIcon />
              </DialogClose>
            </div>
            <div className="relative flex min-h-0 flex-1 items-center justify-center bg-muted">
              {kind && url && url !== "failed" ? (
                kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element -- signed address, valid for an hour
                  <img src={url} alt={file.name} className="max-h-full max-w-full object-contain" />
                ) : (
                  <iframe src={url} title={file.name} className="size-full border-0 bg-background" />
                )
              ) : kind && url !== "failed" ? (
                <p className="text-sm text-muted-foreground">Chargement…</p>
              ) : (
                <div className="flex flex-col items-center gap-4 text-center">
                  <FileIconFor category={file.category} strokeWidth={1} className="size-20 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground tabular-nums">
                    {typeLabel(file.name, file.category as FileCategory)} · {formatSize(file.size ?? 0)} · Modifié{" "}
                    {formatDate(file.updatedAt)}
                  </p>
                  {url === "failed" && <p className="text-sm text-destructive">L’aperçu n’a pas pu être chargé.</p>}
                  {!kind && <p className="text-sm text-muted-foreground">Pas d’aperçu pour ce type de fichier.</p>}
                  <Button variant="contrast" onClick={() => onDownload(file)}>
                    <DownloadIcon data-icon="inline-start" />
                    Télécharger
                  </Button>
                </div>
              )}
              {previous && (
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Fichier précédent"
                  onClick={() => onFileChange(previous.id)}
                  className="absolute top-1/2 left-4 -translate-y-1/2 bg-background"
                >
                  <ChevronLeftIcon />
                </Button>
              )}
              {next && (
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Fichier suivant"
                  onClick={() => onFileChange(next.id)}
                  className="absolute top-1/2 right-4 -translate-y-1/2 bg-background"
                >
                  <ChevronRightIcon />
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
