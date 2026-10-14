import type { NextRequest } from "next/server";

import { exportCv, exportOrigin } from "@/lib/profile/cv-export";
import { getProfileView } from "@/lib/public-profile/data";

// "Télécharger le CV" (docs/profile.md, "Export du CV"): the PDF of the CV, for every visitor of
// an online profile, and for the owner of an offline one. File cv-<handle>.pdf.
export async function GET(request: NextRequest, { params }: RouteContext<"/[handle]/cv/pdf">) {
  const { handle } = await params;
  if (!(await getProfileView(handle))) return new Response("Page introuvable", { status: 404 });

  try {
    const pdf = await exportCv({
      handle,
      format: "pdf",
      origin: exportOrigin(request.nextUrl),
      cookieHeader: request.headers.get("cookie"),
    });
    return new Response(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="cv-${handle}.pdf"`,
        "cache-control": "private, no-store",
        "x-robots-tag": "noindex",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response("Le CV n'a pas pu être généré. Réessayez.", { status: 500 });
  }
}
