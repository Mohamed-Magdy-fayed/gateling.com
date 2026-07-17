import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/drizzle";
import {
  CaseStudiesTable,
  UsersTable,
  UserTokensTable,
} from "@/drizzle/schema";
import {
  createTokenValue,
  hashTokenValue,
} from "@/features/core/auth/core/token";
import type { PartialUser } from "@/features/core/auth/types";
import {
  assertAdminRole,
  getRequiredSession,
  type TRPCContext,
} from "./shared";

/**
 * Feedback-request magic links are reusable within this window (not single-use):
 * WhatsApp and other chat apps pre-fetch links to build previews, which would
 * silently consume a single-use token before the client ever taps it. A short
 * reusable TTL avoids that while keeping exposure bounded. Admins can mint a
 * fresh link at any time (previous links stay valid until they expire).
 */
export const MAGIC_LINK_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type Database = typeof db;

type MagicLinkMetadata = { caseStudyId: string; slug: string };

/**
 * Mint a magic-link token for a case study's client user and return the raw
 * token (only exposed once, at creation). Only the sha256 hash is stored.
 */
export async function mintFeedbackAccessToken(
  database: Database,
  args: { userId: string; caseStudyId: string; slug: string },
): Promise<string> {
  const token = createTokenValue();
  const tokenHash = hashTokenValue(token);

  await database.insert(UserTokensTable).values({
    userId: args.userId,
    tokenHash,
    type: "magic_link",
    expiresAt: new Date(Date.now() + MAGIC_LINK_TTL_MS),
    metadata: { caseStudyId: args.caseStudyId, slug: args.slug },
  });

  return token;
}

export type ConsumeMagicLinkResult =
  | { status: "ok"; user: PartialUser; slug: string | null }
  | { status: "expired"; slug: string | null }
  | { status: "invalid" };

function readSlug(metadata: unknown): string | null {
  if (metadata && typeof metadata === "object" && "slug" in metadata) {
    const slug = (metadata as MagicLinkMetadata).slug;
    return typeof slug === "string" ? slug : null;
  }
  return null;
}

/**
 * Validate a raw magic-link token (expiry only — links are reusable) and return
 * the client user to sign in plus the target case study slug. Never throws.
 */
export async function resolveFeedbackAccessToken(
  token: string,
): Promise<ConsumeMagicLinkResult> {
  if (!token) return { status: "invalid" };

  const tokenHash = hashTokenValue(token);
  const record = await db.query.UserTokensTable.findFirst({
    columns: { userId: true, expiresAt: true, metadata: true },
    where: and(
      eq(UserTokensTable.tokenHash, tokenHash),
      eq(UserTokensTable.type, "magic_link"),
    ),
  });

  if (!record?.userId) return { status: "invalid" };

  const slug = readSlug(record.metadata);

  if (record.expiresAt.getTime() <= Date.now()) {
    return { status: "expired", slug };
  }

  const user = await db.query.UsersTable.findFirst({
    columns: {
      id: true,
      role: true,
      email: true,
      name: true,
      emailVerifiedAt: true,
    },
    where: eq(UsersTable.id, record.userId),
  });

  if (!user) return { status: "invalid" };

  return { status: "ok", user, slug };
}

export type FeedbackAccessLink =
  | { hasClientUser: false }
  | {
      hasClientUser: true;
      token: string;
      email: string | null;
      name: string | null;
      phone: string | null;
    };

/**
 * Admin-only: mint a magic link for a case study's client user and return the
 * raw token plus the client's contact details, so the compose dialog can build
 * the WhatsApp message. Returns `hasClientUser: false` when no client account is
 * linked to the case study yet.
 */
export async function createFeedbackAccessLink(
  ctx: TRPCContext,
  caseStudyId: string,
): Promise<FeedbackAccessLink> {
  const session = getRequiredSession(ctx);
  assertAdminRole(session.user.role);

  const caseStudy = await ctx.db.query.CaseStudiesTable.findFirst({
    columns: { id: true, slug: true, clientUserId: true },
    where: and(
      eq(CaseStudiesTable.id, caseStudyId),
      isNull(CaseStudiesTable.deletedAt),
    ),
  });
  if (!caseStudy) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Case study not found" });
  }
  if (!caseStudy.clientUserId) return { hasClientUser: false };

  const user = await ctx.db.query.UsersTable.findFirst({
    columns: { id: true, name: true, email: true, phone: true },
    where: eq(UsersTable.id, caseStudy.clientUserId),
  });
  if (!user) return { hasClientUser: false };

  const token = await mintFeedbackAccessToken(ctx.db, {
    userId: user.id,
    caseStudyId: caseStudy.id,
    slug: caseStudy.slug,
  });

  return {
    hasClientUser: true,
    token,
    email: user.email,
    name: user.name,
    phone: user.phone,
  };
}
