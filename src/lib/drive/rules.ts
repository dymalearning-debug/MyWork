// Rules of the Drive module (docs/drive.md): addresses, limits, sorting, filter and pagination.
// The limits are also checked by the database (supabase/migrations/20261015120000_add_drive_module.sql).

export const DRIVE_PATH = "/app/drive";
export const folderPath = (folderId: string | null) => (folderId ? `${DRIVE_PATH}/${folderId}` : DRIVE_PATH);

export const DRIVE_FILES_BUCKET = "drive-files";
// Signed addresses: an hour in the private space, a minute for the downloads of visitors (the
// address is made at the click, then followed at once).
export const SIGNED_URL_SECONDS = 60 * 60;
export const PUBLIC_DOWNLOAD_SECONDS = 60;

export const ITEM_NAME_MAX = 120;
export const MAX_FOLDER_DEPTH = 10;
export const PAGE_SIZE = 50;
export const NEW_FOLDER_NAME = "Dossier sans titre";

// List or grid, remembered on each device.
export const VIEW_COOKIE = "mywork-drive-view";
export type DriveView = "list" | "grid";
export const parseView = (value: string | undefined): DriveView => (value === "grid" ? "grid" : "list");

// ——— Categories (filter "Type") ———

export const CATEGORIES = [
  "folder",
  "document",
  "spreadsheet",
  "presentation",
  "image",
  "video",
  "audio",
  "archive",
  "other",
] as const;
export type Category = (typeof CATEGORIES)[number];
export type FileCategory = Exclude<Category, "folder">;

export const CATEGORY_LABELS: Record<Category, string> = {
  folder: "Dossiers",
  document: "Documents",
  spreadsheet: "Feuilles de calcul",
  presentation: "Présentations",
  image: "Images",
  video: "Vidéos",
  audio: "Audio",
  archive: "Archives",
  other: "Autres",
};

export const isCategory = (value: unknown): value is Category =>
  typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);

// ——— Sorting ———

export const SORTS = ["name", "name-desc", "date", "date-asc"] as const;
export type Sort = (typeof SORTS)[number];
export const DEFAULT_SORT: Sort = "name";

export const SORT_LABELS: Record<Sort, string> = {
  name: "Nom (A → Z)",
  "name-desc": "Nom (Z → A)",
  date: "Modifié (récent d’abord)",
  "date-asc": "Modifié (ancien d’abord)",
};

// A click on a column title sorts by it; a second click reverses.
export function nextSort(current: Sort, column: "name" | "date"): Sort {
  if (column === "name") return current === "name" ? "name-desc" : "name";
  return current === "date" ? "date-asc" : "date";
}

// ——— The view in the address: ?q=…&type=…&sort=…&page=… ———

export type DriveQuery = { q: string; type: Category | null; sort: Sort; page: number };

export const DEFAULT_QUERY: DriveQuery = { q: "", type: null, sort: DEFAULT_SORT, page: 1 };

type Params = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export function parseQuery(params: Params): DriveQuery {
  const q = (first(params.q) ?? "").slice(0, 100);
  const type = first(params.type);
  const sort = first(params.sort);
  const page = Number.parseInt(first(params.page) ?? "", 10);
  return {
    q,
    type: isCategory(type) ? type : null,
    sort: (SORTS as readonly string[]).includes(sort ?? "") ? (sort as Sort) : DEFAULT_SORT,
    page: Number.isFinite(page) && page > 1 ? Math.min(page, 100_000) : 1,
  };
}

// The address of a view; the default values are left out.
export function queryString(query: DriveQuery) {
  const params = new URLSearchParams();
  if (query.q.trim()) params.set("q", query.q);
  if (query.type) params.set("type", query.type);
  if (query.sort !== DEFAULT_SORT) params.set("sort", query.sort);
  if (query.page > 1) params.set("page", String(query.page));
  const text = params.toString();
  return text ? `?${text}` : "";
}

// ——— Search ———

// Without accents nor capitals, like the name kept by the database (search_name).
export function searchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .trim();
}

// A pattern for "contains", where % and _ are taken literally.
export function containsPattern(value: string) {
  return `%${searchText(value).replace(/[\\%_]/g, (character) => `\\${character}`)}%`;
}

// ——— Pagination ———

export function pageCount(total: number) {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

// "1–50 sur 132".
export function rangeLabel(page: number, total: number) {
  if (total === 0) return "0 élément";
  const start = (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);
  return `${start}–${end} sur ${total}`;
}

// The page numbers shown: the first, the current one and its neighbours, the last; "gap" where
// pages are skipped. A gap that would hide a single page shows it instead.
export function pageNumbers(current: number, total: number): (number | "gap")[] {
  const shown = new Set([1, total, current - 1, current, current + 1].filter((n) => n >= 1 && n <= total));
  const sorted = [...shown].sort((a, b) => a - b);
  const result: (number | "gap")[] = [];
  for (const n of sorted) {
    const previous = result.at(-1);
    if (typeof previous === "number" && n - previous === 2) result.push(n - 1);
    else if (typeof previous === "number" && n - previous > 2) result.push("gap");
    result.push(n);
  }
  return result;
}

// ——— Names ———

// Spaces at both ends removed; null when nothing is left.
export function cleanName(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, ITEM_NAME_MAX) : null;
}

// ——— Errors of the database ———

export type DriveProblem = "storage_full" | "too_many_uploads" | "depth" | "into_itself" | "name_taken" | "executable" | "not_folder";

export const PROBLEM_MESSAGES: Record<DriveProblem, string> = {
  storage_full: "Stockage plein — Supprimez des fichiers pour en ajouter d’autres.",
  too_many_uploads: "Trop d’envois en cours — Attendez la fin des envois en cours.",
  depth: `${MAX_FOLDER_DEPTH} niveaux de dossiers au plus.`,
  into_itself: "Un dossier ne peut pas aller dans l’un de ses propres sous-dossiers.",
  name_taken: "Un élément porte déjà ce nom dans ce dossier.",
  executable: "Les programmes (.exe, .msi, .bat…) ne sont pas acceptés.",
  not_folder: "Ce dossier n’existe plus.",
};

// The rule the database refused, from its error, or null.
export function problemOf(error: { message?: string; code?: string } | null | undefined): DriveProblem | null {
  const message = error?.message ?? "";
  if (message.includes("drive_storage_full")) return "storage_full";
  if (message.includes("drive_too_many_uploads")) return "too_many_uploads";
  if (message.includes("drive_depth_limit_reached")) return "depth";
  if (message.includes("drive_move_into_itself")) return "into_itself";
  if (message.includes("drive_parent_not_folder")) return "not_folder";
  if (message.includes("drive_items_no_executable")) return "executable";
  if (error?.code === "23505" || message.includes("drive_items_name_key")) return "name_taken";
  return null;
}

// ——— Downloads ———

// A signed address that saves the file under its name. The option of supabase-js encodes the name
// twice ("Kit m%C3%A9dia.pdf"): it is added here, encoded once. It is not part of the signature.
export function withDownloadName(signedUrl: string, name: string) {
  return `${signedUrl}${signedUrl.includes("?") ? "&" : "?"}download=${encodeURIComponent(name)}`;
}
