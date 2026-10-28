import "server-only";

import { and, asc, desc, eq, max, ne } from "drizzle-orm";

import type { db as database } from "@/drizzle";
import {
  type LeadLocation,
  LeadLocationsTable,
  LeadsTable,
} from "@/drizzle/schema";
import { parseMapsEmbed } from "@/features/system/sales/lib/maps-embed";

import { SalesError } from "./errors";
import type { Executor } from "./recompute";
import type { AddLocationInput, UpdateLocationInput } from "./schemas";

/**
 * A prospect's Google Maps locations. Invariant this module keeps: a lead with
 * any location has exactly one primary (the partial unique index enforces
 * "at most one"; adding the first location and the remove rule enforce "at
 * least one").
 */

type Db = typeof database;

/** Main location first, then branches in the order they were added. */
export async function listLocations(
  db: Executor,
  leadId: string,
): Promise<LeadLocation[]> {
  return db
    .select()
    .from(LeadLocationsTable)
    .where(eq(LeadLocationsTable.leadId, leadId))
    .orderBy(
      desc(LeadLocationsTable.isPrimary),
      asc(LeadLocationsTable.sortOrder),
      asc(LeadLocationsTable.createdAt),
    );
}

/** The embed columns for a pasted embed: undefined leaves them, null clears. */
function embedColumns(embed: string | null | undefined) {
  if (embed === undefined) return {};
  const parsed = embed === null ? null : parseMapsEmbed(embed);
  return {
    embedSrc: parsed?.src ?? null,
    lat: parsed?.lat ?? null,
    lng: parsed?.lng ?? null,
  };
}

/** Typed Maps numbers are dated, like researched social numbers. */
function checkedAtFor(input: Partial<UpdateLocationInput>) {
  const touched =
    input.rating !== undefined ||
    input.reviewCount !== undefined ||
    input.category !== undefined;
  return touched ? { checkedAt: new Date() } : {};
}

async function assertProspect(tx: Executor, leadId: string): Promise<void> {
  const [lead] = await tx
    .select({ id: LeadsTable.id })
    .from(LeadsTable)
    .where(and(eq(LeadsTable.id, leadId), eq(LeadsTable.kind, "prospect")))
    .for("update");
  if (!lead) throw new SalesError("SALES_LEAD_NOT_PROSPECT", leadId);
}

async function selectLocation(tx: Executor, id: string) {
  const [location] = await tx
    .select()
    .from(LeadLocationsTable)
    .where(eq(LeadLocationsTable.id, id))
    .limit(1);
  if (!location) throw new SalesError("SALES_LOCATION_NOT_FOUND", id);
  return location;
}

async function findLocation(tx: Executor, id: string): Promise<LeadLocation> {
  const { leadId } = await selectLocation(tx, id);
  // Locks the lead row, so concurrent primary changes on one lead serialise.
  await assertProspect(tx, leadId);
  // Re-read under the lock: a primary change committed while we waited must
  // be seen, or removing a just-promoted location leaves the lead without one.
  return selectLocation(tx, id);
}

export async function addLocation(
  db: Db,
  input: AddLocationInput,
  actorId: string,
): Promise<{ id: string }> {
  return db.transaction(async (tx) => {
    await assertProspect(tx, input.leadId);

    const [{ last }] = await tx
      .select({ last: max(LeadLocationsTable.sortOrder) })
      .from(LeadLocationsTable)
      .where(eq(LeadLocationsTable.leadId, input.leadId));
    const isFirst = last === null;
    const isPrimary = isFirst || input.isPrimary;

    if (isPrimary && !isFirst) {
      await tx
        .update(LeadLocationsTable)
        .set({ isPrimary: false, updatedBy: actorId })
        .where(eq(LeadLocationsTable.leadId, input.leadId));
    }

    const { embed, isPrimary: _requested, ...fields } = input;
    const [row] = await tx
      .insert(LeadLocationsTable)
      .values({
        ...fields,
        ...embedColumns(embed),
        ...checkedAtFor(input),
        isPrimary,
        sortOrder: (last ?? -1) + 1,
        updatedBy: actorId,
      })
      .returning({ id: LeadLocationsTable.id });
    return row;
  });
}

export async function updateLocation(
  db: Db,
  input: UpdateLocationInput,
  actorId: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    await findLocation(tx, input.id);
    const { id, embed, ...fields } = input;
    await tx
      .update(LeadLocationsTable)
      .set({
        ...fields,
        ...embedColumns(embed),
        ...checkedAtFor(input),
        updatedBy: actorId,
      })
      .where(eq(LeadLocationsTable.id, id));
  });
}

/** The main location goes only when it is the last one; pick another main first. */
export async function removeLocation(db: Db, id: string): Promise<void> {
  await db.transaction(async (tx) => {
    const location = await findLocation(tx, id);
    if (location.isPrimary) {
      const [other] = await tx
        .select({ id: LeadLocationsTable.id })
        .from(LeadLocationsTable)
        .where(
          and(
            eq(LeadLocationsTable.leadId, location.leadId),
            ne(LeadLocationsTable.id, id),
          ),
        )
        .limit(1);
      if (other) throw new SalesError("SALES_PRIMARY_LOCATION_IN_USE", id);
    }
    await tx.delete(LeadLocationsTable).where(eq(LeadLocationsTable.id, id));
  });
}

export async function setPrimaryLocation(
  db: Db,
  id: string,
  actorId: string,
): Promise<void> {
  await db.transaction(async (tx) => {
    const location = await findLocation(tx, id);
    if (location.isPrimary) return;
    // Clear first: the partial unique index is checked per statement.
    await tx
      .update(LeadLocationsTable)
      .set({ isPrimary: false, updatedBy: actorId })
      .where(eq(LeadLocationsTable.leadId, location.leadId));
    await tx
      .update(LeadLocationsTable)
      .set({ isPrimary: true, updatedBy: actorId })
      .where(eq(LeadLocationsTable.id, id));
  });
}
