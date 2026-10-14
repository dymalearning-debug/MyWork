import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";
import { connection } from "next/server";

import { profileDisplayName, profileInitials } from "@/lib/profile/content";
import { getOnlineProfile } from "@/lib/public-profile/data";

// Share preview of a public profile (docs/profile.md, "Page publique"): the photo, the name and the
// title, in the style of MyWork's own share image (deep black, studio light, the logo).
// Only online profiles: the preview is read by the sites the link is shared on, never by the owner.

export const alt = "Profil MyWork";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The same colors as the dark theme (src/app/globals.css), written out: next/og does not read CSS.
const INK = "#0b0a09";
const WHITE = "#f6f6f6";
const MUTED = "#a8a5a1";
const SPOTLIGHT = "#2a2826";

const fontFile = (weight: number) =>
  readFile(join(process.cwd(), `node_modules/@fontsource/newsreader/files/newsreader-latin-${weight}-normal.woff`));

export default async function Image({ params }: { params: Promise<{ handle: string }> }) {
  // Read at each request: the profile changes, and goes online or offline.
  await connection();
  const { handle } = await params;
  const profile = await getOnlineProfile(handle);
  if (!profile) return new Response("Not found", { status: 404 });

  const [newsreader, logo] = await Promise.all([
    fontFile(500),
    readFile(join(process.cwd(), "public/brand/mywork-logo-white.svg"), "utf8"),
  ]);
  const name = profileDisplayName(profile);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          backgroundColor: INK,
          backgroundImage: `radial-gradient(ellipse 90% 70% at 50% 0%, ${SPOTLIGHT}, ${INK} 70%)`,
          color: WHITE,
        }}
      >
        <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 56 }}>
          {profile.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photoUrl} alt="" width={220} height={220} style={{ objectFit: "cover" }} />
          ) : (
            <div
              style={{
                width: 220,
                height: 220,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: WHITE,
                color: INK,
                fontFamily: "Newsreader",
                fontSize: 88,
              }}
            >
              {profileInitials(profile)}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1, minWidth: 0 }}>
            {profile.headline && (
              <div style={{ fontSize: 22, lineHeight: 1.4, letterSpacing: 3, textTransform: "uppercase", color: MUTED }}>
                {profile.headline}
              </div>
            )}
            <div style={{ fontFamily: "Newsreader", fontSize: name.length > 22 ? 72 : 96, lineHeight: 1 }}>{name}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/svg+xml;base64,${Buffer.from(logo).toString("base64")}`} alt="" height={44} width={170} />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Newsreader", data: newsreader, style: "normal", weight: 500 }],
    },
  );
}
