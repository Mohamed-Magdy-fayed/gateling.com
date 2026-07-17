import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { createUserSession } from "@/features/core/auth/core/session";
import { resolveFeedbackAccessToken } from "@/features/system/case-studies/server/feedback-access";

/**
 * Consumes a feedback-request magic link: validates the token, opens a session
 * for the client user, and lands them on their feedback form. A Route Handler is
 * the only place we can set the session cookie (page renders can't). Links are
 * reusable until they expire (see MAGIC_LINK_TTL_MS).
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  const result = await resolveFeedbackAccessToken(token);

  if (result.status === "invalid") {
    redirect("/");
  }

  if (result.status === "expired") {
    redirect(
      result.slug ? `/feedback/${result.slug}?linkExpired=1` : "/",
    );
  }

  const cookieJar = await cookies();
  await createUserSession(result.user, cookieJar);

  redirect(result.slug ? `/feedback/${result.slug}` : "/");
}
