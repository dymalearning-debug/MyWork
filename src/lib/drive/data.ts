import "server-only";

import { createClient } from "@/lib/supabase/server";

import { containsPattern, DRIVE_FILES_BUCKET, PAGE_SIZE, SIGNED_URL_SECONDS, type DriveQuery } from "./rules";
import type { DriveFolder, DriveItem, FolderStep, StorageUsage } from "./types";

// Reads of "Mes fichiers", for the signed-in user: RLS limits them to their own items.
// Search, filter, sort and pagination are done by the database: one query per page.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ItemRow = {
  id: string;
  user_id: string;
  kind: "folder" | "file";
  name: string;
  category: DriveItem["category"];
  mime_type: string | null;
  size: number | null;
  updated_at: string;
  visibility: "private" | "public";
  is_featured: boolean;
  has_thumbnail: boolean;
};

export const thumbnailPath = (userId: string, itemId: string) => `${userId}/${itemId}-thumb.webp`;

// A folder ("Mes fichiers" when folderId is null) and one page of its items. null: no such
// folder for this user (another user's folder, a file, or deleted).
export async function getDriveFolder(folderId: string | null, query: DriveQuery): Promise<DriveFolder | null> {
  if (folderId !== null && !UUID.test(folderId)) return null;
  const supabase = await createClient();

  let path: FolderStep[] = [];
  if (folderId) {
    const { data, error } = await supabase.rpc("drive_folder_path", { folder_id: folderId });
    if (error) throw new Error(`Folder path read failed: ${error.message}`);
    path = data as FolderStep[];
    if (path.length === 0) return null;
  }

  // The items of the folder; with the search and the filter when filtered.
  const select = (filtered: boolean) => {
    let request = supabase
      .from("drive_items")
      .select("id, user_id, kind, name, category, mime_type, size, updated_at, visibility, is_featured, has_thumbnail", {
        count: "exact",
      })
      .eq("is_uploaded", true);
    request = folderId ? request.eq("parent_id", folderId) : request.is("parent_id", null);
    if (filtered && query.q.trim()) request = request.ilike("search_name", containsPattern(query.q));
    if (filtered && query.type) request = request.eq("category", query.type);
    return request;
  };

  // Folders first ("folder" after "file"), then the chosen order.
  let request = select(true).order("kind", { ascending: false });
  if (query.sort === "name" || query.sort === "name-desc") {
    const ascending = query.sort === "name";
    request = request.order("search_name", { ascending }).order("name", { ascending });
  } else {
    request = request.order("updated_at", { ascending: query.sort === "date-asc" });
  }
  const from = (query.page - 1) * PAGE_SIZE;
  const { data, error, count } = await request.order("id").range(from, from + PAGE_SIZE - 1);
  // Beyond the last page, the database answers with an error: nothing to show.
  const beyond = error?.code === "PGRST103";
  if (error && !beyond) throw new Error(`Drive items read failed: ${error.message}`);
  const rows = (beyond ? [] : data) as ItemRow[];

  const countOf = async (filtered: boolean) => {
    const { count: counted, error: countError } = await select(filtered).limit(0);
    if (countError) throw new Error(`Drive items count failed: ${countError.message}`);
    return counted ?? 0;
  };
  const total = beyond ? await countOf(true) : (count ?? 0);
  const folderTotal = query.q.trim() || query.type ? await countOf(false) : total;

  const thumbnails = rows.filter((row) => row.has_thumbnail).map((row) => thumbnailPath(row.user_id, row.id));
  const urls = new Map<string, string>();
  if (thumbnails.length > 0) {
    const { data: signed, error: signError } = await supabase.storage
      .from(DRIVE_FILES_BUCKET)
      .createSignedUrls(thumbnails, SIGNED_URL_SECONDS);
    if (signError) console.error(`Thumbnails signing failed: ${signError.message}`);
    for (const item of signed ?? []) if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  }

  return {
    folderId,
    path,
    total,
    folderTotal,
    items: rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      name: row.name,
      category: row.category,
      mimeType: row.mime_type,
      size: row.size,
      updatedAt: row.updated_at,
      isPublic: row.visibility === "public",
      isFeatured: row.is_featured,
      thumbnailUrl: row.has_thumbnail ? (urls.get(thumbnailPath(row.user_id, row.id)) ?? null) : null,
    })),
  };
}

// The storage indicator (docs/drive.md, "Indicateur de stockage").
export async function getOwnStorageUsage(): Promise<StorageUsage> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_own_storage_usage").single();
  if (error) throw new Error(`Storage usage read failed: ${error.message}`);
  const usage = data as { drive: number; profile: number; boards: number; capacity: number };
  return {
    drive: Number(usage.drive),
    profile: Number(usage.profile),
    boards: Number(usage.boards),
    capacity: Number(usage.capacity),
  };
}

// Rows left without their file (a tab closed during an upload), after a day: removed with what
// may have reached the storage (docs/drive.md, "Technique"). A failure is harmless: next time.
export async function removeStaleUploads(userId: string) {
  const supabase = await createClient();
  const before = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("drive_items")
    .select("id")
    .eq("is_uploaded", false)
    .lt("created_at", before)
    .limit(100);
  if (error || data.length === 0) return;
  const ids = data.map((row) => row.id as string);
  await supabase.storage
    .from(DRIVE_FILES_BUCKET)
    .remove(ids.flatMap((id) => [`${userId}/${id}`, thumbnailPath(userId, id)]));
  await supabase.from("drive_items").delete().in("id", ids);
}

// Account deletion: the storage is not emptied by the cascade of the database, so the files go
// first (docs/drive.md, "Données"). Page by page.
export async function removeAllOwnDriveFiles(userId: string) {
  const supabase = await createClient();
  const storage = supabase.storage.from(DRIVE_FILES_BUCKET);
  for (;;) {
    const { data, error } = await storage.list(userId, { limit: 1000 });
    if (error) throw new Error(`Drive files listing failed: ${error.message}`);
    const files = data.filter((file) => file.id).map((file) => `${userId}/${file.name}`);
    if (files.length === 0) return;
    const { error: removeError } = await storage.remove(files);
    if (removeError) throw new Error(`Drive files removal failed: ${removeError.message}`);
    if (files.length < 1000) return;
  }
}
