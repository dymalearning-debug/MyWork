import { notFound, redirect } from "next/navigation";

import { getPublicDownloadUrl } from "@/lib/drive/public";

// Download of a public file of the "Ressources" tab (docs/drive.md): a short signed address, made
// at the click, which saves the file under its name. A private file, or a profile gone offline:
// not found.
export async function GET(_request: Request, { params }: RouteContext<"/[handle]/resources/[itemId]">) {
  const { handle, itemId } = await params;
  const url = await getPublicDownloadUrl(handle, itemId);
  if (!url) notFound();
  redirect(url);
}
