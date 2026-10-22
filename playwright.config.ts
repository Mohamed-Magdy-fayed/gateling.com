import { defineConfig, devices } from "@playwright/test";

/**
 * E2E runs create real accounts. They once ran against the production DB
 * (`.env` points there) and left 42 `qa-e2e-…` users behind, so the test
 * server is given its own DATABASE_URL and refuses anything non-local.
 */
const e2eDatabaseUrl = process.env.E2E_DATABASE_URL;
const e2eDatabaseHost = (() => {
  try {
    return e2eDatabaseUrl ? new URL(e2eDatabaseUrl).hostname : "";
  } catch {
    return "";
  }
})();
if (!e2eDatabaseUrl || !["localhost", "127.0.0.1"].includes(e2eDatabaseHost)) {
  throw new Error(
    "Set E2E_DATABASE_URL to a local Postgres (e.g. the docker-compose db) — " +
      "e2e tests write users and must never touch production.",
  );
}

/** Cloudflare's published always-pass Turnstile test keys. */
const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";
const TURNSTILE_TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? "dot" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: "npm run preview",
    url: "http://localhost:3000",
    // A reused server keeps whatever DATABASE_URL it was started with —
    // usually production. Opt in explicitly when you know it is local.
    reuseExistingServer: process.env.E2E_REUSE_SERVER === "1",
    timeout: 180_000,
    env: {
      DATABASE_URL: e2eDatabaseUrl,
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: TURNSTILE_TEST_SITE_KEY,
      TURNSTILE_SECRET_KEY: TURNSTILE_TEST_SECRET_KEY,
    },
  },
});
