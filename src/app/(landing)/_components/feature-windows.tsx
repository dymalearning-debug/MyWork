import { FileTextIcon, FolderIcon, PinIcon, SearchIcon, SquareCheckIcon, VideoIcon } from "lucide-react";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Pictures of the features block (docs/landing.md, mockup "B · Alternance"): each module of the
// private space in a browser window, drawn in code so they follow the theme. Fictitious data;
// hidden from screen readers, the text next to them says the same.

const LABEL = "eyebrow text-[0.625rem] text-muted-foreground";
const HATCH = "bg-[repeating-linear-gradient(135deg,var(--muted)_0_7px,var(--border)_7px_8px)]";

function FeatureWindow({ path, children, className }: { path: string; children: ReactNode; className?: string }) {
  return (
    <div aria-hidden className="min-w-0 border border-border bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-muted px-3 py-2.5">
        <span className="flex gap-1.5">
          <span className="size-[7px] bg-border" />
          <span className="size-[7px] bg-border" />
          <span className="size-[7px] bg-border" />
        </span>
        <span className="flex h-6 min-w-0 flex-1 items-center border border-border bg-background px-2.5 text-[0.6875rem]">
          <span className="truncate">
            <span className="text-muted-foreground">hellomywork.com/</span>
            <span className="font-medium">{path}</span>
          </span>
        </span>
      </div>
      <div className={cn("relative overflow-hidden sm:h-[340px]", className)}>{children}</div>
    </div>
  );
}

export function ProfileWindow() {
  return (
    <FeatureWindow path="app/profile" className="flex flex-col gap-4 bg-spotlight p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <span className="inline-flex size-12 shrink-0 items-center justify-center border border-border bg-muted font-heading text-lg sm:size-[60px] sm:text-[22px]">
          IR
        </span>
        <div className="min-w-0 flex-1">
          <p className={LABEL}>Designer produit · Freelance</p>
          <p className="mt-0.5 font-heading text-2xl leading-none font-medium sm:text-[1.75rem]">Inès Robert</p>
        </div>
        <span className={cn(buttonVariants({ variant: "contrast", size: "sm" }), "max-sm:hidden")}>Exporter le CV</span>
      </div>
      <div className="grid gap-6 sm:grid-cols-5">
        <div className="flex flex-col gap-2 sm:col-span-3">
          <p className={LABEL}>Expériences</p>
          <Line start="Lead designer · Atelier Nord" end="2022 – 2026" />
          <Line start="Designer produit · Studio Oural" end="2019 – 2022" />
          <p className={cn(LABEL, "mt-2")}>Projets</p>
          <div className="grid grid-cols-2 gap-2">
            <span className={cn("h-16 border border-border", HATCH)} />
            <span className={cn("h-16 border border-border", HATCH)} />
          </div>
        </div>
        <div className="flex flex-col gap-2 max-sm:hidden sm:col-span-2">
          {/* The export menu, open under its button */}
          <div className="-mt-3 mb-2 flex w-44 flex-col self-end border border-border bg-background p-1.5 text-xs">
            <span className="bg-accent px-2 py-[7px]">CV en PDF</span>
            <span className="px-2 py-[7px]">CV en image (PNG)</span>
          </div>
          <p className={LABEL}>Offre freelance</p>
          <p className="text-xs">Audit UX, design system, prototypes.</p>
          <p className="text-xs tabular-nums">TJM · 550 €</p>
        </div>
      </div>
    </FeatureWindow>
  );
}

const MEETINGS = [
  {
    day: "Mar. 21",
    time: "10:00",
    name: "Camille Faure · Agence Pivot",
    note: "Refonte du parcours d'inscription",
    now: true,
  },
  {
    day: "Jeu. 23",
    time: "14:30",
    name: "Hugo Marchand",
    note: "Premier échange, design system",
  },
  {
    day: "Ven. 24",
    time: "09:30",
    name: "Léa Bonnet · Maison Lumen",
    note: "Point d'étape du devis",
  },
];

export function BookingWindow() {
  return (
    <FeatureWindow path="app/booking" className="flex flex-col gap-3.5 p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="font-heading text-2xl">Mes rendez-vous</p>
        <span className="text-xs text-muted-foreground tabular-nums">Lun. – ven. · 9:00 – 12:00, 14:00 – 17:00</span>
      </div>
      <ul>
        {MEETINGS.map((meeting) => (
          <li key={meeting.day} className="flex items-center gap-4 border-t border-border py-3">
            <div className="flex w-16 shrink-0 flex-col">
              <span className={LABEL}>{meeting.day}</span>
              <span className="font-heading text-[1.375rem] leading-tight tabular-nums">{meeting.time}</span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col text-xs">
              <span className="truncate font-medium">{meeting.name}</span>
              <span className="truncate text-muted-foreground">{meeting.note}</span>
            </div>
            {meeting.now ? (
              <span className={buttonVariants({ variant: "contrast", size: "sm" })}>
                <VideoIcon data-icon="inline-start" />
                Rejoindre
              </span>
            ) : (
              <span
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "text-muted-foreground max-sm:hidden",
                )}
              >
                Visio · 30 min
              </span>
            )}
          </li>
        ))}
      </ul>
    </FeatureWindow>
  );
}

const COLUMNS = [
  {
    title: "Prospection",
    cards: ["Devis · Maison Lumen", "Relancer Studio Oural"],
  },
  { title: "En cours", cards: ["Refonte appli Atelier Nord", "Audit UX"] },
  { title: "À facturer", cards: ["Ateliers utilisateurs · Oural"] },
  { title: "Payé", cards: ["Kit média · Lumen"] },
];

export function BoardsWindow() {
  return (
    <FeatureWindow path="app/boards" className="flex flex-col gap-3.5 p-5">
      <p className="font-heading text-2xl">Missions 2026</p>
      <div className="grid grid-cols-2 items-start gap-2.5 sm:grid-cols-4">
        {COLUMNS.map((column, index) => (
          <div
            key={column.title}
            className={cn(
              "flex min-w-0 flex-col gap-2 border border-border bg-accent p-2.5",
              index >= 2 && "max-sm:hidden",
            )}
          >
            <span className="truncate text-xs font-medium">
              {column.title} <span className="text-muted-foreground tabular-nums">{column.cards.length}</span>
            </span>
            {column.cards.map((card) => (
              <BoardCard key={card} title={card} />
            ))}
          </div>
        ))}
      </div>
    </FeatureWindow>
  );
}

function BoardCard({ title }: { title: string }) {
  const dragged = title === "Refonte appli Atelier Nord";
  const checklist = title === "Audit UX";
  return (
    <div
      className={cn(
        "flex flex-col gap-[7px] border border-border bg-background px-2.5 py-2 text-xs",
        dragged && "translate-x-1.5 -rotate-2 border-foreground/40",
        title === "Kit média · Lumen" && "text-muted-foreground",
      )}
    >
      {dragged && <span className={cn("h-11", HATCH)} />}
      <span className="break-words">{title}</span>
      {checklist && (
        <>
          <span className="flex items-center gap-1.5 text-muted-foreground tabular-nums">
            <SquareCheckIcon className="size-3" />
            2/4
          </span>
          <span className="h-[3px] bg-border">
            <span className="block h-[3px] w-1/2 bg-foreground" />
          </span>
        </>
      )}
    </div>
  );
}

const FILES = [
  { name: "Atelier Nord", size: "4 fichiers", folder: true },
  { name: "Maison Lumen", size: "7 fichiers", folder: true },
  {
    name: "Etude-de-cas-Atelier-Nord.pdf",
    size: "6,1 Mo",
    isPublic: true,
    featured: true,
  },
  { name: "Tarifs-2026.pdf", size: "860 Ko", isPublic: true },
  { name: "Contrat-Maison-Lumen.pdf", size: "212 Ko" },
  { name: "Livrables-audit-UX.zip", size: "38 Mo" },
];

export function DriveWindow() {
  return (
    <FeatureWindow path="app/drive" className="flex flex-col px-5 py-5 sm:px-6">
      <div className="flex items-center gap-3 pb-2.5">
        <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          Mes fichiers <span className="px-1">/</span> <span className="font-medium text-foreground">Clients</span>
        </p>
        <span className="flex h-6 w-44 items-center gap-1.5 border border-border px-2.5 text-[0.6875rem] text-muted-foreground max-sm:hidden">
          <SearchIcon className="size-3" />
          Rechercher
        </span>
      </div>
      <ul>
        {FILES.map((file) => (
          <li key={file.name} className="flex items-center gap-3 border-b border-border py-[9px] text-xs">
            <span className="inline-flex size-7 shrink-0 items-center justify-center border border-border bg-muted text-muted-foreground">
              {file.folder ? <FolderIcon className="size-3.5" /> : <FileTextIcon className="size-3.5" />}
            </span>
            <span className="min-w-0 flex-1 truncate">{file.name}</span>
            {file.featured && <PinIcon className="size-3.5 shrink-0" />}
            {file.isPublic && (
              <span className="inline-flex h-5 shrink-0 items-center rounded-4xl border border-border px-2 text-[0.625rem] font-medium tracking-[0.12em] uppercase">
                Public
              </span>
            )}
            <span className="w-[72px] shrink-0 text-right text-muted-foreground tabular-nums max-sm:hidden">
              {file.size}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center gap-3 sm:mt-auto">
        <span className="h-1 flex-1 bg-border">
          <span className="block h-1 w-[23%] bg-foreground" />
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">2,3 Go sur 10 Go</span>
      </div>
    </FeatureWindow>
  );
}

function Line({ start, end }: { start: string; end: string }) {
  return (
    <div className="flex justify-between gap-3 border-t border-border py-2 text-xs">
      <span className="truncate">{start}</span>
      <span className="shrink-0 text-muted-foreground tabular-nums">{end}</span>
    </div>
  );
}
