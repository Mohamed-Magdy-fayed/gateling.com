import { describe, expect, test } from "vitest";

import { SYSTEM_SETTING_CODE } from "@/features/system/settings/lib/system-settings-registry";

import {
  isMeetingsConfigured,
  meetingsConfigFromRows,
  resolveMeetingsClient,
  resolveMeetingsConfig,
  resolveMeetingsWebhookSecret,
} from "./config";

type Row = { code: string; value: string | null };

/** Just enough of `db.select().from().where()` to hand back canned rows. */
function fakeDb(rows: Row[]): Parameters<typeof resolveMeetingsConfig>[0] {
  return {
    select: () => ({
      from: () => ({
        where: async () => rows,
      }),
    }),
  } as unknown as Parameters<typeof resolveMeetingsConfig>[0];
}

const URL_ROW: Row = {
  code: SYSTEM_SETTING_CODE.MEETINGS_API_URL,
  value: "https://meetings.gateling.com",
};
const KEY_ROW: Row = {
  code: SYSTEM_SETTING_CODE.MEETINGS_API_KEY,
  value: "gm_live_abc",
};
const SECRET_ROW: Row = {
  code: SYSTEM_SETTING_CODE.MEETINGS_WEBHOOK_SECRET,
  value: "whsec_xyz",
};

describe("meetingsConfigFromRows", () => {
  test("is null until both the URL and the key are set — never a half-config", () => {
    expect(meetingsConfigFromRows([])).toBeNull();
    expect(meetingsConfigFromRows([URL_ROW])).toBeNull();
    expect(meetingsConfigFromRows([KEY_ROW])).toBeNull();
    expect(meetingsConfigFromRows([URL_ROW, SECRET_ROW])).toBeNull();
    expect(
      meetingsConfigFromRows([URL_ROW, { ...KEY_ROW, value: "   " }]),
    ).toBeNull();
    expect(
      meetingsConfigFromRows([{ ...URL_ROW, value: null }, KEY_ROW]),
    ).toBeNull();
  });

  test("the webhook secret is optional and reported separately", () => {
    expect(meetingsConfigFromRows([URL_ROW, KEY_ROW])).toEqual({
      apiUrl: "https://meetings.gateling.com",
      apiKey: "gm_live_abc",
      webhookSecret: null,
    });
    expect(meetingsConfigFromRows([URL_ROW, KEY_ROW, SECRET_ROW])).toEqual({
      apiUrl: "https://meetings.gateling.com",
      apiKey: "gm_live_abc",
      webhookSecret: "whsec_xyz",
    });
  });

  test("values are trimmed as pasted", () => {
    expect(
      meetingsConfigFromRows([
        { ...URL_ROW, value: " https://meetings.gateling.com \n" },
        { ...KEY_ROW, value: "\tgm_live_abc " },
      ]),
    ).toEqual({
      apiUrl: "https://meetings.gateling.com",
      apiKey: "gm_live_abc",
      webhookSecret: null,
    });
  });
});

describe("settings-backed resolvers", () => {
  test("resolveMeetingsConfig / isMeetingsConfigured follow the rows", async () => {
    expect(await resolveMeetingsConfig(fakeDb([URL_ROW]))).toBeNull();
    expect(await isMeetingsConfigured(fakeDb([URL_ROW]))).toBe(false);
    expect(await isMeetingsConfigured(fakeDb([URL_ROW, KEY_ROW]))).toBe(true);
  });

  test("resolveMeetingsClient is null when unset, memoised per URL+key, fresh on rotation", async () => {
    expect(await resolveMeetingsClient(fakeDb([URL_ROW]))).toBeNull();

    const first = await resolveMeetingsClient(fakeDb([URL_ROW, KEY_ROW]));
    const again = await resolveMeetingsClient(fakeDb([URL_ROW, KEY_ROW]));
    expect(first).not.toBeNull();
    expect(again).toBe(first);

    const rotated = await resolveMeetingsClient(
      fakeDb([URL_ROW, { ...KEY_ROW, value: "gm_live_rotated" }]),
    );
    expect(rotated).not.toBeNull();
    expect(rotated).not.toBe(first);
  });

  test("resolveMeetingsWebhookSecret is undefined until pasted", async () => {
    expect(await resolveMeetingsWebhookSecret(fakeDb([]))).toBeUndefined();
    expect(
      await resolveMeetingsWebhookSecret(
        fakeDb([{ ...SECRET_ROW, value: "" }]),
      ),
    ).toBeUndefined();
    expect(await resolveMeetingsWebhookSecret(fakeDb([SECRET_ROW]))).toBe(
      "whsec_xyz",
    );
  });
});
