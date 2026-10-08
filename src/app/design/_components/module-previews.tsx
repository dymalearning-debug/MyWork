import {
  ArrowRightIcon,
  CalendarIcon,
  DownloadIcon,
  FileArchiveIcon,
  FileTextIcon,
  FileUserIcon,
  FolderIcon,
  GlobeIcon,
  ImageIcon,
  KanbanIcon,
  Link2Icon,
  ListChecksIcon,
  LockIcon,
  MapPinIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  Share2Icon,
  UploadIcon,
  UserIcon,
} from "lucide-react"

import { StatusDot } from "@/components/status-dot"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

/* ——— Public profile ——— */

export function ProfilePreview() {
  return (
    <div className="bg-spotlight border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <p className="eyebrow text-muted-foreground">mywork / alex-morgan</p>
        <p className="eyebrow flex items-center gap-2 text-muted-foreground">
          <StatusDot pulse /> En ligne
        </p>
      </div>
      <div className="grid gap-10 p-6 md:grid-cols-[auto_1fr] md:p-12">
        <div className="relative flex size-28 items-center justify-center bg-foreground font-heading text-4xl font-semibold text-background">
          AM
        </div>
        <div className="min-w-0">
          <h3 className="font-heading text-5xl leading-none font-medium md:text-6xl">
            Alex Morgan
          </h3>
          <p className="mt-3 text-lg">Product designer freelance</p>
          <ul className="eyebrow mt-5 flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <MapPinIcon className="size-3.5" /> Lyon, France
            </li>
            <li>FR · EN</li>
            <li className="flex items-center gap-2 text-success">
              <StatusDot /> Disponible dès le 3 novembre
            </li>
          </ul>
          <p className="mt-5 max-w-2xl text-muted-foreground">
            J&apos;accompagne les équipes produit de l&apos;idée au lancement : recherche
            utilisateur, prototypes, design systems. Dix ans d&apos;expérience, dont six en
            freelance.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg">
              Réserver un créneau
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
            <Button size="lg" variant="outline">
              <DownloadIcon data-icon="inline-start" />
              Télécharger le CV
            </Button>
            <Button size="icon-lg" variant="ghost" aria-label="Partager le profil">
              <Share2Icon />
            </Button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto border-t border-border px-6 pt-2 md:px-10">
        <Tabs defaultValue="cv">
          <TabsList variant="line">
            <TabsTrigger value="cv">CV</TabsTrigger>
            <TabsTrigger value="booking">Rendez-vous</TabsTrigger>
            <TabsTrigger value="board">Board</TabsTrigger>
            <TabsTrigger value="files">Fichiers</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  )
}

/* ——— CV: attribute matrix, a nod to the hosts' attribute profiles ——— */

const SKILLS = [
  { label: "Design system", value: 19 },
  { label: "Prototypage", value: 18 },
  { label: "Recherche UX", value: 16 },
  { label: "Anglais", value: 17 },
  { label: "Accessibilité", value: 14 },
  { label: "Front-end", value: 12 },
  { label: "Stratégie", value: 13 },
  { label: "Ateliers", value: 15 },
]

const MAX = 20
const RADIUS = 110

function point(index: number, value: number, radius = RADIUS) {
  const angle = (Math.PI * 2 * index) / SKILLS.length - Math.PI / 2
  const r = (value / MAX) * radius
  return { x: Math.cos(angle) * r, y: Math.sin(angle) * r }
}

function polygon(values: number[]) {
  return values
    .map((v, i) => point(i, v))
    .map(({ x, y }) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ")
}

export function AttributeMatrix() {
  return (
    <div className="grid items-center gap-8 border border-border bg-card p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <svg
        viewBox="-230 -150 460 300"
        className="w-full max-w-md justify-self-center"
        role="img"
        aria-label="Matrice des compétences"
      >
        {[5, 10, 15, 20].map((level) => (
          <polygon
            key={level}
            points={polygon(SKILLS.map(() => level))}
            className={cn("fill-none stroke-border", level === MAX && "stroke-foreground/40")}
            strokeWidth={1}
          />
        ))}
        {SKILLS.map((_, i) => {
          const end = point(i, MAX)
          return (
            <line key={i} x1={0} y1={0} x2={end.x} y2={end.y} className="stroke-border" strokeWidth={1} />
          )
        })}
        <polygon
          points={polygon(SKILLS.map((s) => s.value))}
          className="fill-primary/15 stroke-primary"
          strokeWidth={1.5}
        />
        {SKILLS.map((s, i) => {
          const p = point(i, s.value)
          return <rect key={s.label} x={p.x - 2.5} y={p.y - 2.5} width={5} height={5} className="fill-primary" />
        })}
        {SKILLS.map((s, i) => {
          const p = point(i, MAX, RADIUS + 14)
          const anchor = p.x > 5 ? "start" : p.x < -5 ? "end" : "middle"
          return (
            <text
              key={s.label}
              x={p.x}
              y={p.y + (p.y > 5 ? 10 : p.y < -5 ? -2 : 3)}
              textAnchor={anchor}
              className="fill-muted-foreground text-[9px] tracking-[0.14em] uppercase"
            >
              {s.label}
            </text>
          )
        })}
      </svg>

      <div>
        <p className="eyebrow text-muted-foreground">Matrice d&apos;attributs · échelle 0–20</p>
        <ul className="mt-4 space-y-3">
          {SKILLS.map((s) => (
            <li key={s.label} className="grid grid-cols-[110px_1fr_36px] items-center gap-3">
              <span className="truncate text-xs uppercase">{s.label}</span>
              <span className="flex gap-0.5" aria-hidden>
                {Array.from({ length: MAX }, (_, i) => (
                  <span
                    key={i}
                    className={cn("h-3 flex-1", i < s.value ? "bg-foreground" : "bg-muted")}
                  />
                ))}
              </span>
              <span className="text-right text-xs text-muted-foreground tabular-nums">
                {s.value}/{MAX}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const EXPERIENCES = [
  {
    period: "2020 — Auj.",
    role: "Product designer freelance",
    company: "Clients directs et agences",
    text: "Missions de conception produit pour des start-up et des PME : design systems, refontes, tests utilisateurs.",
  },
  {
    period: "2016 — 2020",
    role: "Lead designer",
    company: "Agence Mesa",
    text: "Direction d'une équipe de quatre designers, sur des applications web et mobiles.",
  },
]

export function ExperienceTimeline() {
  return (
    <ol className="border-l border-border">
      {EXPERIENCES.map((xp) => (
        <li key={xp.period} className="relative pb-8 pl-8 last:pb-0">
          <span className="absolute top-1.5 -left-[5px] size-2.5 border border-foreground bg-background" />
          <p className="eyebrow text-muted-foreground">{xp.period}</p>
          <p className="mt-1 font-heading text-xl font-semibold">{xp.role}</p>
          <p className="text-sm text-muted-foreground">{xp.company}</p>
          <p className="mt-2 max-w-xl text-sm">{xp.text}</p>
        </li>
      ))}
    </ol>
  )
}

/* ——— Board ——— */

type BoardCard = {
  title: string
  labels: string[]
  due?: string
  dueSoon?: boolean
  checklist?: [number, number]
  done?: boolean
}

const COLUMNS: { title: string; cards: BoardCard[] }[] = [
  {
    title: "À faire",
    cards: [
      { title: "Maquettes de la page tarifs", labels: ["Design"], due: "18 oct.", checklist: [0, 4] },
      { title: "Préparer l'atelier client", labels: ["Atelier"] },
      { title: "Relancer le devis Sweetwater", labels: ["Admin"], due: "21 oct." },
    ],
  },
  {
    title: "En cours",
    cards: [
      { title: "Design system : composants", labels: ["Design", "Front"], checklist: [3, 5] },
      { title: "Entretiens utilisateurs", labels: ["Recherche"], due: "Demain", dueSoon: true },
    ],
  },
  {
    title: "Terminé",
    cards: [
      { title: "Audit d'accessibilité", labels: ["Recherche"], done: true, checklist: [6, 6] },
      { title: "Facture de septembre", labels: ["Admin"], done: true },
    ],
  },
]

export function BoardPreview() {
  return (
    <div className="border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div className="flex items-center gap-3">
          <p className="font-heading text-xl font-semibold">Roadmap · Refonte Sweetwater</p>
          <VisibilityBadge visibility="public" />
        </div>
        <Button size="sm" variant="outline">
          <PlusIcon data-icon="inline-start" />
          Colonne
        </Button>
      </div>
      <div className="grid gap-4 overflow-x-auto bg-muted p-5 md:grid-cols-3">
        {COLUMNS.map((column) => (
          <div key={column.title} className="min-w-56">
            <div className="mb-3 flex items-center justify-between">
              <p className="eyebrow">{column.title}</p>
              <span className="text-xs text-muted-foreground tabular-nums">
                {String(column.cards.length).padStart(2, "0")}
              </span>
            </div>
            <div className="space-y-3">
              {column.cards.map((card) => (
                <div
                  key={card.title}
                  tabIndex={0}
                  className="cursor-grab border border-transparent bg-background p-4 transition-colors outline-none hover:border-foreground/30 focus-visible:border-foreground"
                >
                  <div className="flex flex-wrap gap-1.5">
                    {card.labels.map((label) => (
                      <Badge key={label} variant="secondary">
                        {label}
                      </Badge>
                    ))}
                  </div>
                  <p
                    className={cn(
                      "mt-2 text-sm font-medium",
                      card.done && "text-muted-foreground line-through"
                    )}
                  >
                    {card.title}
                  </p>
                  {(card.due || card.checklist) && (
                    <div className="mt-3 flex items-center gap-4 text-[0.6875rem] text-muted-foreground uppercase tabular-nums">
                      {card.due && (
                        <span className={cn("flex items-center gap-1", card.dueSoon && "text-warning")}>
                          <CalendarIcon className="size-3" />
                          {card.due}
                        </span>
                      )}
                      {card.checklist && (
                        <span
                          className={cn(
                            "flex items-center gap-1",
                            card.checklist[0] === card.checklist[1] && "text-success"
                          )}
                        >
                          <ListChecksIcon className="size-3" />
                          {card.checklist[0]}/{card.checklist[1]}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="eyebrow flex w-full items-center gap-2 px-1 py-2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <PlusIcon className="size-3.5" />
                Ajouter une carte
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
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
  { label: "CV", icon: FileUserIcon },
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
