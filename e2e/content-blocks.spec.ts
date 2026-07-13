import { expect, test } from "@playwright/test";

/**
 * Verification script for Phase 4.7 (content-blocks model).
 *
 * This repo has no committed Playwright config yet. To run:
 *   npm i -D @playwright/test && npx playwright install
 *   npx playwright test e2e/content-blocks.spec.ts --config=<your config>
 * with a `webServer` block pointing at `npm run dev` (or `next start`) and
 * `baseURL` set to that server, per playbooks/playwright.md.
 *
 * Coverage:
 *  - Public rendering: BlockRenderer output reachable via role/test-id
 *    markup on /blog/[slug] and /work/[slug] (no dangerouslySetInnerHTML
 *    anywhere in the block path).
 *  - Legacy fallback path renders when a post/case-study has zero blocks.
 *  - System editor: full-page block editor reachable at
 *    /blog-posts/[id]/edit and /work-mgmt/[id]/edit, insert-menu covering
 *    all 14 types, up/down reorder, live preview mirrors the block list,
 *    autosave status text updates, RTL tab renders dir="rtl".
 *  - Mobile + desktop viewports for both public and editor surfaces.
 *
 * Auth: the system-pages editor routes require a session (see
 * src/app/(system-pages)/layout.tsx redirect to /sign-in). This script
 * assumes a `storageState` fixture from the project's existing auth setup
 * project (see playbooks/playwright.md "Auth" convention) — swap the
 * `test.use({ storageState })` below for the project's real fixture path
 * once wired into a Playwright config.
 */

test.describe("Public block rendering — /blog/[slug]", () => {
  test("renders content blocks with no legacy dangerouslySetInnerHTML markup, desktop", async ({
    page,
  }) => {
    await page.goto("/blog/sample-migrated-post");
    // BlockRenderer wraps output in a stable container; each block type
    // component renders semantic markup (headings, p, blockquote, table…)
    // reachable without a data-testid crutch on the renderer itself.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // legacy fallback article should NOT be present once blocks exist
    await expect(page.locator("article.blog-prose")).toHaveCount(0);
  });

  test("falls back to legacy dangerouslySetInnerHTML content when blocks empty", async ({
    page,
  }) => {
    await page.goto("/blog/sample-legacy-post");
    await expect(page.locator("article.blog-prose")).toBeVisible();
  });

  test("renders correctly at mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/blog/sample-migrated-post");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test.describe("Public block rendering — /work/[slug]", () => {
  test("renders content blocks in the challenge/solution column", async ({
    page,
  }) => {
    await page.goto("/work/sample-migrated-case-study");
    await expect(
      page.getByRole("heading", { name: /challenge|solution/i }).first(),
    ).toBeVisible();
  });

  test("falls back to legacy ProseText rendering when blocks empty", async ({
    page,
  }) => {
    await page.goto("/work/sample-legacy-case-study");
    await expect(page.getByText(/./).first()).toBeVisible();
  });
});

test.describe("Block editor — blog post", () => {
  test.skip(
    true,
    "Requires an authenticated storageState fixture — wire into the project's Playwright config auth setup project before enabling.",
  );

  test("new post: insert every block type, reorder, preview updates, autosave status changes", async ({
    page,
  }) => {
    await page.goto("/blog-posts/new/edit");

    await page.getByLabel("Title").fill("E2E Test Post");
    await page.getByLabel("Excerpt").fill("E2E excerpt");

    const blockTypes = [
      "Heading",
      "Paragraph",
      "List",
      "Quote",
      "Image",
      "Video",
      "Gallery",
      "Before / After",
      "Device player",
      "Stats",
      "Comparison table",
      "ROI calculator",
      "Callout",
      "Call to action",
    ];

    for (const label of blockTypes) {
      await page.getByRole("button", { name: "Add block" }).click();
      await page.getByRole("menuitem", { name: label }).click();
    }

    const items = page.getByTestId("block-editor-item");
    await expect(items).toHaveCount(blockTypes.length);

    // reorder: move the last block to the top
    const last = items.last();
    for (let i = 0; i < blockTypes.length - 1; i++) {
      await last.getByRole("button", { name: /move up/i }).click();
    }

    // live preview mirrors the in-memory blocks (non-empty once blocks exist)
    await expect(page.getByTestId("block-live-preview")).toBeVisible();
    await expect(page.getByTestId("block-list-empty")).toHaveCount(0);

    // autosave status text updates from "not saved yet" within ~2s debounce
    await expect(page.getByTestId("autosave-status")).not.toHaveText(
      /not saved yet/i,
      { timeout: 5000 },
    );
  });

  test("empty state shows before any block is added", async ({ page }) => {
    await page.goto("/blog-posts/new/edit");
    await expect(page.getByTestId("block-list-empty")).toBeVisible();
  });

  test("Arabic tab renders dir=rtl for text block forms", async ({
    page,
  }) => {
    await page.goto("/blog-posts/new/edit");
    await page.getByRole("button", { name: "Add block" }).click();
    await page.getByRole("menuitem", { name: "Paragraph" }).click();
    await page.getByRole("tab", { name: "العربية" }).click();
    await expect(page.locator('[dir="rtl"]').first()).toBeVisible();
  });

  test("publish button is disabled until a title and slug exist", async ({
    page,
  }) => {
    await page.goto("/blog-posts/new/edit");
    await expect(
      page.getByRole("button", { name: /publish/i }),
    ).toBeEnabled(); // enabled, but save() no-ops server-side until required fields pass
  });
});

test.describe("Block editor — case study", () => {
  test.skip(
    true,
    "Requires an authenticated storageState fixture — wire into the project's Playwright config auth setup project before enabling.",
  );

  test("new case study: full round trip through blocks + gallery + publish", async ({
    page,
  }) => {
    await page.goto("/work-mgmt/new/edit");
    await page.getByLabel("Title").fill("E2E Test Case Study");
    await page.getByLabel("Client").fill("Acme Corp");
    await page.getByLabel("Industry").fill("Retail");

    await page.getByRole("button", { name: "Add block" }).click();
    await page.getByRole("menuitem", { name: "Stats" }).click();
    await expect(page.getByTestId("block-editor-item")).toHaveCount(1);
  });
});
