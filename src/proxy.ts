import { NextResponse, type NextRequest } from "next/server";

import { HOME_PATH, isPrivatePath, isSignedOutOnlyPath, LOGIN_PATH } from "@/lib/auth/paths";
import { updateSession } from "@/lib/supabase/proxy";

// Runs before every page: refreshes the Supabase session and applies the access rules.
// This is a first gate only: pages and Server Actions check the user again (src/lib/auth/user.ts).
export async function proxy(request: NextRequest) {
  const { response, isSignedIn } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  // Public profile handles are lowercase: /Ines-Robert leads to /ines-robert.
  // Escaped characters (%C3%A8) are left out of the check, so that their case never loops.
  const firstSegment = pathname.split("/")[1] ?? "";
  if (/[A-Z]/.test(firstSegment.replace(/%[0-9A-F]{2}/gi, ""))) {
    const lowercased = `/${firstSegment.toLowerCase()}${pathname.slice(firstSegment.length + 1)}`;
    return redirectKeepingCookies(request, response, lowercased, {}, search);
  }

  if (!isSignedIn && isPrivatePath(pathname)) {
    return redirectKeepingCookies(request, response, LOGIN_PATH, {
      next: `${pathname}${search}`,
    });
  }

  if (isSignedIn && isSignedOutOnlyPath(pathname)) {
    return redirectKeepingCookies(request, response, HOME_PATH);
  }

  return response;
}

// A redirect must carry the cookies refreshed by updateSession, or the session would be lost.
function redirectKeepingCookies(
  request: NextRequest,
  sessionResponse: NextResponse,
  pathname: string,
  params: Record<string, string | null> = {},
  search = "",
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = search;
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }
  const redirect = NextResponse.redirect(url);
  for (const cookie of sessionResponse.cookies.getAll()) redirect.cookies.set(cookie);
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = sessionResponse.headers.get(header);
    if (value) redirect.headers.set(header, value);
  }
  return redirect;
}

export const config = {
  matcher: [
    // Every page except Next.js internals and static files (images, icons, brand assets).
    "/((?!_next/static|_next/image|brand/|favicon.ico|icon.svg|apple-icon.png|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
