import { TRPCError } from "@trpc/server";
import { and, asc, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { ServiceMediaTable, ServicesTable } from "@/drizzle/schema";
import { translationKey } from "@/features/core/i18n/global";
import {
  type MediaItemInput,
  mediaItemSchema,
} from "@/features/system/case-studies/server/schemas";
import type { TRPCContext } from "@/features/system/case-studies/server/shared";
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/integrations/trpc/init";
import { localize } from "@/lib/i18n-content";

function assertAdmin(role: string) {
  if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
}

async function upsertServiceMedia(
  db: TRPCContext["db"],
  serviceId: string,
  media: MediaItemInput[],
  actorId: string,
) {
  await db
    .delete(ServiceMediaTable)
    .where(eq(ServiceMediaTable.serviceId, serviceId));
  if (media.length === 0) return;
  await db.insert(ServiceMediaTable).values(
    media.map((item, idx) => ({
      serviceId,
      type: item.type,
      url: item.url,
      title: item.title ?? null,
      isFeatured: item.isFeatured,
      isSecondary: item.isSecondary,
      sortOrder: item.sortOrder ?? idx,
      createdBy: actorId,
    })),
  );
}

const required = translationKey("forms.validation.required");
const max255 = translationKey("forms.validation.max255");

const serviceMutationSchema = z.object({
  title: z.string().trim().min(1, required).max(255, max255),
  titleAr: z.string().trim().max(255).optional().nullable(),
  slug: z
    .string()
    .trim()
    .min(1, required)
    .max(255, max255)
    .regex(/^[a-z0-9-]+$/, translationKey("forms.validation.slugFormat")),
  shortDescription: z.string().trim().min(1, required).max(512),
  shortDescriptionAr: z.string().trim().max(512).optional().nullable(),
  fullDescription: z.string().trim().max(2048).optional().nullable(),
  fullDescriptionAr: z.string().trim().max(2048).optional().nullable(),
  icon: z.string().trim().min(1, required).max(64).default("Zap"),
  features: z.array(z.string().trim().min(1)).default([]),
  featuresAr: z.array(z.string().trim().min(1)).optional().nullable(),
  coverImageUrl: z.string().max(1024).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  media: z.array(mediaItemSchema).default([]),
});

const serviceUpdateSchema = serviceMutationSchema.extend({
  id: z.string().uuid(),
});

export const servicesMgmtRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      assertAdmin(ctx.session?.user.role ?? "");
      return ctx.db.query.ServicesTable.findFirst({
        where: and(
          eq(ServicesTable.id, input.id),
          isNull(ServicesTable.deletedAt),
        ),
        with: { media: { orderBy: [asc(ServiceMediaTable.sortOrder)] } },
      });
    }),
  publicList: baseProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.query.ServicesTable.findMany({
      where: and(
        eq(ServicesTable.isActive, true),
        isNull(ServicesTable.deletedAt),
      ),
      orderBy: [asc(ServicesTable.sortOrder)],
      with: { media: { orderBy: [asc(ServiceMediaTable.sortOrder)] } },
    });
    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      icon: row.icon,
      coverImageUrl: row.coverImageUrl,
      sortOrder: row.sortOrder,
      media: row.media,
      title: localize(row.title, row.titleAr, ctx.locale),
      shortDescription: localize(
        row.shortDescription,
        row.shortDescriptionAr,
        ctx.locale,
      ),
      features: localize(row.features, row.featuresAr, ctx.locale),
    }));
  }),
  list: protectedProcedure.query(async ({ ctx }) => {
    assertAdmin(ctx.session?.user.role ?? "");
    return ctx.db.query.ServicesTable.findMany({
      where: isNull(ServicesTable.deletedAt),
      orderBy: [asc(ServicesTable.sortOrder)],
      with: { media: { orderBy: [asc(ServiceMediaTable.sortOrder)] } },
    });
  }),
  create: protectedProcedure
    .input(serviceMutationSchema)
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session?.user.role ?? "");
      const { media, ...data } = input;
      const [row] = await ctx.db
        .insert(ServicesTable)
        .values({
          ...data,
          coverImageUrl: data.coverImageUrl ?? null,
          fullDescription: data.fullDescription ?? null,
          createdBy: ctx.session?.user.id ?? "system",
        })
        .returning({ id: ServicesTable.id });
      await upsertServiceMedia(
        ctx.db,
        row.id,
        media,
        ctx.session?.user.id ?? "system",
      );
      return { id: row.id };
    }),
  update: protectedProcedure
    .input(serviceUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session?.user.role ?? "");
      const { id, media, ...data } = input;
      await ctx.db
        .update(ServicesTable)
        .set({
          ...data,
          coverImageUrl: data.coverImageUrl ?? null,
          fullDescription: data.fullDescription ?? null,
          updatedBy: ctx.session?.user.id ?? "system",
        })
        .where(eq(ServicesTable.id, id));
      await upsertServiceMedia(
        ctx.db,
        id,
        media,
        ctx.session?.user.id ?? "system",
      );
      return { updated: true };
    }),
  activate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session?.user.role ?? "");
      await ctx.db
        .update(ServicesTable)
        .set({ isActive: true })
        .where(eq(ServicesTable.id, input.id));
      return { activated: true };
    }),
  deactivate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session?.user.role ?? "");
      await ctx.db
        .update(ServicesTable)
        .set({ isActive: false })
        .where(eq(ServicesTable.id, input.id));
      return { deactivated: true };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session?.user.role ?? "");
      await ctx.db
        .update(ServicesTable)
        .set({
          deletedAt: new Date(),
          deletedBy: ctx.session?.user.id ?? "system",
        })
        .where(eq(ServicesTable.id, input.id));
      return { deleted: true };
    }),
});
