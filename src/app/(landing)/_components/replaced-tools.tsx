import { ArrowRightIcon, CheckIcon } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";

import { LANDING_COLUMN } from "./landing-shell";
import { ToolLogo, type ToolLogoId } from "./tool-logos";

// "Outils remplacés" block of the landing page (docs/landing.md), validated mockup "B · Tableau":
// the logos of the usual tools lead to MyWork, then a table of needs, tools, prices and their place
// in MyWork. Tone: everything in one place, never running the tools down. Prices are dated.

const TOOLS: { logo: ToolLogoId; tool: string; need: string; price: string; mywork: string }[] = [
  {
    logo: "linkedin",
    tool: "LinkedIn ou un site vitrine",
    need: "Page pro, CV en ligne",
    price: "0 à 15 €/mois",
    mywork: "Profil public, export du CV",
  },
  { logo: "calendly", tool: "Calendly", need: "Prise de rendez-vous", price: "≈ 10 $/mois", mywork: "Rendez-vous" },
  { logo: "zoom", tool: "Zoom", need: "Visio avec vos clients", price: "≈ 14 €/mois", mywork: "Visio des rendez-vous" },
  { logo: "trello", tool: "Trello", need: "Suivi des tâches", price: "5 à 6 $/mois", mywork: "Tableaux" },
  {
    logo: "drive",
    tool: "Google Drive",
    need: "Fichiers partagés",
    price: "≈ 2 €/mois",
    mywork: "Fichiers et Ressources",
  },
];

const HEAD = "eyebrow px-3 py-3.5 text-left font-medium text-muted-foreground sm:px-5";
const CELL = "border-b border-border px-3 py-3.5 align-middle sm:px-5";
const MINE = "bg-muted";

export function ReplacedTools({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-16 border-t border-border">
      <div className={`${LANDING_COLUMN} py-[clamp(4rem,9vw,7rem)]`}>
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="eyebrow text-muted-foreground tabular-nums">{eyebrow}</p>
          <h2
            id={`${id}-title`}
            className="max-w-[24ch] font-heading text-[clamp(2.25rem,5vw,3rem)] leading-[1.05] font-medium tracking-[-0.01em]"
          >
            {title}
          </h2>
          <p className="max-w-[62ch] text-base leading-[25px] text-muted-foreground">
            Une page pour votre profil, un agenda en ligne, une application de visio, une autre pour vos tâches, une
            dernière pour vos fichiers : autant de comptes, d&apos;abonnements et de mots de passe. MyWork réunit
            l&apos;essentiel dans un seul espace.
          </p>
        </div>

        {/* The usual tools lead to MyWork */}
        <div aria-hidden className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {TOOLS.map((tool) => (
            <span
              key={tool.logo}
              className="inline-flex size-12 items-center justify-center border border-border bg-background sm:size-16"
            >
              <ToolLogo id={tool.logo} size={tool.logo === "zoom" ? 34 : 30} decorative />
            </span>
          ))}
          <ArrowRightIcon className="mx-1 size-6 text-muted-foreground sm:mx-2 sm:size-7" strokeWidth={1.5} />
          <Logo variant="mark" className="size-12 sm:size-16" />
        </div>

        <div className="mt-12 border border-border max-sm:hidden">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Outils habituels d&apos;un freelance et leur équivalent dans MyWork</caption>
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className={`${HEAD} max-md:hidden`}>
                  Besoin
                </th>
                <th scope="col" className={HEAD}>
                  Outil habituel
                </th>
                <th scope="col" className={`${HEAD} text-right`}>
                  Prix courant
                </th>
                <th scope="col" className={`${HEAD} ${MINE} text-foreground`}>
                  Dans MyWork
                </th>
              </tr>
            </thead>
            <tbody>
              {TOOLS.map((tool) => (
                <tr key={tool.logo}>
                  <td className={`${CELL} font-medium max-md:hidden`}>{tool.need}</td>
                  <td className={CELL}>
                    <span className="flex items-center gap-3 sm:gap-3.5">
                      <span className="inline-flex size-8 shrink-0 items-center justify-center border border-border bg-background sm:size-10">
                        <ToolLogo id={tool.logo} size={tool.logo === "zoom" ? 22 : 20} />
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span>{tool.tool}</span>
                        <span className="text-xs text-muted-foreground md:hidden">{tool.need}</span>
                      </span>
                    </span>
                  </td>
                  <td className={`${CELL} text-right whitespace-nowrap text-muted-foreground tabular-nums`}>
                    {tool.price}
                  </td>
                  <td className={`${CELL} ${MINE}`}>
                    <span className="flex items-start gap-2.5">
                      <CheckIcon aria-hidden className="mt-[3px] size-3.5 shrink-0" />
                      {tool.mywork}
                    </span>
                  </td>
                </tr>
              ))}
              <tr>
                <th scope="row" className={`${HEAD} text-foreground max-md:hidden`}>
                  Total
                </th>
                <td className="px-3 py-4 text-[0.8125rem] text-muted-foreground sm:px-5">
                  <span className="md:hidden">Total · </span>Cinq comptes, cinq factures
                </td>
                <td className="px-3 py-4 text-right whitespace-nowrap sm:px-5">
                  <span className="font-heading text-xl tabular-nums sm:text-[1.625rem]">≈ 30 à 45 €</span>
                  <span className="text-xs text-muted-foreground"> /mois</span>
                </td>
                <td className={`px-3 py-4 sm:px-5 ${MINE}`}>
                  <span className="font-heading text-xl tabular-nums sm:text-[1.625rem]">5 €</span>
                  <span className="text-xs text-muted-foreground"> /mois, tout compris</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* On phones, the same comparison as a list: the table is too wide */}
        <div className="mt-10 border border-border sm:hidden">
          <ul>
            {TOOLS.map((tool) => (
              <li key={tool.logo} className="border-b border-border">
                <div className="flex items-start gap-3 px-4 pt-4 pb-3">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center border border-border bg-background">
                    <ToolLogo id={tool.logo} size={tool.logo === "zoom" ? 22 : 20} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col text-sm">
                    <span>{tool.tool}</span>
                    <span className="text-xs text-muted-foreground">{tool.need}</span>
                  </span>
                  <span className="text-[0.8125rem] whitespace-nowrap text-muted-foreground tabular-nums">
                    {tool.price}
                  </span>
                </div>
                <p className={`flex items-center gap-2.5 px-4 py-2.5 text-sm ${MINE}`}>
                  <CheckIcon aria-hidden className="size-3.5 shrink-0" />
                  <span>
                    <span className="text-muted-foreground">Dans MyWork : </span>
                    {tool.mywork}
                  </span>
                </p>
              </li>
            ))}
          </ul>
          <dl className="grid grid-cols-2">
            <div className="flex flex-col gap-1 px-4 py-4">
              <dt className="text-xs text-muted-foreground">Séparément</dt>
              <dd className="font-heading text-xl tabular-nums">
                ≈ 30 à 45 €<span className="font-sans text-xs text-muted-foreground"> /mois</span>
              </dd>
            </div>
            <div className={`flex flex-col gap-1 px-4 py-4 ${MINE}`}>
              <dt className="text-xs text-muted-foreground">Avec MyWork</dt>
              <dd className="font-heading text-xl tabular-nums">
                5 €<span className="font-sans text-xs text-muted-foreground"> /mois, tout compris</span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-x-12 gap-y-5">
          <p className="max-w-[90ch] flex-[1_1_420px] text-xs leading-[18px] text-muted-foreground">
            Prix publics des offres payantes les plus courantes, relevés le 19 octobre 2026. Ces outils ont aussi des
            offres gratuites, plus limitées. MyWork remplace votre page de profil, pas le réseau LinkedIn. Les noms et
            logos cités appartiennent à leurs propriétaires.
          </p>
          <Link href="/signup" className={buttonVariants({ size: "lg" })}>
            Essayer 7 jours
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </div>
      </div>
    </section>
  );
}
