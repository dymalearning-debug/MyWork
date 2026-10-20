import { CheckIcon, GlobeIcon, LockIcon } from "lucide-react";
import type { ComponentType } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { BoardsWindow, BookingWindow, DriveWindow, ProfileWindow } from "./feature-windows";
import { LANDING_COLUMN } from "./landing-shell";

// Features block of the landing page (docs/landing.md, "Fonctionnalités"), validated mockup
// "B · Alternance": one row per module, its text on one side and its window on the other, sides
// alternating. Says only what the application already does.

type Feature = {
  module: string;
  visibility: "public" | "private" | "both";
  title: string;
  text: string;
  points: string[];
  Window: ComponentType;
};

const FEATURES: Feature[] = [
  {
    module: "Profil",
    visibility: "public",
    title: "Un profil pro qui vous ressemble.",
    text: "Votre parcours, votre offre et vos projets sur une seule page, à votre adresse. Ce que vous laissez vide n'apparaît pas.",
    points: [
      "Expériences, formation, projets, compétences, langues, recommandations",
      "Offre freelance : disponibilité, prestations, TJM",
      "Export du CV en PDF ou en image, en un clic",
    ],
    Window: ProfileWindow,
  },
  {
    module: "Rendez-vous",
    visibility: "public",
    title: "Vos clients réservent, vous tenez l'appel.",
    text: "Ils choisissent un créneau de 30 minutes sur votre profil et vous rejoignent en visio depuis leur navigateur, sans compte ni installation.",
    points: [
      "Vos horaires, vos jours bloqués, un préavis et une pause entre deux rendez-vous",
      "Visio intégrée, ouverte 15 minutes avant",
      "Confirmation par e-mail et ajout à l'agenda",
    ],
    Window: BookingWindow,
  },
  {
    module: "Tableaux",
    visibility: "private",
    title: "Vos missions, carte par carte.",
    text: "Des listes et des cartes à glisser-déposer pour suivre chaque mission, de la prospection à la facture. Personne d'autre ne les voit.",
    points: [
      "Autant de tableaux que de projets",
      "Description, checklist et images sur chaque carte",
      "Glisser-déposer des listes et des cartes",
    ],
    Window: BoardsWindow,
  },
  {
    module: "Fichiers",
    visibility: "both",
    title: "Vos documents, rangés et partagés.",
    text: "Devis, contrats, livrables : tout est rangé en dossiers. Rendez un fichier public, il apparaît dans l'onglet « Ressources » de votre profil.",
    points: [
      "Dossiers, recherche, tri, aperçu des images et des PDF",
      "10 Go de stockage, 50 Mo par fichier",
      "Un document mis en avant en tête de vos ressources",
    ],
    Window: DriveWindow,
  },
];

const VISIBILITY = {
  public: { label: "Public", Icon: GlobeIcon },
  private: { label: "Privé", Icon: LockIcon },
  both: { label: "Privé ou public", Icon: LockIcon },
} as const;

export function Features({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-16 border-t border-border">
      <div className={`${LANDING_COLUMN} pt-[clamp(4rem,9vw,7rem)] pb-[clamp(3rem,6vw,4.5rem)]`}>
        <div className="grid items-end gap-x-16 gap-y-6 pb-[clamp(2.5rem,5vw,3.5rem)] md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <p className="eyebrow text-muted-foreground tabular-nums">{eyebrow}</p>
            <h2
              id={`${id}-title`}
              className="font-heading text-[clamp(2.25rem,5vw,3rem)] leading-[1.05] font-medium tracking-[-0.01em]"
            >
              {title}
            </h2>
          </div>
          <p className="max-w-[48ch] text-base leading-[25px] text-muted-foreground">
            Présentez votre activité, prenez vos rendez-vous, organisez vos missions. Ce que vous rendez public apparaît
            sur votre lien ; le reste ne regarde que vous.
          </p>
        </div>

        {FEATURES.map((feature, index) => (
          <FeatureRow key={feature.module} feature={feature} number={index + 1} />
        ))}

        <p className="border-t border-border pt-8 text-[0.8125rem] text-muted-foreground">
          Les quatre modules sont inclus dans l&apos;abonnement, sans option payante.
        </p>
      </div>
    </section>
  );
}

function FeatureRow({ feature, number }: { feature: Feature; number: number }) {
  const { label, Icon } = VISIBILITY[feature.visibility];
  const reversed = number % 2 === 0;
  return (
    <article
      aria-labelledby={`feature-${number}-title`}
      className="grid items-center gap-[clamp(2rem,6vw,5rem)] border-t border-border py-[clamp(3rem,6vw,4.5rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
    >
      <div className={cn("flex flex-col gap-4", reversed && "lg:order-2")}>
        <div className="flex flex-wrap items-center gap-3.5">
          <span className="font-heading text-[0.9375rem] text-muted-foreground tabular-nums">
            {String(number).padStart(2, "0")}
          </span>
          <p className="eyebrow text-muted-foreground">{feature.module}</p>
          <Badge variant={feature.visibility === "public" ? "outline" : "secondary"}>
            <Icon data-icon="inline-start" />
            {label}
          </Badge>
        </div>
        <h3
          id={`feature-${number}-title`}
          className="font-heading text-[clamp(1.75rem,3.5vw,2.25rem)] leading-[1.08] font-medium"
        >
          {feature.title}
        </h3>
        <p className="text-base leading-[25px] text-muted-foreground">{feature.text}</p>
        <ul className="flex flex-col gap-2.5 text-sm leading-[21px] text-muted-foreground">
          {feature.points.map((point) => (
            <li key={point} className="flex items-start gap-2.5">
              <CheckIcon aria-hidden className="mt-1 size-3.5 shrink-0 text-foreground" />
              {point}
            </li>
          ))}
        </ul>
      </div>
      <feature.Window />
    </article>
  );
}
