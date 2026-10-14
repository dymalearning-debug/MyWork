import type { NextRequest } from "next/server";

import { getOwnProfile } from "@/lib/account/profile";
import { getCurrentUser } from "@/lib/auth/user";
import { exportCv, exportOrigin } from "@/lib/profile/cv-export";

// The CV as an image, from "Mon profil" only (docs/profile.md, "Export du CV"): the whole height of
// the CV, to send in a messaging app or on a social network. File cv-<handle>.png.
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new Response("Connexion requise", { status: 401 });
  const { handle } = await getOwnProfile(user.id);

  try {
    const png = await exportCv({
      handle,
      format: "png",
      origin: exportOrigin(request.nextUrl),
      cookieHeader: request.headers.get("cookie"),
    });
    return new Response(new Uint8Array(png), {
      headers: {
        "content-type": "image/png",
        "content-disposition": `attachment; filename="cv-${handle}.png"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response("Le CV n'a pas pu être généré. Réessayez.", { status: 500 });
  }
}
