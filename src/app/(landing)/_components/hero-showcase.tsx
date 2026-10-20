"use client";

import { Tabs } from "@base-ui/react/tabs";
import { FileTextIcon, LockIcon } from "lucide-react";
import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Right side of the hero (docs/landing.md, mockup "A · Vitrine"): a public profile in a browser
// window, with its three tabs. A visitor clicks a tab, the address follows. Fictitious profile.

const HANDLE = "ines-robert";

const TABS = [
  { value: "profile", label: "Profil", path: HANDLE },
  { value: "booking", label: "Rendez-vous", path: `${HANDLE}/booking` },
  { value: "resources", label: "Ressources", path: `${HANDLE}/resources` },
] as const;

type TabValue = (typeof TABS)[number]["value"];

// null: no slot left at that hour.
const DAYS = [
  { label: "Lun. 20", slots: ["09:00", "10:00", "14:00", "15:30"] },
  { label: "Mar. 21", slots: ["09:30", null, "14:00", "16:00"] },
  { label: "Mer. 22", slots: [null, "11:00", null, "15:00"] },
  { label: "Jeu. 23", slots: ["09:00", "10:30", "14:30", null] },
  { label: "Ven. 24", slots: ["10:00", null, null, null] },
];

const FILES = [
  { name: "Etude-de-cas-Atelier-Nord.pdf", size: "6,1 Mo" },
  { name: "Tarifs-2026.pdf", size: "860 Ko" },
  { name: "Kit-media-Ines-Robert.pdf", size: "2,4 Mo" },
  { name: "Modele-brief-projet.docx", size: "94 Ko" },
];

const LABEL = "eyebrow text-[0.625rem] text-muted-foreground";

export function HeroShowcase() {
  const [tab, setTab] = useState<TabValue>("profile");
  const path = TABS.find((t) => t.value === tab)?.path ?? HANDLE;

  return (
    <figure className="flex min-w-0 flex-col gap-3.5">
      <Tabs.Root
        value={tab}
        onValueChange={(value) => setTab(value as TabValue)}
        className="border border-border bg-background"
      >
        {/* Window bar and address */}
        <div className="flex items-center gap-3 border-b border-border bg-muted px-3.5 py-2.5">
          <span aria-hidden className="flex gap-1.5">
            <span className="size-2 bg-border" />
            <span className="size-2 bg-border" />
            <span className="size-2 bg-border" />
          </span>
          <span className="flex h-[26px] min-w-0 flex-1 items-center gap-2 border border-border bg-background px-2.5 text-xs">
            <LockIcon aria-hidden className="size-3 shrink-0 text-muted-foreground" />
            <span className="truncate">
              <span className="text-muted-foreground">hellomywork.com/</span>
              <span className="font-medium">{path}</span>
            </span>
          </span>
        </div>

        {/* Header of the profile, under the studio light */}
        <div className="border-b border-border bg-spotlight px-5 pt-6 sm:px-7 sm:pt-7">
          <div className="flex items-end gap-4">
            <span
              aria-hidden
              className="inline-flex size-14 shrink-0 items-center justify-center border border-border bg-muted font-heading text-xl sm:size-[72px] sm:text-[26px]"
            >
              IR
            </span>
            <div className="min-w-0 flex-1">
              <p className={LABEL}>Designer produit · Freelance</p>
              <p className="mt-1 font-heading text-[1.75rem] leading-none font-medium sm:text-[2.125rem]">Inès Robert</p>
              <p className="mt-1.5 text-xs text-muted-foreground">Lyon · Disponible à partir du 3 novembre</p>
            </div>
            <span aria-hidden className={cn(buttonVariants({ variant: "contrast", size: "sm" }), "max-sm:hidden")}>
              Me contacter
            </span>
          </div>
          <Tabs.List aria-label="Onglets du profil d'exemple" className="-mb-px mt-5 flex gap-6">
            {TABS.map((t) => (
              <Tabs.Tab
                key={t.value}
                value={t.value}
                className="cursor-pointer py-3 text-[0.8125rem] whitespace-nowrap text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-active:text-foreground data-active:shadow-[inset_0_-2px_0_var(--primary)]"
              >
                {t.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </div>

        <Tabs.Panel value="profile" className="h-[260px] overflow-hidden px-5 py-5 outline-none sm:px-7">
          <div className="grid gap-7 sm:grid-cols-5">
            <div className="flex flex-col gap-2.5 sm:col-span-3">
              <p className={LABEL}>À propos</p>
              <p className="text-[0.8125rem] leading-5">
                J&apos;accompagne les équipes produit, de la recherche utilisateur aux maquettes prêtes à développer.
              </p>
              <p className={cn(LABEL, "mt-2.5")}>Expérience</p>
              <Experience title="Lead designer · Atelier Nord" years="2022 – 2026" />
              <Experience title="Designer produit · Studio Oural" years="2019 – 2022" />
            </div>
            <div className="flex flex-col gap-2.5 max-sm:hidden sm:col-span-2">
              <p className={LABEL}>Offre freelance</p>
              <p className="text-[0.8125rem] leading-5">Audit UX, design system, prototypes.</p>
              <p className="text-[0.8125rem] tabular-nums">TJM · 550 €</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {["Figma", "Recherche", "Prototypage"].map((skill) => (
                  <span key={skill} className="border border-border px-2 py-0.5 text-[0.6875rem]">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="booking" className="h-[260px] overflow-hidden px-5 py-5 outline-none sm:px-7">
          <div className="flex items-baseline justify-between">
            <p className={LABEL}>Visio · 30 min</p>
            <span className="text-xs text-muted-foreground tabular-nums">20 – 24 oct.</span>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-1.5 sm:gap-2">
            {DAYS.map((day) => (
              <div key={day.label} className="flex flex-col gap-1.5">
                <span className="text-center text-[0.6875rem] text-muted-foreground">{day.label}</span>
                {day.slots.map((slot, index) =>
                  slot ? (
                    <span key={index} className="flex h-[30px] items-center justify-center border border-border text-xs tabular-nums">
                      {slot}
                    </span>
                  ) : (
                    <span
                      key={index}
                      aria-label="Indisponible"
                      className="flex h-[30px] items-center justify-center border border-dashed border-border text-xs text-muted-foreground opacity-50"
                    >
                      —
                    </span>
                  ),
                )}
              </div>
            ))}
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="resources" className="h-[260px] overflow-hidden px-5 py-2 outline-none sm:px-7">
          <ul>
            {FILES.map((file) => (
              <li key={file.name} className="flex items-center gap-3.5 border-b border-border py-[11px]">
                <span className="inline-flex size-9 shrink-0 items-center justify-center border border-border bg-muted text-muted-foreground">
                  <FileTextIcon aria-hidden className="size-4" strokeWidth={1.5} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[0.8125rem]">{file.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{file.size}</span>
              </li>
            ))}
          </ul>
        </Tabs.Panel>
      </Tabs.Root>
      <figcaption className="text-[0.8125rem] text-muted-foreground">
        Un lien, trois onglets : votre profil, vos créneaux, vos documents.
      </figcaption>
    </figure>
  );
}

function Experience({ title, years }: { title: string; years: string }) {
  return (
    <div className="flex justify-between gap-3 border-t border-border py-2 text-[0.8125rem]">
      <span className="truncate">{title}</span>
      <span className="shrink-0 text-muted-foreground tabular-nums">{years}</span>
    </div>
  );
}
