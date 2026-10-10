import path from "node:path";
import { defineConfig } from "vitest/config";

// Unit tests: pure logic, run in Node with Supabase mocked. End-to-end tests live in e2e/ (Playwright).
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
