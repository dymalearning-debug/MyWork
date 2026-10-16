import type { Category, FileCategory } from "./rules";

// Items of "Mes fichiers" (docs/drive.md, "Vocabulaire"): a folder or a file.

export type DriveItem = {
  id: string;
  kind: "folder" | "file";
  name: string;
  category: Category;
  mimeType: string | null;
  // Bytes; null for a folder.
  size: number | null;
  updatedAt: string;
  isPublic: boolean;
  isFeatured: boolean;
  // Signed address of the thumbnail of an image, null without one.
  thumbnailUrl: string | null;
};

export type FolderStep = { id: string; name: string };

// What a folder shows: its path from "Mes fichiers", one page of its items (after the search,
// filter and sort) and their number.
export type DriveFolder = {
  folderId: string | null;
  path: FolderStep[];
  items: DriveItem[];
  total: number;
  // Number of items of the folder, whatever the search and filter.
  folderTotal: number;
};

// In bytes.
export type StorageUsage = { drive: number; profile: number; boards: number; capacity: number };

// A file of the "Ressources" tab.
export type PublicResource = {
  id: string;
  name: string;
  category: FileCategory;
  mimeType: string | null;
  size: number;
  updatedAt: string;
  thumbnailUrl: string | null;
};

export type PublicResources = { featured: PublicResource | null; items: PublicResource[]; total: number };
