import "server-only";

import { eq } from "drizzle-orm";

import type { db as database } from "@/drizzle";
import { SettingsTable } from "@/drizzle/schema";
import {
  DEFAULT_CONTACT_EMAIL,
  SYSTEM_SETTING_CODE,
} from "@/features/system/settings/lib/system-settings-registry";
import type { ExternalUser } from "@/integrations/meetings";

/**
 * Every Meetings room this site creates — booked calls and sales demos — is
 * hosted by one fixed linked identity. Meetings only honours a host link whose
 * `externalId` matches the room's host, so a single identity is what lets any
 * staff member join any call as host. Owned here, not by either feature, so
 * the two cannot drift apart (ADR-0003).
 */
export const WEBSITE_MEETING_HOST_EXTERNAL_ID = "gateling-website";

export function websiteMeetingHost(contactEmail: string): ExternalUser {
  return {
    externalId: WEBSITE_MEETING_HOST_EXTERNAL_ID,
    name: "Gateling Solutions",
    email: contactEmail,
  };
}

type Db = Pick<typeof database, "query">;

/** The host identity with the current contact-email setting filled in. */
export async function getWebsiteMeetingHost(db: Db): Promise<ExternalUser> {
  const row = await db.query.SettingsTable.findFirst({
    where: eq(SettingsTable.code, SYSTEM_SETTING_CODE.CONTACT_EMAIL),
    columns: { value: true },
  });
  return websiteMeetingHost(row?.value?.trim() || DEFAULT_CONTACT_EMAIL);
}
