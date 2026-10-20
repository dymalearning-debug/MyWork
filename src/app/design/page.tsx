import { Bodoni_Moda, Cormorant_Garamond } from "next/font/google"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import {
  ArrowRightIcon,
  CalendarX2Icon,
  DownloadIcon,
  InfoIcon,
  Loader2Icon,
  PlusIcon,
  Share2Icon,
} from "lucide-react"

import { Logo } from "@/components/logo"
import { ProfilePhoto } from "@/components/profile-photo"
import { SiteIcon } from "@/components/site-icon"
import { OfflineBanner, PublicPageHeading } from "@/components/public-page"
import { StatusDot } from "@/components/status-dot"
import { ThemeToggle } from "@/components/theme-toggle"
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import {
  AppointmentActionsMenu,
  DialogDemo,
  FileActionsMenu,
  ToastDemo,
  TooltipDemo,
} from "./_components/interactive-demos"
import { BoardBricks } from "./_components/board-bricks"
import { BookingBricks } from "./_components/booking-bricks"
import { DashboardBricks } from "./_components/dashboard-bricks"
import { DriveBricks } from "./_components/drive-bricks"
import { SidebarPreview, VisibilityBadge } from "./_components/module-previews"
import { ProfileBricks } from "./_components/profile-bricks"
import { EmailPreviews } from "./_components/email-previews"
import { Section, Specimen } from "./_components/showcase"

const SECTIONS = [
  { id: "themes", title: "Thèmes" },
  { id: "colors", title: "Couleurs" },
  { id: "typography", title: "Typographie" },
  { id: "effects", title: "Formes et effets" },
  { id: "buttons", title: "Boutons" },
  { id: "forms", title: "Formulaires" },
  { id: "status", title: "Badges et statuts" },
  { id: "navigation", title: "Navigation" },
  { id: "feedback", title: "Retours" },
  { id: "data", title: "Données" },
  { id: "modules", title: "Briques" },
  { id: "brand", title: "Marque" },
  { id: "emails", title: "E-mails" },
]

// Sites whose logo is recognized in the links of a profile, and one that is not (a globe).
const LINK_SITES = [
  "linkedin.com",
  "github.com",
  "malt.fr",
  "x.com",
  "instagram.com",
  "behance.net",
  "dribbble.com",
  "youtube.com",
  "exemple.fr",
]

// Alternative heading fonts, loaded on this page only for comparison.
const bodoni = Bodoni_Moda({ subsets: ["latin"], axes: ["opsz"] })
const cormorant = Cormorant_Garamond({ subsets: ["latin"] })

const HEADING_ALTERNATIVES = [
  {
    name: "Bodoni Moda",
    note: "La didone de la haute couture (Vogue, Dior). Plus contrastée, très chic.",
    className: cn(bodoni.className, "font-medium"),
  },
  {
    name: "Cormorant Garamond",
    note: "Un Garamond classique, très élégant en grand, plus fragile en petit.",
    className: cn(cormorant.className, "font-semibold"),
  },
  {
    name: "Geist seule",
    note: "Aucune sérif : la sobriété contemporaine, une seule police partout.",
    className: "font-sans font-semibold tracking-tight",
  },
]

const PRINCIPLES = [
  {
    title: "Blanc et noir",
    text: "Un blanc franc et une encre profonde, comme une plaquette imprimée.",
  },
  {
    title: "Le rouge pour l'essentiel",
    text: "Un rouge vif et profond, réservé à l'action principale et à la sélection.",
  },
  {
    title: "Sobriété",
    text: "Angles droits, filets fins, beaucoup d'espace. Aucun ornement gratuit.",
  },
  {
    title: "Précision technique",
    text: "Des chiffres alignés, des détails nets : l'ingénierie de Delos, sans ostentation.",
  },
]

const COLORS = [
  { token: "background", name: "Fond", role: "Blanc franc en clair, noir profond en sombre.", swatch: "bg-background" },
  { token: "muted", name: "Gris perle", role: "Zones secondaires, survols.", swatch: "bg-muted" },
  { token: "border", name: "Filet", role: "Bordures et séparateurs, fins et clairs.", swatch: "bg-border" },
  { token: "foreground", name: "Encre", role: "Texte principal, bouton encre.", swatch: "bg-foreground" },
  { token: "muted-foreground", name: "Encre atténuée", role: "Texte secondaire, étiquettes.", swatch: "bg-muted-foreground" },
  { token: "primary", name: "Rouge", role: "Action principale, sélection, focus.", swatch: "bg-primary" },
  { token: "destructive", name: "Alerte", role: "Erreurs et suppressions.", swatch: "bg-destructive" },
  { token: "success", name: "Validation", role: "Confirmations, disponibilité.", swatch: "bg-success" },
  { token: "warning", name: "Attention", role: "Échéances proches, avertissements.", swatch: "bg-warning" },
]

const TYPE_SCALE = [
  {
    label: "Affichage",
    spec: "Newsreader · 500 · 72 px",
    sample: "Réservez",
    className: "font-heading text-7xl leading-none font-medium",
  },
  {
    label: "Titre 1",
    spec: "Newsreader · 500 · 48 px",
    sample: "Mes rendez-vous",
    className: "font-heading text-5xl leading-tight font-medium",
  },
  {
    label: "Titre 2",
    spec: "Newsreader · 600 · 24 px",
    sample: "Appel découverte",
    className: "font-heading text-2xl font-semibold",
  },
  {
    label: "Texte",
    spec: "Geist · 400 · 16 px",
    sample:
      "J'accompagne les équipes produit de l'idée au lancement : recherche utilisateur, prototypes et design systems.",
    className: "max-w-xl text-base",
  },
  {
    label: "Petit texte",
    spec: "Geist · 400 · 14 px",
    sample: "Le lien d'annulation est inclus dans l'e-mail de confirmation.",
    className: "text-sm text-muted-foreground",
  },
  {
    label: "Étiquette",
    spec: "Geist · 500 · capitales espacées · 11 px",
    sample: "Disponibilité · Semaine 42",
    className: "eyebrow",
  },
  {
    label: "Donnée",
    spec: "Geist · chiffres alignés",
    sample: "14:00 — 14:30 · UTC+02:00 · 30 min",
    className: "text-sm tabular-nums",
  },
]

const APPOINTMENTS = [
  { date: "13/10 · 14:30", client: "Inès Robert", type: "Appel découverte", duration: "30 min", status: "confirmed" },
  { date: "14/10 · 10:00", client: "Sweetwater SAS", type: "Atelier de cadrage", duration: "2 h", status: "confirmed" },
  { date: "15/10 · 16:00", client: "Marc Lefèvre", type: "Point d'avancement", duration: "45 min", status: "pending" },
  { date: "16/10 · 09:00", client: "Studio Mesa", type: "Appel découverte", duration: "30 min", status: "cancelled" },
] as const

const APPOINTMENT_STATUS = {
  confirmed: { label: "Confirmé", variant: "success" },
  pending: { label: "En attente", variant: "warning" },
  cancelled: { label: "Annulé", variant: "destructive" },
} as const

const STATS = [
  { label: "Rendez-vous à venir", value: "07", hint: "+2 cette semaine" },
  { label: "Cartes en cours", value: "12", hint: "3 échéances proches" },
  { label: "Fichiers publics", value: "34", hint: "Sur 186 fichiers" },
  { label: "Stockage utilisé", value: "32 %", hint: "3,2 Go sur 10 Go" },
]

const DURATIONS = [
  { value: "15", label: "Appel découverte · 15 min" },
  { value: "30", label: "Appel découverte · 30 min" },
  { value: "60", label: "Atelier · 1 h" },
]

/** Mini profile card rendered inside a forced light or dark theme. */
function ThemePreview({ theme, title }: { theme: "light" | "dark"; title: string }) {
  return (
    <div className={cn(theme, "bg-spotlight border border-border bg-background p-8 text-foreground")}>
      <p className="eyebrow text-muted-foreground">{title}</p>
      <div className="mt-6 border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center bg-foreground font-heading text-xl font-semibold text-background">
            AM
          </div>
          <div className="min-w-0">
            <p className="font-heading text-2xl font-semibold">Alex Morgan</p>
            <p className="text-sm text-muted-foreground">Product designer freelance</p>
            <p className="eyebrow mt-2 flex items-center gap-2 text-success">
              <StatusDot pulse /> Disponible
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button>
            Réserver
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
          <Button variant="outline">CV</Button>
        </div>
      </div>
    </div>
  )
}

export default function DesignPage() {
  // Local design reference only: never served in production.
  if (process.env.NODE_ENV === "production") {
    notFound()
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Logo className="h-6" />
            <span className="eyebrow hidden text-muted-foreground sm:inline">/ Design system</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="eyebrow hidden text-muted-foreground md:inline">Local · v0.3</span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-12 px-6 lg:grid-cols-[180px_minmax(0,1fr)]">
        <nav className="sticky top-14 hidden h-fit py-12 lg:block" aria-label="Sections">
          <ol className="space-y-1">
            {SECTIONS.map((section, i) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="group flex items-baseline gap-3 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span className="text-[0.6875rem] tabular-nums group-hover:text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <main className="min-w-0 space-y-24 py-12">
          {/* Hero */}
          <section className="bg-spotlight -mx-6 -mt-12 px-6 pt-20 md:pt-28">
            <p className="eyebrow text-primary">Identité visuelle · Édition 2026</p>
            <h1 className="mt-6 font-heading text-6xl leading-[0.95] font-medium md:text-8xl">
              Design
              <br />
              system
            </h1>
            <p className="mt-8 max-w-xl text-lg text-muted-foreground">
              Comme la plaquette que Delos remettrait aux futurs visiteurs de son parc : sobre,
              luxueuse, discrètement technologique. Du blanc, de l&apos;encre, et un rouge franc
              pour l&apos;essentiel.
            </p>
            <ol className="mt-16 grid gap-10 border-t border-border pt-10 sm:grid-cols-2 xl:grid-cols-4">
              {PRINCIPLES.map((principle, i) => (
                <li key={principle.title}>
                  <p className="text-xs text-primary tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-3 font-heading text-xl font-semibold">{principle.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{principle.text}</p>
                </li>
              ))}
            </ol>
          </section>

          <Section
            id="themes"
            index="01"
            title="Thèmes"
            description="Deux thèmes, au choix de l'utilisateur, avec le thème du système par défaut. Les mêmes composants, côte à côte."
          >
            <div className="grid gap-6 md:grid-cols-2">
              <ThemePreview theme="light" title="Thème clair · Blanc" />
              <ThemePreview theme="dark" title="Thème sombre · Noir profond" />
            </div>
          </Section>

          <Section
            id="colors"
            index="02"
            title="Couleurs"
            description="Une palette noir et blanc, et une seule couleur de marque : un rouge vif et profond, dans la lignée des grandes maisons. Les cases à cocher restent en encre, pour que le rouge garde sa force ; un interrupteur activé passe au rouge, comme une sélection. Basculez le thème pour voir les deux versions."
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {COLORS.map((color) => (
                <div key={color.token} className="border border-border bg-card">
                  <div className={cn("h-20 border-b border-border", color.swatch)} />
                  <div className="p-3">
                    <p className="text-sm font-medium">{color.name}</p>
                    <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">
                      --{color.token}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">{color.role}</p>
                  </div>
                </div>
              ))}
            </div>
            <Specimen
              label="Dosage"
              hint="Proportions visées sur un écran type."
              className="block"
            >
              <div className="flex h-10 w-full border border-border">
                <div className="flex w-[62%] items-center bg-background px-3">
                  <span className="eyebrow text-muted-foreground">Fond 62 %</span>
                </div>
                <div className="flex w-[22%] items-center border-l border-border bg-muted px-3">
                  <span className="eyebrow truncate text-muted-foreground">Surfaces 22 %</span>
                </div>
                <div className="flex w-[11%] items-center bg-foreground px-3">
                  <span className="eyebrow truncate text-background">Encre</span>
                </div>
                <div className="w-[5%] bg-primary" title="Rouge 5 %" />
              </div>
            </Specimen>
            <Specimen label="Graphiques" hint="Séries de données, dans cet ordre.">
              {["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"].map(
                (swatch) => (
                  <div key={swatch} className="flex items-center gap-2">
                    <span className={cn("size-6 border border-border", swatch)} />
                    <span className="text-xs text-muted-foreground">
                      {swatch.replace("bg-", "")}
                    </span>
                  </div>
                )
              )}
            </Specimen>
          </Section>

          <Section
            id="typography"
            index="03"
            title="Typographie"
            description="Deux polices. Les titres en Newsreader, une sérif éditoriale classique et robuste, dont on ne se lasse pas. Tout le reste en Geist, neutre et lisible. Les étiquettes en petites capitales espacées apportent la précision d'un catalogue."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { name: "Newsreader", role: "Titres et affichage", className: "font-heading font-medium" },
                { name: "Geist", role: "Texte, étiquettes et données", className: "font-sans font-medium" },
              ].map((font) => (
                <div key={font.name} className="bg-muted p-8">
                  <p className={cn("text-6xl leading-none", font.className)}>Aa</p>
                  <p className="mt-6 text-sm font-medium">{font.name}</p>
                  <p className="eyebrow mt-1 text-muted-foreground">{font.role}</p>
                  <p className={cn("mt-4 text-sm break-all text-muted-foreground", font.className, "font-normal")}>
                    ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789
                  </p>
                </div>
              ))}
            </div>
            <Specimen
              label="Autres pistes"
              hint="Pour comparer. Changer de police tient en une ligne."
              className="grid items-stretch gap-4 md:grid-cols-3"
            >
              {HEADING_ALTERNATIVES.map((font) => (
                <div key={font.name} className="border border-border p-6">
                  <p className={cn("text-4xl leading-tight", font.className)}>Alex Morgan</p>
                  <p className={cn("mt-1 text-xl", font.className)}>Mes rendez-vous</p>
                  <p className="mt-6 text-sm font-medium">{font.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{font.note}</p>
                </div>
              ))}
            </Specimen>
            <div className="divide-y divide-border border-y border-border">
              {TYPE_SCALE.map((row) => (
                <div key={row.label} className="grid gap-3 py-6 md:grid-cols-[180px_1fr] md:items-baseline">
                  <div>
                    <p className="eyebrow">{row.label}</p>
                    <p className="mt-1 text-[0.6875rem] text-muted-foreground">{row.spec}</p>
                  </div>
                  <p className={cn("min-w-0 break-words", row.className)}>{row.sample}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section
            id="effects"
            index="04"
            title="Formes et effets"
            description="Peu d'effets, tous discrets : c'est la retenue qui fait le luxe."
          >
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              <div className="bg-muted p-6">
                <div className="flex h-28 items-center justify-center gap-4">
                  <span className="size-16 bg-foreground" />
                  <span className="size-16 border border-foreground/40" />
                  <span className="size-3 rounded-full bg-primary" />
                </div>
                <p className="mt-4 text-sm font-medium">Angles droits</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Rayon zéro, comme une page imprimée. Seuls les boutons radio, les pastilles et
                  les interrupteurs restent ronds.
                </p>
              </div>
              <div className="bg-muted p-6">
                <div className="flex h-28 flex-col justify-center gap-4">
                  <span className="h-px w-full bg-foreground" />
                  <span className="h-px w-3/4 bg-foreground/30" />
                  <span className="h-px w-1/2 bg-border" />
                </div>
                <p className="mt-4 text-sm font-medium">Filets fins</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Des bordures de 1 px, claires, sans ombre portée. La profondeur vient de
                  l&apos;espace.
                </p>
              </div>
              <div className="bg-muted p-6">
                <div className="bg-spotlight h-28 border border-border bg-background" />
                <p className="mt-4 text-sm font-medium">Lumière de studio</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Un halo très doux en haut des grandes zones, comme un objet photographié en
                  studio.
                </p>
              </div>
              <div className="bg-muted p-6">
                <div className="flex h-28 items-center justify-center">
                  <a
                    href="#effects"
                    className="group flex w-48 items-center justify-between border border-border bg-background px-4 py-3 text-sm transition-colors hover:border-foreground"
                  >
                    Survolez-moi
                    <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
                <p className="mt-4 text-sm font-medium">Survol</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Le filet se renforce et la flèche avance. Rien de plus.
                </p>
              </div>
              <div className="bg-muted p-6">
                <div className="flex h-28 flex-col items-center justify-center gap-2">
                  <p className="font-heading text-2xl font-semibold">Réserver</p>
                  <span className="h-px w-12 bg-primary" />
                </div>
                <p className="mt-4 text-sm font-medium">Le rouge en touche</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Un bouton, un filet, une sélection : le rouge reste rare.
                </p>
              </div>
              <div className="bg-muted p-6">
                <div className="flex h-28 flex-col justify-center gap-3">
                  <p className="eyebrow flex items-center gap-2 text-success">
                    <StatusDot pulse /> Disponible
                  </p>
                  <p className="eyebrow flex items-center gap-2 text-warning">
                    <StatusDot tone="warning" /> Occupé
                  </p>
                  <p className="eyebrow flex items-center gap-2 text-muted-foreground">
                    <StatusDot tone="muted" /> Hors ligne
                  </p>
                </div>
                <p className="mt-4 text-sm font-medium">Signal vivant</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Une pulsation lente, réservée à ce qui est en direct.
                </p>
              </div>
            </div>
          </Section>

          <Section id="buttons" index="05" title="Boutons">
            <Specimen label="Variantes" hint="Un seul bouton rouge par écran.">
              <Button>Principal</Button>
              <Button variant="contrast">Encre</Button>
              <Button variant="outline">Contour</Button>
              <Button variant="secondary">Secondaire</Button>
              <Button variant="ghost">Fantôme</Button>
              <Button variant="destructive">Danger</Button>
              <Button variant="link">Lien</Button>
            </Specimen>
            <Specimen label="Tailles">
              <Button size="xs">Très petit</Button>
              <Button size="sm">Petit</Button>
              <Button>Normal</Button>
              <Button size="lg">Grand</Button>
            </Specimen>
            <Specimen label="Avec icône" hint="La flèche avance au survol.">
              <Button>
                Réserver un créneau
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
              <Button variant="outline">
                <DownloadIcon data-icon="inline-start" />
                Télécharger le CV
              </Button>
              <Button variant="contrast" size="icon" aria-label="Ajouter">
                <PlusIcon />
              </Button>
              <Button variant="outline" size="icon" aria-label="Partager">
                <Share2Icon />
              </Button>
            </Specimen>
            <Specimen label="États">
              <Button disabled>Désactivé</Button>
              <Button disabled>
                <Loader2Icon data-icon="inline-start" className="animate-spin" />
                Envoi en cours
              </Button>
            </Specimen>
          </Section>

          <Section id="forms" index="06" title="Formulaires">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Réserver un rendez-vous</CardTitle>
                  <CardDescription>Formulaire public, rempli par un visiteur.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom</Label>
                    <Input id="name" placeholder="Inès Robert" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" defaultValue="ines@" aria-invalid />
                    <p className="text-xs text-destructive">Adresse e-mail incomplète.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type de rendez-vous</Label>
                    <Select items={DURATIONS} defaultValue="30">
                      <SelectTrigger id="type" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATIONS.map((d) => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" placeholder="Quelques mots sur votre projet…" />
                    <p className="text-xs text-muted-foreground">Facultatif · 500 caractères max.</p>
                  </div>
                </CardContent>
                <CardFooter className="justify-end gap-2">
                  <Button variant="ghost">Annuler</Button>
                  <Button>
                    Envoyer
                    <ArrowRightIcon data-icon="inline-end" />
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Réglages</CardTitle>
                  <CardDescription>Cases, boutons radio et interrupteurs.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-3">
                    <p className="eyebrow text-muted-foreground">Durée par défaut</p>
                    <RadioGroup defaultValue="30">
                      {["15", "30", "60"].map((value) => (
                        <Label key={value} className="font-normal">
                          <RadioGroupItem value={value} />
                          {value} minutes
                        </Label>
                      ))}
                    </RadioGroup>
                  </div>
                  <div className="space-y-3">
                    <p className="eyebrow text-muted-foreground">Notifications</p>
                    <Label className="font-normal">
                      <Checkbox defaultChecked />
                      Recevoir un e-mail à chaque réservation
                    </Label>
                    <Label className="font-normal">
                      <Checkbox />
                      Rappel la veille du rendez-vous
                    </Label>
                  </div>
                  <div className="space-y-3">
                    <p className="eyebrow text-muted-foreground">Profil public</p>
                    <Label className="justify-between font-normal">
                      Afficher le module Rendez-vous
                      <Switch defaultChecked />
                    </Label>
                    <Label className="justify-between font-normal">
                      Afficher le board « Roadmap »
                      <Switch />
                    </Label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Section>

          <Section id="status" index="07" title="Badges et statuts">
            <Specimen label="Badges">
              <Badge>Nouveau</Badge>
              <Badge variant="secondary">Design</Badge>
              <Badge variant="outline">Brouillon</Badge>
              <Badge variant="success">Confirmé</Badge>
              <Badge variant="warning">En attente</Badge>
              <Badge variant="destructive">Annulé</Badge>
            </Specimen>
            <Specimen label="Visibilité" hint="Commune à tous les modules.">
              <VisibilityBadge visibility="private" />
              <VisibilityBadge visibility="public" />
              <VisibilityBadge visibility="unlisted" />
            </Specimen>
            <Specimen label="Avatars" hint="Carrés, comme une photo d'identité.">
              <Avatar size="sm">
                <AvatarFallback>AM</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>AM</AvatarFallback>
              </Avatar>
              <Avatar size="lg">
                <AvatarFallback className="bg-foreground font-heading font-semibold text-background">
                  AM
                </AvatarFallback>
              </Avatar>
              <AvatarGroup>
                <Avatar>
                  <AvatarFallback>IR</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarFallback>ML</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarFallback>SM</AvatarFallback>
                </Avatar>
                <AvatarGroupCount className="text-xs">+4</AvatarGroupCount>
              </AvatarGroup>
            </Specimen>
            <Specimen label="Photo du profil" hint="Module Profil. Carrée ; sans photo, les initiales sur un carré à l'encre.">
              <ProfilePhoto url={null} initials="IR" className="size-8 text-sm" />
              <ProfilePhoto url={null} initials="IR" className="size-22 text-3xl" />
              <ProfilePhoto url={null} initials="IR" className="size-32 text-[2.75rem]" />
            </Specimen>
            <Specimen label="Logos des liens" hint="Module Profil. Reconnus d'après l'adresse, sinon un globe.">
              {LINK_SITES.map((site) => (
                <span
                  key={site}
                  className="flex items-center gap-2 border border-border px-2.5 py-1.5 text-xs text-muted-foreground"
                >
                  <SiteIcon url={`https://${site}`} className="text-foreground" />
                  {site}
                </span>
              ))}
            </Specimen>
          </Section>

          <Section id="navigation" index="08" title="Navigation">
            <div className="grid gap-10 xl:grid-cols-[auto_1fr]">
              <div>
                <p className="eyebrow mb-4 text-muted-foreground">Barre latérale · espace privé</p>
                <SidebarPreview />
              </div>
              <div className="min-w-0 space-y-10">
                <Specimen label="Onglets" className="block">
                  <Tabs defaultValue="upcoming">
                    <TabsList>
                      <TabsTrigger value="upcoming">À venir</TabsTrigger>
                      <TabsTrigger value="past">Passés</TabsTrigger>
                      <TabsTrigger value="cancelled">Annulés</TabsTrigger>
                    </TabsList>
                    <TabsContent value="upcoming" className="pt-2 text-muted-foreground">
                      7 rendez-vous à venir.
                    </TabsContent>
                    <TabsContent value="past" className="pt-2 text-muted-foreground">
                      42 rendez-vous passés.
                    </TabsContent>
                    <TabsContent value="cancelled" className="pt-2 text-muted-foreground">
                      3 rendez-vous annulés.
                    </TabsContent>
                  </Tabs>
                </Specimen>
                <Specimen label="Onglets ligne" className="block">
                  <Tabs defaultValue="cv">
                    <TabsList variant="line">
                      <TabsTrigger value="cv">Profil</TabsTrigger>
                      <TabsTrigger value="booking">Rendez-vous</TabsTrigger>
                      <TabsTrigger value="board">Board</TabsTrigger>
                      <TabsTrigger value="files">Fichiers</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </Specimen>
                <Specimen
                  label="Page publique"
                  hint="Bandeau vu par le seul propriétaire d'un profil hors ligne. L'en-tête titré sert aux pages introuvables ; celui d'un profil est dans les briques du module Profil."
                  className="block"
                >
                  <div className="border border-border">
                    <OfflineBanner />
                    <div className="bg-spotlight px-6 pt-10">
                      <PublicPageHeading eyebrow="Erreur 404" title="Page introuvable" />
                    </div>
                  </div>
                </Specimen>
                <Specimen label="Menu" hint="Cliquez sur les trois points.">
                  <FileActionsMenu />
                </Specimen>
                <Specimen label="Infobulle" hint="Survolez l'icône.">
                  <TooltipDemo />
                </Specimen>
              </div>
            </div>
          </Section>

          <Section id="feedback" index="09" title="Retours">
            <Specimen label="Fenêtre modale">
              <DialogDemo />
            </Specimen>
            <Specimen label="Notifications" hint="Apparaissent en bas à droite.">
              <ToastDemo />
            </Specimen>
            <Specimen label="Message" className="block">
              <div className="flex gap-3 bg-muted px-5 py-4 shadow-[inset_2px_0_0_var(--primary)]">
                <InfoIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="text-sm">
                  <p className="font-medium">Votre profil n&apos;est pas encore public.</p>
                  <p className="mt-1 text-muted-foreground">
                    Choisissez les modules à afficher, puis publiez-le en un clic.
                  </p>
                </div>
              </div>
            </Specimen>
            <Specimen label="Progression" className="block">
              <Progress value={68} locale="fr-FR" className="max-w-md">
                <ProgressLabel>Envoi de Sources-figma.zip</ProgressLabel>
                <ProgressValue className="text-xs" />
              </Progress>
            </Specimen>
            <Specimen
              label="Chargement · État vide"
              className="grid items-stretch gap-6 md:grid-cols-2"
            >
              <div className="space-y-3 border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
              <div className="flex flex-col items-center bg-muted px-6 py-8 text-center">
                <CalendarX2Icon className="size-6 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">Aucun rendez-vous à venir</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Partagez votre profil pour recevoir des réservations.
                </p>
                <Button size="sm" variant="outline" className="mt-4">
                  Copier le lien
                </Button>
              </div>
            </Specimen>
          </Section>

          <Section id="data" index="10" title="Données">
            <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 xl:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="border-t border-foreground pt-4">
                  <p className="eyebrow text-muted-foreground">{stat.label}</p>
                  <p className="mt-3 font-heading text-5xl font-medium tabular-nums lining-nums">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
                </div>
              ))}
            </div>
            <Card>
              <CardHeader className="border-b">
                <CardTitle>Rendez-vous à venir</CardTitle>
                <CardDescription>Semaine 42</CardDescription>
                <CardAction>
                  <Button size="sm" variant="outline">
                    Tout voir
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {["Date", "Client", "Type", "Durée", "Statut"].map((head) => (
                        <TableHead
                          key={head}
                          className="eyebrow font-normal text-muted-foreground first:pl-4"
                        >
                          {head}
                        </TableHead>
                      ))}
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {APPOINTMENTS.map((appointment) => {
                      const status = APPOINTMENT_STATUS[appointment.status]
                      return (
                        <TableRow key={appointment.date}>
                          <TableCell className="pl-4 text-xs tabular-nums">
                            {appointment.date}
                          </TableCell>
                          <TableCell className="font-medium">{appointment.client}</TableCell>
                          <TableCell className="text-muted-foreground">{appointment.type}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {appointment.duration}
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell className="pr-4 text-right">
                            <AppointmentActionsMenu />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Section>

          <Section
            id="modules"
            index="11"
            title="Briques de l'application"
            description="Les composants assemblés pour chaque module, avec des données fictives."
          >
            <Suspense fallback={<Skeleton className="h-96" />}>
              <ProfileBricks />
            </Suspense>
            <BookingBricks />
            <DashboardBricks />
            <BoardBricks />
            {/* The dates of the list are read at the visit ("14:32" today). */}
            <Suspense fallback={<Skeleton className="h-96" />}>
              <DriveBricks />
            </Suspense>
          </Section>

          <Section
            id="brand"
            index="12"
            title="Marque"
            description="Le nom MyWork en Newsreader, dont le M est porté par un carré rouge. Le carré seul sert d'icône. Les fichiers sont dans public/brand ; dans l'interface, utiliser le composant Logo."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex h-40 items-center justify-center border border-border bg-background">
                <Logo className="h-10" />
              </div>
              <div className="dark flex h-40 items-center justify-center bg-background text-foreground">
                <Logo className="h-10" />
              </div>
            </div>
            <Specimen label="Variantes" hint="lockup, mark, wordmark">
              <Logo />
              <Logo variant="mark" />
              <Logo variant="wordmark" />
            </Specimen>
            <Specimen label="Icône" hint="Onglet du navigateur, écran d'accueil du téléphone.">
              <Logo variant="mark" className="size-4" />
              <Logo variant="mark" className="size-8" />
              <Logo variant="mark" className="size-12" />
              <Logo variant="mark" className="size-20" />
            </Specimen>
            <Specimen
              label="Règles"
              hint="Pour un usage hors de l'application."
              className="block max-w-xl space-y-2 text-sm text-muted-foreground"
            >
              <p>Laisser autour du logo un espace au moins égal à la moitié du carré.</p>
              <p>Sur fond sombre, prendre la version blanche ; le carré reste rouge.</p>
              <p>Ne pas déformer, recolorer ni réécrire le nom dans une autre police.</p>
            </Specimen>
          </Section>

          <Section
            id="emails"
            index="13"
            title="E-mails"
            description="Les e-mails de Supabase Auth et ceux des rendez-vous, aux couleurs de MyWork. Prêts, mais pas encore actifs : ils demandent notre propre service d'envoi (Resend). Les messageries ne comprennent ni les variables CSS ni les polices web : couleurs en valeurs fixes, Georgia et Helvetica en secours, logo en image."
          >
            <EmailPreviews />
          </Section>

          <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
            <p className="eyebrow text-muted-foreground">MyWork · Identité visuelle</p>
            <p className="eyebrow text-muted-foreground">Document de travail · Usage interne</p>
          </footer>
        </main>
      </div>
    </div>
  )
}
