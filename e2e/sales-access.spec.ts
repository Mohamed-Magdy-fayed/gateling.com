import { expect, test } from "@playwright/test";

/**
 * The sales pipeline is an internal, admin-only tool holding real prospect
 * phone numbers. These tests assert the routes are blocked *server-side* — not
 * merely hidden from navigation — and that nothing about them leaks publicly.
 *
 * The guard lives in `src/proxy.ts`, which only protects paths registered in
 * `SYSTEM_SCREEN_DEFINITIONS`. If that registry entry is ever removed these
 * tests fail, which is the point: an unregistered path falls through as public.
 */

const SALES_ROUTES = ["/sales/today", "/sales/leads"];

for (const route of SALES_ROUTES) {
  test(`signed out, ${route} redirects to /sign-in`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 10_000 });
  });
}

test("signed out, a sales lead detail URL redirects to /sign-in", async ({
  page,
}) => {
  await page.goto("/sales/leads/00000000-0000-0000-0000-000000000000");
  await expect(page).toHaveURL(/\/sign-in/, { timeout: 10_000 });
});

test("robots.txt disallows /sales", async ({ request }) => {
  const response = await request.get("/robots.txt");
  expect(response.ok()).toBe(true);
  expect(await response.text()).toContain("/sales");
});

test("sitemap.xml never lists a /sales URL", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.ok()).toBe(true);
  expect(await response.text()).not.toContain("/sales");
});

test("the public site does not link to the sales module", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('a[href^="/sales"]')).toHaveCount(0);
});
