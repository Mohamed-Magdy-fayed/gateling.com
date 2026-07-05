import { eq } from "drizzle-orm";

import { db } from "@/drizzle";
import { BookingsTable, SettingsTable } from "@/drizzle/schema";
import {
  DEFAULT_CONTACT_EMAIL,
  SYSTEM_SETTING_CODE,
} from "@/features/system/settings/lib/system-settings-registry";

export async function getContactEmail(): Promise<string> {
  const row = await db.query.SettingsTable.findFirst({
    where: eq(SettingsTable.code, SYSTEM_SETTING_CODE.CONTACT_EMAIL),
    columns: { value: true },
  });
  return row?.value?.trim() || DEFAULT_CONTACT_EMAIL;
}

export async function getBooking(bookingId: string) {
  return db.query.BookingsTable.findFirst({
    where: eq(BookingsTable.id, bookingId),
  });
}
