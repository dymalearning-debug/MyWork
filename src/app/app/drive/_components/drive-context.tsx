"use client";

import { createContext, useContext } from "react";

import type { DriveItem } from "@/lib/drive/types";

// What the items of "Mes fichiers" share: the owner, the selection, the actions of their menu
// and the target of a drop of files.

export type DriveActions = {
  open: (item: DriveItem) => void;
  download: (item: DriveItem) => void;
  rename: (item: DriveItem) => void;
  move: (ids: string[]) => void;
  setPublic: (ids: string[], isPublic: boolean) => void;
  feature: (item: DriveItem, featured: boolean) => void;
  remove: (ids: string[]) => void;
};

export type DriveContextValue = {
  owner: { photoUrl: string | null; initials: string };
  selected: ReadonlySet<string>;
  toggle: (id: string, selected: boolean) => void;
  actions: DriveActions;
  // A folder under files dragged from the computer.
  dropFolderId: string | null;
  // Native drag events of a folder, to receive files from the computer.
  fileDropProps: (folder: DriveItem) => React.HTMLAttributes<HTMLElement>;
};

export const DriveContext = createContext<DriveContextValue | null>(null);

export function useDrive() {
  const value = useContext(DriveContext);
  if (!value) throw new Error("useDrive outside of DriveContext");
  return value;
}
