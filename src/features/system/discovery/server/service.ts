import "server-only";

import { TRPCError } from "@trpc/server";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  or,
  sql,
} from "drizzle-orm";

import type { db as database } from "@/drizzle";
import {
  type DiscoveryChannel,
  DiscoveryCommitmentsTable,
  DiscoveryContactHandlesTable,
  DiscoveryContactsTable,
  DiscoveryEvidenceHypothesesTable,
  DiscoveryEvidenceTable,
  DiscoveryHypothesesTable,
  DiscoveryStudiesTable,
  DiscoveryTemplatesTable,
  DiscoveryTouchpointsTable,
  LeadsTable,
} from "@/drizzle/schema";
import {
  channelForUrl,
  handleForUrl,
  normalizeUrl,
} from "@/features/system/discovery/lib/links";
import {
  computeReadout,
  isLiveTouchpoint,
} from "@/features/system/discovery/lib/readout";
import { replyStats } from "@/features/system/discovery/lib/reply-stats";

import type {
  AddEvidenceInput,
  CreateStudyInput,
  LogCommitmentInput,
  LogTouchpointInput,
  NewContactInput,
  RemoveTouchpointInput,
  TemplateInput,
  UpdateContactInput,
  UpdateStudyInput,
  UpdateTemplateInput,
} from "./schemas";

/**
 * All Discovery logic. The tRPC router authorises and delegates here; the MCP
 * server calls the router, so both paths share these functions. Nothing in
 * this file writes to `leads` — a contact only points at one.
 */

type Db = typeof database;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
type Exec = Db | Tx;

function notFound(what: string): never {
  throw new TRPCError({ code: "NOT_FOUND", message: `${what}_not_found` });
}

function toDate(value: string | undefined): Date | undefined {
  return value ? new Date(value) : undefined;
}

function like(value: string): string {
  return `%${value.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

// ─── Studies ────────────────────────────────────────────────────────────────

export async function createStudy(
  db: Db,
  input: CreateStudyInput,
  userId: string,
) {
  return db.transaction(async (tx) => {
    const [study] = await tx
      .insert(DiscoveryStudiesTable)
      .values({
        title: input.title,
        niche: input.niche,
        problemStatement: input.problemStatement,
        priceQuoted: input.priceQuoted || null,
        targetConversations: input.targetConversations,
        goMinCommitments: input.goMinCommitments,
        killMinStories: input.killMinStories,
        createdBy: userId,
      })
      .returning();
    if (!study) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    if (input.hypotheses.length > 0) {
      await tx.insert(DiscoveryHypothesesTable).values(
        input.hypotheses.map((h, index) => ({
          ...h,
          sortOrder: h.sortOrder ?? index + 1,
          studyId: study.id,
        })),
      );
    }
    return study;
  });
}

export async function updateStudy(db: Db, input: UpdateStudyInput) {
  const { id, ...patch } = input;
  const [row] = await db
    .update(DiscoveryStudiesTable)
    .set(patch)
    .where(eq(DiscoveryStudiesTable.id, id))
    .returning();
  return row ?? notFound("study");
}

export async function addHypothesis(
  db: Db,
  input: CreateStudyInput["hypotheses"][number] & { studyId: string },
) {
  const [{ next } = { next: 1 }] = await db
    .select({
      next: sql<number>`coalesce(max(${DiscoveryHypothesesTable.sortOrder}), 0) + 1`,
    })
    .from(DiscoveryHypothesesTable)
    .where(eq(DiscoveryHypothesesTable.studyId, input.studyId));
  const [row] = await db
    .insert(DiscoveryHypothesesTable)
    .values({ ...input, sortOrder: input.sortOrder ?? Number(next) })
    .returning();
  return row;
}

export async function setHypothesisVerdict(
  db: Db,
  id: string,
  verdict: "open" | "true" | "false",
) {
  const [row] = await db
    .update(DiscoveryHypothesesTable)
    .set({ verdict })
    .where(eq(DiscoveryHypothesesTable.id, id))
    .returning();
  return row ?? notFound("hypothesis");
}

async function studyFacts(db: Db, studyIds: string[]) {
  if (studyIds.length === 0) {
    return {
      hypotheses: [],
      touchpoints: [],
      evidence: [],
      links: [],
      commitments: [],
    };
  }
  const [hypotheses, touchpoints, evidence, commitments] = await Promise.all([
    db
      .select()
      .from(DiscoveryHypothesesTable)
      .where(inArray(DiscoveryHypothesesTable.studyId, studyIds))
      .orderBy(asc(DiscoveryHypothesesTable.sortOrder)),
    db
      .select({
        studyId: DiscoveryTouchpointsTable.studyId,
        contactId: DiscoveryTouchpointsTable.contactId,
        direction: DiscoveryTouchpointsTable.direction,
        format: DiscoveryTouchpointsTable.format,
        repliedAt: DiscoveryTouchpointsTable.repliedAt,
        occurredAt: DiscoveryTouchpointsTable.occurredAt,
        templateId: DiscoveryTouchpointsTable.templateId,
        persona: DiscoveryTouchpointsTable.persona,
        channel: DiscoveryTouchpointsTable.channel,
        // Kept in the facts so the pure readout and reply stats skip them.
        removedAt: DiscoveryTouchpointsTable.removedAt,
      })
      .from(DiscoveryTouchpointsTable)
      .where(inArray(DiscoveryTouchpointsTable.studyId, studyIds)),
    db
      .select({
        id: DiscoveryEvidenceTable.id,
        studyId: DiscoveryEvidenceTable.studyId,
        contactId: DiscoveryEvidenceTable.contactId,
        kind: DiscoveryEvidenceTable.kind,
      })
      .from(DiscoveryEvidenceTable)
      .where(inArray(DiscoveryEvidenceTable.studyId, studyIds)),
    db
      .select({
        studyId: DiscoveryCommitmentsTable.studyId,
        contactId: DiscoveryCommitmentsTable.contactId,
        type: DiscoveryCommitmentsTable.type,
        status: DiscoveryCommitmentsTable.status,
      })
      .from(DiscoveryCommitmentsTable)
      .where(inArray(DiscoveryCommitmentsTable.studyId, studyIds)),
  ]);
  const evidenceIds = evidence.map((e) => e.id);
  const links = evidenceIds.length
    ? await db
        .select()
        .from(DiscoveryEvidenceHypothesesTable)
        .where(
          inArray(DiscoveryEvidenceHypothesesTable.evidenceId, evidenceIds),
        )
    : [];
  return { hypotheses, touchpoints, evidence, links, commitments };
}

type Facts = Awaited<ReturnType<typeof studyFacts>>;

function readoutFor(
  study: typeof DiscoveryStudiesTable.$inferSelect,
  facts: Facts,
) {
  const mine = <T extends { studyId: string }>(rows: T[]) =>
    rows.filter((r) => r.studyId === study.id);
  const evidence = mine(facts.evidence).map((e) => ({
    contactId: e.contactId,
    kind: e.kind,
    links: facts.links
      .filter((l) => l.evidenceId === e.id)
      .map((l) => ({ hypothesisId: l.hypothesisId, stance: l.stance })),
  }));
  return computeReadout({
    study,
    hypotheses: mine(facts.hypotheses),
    touchpoints: mine(facts.touchpoints),
    evidence,
    commitments: mine(facts.commitments),
  });
}

export async function listStudies(db: Db, includeArchived = false) {
  const studies = await db
    .select()
    .from(DiscoveryStudiesTable)
    .where(
      includeArchived
        ? undefined
        : sql`${DiscoveryStudiesTable.status} <> 'archived'`,
    )
    .orderBy(desc(DiscoveryStudiesTable.createdAt));
  const facts = await studyFacts(
    db,
    studies.map((s) => s.id),
  );
  return studies.map((study) => {
    const readout = readoutFor(study, facts);
    const touchpoints = facts.touchpoints.filter(
      (t) => t.studyId === study.id && isLiveTouchpoint(t),
    );
    return {
      ...study,
      touchpointCount: touchpoints.length,
      readout,
    };
  });
}

export async function getStudy(db: Db, id: string) {
  const [study] = await db
    .select()
    .from(DiscoveryStudiesTable)
    .where(eq(DiscoveryStudiesTable.id, id));
  if (!study) notFound("study");
  const facts = await studyFacts(db, [id]);
  return {
    study,
    hypotheses: facts.hypotheses,
    readout: readoutFor(study, facts),
    replyStats: replyStats(facts.touchpoints),
  };
}

// ─── Feeds for the study page ─────────────────────────────────────────────

export async function listEvidence(db: Db, studyId: string) {
  const rows = await db
    .select({
      id: DiscoveryEvidenceTable.id,
      kind: DiscoveryEvidenceTable.kind,
      quote: DiscoveryEvidenceTable.quote,
      note: DiscoveryEvidenceTable.note,
      amountEgp: DiscoveryEvidenceTable.amountEgp,
      createdAt: DiscoveryEvidenceTable.createdAt,
      contactId: DiscoveryEvidenceTable.contactId,
      contactName: DiscoveryContactsTable.displayName,
    })
    .from(DiscoveryEvidenceTable)
    .innerJoin(
      DiscoveryContactsTable,
      eq(DiscoveryContactsTable.id, DiscoveryEvidenceTable.contactId),
    )
    .where(eq(DiscoveryEvidenceTable.studyId, studyId))
    .orderBy(desc(DiscoveryEvidenceTable.createdAt))
    .limit(300);
  const links = rows.length
    ? await db
        .select()
        .from(DiscoveryEvidenceHypothesesTable)
        .where(
          inArray(
            DiscoveryEvidenceHypothesesTable.evidenceId,
            rows.map((r) => r.id),
          ),
        )
    : [];
  return rows.map((r) => ({
    ...r,
    links: links.filter((l) => l.evidenceId === r.id),
  }));
}

const touchpointColumns = {
  id: DiscoveryTouchpointsTable.id,
  studyId: DiscoveryTouchpointsTable.studyId,
  contactId: DiscoveryTouchpointsTable.contactId,
  contactName: DiscoveryContactsTable.displayName,
  channel: DiscoveryTouchpointsTable.channel,
  format: DiscoveryTouchpointsTable.format,
  direction: DiscoveryTouchpointsTable.direction,
  persona: DiscoveryTouchpointsTable.persona,
  templateId: DiscoveryTouchpointsTable.templateId,
  url: DiscoveryTouchpointsTable.url,
  message: DiscoveryTouchpointsTable.message,
  replyText: DiscoveryTouchpointsTable.replyText,
  occurredAt: DiscoveryTouchpointsTable.occurredAt,
  repliedAt: DiscoveryTouchpointsTable.repliedAt,
  source: DiscoveryTouchpointsTable.source,
};

export async function listTouchpoints(
  db: Db,
  studyId: string,
  waitingOnly = false,
) {
  return db
    .select(touchpointColumns)
    .from(DiscoveryTouchpointsTable)
    .innerJoin(
      DiscoveryContactsTable,
      eq(DiscoveryContactsTable.id, DiscoveryTouchpointsTable.contactId),
    )
    .where(
      and(
        eq(DiscoveryTouchpointsTable.studyId, studyId),
        isNull(DiscoveryTouchpointsTable.removedAt),
        waitingOnly
          ? and(
              eq(DiscoveryTouchpointsTable.direction, "outbound"),
              isNull(DiscoveryTouchpointsTable.repliedAt),
            )
          : undefined,
      ),
    )
    .orderBy(desc(DiscoveryTouchpointsTable.occurredAt))
    .limit(300);
}

export async function listCommitments(db: Db, studyId: string) {
  return db
    .select({
      id: DiscoveryCommitmentsTable.id,
      contactId: DiscoveryCommitmentsTable.contactId,
      contactName: DiscoveryContactsTable.displayName,
      type: DiscoveryCommitmentsTable.type,
      status: DiscoveryCommitmentsTable.status,
      amountEgp: DiscoveryCommitmentsTable.amountEgp,
      priceQuoted: DiscoveryCommitmentsTable.priceQuoted,
      note: DiscoveryCommitmentsTable.note,
      createdAt: DiscoveryCommitmentsTable.createdAt,
    })
    .from(DiscoveryCommitmentsTable)
    .innerJoin(
      DiscoveryContactsTable,
      eq(DiscoveryContactsTable.id, DiscoveryCommitmentsTable.contactId),
    )
    .where(eq(DiscoveryCommitmentsTable.studyId, studyId))
    .orderBy(desc(DiscoveryCommitmentsTable.createdAt));
}

// ─── Contacts ───────────────────────────────────────────────────────────────

/**
 * Matches a typed name or handle, or a pasted profile URL (normalised, so the
 * same profile shared twice finds the same contact).
 */
export async function searchContacts(db: Db, query: string, limit: number) {
  const q = query.trim();
  const url = /^https?:\/\//i.test(q) ? normalizeUrl(q) : null;
  const handle = url ? handleForUrl(url) : null;
  const conditions = url
    ? [
        eq(DiscoveryContactHandlesTable.url, url),
        handle ? eq(DiscoveryContactHandlesTable.handle, handle) : undefined,
      ]
    : q
      ? [
          ilike(DiscoveryContactsTable.displayName, like(q)),
          ilike(DiscoveryContactsTable.businessName, like(q)),
          ilike(DiscoveryContactHandlesTable.handle, like(q)),
          ilike(DiscoveryContactsTable.phone, like(q)),
        ]
      : [];
  const rows = await db
    .selectDistinct({
      id: DiscoveryContactsTable.id,
      displayName: DiscoveryContactsTable.displayName,
      businessName: DiscoveryContactsTable.businessName,
      city: DiscoveryContactsTable.city,
      updatedAt: DiscoveryContactsTable.updatedAt,
      createdAt: DiscoveryContactsTable.createdAt,
    })
    .from(DiscoveryContactsTable)
    .leftJoin(
      DiscoveryContactHandlesTable,
      eq(DiscoveryContactHandlesTable.contactId, DiscoveryContactsTable.id),
    )
    .where(conditions.length ? or(...conditions) : undefined)
    .orderBy(desc(DiscoveryContactsTable.createdAt))
    .limit(limit);
  return rows.map(({ updatedAt: _u, createdAt: _c, ...r }) => r);
}

type HandleInput = {
  channel: DiscoveryChannel;
  url?: string | null;
  handle?: string | null;
};

async function insertHandle(db: Exec, contactId: string, handle: HandleInput) {
  const url = handle.url ? normalizeUrl(handle.url) : null;
  if (url) {
    const [existing] = await db
      .select({ id: DiscoveryContactHandlesTable.id })
      .from(DiscoveryContactHandlesTable)
      .where(
        and(
          eq(DiscoveryContactHandlesTable.contactId, contactId),
          eq(DiscoveryContactHandlesTable.url, url),
        ),
      );
    if (existing) return existing;
  }
  const [row] = await db
    .insert(DiscoveryContactHandlesTable)
    .values({
      contactId,
      channel: handle.channel,
      url,
      handle: handle.handle || (url ? handleForUrl(url) : null),
    })
    .returning({ id: DiscoveryContactHandlesTable.id });
  return row;
}

export async function createContact(
  db: Exec,
  input: NewContactInput,
  userId: string,
) {
  const { handle, ...fields } = input;
  const [contact] = await db
    .insert(DiscoveryContactsTable)
    .values({
      ...fields,
      businessName: fields.businessName || null,
      phone: fields.phone || null,
      city: fields.city || null,
      notes: fields.notes || null,
      createdBy: userId,
    })
    .returning();
  if (!contact) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
  if (handle && (handle.url || handle.handle)) {
    await insertHandle(db, contact.id, handle);
  }
  return contact;
}

export async function updateContact(db: Db, input: UpdateContactInput) {
  const { id, ...patch } = input;
  if (patch.leadId) {
    const [lead] = await db
      .select({ id: LeadsTable.id })
      .from(LeadsTable)
      .where(
        and(eq(LeadsTable.id, patch.leadId), eq(LeadsTable.kind, "prospect")),
      );
    if (!lead) notFound("lead");
  }
  const [row] = await db
    .update(DiscoveryContactsTable)
    .set(patch)
    .where(eq(DiscoveryContactsTable.id, id))
    .returning();
  return row ?? notFound("contact");
}

export async function addHandle(
  db: Db,
  input: HandleInput & { contactId: string },
) {
  return insertHandle(db, input.contactId, input);
}

export async function getContact(db: Db, id: string) {
  const [contact] = await db
    .select({
      contact: DiscoveryContactsTable,
      leadName: LeadsTable.name,
      leadNameAr: LeadsTable.nameAr,
    })
    .from(DiscoveryContactsTable)
    .leftJoin(LeadsTable, eq(LeadsTable.id, DiscoveryContactsTable.leadId))
    .where(eq(DiscoveryContactsTable.id, id));
  if (!contact) notFound("contact");
  const [handles, touchpoints, evidence, commitments] = await Promise.all([
    db
      .select()
      .from(DiscoveryContactHandlesTable)
      .where(eq(DiscoveryContactHandlesTable.contactId, id))
      .orderBy(asc(DiscoveryContactHandlesTable.createdAt)),
    db
      .select({ ...touchpointColumns, studyTitle: DiscoveryStudiesTable.title })
      .from(DiscoveryTouchpointsTable)
      .innerJoin(
        DiscoveryContactsTable,
        eq(DiscoveryContactsTable.id, DiscoveryTouchpointsTable.contactId),
      )
      .innerJoin(
        DiscoveryStudiesTable,
        eq(DiscoveryStudiesTable.id, DiscoveryTouchpointsTable.studyId),
      )
      .where(
        and(
          eq(DiscoveryTouchpointsTable.contactId, id),
          isNull(DiscoveryTouchpointsTable.removedAt),
        ),
      )
      .orderBy(desc(DiscoveryTouchpointsTable.occurredAt)),
    db
      .select()
      .from(DiscoveryEvidenceTable)
      .where(eq(DiscoveryEvidenceTable.contactId, id))
      .orderBy(desc(DiscoveryEvidenceTable.createdAt)),
    db
      .select()
      .from(DiscoveryCommitmentsTable)
      .where(eq(DiscoveryCommitmentsTable.contactId, id))
      .orderBy(desc(DiscoveryCommitmentsTable.createdAt)),
  ]);
  return {
    ...contact.contact,
    lead: contact.contact.leadId
      ? {
          id: contact.contact.leadId,
          name: contact.leadNameAr || contact.leadName,
        }
      : null,
    handles,
    touchpoints,
    evidence,
    commitments,
  };
}

/** Sales prospects to link a contact to. Read-only. */
export async function searchLeads(db: Db, query: string) {
  return db
    .select({
      id: LeadsTable.id,
      name: LeadsTable.name,
      nameAr: LeadsTable.nameAr,
      city: LeadsTable.city,
    })
    .from(LeadsTable)
    .where(
      and(
        eq(LeadsTable.kind, "prospect"),
        or(
          ilike(LeadsTable.name, like(query)),
          ilike(LeadsTable.nameAr, like(query)),
          ilike(LeadsTable.phone, like(query)),
        ),
      ),
    )
    .limit(10);
}

// ─── Touchpoints ────────────────────────────────────────────────────────────

export async function logTouchpoint(
  db: Db,
  input: LogTouchpointInput,
  userId: string,
) {
  return db.transaction(async (tx) => {
    const [study] = await tx
      .select({ id: DiscoveryStudiesTable.id })
      .from(DiscoveryStudiesTable)
      .where(eq(DiscoveryStudiesTable.id, input.studyId));
    if (!study) notFound("study");

    // A template must be this study's or a reusable one, or reply rates mix.
    if (input.templateId) {
      const [template] = await tx
        .select({ id: DiscoveryTemplatesTable.id })
        .from(DiscoveryTemplatesTable)
        .where(
          and(
            eq(DiscoveryTemplatesTable.id, input.templateId),
            or(
              eq(DiscoveryTemplatesTable.studyId, input.studyId),
              isNull(DiscoveryTemplatesTable.studyId),
            ),
          ),
        );
      if (!template) notFound("template");
    }

    const url = input.url ? normalizeUrl(input.url) : null;
    let contactId = input.contactId;
    if (!contactId) {
      if (!input.newContact) notFound("contact");
      const handle =
        input.newContact.handle ??
        (url
          ? { channel: channelForUrl(url) ?? input.channel, url }
          : undefined);
      const contact = await createContact(
        tx,
        { ...input.newContact, handle },
        userId,
      );
      contactId = contact.id;
    } else {
      const [contact] = await tx
        .select({ id: DiscoveryContactsTable.id })
        .from(DiscoveryContactsTable)
        .where(eq(DiscoveryContactsTable.id, contactId));
      if (!contact) notFound("contact");
      // A profile link shared for an existing contact becomes one of its handles.
      if (url && handleForUrl(url)) {
        await insertHandle(tx, contactId, {
          channel: channelForUrl(url) ?? input.channel,
          url,
        });
      }
    }

    const occurredAt = input.occurredAt
      ? new Date(input.occurredAt)
      : new Date();
    const replied =
      input.replied || Boolean(input.replyText) || Boolean(input.repliedAt);
    const [row] = await tx
      .insert(DiscoveryTouchpointsTable)
      .values({
        studyId: input.studyId,
        contactId,
        channel: input.channel,
        format: input.format,
        direction: input.direction,
        persona: input.persona,
        templateId: input.templateId ?? null,
        url,
        message: input.message || null,
        replyText: input.replyText || null,
        occurredAt,
        repliedAt:
          input.direction === "outbound" && replied
            ? (toDate(input.repliedAt) ??
              new Date(Math.max(Date.now(), occurredAt.getTime())))
            : null,
        source: input.source,
        attachments: input.attachments,
        createdBy: userId,
      })
      .returning();

    // An inbound message answers the latest unanswered outbound one.
    if (input.direction === "inbound") {
      const [open] = await tx
        .select({ id: DiscoveryTouchpointsTable.id })
        .from(DiscoveryTouchpointsTable)
        .where(
          and(
            eq(DiscoveryTouchpointsTable.contactId, contactId),
            eq(DiscoveryTouchpointsTable.studyId, input.studyId),
            eq(DiscoveryTouchpointsTable.direction, "outbound"),
            isNull(DiscoveryTouchpointsTable.repliedAt),
            isNull(DiscoveryTouchpointsTable.removedAt),
          ),
        )
        .orderBy(desc(DiscoveryTouchpointsTable.occurredAt))
        .limit(1);
      if (open) {
        await tx
          .update(DiscoveryTouchpointsTable)
          .set({ repliedAt: occurredAt })
          .where(eq(DiscoveryTouchpointsTable.id, open.id));
      }
    }
    return row;
  });
}

export async function markReplied(
  db: Db,
  input: { id: string; repliedAt?: string; replyText?: string },
) {
  const [row] = await db
    .update(DiscoveryTouchpointsTable)
    .set({
      repliedAt: toDate(input.repliedAt) ?? new Date(),
      ...(input.replyText ? { replyText: input.replyText } : {}),
    })
    .where(
      and(
        eq(DiscoveryTouchpointsTable.id, input.id),
        eq(DiscoveryTouchpointsTable.direction, "outbound"),
        isNull(DiscoveryTouchpointsTable.removedAt),
      ),
    )
    .returning();
  return row ?? notFound("touchpoint");
}

/**
 * Undoes the "replied" mark a removed inbound row put on an outbound one
 * (same contact and study, `repliedAt` equal to the inbound's `occurredAt`,
 * no captured reply text). If another live inbound row came after that
 * outbound message, it becomes the reply instead, so a real later answer —
 * or a second inbound logged at the same minute — is not lost.
 */
async function undoInboundReply(
  tx: Tx,
  inbound: { studyId: string; contactId: string; occurredAt: Date },
) {
  const sameThread = and(
    eq(DiscoveryTouchpointsTable.studyId, inbound.studyId),
    eq(DiscoveryTouchpointsTable.contactId, inbound.contactId),
    isNull(DiscoveryTouchpointsTable.removedAt),
  );
  const cleared = await tx
    .update(DiscoveryTouchpointsTable)
    .set({ repliedAt: null })
    .where(
      and(
        sameThread,
        eq(DiscoveryTouchpointsTable.direction, "outbound"),
        eq(DiscoveryTouchpointsTable.repliedAt, inbound.occurredAt),
        isNull(DiscoveryTouchpointsTable.replyText),
      ),
    )
    .returning({
      id: DiscoveryTouchpointsTable.id,
      occurredAt: DiscoveryTouchpointsTable.occurredAt,
    });

  const unmarkedReplyIds: string[] = [];
  const rematchedReplyIds: string[] = [];
  for (const outbound of cleared) {
    const [next] = await tx
      .select({ occurredAt: DiscoveryTouchpointsTable.occurredAt })
      .from(DiscoveryTouchpointsTable)
      .where(
        and(
          sameThread,
          eq(DiscoveryTouchpointsTable.direction, "inbound"),
          gte(DiscoveryTouchpointsTable.occurredAt, outbound.occurredAt),
        ),
      )
      .orderBy(asc(DiscoveryTouchpointsTable.occurredAt))
      .limit(1);
    if (!next) {
      unmarkedReplyIds.push(outbound.id);
      continue;
    }
    await tx
      .update(DiscoveryTouchpointsTable)
      .set({ repliedAt: next.occurredAt })
      .where(eq(DiscoveryTouchpointsTable.id, outbound.id));
    rematchedReplyIds.push(outbound.id);
  }
  return { unmarkedReplyIds, rematchedReplyIds };
}

/**
 * Soft-removes a touchpoint logged by mistake, with the reason, so it stops
 * counting in the readout, reply stats and lists but stays auditable.
 *
 * - Evidence linked to it is kept (the quote may still be real) and returned,
 *   so the operator can delete it separately if it came from the same mistake.
 * - Removing an inbound row undoes the "replied" mark it set, moving it to a
 *   later live inbound row when there is one (see `undoInboundReply`).
 * - `contactStillInStudy` is false when this was the contact's last live
 *   touchpoint in the study: their evidence and commitments still count, so
 *   the operator should review those too.
 */
export async function removeTouchpoint(
  db: Db,
  input: RemoveTouchpointInput,
  userId: string,
) {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select({
        id: DiscoveryTouchpointsTable.id,
        studyId: DiscoveryTouchpointsTable.studyId,
        contactId: DiscoveryTouchpointsTable.contactId,
        direction: DiscoveryTouchpointsTable.direction,
        occurredAt: DiscoveryTouchpointsTable.occurredAt,
        removedAt: DiscoveryTouchpointsTable.removedAt,
      })
      .from(DiscoveryTouchpointsTable)
      .where(eq(DiscoveryTouchpointsTable.id, input.id))
      .for("update");
    if (!current) notFound("touchpoint");
    if (current.removedAt) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "touchpoint_already_removed",
      });
    }

    const [row] = await tx
      .update(DiscoveryTouchpointsTable)
      .set({
        removedAt: new Date(),
        removedBy: userId,
        removedReason: input.reason,
      })
      .where(eq(DiscoveryTouchpointsTable.id, input.id))
      .returning({
        id: DiscoveryTouchpointsTable.id,
        studyId: DiscoveryTouchpointsTable.studyId,
        contactId: DiscoveryTouchpointsTable.contactId,
        removedAt: DiscoveryTouchpointsTable.removedAt,
        removedReason: DiscoveryTouchpointsTable.removedReason,
      });
    if (!row) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const replies =
      current.direction === "inbound"
        ? await undoInboundReply(tx, current)
        : { unmarkedReplyIds: [], rematchedReplyIds: [] };

    const linkedEvidence = await tx
      .select({
        id: DiscoveryEvidenceTable.id,
        kind: DiscoveryEvidenceTable.kind,
      })
      .from(DiscoveryEvidenceTable)
      .where(eq(DiscoveryEvidenceTable.touchpointId, input.id));
    const [remaining] = await tx
      .select({ id: DiscoveryTouchpointsTable.id })
      .from(DiscoveryTouchpointsTable)
      .where(
        and(
          eq(DiscoveryTouchpointsTable.studyId, current.studyId),
          eq(DiscoveryTouchpointsTable.contactId, current.contactId),
          isNull(DiscoveryTouchpointsTable.removedAt),
        ),
      )
      .limit(1);

    return {
      ...row,
      ...replies,
      linkedEvidence,
      contactStillInStudy: Boolean(remaining),
    };
  });
}

// ─── Evidence and commitments ──────────────────────────────────────────────

/**
 * Evidence and money signals only count for a contact who was actually in
 * touch within that study; otherwise a stray id would skew the go/kill
 * readout. A given touchpoint must belong to the same study and contact.
 */
async function assertContactInStudy(
  db: Exec,
  input: { studyId: string; contactId: string; touchpointId?: string },
) {
  const [match] = await db
    .select({ id: DiscoveryTouchpointsTable.id })
    .from(DiscoveryTouchpointsTable)
    .where(
      and(
        eq(DiscoveryTouchpointsTable.studyId, input.studyId),
        eq(DiscoveryTouchpointsTable.contactId, input.contactId),
        isNull(DiscoveryTouchpointsTable.removedAt),
        input.touchpointId
          ? eq(DiscoveryTouchpointsTable.id, input.touchpointId)
          : undefined,
      ),
    )
    .limit(1);
  if (!match) notFound(input.touchpointId ? "touchpoint" : "contact_in_study");
}

export async function addEvidence(
  db: Db,
  input: AddEvidenceInput,
  userId: string,
) {
  return db.transaction(async (tx) => {
    await assertContactInStudy(tx, input);
    const hypothesisIds = input.hypotheses.map((h) => h.hypothesisId);
    if (hypothesisIds.length) {
      const valid = await tx
        .select({ id: DiscoveryHypothesesTable.id })
        .from(DiscoveryHypothesesTable)
        .where(
          and(
            inArray(DiscoveryHypothesesTable.id, hypothesisIds),
            eq(DiscoveryHypothesesTable.studyId, input.studyId),
          ),
        );
      if (valid.length !== new Set(hypothesisIds).size) notFound("hypothesis");
    }
    const [row] = await tx
      .insert(DiscoveryEvidenceTable)
      .values({
        studyId: input.studyId,
        contactId: input.contactId,
        touchpointId: input.touchpointId ?? null,
        kind: input.kind,
        quote: input.quote,
        note: input.note || null,
        amountEgp: input.amountEgp ?? null,
        createdBy: userId,
      })
      .returning();
    if (!row) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    if (input.hypotheses.length) {
      await tx
        .insert(DiscoveryEvidenceHypothesesTable)
        .values(input.hypotheses.map((h) => ({ ...h, evidenceId: row.id })))
        .onConflictDoNothing();
    }
    return row;
  });
}

export async function deleteEvidence(db: Db, id: string) {
  const [row] = await db
    .delete(DiscoveryEvidenceTable)
    .where(eq(DiscoveryEvidenceTable.id, id))
    .returning({ id: DiscoveryEvidenceTable.id });
  return row ?? notFound("evidence");
}

export async function logCommitment(
  db: Db,
  input: LogCommitmentInput,
  userId: string,
) {
  await assertContactInStudy(db, input);
  const [row] = await db
    .insert(DiscoveryCommitmentsTable)
    .values({
      ...input,
      priceQuoted: input.priceQuoted || null,
      note: input.note || null,
      createdBy: userId,
    })
    .returning();
  return row;
}

export async function setCommitmentStatus(
  db: Db,
  id: string,
  status: LogCommitmentInput["status"],
) {
  const [row] = await db
    .update(DiscoveryCommitmentsTable)
    .set({ status })
    .where(eq(DiscoveryCommitmentsTable.id, id))
    .returning();
  return row ?? notFound("commitment");
}

// ─── Templates ──────────────────────────────────────────────────────────────

export async function listTemplates(
  db: Db,
  input: { studyId?: string; includeInactive: boolean },
) {
  return db
    .select()
    .from(DiscoveryTemplatesTable)
    .where(
      and(
        input.studyId
          ? or(
              eq(DiscoveryTemplatesTable.studyId, input.studyId),
              isNull(DiscoveryTemplatesTable.studyId),
            )
          : undefined,
        input.includeInactive
          ? undefined
          : eq(DiscoveryTemplatesTable.active, true),
      ),
    )
    .orderBy(
      asc(DiscoveryTemplatesTable.step),
      asc(DiscoveryTemplatesTable.title),
    );
}

export async function createTemplate(db: Db, input: TemplateInput) {
  const [row] = await db
    .insert(DiscoveryTemplatesTable)
    .values({ ...input, studyId: input.studyId ?? null })
    .returning();
  return row;
}

export async function updateTemplate(db: Db, input: UpdateTemplateInput) {
  const { id, ...patch } = input;
  const [row] = await db
    .update(DiscoveryTemplatesTable)
    .set(patch)
    .where(eq(DiscoveryTemplatesTable.id, id))
    .returning();
  return row ?? notFound("template");
}

/** Reply stats over every study, for the templates screen. */
export async function templateStats(db: Db) {
  const rows = await db
    .select({
      direction: DiscoveryTouchpointsTable.direction,
      templateId: DiscoveryTouchpointsTable.templateId,
      persona: DiscoveryTouchpointsTable.persona,
      channel: DiscoveryTouchpointsTable.channel,
      occurredAt: DiscoveryTouchpointsTable.occurredAt,
      repliedAt: DiscoveryTouchpointsTable.repliedAt,
    })
    .from(DiscoveryTouchpointsTable)
    .where(isNull(DiscoveryTouchpointsTable.removedAt));
  return replyStats(rows);
}
