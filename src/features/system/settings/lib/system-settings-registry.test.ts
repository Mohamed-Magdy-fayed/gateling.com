import { describe, expect, test } from "vitest";

import {
  DEFAULT_MEETINGS_API_URL,
  getSystemSettingDefinition,
  isAllowedMeetingsApiUrl,
  isSecretSystemSetting,
  isSystemSettingCode,
  SECRET_SYSTEM_SETTING_CODES,
  SYSTEM_SETTING_CODE,
  SYSTEM_SETTING_CODES,
  SYSTEM_SETTINGS,
} from "./system-settings-registry";

/**
 * The registry is the contract between the settings table and the code that
 * reads it: a code that drifts, a secret that stops being one, or a URL rule
 * that loosens would each surface as a Meetings outage or a leaked credential
 * rather than a type error.
 */
describe("system settings registry", () => {
  test("every code is registered exactly once, in both directions", () => {
    expect(new Set(SYSTEM_SETTING_CODES).size).toBe(SYSTEM_SETTINGS.length);
    expect(new Set(SYSTEM_SETTINGS.map((d) => d.code)).size).toBe(
      SYSTEM_SETTINGS.length,
    );
    for (const code of Object.values(SYSTEM_SETTING_CODE)) {
      expect(isSystemSettingCode(code)).toBe(true);
      expect(getSystemSettingDefinition(code)).toBeDefined();
    }
  });

  test("an unknown code is refused, not guessed", () => {
    expect(isSystemSettingCode("99999")).toBe(false);
    expect(isSecretSystemSetting("99999")).toBe(false);
  });

  test("the Meetings and WaPilot credentials are secrets; nothing else is", () => {
    expect(SECRET_SYSTEM_SETTING_CODES.sort()).toEqual(
      [
        SYSTEM_SETTING_CODE.WAPILOT_API_TOKEN,
        SYSTEM_SETTING_CODE.WAPILOT_WEBHOOK_SECRET,
        SYSTEM_SETTING_CODE.MEETINGS_API_KEY,
        SYSTEM_SETTING_CODE.MEETINGS_WEBHOOK_SECRET,
      ].sort(),
    );
    expect(isSecretSystemSetting(SYSTEM_SETTING_CODE.MEETINGS_API_URL)).toBe(
      false,
    );
  });

  test("a fresh deployment points at the hosted Meetings, with no key or secret", () => {
    expect(
      getSystemSettingDefinition(SYSTEM_SETTING_CODE.MEETINGS_API_URL)?.seed,
    ).toEqual({ isActive: true, value: DEFAULT_MEETINGS_API_URL });
    expect(
      getSystemSettingDefinition(SYSTEM_SETTING_CODE.MEETINGS_API_KEY)?.seed
        .value,
    ).toBeNull();
    expect(
      getSystemSettingDefinition(SYSTEM_SETTING_CODE.MEETINGS_WEBHOOK_SECRET)
        ?.seed.value,
    ).toBeNull();
  });

  test("the Meetings rows are value-only: presence of the key is the switch", () => {
    for (const code of [
      SYSTEM_SETTING_CODE.MEETINGS_API_URL,
      SYSTEM_SETTING_CODE.MEETINGS_API_KEY,
      SYSTEM_SETTING_CODE.MEETINGS_WEBHOOK_SECRET,
    ]) {
      expect(getSystemSettingDefinition(code)?.editable).toEqual({
        value: true,
      });
      expect(getSystemSettingDefinition(code)?.label).toBe("integration");
    }
  });

  // The API key travels in a header to whatever this URL says, so a
  // plaintext host — other than the developer's own machine — must never be
  // accepted.
  test("the Meetings URL must be https, except on localhost", () => {
    const validate = getSystemSettingDefinition(
      SYSTEM_SETTING_CODE.MEETINGS_API_URL,
    )?.validateValue;
    expect(validate).toBe(isAllowedMeetingsApiUrl);

    expect(isAllowedMeetingsApiUrl("https://meetings.gateling.com")).toBe(true);
    expect(isAllowedMeetingsApiUrl("http://localhost:3001")).toBe(true);
    expect(isAllowedMeetingsApiUrl("http://127.0.0.1:3001/")).toBe(true);
    expect(isAllowedMeetingsApiUrl("http://meetings.gateling.com")).toBe(false);
    expect(isAllowedMeetingsApiUrl("http://localhost.evil.com")).toBe(false);
    expect(isAllowedMeetingsApiUrl("ftp://meetings.gateling.com")).toBe(false);
    expect(isAllowedMeetingsApiUrl("not a url")).toBe(false);
    expect(isAllowedMeetingsApiUrl("")).toBe(false);
  });
});
