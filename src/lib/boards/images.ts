// Images of the cards (docs/boards.md, "Images"): in the private Supabase Storage bucket
// "board-images", one folder per user, shown through signed addresses valid for an hour.

export const BOARD_IMAGES_BUCKET = "board-images";
export const SIGNED_URL_SECONDS = 60 * 60;
export const BOARD_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const BOARD_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
// Larger images are reduced when they are sent.
export const BOARD_IMAGE_MAX_SIDE = 1600;

// Why a file cannot be sent, or null when it can.
export function boardImageProblem(file: { type: string; size: number }) {
  if (!BOARD_IMAGE_TYPES.includes(file.type)) return "Format non pris en charge : JPG, PNG, WebP ou GIF.";
  if (file.size > BOARD_IMAGE_MAX_BYTES) return "Image trop lourde : 5 Mo au plus.";
  return null;
}

// Size of an image reduced to fit in max × max pixels, or null when it already fits.
export function reducedSize(width: number, height: number, max = BOARD_IMAGE_MAX_SIDE) {
  if (width <= max && height <= max) return null;
  const ratio = Math.min(max / width, max / height);
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}

export function extensionOf(type: string) {
  return { "image/png": "png", "image/webp": "webp", "image/gif": "gif" }[type] ?? "jpg";
}
