import { ArrowRightIcon, CalendarCheckIcon, CheckIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { LANDING_COLUMN } from "./landing-shell";

// "Tarif" block of the landing page (docs/landing.md), validated mockup "B · Deux formules": the
// monthly and the yearly plan side by side, then what both include and how the 7-day trial works.
// The yearly plan carries the only red button; on phones it comes first.

const INCLUDED = [
  "Profil public à votre nom, export du CV en PDF et en image",
  "Prise de rendez-vous en ligne, sans compte pour vos clients",
  "Visio intégrée aux rendez-vous, depuis le navigateur",
  "Tableaux de tâches, listes et cartes",
  "10 Go de fichiers, avec vos documents publics",
  "Données hébergées en Europe",
];

type Plan = {
  id: string;
  name: string;
  price: string;
  period: string;
  was?: string;
  text: string;
  after: string;
  label: string;
  best?: boolean;
};

const PLANS: Plan[] = [
  {
    id: "monthly",
    name: "Mensuel",
    price: "5 €",
    period: "/mois",
    text: "Payé chaque mois. Sans engagement : vous arrêtez quand vous voulez.",
    after: "Puis 5 € par mois",
    label: "Essayer 7 jours, formule mensuelle",
  },
  {
    id: "yearly",
    name: "Annuel",
    price: "50 €",
    period: "/an",
    was: "60 €",
    text: "Payé en une fois pour l'année, soit 4,17 € par mois.",
    after: "Puis 50 € pour un an",
    label: "Essayer 7 jours, formule annuelle",
    best: true,
  },
];

export function Pricing({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-16 border-t border-border">
      <div className={`${LANDING_COLUMN} py-[clamp(4rem,9vw,7rem)]`}>
        <div className="grid items-end gap-x-16 gap-y-5 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <p className="eyebrow text-muted-foreground tabular-nums">{eyebrow}</p>
            <h2
              id={`${id}-title`}
              className="max-w-[16ch] font-heading text-[clamp(2.25rem,5vw,3rem)] leading-[1.05] font-medium tracking-[-0.01em]"
            >
              {title}
            </h2>
          </div>
          <p className="max-w-[48ch] text-base leading-[25px] text-muted-foreground">
            Les deux formules donnent accès à tout MyWork. Seule différence : à l&apos;année, deux mois sont offerts.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)]">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
          <div className="border border-border bg-muted p-[clamp(1.25rem,3vw,2rem)] sm:col-span-2 lg:col-span-1">
            <p className="eyebrow mb-3.5 text-muted-foreground">Inclus dans les deux formules</p>
            <ul className="text-sm leading-5">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-3 border-t border-border py-[11px]">
                  <CheckIcon aria-hidden className="mt-[3px] size-3.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-4 border border-border px-[clamp(1.25rem,3vw,1.5rem)] py-5 sm:items-center sm:gap-6">
          <span className="inline-flex size-10 shrink-0 items-center justify-center border border-border">
            <CalendarCheckIcon aria-hidden className="size-[18px]" strokeWidth={1.5} />
          </span>
          <p className="min-w-0 flex-1 text-sm leading-[21px]">
            <strong className="font-medium">7 jours d&apos;essai gratuit, quelle que soit la formule.</strong>{" "}
            <span className="text-muted-foreground">
              Vous choisissez votre formule et enregistrez votre carte à l&apos;inscription. Rien n&apos;est prélevé
              avant le 8e jour, un e-mail vous prévient avant, et une résiliation pendant l&apos;essai ne coûte rien.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <article
      aria-labelledby={`plan-${plan.id}`}
      className={cn(
        "flex flex-col gap-6 border p-[clamp(1.25rem,3vw,2rem)]",
        plan.best ? "bg-spotlight border-foreground max-sm:-order-1" : "border-border",
      )}
    >
      <div className="flex min-h-[22px] items-center justify-between gap-3">
        <h3 id={`plan-${plan.id}`} className="eyebrow">
          {plan.name}
        </h3>
        {plan.was && <Badge variant="outline">2 mois offerts</Badge>}
      </div>
      <div className="flex flex-col gap-2.5">
        <p className="flex flex-wrap items-baseline gap-2">
          <span className="font-heading text-[clamp(3.5rem,6vw,4.5rem)] leading-[0.9] font-medium tracking-[-0.02em] tabular-nums">
            {plan.price}
          </span>
          <span className="text-[0.9375rem] text-muted-foreground">{plan.period}</span>
          {plan.was && (
            <s className="text-[0.9375rem] text-muted-foreground tabular-nums">
              <span className="sr-only">au lieu de </span>
              {plan.was}
            </s>
          )}
        </p>
        <p className="text-sm leading-[21px] text-muted-foreground">{plan.text}</p>
      </div>
      <div className="mt-auto flex flex-col gap-3">
        <Link
          href={`/signup?plan=${plan.id}`}
          aria-label={plan.label}
          className={cn(buttonVariants({ size: "lg", variant: plan.best ? "default" : "outline" }), "w-full")}
        >
          Essayer 7 jours
          {plan.best && <ArrowRightIcon data-icon="inline-end" />}
        </Link>
        <p className="text-center text-xs leading-[18px] text-muted-foreground">{plan.after}</p>
      </div>
    </article>
  );
}
