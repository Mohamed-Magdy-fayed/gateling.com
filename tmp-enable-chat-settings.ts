import { eq } from "drizzle-orm";
import { db } from "@/drizzle";
import { SettingsTable } from "@/drizzle/schema";
import { SYSTEM_SETTING_CODE } from "@/features/system/settings/lib/system-settings-registry";

async function set(code: string, patch: Partial<typeof SettingsTable.$inferInsert>) {
  await db.update(SettingsTable).set(patch).where(eq(SettingsTable.code, code));
}

async function main() {
  await set(SYSTEM_SETTING_CODE.CHAT_WIDGET_ENABLED, { isActive: true });
  await set(SYSTEM_SETTING_CODE.WAPILOT_WEBHOOK_SECRET, {
    isActive: true,
    value: "test-secret-123",
  });
  await set(SYSTEM_SETTING_CODE.WAPILOT_INSTANCE_ID, {
    isActive: true,
    value: "dummy-instance",
  });
  await set(SYSTEM_SETTING_CODE.WAPILOT_API_TOKEN, {
    isActive: true,
    value: "dummy-token",
  });
  const rows = await db.query.SettingsTable.findMany({
    columns: { code: true, isActive: true, value: true },
  });
  console.log(rows.filter((r) => Number(r.code) >= 13 || r.code === "00002"));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
