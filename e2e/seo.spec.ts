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
    const res = await page.goto("/blog/definitely-not-a-real-post");
    expect(res).not.toBeNull();
    expect(res?.status()).toBe(404);
    await expect(page.getByText(/not found/i).first()).toBeVisible();

    // Next marks a streamed not-found response `noindex`. The proxy rewrite
    // must preserve that, not replace the page with a bare error body.
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
  });

  // Soft 404 — fixed in Phase 1.5 by `src/proxy.ts`. `notFound()` alone cannot
  // set the status: the page awaits its slug lookup inside a Suspense boundary
  // (unavoidable under `cacheComponents: true`), so the body has already begun
  // streaming and, per Next's docs, "the status code of the response cannot be
  // updated". The proxy resolves the slug *before* rendering starts and rewrites
  // to the not-found route with an explicit 404.
  for (const [kind, path] of [
    ["blog post", "/blog/definitely-not-a-real-post"],
    ["case study", "/work/definitely-not-a-real-case-study"],
    ["service", "/services/definitely-not-a-real-service"],
  ] as const) {
    test(`an unknown ${kind} slug returns HTTP 404`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(404);
    });
  }

  // The guard that matters most. `src/lib/published-slug.ts` re-implements each
  // route's publication filter in raw SQL; if it ever drifts from the tRPC
  // procedure it mirrors, the proxy starts 404ing live pages. Every URL the
  // sitemap advertises must still resolve.
  test("every sitemap content URL still returns 200", async ({ request }) => {
    const paths = (await getSitemapLocs(request))
      .map((u) => new URL(u).pathname)
      .filter((p) => /^\/(blog|work|services)\/[^/]+$/.test(p));

    // Guards the guard: an empty list would make this test vacuously pass.
    expect(paths.length).toBeGreaterThan(0);

    const failures: string[] = [];
    for (const path of paths) {
      const res = await request.get(path);
      if (res.status() !== 200) failures.push(`${path} → ${res.status()}`);
    }
    expect(failures).toEqual([]);
  });

  test("a draft article is not listed as published", async ({ request }) => {
    // An unpublished article must never appear in the sitemap or on /blog.
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

test.describe("Service detail pages", () => {
  /** Service paths the sitemap advertises. */
  async function sitemapServicePaths(
    request: import("@playwright/test").APIRequestContext,
  ): Promise<string[]> {
    const locs = await getSitemapLocs(request);
    return locs
      .map((u) => new URL(u).pathname)
      .filter((p) => p.startsWith("/services/"))
      .sort();
  }

  test("the sitemap lists service detail pages and each resolves", async ({
    request,
  }) => {
    const paths = await sitemapServicePaths(request);
    expect(paths.length, "the sitemap must list service pages").toBeGreaterThan(
      0,
    );

    for (const path of paths) {
      const res = await request.get(path);
      expect(res.status(), `${path} should resolve 200`).toBe(200);
    }
  });

  test("/services links exactly the services the sitemap lists", async ({
    page,
    request,
  }) => {
    // Both derive from servicesMgmt.publicList(). Before Phase 1 the cards on
    // /services linked nowhere at all, so this asserts the hub actually passes
    // link equity to every detail page.
    const sitemapPaths = await sitemapServicePaths(request);

    await page.goto("/services");
    const linked = await page
      .locator('a[href^="/services/"]')
      .evaluateAll((els) =>
        els.map((el) => new URL((el as HTMLAnchorElement).href).pathname),
      );
    expect([...new Set(linked)].sort()).toEqual(sitemapPaths);
  });

  test("has a self-referencing canonical and Open Graph tags", async ({
    page,
    request,
  }) => {
    const [path] = await sitemapServicePaths(request);
    expect(path, "at least one service page must exist").toBeTruthy();
    await page.goto(path);

    const canonicalHref = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href");
    expect(canonicalHref, "a canonical link must be present").toBeTruthy();
    expect(new URL(canonicalHref as string).pathname).toBe(path);
    expect(hasDoubleSlashAfterOrigin(canonicalHref as string)).toBe(false);

    for (const prop of ["og:title", "og:description", "og:url"]) {
      const content = await page
        .locator(`meta[property="${prop}"]`)
        .getAttribute("content");
      expect(content, `${prop} must be present`).toBeTruthy();
    }
  });

  test("emits valid Service and BreadcrumbList JSON-LD", async ({
    page,
    request,
  }) => {
    const [path] = await sitemapServicePaths(request);
    await page.goto(path);

    const blocks = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const parsed = blocks.map((b) => JSON.parse(b) as Record<string, unknown>);

    const service = parsed.find((p) => p["@type"] === "Service");
    expect(service, "Service JSON-LD must be present").toBeTruthy();
    expect(service?.name).toBeTruthy();
    expect(service?.description).toBeTruthy();
    expect(String(service?.url)).toBe(
      new URL(path, "http://localhost:3000").toString(),
    );
    expect(hasDoubleSlashAfterOrigin(String(service?.url))).toBe(false);

    const crumbs = parsed.find((p) => p["@type"] === "BreadcrumbList");
    expect(crumbs, "BreadcrumbList JSON-LD must be present").toBeTruthy();
    const items = crumbs?.itemListElement as Array<{ item: string }>;
    expect(items.length).toBeGreaterThan(1);
    for (const item of items) {
      expect(hasDoubleSlashAfterOrigin(item.item)).toBe(false);
    }
  });

  test("renders long-form body copy, not just the short description", async ({
    page,
    request,
  }) => {
    // A service whose fullDescription is still NULL falls back to the short
    // description, which is far too thin to rank. Guard against shipping that.
    const [path] = await sitemapServicePaths(request);
    await page.goto(path);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const main = (await page.locator("body").innerText()).length;
    expect(main, "the page must carry substantive body copy").toBeGreaterThan(
      1500,
    );
  });

  test("links out to related content and sibling services", async ({
    page,
    request,
  }) => {
    // The whole point of Phase 1: every service page must feed the internal
    // link graph rather than being another leaf node.
    const [path] = await sitemapServicePaths(request);
    await page.goto(path);

    const siblings = await page.locator('a[href^="/services/"]').count();
    expect(siblings, "must link sibling services").toBeGreaterThan(0);

    const outbound = await page
      .locator('a[href^="/work/"], a[href^="/blog/"]')
      .count();
    expect(
      outbound,
      "must link related case studies or articles",
    ).toBeGreaterThan(0);
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

/* ------------------------------------------------------------------------- *
 * Phase 2 — entity graph, metadata completeness, and the removed ROI page.
 * ------------------------------------------------------------------------- */

type JsonLdNode = Record<string, unknown>;

/**
 * Every JSON-LD node on a page, with `@graph` containers flattened.
 *
 * The root layout ships a `@graph`, so a top-level `p["@type"]` lookup would
 * never see the Organization. Page-level scripts stay flat.
 */
async function jsonLdNodes(
  request: import("@playwright/test").APIRequestContext,
  path: string,
): Promise<JsonLdNode[]> {
  const res = await request.get(path);
  expect(res.status(), `${path} should resolve 200`).toBe(200);
  const html = await res.text();

  const nodes: JsonLdNode[] = [];
  const blocks = html.matchAll(
    /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
  );
  for (const block of blocks) {
    const parsed = JSON.parse(block[1]) as JsonLdNode;
    const graph = parsed["@graph"];
    if (Array.isArray(graph)) nodes.push(...(graph as JsonLdNode[]));
    else nodes.push(parsed);
  }
  return nodes;
}

function findNode(nodes: JsonLdNode[], type: string): JsonLdNode | undefined {
  return nodes.find((node) => node["@type"] === type);
}

test.describe("Organization entity graph", () => {
  test("the logo is an absolute raster URL that resolves", async ({
    request,
  }) => {
    // Regression: `logo: "favicon.ico"` was a *relative* URL. Structured-data
    // consumers resolve it against the current page, so on /blog/<slug> it
    // asked for /blog/favicon.ico and 404'd. Google also wants a raster logo.
    const org = findNode(await jsonLdNodes(request, "/"), "Organization");
    expect(org, "Organization JSON-LD must be present").toBeTruthy();

    const logo = String(org?.logo);
    expect(logo).toMatch(/^https?:\/\//);
    expect(logo).not.toMatch(/\.ico$/);
    expect(hasDoubleSlashAfterOrigin(logo)).toBe(false);

    const res = await request.get(new URL(logo).pathname);
    expect(res.status(), `${logo} must resolve`).toBe(200);
  });

  test("carries address, areaServed, contactPoint, founder and sameAs", async ({
    request,
  }) => {
    const org = findNode(await jsonLdNodes(request, "/"), "Organization");

    expect(org?.address).toMatchObject({
      "@type": "PostalAddress",
      addressLocality: "Cairo",
      addressCountry: "EG",
    });
    expect(Array.isArray(org?.areaServed)).toBe(true);
    expect(org?.contactPoint).toMatchObject({ "@type": "ContactPoint" });
    expect(org?.founder).toBeTruthy();

    const sameAs = org?.sameAs as string[];
    expect(sameAs.length).toBeGreaterThan(0);
    for (const url of sameAs) expect(url).toMatch(/^https:\/\//);
  });

  test("page-level nodes reference the same Organization @id", async ({
    request,
  }) => {
    // The guard for the hardcoded-literal trap. `"https://gateling.com/#org"`
    // used to be typed out in the layout and six page files; the ids are now
    // derived from BASE_URL. If any literal survives, it will not match the
    // layout's id under the local BASE_URL — which is exactly where this runs,
    // so the graph would break silently in production too.
    const locs = await getSitemapLocs(request);
    const siteOrigin = new URL(locs[0]).origin;

    const homeNodes = await jsonLdNodes(request, "/");
    const orgId = findNode(homeNodes, "Organization")?.["@id"];
    expect(orgId).toBeTruthy();

    // A surviving `https://gateling.com/#org` literal shows up here as an
    // origin that disagrees with the one the sitemap and canonicals use.
    expect(new URL(String(orgId)).origin).toBe(siteOrigin);

    const website = findNode(homeNodes, "WebSite");
    expect(website?.publisher).toEqual({ "@id": orgId });

    const [servicePath] = locs
      .map((u) => new URL(u).pathname)
      .filter((p) => /^\/services\/[^/]+$/.test(p));
    const service = findNode(await jsonLdNodes(request, servicePath), "Service");
    expect(service?.provider).toEqual({ "@id": orgId });
  });

  test("the homepage no longer self-declares aggregateRating", async ({
    request,
  }) => {
    // Self-serving review markup about your own Organization is against
    // Google's review-snippet policy, and it left the entity defined twice.
    const nodes = await jsonLdNodes(request, "/");
    const orgs = nodes.filter((n) => n["@type"] === "Organization");
    expect(orgs.length, "Organization must be declared exactly once").toBe(1);
    expect(orgs[0].aggregateRating).toBeUndefined();
    expect(orgs[0].review).toBeUndefined();
  });
});

test.describe("Person schema on /about", () => {
  test("emits a Person linked to the Organization", async ({ request }) => {
    const person = findNode(await jsonLdNodes(request, "/about"), "Person");
    expect(person, "Person JSON-LD must be present on /about").toBeTruthy();
    expect(person?.name).toBeTruthy();
    expect(person?.jobTitle).toBeTruthy();
    expect(person?.description).toBeTruthy();

    const orgId = findNode(await jsonLdNodes(request, "/"), "Organization")?.[
      "@id"
    ];
    expect(person?.worksFor).toEqual({ "@id": orgId });

    // The Organization's `founder` must point at this exact node.
    const founder = findNode(await jsonLdNodes(request, "/"), "Organization")
      ?.founder as { "@id": string };
    expect(founder["@id"]).toBe(person?.["@id"]);
  });
});

test.describe("Case study structured data", () => {
  test("is an Article, not a CreativeWork", async ({ request }) => {
    const [path] = (await getSitemapLocs(request))
      .map((u) => new URL(u).pathname)
      .filter((p) => /^\/work\/[^/]+$/.test(p));
    expect(path, "at least one case study must exist").toBeTruthy();

    const nodes = await jsonLdNodes(request, path);
    expect(findNode(nodes, "CreativeWork")).toBeUndefined();

    const article = findNode(nodes, "Article");
    expect(article, "Article JSON-LD must be present").toBeTruthy();
    expect(article?.headline).toBeTruthy();
    expect(String(article?.headline).length).toBeLessThanOrEqual(111);
    expect(article?.publisher).toBeTruthy();
    expect(article?.author).toBeTruthy();
    expect(article?.mainEntityOfPage).toBeTruthy();

    // Reviews of Gateling do not belong on an article about a project.
    expect(article?.review).toBeUndefined();

    expect(findNode(nodes, "BreadcrumbList")).toBeTruthy();
  });
});

test.describe("Metadata completeness", () => {
  /** Meta tag content by property/name, read from the raw response body. */
  function metaContent(html: string, selector: string): string | null {
    const pattern = new RegExp(
      `<meta[^>]+(?:property|name)="${selector}"[^>]+content="([^"]*)"`,
    );
    return html.match(pattern)?.[1] ?? null;
  }

  test("every sitemap URL carries canonical, Open Graph and Twitter tags", async ({
    request,
  }) => {
    // The assertion that proves the `buildMetadata()` migration is complete.
    // Before Phase 2, 13 of 16 public pages shipped no og: or twitter: tags at
    // all, so every share preview fell back to the site-wide defaults.
    const paths = (await getSitemapLocs(request)).map(
      (u) => new URL(u).pathname,
    );
    expect(paths.length).toBeGreaterThan(0);

    const failures: string[] = [];
    for (const path of paths) {
      const res = await request.get(path);
      const html = await res.text();

      const missing = [
        !/<link[^>]+rel="canonical"/.test(html) && "canonical",
        !metaContent(html, "og:title") && "og:title",
        !metaContent(html, "og:description") && "og:description",
        !metaContent(html, "og:url") && "og:url",
        !metaContent(html, "twitter:card") && "twitter:card",
        !metaContent(html, "twitter:title") && "twitter:title",
      ].filter(Boolean);

      if (missing.length > 0) failures.push(`${path} → missing ${missing}`);
    }
    expect(failures).toEqual([]);
  });

  test("og:url agrees with the canonical on a case study", async ({
    request,
  }) => {
    // /work/[slug] set a canonical but no og:url before Phase 2.
    const [path] = (await getSitemapLocs(request))
      .map((u) => new URL(u).pathname)
      .filter((p) => /^\/work\/[^/]+$/.test(p));

    const html = await (await request.get(path)).text();
    const canonical = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]*)"/)?.[1];
    expect(canonical).toBeTruthy();
    expect(metaContent(html, "og:url")).toBe(canonical);
    expect(new URL(canonical as string).pathname).toBe(path);
  });
});

test.describe("Removed ROI calculator", () => {
  test("redirects permanently and is absent from the sitemap", async ({
    request,
  }) => {
    // The URL was advertised in the sitemap and crawled. Deleting it outright
    // would add to the "Not found (404)" count instead of passing its signals.
    const res = await request.get("/tools/roi-calculator", {
      maxRedirects: 0,
    });
    expect([301, 308]).toContain(res.status());
    expect(res.headers()["location"]).toContain("/services");

    const paths = (await getSitemapLocs(request)).map(
      (u) => new URL(u).pathname,
    );
    expect(paths.filter((p) => p.startsWith("/tools"))).toEqual([]);
  });
});
