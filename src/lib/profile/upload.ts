import { createClient } from "@/lib/supabase/client";

import { PROFILE_IMAGES_BUCKET } from "./images";

// Sends an image of "Mon profil" (photo, project image) to the user's folder, straight from the
// browser: the storage only lets them write there. A new name each time, which nobody can guess.
// It is used once the profile is saved; images never saved are removed at the next save.
export async function uploadProfileImage(userId: string, image: Blob): Promise<string> {
  const extension = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(PROFILE_IMAGES_BUCKET)
    .upload(path, image, { contentType: image.type, cacheControl: "31536000", upsert: false });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  return supabase.storage.from(PROFILE_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
}

// The square chosen in the crop window, as an image of 800 × 800 pixels at most.
export async function cropToSquare(
  source: string,
  area: { x: number; y: number; width: number; height: number },
): Promise<Blob> {
  const image = new Image();
  image.src = source;
  await image.decode();
  const size = Math.min(800, Math.round(area.width));
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  context.imageSmoothingQuality = "high";
  context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, size, size);
  // JPEG: every browser writes it, and the share preview (next/og) reads it.
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) throw new Error("Image encoding failed");
  return blob;
}
