import { describe, expect, it } from "vitest";

import {
  dueTomorrowWindow,
  instantToWallClock,
  localDateKey,
  presetTimes,
  startOfLocalDay,
  startOfNextLocalDay,
  wallClockToInstant,
} from "./day-window";

const TZ = "Africa/Cairo";
const at = (iso: string) => new Date(iso);

describe("local day boundaries in Cairo", () => {
  it("starts the day at Cairo midnight, not UTC midnight", () => {
    const now = at("2026-10-23T10:00:00Z"); // 13:00 Cairo (UTC+3)
    expect(startOfLocalDay(now, TZ)).toEqual(at("2026-10-22T21:00:00Z"));
    expect(startOfNextLocalDay(now, TZ)).toEqual(at("2026-10-23T21:00:00Z"));
  });

  // 22:30 UTC on the 23rd is already 01:30 on the 24th in Cairo.
  it("treats a late UTC evening as tomorrow in Cairo", () => {
    const now = at("2026-10-23T22:30:00Z");
    expect(localDateKey(now, TZ)).toBe("2026-10-24");
    expect(startOfLocalDay(now, TZ)).toEqual(at("2026-10-23T21:00:00Z"));
  });

  // Egypt springs forward at 00:00 on the last Friday of April: the day
  // starts at 01:00 local.
  it("handles the spring-forward day", () => {
    const now = at("2026-04-24T12:00:00Z");
    expect(startOfLocalDay(now, TZ)).toEqual(at("2026-04-23T22:00:00Z"));
    expect(startOfNextLocalDay(now, TZ)).toEqual(at("2026-04-24T21:00:00Z"));
  });

  // ...and falls back at the end of the last Thursday of October: a 25-hour day.
  it("handles the fall-back day", () => {
    const now = at("2026-10-29T12:00:00Z");
    expect(startOfLocalDay(now, TZ)).toEqual(at("2026-10-28T21:00:00Z"));
    expect(startOfNextLocalDay(now, TZ)).toEqual(at("2026-10-29T22:00:00Z"));
  });

  it("puts 'due tomorrow' on the next Cairo calendar day", () => {
    expect(dueTomorrowWindow(at("2026-10-23T10:00:00Z"), TZ)).toEqual({
      start: at("2026-10-23T21:00:00Z"),
      end: at("2026-10-24T21:00:00Z"),
    });
  });
});

describe("presetTimes", () => {
  const ids = (now: Date) => presetTimes(now, TZ).map((p) => p.id);

  it("offers today 17:00, tomorrow 11:00 and in two days 11:00", () => {
    const presets = presetTimes(at("2026-10-23T10:00:00Z"), TZ);
    expect(presets).toEqual([
      { id: "today5pm", at: at("2026-10-23T14:00:00Z") },
      { id: "tomorrow11am", at: at("2026-10-24T08:00:00Z") },
      { id: "in2Days11am", at: at("2026-10-25T08:00:00Z") },
    ]);
  });

  it("hides a preset that is already past in Cairo", () => {
    expect(ids(at("2026-10-23T13:59:00Z"))).toContain("today5pm"); // 16:59 Cairo
    expect(ids(at("2026-10-23T14:01:00Z"))).not.toContain("today5pm"); // 17:01 Cairo
  });

  it("keeps wall-clock times across the fall-back change", () => {
    const presets = presetTimes(at("2026-10-29T10:00:00Z"), TZ);
    // Thursday 17:00 is still UTC+3; Friday 11:00 is UTC+2.
    expect(presets[0]).toEqual({ id: "today5pm", at: at("2026-10-29T14:00:00Z") });
    expect(presets[1]).toEqual({ id: "tomorrow11am", at: at("2026-10-30T09:00:00Z") });
  });
});

describe("wall-clock conversion for the custom time field", () => {
  it("round-trips a Cairo wall-clock time", () => {
    const instant = wallClockToInstant("2026-10-24T17:30", TZ);
    expect(instant).toEqual(at("2026-10-24T14:30:00Z"));
    expect(instant && instantToWallClock(instant, TZ)).toBe("2026-10-24T17:30");
  });

  it("moves a time in the skipped spring-forward hour to a real instant", () => {
    const instant = wallClockToInstant("2026-04-24T00:30", TZ);
    expect(instant).toEqual(at("2026-04-23T22:30:00Z"));
    expect(instant && instantToWallClock(instant, TZ)).toBe("2026-04-24T01:30");
  });

  it("rejects malformed input", () => {
    expect(wallClockToInstant("", TZ)).toBeNull();
    expect(wallClockToInstant("tomorrow", TZ)).toBeNull();
    expect(wallClockToInstant("2026-13-40T99:99", TZ)).toBeNull();
  });
});
