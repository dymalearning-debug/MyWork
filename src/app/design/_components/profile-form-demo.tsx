"use client"

import { XIcon } from "lucide-react"
import { useState } from "react"

import { SkillsField, YearMonthField } from "@/app/app/(subscribed)/profile/_components/fields"
import { SortableList } from "@/app/app/(subscribed)/profile/_components/sortable-list"
import { SiteIcon } from "@/components/site-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { linkText, shortUrl } from "@/lib/profile/links"
import type { YearMonth } from "@/lib/profile/types"

// Fields of "Mon profil" (src/app/app/(subscribed)/profile/_components/), with fictional values: a date (month
// and year), the skills of an experience, a list of links ordered by drag and drop.
export function ProfileFormDemo() {
  const [start, setStart] = useState<YearMonth | null>({ year: 2024, month: 3 })
  const [end, setEnd] = useState<YearMonth | null>({ year: 2021, month: null })
  const [skills, setSkills] = useState(["Design system", "Figma"])
  const [links, setLinks] = useState([
    { id: "a", url: "https://www.linkedin.com/in/ines-robert", label: "" },
    { id: "b", url: "https://github.com/ines-robert", label: "" },
    { id: "c", url: "https://ines-robert.fr", label: "Portfolio" },
  ])

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        <YearMonthField id="demo-start" label="Début" required value={start} onChange={setStart} />
        <YearMonthField
          id="demo-end"
          label="Fin"
          value={end}
          onChange={setEnd}
          error="La fin précède le début."
        />
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Liste déroulante</span>
          <NativeSelect defaultValue="fluent" aria-label="Niveau" className="w-48">
            <NativeSelectOption value="">Niveau</NativeSelectOption>
            <NativeSelectOption value="fluent">Courant</NativeSelectOption>
            <NativeSelectOption value="native">Langue maternelle</NativeSelectOption>
          </NativeSelect>
        </div>
        <SkillsField
          id="demo-skills"
          label="Compétences utilisées"
          value={skills}
          onChange={setSkills}
          suggestions={["Design system", "Figma", "Prototypage", "Accessibilité"]}
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Liens</span>
        <SortableList items={links} itemLabel={linkText} onReorder={setLinks}>
          {(link, handle) => (
            <div className="flex items-center gap-2 border border-border bg-card p-1.5">
              {handle}
              <span className="flex size-8 shrink-0 items-center justify-center text-muted-foreground">
                <SiteIcon url={link.url} />
              </span>
              <Input aria-label="Adresse du lien" defaultValue={shortUrl(link.url)} className="min-w-0 flex-[3]" />
              <Input aria-label="Libellé du lien" defaultValue={link.label} placeholder={linkText(link)} className="min-w-0 flex-[2]" />
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Retirer le lien">
                <XIcon />
              </Button>
            </div>
          )}
        </SortableList>
        <p className="text-xs text-muted-foreground">Glissez la poignée, ou Espace, flèches, Espace au clavier.</p>
      </div>
    </div>
  )
}
