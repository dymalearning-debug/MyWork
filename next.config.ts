import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Files read at run time, that the build does not find on its own: Chromium for the export of
  // the CV (docs/profile.md, "Export du CV") and the whole of playwright-core, which reads some of its
  // own files at start-up (browsers.json); the font and the logo of the share preview.
  outputFileTracingIncludes: {
    "/**/cv/pdf": ["./node_modules/@sparticuz/chromium/bin/**", "./node_modules/playwright-core/**"],
    "/app/profile/cv/png": ["./node_modules/@sparticuz/chromium/bin/**", "./node_modules/playwright-core/**"],
    "/**/opengraph-image*": [
      "./node_modules/@fontsource/newsreader/files/newsreader-latin-500-normal.woff",
      "./public/brand/mywork-logo-white.svg",
    ],
    "/**/opengraph-image*/**": [
      "./node_modules/@fontsource/newsreader/files/newsreader-latin-500-normal.woff",
      "./public/brand/mywork-logo-white.svg",
    ],
  },
  async redirects() {
    return [
      // Former address of the private profile page, before the private space moved under /app.
      { source: "/profile", destination: "/app/profile", permanent: true },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
