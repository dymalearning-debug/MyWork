import { getOwnProfile } from "@/lib/account/profile";
import { getSubscribedUser } from "@/lib/billing/data";
import { getOwnBooking } from "@/lib/booking/data";
import { meetingAccess } from "@/lib/booking/meeting";
import { isUuid } from "@/lib/booking/rules";
import { profileDisplayName } from "@/lib/profile/content";

// The owner's access to the meeting room of one of their bookings (docs/booking.md, "Visio",
// "Accès"): signed in, only inside the window of the room.
export async function POST(_request: Request, { params }: RouteContext<"/app/booking/[id]/meet/token">) {
  const { id } = await params;
  const user = await getSubscribedUser();
  if (!user) return Response.json({ ok: false, reason: "not_found" }, { status: 401 });
  const booking = isUuid(id) ? await getOwnBooking(id) : null;
  if (!booking) return Response.json({ ok: false, reason: "not_found" }, { status: 404 });
  const profile = await getOwnProfile(user.id);

  const access = await meetingAccess({
    bookingId: booking.id,
    startAt: new Date(booking.startAt),
    endAt: new Date(booking.endAt),
    cancelled: booking.status === "cancelled",
    identity: `owner-${user.id}`,
    name: profileDisplayName(profile),
  });
  return Response.json(access, { status: access.ok ? 200 : 403, headers: { "Cache-Control": "no-store" } });
}
