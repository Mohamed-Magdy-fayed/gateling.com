import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

import {
  type LeadPipelineStatus,
  LeadsTable,
  type LeadTier,
  leadPipelineStatusValues,
  leadTierValues,
  type WhatsappStatus,
  whatsappStatusValues,
} from "@/drizzle/schema";
import {
  isDateRangeValue,
  isNumberRangeValue,
  parseLocalDateEnd,
  parseLocalDateStart,
} from "@/features/core/data-table/lib/filter-values";

import type { PipelineFilterInput } from "./schemas";

/**
 * Pipeline grid filters and sorting, server side. Column ids match the
 * client's column ids, so the URL state the table writes is exactly what this
 * reads. Unknown filter ids and sort ids are ignored, never interpolated.
 */

/** Faceted value meaning "no tier set" (`tier is null`). */
export const UNTIERED = "untiered";

function sanitizeLikeFragment(raw: string): string {
  return raw.trim().replace(/[%_\\]/g, "");
}

/** A range boundary as a Date, or null when it does not parse. */
function parseRangeBoundary(
  raw: string,
  mode: "start" | "end",
): Date | null {
  const trimmed = raw.trim();
  const date = trimmed.includes("T")
    ? new Date(trimmed)
    : mode === "start"
      ? parseLocalDateStart(trimmed)
      : parseLocalDateEnd(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** More values than any facet has; anything beyond is dropped, not bound. */
const MAX_FACET_VALUES = 50;

/** A faceted filter value as a string list (the kit stores arrays). */
function toValueList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return [...new Set(raw.slice(0, MAX_FACET_VALUES).map(String))];
  }
  if (raw != null && raw !== "") return [String(raw)];
  return [];
}

function pickAllowed<T extends string>(
  raw: unknown,
  allowed: readonly T[],
): T[] {
  return toValueList(raw).filter((v): v is T =>
    (allowed as readonly string[]).includes(v),
  );
}

function pushDateRange(conditions: SQL[], column: PgColumn, value: unknown) {
  if (!isDateRangeValue(value)) return;
  const from = value.from?.trim() ? parseRangeBoundary(value.from, "start") : null;
  const to = value.to?.trim() ? parseRangeBoundary(value.to, "end") : null;
  if (from) conditions.push(gte(column, from));
  if (to) conditions.push(lte(column, to));
}

function pushTextFilter(conditions: SQL[], column: PgColumn, value: unknown) {
  if (typeof value !== "string") return;
  const s = sanitizeLikeFragment(value);
  if (s) conditions.push(ilike(column, `%${s}%`));
}

function applyColumnFilter(
  conditions: SQL[],
  filter: { id: string; value: unknown },
) {
  const { id, value } = filter;
  switch (id) {
    case "pipelineStatus": {
      const statuses = pickAllowed<LeadPipelineStatus>(
        value,
        leadPipelineStatusValues,
      );
      if (statuses.length) {
        conditions.push(inArray(LeadsTable.pipelineStatus, statuses));
      }
      return;
    }
    case "tier": {
      const values = toValueList(value);
      const tiers = pickAllowed<LeadTier>(values, leadTierValues);
      const parts: SQL[] = [];
      if (tiers.length) parts.push(inArray(LeadsTable.tier, tiers));
      if (values.includes(UNTIERED)) parts.push(isNull(LeadsTable.tier));
      const tierWhere = parts.length > 1 ? or(...parts) : parts[0];
      if (tierWhere) conditions.push(tierWhere);
      return;
    }
    case "whatsappStatus": {
      const statuses = pickAllowed<WhatsappStatus>(value, whatsappStatusValues);
      if (statuses.length) {
        conditions.push(inArray(LeadsTable.whatsappStatus, statuses));
      }
      return;
    }
    case "doNotContact": {
      // Both or neither selected means no constraint.
      const picked = pickAllowed(value, ["true", "false"] as const);
      if (picked.length === 1) {
        conditions.push(eq(LeadsTable.doNotContact, picked[0] === "true"));
      }
      return;
    }
    case "city":
      pushTextFilter(conditions, LeadsTable.city, value);
      return;
    case "businessType":
      pushTextFilter(conditions, LeadsTable.businessType, value);
      return;
    case "followUpCount": {
      if (!isNumberRangeValue(value)) return;
      if (Number.isFinite(value.min)) {
        conditions.push(gte(LeadsTable.followUpCount, value.min as number));
      }
      if (Number.isFinite(value.max)) {
        conditions.push(lte(LeadsTable.followUpCount, value.max as number));
      }
      return;
    }
    case "lastContactedAt":
      pushDateRange(conditions, LeadsTable.lastContactedAt, value);
      return;
    case "nextActionAt":
      pushDateRange(conditions, LeadsTable.nextActionAt, value);
      return;
    case "createdAt":
      pushDateRange(conditions, LeadsTable.createdAt, value);
      return;
  }
}

/** Where clause for the pipeline grid: always prospects only. */
export function buildPipelineWhere(input: PipelineFilterInput): SQL {
  const conditions: SQL[] = [eq(LeadsTable.kind, "prospect")];

  const search = input.globalFilter
    ? sanitizeLikeFragment(input.globalFilter)
    : "";
  if (search) {
    const q = `%${search}%`;
    const searchWhere = or(
      ilike(LeadsTable.name, q),
      ilike(LeadsTable.nameAr, q),
      ilike(LeadsTable.phone, q),
      ilike(LeadsTable.phoneSecondary, q),
      ilike(LeadsTable.city, q),
      ilike(LeadsTable.area, q),
      ilike(LeadsTable.whatsappProfileName, q),
    );
    if (searchWhere) conditions.push(searchWhere);
  }

  for (const filter of input.columnFilters) {
    applyColumnFilter(conditions, filter);
  }

  // `and` of at least one condition is never undefined.
  return and(...conditions) as SQL;
}

/** Sortable column id → column. Anything else falls back to the default. */
const SORTABLE: Record<string, PgColumn> = {
  name: LeadsTable.name,
  tier: LeadsTable.tier,
  pipelineStatus: LeadsTable.pipelineStatus,
  city: LeadsTable.city,
  businessType: LeadsTable.businessType,
  followUpCount: LeadsTable.followUpCount,
  socialFollowers: LeadsTable.socialFollowers,
  lastContactedAt: LeadsTable.lastContactedAt,
  nextActionAt: LeadsTable.nextActionAt,
  createdAt: LeadsTable.createdAt,
};

/** Columns where an empty value means "unknown", so it sorts last both ways. */
const NULLS_LAST = new Set([
  "socialFollowers",
  "lastContactedAt",
  "nextActionAt",
]);

/**
 * Order for the pipeline grid. Defaults to newest first: new batches are
 * worked from the top of `/sales/leads`. `id` breaks ties so paging is stable.
 */
export function pipelineSortExpr(
  sorting: { id: string; desc: boolean }[],
): SQL[] {
  const tieBreak = asc(LeadsTable.id);
  const sort = sorting[0];
  // Own keys only: "constructor" or "__proto__" must not reach the prototype.
  const column =
    sort && Object.hasOwn(SORTABLE, sort.id) ? SORTABLE[sort.id] : undefined;
  if (!sort || !column) return [desc(LeadsTable.createdAt), tieBreak];

  if (NULLS_LAST.has(sort.id)) {
    const direction = sort.desc ? sql`desc` : sql`asc`;
    return [sql`${column} ${direction} nulls last`, tieBreak];
  }
  return [sort.desc ? desc(column) : asc(column), tieBreak];
}
