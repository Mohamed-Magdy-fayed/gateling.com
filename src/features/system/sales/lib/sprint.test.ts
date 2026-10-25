import { describe, expect, it } from "vitest";

import {
  addDaysToKey,
  conversionRate,
  fillDailySeries,
  lastLocalDayKeys,
  requiredDailyPace,
  sprintWindow,
} from "./sprint";

const TZ = "Africa/Cairo";
const at = (iso: string) => new Date(iso);

describe("addDaysToKey", () => {
  it("crosses month and year boundaries", () => {
    expect(addDaysToKey("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDaysToKey("2026-12-25", 14)).toBe("2027-01-08");
    expect(addDaysToKey("2026-11-01", -1)).toBe("2026-10-31");
  });
});

describe("sprintWindow", () => {
  it("is not_set without a start date", () => {
    expect(sprintWindow(null, at("2026-10-25T10:00:00Z"), TZ)).toEqual({
      state: "not_set",
    });
  });

  it("is not_set for an unparseable date", () => {
    expect(sprintWindow("26-10-2026", at("2026-10-25T10:00:00Z"), TZ)).toEqual({
      state: "not_set",
    });
  });

  it("counts day 1 from Cairo midnight, not UTC", () => {
    // 22:30 UTC on the 22nd is 01:30 Cairo on the 23rd.
    const w = sprintWindow("2026-10-23", at("2026-10-22T22:30:00Z"), TZ);
    expect(w).toMatchObject({ state: "active", day: 1, daysRemaining: 14 });
    if (w.state === "not_set") throw new Error("unreachable");
    expect(w.start).toEqual(at("2026-10-22T21:00:00Z"));
  });

  it("is upcoming the evening before day 1", () => {
    const w = sprintWindow("2026-10-23", at("2026-10-22T20:30:00Z"), TZ);
    expect(w).toMatchObject({ state: "upcoming", day: 0 });
  });

  it("is active on day 14 and ended on day 15", () => {
    expect(
      sprintWindow("2026-10-23", at("2026-11-05T10:00:00Z"), TZ),
    ).toMatchObject({ state: "active", day: 14, daysRemaining: 1 });
    expect(
      sprintWindow("2026-10-23", at("2026-11-06T10:00:00Z"), TZ),
    ).toMatchObject({ state: "ended", day: 14, daysRemaining: 0 });
  });

  it("ends at local midnight after day 14, across the DST change", () => {
    // Egypt leaves summer time on 2026-10-29: UTC+3 becomes UTC+2.
    const w = sprintWindow("2026-10-23", at("2026-10-25T10:00:00Z"), TZ);
    if (w.state === "not_set") throw new Error("unreachable");
    expect(w.end).toEqual(at("2026-11-05T22:00:00Z"));
  });
});

describe("requiredDailyPace", () => {
  it("spreads the remaining contacts over the remaining days, rounding up", () => {
    expect(requiredDailyPace(40, 12, 9)).toBe(4);
    expect(requiredDailyPace(40, 0, 14)).toBe(3);
  });

  it("is null once the target is met or time is up", () => {
    expect(requiredDailyPace(40, 40, 5)).toBeNull();
    expect(requiredDailyPace(40, 10, 0)).toBeNull();
  });
});

describe("conversionRate", () => {
  it("rounds to a whole percent", () => {
    expect(conversionRate(1, 3)).toBe(33);
    expect(conversionRate(2, 3)).toBe(67);
  });

  it("is null with nothing to convert from", () => {
    expect(conversionRate(0, 0)).toBeNull();
  });
});

describe("daily series", () => {
  it("lists the last n Cairo days ending today, oldest first", () => {
    expect(lastLocalDayKeys(at("2026-10-24T22:30:00Z"), TZ, 3)).toEqual([
      "2026-10-23",
      "2026-10-24",
      "2026-10-25",
    ]);
  });

  it("zero-fills days with no activity", () => {
    expect(
      fillDailySeries(
        ["2026-10-23", "2026-10-24", "2026-10-25"],
        [{ day: "2026-10-24", count: 5 }],
      ),
    ).toEqual([
      { day: "2026-10-23", count: 0 },
      { day: "2026-10-24", count: 5 },
      { day: "2026-10-25", count: 0 },
    ]);
  });
});
