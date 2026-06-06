import { and, eq } from "drizzle-orm";

import { SettingsTable } from "@/drizzle/schema";
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/integrations/trpc/init";

import { SYSTEM_SETTING_CODE } from "../lib/system-settings-registry";
import {
  bulkSetSettingsActive,
  setSettingActive,
  updateSetting,
} from "./mutations";
import { listSettings } from "./queries";
import {
  listSettingsInput,
  settingBulkSetActiveSchema,
  settingSetActiveSchema,
  settingUpdateSchema,
} from "./schemas";

export const settingsRouter = createTRPCRouter({
  getPublicValues: baseProcedure.query(async ({ ctx }) => {
    const row = await ctx.db.query.SettingsTable.findFirst({
      where: and(
        eq(SettingsTable.code, SYSTEM_SETTING_CODE.FACEBOOK_PIXEL_ID),
        eq(SettingsTable.isActive, true),
      ),
      columns: { value: true },
    });
    const raw = row?.value ?? null;
    return { facebookPixelId: raw && /^\d+$/.test(raw) ? raw : null };
  }),

  list: protectedProcedure
    .input(listSettingsInput)
    .query(async ({ ctx, input }) => listSettings(ctx, input)),
  update: protectedProcedure
    .input(settingUpdateSchema)
    .mutation(async ({ ctx, input }) => updateSetting(ctx, input)),
  setActive: protectedProcedure
    .input(settingSetActiveSchema)
    .mutation(async ({ ctx, input }) => setSettingActive(ctx, input)),
  bulkSetActive: protectedProcedure
    .input(settingBulkSetActiveSchema)
    .mutation(async ({ ctx, input }) => bulkSetSettingsActive(ctx, input)),
});
