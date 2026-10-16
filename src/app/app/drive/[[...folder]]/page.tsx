import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { getOwnProfile } from "@/lib/account/profile";
import { requireUser } from "@/lib/auth/user";
import { getDriveFolder, getOwnStorageUsage, removeStaleUploads } from "@/lib/drive/data";
import { folderPath, pageCount, parseQuery, parseView, queryString, VIEW_COOKIE } from "@/lib/drive/rules";
import { profileInitials } from "@/lib/profile/content";

import { DriveSkeleton } from "../_components/drive-skeleton";
import { DriveView } from "../_components/drive-view";

export const metadata: Metadata = { title: "Mes fichiers · MyWork" };

// "Mes fichiers" (docs/drive.md): /app/drive for the root, /app/drive/<id> for a folder. The search,
// the filter, the sort and the page are in the address. Another user's folder, or a deleted one,
// is not found.
export default function DrivePage({ params, searchParams }: PageProps<"/app/drive/[[...folder]]">) {
  return (
    <Suspense fallback={<DriveSkeleton />}>
      <DriveContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function DriveContent({
  params,
  searchParams,
}: {
  params: PageProps<"/app/drive/[[...folder]]">["params"];
  searchParams: PageProps<"/app/drive/[[...folder]]">["searchParams"];
}) {
  const user = await requireUser();
  const { folder } = await params;
  if (folder && folder.length > 1) notFound();
  const folderId = folder?.[0] ?? null;
  const query = parseQuery(await searchParams);

  const [driveFolder, usage, profile, cookieStore] = await Promise.all([
    getDriveFolder(folderId, query),
    getOwnStorageUsage(),
    getOwnProfile(user.id),
    cookies(),
    removeStaleUploads(user.id).catch((error: unknown) => console.error(error)),
  ]);
  if (!driveFolder) notFound();
  // Beyond the last page (items deleted meanwhile): the last page.
  if (query.page > pageCount(driveFolder.total)) {
    redirect(`${folderPath(folderId)}${queryString({ ...query, page: pageCount(driveFolder.total) })}`);
  }

  return (
    <DriveView
      userId={user.id}
      owner={{ photoUrl: profile.photoUrl, initials: profileInitials(profile) }}
      folder={driveFolder}
      query={query}
      usage={usage}
      initialView={parseView(cookieStore.get(VIEW_COOKIE)?.value)}
    />
  );
}
