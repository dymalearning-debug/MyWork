// Images of the profile (docs/profile.md, "Fichiers"): the photo and the project images, in the
// Supabase Storage bucket "profile-images". One folder per user, named after their id, where only
// they can write; public read by address, with file names nobody can guess.

export const PROFILE_IMAGES_BUCKET = "profile-images";
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

// "u1/abc.webp" for an image of the bucket, from its public address; null for another address
// (the Google photo).
export function profileImagePath(url: string) {
  const marker = `/storage/v1/object/public/${PROFILE_IMAGES_BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length).split("?")[0]);
}

// Why a file cannot be sent, or null when it can.
export function imageFileProblem(file: { type: string; size: number }) {
  if (!IMAGE_TYPES.includes(file.type)) return "Format non pris en charge : JPG, PNG ou WebP.";
  if (file.size > IMAGE_MAX_BYTES) return "Image trop lourde : 5 Mo au plus.";
  return null;
}
