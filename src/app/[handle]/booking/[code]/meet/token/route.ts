import { meetingAccess } from "@/lib/booking/meeting";
import { getPublicBooking } from "@/lib/booking/public";

// The guest's access to the meeting room (docs/booking.md, "Visio", "Accès"): a LiveKit token,
// only inside the window of the room, from the secret link. Their name: the one given when booking.
export async function POST(_request: Request, { params }: RouteContext<"/[handle]/booking/[code]/meet/token">) {
  const { handle, code } = await params;
  const booking = await getPublicBooking(handle, code);
  if (!booking) return Response.json({ ok: false, reason: "not_found" }, { status: 404 });

  const access = await meetingAccess({
    bookingId: booking.id,
    startAt: new Date(booking.startAt),
    endAt: new Date(booking.endAt),
    cancelled: booking.status === "cancelled",
    identity: `guest-${booking.id}`,
    name: booking.guestName,
  });
  return Response.json(access, { status: access.ok ? 200 : 403, headers: { "Cache-Control": "no-store" } });
}
