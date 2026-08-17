import "server-only";

import { inArray } from "drizzle-orm";

import type { db } from "@/drizzle";
import { SettingsTable } from "@/drizzle/schema";
import { DEFAULT_TODAY_RULES_CONFIG } from "@/features/system/sales/lib/today-rules";
import {
  DEFAULT_BUSINESS_TIMEZONE,
  SYSTEM_SETTING_CODE,
} from "@/features/system/settings/lib/system-settings-registry";

export type SalesSettings = {
  /** IANA zone used for the calling-window advice. */
  timeZone: string;
  /** Daily ceiling on the new-dial queue. */
  newQueueCap: number;
};

/**
 * Both values are editable from `/settings` so the daily cap can be tuned
 * without a deploy — the number that makes the list get worked instead of
 * ignored is a matter of taste, and it will change.
 */
export async function getSalesSettings(
  database: Pick<typeof db, "select">,
): Promise<SalesSettings> {
  const rows = await database
    .select({
      code: SettingsTable.code,
      value: SettingsTable.value,
      amount: SettingsTable.amount,
    })
    .from(SettingsTable)
    .where(
      inArray(SettingsTable.code, [
        SYSTEM_SETTING_CODE.BUSINESS_TIMEZONE,
        SYSTEM_SETTING_CODE.SALES_DAILY_NEW_QUEUE_CAP,
      ]),
    );

  const byCode = new Map(rows.map((row) => [row.code, row]));

  const cap = byCode.get(SYSTEM_SETTING_CODE.SALES_DAILY_NEW_QUEUE_CAP)?.amount;

  return {
    timeZone:
      byCode.get(SYSTEM_SETTING_CODE.BUSINESS_TIMEZONE)?.value?.trim() ||
      DEFAULT_BUSINESS_TIMEZONE,
    newQueueCap:
      cap != null && cap > 0 ? cap : DEFAULT_TODAY_RULES_CONFIG.newQueueCap,
  };
}
