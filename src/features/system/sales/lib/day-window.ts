import { TZDate } from "@date-fns/tz";
import { addDays, startOfDay } from "date-fns";

/**
 * Day boundaries and wall-clock times in the business timezone (Cairo by
 * default). Egypt observes DST, so nothing here uses a fixed offset: `TZDate`
 * resolves every local time against the real rules, including the 23- and
 * 25-hour days.
 */

function local(now: Date, timeZone: string): TZDate {
  return new TZDate(now.getTime(), timeZone);
}

function asDate(value: Date): Date {
  return new Date(value.getTime());
}

/** Local midnight (or the day's first real instant on a spring-forward day). */
export function startOfLocalDay(now: Date, timeZone: string): Date {
  return asDate(startOfDay(local(now, timeZone)));
}

export function startOfNextLocalDay(now: Date, timeZone: string): Date {
  return asDate(startOfDay(addDays(startOfDay(local(now, timeZone)), 1)));
}

/** `[start, end)` of the next local calendar day — "due tomorrow". */
export function dueTomorrowWindow(
  now: Date,
  timeZone: string,
): { start: Date; end: Date } {
  const start = startOfNextLocalDay(now, timeZone);
  return { start, end: startOfNextLocalDay(start, timeZone) };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** `YYYY-MM-DD` of the local day — keys the per-day session state. */
export function localDateKey(now: Date, timeZone: string): string {
  const d = local(now, timeZone);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export type TimePresetId = "today5pm" | "tomorrow11am" | "in2Days11am";

/** Quick picks for "call back" and "book demo", in local wall-clock time. */
export const TIME_PRESETS: readonly {
  id: TimePresetId;
  dayOffset: number;
  hour: number;
}[] = [
  { id: "today5pm", dayOffset: 0, hour: 17 },
  { id: "tomorrow11am", dayOffset: 1, hour: 11 },
  { id: "in2Days11am", dayOffset: 2, hour: 11 },
];

/** Presets still in the future — a past preset would write an overdue promise. */
export function presetTimes(
  now: Date,
  timeZone: string,
): { id: TimePresetId; at: Date }[] {
  const today = local(now, timeZone);
  return TIME_PRESETS.map(({ id, dayOffset, hour }) => ({
    id,
    at: asDate(
      new TZDate(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + dayOffset,
        hour,
        0,
        timeZone,
      ),
    ),
  })).filter((preset) => preset.at.getTime() > now.getTime());
}

const WALL_CLOCK = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/**
 * A `datetime-local` value read as business-timezone wall-clock time. A time
 * inside the skipped spring-forward hour resolves to the next real instant.
 */
export function wallClockToInstant(value: string, timeZone: string): Date | null {
  const match = WALL_CLOCK.exec(value);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number);
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;
  const instant = new TZDate(y, mo - 1, d, h, mi, timeZone);
  return Number.isNaN(instant.getTime()) ? null : asDate(instant);
}

/** The `datetime-local` value for an instant, in business-timezone wall-clock time. */
export function instantToWallClock(instant: Date, timeZone: string): string {
  const d = local(instant, timeZone);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
