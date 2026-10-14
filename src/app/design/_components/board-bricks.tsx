import { CardFace } from "@/app/app/boards/_components/card-tile"
import { MarkdownView } from "@/app/app/boards/_components/markdown-view"
import type { Card } from "@/lib/boards/types"

import { ModuleHeading } from "./showcase"

// The real components of the Tableaux module, with a fictional board: cards in their lists (badges
// for the description, the checklist and the images) and a formatted description.

const card = (title: string, fields: Partial<Card> = {}): Card => ({
  id: title,
  title,
  description: "",
  position: 0,
  coverImageId: null,
  checklist: [],
  images: [],
  ...fields,
})

const items = (done: number, total: number) =>
  Array.from({ length: total }, (_, index) => ({ id: `${index}`, text: `${index}`, isDone: index < done, position: index }))

const image = (id: string) => ({ id, path: id, position: 0, url: null })

const COLUMNS = [
  {
    name: "À faire",
    cards: [
      card("Atelier de cadrage avec l'équipe produit", { checklist: items(1, 4) }),
      card("Audit UX de l'onboarding", { description: "x" }),
      card("Relancer la facture de septembre"),
    ],
  },
  {
    name: "En cours",
    cards: [
      card("Maquettes du parcours de paiement", {
        description: "x",
        checklist: items(3, 5),
        images: [image("a"), image("b"), image("c")],
        coverImageId: "a",
      }),
      card("Design tokens : couleurs et typographie", { description: "x", checklist: items(6, 8) }),
    ],
  },
  {
    name: "Terminé",
    cards: [card("Benchmark de six applications", { checklist: items(5, 5), images: [image("d")] })],
  },
]

const DESCRIPTION =
  "Parcours de paiement **en trois écrans** : panier, livraison, paiement.\n- Garder le récapitulatif visible à chaque étape\n- *Apple Pay* et carte bancaire en premier\n\nMaquettes : www.figma.com/file/ondine-paiement"

export function BoardBricks() {
  return (
    <>
      <div>
        <ModuleHeading module="Module · Tableaux" title="Listes et cartes" />
        <div className="flex items-start gap-3 overflow-x-auto pb-2">
          {COLUMNS.map((column) => (
            <section
              key={column.name}
              aria-label={column.name}
              className="flex w-[272px] shrink-0 flex-col gap-2 border border-border bg-muted p-2"
            >
              <div className="flex items-center gap-2 px-2 py-1">
                <h4 className="flex-1 text-sm font-semibold">{column.name}</h4>
                <span className="text-xs text-muted-foreground tabular-nums">{column.cards.length}</span>
              </div>
              {column.cards.map((item) => (
                <CardFace key={item.id} card={item} />
              ))}
            </section>
          ))}
        </div>
      </div>
      <div>
        <ModuleHeading module="Module · Tableaux" title="Description d'une carte" />
        <div className="max-w-xl border border-border bg-popover p-6">
          <MarkdownView value={DESCRIPTION} />
        </div>
      </div>
    </>
  )
}
