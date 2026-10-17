import "server-only";

import { AccessToken, RoomConfiguration } from "livekit-server-sdk";

import { meetingPhase, meetingWindow, type MeetingPhase } from "./rules";

// Access to the meeting room of a booking (docs/booking.md, "Visio"), with LiveKit Cloud. The
// server makes a short access token, only inside the window of the room (15 minutes before the
// start, 30 minutes after the planned end), for the room "booking-<id>": 2 people at most, closed
// by LiveKit after 5 minutes empty. Outside the window, or for a cancelled booking, no token: a
// shared link or a page left open costs nothing. The keys stay on the server.

export const roomName = (bookingId: string) => `booking-${bookingId}`;
const EMPTY_ROOM_SECONDS = 5 * 60;

export type MeetingAccess =
  | { ok: true; token: string; serverUrl: string; closesAt: string }
  | { ok: false; reason: Exclude<MeetingPhase, "open"> | "unavailable" };

export async function meetingAccess({
  bookingId,
  startAt,
  endAt,
  cancelled,
  identity,
  name,
  now = new Date(),
}: {
  bookingId: string;
  startAt: Date;
  endAt: Date;
  cancelled: boolean;
  identity: string;
  name: string;
  now?: Date;
}): Promise<MeetingAccess> {
  const phase = meetingPhase({ startAt, endAt, cancelled }, now);
  if (phase !== "open") return { ok: false, reason: phase };

  const serverUrl = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!serverUrl || !apiKey || !apiSecret) {
    console.error("LiveKit is not configured (LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET).");
    return { ok: false, reason: "unavailable" };
  }

  const { closesAt } = meetingWindow(startAt, endAt);
  const room = roomName(bookingId);
  // The token lets one join until the room closes; after that, the page leaves the room.
  const token = new AccessToken(apiKey, apiSecret, {
    identity,
    name,
    ttl: Math.max(60, Math.ceil((closesAt.getTime() - now.getTime()) / 1000)),
  });
  token.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true });
  token.roomConfig = new RoomConfiguration({
    name: room,
    maxParticipants: 2,
    emptyTimeout: EMPTY_ROOM_SECONDS,
    departureTimeout: EMPTY_ROOM_SECONDS,
  });
  return { ok: true, token: await token.toJwt(), serverUrl, closesAt: closesAt.toISOString() };
}
