import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import { TestimonialsTable, UsersTable } from "@/drizzle/schema";
import { translationKey } from "@/features/core/i18n/global";
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/integrations/trpc/init";
import { localize } from "@/lib/i18n-content";

function assertAdmin(role: string) {
  if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
}

const required = translationKey("forms.validation.required");
const max255 = translationKey("forms.validation.max255");

const testimonialMutationSchema = z.object({
  clientName: z.string().trim().min(1, required).max(255, max255),
  company: z.string().trim().min(1, required).max(255, max255),
  role: z.string().trim().max(128).optional().nullable(),
  roleAr: z.string().trim().max(128).optional().nullable(),
  content: z.string().trim().min(1, required).max(1024),
  contentAr: z.string().trim().max(1024).optional().nullable(),
  avatarUrl: z.string().max(1024).optional().nullable(),
  caseStudyId: z.string().uuid().optional().nullable(),
  isVisible: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

const testimonialUpdateSchema = testimonialMutationSchema.extend({
  id: z.string().uuid(),
});

export const testimonialsRouter = createTRPCRouter({
  publicList: baseProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: TestimonialsTable.id,
        clientName: TestimonialsTable.clientName,
        company: TestimonialsTable.company,
        role: TestimonialsTable.role,
        roleAr: TestimonialsTable.roleAr,
        content: TestimonialsTable.content,
        contentAr: TestimonialsTable.contentAr,
        avatarUrl: TestimonialsTable.avatarUrl,
        rating: TestimonialsTable.rating,
        sortOrder: TestimonialsTable.sortOrder,
      })
      .from(TestimonialsTable)
      .where(and(eq(TestimonialsTable.isVisible, true)))
      .orderBy(asc(TestimonialsTable.sortOrder));
    return rows.map((row) => ({
      id: row.id,
      clientName: row.clientName,
      company: row.company,
      avatarUrl: row.avatarUrl,
      rating: row.rating,
      sortOrder: row.sortOrder,
      role: localize(row.role ?? null, row.roleAr, ctx.locale),
      content: localize(row.content, row.contentAr, ctx.locale),
    }));
  }),
  publicListByCaseStudy: baseProcedure
    .input(z.object({ caseStudyId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: TestimonialsTable.id,
          clientName: TestimonialsTable.clientName,
          company: TestimonialsTable.company,
          role: TestimonialsTable.role,
          roleAr: TestimonialsTable.roleAr,
          content: TestimonialsTable.content,
          contentAr: TestimonialsTable.contentAr,
          avatarUrl: TestimonialsTable.avatarUrl,
          rating: TestimonialsTable.rating,
          sortOrder: TestimonialsTable.sortOrder,
          userImageUrl: UsersTable.imageUrl,
        })
        .from(TestimonialsTable)
        .leftJoin(UsersTable, eq(TestimonialsTable.userId, UsersTable.id))
        .where(
          and(
            eq(TestimonialsTable.isVisible, true),
            eq(TestimonialsTable.caseStudyId, input.caseStudyId),
          ),
        )
        .orderBy(asc(TestimonialsTable.sortOrder));
      return rows.map((row) => ({
        id: row.id,
        clientName: row.clientName,
        company: row.company,
        avatarUrl: row.avatarUrl ?? row.userImageUrl,
        rating: row.rating,
        sortOrder: row.sortOrder,
        role: localize(row.role ?? null, row.roleAr, ctx.locale),
        content: localize(row.content, row.contentAr, ctx.locale),
      }));
    }),
  list: protectedProcedure.query(async ({ ctx }) => {
    assertAdmin(ctx.session?.user.role ?? "");
    return ctx.db
      .select()
      .from(TestimonialsTable)
      .orderBy(TestimonialsTable.sortOrder);
  }),
  create: protectedProcedure
    .input(testimonialMutationSchema)
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session?.user.role ?? "");
      const [row] = await ctx.db
        .insert(TestimonialsTable)
        .values({
          ...input,
          role: input.role ?? null,
          avatarUrl: input.avatarUrl ?? null,
          caseStudyId: input.caseStudyId ?? null,
          createdBy: ctx.session?.user.id ?? "system",
        })
        .returning({ id: TestimonialsTable.id });
      return { id: row.id };
    }),
  update: protectedProcedure
    .input(testimonialUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session?.user.role ?? "");
      const { id, ...data } = input;
      await ctx.db
        .update(TestimonialsTable)
        .set({
          ...data,
          role: data.role ?? null,
          avatarUrl: data.avatarUrl ?? null,
          caseStudyId: data.caseStudyId ?? null,
          updatedBy: ctx.session?.user.id ?? "system",
        })
        .where(eq(TestimonialsTable.id, id));
      return { updated: true };
    }),
  toggleVisibility: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session?.user.role ?? "");
      const existing = await ctx.db.query.TestimonialsTable.findFirst({
        columns: { id: true, isVisible: true },
        where: eq(TestimonialsTable.id, input.id),
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.db
        .update(TestimonialsTable)
        .set({ isVisible: !existing.isVisible })
        .where(eq(TestimonialsTable.id, input.id));
      return { isVisible: !existing.isVisible };
    }),
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      assertAdmin(ctx.session?.user.role ?? "");
      await ctx.db
        .delete(TestimonialsTable)
        .where(eq(TestimonialsTable.id, input.id));
      return { deleted: true };
    }),
});
