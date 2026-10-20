import { ArrowRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ComponentType } from "react";

import { buttonVariants } from "@/components/ui/button";

import { Faq } from "./_components/faq";
import { Features } from "./_components/features";
import { Hero } from "./_components/hero";
import { LANDING_COLUMN, LandingFooter, LandingHeader } from "./_components/landing-shell";
import { Pricing } from "./_components/pricing";
import { ReplacedTools } from "./_components/replaced-tools";
import { LANDING_SECTIONS } from "./_components/sections";

// Landing page, at the address of the site (docs/landing.md): the hero, then the blocks listed in
// sections.ts (each built from its validated mockup), then the last call to action.

// Blocks, by anchor.
const BLOCKS: Record<string, ComponentType<{ id: string; eyebrow: string; title: string }>> = {
  fonctionnalites: Features,
  "outils-remplaces": ReplacedTools,
  tarif: Pricing,
  faq: Faq,
};

export const metadata: Metadata = {
  title: "MyWork · Votre activité de freelance, à une seule adresse",
  description:
    "Profil professionnel, prise de rendez-vous avec visio, tableaux de tâches et fichiers partagés : MyWork réunit les outils des freelances, pour 5 € par mois.",
};

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-1 flex-col">
      <LandingHeader />
      <main className="flex-1">
        <Hero />
        {LANDING_SECTIONS.map((section, index) => {
          const eyebrow = `${String(index + 2).padStart(2, "0")} · ${section.label}`;
          const Block = BLOCKS[section.id];
          return <Block key={section.id} id={section.id} eyebrow={eyebrow} title={section.title} />;
        })}
        <FinalCall />
      </main>
      <LandingFooter />
    </div>
  );
}

// Last call to action, on the stage ink in both themes (docs/landing.md, "Appel final").
function FinalCall() {
  return (
    <section aria-labelledby="final-call-title" className="bg-stage text-stage-foreground">
      <div className={`${LANDING_COLUMN} flex flex-col items-start gap-6 py-[clamp(4rem,10vw,7rem)]`}>
        <h2 id="final-call-title" className="font-heading text-[clamp(2rem,5vw,3rem)] leading-tight font-medium">
          Votre lien MyWork en cinq minutes.
        </h2>
        <Link href="/signup" className={buttonVariants({ size: "lg" })}>
          Essayer 7 jours
          <ArrowRightIcon data-icon="inline-end" />
        </Link>
      </div>
    </section>
  );
}
