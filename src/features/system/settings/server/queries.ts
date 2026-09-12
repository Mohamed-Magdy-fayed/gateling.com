import {
  and,
  asc,
  count,
  desc,
  ilike,
  inArray,
  notInArray,
  or,
} from "drizzle-orm";

import type { db as database } from "@/drizzle";
import { SettingsTable } from "@/drizzle/schema";
import {
  isSecretSystemSetting,
  SECRET_SYSTEM_SETTING_CODES,
  SYSTEM_SETTING_CODES,
  SYSTEM_SETTINGS,
} from "@/features/system/settings/lib/system-settings-registry";

import type { ListSettingsInput } from "./schemas";
import {
  assertAdminRole,
  getRequiredSession,
  type TRPCContext,
} from "./shared";
import type { SettingGridRow } from "./types";

/** Whoever wrote a row that no human did — rows created lazily on first use. */
const SYSTEM_ACTOR = "system";

/**
 * Guarantees one row per registry code. Insert-or-ignore on the unique
 * `code`, so it is safe from a request path, a seed, and two of either at
 * once — the registry is the source of which rows should exist, the table
 * only the source of their values. Without this, a setting added to the
 * registry after a deployment was seeded would never appear in the grid.
 */
export async function ensureSystemSettingRows(
  db: Pick<typeof database, "insert">,
): Promise<void> {
  await db
    .insert(SettingsTable)
    .values(
      SYSTEM_SETTINGS.map((def) => ({
        code: def.code,
        label: def.label,
        description: def.descriptionEn,
        isActive: def.seed.isActive,
        value: def.seed.value ?? null,
        amount: def.seed.amount ?? null,
        createdBy: SYSTEM_ACTOR,
      })),
    )
    .onConflictDoNothing({ target: SettingsTable.code });
}

function buildWhereClause(input: ListSettingsInput) {
  const systemOnly = inArray(SettingsTable.code, [...SYSTEM_SETTING_CODES]);
  const query = input.globalFilter?.trim();

  if (!query) {
    return systemOnly;
  }

  // A secret's value is not searchable: matching on it would let an admin
  // read a credential back one substring at a time.
  const likeValue = `%${query}%`;
  return and(
    systemOnly,
    or(
      ilike(SettingsTable.code, likeValue),
      ilike(SettingsTable.description, likeValue),
      and(
        notInArray(SettingsTable.code, [...SECRET_SYSTEM_SETTING_CODES]),
        ilike(SettingsTable.value, likeValue),
      ),
    ),
  );
}

function sortExpr(input: ListSettingsInput) {
  const firstSort = input.sorting[0];

  if (!firstSort) {
    return [asc(SettingsTable.code)];
  }

  switch (firstSort.id) {
    case "label":
      return [
        firstSort.desc ? desc(SettingsTable.label) : asc(SettingsTable.label),
        asc(SettingsTable.code),
      ];
    case "amount":
      return [
        firstSort.desc ? desc(SettingsTable.amount) : asc(SettingsTable.amount),
        asc(SettingsTable.code),
      ];
    case "isActive":
      return [
        firstSort.desc
          ? desc(SettingsTable.isActive)
          : asc(SettingsTable.isActive),
        asc(SettingsTable.code),
      ];
    case "createdAt":
      return [
        firstSort.desc
          ? desc(SettingsTable.createdAt)
          : asc(SettingsTable.createdAt),
      ];
    case "updatedAt":
      return [
        firstSort.desc
          ? desc(SettingsTable.updatedAt)
          : asc(SettingsTable.updatedAt),
      ];
    case "code":
    default:
      return [
        firstSort.desc ? desc(SettingsTable.code) : asc(SettingsTable.code),
      ];
  }
}

const settingGridSelect = {
  id: SettingsTable.id,
  code: SettingsTable.code,
  label: SettingsTable.label,
  description: SettingsTable.description,
  isActive: SettingsTable.isActive,
  value: SettingsTable.value,
  amount: SettingsTable.amount,
  createdAt: SettingsTable.createdAt,
  updatedAt: SettingsTable.updatedAt,
} as const;

export async function listSettings(ctx: TRPCContext, input: ListSettingsInput) {
  const session = getRequiredSession(ctx);
  assertAdminRole(session.user.role);

  await ensureSystemSettingRows(ctx.db);

  const whereClause = buildWhereClause(input);
  const [{ value: total }] = await ctx.db
    .select({ value: count() })
    .from(SettingsTable)
    .where(whereClause);

  const pageCount = Math.max(1, Math.ceil(Number(total) / input.perPage));
  const page = Math.min(input.page, pageCount);
  const offset = (page - 1) * input.perPage;

  const rows = await ctx.db
    .select(settingGridSelect)
    .from(SettingsTable)
    .where(whereClause)
    .orderBy(...sortExpr(input))
    .limit(input.perPage)
    .offset(offset);

  return {
    rows: rows.map(toGridRow),
    pageCount,
    total: Number(total),
  };
}

/** Masks a secret's value before it leaves the server; everything else passes through. */
function toGridRow(
  row: Omit<SettingGridRow, "hasValue" | "isSecret">,
): SettingGridRow {
  const isSecret = isSecretSystemSetting(row.code);
  const hasValue = Boolean(row.value?.trim());
  return {
    ...row,
    value: isSecret ? null : row.value,
    hasValue,
    isSecret,
  };
}
