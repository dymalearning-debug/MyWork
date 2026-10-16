import type { FileCategory } from "./rules";

// Files of the Drive module (docs/drive.md, "Fichiers"): type, limits before sending, numbered
// names, sizes and dates as shown.

export const MAX_FILE_BYTES = 50 * 1024 * 1024;
// Thumbnails of images, made in the browser: 400 pixels, WebP.
export const THUMBNAIL_SIDE = 400;

// Programs, refused (same list as the database, drive_items_no_executable).
export const BLOCKED_EXTENSIONS = [
  "exe", "msi", "bat", "cmd", "com", "scr", "pif", "ps1", "vbs", "sh", "apk", "dmg", "pkg", "deb", "rpm", "jar",
];

// "Devis.final.pdf" → { base: "Devis.final", extension: "pdf" }. A name starting with a dot
// (".env") has no extension.
export function splitExtension(name: string) {
  const dot = name.lastIndexOf(".");
  if (dot <= 0 || dot === name.length - 1) return { base: name, extension: "" };
  return { base: name.slice(0, dot), extension: name.slice(dot + 1) };
}

export const extensionOf = (name: string) => splitExtension(name).extension.toLowerCase();

const EXTENSIONS: Record<Exclude<FileCategory, "other">, string[]> = {
  document: ["pdf", "doc", "docx", "odt", "txt", "md", "markdown", "rtf", "pages"],
  spreadsheet: ["xls", "xlsx", "xlsm", "ods", "csv", "tsv", "numbers"],
  presentation: ["ppt", "pptx", "odp", "key"],
  image: ["jpg", "jpeg", "png", "webp", "gif", "svg", "heic", "heif", "avif", "bmp", "tif", "tiff"],
  video: ["mp4", "mov", "webm", "avi", "mkv", "m4v", "mpeg", "mpg"],
  audio: ["mp3", "wav", "m4a", "aac", "ogg", "oga", "flac", "opus"],
  archive: ["zip", "rar", "7z", "tar", "gz", "tgz", "bz2", "xz"],
};

const MIME_TYPES: [RegExp, FileCategory][] = [
  [/^application\/pdf$|^text\/(plain|markdown|rtf)$|msword|wordprocessingml|opendocument\.text|^application\/rtf$/, "document"],
  [/^text\/(csv|tab-separated-values)$|spreadsheetml|ms-excel|opendocument\.spreadsheet/, "spreadsheet"],
  [/presentationml|ms-powerpoint|opendocument\.presentation/, "presentation"],
  [/^image\//, "image"],
  [/^video\//, "video"],
  [/^audio\//, "audio"],
  [/zip|x-rar|x-7z|x-tar|gzip|x-bzip2|x-xz/, "archive"],
];

// The category of a file, from its extension, else from the type given by the browser.
export function categoryOf(name: string, mimeType: string): FileCategory {
  const extension = extensionOf(name);
  for (const [category, extensions] of Object.entries(EXTENSIONS)) {
    if (extensions.includes(extension)) return category as FileCategory;
  }
  for (const [pattern, category] of MIME_TYPES) if (pattern.test(mimeType)) return category;
  return "other";
}

export const isBlockedName = (name: string) => BLOCKED_EXTENSIONS.includes(extensionOf(name));

// Why a file cannot be sent, before sending it, or null when it can.
export function fileProblem(file: { name: string; size: number }, freeBytes: number) {
  if (isBlockedName(file.name)) return "Refusé : les programmes ne sont pas acceptés";
  if (file.size > MAX_FILE_BYTES) return "Refusé : 50 Mo au plus par fichier";
  if (file.size > freeBytes) return "Refusé : stockage plein";
  return null;
}

// A name not yet taken in the folder (whatever the case): "Devis.pdf", else "Devis (2).pdf",
// "Devis (3).pdf"…
export function freeName(name: string, taken: Iterable<string>) {
  const used = new Set([...taken].map((n) => n.toLowerCase()));
  if (!used.has(name.toLowerCase())) return name;
  const { base, extension } = splitExtension(name);
  const suffix = extension ? `.${extension}` : "";
  for (let n = 2; ; n++) {
    const candidate = `${base} (${n})${suffix}`;
    if (!used.has(candidate.toLowerCase())) return candidate;
  }
}

// Size of a thumbnail: the image reduced to fit in side × side pixels (never enlarged).
export function thumbnailSize(width: number, height: number, side = THUMBNAIL_SIDE) {
  const ratio = Math.min(1, side / width, side / height);
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
}

// What the browser can show in the preview: images and PDF.
export function previewKind(category: FileCategory, mimeType: string | null, name: string) {
  const extension = extensionOf(name);
  if (mimeType === "application/pdf" || extension === "pdf") return "pdf" as const;
  if (category === "image" && !["heic", "heif", "tif", "tiff"].includes(extension)) return "image" as const;
  return null;
}

// ——— As shown ———

const sizeNumber = (value: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: value < 100 ? 1 : 0 }).format(value);

// "4,8 Mo", "860 Ko", "1 Go", "312 octets".
export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} octet${bytes > 1 ? "s" : ""}`;
  const units = ["Ko", "Mo", "Go", "To"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  // 1 023,6 Ko is shown as 1 Mo, not "1 024 Ko".
  if (Math.round(value) >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${sizeNumber(value)} ${units[unit]}`;
}

// Dates in the time of France, the same on the server and in the browser.
const TIME_ZONE = "Europe/Paris";
const dayFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: TIME_ZONE });
const timeFormat = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE });
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });

// "14 oct. 2026", or the time ("14:32") for today.
export function formatDate(iso: string, now = new Date()) {
  const date = new Date(iso);
  if (dayKey.format(date) === dayKey.format(now)) return timeFormat.format(date);
  return dayFormat.format(date);
}

// "14 oct. 2026", always the day (public page).
export const formatDay = (iso: string) => dayFormat.format(new Date(iso));

// "PDF", "Document Word", "Image JPG"… for the "Ressources" tab and the preview.
export function typeLabel(name: string, category: FileCategory) {
  const extension = extensionOf(name);
  const known: Record<string, string> = {
    pdf: "PDF",
    doc: "Document Word",
    docx: "Document Word",
    odt: "Document OpenDocument",
    txt: "Texte",
    md: "Markdown",
    rtf: "Document RTF",
    xls: "Feuille Excel",
    xlsx: "Feuille Excel",
    ods: "Feuille OpenDocument",
    csv: "CSV",
    ppt: "Présentation PowerPoint",
    pptx: "Présentation PowerPoint",
    odp: "Présentation OpenDocument",
    key: "Présentation Keynote",
  };
  if (known[extension]) return known[extension];
  const upper = extension.toUpperCase();
  const prefix = { image: "Image", video: "Vidéo", audio: "Audio", archive: "Archive" }[category as string];
  if (prefix) return upper ? `${prefix} ${upper}` : prefix;
  return upper || "Fichier";
}
