import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";

// Same settings as the app: .env.local locally, GitHub secrets in CI.
loadEnvConfig(process.cwd());

const isCI = !!process.env.CI;
const baseURL = "http://localhost:3000";

// End-to-end tests run against the online Supabase project (there is no local database).
// Test accounts use a recognizable address and are deleted after each run (see e2e/global-teardown.ts).
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // Each test signs in against the online Supabase project: a few at a time is enough,
  // and leaves room for the dev server, which compiles pages on first visit.
  workers: isCI ? 2 : 4,
  expect: { timeout: 15_000 },
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : "list",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL,
    locale: "fr-FR",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // CI tests the production build; locally, an already running `npm run dev` is reused.
    command: isCI ? "npm run build && npm run start" : "npm run dev",
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
});
