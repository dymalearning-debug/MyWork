import {
  CalendarIcon,
  FileArchiveIcon,
  FileTextIcon,
  FolderIcon,
  GlobeIcon,
  ImageIcon,
  KanbanIcon,
  Link2Icon,
  LockIcon,
  SearchIcon,
  SettingsIcon,
  UploadIcon,
  UserIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

import { FileActionsMenu } from "./interactive-demos"

type Visibility = "private" | "public" | "unlisted"

const VISIBILITY = {
  private: { label: "Privé", icon: LockIcon },
  public: { label: "Public", icon: GlobeIcon },
  unlisted: { label: "Non listé", icon: Link2Icon },
} as const

export function VisibilityBadge({ visibility }: { visibility: Visibility }) {
  const { label, icon: Icon } = VISIBILITY[visibility]
  return (
    <Badge variant={visibility === "public" ? "contrast" : "outline"}>
      <Icon data-icon="inline-start" />
      {label}
    </Badge>
  )
}

/* ——— Drive ——— */

const FILES: {
  name: string
  icon: typeof FileTextIcon
  size: string
  modified: string
  visibility: Visibility
  selected?: boolean
}[] = [
  { name: "Livrables", icon: FolderIcon, size: "12 éléments", modified: "14/10/2026", visibility: "private" },
  {
    name: "Proposition-commerciale.pdf",
    icon: FileTextIcon,
    size: "1,2 Mo",
    modified: "12/10/2026",
    visibility: "unlisted",
    selected: true,
  },
  { name: "Moodboard-v2.png", icon: ImageIcon, size: "4,8 Mo", modified: "09/10/2026", visibility: "public" },
  { name: "Sources-figma.zip", icon: FileArchiveIcon, size: "86 Mo", modified: "02/10/2026", visibility: "private" },
]

export function DrivePreview() {
  return (
    <div className="border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <p className="eyebrow text-muted-foreground">
          Drive / Clients / <span className="text-foreground">Sweetwater</span>
        </p>
        <div className="flex items-center gap-2">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher" className="h-8 w-44 pl-8" />
          </div>
          <Button size="sm">
            <UploadIcon data-icon="inline-start" />
            Envoyer
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {["Nom", "Taille", "Modifié", "Visibilité", ""].map((head) => (
                <th key={head} className="eyebrow px-5 py-2.5 font-normal text-muted-foreground">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FILES.map((file) => (
              <tr
                key={file.name}
                className={cn(
                  "border-b border-border transition-colors last:border-b-0 hover:bg-muted/50",
                  file.selected && "bg-muted shadow-[inset_2px_0_0_var(--primary)] hover:bg-muted"
                )}
              >
                <td className="px-5 py-2.5">
                  <span className="flex items-center gap-3 font-medium">
                    <file.icon className="size-4 text-muted-foreground" />
                    {file.name}
                  </span>
                </td>
                <td className="px-5 py-2.5 text-xs text-muted-foreground tabular-nums">
                  {file.size}
                </td>
                <td className="px-5 py-2.5 text-xs text-muted-foreground tabular-nums">
                  {file.modified}
                </td>
                <td className="px-5 py-2.5">
                  <VisibilityBadge visibility={file.visibility} />
                </td>
                <td className="px-3 py-1.5 text-right">
                  <FileActionsMenu size="icon-sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border px-5 py-4">
        <Progress value={32} locale="fr-FR" className="max-w-sm">
          <ProgressLabel className="text-[0.6875rem] font-normal tracking-[0.18em] text-muted-foreground uppercase">
            Stockage · 3,2 Go sur 10 Go
          </ProgressLabel>
          <ProgressValue className="text-xs" />
        </Progress>
      </div>
    </div>
  )
}

/* ——— Private space navigation ——— */

const NAV = [
  { label: "Profil", icon: UserIcon },
  { label: "Rendez-vous", icon: CalendarIcon, active: true, count: 3 },
  { label: "Boards", icon: KanbanIcon },
  { label: "Drive", icon: FolderIcon },
]

export function SidebarPreview() {
  return (
    <aside className="flex h-[440px] w-64 flex-col border border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
        <span className="size-2 bg-primary" />
        <span className="font-heading text-base font-semibold tracking-[0.18em] uppercase">MyWork</span>
      </div>
      <nav className="flex-1 space-y-0.5 p-2">
        <p className="eyebrow px-3 pt-2 pb-2 text-muted-foreground">Modules</p>
        {NAV.map((item) => (
          <a
            key={item.label}
            href="#navigation"
            aria-current={item.active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm transition-colors",
              item.active
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-[inset_2px_0_0_var(--sidebar-primary)]"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            )}
          >
            <item.icon className="size-4" />
            {item.label}
            {item.count && (
              <span className="ml-auto text-[0.6875rem] text-primary tabular-nums">
                {String(item.count).padStart(2, "0")}
              </span>
            )}
          </a>
        ))}
      </nav>
      <div className="space-y-3 border-t border-sidebar-border p-4">
        <a
          href="#navigation"
          className="flex items-center gap-3 text-sm text-muted-foreground hover:text-sidebar-foreground"
        >
          <SettingsIcon className="size-4" />
          Paramètres
        </a>
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center bg-foreground font-heading text-sm font-semibold text-background">
            AM
          </span>
          <div className="min-w-0 text-sm">
            <p className="truncate font-medium">Alex Morgan</p>
            <p className="truncate text-[0.6875rem] text-muted-foreground">alex@exemple.fr</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
