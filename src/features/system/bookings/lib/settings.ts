import { inArray } from "drizzle-orm";

import type { db } from "@/drizzle";
import { SettingsTable } from "@/drizzle/schema";
import {
  DEFAULT_BOOKING_MAX_DAYS_AHEAD,
  DEFAULT_BOOKING_MIN_NOTICE_HOURS,
  DEFAULT_BOOKING_SLOT_MINUTES,
  DEFAULT_BOOKING_WINDOW_END,
  DEFAULT_BOOKING_WINDOW_START,
  DEFAULT_BUSINESS_TIMEZONE,
  SYSTEM_SETTING_CODE,
} from "@/features/system/settings/lib/system-settings-registry";

export type BookingSettings = {
  enabled: boolean;
  windowStart: string;
  windowEnd: string;
  slotMinutes: number;
  minNoticeHours: number;
  maxDaysAhead: number;
  meetingLink: string | null;
  timezone: string;
};

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function getBookingSettings(
  database: Pick<typeof db, "select">,
): Promise<BookingSettings> {
  const codes = [
    SYSTEM_SETTING_CODE.BOOKING_ENABLED,
    SYSTEM_SETTING_CODE.BOOKING_WINDOW_START,
    SYSTEM_SETTING_CODE.BOOKING_WINDOW_END,
    SYSTEM_SETTING_CODE.BOOKING_SLOT_MINUTES,
    SYSTEM_SETTING_CODE.BOOKING_MIN_NOTICE_HOURS,
    SYSTEM_SETTING_CODE.BOOKING_MAX_DAYS_AHEAD,
    SYSTEM_SETTING_CODE.BOOKING_MEETING_LINK,
    SYSTEM_SETTING_CODE.BUSINESS_TIMEZONE,
  ];
  const rows = await database
    .select({
      code: SettingsTable.code,
      isActive: SettingsTable.isActive,
      value: SettingsTable.value,
      amount: SettingsTable.amount,
    })
    .from(SettingsTable)
    .where(inArray(SettingsTable.code, codes));

  const byCode = new Map(rows.map((row) => [row.code, row]));
  const timeValue = (code: string, fallback: string) => {
    const raw = byCode.get(code)?.value?.trim() ?? "";
    return TIME_RE.test(raw) ? raw : fallback;
  };
  const amountValue = (code: string, fallback: number) => {
    const raw = byCode.get(code)?.amount;
    return raw != null && raw > 0 ? raw : fallback;
  };

  const meetingLinkRow = byCode.get(SYSTEM_SETTING_CODE.BOOKING_MEETING_LINK);
  return {
    enabled: byCode.get(SYSTEM_SETTING_CODE.BOOKING_ENABLED)?.isActive === true,
    windowStart: timeValue(
      SYSTEM_SETTING_CODE.BOOKING_WINDOW_START,
      DEFAULT_BOOKING_WINDOW_START,
    ),
    windowEnd: timeValue(
      SYSTEM_SETTING_CODE.BOOKING_WINDOW_END,
      DEFAULT_BOOKING_WINDOW_END,
    ),
    slotMinutes: amountValue(
      SYSTEM_SETTING_CODE.BOOKING_SLOT_MINUTES,
      DEFAULT_BOOKING_SLOT_MINUTES,
    ),
    minNoticeHours: amountValue(
      SYSTEM_SETTING_CODE.BOOKING_MIN_NOTICE_HOURS,
      DEFAULT_BOOKING_MIN_NOTICE_HOURS,
    ),
    maxDaysAhead: amountValue(
      SYSTEM_SETTING_CODE.BOOKING_MAX_DAYS_AHEAD,
      DEFAULT_BOOKING_MAX_DAYS_AHEAD,
    ),
    meetingLink:
      meetingLinkRow?.isActive === true
        ? (meetingLinkRow.value?.trim() ?? null) || null
        : null,
    timezone:
      byCode.get(SYSTEM_SETTING_CODE.BUSINESS_TIMEZONE)?.value?.trim() ||
      DEFAULT_BUSINESS_TIMEZONE,
  };
}
