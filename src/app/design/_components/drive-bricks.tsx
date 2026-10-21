"use client"

import { DndContext } from "@dnd-kit/core"

import { ResourcesTab } from "@/app/[handle]/_components/resources-tab"
import { DriveContext, type DriveContextValue } from "@/app/app/(subscribed)/drive/_components/drive-context"
import { ItemList } from "@/app/app/(subscribed)/drive/_components/items"
import { StorageMeter } from "@/app/app/(subscribed)/drive/_components/storage-meter"
import type { DriveItem, PublicResource } from "@/lib/drive/types"

import { ModuleHeading } from "./showcase"

// The real components of the Drive module, with fictional files: the list of "Mes fichiers", the
// storage indicator and the "Ressources" tab of the public profile.

const MB = 1024 * 1024

const item = (name: string, fields: Partial<DriveItem> = {}): DriveItem => ({
  id: name,
  kind: "file",
  name,
  category: "document",
  mimeType: null,
  size: 1.2 * MB,
  updatedAt: "2026-10-07T09:30:00Z",
  isPublic: false,
  isFeatured: false,
  thumbnailUrl: null,
  ...fields,
})

const ITEMS: DriveItem[] = [
  item("Clients", { kind: "folder", category: "folder", size: null, updatedAt: "2026-10-12T15:00:00Z" }),
  item("Factures 2026", { kind: "folder", category: "folder", size: null, updatedAt: "2026-09-30T10:00:00Z" }),
  item("Étude de cas Atelier Nord.pdf", { size: 6.1 * MB, isPublic: true, isFeatured: true }),
  item("Kit média Inès Robert.pdf", { size: 2.4 * MB, isPublic: true, updatedAt: "2026-10-14T08:00:00Z" }),
  item("Tarifs 2026.xlsx", { category: "spreadsheet", size: 94 * 1024, updatedAt: "2026-10-11T08:00:00Z" }),
  item("Portrait studio.jpg", { category: "image", size: 3.2 * MB, updatedAt: "2026-09-30T08:00:00Z" }),
  item("Captures écran v3.zip", { category: "archive", size: 29.7 * MB, updatedAt: "2026-09-12T08:00:00Z" }),
]

const resource = (name: string, fields: Partial<PublicResource>): PublicResource => ({
  id: name,
  name,
  category: "document",
  mimeType: "application/pdf",
  size: 2.4 * MB,
  updatedAt: "2026-10-14T08:00:00Z",
  thumbnailUrl: null,
  ...fields,
})

const noop = () => undefined

const CONTEXT: DriveContextValue = {
  owner: { photoUrl: null, initials: "IR" },
  selected: new Set(["Tarifs 2026.xlsx"]),
  toggle: noop,
  actions: { open: noop, download: noop, rename: noop, move: noop, setPublic: noop, feature: noop, remove: noop },
  dropFolderId: null,
  fileDropProps: () => ({}),
}

export function DriveBricks() {
  return (
    <>
      <div>
        <ModuleHeading module="Module · Drive" title="Mes fichiers" />
        <DriveContext.Provider value={CONTEXT}>
          <DndContext id="design-drive">
            <ItemList items={ITEMS} sort="name" onSort={noop} allSelected={false} onSelectAll={noop} />
          </DndContext>
        </DriveContext.Provider>
        <div className="mt-4 flex justify-end border-t border-border pt-3">
          <StorageMeter usage={{ drive: 280 * MB, profile: 12 * MB, boards: 20 * MB, capacity: 1024 * MB }} />
        </div>
      </div>
      <div>
        <ModuleHeading module="Module · Drive" title="Onglet « Ressources » du profil public" />
        <ResourcesTab
          handle="ines-robert"
          page={1}
          resources={{
            featured: resource("Étude de cas Atelier Nord.pdf", { size: 6.1 * MB, updatedAt: "2026-10-07T08:00:00Z" }),
            total: 3,
            items: [
              resource("Kit média Inès Robert.pdf", {}),
              resource("Tarifs 2026.pdf", { size: 860 * 1024, updatedAt: "2026-10-11T08:00:00Z" }),
              resource("Modèle de brief.docx", { size: 94 * 1024, updatedAt: "2026-09-10T08:00:00Z" }),
            ],
          }}
        />
      </div>
    </>
  )
}
