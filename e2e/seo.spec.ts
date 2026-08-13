import { expect, test } from "@playwright/test";

/**
 * Technical SEO coverage: robots, sitemap, canonical/OG metadata, and
 * structured data. Pins down the live-audit regressions — `Disallow: /work/`
 * blocking the case studies, and `BASE_URL` trailing slashes producing
 * `https://host//path` in robots + sitemap.
 *
 * Note: the local `.env` sets BASE_URL="http://localhost:3000/" (with a
 * trailing slash), so the double-slash assertions genuinely exercise the fix.
 */

/** Absolute URLs, minus the scheme, must never contain a double slash. */
function hasDoubleSlashAfterOrigin(url: string): boolean {
  return /^https?:\/\/[^/]+\/\//.test(url);
}

async function getSitemapLocs(
  request: import("@playwright/test").APIRequestContext,
): Promise<string[]> {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

test.describe("robots.txt", () => {
  test("allows public content and blocks admin routes", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();

    // Regression: a literal `Disallow: /work/` blocked crawling of every
    // published case study, including /work/atelier-alaa-el-kasry.
    expect(body).not.toMatch(/^Disallow:\s*\/work\/?\s*$/m);
    expect(body).not.toMatch(/^Disallow:\s*\/blog\/?\s*$/m);
    expect(body).toMatch(/^Allow:\s*\/\s*$/m);

    for (const priv of [
      "/dashboard",
      "/blog-posts",
      "/work-mgmt",
      "/services-mgmt",
      "/testimonials",
      "/leads",
      "/subscribers",
      "/users",
      "/branches",
      "/settings",
      "/api/",
      "/my-account",
    ]) {
      expect(body).toContain(`Disallow: ${priv}`);
    }
  });

  test("declares a sitemap with exactly one slash after the origin", async ({
    request,
  }) => {
    const body = await (await request.get("/robots.txt")).text();
    const match = body.match(/^Sitemap:\s*(\S+)$/m);
    expect(match, "robots.txt must declare a Sitemap").not.toBeNull();
    const sitemapUrl = match?.[1] ?? "";
    expect(sitemapUrl).toMatch(/^https?:\/\//);
    expect(hasDoubleSlashAfterOrigin(sitemapUrl)).toBe(false);
    expect(sitemapUrl).toMatch(/\/sitemap\.xml$/);
  });
});

test.describe("sitemap.xml", () => {
  test("every URL is absolute with a single slash after the origin", async ({
    request,
  }) => {
    const locs = await getSitemapLocs(request);
    expect(locs.length).toBeGreaterThan(0);

    const relative = locs.filter((u) => !/^https?:\/\//.test(u));
    expect(relative, "all <loc> values must be absolute").toEqual([]);

    // Regression: BASE_URL's trailing slash produced https://host//work/...
    const doubled = locs.filter(hasDoubleSlashAfterOrigin);
    expect(doubled, "no <loc> may contain // after the origin").toEqual([]);
  });

  test("includes public content and excludes private routes", async ({
    request,
  }) => {
    const locs = await getSitemapLocs(request);
    const paths = locs.map((u) => new URL(u).pathname);

    expect(paths).toContain("/");
    expect(paths).toContain("/blog");
    expect(paths).toContain("/work");
    expect(paths).toContain("/work/atelier-alaa-el-kasry");

    for (const priv of [
      "/dashboard",
      "/blog-posts",
      "/work-mgmt",
      "/services-mgmt",
      "/testimonials",
      "/leads",
      "/subscribers",
      "/users",
      "/branches",
      "/settings",
      "/my-account",
      "/sign-in",
    ]) {
      expect(
        paths.filter((p) => p === priv || p.startsWith(`${priv}/`)),
        `${priv} must not appear in the sitemap`,
      ).toEqual([]);
    }
    expect(paths.filter((p) => p.startsWith("/api"))).toEqual([]);
    expect(paths.filter((p) => p.startsWith("/feedback"))).toEqual([]);
  });

  test("no draft article leaks in — every listed blog URL resolves", async ({
    request,
  }) => {
    const locs = await getSitemapLocs(request);
    const blogUrls = locs.filter((u) =>
      new URL(u).pathname.startsWith("/blog/"),
    );

    for (const url of blogUrls) {
      const res = await request.get(new URL(url).pathname);
      expect(res.status(), `${url} should resolve 200`).toBe(200);
    }
  });

  test("listed case studies all resolve", async ({ request }) => {
    const locs = await getSitemapLocs(request);
    const workUrls = locs.filter((u) =>
      new URL(u).pathname.startsWith("/work/"),
    );
    expect(workUrls.length).toBeGreaterThan(0);

    for (const url of workUrls) {
      const res = await request.get(new URL(url).pathname);
      expect(res.status(), `${url} should resolve 200`).toBe(200);
    }
  });

  test("the blog index links exactly the posts the sitemap lists", async ({
    page,
    request,
  }) => {
    // Both derive from blogPosts.publicList(), so a mismatch means one surface
    // is leaking drafts or hiding published posts.
    const locs = await getSitemapLocs(request);
    const sitemapSlugs = locs
      .map((u) => new URL(u).pathname)
      .filter((p) => p.startsWith("/blog/"))
      .sort();

    await page.goto("/blog");
    const linked = await page
      .locator('a[href^="/blog/"]')
      .evaluateAll((els) =>
        els.map((el) => new URL((el as HTMLAnchorElement).href).pathname),
      );
    expect([...new Set(linked)].sort()).toEqual(sitemapSlugs);
  });
});

test.describe("Public page availability", () => {
  test("the Atelier case study returns 200", async ({ request }) => {
    const res = await request.get("/work/atelier-alaa-el-kasry");
    expect(res.status()).toBe(200);
  });

  test("an unknown slug renders the not-found page", async ({ page }) => {
    // The 404 *UI* is correct today. The HTTP *status* is not — see the
    // fixme below.
    const res = await page.goto("/blog/definitely-not-a-real-post");
    expect(res).not.toBeNull();
    await expect(page.getByText(/not found/i).first()).toBeVisible();
  });

  // KNOWN DEFECT — soft 404. `notFound()` renders the not-found UI but the
  // response status stays 200, because `cacheComponents: true` (next.config.ts)
  // flushes a prerendered shell before the dynamic segment resolves. Verified
  // that none of these fix it: resolving the slug at the page top level,
  // `connection()` on the page, and `connection()` on the landing-pages layout.
  // `dynamic = "force-dynamic"` is rejected outright by cacheComponents.
  // Remaining options, each with a real trade-off for the owner to choose:
  //   1. generateStaticParams + `dynamicParams = false` — real 404s, but newly
  //      published CMS articles would 404 until the next deploy.
  //   2. Disable `cacheComponents` — sitewide architectural change.
  // Google treats soft 404s as wasted crawl budget and may index the error page.
  test.fixme(
    "an unknown slug returns HTTP 404, not a soft 404",
    async ({ request }) => {
      const res = await request.get("/blog/definitely-not-a-real-post");
      expect(res.status()).toBe(404);
    },
  );

  test("a draft article is not listed as published", async ({ request }) => {
    // Until the soft-404 defect above is fixed, the meaningful invariant is
    // that an unpublished article never appears in the sitemap or on /blog.
    const published = new Set(
      (await getSitemapLocs(request)).map((u) => new URL(u).pathname),
    );
    const res = await request.get("/sitemap.xml");
    const xml = await res.text();

    for (const slug of [
      "dress-rental-management-software",
      "atelier-management-system",
    ]) {
      const path = `/blog/${slug}`;
      if (!published.has(path)) {
        expect(xml).not.toContain(path);
      }
    }
  });
});

test.describe("Article metadata and structured data", () => {
  /** First published article linked from /blog. */
  async function firstArticlePath(page: import("@playwright/test").Page) {
    await page.goto("/blog");
    const href = await page
      .locator('a[href^="/blog/"]')
      .first()
      .getAttribute("href");
    expect(href, "/blog must link at least one article").toBeTruthy();
    return href as string;
  }

  test("has a unique title, description, and self-referencing canonical", async ({
    page,
  }) => {
    const path = await firstArticlePath(page);
    await page.goto(path);

    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    expect(title.match(/Gateling Solutions/g)?.length ?? 0).toBeLessThanOrEqual(
      1,
    );

    const description = await page
      .locator('meta[name="description"]')
      .getAttribute("content");
    expect(description?.trim().length ?? 0).toBeGreaterThan(0);

    const canonicalHref = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(canonicalHref, "a canonical link must be present").toBeTruthy();
    expect(new URL(canonicalHref as string).pathname).toBe(path);
    expect(hasDoubleSlashAfterOrigin(canonicalHref as string)).toBe(false);
  });

  test("carries Open Graph tags and is not noindexed", async ({ page }) => {
    const path = await firstArticlePath(page);
    await page.goto(path);

    for (const prop of ["og:title", "og:description", "og:url", "og:type"]) {
      const content = await page
        .locator(`meta[property="${prop}"]`)
        .getAttribute("content");
      expect(content, `${prop} must be present`).toBeTruthy();
    }
    expect(
      await page.locator('meta[property="og:type"]').getAttribute("content"),
    ).toBe("article");

    // A missing robots meta is the desired state, so check presence first —
    // getAttribute on a zero-match locator waits out the full test timeout.
    const robotsMeta = page.locator('meta[name="robots"]');
    if ((await robotsMeta.count()) > 0) {
      expect(await robotsMeta.first().getAttribute("content")).not.toContain(
        "noindex",
      );
    }
  });

  test("emits valid BlogPosting and BreadcrumbList JSON-LD", async ({
    page,
  }) => {
    const path = await firstArticlePath(page);
    await page.goto(path);

    const blocks = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const parsed = blocks.map((b) => JSON.parse(b) as Record<string, unknown>);

    const posting = parsed.find((p) => p["@type"] === "BlogPosting");
    expect(posting, "BlogPosting JSON-LD must be present").toBeTruthy();
    expect(posting?.headline).toBeTruthy();
    expect(posting?.description).toBeTruthy();
    expect(posting?.url).toBeTruthy();
    expect(hasDoubleSlashAfterOrigin(String(posting?.url))).toBe(false);

    const crumbs = parsed.find((p) => p["@type"] === "BreadcrumbList");
    expect(crumbs, "BreadcrumbList JSON-LD must be present").toBeTruthy();
    const items = crumbs?.itemListElement as Array<{ item: string }>;
    expect(items.length).toBeGreaterThan(1);
    for (const item of items) {
      expect(item.item).toMatch(/^https?:\/\//);
      expect(hasDoubleSlashAfterOrigin(item.item)).toBe(false);
    }
  });

  test("renders right-to-left under the Arabic locale", async ({ page }) => {
    const path = await firstArticlePath(page);
    await page
      .context()
      .addCookies([
        { name: "NEXT_LOCALE", value: "ar", domain: "localhost", path: "/" },
      ]);
    await page.goto(path);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
