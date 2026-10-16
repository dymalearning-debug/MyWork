import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";

import { readAsVisitorThenOwner } from "@/lib/public-profile/data";
import { isValidHandle } from "@/lib/public-profile/handle";

import { DRIVE_FILES_BUCKET, PAGE_SIZE, PUBLIC_DOWNLOAD_SECONDS, SIGNED_URL_SECONDS, withDownloadName } from "./rules";
import type { PublicResource, PublicResources } from "./types";

// The "Ressources" tab of the public profile (docs/drive.md, "L'onglet « Ressources »"). Read as
// an anonymous visitor would, then, for an offline profile, as its owner (preview), like the rest
// of the public page: the database only gives the public files, and the storage only lets
// visitors read those of an online profile.

type ResourceRow = Omit<PublicResource, "thumbnailUrl"> & { thumbnailPath: string | null };
type ResourcesRow = { featured: ResourceRow | null; items: ResourceRow[]; total: number };

async function readResources(supabase: SupabaseClient, handle: string, page: number): Promise<PublicResources | null> {
  const { data, error } = await supabase.rpc("get_public_drive_resources", {
    profile_handle: handle,
    page_offset: (page - 1) * PAGE_SIZE,
    page_limit: PAGE_SIZE,
  });
  if (error) throw new Error(`Public resources read failed: ${error.message}`);
  if (!data) return null;
  const row = data as ResourcesRow;

  const all = [...(row.featured ? [row.featured] : []), ...row.items];
  const paths = all.flatMap((item) => (item.thumbnailPath ? [item.thumbnailPath] : []));
  const urls = new Map<string, string>();
  if (paths.length > 0) {
    const { data: signed, error: signError } = await supabase.storage
      .from(DRIVE_FILES_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_SECONDS);
    if (signError) console.error(`Public thumbnails signing failed: ${signError.message}`);
    for (const item of signed ?? []) if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  }
  const shown = ({ thumbnailPath, ...item }: ResourceRow): PublicResource => ({
    ...item,
    size: Number(item.size),
    thumbnailUrl: thumbnailPath ? (urls.get(thumbnailPath) ?? null) : null,
  });
  return { featured: row.featured ? shown(row.featured) : null, items: row.items.map(shown), total: Number(row.total) };
}

// The featured file and one page of the others. null: no such profile, or offline.
export const getPublicResources = cache(async (handle: string, page = 1): Promise<PublicResources | null> => {
  if (!isValidHandle(handle)) return null;
  const result = await readAsVisitorThenOwner((supabase) => readResources(supabase, handle, page));
  return result?.value ?? null;
});

// Whether the "Ressources" tab is shown: at least one public file.
export async function hasPublicResources(handle: string) {
  const resources = await getPublicResources(handle, 1);
  return !!resources && (resources.featured !== null || resources.total > 0);
}

// A download of a public file: a short signed address, made at the click, which saves the file
// under its name (never opened in the browser). null: not a public file of this profile.
export async function getPublicDownloadUrl(handle: string, itemId: string): Promise<string | null> {
  if (!isValidHandle(handle) || !/^[0-9a-f-]{36}$/i.test(itemId)) return null;
  const result = await readAsVisitorThenOwner(async (supabase) => {
    const { data, error } = await supabase
      .rpc("get_public_drive_file", { profile_handle: handle, item_id: itemId })
      .maybeSingle();
    if (error) throw new Error(`Public file read failed: ${error.message}`);
    if (!data) return null;
    const file = data as { path: string; name: string };
    const { data: signed, error: signError } = await supabase.storage
      .from(DRIVE_FILES_BUCKET)
      .createSignedUrl(file.path, PUBLIC_DOWNLOAD_SECONDS);
    if (signError) {
      console.error(`Public file signing failed: ${signError.message}`);
      return null;
    }
    return withDownloadName(signed.signedUrl, file.name);
  });
  return result?.value ?? null;
}
