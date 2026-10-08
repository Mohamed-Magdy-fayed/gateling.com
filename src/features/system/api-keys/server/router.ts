import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { ApiKeysTable, UsersTable } from "@/drizzle/schema";
import { translationKey } from "@/features/core/i18n/global";
import {
  assertAdminRole,
  getRequiredSession,
} from "@/features/system/case-studies/server/shared";
import { createTRPCRouter, protectedProcedure } from "@/integrations/trpc/init";
import { generateApiKey } from "./keys";

const apiKeyCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, translationKey("forms.validation.required"))
    .max(100, translationKey("forms.validation.max255")),
});

/**
 * Admin management of content API keys. A key is created for — and acts
 * as — the admin who creates it; the plaintext comes back exactly once.
 */
export const apiKeysRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    assertAdminRole(getRequiredSession(ctx).user.role);
    return ctx.db
      .select({
        id: ApiKeysTable.id,
        name: ApiKeysTable.name,
        keyPrefix: ApiKeysTable.keyPrefix,
        ownerEmail: UsersTable.email,
        lastUsedAt: ApiKeysTable.lastUsedAt,
        revokedAt: ApiKeysTable.revokedAt,
        createdAt: ApiKeysTable.createdAt,
      })
      .from(ApiKeysTable)
      .innerJoin(UsersTable, eq(UsersTable.id, ApiKeysTable.userId))
      .orderBy(desc(ApiKeysTable.createdAt));
  }),

  create: protectedProcedure
    .input(apiKeyCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const session = getRequiredSession(ctx);
      assertAdminRole(session.user.role);
      const { key, prefix, hash } = generateApiKey();
      const [row] = await ctx.db
        .insert(ApiKeysTable)
        .values({
          name: input.name,
          keyPrefix: prefix,
          keyHash: hash,
          userId: session.user.id,
          createdBy: session.user.id,
        })
        .returning({ id: ApiKeysTable.id });
      return { id: row.id, key };
    }),

  revoke: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      assertAdminRole(getRequiredSession(ctx).user.role);
      const [row] = await ctx.db
        .update(ApiKeysTable)
        .set({ revokedAt: new Date() })
        .where(
          and(eq(ApiKeysTable.id, input.id), isNull(ApiKeysTable.revokedAt)),
        )
        .returning({ id: ApiKeysTable.id });
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return { id: row.id };
    }),
});
