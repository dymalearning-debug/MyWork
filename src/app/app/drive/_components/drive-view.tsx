"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  ArrowUpDownIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FolderInputIcon,
  FolderPlusIcon,
  GlobeIcon,
  LayoutGridIcon,
  ListFilterIcon,
  ListIcon,
  LockIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { FileIconFor } from "@/components/file-icon";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  createFolder,
  deleteItems,
  failureMessage,
  fileUrl,
  getSubtree,
  moveItems,
  renameItem,
  setFeatured,
  setVisibility,
  type Subtree,
} from "@/lib/drive/client";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  folderPath,
  NEW_FOLDER_NAME,
  nextSort,
  parseQuery,
  queryString,
  SORT_LABELS,
  SORTS,
  VIEW_COOKIE,
  type Category,
  type DriveQuery,
  type DriveView as View,
} from "@/lib/drive/rules";
import type { DriveFolder, DriveItem, StorageUsage } from "@/lib/drive/types";
import { cn } from "@/lib/utils";

import { DriveContext, type DriveActions } from "./drive-context";
import { MoveDialog, NameDialog } from "./dialogs";
import { StorageMeter } from "./storage-meter";
import { ItemGrid, ItemList } from "./items";
import { PreviewDialog } from "./preview-dialog";
import { useUploads } from "./uploads";

// "Mes fichiers" (docs/drive.md, "La page"): the header (breadcrumb, "Nouveau"), the toolbar (or
// the bar of the selection), the items in a list or a grid, then the pagination and the storage.
// Every change is saved straight away, then the page is read again from the server.

type NameEdit = { mode: "create" } | { mode: "rename"; item: DriveItem };

export function DriveView({
  userId,
  owner,
  folder,
  query,
  usage,
  initialView,
}: {
  userId: string;
  owner: { photoUrl: string | null; initials: string };
  folder: DriveFolder;
  query: DriveQuery;
  usage: StorageUsage;
  initialView: View;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const uploads = useUploads();
  const [, startRefresh] = useTransition();
  const [view, setView] = useState(initialView);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [nameEdit, setNameEdit] = useState<NameEdit | null>(null);
  const [moving, setMoving] = useState<string[] | null>(null);
  const [deleting, setDeleting] = useState<Subtree | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [dragged, setDragged] = useState<DriveItem | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Another folder or another view: the selection starts again. Items gone are unselected.
  const viewKey = `${folder.folderId}${queryString({ ...query, page: 1 })}|${query.page}`;
  const [shownKey, setShownKey] = useState(viewKey);
  if (shownKey !== viewKey) {
    setShownKey(viewKey);
    setSelected(new Set());
  }
  const itemIds = new Set(folder.items.map((item) => item.id));
  const selection = [...selected].filter((id) => itemIds.has(id));
  const selectedItems = folder.items.filter((item) => selected.has(item.id));

  const currentName = folder.path.at(-1)?.name ?? "Mes fichiers";
  const files = folder.items.filter((item) => item.kind === "file");
  const freeBytes = usage.capacity - usage.drive - usage.profile - usage.boards - uploads.pendingBytes;

  const refresh = () => startRefresh(() => router.refresh());
  // The view asked last: two changes in a row (the filter removed, then a search typed) build on
  // each other, even before the server has answered the first.
  const asked = useRef(query);
  const shownQuery = queryString(query);
  useEffect(() => {
    asked.current = parseQuery(Object.fromEntries(new URLSearchParams(shownQuery)));
  }, [shownQuery]);
  const go = (changes: Partial<DriveQuery>) => {
    asked.current = { ...asked.current, page: 1, ...changes };
    router.replace(`${pathname}${queryString(asked.current)}`, { scroll: false });
  };

  // The search follows the typing, a short moment after the last key. It starts empty again in
  // another folder.
  const [search, setSearch] = useState(query.q);
  const [searchFolder, setSearchFolder] = useState(folder.folderId);
  if (searchFolder !== folder.folderId) {
    setSearchFolder(folder.folderId);
    setSearch(query.q);
  }
  const latestGo = useRef(go);
  useEffect(() => {
    latestGo.current = go;
  });
  useEffect(() => {
    if (search.trim() === query.q.trim()) return;
    const timer = window.setTimeout(() => latestGo.current({ q: search }), 250);
    return () => window.clearTimeout(timer);
  }, [search, query.q]);

  // Runs a change, then reads the folder again. The notification says how it went.
  async function run(change: () => Promise<unknown>, success: { title: string; description?: string } | null, fallback: string) {
    try {
      await change();
      if (success) toast.success(success.title, { description: success.description });
    } catch (error) {
      console.error(error);
      toast.error(failureMessage(error, fallback));
    }
    refresh();
  }

  const plural = (count: number, one: string, many: string) => (count > 1 ? `${count} ${many}` : one);

  const actions: DriveActions = {
    open: (item) => {
      if (item.kind === "folder") router.push(folderPath(item.id));
      else setPreviewId(item.id);
    },
    download: (item) => {
      fileUrl(userId, item, true)
        .then((url) => {
          const link = document.createElement("a");
          link.href = url;
          link.download = item.name;
          link.click();
        })
        .catch((error: unknown) => {
          console.error(error);
          toast.error("Le téléchargement n’a pas pu commencer. Réessayez.");
        });
    },
    rename: (item) => setNameEdit({ mode: "rename", item }),
    move: (ids) => setMoving(ids),
    setPublic: (ids, isPublic) => {
      // Folders have no visibility: only the files of a selection change.
      const fileIds = folder.items.filter((item) => ids.includes(item.id) && item.kind === "file").map((item) => item.id);
      if (fileIds.length === 0) {
        toast.error("Seuls les fichiers peuvent être publics.");
        return;
      }
      const subject = plural(fileIds.length, "Fichier", "fichiers");
      void run(
        () => setVisibility(fileIds, isPublic),
        isPublic
          ? {
              title: `${subject} rendu${fileIds.length > 1 ? "s" : ""} public${fileIds.length > 1 ? "s" : ""}`,
              description: "Visible dans l’onglet Ressources de votre profil",
            }
          : { title: `${subject} rendu${fileIds.length > 1 ? "s" : ""} privé${fileIds.length > 1 ? "s" : ""}` },
        "La visibilité n’a pas pu être changée. Réessayez.",
      );
      setSelected(new Set());
    },
    feature: (item, featured) =>
      void run(
        () => setFeatured(item.id, featured),
        featured
          ? { title: "Fichier mis en avant", description: "Affiché en grand dans l’onglet Ressources" }
          : { title: "Mise en avant retirée" },
        "La mise en avant n’a pas pu être changée. Réessayez.",
      ),
    remove: (ids) => {
      getSubtree(userId, ids)
        .then(setDeleting)
        .catch((error: unknown) => {
          console.error(error);
          toast.error("La suppression n’a pas pu être préparée. Réessayez.");
        });
    },
  };

  const move = (ids: string[], target: string | null) => {
    if (target === folder.folderId || ids.includes(target ?? "")) return;
    const targetName =
      target === null
        ? "Mes fichiers"
        : (folder.items.find((item) => item.id === target)?.name ?? folder.path.find((step) => step.id === target)?.name);
    void run(
      () => moveItems(ids, target),
      { title: ids.length > 1 ? `${ids.length} éléments déplacés` : "Élément déplacé", description: targetName && `Vers « ${targetName} »` },
      "Le déplacement a échoué. Réessayez.",
    );
    setSelected(new Set());
  };

  // ——— Files dragged from the computer ———
  // Onto the page: into the folder shown; onto a folder of the list: into that folder.
  const [fileDrop, setFileDrop] = useState<{ folderId: string | null; name: string } | null>(null);
  const dragDepth = useRef(0);
  const hasFiles = (event: React.DragEvent) => event.dataTransfer.types.includes("Files");

  const sendFiles = (list: FileList | File[], parentId: string | null) => {
    const chosen = [...list];
    if (chosen.length > 0) uploads.start(userId, parentId, chosen, freeBytes);
  };

  const pageDropProps = {
    onDragEnter: (event: React.DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepth.current++;
      if (dragDepth.current === 1) setFileDrop({ folderId: folder.folderId, name: currentName });
    },
    onDragOver: (event: React.DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    },
    onDragLeave: (event: React.DragEvent) => {
      if (!hasFiles(event)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setFileDrop(null);
    },
    onDrop: (event: React.DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepth.current = 0;
      const target = fileDrop?.folderId ?? folder.folderId;
      setFileDrop(null);
      sendFiles(event.dataTransfer.files, target);
    },
  };

  const fileDropProps = (target: DriveItem): React.HTMLAttributes<HTMLElement> => ({
    onDragOver: (event) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      if (fileDrop?.folderId !== target.id) setFileDrop({ folderId: target.id, name: target.name });
    },
    onDragLeave: (event) => {
      if (!hasFiles(event) || (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))) return;
      setFileDrop({ folderId: folder.folderId, name: currentName });
    },
  });

  // ——— Items dragged onto a folder ———
  // A stable id: the same on the server and in the browser.
  const dndId = useId();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const onDragStart = ({ active }: DragStartEvent) => setDragged((active.data.current?.item as DriveItem) ?? null);
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragged(null);
    if (!over) return;
    const target = over.data.current?.folderId as string | null | undefined;
    if (target === undefined) return;
    const ids = selected.has(String(active.id)) ? selection : [String(active.id)];
    if (target !== null && ids.includes(target)) return;
    move(ids, target);
  };

  // ——— Selection ———
  const toggle = (id: string, isSelected: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      if (isSelected) next.add(id);
      else next.delete(id);
      return next;
    });
  const allSelected = folder.items.length > 0 && selection.length === folder.items.length;

  // List or grid, remembered on this device.
  const chooseView = (next: View) => {
    setView(next);
    document.cookie = `${VIEW_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  };

  const filtered = !!query.q.trim() || !!query.type;
  const hrefOf = (page: number) => `${pathname}${queryString({ ...query, page })}`;

  return (
    <DriveContext.Provider
      value={{ owner, selected, toggle, actions, dropFolderId: fileDrop?.folderId ?? null, fileDropProps }}
    >
      <DndContext id={dndId} sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragged(null)}>
        <div className="flex min-h-svh flex-col" {...pageDropProps}>
          <div className="flex flex-1 flex-col gap-5 px-10 pt-7">
            <header className="flex flex-wrap items-center justify-between gap-4">
              <Breadcrumb folder={folder} />
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button />}>
                  <PlusIcon data-icon="inline-start" />
                  Nouveau
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => setNameEdit({ mode: "create" })}>
                    <FolderPlusIcon />
                    Nouveau dossier
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => fileInput.current?.click()}>
                    <UploadIcon />
                    Importer des fichiers
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <input
                ref={fileInput}
                type="file"
                multiple
                hidden
                aria-label="Importer des fichiers"
                onChange={(event) => {
                  if (event.target.files) sendFiles(event.target.files, folder.folderId);
                  event.target.value = "";
                }}
              />
            </header>

            {selection.length > 0 ? (
              <div className="flex min-h-10 flex-wrap items-center gap-1 bg-muted px-2 py-0.5" role="toolbar" aria-label="Actions de la sélection">
                <Button variant="ghost" size="icon-sm" aria-label="Tout désélectionner" onClick={() => setSelected(new Set())}>
                  <XIcon />
                </Button>
                <span className="mr-3 ml-1 text-sm font-medium tabular-nums">
                  {selection.length} sélectionné{selection.length > 1 ? "s" : ""}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setMoving(selection)}>
                  <FolderInputIcon data-icon="inline-start" />
                  Déplacer
                </Button>
                <Button variant="ghost" size="sm" onClick={() => actions.setPublic(selection, true)}>
                  <GlobeIcon data-icon="inline-start" />
                  Rendre public
                </Button>
                <Button variant="ghost" size="sm" onClick={() => actions.setPublic(selection, false)}>
                  <LockIcon data-icon="inline-start" />
                  Rendre privé
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => actions.remove(selection)}>
                  <Trash2Icon data-icon="inline-start" />
                  Supprimer
                </Button>
              </div>
            ) : (
              <Toolbar query={query} search={search} onSearch={setSearch} view={view} onQuery={go} onView={chooseView} />
            )}

            <div
              className={cn(
                "relative flex-1 outline-offset-4",
                fileDrop && fileDrop.folderId === folder.folderId && "outline-2 outline-primary",
              )}
            >
              {folder.items.length > 0 ? (
                view === "list" ? (
                  <ItemList
                    items={folder.items}
                    sort={query.sort}
                    onSort={(column) => go({ sort: nextSort(query.sort, column) })}
                    allSelected={allSelected}
                    onSelectAll={(all) => setSelected(all ? new Set(folder.items.map((item) => item.id)) : new Set())}
                  />
                ) : (
                  <ItemGrid items={folder.items} />
                )
              ) : filtered ? (
                <EmptyState
                  title="Aucun élément ne correspond"
                  text="Essayez un autre mot, ou un autre type."
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearch("");
                        go({ q: "", type: null });
                      }}
                    >
                      Effacer les filtres
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  title={folder.folderId ? "Ce dossier est vide" : "Aucun fichier pour l’instant"}
                  text="Déposez des fichiers ici, ou utilisez « Nouveau »."
                />
              )}
            </div>
          </div>

          {/* As high as the profile block at the bottom of the sidebar: one line across the screen. */}
          <footer className="mt-6 flex h-[65px] items-center justify-between gap-4 border-t border-border px-10">
            <Pagination page={query.page} total={folder.total} hrefOf={hrefOf} />
            <StorageMeter usage={usage} />
          </footer>

          {fileDrop && (
            <div
              aria-live="polite"
              className="pointer-events-none fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 bg-primary px-4 py-2.5 text-sm text-primary-foreground"
            >
              <UploadIcon className="size-4" />
              Déposer dans <em className="font-heading text-base not-italic">{fileDrop.name}</em>
            </div>
          )}
        </div>

        <DragOverlay dropAnimation={null}>
          {dragged && (
            <div className="flex items-center gap-2 border border-foreground bg-background px-3 py-2 text-sm shadow-none">
              <FileIconFor category={dragged.category} className="size-4 text-muted-foreground" />
              {selected.has(dragged.id) && selection.length > 1 ? `${selection.length} éléments` : dragged.name}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <NameDialog
        key={nameEdit ? (nameEdit.mode === "rename" ? `rename-${nameEdit.item.id}` : "create") : "name-closed"}
        open={nameEdit !== null}
        onOpenChange={(open) => !open && setNameEdit(null)}
        title={nameEdit?.mode === "rename" ? "Renommer" : "Nouveau dossier"}
        initialName={nameEdit?.mode === "rename" ? nameEdit.item.name : NEW_FOLDER_NAME}
        keepExtension={nameEdit?.mode === "rename" && nameEdit.item.kind === "file"}
        submitLabel={nameEdit?.mode === "rename" ? "Renommer" : "Créer"}
        onSubmit={(name) => {
          if (nameEdit?.mode === "rename") {
            const item = nameEdit.item;
            void run(() => renameItem(item.id, name), { title: "Élément renommé", description: `« ${name} »` }, "Le renommage a échoué. Réessayez.");
          } else {
            void run(() => createFolder(folder.folderId, name), { title: "Dossier créé", description: `« ${name} »` }, "Le dossier n’a pas pu être créé. Réessayez.");
          }
        }}
      />

      <MoveDialog
        key={moving ? `move-${moving.join()}` : "move-closed"}
        open={moving !== null}
        onOpenChange={(open) => !open && setMoving(null)}
        count={moving?.length ?? 0}
        movedIds={moving ?? []}
        currentFolderId={folder.folderId}
        onMove={(target) => moving && move(moving, target)}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting && deleting.ids.length > 1 ? `Supprimer ${deleting.ids.length} éléments ?` : "Supprimer cet élément ?"}
        description={deleting ? deletionText(deleting, selectedItems, folder.items) : null}
        confirmLabel="Supprimer définitivement"
        onConfirm={() => {
          const subtree = deleting;
          if (!subtree) return;
          void run(
            () => deleteItems(subtree),
            { title: subtree.ids.length > 1 ? `${subtree.ids.length} éléments supprimés` : "Élément supprimé" },
            "La suppression a échoué. Réessayez.",
          );
          setSelected(new Set());
        }}
      />

      <PreviewDialog
        userId={userId}
        files={files}
        fileId={previewId}
        onFileChange={setPreviewId}
        onDownload={(item) => {
          // The download starts, the preview closes.
          setPreviewId(null);
          actions.download(item);
        }}
      />
    </DriveContext.Provider>
  );
}

// What leaves with a deletion: "Le dossier « Clients », avec 12 fichiers et 2 dossiers, sera
// supprimé définitivement."
function deletionText(subtree: Subtree, selectedItems: DriveItem[], items: DriveItem[]) {
  const count = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;
  const single = subtree.ids.length === 1 ? items.find((item) => item.id === subtree.ids[0]) : undefined;
  const ownFolders = single?.kind === "folder" ? 1 : selectedItems.filter((item) => item.kind === "folder").length;
  const insideFiles = subtree.files - (single ? (single.kind === "file" ? 1 : 0) : selectedItems.filter((item) => item.kind === "file").length);
  const insideFolders = subtree.folders - ownFolders;
  if (single) {
    if (single.kind === "file") return `Le fichier « ${single.name} » sera supprimé définitivement.`;
    const content = [insideFiles > 0 && count(insideFiles, "fichier"), insideFolders > 0 && count(insideFolders, "dossier")]
      .filter(Boolean)
      .join(" et ");
    return `Le dossier « ${single.name} »${content ? `, avec ${content},` : ""} sera supprimé définitivement.`;
  }
  const content = [count(subtree.files, "fichier"), subtree.folders > 0 && count(subtree.folders, "dossier")]
    .filter(Boolean)
    .join(" et ");
  return `${content} seront supprimés définitivement, avec le contenu des dossiers.`;
}

function Breadcrumb({ folder }: { folder: DriveFolder }) {
  const steps = [{ id: null as string | null, name: "Mes fichiers" }, ...folder.path];
  const current = steps.at(-1)!;
  return (
    <nav aria-label="Fil d’Ariane" className="flex min-w-0 flex-wrap items-center gap-1.5">
      {steps.slice(0, -1).map((step) => (
        <span key={step.id ?? "root"} className="flex items-center gap-1.5">
          <BreadcrumbStep id={step.id} name={step.name} />
          <ChevronRightIcon aria-hidden className="size-4 text-muted-foreground" />
        </span>
      ))}
      {/* At the root, the title of the page; in a folder, a discreet last step. */}
      <h1
        className={cn(
          "truncate",
          steps.length === 1 ? "font-heading text-3xl font-medium" : "px-1 text-lg text-foreground",
        )}
        aria-current="page"
      >
        {current.name}
      </h1>
    </nav>
  );
}

// A step of the breadcrumb: a link, and a target to move items up.
function BreadcrumbStep({ id, name }: { id: string | null; name: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: `step:${id ?? "root"}`, data: { folderId: id } });
  return (
    <Link
      ref={setNodeRef}
      href={folderPath(id)}
      draggable={false}
      className={cn(
        "px-1 text-lg text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground",
        isOver && "bg-primary/10 text-foreground outline-1 outline-primary",
      )}
    >
      {name}
    </Link>
  );
}

function Toolbar({
  query,
  search,
  onSearch,
  view,
  onQuery,
  onView,
}: {
  query: DriveQuery;
  search: string;
  onSearch: (text: string) => void;
  view: View;
  onQuery: (changes: Partial<DriveQuery>) => void;
  onView: (view: View) => void;
}) {
  const typeLabel = query.type ? CATEGORY_LABELS[query.type] : "Type";

  return (
    <div className="flex min-h-10 flex-wrap items-center gap-2">
      <label className="flex h-9 w-80 items-center gap-2 border border-input bg-background px-3 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        <SearchIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Rechercher dans ce dossier"
          aria-label="Rechercher dans ce dossier"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="outline" size="sm" className={cn(query.type && "border-foreground")} />}
        >
          <ListFilterIcon data-icon="inline-start" />
          {typeLabel}
          <ChevronDownIcon data-icon="inline-end" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          {CATEGORIES.map((category: Category) => (
            <DropdownMenuItem key={category} onClick={() => onQuery({ type: query.type === category ? null : category })}>
              <FileIconFor category={category} />
              <span className="flex-1">{CATEGORY_LABELS[category]}</span>
              {query.type === category && <CheckIcon aria-label="Choisi" />}
            </DropdownMenuItem>
          ))}
          {query.type && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onQuery({ type: null })}>
                <XIcon />
                Tous les types
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {query.type && (
        <Button variant="ghost" size="icon-sm" aria-label="Retirer le filtre" onClick={() => onQuery({ type: null })}>
          <XIcon />
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
          <ArrowUpDownIcon data-icon="inline-start" />
          Trier
          <ChevronDownIcon data-icon="inline-end" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60">
          {SORTS.map((sort) => (
            <DropdownMenuItem key={sort} onClick={() => onQuery({ sort })}>
              <span className="flex-1">{SORT_LABELS[sort]}</span>
              {query.sort === sort && <CheckIcon aria-label="Choisi" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="flex-1" />
      <div role="group" aria-label="Affichage" className="inline-flex border border-border">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Liste"
          aria-pressed={view === "list"}
          className={cn(view === "list" && "bg-muted text-foreground")}
          onClick={() => onView("list")}
        >
          <ListIcon />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Grille"
          aria-pressed={view === "grid"}
          className={cn(view === "grid" && "bg-muted text-foreground")}
          onClick={() => onView("grid")}
        >
          <LayoutGridIcon />
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 border border-dashed border-border px-6 py-16 text-center">
      <p className="font-heading text-2xl font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{text}</p>
      {action}
    </div>
  );
}
