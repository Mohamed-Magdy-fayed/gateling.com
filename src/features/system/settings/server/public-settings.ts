import { and, eq, inArray } from "drizzle-orm";
import { cacheTag } from "next/cache";

import { db } from "@/drizzle";
import { SettingsTable } from "@/drizzle/schema";
import { getGlobalTag } from "@/lib/data-cache";

import { SYSTEM_SETTING_CODE } from "../lib/system-settings-registry";

export function getPublicSettingsTag() {
  return getGlobalTag("settings");
}

export async function getPublicTrackingSettings() {
  "use cache";
  cacheTag(getPublicSettingsTag());

  const rows = await db.query.SettingsTable.findMany({
    where: and(
      inArray(SettingsTable.code, [
        SYSTEM_SETTING_CODE.FACEBOOK_PIXEL_ID,
        SYSTEM_SETTING_CODE.GA4_MEASUREMENT_ID,
      ]),
      eq(SettingsTable.isActive, true),
    ),
    columns: { code: true, value: true },
  });
  const pixelRaw =
    rows.find((row) => row.code === SYSTEM_SETTING_CODE.FACEBOOK_PIXEL_ID)
      ?.value ?? null;
  const ga4Raw =
    rows.find((row) => row.code === SYSTEM_SETTING_CODE.GA4_MEASUREMENT_ID)
      ?.value ?? null;
  return {
    facebookPixelId: pixelRaw && /^\d+$/.test(pixelRaw) ? pixelRaw : null,
    ga4MeasurementId: ga4Raw && /^G-[A-Z0-9]+$/i.test(ga4Raw) ? ga4Raw : null,
  };
}

export async function getPublicChatSettings() {
  "use cache";
  cacheTag(getPublicSettingsTag());

  const numberRow = await db.query.SettingsTable.findFirst({
    where: eq(SettingsTable.code, SYSTEM_SETTING_CODE.WHATSAPP_NUMBER),
    columns: { value: true },
  });
  const whatsappNumber = numberRow?.value?.trim() || null;
  return {
    whatsappNumber:
      whatsappNumber && /^\+?\d{8,15}$/.test(whatsappNumber)
        ? whatsappNumber
        : null,
  };
}
