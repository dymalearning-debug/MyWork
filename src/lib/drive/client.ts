import * as tus from "tus-js-client";

import { createClient } from "@/lib/supabase/client";
import { getSupabaseEnv } from "@/lib/supabase/env";

import { categoryOf, freeName, thumbnailSize } from "./files";
import {
  DRIVE_FILES_BUCKET,
  PROBLEM_MESSAGES,
  problemOf,
  SIGNED_URL_SECONDS,
  withDownloadName,
  type DriveProblem,
} from "./rules";

// Writes of "Mes fichiers", straight from the browser into the table and the storage
// (docs/drive.md, "Données" and "Technique"). RLS limits them to the user's own items; the
// database checks the rules (names, levels, capacity).

export class DriveWriteError extends Error {
  constructor(
    message: string,
    readonly problem: DriveProblem | null,
  ) {
    super(message);
  }
}

// What to tell the user when a write failed: the rule broken, or the fallback.
export function failureMessage(error: unknown, fallback: string) {
  return error instanceof DriveWriteError && error.problem ? PROBLEM_MESSAGES[error.problem] : fallback;
}

function check(error: { message: string; code?: string } | null, what: string) {
  if (error) throw new DriveWriteError(`${what} failed: ${error.message}`, problemOf(error));
}

const db = () => createClient();
const storage = () => db().storage.from(DRIVE_FILES_BUCKET);
const filePath = (userId: string, id: string) => `${userId}/${id}`;
const thumbPath = (userId: string, id: string) => `${userId}/${id}-thumb.webp`;

// ——— Folders and items ———

export async function createFolder(parentId: string | null, name: string): Promise<string> {
  const id = crypto.randomUUID();
  const { error } = await db()
    .from("drive_items")
    .insert({ id, parent_id: parentId, kind: "folder", name, category: "folder" });
  check(error, "Folder creation");
  return id;
}

export async function renameItem(id: string, name: string) {
  const { error } = await db().from("drive_items").update({ name }).eq("id", id);
  check(error, "Rename");
}

// Into another folder (null: "Mes fichiers"), all together or none.
export async function moveItems(ids: string[], parentId: string | null) {
  const { error } = await db().from("drive_items").update({ parent_id: parentId }).in("id", ids);
  check(error, "Move");
}

// Only files have a visibility: folders are left out by the caller.
export async function setVisibility(fileIds: string[], isPublic: boolean) {
  if (fileIds.length === 0) return;
  const { error } = await db()
    .from("drive_items")
    .update({ visibility: isPublic ? "public" : "private" })
    .in("id", fileIds);
  check(error, "Visibility change");
}

export async function setFeatured(id: string, featured: boolean) {
  const { error } = await db().rpc("set_drive_featured", { item_id: id, featured });
  check(error, "Featuring");
}

export type Subtree = { ids: string[]; files: number; folders: number; paths: string[] };

// The items and everything inside them, before a deletion: what the confirmation announces.
export async function getSubtree(userId: string, ids: string[]): Promise<Subtree> {
  const { data, error } = await db().rpc("drive_subtree", { item_ids: ids });
  check(error, "Subtree read");
  const rows = data as { id: string; kind: "folder" | "file"; has_thumbnail: boolean }[];
  return {
    ids,
    files: rows.filter((row) => row.kind === "file").length,
    folders: rows.filter((row) => row.kind === "folder").length,
    paths: rows
      .filter((row) => row.kind === "file")
      .flatMap((row) => (row.has_thumbnail ? [filePath(userId, row.id), thumbPath(userId, row.id)] : [filePath(userId, row.id)])),
  };
}

// Final deletion (no bin): the files leave the storage first, then the rows (their contents go
// with them). A file left behind by a failure is removed with the account.
export async function deleteItems(subtree: Subtree) {
  await removeFiles(subtree.paths);
  const { error } = await db().from("drive_items").delete().in("id", subtree.ids);
  check(error, "Deletion");
}

async function removeFiles(paths: string[]) {
  for (let start = 0; start < paths.length; start += 1000) {
    const { error } = await storage().remove(paths.slice(start, start + 1000));
    if (error) console.error(`Drive files removal failed: ${error.message}`);
  }
}

// Every folder of the user, for the "Déplacer" window.
export async function listFolders(): Promise<{ id: string; name: string; parentId: string | null }[]> {
  const { data, error } = await db()
    .from("drive_items")
    .select("id, name, parent_id")
    .eq("kind", "folder")
    .order("search_name");
  check(error, "Folders read");
  return (data ?? []).map((row) => ({ id: row.id as string, name: row.name as string, parentId: row.parent_id as string | null }));
}

// A signed address of a file, for the preview, or for a download under its name.
export async function fileUrl(userId: string, item: { id: string; name: string }, download: boolean) {
  const { data, error } = await storage().createSignedUrl(filePath(userId, item.id), SIGNED_URL_SECONDS);
  check(error, "File signing");
  return download ? withDownloadName(data!.signedUrl, item.name) : data!.signedUrl;
}

// ——— Uploads ———

export type UploadHandle = { done: Promise<string>; cancel: () => void };

export class UploadCancelled extends Error {}

// Sends a file into a folder (docs/drive.md, "Envoi"): its row first, under a free name ("Devis
// (2).pdf"), which the database refuses when the capacity would be exceeded; then the file, by the
// resumable protocol (TUS), with its progress; the thumbnail of an image; then the upload is
// completed. On failure or cancellation, the row and what was sent are removed.
// done: the name given to the file.
export function uploadFile(
  userId: string,
  parentId: string | null,
  file: File,
  onProgress: (sent: number, total: number) => void,
): UploadHandle {
  let cancelled = false;
  let transfer: tus.Upload | null = null;
  let rejectTransfer: ((reason: unknown) => void) | null = null;
  const id = crypto.randomUUID();
  let created = false;

  const done = (async () => {
    const name = await createFileRow(id, parentId, file);
    created = true;
    if (cancelled) throw new UploadCancelled();

    await new Promise<void>((resolve, reject) => {
      rejectTransfer = reject;
      void sendWithTus(userId, id, file, onProgress, resolve, reject).then((upload) => {
        transfer = upload;
        if (cancelled) upload.abort(true).catch(() => undefined);
      });
    });
    if (cancelled) throw new UploadCancelled();

    if (file.type.startsWith("image/")) await sendThumbnail(userId, id, file).catch(() => undefined);

    const { data, error } = await db().rpc("complete_drive_upload", { item_id: id });
    check(error, "Upload completion");
    if (data === "storage_full") {
      created = false;
      await removeFiles([filePath(userId, id), thumbPath(userId, id)]);
      throw new DriveWriteError("Upload completion failed: storage full", "storage_full");
    }
    return name;
  })().catch(async (error: unknown) => {
    if (created) {
      await removeFiles([filePath(userId, id), thumbPath(userId, id)]);
      await db().from("drive_items").delete().eq("id", id);
    }
    throw error;
  });

  return {
    done,
    cancel: () => {
      cancelled = true;
      transfer?.abort(true).catch(() => undefined);
      rejectTransfer?.(new UploadCancelled());
    },
  };
}

// The row of a new file, under a name free in its folder. Two uploads of the same name at the
// same moment: the second one tries the next number.
async function createFileRow(id: string, parentId: string | null, file: File) {
  for (let attempt = 0; ; attempt++) {
    const names = await namesIn(parentId);
    const name = freeName(file.name.trim() || "Fichier sans nom", names);
    const { error } = await db()
      .from("drive_items")
      .insert({
        id,
        parent_id: parentId,
        kind: "file",
        name,
        category: categoryOf(name, file.type),
        mime_type: file.type || null,
        size: file.size,
      });
    if (!error) return name;
    if (problemOf(error) !== "name_taken" || attempt >= 4) check(error, "File creation");
  }
}

async function namesIn(parentId: string | null) {
  const request = db().from("drive_items").select("name");
  const { data, error } = await (parentId ? request.eq("parent_id", parentId) : request.is("parent_id", null));
  check(error, "Names read");
  return (data ?? []).map((row) => row.name as string);
}

async function sendWithTus(
  userId: string,
  id: string,
  file: File,
  onProgress: (sent: number, total: number) => void,
  resolve: () => void,
  reject: (reason: unknown) => void,
) {
  const { url, publishableKey } = getSupabaseEnv();
  const {
    data: { session },
  } = await db().auth.getSession();
  const upload = new tus.Upload(file, {
    endpoint: `${url}/storage/v1/upload/resumable`,
    retryDelays: [0, 3000, 5000, 10000, 20000],
    headers: { authorization: `Bearer ${session?.access_token ?? ""}`, apikey: publishableKey, "x-upsert": "false" },
    uploadDataDuringCreation: true,
    removeFingerprintOnSuccess: true,
    metadata: {
      bucketName: DRIVE_FILES_BUCKET,
      objectName: filePath(userId, id),
      contentType: file.type || "application/octet-stream",
      cacheControl: "3600",
    },
    // The size of chunk required by Supabase.
    chunkSize: 6 * 1024 * 1024,
    onProgress,
    onSuccess: () => resolve(),
    onError: (error) => reject(new DriveWriteError(`Upload failed: ${error.message}`, null)),
  });
  upload.start();
  return upload;
}

// A thumbnail of 400 pixels, in WebP, for the grid and the "Ressources" tab. An image the
// browser cannot read has none.
async function sendThumbnail(userId: string, id: string, file: File) {
  const bitmap = await createImageBitmap(file);
  const size = thumbnailSize(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
  if (!blob || blob.type !== "image/webp") return;
  await storage().upload(thumbPath(userId, id), blob, { contentType: "image/webp", upsert: false });
}
