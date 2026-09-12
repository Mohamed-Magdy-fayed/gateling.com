import { describe, expect, it } from "vitest";

import { isAllowedMeetingsApiUrl, readMeetingsEnv } from "./index";

describe("readMeetingsEnv", () => {
  it("is null unless both url and key are present", () => {
    expect(readMeetingsEnv({})).toBeNull();
    expect(readMeetingsEnv({ MEETINGS_API_URL: "https://m.test" })).toBeNull();
    expect(readMeetingsEnv({ MEETINGS_API_KEY: "gm_live_x" })).toBeNull();
    expect(
      readMeetingsEnv({
        MEETINGS_API_URL: " https://m.test ",
        MEETINGS_API_KEY: "gm_live_x",
      }),
    ).toEqual({ apiUrl: "https://m.test", apiKey: "gm_live_x" });
  });

  it("refuses to send the key over plaintext to a non-local host", () => {
    expect(() =>
      readMeetingsEnv({
        MEETINGS_API_URL: "http://meetings.example.com",
        MEETINGS_API_KEY: "gm_live_x",
      }),
    ).toThrow(/https/);
  });
});

describe("isAllowedMeetingsApiUrl", () => {
  it("allows https anywhere and http on localhost only", () => {
    expect(isAllowedMeetingsApiUrl("https://meetings.gateling.com")).toBe(true);
    expect(isAllowedMeetingsApiUrl("http://localhost:3000")).toBe(true);
    expect(isAllowedMeetingsApiUrl("http://127.0.0.1:3000")).toBe(true);
    expect(isAllowedMeetingsApiUrl("http://meetings.gateling.com")).toBe(false);
    expect(isAllowedMeetingsApiUrl("not a url")).toBe(false);
  });
});
