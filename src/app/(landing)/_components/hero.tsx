import { ArrowRightIcon, CheckIcon } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

import { HeroShowcase } from "./hero-showcase";
import { LANDING_COLUMN } from "./landing-shell";

// Hero of the landing page (docs/landing.md, "Hero"), validated mockup "A · Vitrine": the promise
// on the left, a public profile with its tabs on the right.

// Public profile of the project owner, shown as a real example. null until it is chosen: the
// button stays hidden rather than lead to a page not found.
const EXAMPLE_PROFILE_PATH: string | null = null;

const REASSURANCES = ["7 jours d'essai", "Sans engagement", "Données hébergées en Europe"];

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="bg-spotlight">
      <div
        className={`${LANDING_COLUMN} grid items-center gap-[clamp(2.5rem,6vw,5rem)] pt-[clamp(3.5rem,8vw,6.5rem)] pb-24 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]`}
      >
        <div className="flex flex-col items-start gap-6">
          <p className="eyebrow text-muted-foreground">Pour les freelances</p>
          <h1
            id="hero-title"
            className="font-heading text-[clamp(2.75rem,6vw,4rem)] leading-[1.02] font-medium tracking-[-0.01em]"
          >
            Votre activité de freelance, à une seule adresse.
          </h1>
          <p className="max-w-[46ch] text-[1.0625rem] leading-[27px] text-muted-foreground">
            Profil professionnel, prise de rendez-vous avec visio, tableaux de tâches et fichiers partagés : MyWork
            réunit les outils que vous payez séparément, pour 5 € par mois.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link href="/signup" className={buttonVariants({ size: "lg" })}>
              Essayer 7 jours
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
            {EXAMPLE_PROFILE_PATH && (
              <Link href={EXAMPLE_PROFILE_PATH} className={buttonVariants({ variant: "outline", size: "lg" })}>
                Voir un profil en exemple
              </Link>
            )}
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-[0.8125rem] text-muted-foreground">
            {REASSURANCES.map((item) => (
              <li key={item} className="inline-flex items-center gap-2">
                <CheckIcon aria-hidden className="size-3.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <HeroShowcase />
      </div>
    </section>
  );
}
