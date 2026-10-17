"use client"

import {
  CalendarXIcon,
  CopyIcon,
  EllipsisIcon,
  EyeIcon,
  FolderInputIcon,
  LinkIcon,
  MailIcon,
  PencilIcon,
  Trash2Icon,
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
