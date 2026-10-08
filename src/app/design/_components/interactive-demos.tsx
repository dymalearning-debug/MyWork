"use client"

import { useState } from "react"
import {
  ArrowRightIcon,
  CalendarXIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CopyIcon,
  EllipsisIcon,
  EyeIcon,
  FolderInputIcon,
  GlobeIcon,
  LinkIcon,
  MailIcon,
  PencilIcon,
  Trash2Icon,
  VideoIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function FileActionsMenu({ size = "icon" }: { size?: "icon" | "icon-sm" }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size={size} aria-label="Actions sur le fichier" />}
      >
        <EllipsisIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Fichier</DropdownMenuLabel>
          <DropdownMenuItem>
            <PencilIcon />
            Renommer
            <DropdownMenuShortcut>F2</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FolderInputIcon />
            Déplacer
          </DropdownMenuItem>
          <DropdownMenuItem>
            <LinkIcon />
            Copier le lien
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <Trash2Icon />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppointmentActionsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label="Actions sur le rendez-vous" />}
      >
        <EllipsisIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem>
          <EyeIcon />
          Voir le détail
        </DropdownMenuItem>
        <DropdownMenuItem>
          <MailIcon />
          Écrire au client
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <CalendarXIcon />
          Annuler le rendez-vous
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function TooltipDemo() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button variant="outline" size="icon" aria-label="Copier le lien du profil" />}
      >
        <CopyIcon />
      </TooltipTrigger>
      <TooltipContent>Copier le lien du profil</TooltipContent>
    </Tooltip>
  )
}

export function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="destructive" />}>
        <Trash2Icon data-icon="inline-start" />
        Supprimer le fichier
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <p className="eyebrow text-destructive">Action irréversible</p>
          <DialogTitle>Supprimer « Proposition-commerciale.pdf » ?</DialogTitle>
          <DialogDescription>
            Le fichier sera placé dans la corbeille pendant 30 jours, puis supprimé
            définitivement.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Annuler</DialogClose>
          <DialogClose
            render={<Button variant="destructive" />}
            onClick={() => toast("Fichier placé dans la corbeille")}
          >
            Supprimer
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ToastDemo() {
  return (
    <>
      <Button
        variant="outline"
        onClick={() =>
          toast.success("Rendez-vous confirmé", {
            description: "Mardi 13 octobre · 14:30 — 15:00",
          })
        }
      >
        Succès
      </Button>
      <Button variant="outline" onClick={() => toast.info("Lien copié dans le presse-papiers")}>
        Information
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.error("Échec de l'envoi", { description: "Le fichier dépasse 100 Mo." })
        }
      >
        Erreur
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast("Carte archivée", { action: { label: "Annuler", onClick: () => {} } })
        }
      >
        Avec action
      </Button>
    </>
  )
}

const DAYS = [
  { key: "mon", short: "Lun", date: 12, full: "Lundi 12 octobre", booked: ["09:00", "09:30", "14:00"] },
  { key: "tue", short: "Mar", date: 13, full: "Mardi 13 octobre", booked: ["10:00", "15:00", "15:30"] },
  { key: "wed", short: "Mer", date: 14, full: "Mercredi 14 octobre", booked: "all" },
  { key: "thu", short: "Jeu", date: 15, full: "Jeudi 15 octobre", booked: ["11:00", "16:00"] },
  { key: "fri", short: "Ven", date: 16, full: "Vendredi 16 octobre", booked: ["09:00", "10:30", "11:00"] },
] as const

const SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "14:30", "15:00", "15:30", "16:00"]

function addThirtyMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number)
  const total = hours * 60 + minutes + 30
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}

export function BookingDemo() {
  const [dayKey, setDayKey] = useState<string>("tue")
  const [slot, setSlot] = useState<string | null>("14:30")
  const day = DAYS.find((d) => d.key === dayKey) ?? DAYS[0]

  return (
    <div className="grid border border-border bg-card md:grid-cols-[260px_1fr]">
      <div className="space-y-5 border-b border-border p-6 md:border-r md:border-b-0">
        <div>
          <p className="eyebrow text-muted-foreground">Alex Morgan</p>
          <p className="mt-2 font-heading text-2xl leading-tight font-semibold">Appel découverte</p>
        </div>
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <ClockIcon className="size-3.5" /> 30 min
          </li>
          <li className="flex items-center gap-2">
            <VideoIcon className="size-3.5" /> Visio
          </li>
          <li className="flex items-center gap-2">
            <GlobeIcon className="size-3.5" /> Europe/Paris · UTC+02:00
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Un premier échange pour comprendre votre projet et voir si nous pouvons travailler
          ensemble.
        </p>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Semaine 42 · Octobre 2026</p>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon-sm" aria-label="Semaine précédente">
              <ChevronLeftIcon />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Semaine suivante">
              <ChevronRightIcon />
            </Button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-5 gap-2">
          {DAYS.map((d) => {
            const full = d.booked === "all"
            const selected = d.key === dayKey
            return (
              <button
                key={d.key}
                type="button"
                disabled={full}
                aria-pressed={selected}
                onClick={() => {
                  setDayKey(d.key)
                  setSlot(null)
                }}
                className={cn(
                  "flex flex-col items-center gap-1 border py-3 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  selected
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-foreground",
                  full && "cursor-not-allowed text-muted-foreground line-through opacity-50 hover:border-border"
                )}
              >
                <span className="eyebrow">{d.short}</span>
                <span className="font-heading text-2xl font-semibold lining-nums">{d.date}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {SLOTS.map((time) => {
            const taken = day.booked === "all" || (day.booked as readonly string[]).includes(time)
            const selected = time === slot
            return (
              <button
                key={time}
                type="button"
                disabled={taken}
                aria-pressed={selected}
                onClick={() => setSlot(time)}
                className={cn(
                  "h-9 border text-xs tabular-nums transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-primary hover:text-primary",
                  taken && "cursor-not-allowed text-muted-foreground/60 line-through hover:border-border hover:text-muted-foreground/60"
                )}
              >
                {time}
              </button>
            )
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
          <p className="text-xs text-muted-foreground uppercase">
            {slot ? (
              <>
                <span className="text-foreground">{day.full}</span> · {slot} —{" "}
                {addThirtyMinutes(slot)}
              </>
            ) : (
              "Choisissez un créneau"
            )}
          </p>
          <Button
            disabled={!slot}
            onClick={() =>
              toast.success("Rendez-vous confirmé", {
                description: `${day.full} · ${slot} — ${addThirtyMinutes(slot!)}`,
              })
            }
          >
            Confirmer
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </div>
  )
}
