import { expect, test } from "@playwright/test";

/**
 * Critical-path smoke coverage for every anonymous-visitor-reachable page
 * under (landing-pages). Pairs with the manual pre-launch QA pass; a few
 * tests pin down regressions found during that pass (see comments).
 */

test.describe("Home", () => {
  test("loads with no console errors and core nav present", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /design systems/i }),
    ).toBeVisible();

    // Desktop shows a top nav; mobile swaps it for a bottom tab bar (no
    // "About" link there — it's the same header component, just hidden by
    // CSS at narrow widths), so only assert full nav on wide viewports.
    const viewport = page.viewportSize();
    if (viewport && viewport.width >= 768) {
      const nav = page.getByRole("navigation").first();
      await expect(nav.getByRole("link", { name: "About" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Our Work" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Services" })).toBeVisible();
      await expect(nav.getByRole("link", { name: "Contact" })).toBeVisible();
    } else {
      await expect(
        page.getByRole("navigation", { name: "Site navigation" }),
      ).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test("title tag does not duplicate the site name", async ({ page }) => {
    // Regression: root layout's "%s | Gateling Solutions" template plus a
    // metaTitle that already hardcoded the suffix produced a doubled title
    // on several pages (services, work, blog, contact, my-account, feedback).
    await page.goto("/");
    const title = await page.title();
    expect(title.match(/Gateling Solutions/g)?.length ?? 0).toBeLessThanOrEqual(1);
  });

  test("Arabic locale renders the correct brand name, not a mistranslation", async ({
    page,
  }) => {
    await page.goto("/");
    await page.context().addCookies([
      {
        name: "NEXT_LOCALE",
        value: "ar",
        domain: "localhost",
        path: "/",
      },
    ]);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByText("Gateling", { exact: false }).first()).toBeVisible();
  });

  test("WhatsApp float button links to wa.me with a real number", async ({
    page,
  }) => {
    await page.goto("/");
    const whatsapp = page.getByRole("link", { name: "WhatsApp Us" });
    await expect(whatsapp).toHaveAttribute("href", /wa\.me\/\d+/);
  });
});

for (const [path, titleSuffix] of [
  ["/services", "does not duplicate title"],
  ["/work", "does not duplicate title"],
  ["/blog", "does not duplicate title"],
  ["/contact", "does not duplicate title"],
] as const) {
  test(`${path} ${titleSuffix}`, async ({ page }) => {
    await page.goto(path);
    const title = await page.title();
    expect(title.match(/Gateling Solutions/g)?.length ?? 0).toBeLessThanOrEqual(1);
  });
}

test.describe("Services page", () => {
  test("hero heading and intro section heading are not duplicated text", async ({
    page,
  }) => {
    // Regression: page.tsx's hero heading and the section right below it
    // rendered the exact same string back to back.
    await page.goto("/services");
    const headings = await page.getByRole("heading").allTextContents();
    const nonEmpty = headings.filter(Boolean);
    const duplicates = nonEmpty.filter(
      (text, i) => nonEmpty.indexOf(text) !== i,
    );
    expect(duplicates).toEqual([]);
  });
});

test.describe("Contact page", () => {
  test("both tabs render their expected content", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("tab", { name: "Book a call" })).toBeVisible();
    await page.getByRole("tab", { name: "Send a message" }).click();
    await expect(page.getByLabel("Name *")).toBeVisible();
    await expect(page.getByLabel("Email *")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send Message" }),
    ).toBeVisible();
  });

  test("FAQ section renders answers without needing interaction", async ({
    page,
  }) => {
    await page.goto("/contact");
    await expect(
      page.getByText(/How soon will I hear back/i),
    ).toBeVisible();
  });
});

test.describe("Work", () => {
  test("listing shows case studies and links to detail pages", async ({
    page,
  }) => {
    await page.goto("/work");
    await expect(
      page.getByRole("heading", { name: "Atelier Alaa El-Kasry" }),
    ).toBeVisible();
    await page.getByRole("link", { name: /Read More/i }).first().click();
    await expect(page).toHaveURL(/\/work\/.+/);
  });

  test("ba2olak case study renders without leaking a TODO placeholder", async ({
    page,
  }) => {
    // Regression: this published case study displayed a literal
    // "TODO: replace with real launch metrics..." string in Results.
    await page.goto("/work/ba2olak");
    await expect(page.getByText(/^TODO/i)).toHaveCount(0);
  });
});

test.describe("Blog", () => {
  test("listing shows posts and links to detail pages", async ({ page }) => {
    await page.goto("/blog");
    const firstPost = page.getByRole("link", { name: /Read more/i }).first();
    await firstPost.click();
    await expect(page).toHaveURL(/\/blog\/.+/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test.describe("Solutions / delivery", () => {
  test("renders hero and links to the ba2olak case study", async ({
    page,
  }) => {
    await page.goto("/solutions/delivery");
    await expect(
      page.getByRole("link", { name: /ba2olak Case Study/i }),
    ).toHaveAttribute("href", "/work/ba2olak");
  });
});

// The standalone /tools/roi-calculator page was removed in SEO Phase 2 — it was
// ~60 words of prose wrapped around a widget, with nothing to rank for. The
// calculator itself survives as the `roi_embed` content block, and the retired
// URL now 308s to /services. Both are covered in `seo.spec.ts`.

test.describe("Static pages", () => {
  for (const path of ["/privacy", "/terms"]) {
    test(`${path} renders`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  }
});
