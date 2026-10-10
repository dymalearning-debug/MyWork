import "server-only";

import { headers } from "next/headers";

// Address of the site the request comes from (local, Vercel preview or production).
// Email links and the Google return go back there, not to the Supabase "site URL"
// (docs/auth.md, "Technique"). Supabase only accepts addresses from its allow list.
export async function getRequestOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
