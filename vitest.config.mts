import { defineConfig } from "vitest/config";

/**
 * Unit tests only. Playwright still owns `npm test` and everything in `e2e/`;
 * this runner exists for pure logic modules that must not need a browser or a
 * database — most importantly `today-rules.ts`, whose thresholds get tuned.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
      "server-only": new URL("./src/test/server-only-stub.ts", import.meta.url)
        .pathname,
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
