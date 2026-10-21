"use client";

import {
  DownloadIcon,
  EllipsisIcon,
  EyeIcon,
  FolderInputIcon,
  FolderOpenIcon,
  GlobeIcon,
  LockIcon,
  PencilIcon,
  PinIcon,
  PinOffIcon,
  Trash2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DriveItem } from "@/lib/drive/types";

import { useDrive } from "./drive-context";

// The "…" menu of an item (docs/drive.md, "Menu « … » d'un élément").
export function ItemMenu({ item }: { item: DriveItem }) {
  const { actions } = useDrive();
  const isFile = item.kind === "file";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={`Actions pour ${item.name}`} />}
      >
        <EllipsisIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {isFile ? (
          <>
            <DropdownMenuItem onClick={() => actions.open(item)}>
              <EyeIcon />
              Aperçu
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => actions.download(item)}>
              <DownloadIcon />
              Télécharger
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onClick={() => actions.open(item)}>
            <FolderOpenIcon />
            Ouvrir
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => actions.rename(item)}>
          <PencilIcon />
          Renommer
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => actions.move([item.id])}>
          <FolderInputIcon />
          Déplacer
        </DropdownMenuItem>
        {isFile && (
          <DropdownMenuItem onClick={() => actions.setPublic([item.id], !item.isPublic)}>
            {item.isPublic ? <LockIcon /> : <GlobeIcon />}
            {item.isPublic ? "Rendre privé" : "Rendre public"}
          </DropdownMenuItem>
        )}
        {isFile && item.isPublic && (
          <DropdownMenuItem onClick={() => actions.feature(item, !item.isFeatured)}>
            {item.isFeatured ? <PinOffIcon /> : <PinIcon />}
            {item.isFeatured ? "Retirer la mise en avant" : "Mettre en avant"}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => actions.remove([item.id])}>
          <Trash2Icon />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
