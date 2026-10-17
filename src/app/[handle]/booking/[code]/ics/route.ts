import { buildIcs } from "@/lib/booking/ics";
import { getPublicBooking } from "@/lib/booking/public";
import { guestBookingPath } from "@/lib/booking/rules";
import { profileDisplayName } from "@/lib/profile/content";

// "Ajouter à mon agenda" (docs/booking.md, "Confirmation"): the .ics file of a booking, from its
// secret link, with the link inside to join the meeting. A wrong code, or a cancelled booking:
// not found.
export async function GET(request: Request, { params }: RouteContext<"/[handle]/booking/[code]/ics">) {
  const { handle, code } = await params;
  const booking = await getPublicBooking(handle, code);
  if (!booking || booking.status !== "confirmed") return new Response("Introuvable", { status: 404 });

  const link = `${new URL(request.url).origin}${guestBookingPath(handle, code)}`;
  const ownerName = profileDisplayName(booking.owner);
  const ics = buildIcs({
    uid: `${booking.id}@mywork`,
    start: new Date(booking.startAt),
    end: new Date(booking.endAt),
    summary: `Rendez-vous avec ${ownerName}`,
    description: `Visio · 30 min. Rejoindre la visio (15 minutes avant) ou annuler : ${link}`,
    url: link,
  });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="rendez-vous.ics"',
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
