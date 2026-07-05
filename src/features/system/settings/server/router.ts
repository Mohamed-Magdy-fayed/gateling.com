import { and, eq, inArray } from "drizzle-orm";

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
    const rows = await ctx.db.query.SettingsTable.findMany({
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
      ga4MeasurementId:
        ga4Raw && /^G-[A-Z0-9]+$/i.test(ga4Raw) ? ga4Raw : null,
    };
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
