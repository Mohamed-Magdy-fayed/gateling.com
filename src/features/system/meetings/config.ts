import "server-only";

import { inArray } from "drizzle-orm";

import type { db as database } from "@/drizzle";
import { SettingsTable } from "@/drizzle/schema";
import { SYSTEM_SETTING_CODE } from "@/features/system/settings/lib/system-settings-registry";
import {
  createMeetingsClient,
  type MeetingsClient,
} from "@/integrations/meetings";

/**
 * The Gateling Meetings integration as configured in this deployment's
 * settings table — not the environment. An admin creates the integration on
 * Meetings' side, pastes the API key and webhook secret on `/settings`, and
 * rooms are provisioned from then on; nothing to redeploy.
 *
 * Read per call rather than cached: the settings rows are one indexed lookup,
 * and a key an admin just rotated must take effect on the next request, not
 * after a deploy. The block's own `getMeetingsClient()` (which reads
 * `process.env`) is deliberately not used here.
 */
export type MeetingsConfig = {
  apiUrl: string;
  apiKey: string;
  webhookSecret: string | null;
};

type Db = Pick<typeof database, "select">;

const CONFIG_CODES = [
  SYSTEM_SETTING_CODE.MEETINGS_API_URL,
  SYSTEM_SETTING_CODE.MEETINGS_API_KEY,
  SYSTEM_SETTING_CODE.MEETINGS_WEBHOOK_SECRET,
] as const;

type SettingValueRow = { code: string; value: string | null };

/**
 * Pure half of `resolveMeetingsConfig`, so the null-on-half-config rule can
 * be tested without a database. Null until both the URL and the key are set —
 * never a half-configuration. The webhook secret is reported separately:
 * without it rooms are still created, and the receiver answers 503 so
 * Meetings keeps retrying instead of the event being lost.
 */
export function meetingsConfigFromRows(
  rows: readonly SettingValueRow[],
): MeetingsConfig | null {
  const byCode = new Map(
    rows.map((row) => [row.code, row.value?.trim() || null]),
  );
  const apiUrl = byCode.get(SYSTEM_SETTING_CODE.MEETINGS_API_URL) ?? null;
  const apiKey = byCode.get(SYSTEM_SETTING_CODE.MEETINGS_API_KEY) ?? null;
  if (!apiUrl || !apiKey) return null;

  return {
    apiUrl,
    apiKey,
    webhookSecret:
      byCode.get(SYSTEM_SETTING_CODE.MEETINGS_WEBHOOK_SECRET) ?? null,
  };
}

async function readRows(db: Db): Promise<SettingValueRow[]> {
  return db
    .select({ code: SettingsTable.code, value: SettingsTable.value })
    .from(SettingsTable)
    .where(inArray(SettingsTable.code, [...CONFIG_CODES]));
}

export async function resolveMeetingsConfig(
  db: Db,
): Promise<MeetingsConfig | null> {
  return meetingsConfigFromRows(await readRows(db));
}

let cached: { key: string; client: MeetingsClient } | null = null;

/**
 * A client for the current settings, or null when Meetings isn't set up.
 * Memoised per URL+key so the (cheap) client isn't rebuilt per request while
 * a rotated key still produces a fresh one.
 */
export async function resolveMeetingsClient(
  db: Db,
): Promise<MeetingsClient | null> {
  const config = await resolveMeetingsConfig(db);
  if (!config) return null;

  const key = `${config.apiUrl}|${config.apiKey}`;
  if (cached?.key !== key) {
    cached = {
      key,
      client: createMeetingsClient({
        baseUrl: config.apiUrl,
        apiKey: config.apiKey,
      }),
    };
  }
  return cached.client;
}

/** Whether rooms can be provisioned and host links minted on this deployment. */
export async function isMeetingsConfigured(db: Db): Promise<boolean> {
  return (await resolveMeetingsConfig(db)) !== null;
}

/** The secret the webhook receiver verifies deliveries against, if any. */
export async function resolveMeetingsWebhookSecret(
  db: Db,
): Promise<string | undefined> {
  const rows = await db
    .select({ code: SettingsTable.code, value: SettingsTable.value })
    .from(SettingsTable)
    .where(
      inArray(SettingsTable.code, [
        SYSTEM_SETTING_CODE.MEETINGS_WEBHOOK_SECRET,
      ]),
    );
  return rows[0]?.value?.trim() || undefined;
}
