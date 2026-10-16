import {
  FileArchiveIcon,
  FileIcon,
  FileImageIcon,
  FileMusicIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileVideoCameraIcon,
  FolderIcon,
  PresentationIcon,
  type LucideProps,
} from "lucide-react";

import type { Category } from "@/lib/drive/rules";

// Icon of an item of the Drive, after its category (docs/drive.md): in "Mes fichiers" and in the
// "Ressources" tab of the public profile.
const ICONS = {
  folder: FolderIcon,
  document: FileTextIcon,
  spreadsheet: FileSpreadsheetIcon,
  presentation: PresentationIcon,
  image: FileImageIcon,
  video: FileVideoCameraIcon,
  audio: FileMusicIcon,
  archive: FileArchiveIcon,
  other: FileIcon,
} satisfies Record<Category, unknown>;

export function FileIconFor({ category, ...props }: { category: Category } & LucideProps) {
  const Icon = ICONS[category];
  return <Icon aria-hidden {...props} />;
}
