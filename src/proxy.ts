import { type NextRequest, NextResponse } from "next/server";
import {
  getUserSession,
  hasPermission,
  updateUserSessionExpiration,
} from "@/features/core/auth/core";
import { PUBLIC_SITE_PATHS } from "@/features/public-catalog/lib/public-tabs";
import { getProtectedScreenDefinitionByPathname } from "@/features/system/registry";
import { isPublishedSlug, type SlugKind } from "@/lib/published-slug";

const authRoutes = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
];

const publicRoutes = [
  "/verify-email",
  "/oauth/",
  "/collection",
  "/view-dress",
  "/work/",
  "/blog/",
  "/feedback",
  "/robots.txt",
  "/sitemap.xml",
];

/** Public content detail routes whose slug is resolved against the database. */
const CONTENT_ROUTE_KINDS: Record<string, SlugKind> = {
  blog: "blog",
  work: "work",
  services: "services",
};

/** `/blog/my-post` → `{ kind: "blog", slug: "my-post" }`; anything else → null. */
function contentSlug(pathname: string): { kind: SlugKind; slug: string } | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 2) return null;

  const kind = CONTENT_ROUTE_KINDS[segments[0]];
  if (!kind) return null;

  try {
    return { kind, slug: decodeURIComponent(segments[1]) };
  } catch {
    // Malformed percent-encoding can never match a stored slug, but it is the
    // page's job to reject it — not this check's.
    return null;
  }
}

/** True when the auth stage decided to let the request through untouched. */
function isPassThrough(response: NextResponse): boolean {
  return (
    response.status < 300 &&
    !response.headers.has("x-middleware-rewrite") &&
    !response.headers.has("location")
  );
}

export async function proxy(request: NextRequest) {
  let response = (await middlewareAuth(request)) ?? NextResponse.next();

  // Soft-404 fix. `/blog/[slug]`, `/work/[slug]` and `/services/[slug]` call
  // `notFound()` after awaiting a database lookup, which under
  // `cacheComponents: true` sits inside a Suspense boundary — so the body has
  // already begun streaming and, per Next's docs, "the status code of the
  // response cannot be updated". Resolving the slug here, before rendering
  // starts, is Next's documented answer. Rewriting (rather than returning a
  // bare response) keeps the URL and the styled not-found page, including its
  // automatic `<meta name="robots" content="noindex">`.
  //
  // Only ever applied to a pass-through: an auth redirect or an /unauthorized
  // rewrite must win over a 404.
  const content = contentSlug(request.nextUrl.pathname);
  if (content && isPassThrough(response)) {
    const exists = await isPublishedSlug(content.kind, content.slug);
    // `null` means the lookup could not be completed — fall through and let the
    // page render rather than risk a false 404 on live content.
    if (exists === false) {
      response = NextResponse.rewrite(new URL("/_not-found", request.url), {
        status: 404,
      });
    }
  }

  await updateUserSessionExpiration(response.cookies);

  return response;
}

async function middlewareAuth(request: NextRequest) {
  const session = await getUserSession(request.cookies);
  const pathname = request.nextUrl.pathname;

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isPublicRoute =
    PUBLIC_SITE_PATHS.includes(
      pathname as (typeof PUBLIC_SITE_PATHS)[number],
    ) || publicRoutes.some((route) => pathname.startsWith(route));

  if (!session?.user) {
    if (isAuthRoute || isPublicRoute) {
      return NextResponse.next();
    }
    const screen = getProtectedScreenDefinitionByPathname(pathname);
    if (!screen) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/sign-in", request.url));
  } else {
    if (isAuthRoute) {
      return NextResponse.redirect(new URL("/", request.url));
    } else if (isPublicRoute) {
      return NextResponse.next();
    } else {
      const screen = getProtectedScreenDefinitionByPathname(pathname);
      if (!screen) {
        return NextResponse.next();
      }
      if (
        !hasPermission(session.user, "screens", "view", {
          screenKey: screen.key,
        })
      ) {
        return NextResponse.rewrite(new URL("/unauthorized", request.url));
      } else {
        return NextResponse.next();
      }
    }
  }
}

export const config = {
  matcher: [
    "/((?!_next)(?!api)(?!unauthorized)(?!$)(?![^?]*.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml)).*)",
  ],
};
