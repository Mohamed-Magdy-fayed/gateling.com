import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { hasPermission } from "@/features/core/auth/core/permissions";
import { createTRPCRouter, protectedProcedure } from "@/integrations/trpc/init";

import {
  addEvidenceSchema,
  addHandleSchema,
  addHypothesisSchema,
  createStudySchema,
  idSchema,
  listTemplatesSchema,
  logCommitmentSchema,
  logTouchpointSchema,
  markRepliedSchema,
  newContactSchema,
  searchContactsSchema,
  searchLeadsSchema,
  setCommitmentStatusSchema,
  setVerdictSchema,
  studyScopedSchema,
  templateInputSchema,
  updateContactSchema,
  updateStudySchema,
  updateTemplateSchema,
} from "./schemas";
import * as service from "./service";

/**
 * Discovery is worked by staff (admins and operators) who may view the
 * `discovery` screen. `src/proxy.ts` guards the pages, but a procedure is
 * reachable directly and holds interview quotes and phones, so every
 * procedure checks the role *and* the same screen permission.
 */
const staffProcedure = protectedProcedure.use(({ ctx, next }) => {
  const user = ctx.session?.user;
  if (
    !user ||
    (user.role !== "admin" && user.role !== "employee") ||
    !hasPermission(user, "screens", "view", { screenKey: "discovery" })
  ) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx: { ...ctx, userId: user.id } });
});

/** Hard deletes stay admin-only, like the sales module's destructive actions. */
const adminProcedure = staffProcedure.use(({ ctx, next }) => {
  if (ctx.session?.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next();
});

export type DiscoveryStudyDetail = Awaited<ReturnType<typeof service.getStudy>>;
export type DiscoveryContactDetail = Awaited<
  ReturnType<typeof service.getContact>
>;

export const discoveryRouter = createTRPCRouter({
  // Studies
  listStudies: staffProcedure
    .input(z.object({ includeArchived: z.boolean().default(false) }).optional())
    .query(({ ctx, input }) =>
      service.listStudies(ctx.db, input?.includeArchived ?? false),
    ),
  getStudy: staffProcedure
    .input(idSchema)
    .query(({ ctx, input }) => service.getStudy(ctx.db, input.id)),
  createStudy: staffProcedure
    .input(createStudySchema)
    .mutation(({ ctx, input }) =>
      service.createStudy(ctx.db, input, ctx.userId),
    ),
  updateStudy: staffProcedure
    .input(updateStudySchema)
    .mutation(({ ctx, input }) => service.updateStudy(ctx.db, input)),
  addHypothesis: staffProcedure
    .input(addHypothesisSchema)
    .mutation(({ ctx, input }) => service.addHypothesis(ctx.db, input)),
  setHypothesisVerdict: staffProcedure
    .input(setVerdictSchema)
    .mutation(({ ctx, input }) =>
      service.setHypothesisVerdict(ctx.db, input.id, input.verdict),
    ),

  // Study feeds
  listEvidence: staffProcedure
    .input(studyScopedSchema)
    .query(({ ctx, input }) => service.listEvidence(ctx.db, input.studyId)),
  listTouchpoints: staffProcedure
    .input(
      studyScopedSchema.extend({ waitingOnly: z.boolean().default(false) }),
    )
    .query(({ ctx, input }) =>
      service.listTouchpoints(ctx.db, input.studyId, input.waitingOnly),
    ),
  listCommitments: staffProcedure
    .input(studyScopedSchema)
    .query(({ ctx, input }) => service.listCommitments(ctx.db, input.studyId)),

  // Contacts
  searchContacts: staffProcedure
    .input(searchContactsSchema)
    .query(({ ctx, input }) =>
      service.searchContacts(ctx.db, input.query, input.limit),
    ),
  getContact: staffProcedure
    .input(idSchema)
    .query(({ ctx, input }) => service.getContact(ctx.db, input.id)),
  createContact: staffProcedure
    .input(newContactSchema)
    .mutation(({ ctx, input }) =>
      service.createContact(ctx.db, input, ctx.userId),
    ),
  updateContact: staffProcedure
    .input(updateContactSchema)
    .mutation(({ ctx, input }) => service.updateContact(ctx.db, input)),
  addHandle: staffProcedure
    .input(addHandleSchema)
    .mutation(({ ctx, input }) => service.addHandle(ctx.db, input)),
  searchLeads: staffProcedure
    .input(searchLeadsSchema)
    .query(({ ctx, input }) => service.searchLeads(ctx.db, input.query)),

  // Touchpoints
  logTouchpoint: staffProcedure
    .input(logTouchpointSchema)
    .mutation(({ ctx, input }) =>
      service.logTouchpoint(ctx.db, input, ctx.userId),
    ),
  markReplied: staffProcedure
    .input(markRepliedSchema)
    .mutation(({ ctx, input }) => service.markReplied(ctx.db, input)),
  deleteTouchpoint: adminProcedure
    .input(idSchema)
    .mutation(({ ctx, input }) => service.deleteTouchpoint(ctx.db, input.id)),

  // Evidence and commitments
  addEvidence: staffProcedure
    .input(addEvidenceSchema)
    .mutation(({ ctx, input }) =>
      service.addEvidence(ctx.db, input, ctx.userId),
    ),
  deleteEvidence: adminProcedure
    .input(idSchema)
    .mutation(({ ctx, input }) => service.deleteEvidence(ctx.db, input.id)),
  logCommitment: staffProcedure
    .input(logCommitmentSchema)
    .mutation(({ ctx, input }) =>
      service.logCommitment(ctx.db, input, ctx.userId),
    ),
  setCommitmentStatus: staffProcedure
    .input(setCommitmentStatusSchema)
    .mutation(({ ctx, input }) =>
      service.setCommitmentStatus(ctx.db, input.id, input.status),
    ),

  // Templates
  listTemplates: staffProcedure
    .input(listTemplatesSchema)
    .query(({ ctx, input }) => service.listTemplates(ctx.db, input)),
  templateStats: staffProcedure.query(({ ctx }) =>
    service.templateStats(ctx.db),
  ),
  createTemplate: staffProcedure
    .input(templateInputSchema)
    .mutation(({ ctx, input }) => service.createTemplate(ctx.db, input)),
  updateTemplate: staffProcedure
    .input(updateTemplateSchema)
    .mutation(({ ctx, input }) => service.updateTemplate(ctx.db, input)),
});
