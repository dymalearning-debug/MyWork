import {
  CalendarIcon,
  FolderIcon,
  GlobeIcon,
  KanbanIcon,
  Link2Icon,
  LockIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

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
