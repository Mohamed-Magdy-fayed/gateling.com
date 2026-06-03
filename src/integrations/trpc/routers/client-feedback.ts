import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import {
  CaseStudiesTable,
  TestimonialsTable,
  UsersTable,
} from "@/drizzle/schema";
import { translationKey } from "@/features/core/i18n/global";
import { createTRPCRouter, protectedProcedure } from "@/integrations/trpc/init";

const required = translationKey("forms.validation.required");
const max255 = translationKey("forms.validation.max255");

export const clientFeedbackRouter = createTRPCRouter({
  getForCaseStudy: protectedProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const caseStudy = await ctx.db.query.CaseStudiesTable.findFirst({
        where: eq(CaseStudiesTable.slug, input.slug),
        columns: {
          id: true,
          title: true,
          client: true,
          industry: true,
          solution: true,
          results: true,
          slug: true,
        },
      });

      if (!caseStudy) throw new TRPCError({ code: "NOT_FOUND" });

      const testimonial = await ctx.db.query.TestimonialsTable.findFirst({
        where: and(
          eq(TestimonialsTable.userId, ctx.session.user.id),
          eq(TestimonialsTable.caseStudyId, caseStudy.id),
        ),
        columns: {
          id: true,
          clientName: true,
          company: true,
          role: true,
          content: true,
          rating: true,
          avatarUrl: true,
          isVisible: true,
        },
      });

      const user = await ctx.db.query.UsersTable.findFirst({
        where: eq(UsersTable.id, ctx.session.user.id),
        columns: { id: true, name: true, imageUrl: true },
      });

      if (!user) throw new TRPCError({ code: "NOT_FOUND" });

      return { caseStudy, testimonial: testimonial ?? null, user };
    }),

  upsert: protectedProcedure
    .input(
      z.object({
        caseStudyId: z.string().uuid(),
        name: z.string().trim().min(1, required).max(255, max255),
        imageUrl: z.string().max(1024).nullable().optional(),
        role: z.string().trim().max(128).nullable().optional(),
        company: z.string().trim().min(1, required).max(255, max255),
        rating: z.number().int().min(1).max(5),
        content: z.string().trim().min(1, required).max(1024),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const testimonialId = await ctx.db.transaction(async (tx) => {
        await tx
          .update(UsersTable)
          .set({
            name: input.name,
            imageUrl: input.imageUrl ?? null,
            updatedBy: userId,
          })
          .where(eq(UsersTable.id, userId));

        const existing = await tx.query.TestimonialsTable.findFirst({
          where: and(
            eq(TestimonialsTable.userId, userId),
            eq(TestimonialsTable.caseStudyId, input.caseStudyId),
          ),
          columns: { id: true },
        });

        if (existing) {
          await tx
            .update(TestimonialsTable)
            .set({
              clientName: input.name,
              company: input.company,
              role: input.role ?? null,
              content: input.content,
              rating: input.rating,
              avatarUrl: input.imageUrl ?? null,
              updatedBy: userId,
            })
            .where(eq(TestimonialsTable.id, existing.id));
          return existing.id;
        }

        const [row] = await tx
          .insert(TestimonialsTable)
          .values({
            clientName: input.name,
            company: input.company,
            role: input.role ?? null,
            content: input.content,
            rating: input.rating,
            avatarUrl: input.imageUrl ?? null,
            userId,
            caseStudyId: input.caseStudyId,
            isVisible: false,
            sortOrder: 99,
            createdBy: userId,
          })
          .returning({ id: TestimonialsTable.id });

        return row.id;
      });

      return { testimonialId };
    }),
});
