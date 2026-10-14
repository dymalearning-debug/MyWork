import "server-only";

import { chromium, type Browser } from "playwright-core";

import { publicProfilePath } from "@/lib/public-profile/handle";

// Export of the CV (docs/profile.md, "Export du CV"): a headless browser (Chromium) opens the A4
// page of the CV (/<handle>/cv), exactly as the preview shows it, and turns it into a PDF or a PNG.
// It opens the page with the visitor's own cookies: the owner of an offline profile gets their
// preview, anybody else the same page as in their browser.

export type CvFormat = "pdf" | "png";

// On Vercel, the Chromium built for serverless functions; locally and in the tests, the one that
// Playwright installed (npx playwright install chromium).
async function launchBrowser(): Promise<Browser> {
  if (process.env.VERCEL) {
    const serverless = (await import("@sparticuz/chromium")).default;
    return chromium.launch({ executablePath: await serverless.executablePath(), args: serverless.args, headless: true });
  }
  return chromium.launch({ headless: true });
}

// The site the browser opens: the one the visitor is on, when it is one of this deployment's own
// addresses; otherwise the production one. Never an address taken blindly from the request, which
// would let anyone make the server open any site.
export function exportOrigin(requestUrl: URL) {
  const host = requestUrl.host;
  if (!process.env.VERCEL) {
    return /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host) ? requestUrl.origin : "http://localhost:3000";
  }
  const own = [
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ].filter(Boolean);
  if (own.includes(host)) return `https://${host}`;
  return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL}`;
}

// "a=1; b=2" as cookies of the site the browser opens: they are sent to it only.
function cookiesFor(origin: string, header: string | null) {
  if (!header) return [];
  return header
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const index = part.indexOf("=");
      return { name: part.slice(0, index), value: part.slice(index + 1), url: origin };
    })
    .filter((cookie) => cookie.name);
}

export async function exportCv({
  handle,
  format,
  origin,
  cookieHeader,
}: {
  handle: string;
  format: CvFormat;
  origin: string;
  cookieHeader: string | null;
}): Promise<Buffer> {
  const browser = await launchBrowser();
  try {
    const context = await browser.newContext({
      // An A4 sheet at 96 dpi; the PNG at twice that, to stay sharp.
      viewport: { width: 900, height: 1200 },
      deviceScaleFactor: format === "png" ? 2 : 1,
      colorScheme: "light",
      locale: "fr-FR",
      // The CV is plain HTML and CSS: without scripts, nothing can change the page while it prints
      // (not even the reloads of the development server), and it opens faster.
      javaScriptEnabled: false,
    });
    const cookies = cookiesFor(origin, cookieHeader);
    if (cookies.length > 0) await context.addCookies(cookies);

    const page = await context.newPage();
    const response = await page.goto(`${origin}${publicProfilePath(handle)}/cv`, { waitUntil: "load", timeout: 60_000 });
    if (!response?.ok()) throw new Error(`CV page answered ${response?.status() ?? "nothing"}`);
    const sheet = page.locator("[data-cv-sheet]");
    await sheet.waitFor();
    await page.evaluate(() => document.fonts.ready);

    if (format === "pdf") {
      await page.emulateMedia({ media: "print" });
      return await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "14mm", bottom: "14mm", left: "16mm", right: "16mm" },
      });
    }
    return await sheet.screenshot({ type: "png" });
  } finally {
    await browser.close();
  }
}
