import { TZDate } from "@date-fns/tz";
import { addDays, addMinutes } from "date-fns";

import type { BookingSettings } from "./settings";

export type BusyInterval = { startsAt: Date; endsAt: Date };

export type DayAvailability = {
  /** Business-timezone calendar date, YYYY-MM-DD */
  date: string;
  /** UTC instants (ISO) of slot starts still open for booking */
  slots: string[];
};

function overlaps(aStart: Date, aEnd: Date, b: BusyInterval): boolean {
  return aStart < b.endsAt && aEnd > b.startsAt;
}

function formatDateKey(date: TZDate): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** All slot starts for one business-timezone day, ignoring busy intervals. */
function daySlotStarts(dayStart: TZDate, settings: BookingSettings): Date[] {
  const [startH, startM] = settings.windowStart.split(":").map(Number);
  const [endH, endM] = settings.windowEnd.split(":").map(Number);
  const windowStart = new TZDate(
    dayStart.getFullYear(),
    dayStart.getMonth(),
    dayStart.getDate(),
    startH,
    startM,
    0,
    settings.timezone,
  );
  const windowEnd = new TZDate(
    dayStart.getFullYear(),
    dayStart.getMonth(),
    dayStart.getDate(),
    endH,
    endM,
    0,
    settings.timezone,
  );
  if (windowEnd <= windowStart) return [];

  const starts: Date[] = [];
  let cursor: Date = windowStart;
  while (addMinutes(cursor, settings.slotMinutes) <= windowEnd) {
    starts.push(new Date(cursor.getTime()));
    cursor = addMinutes(cursor, settings.slotMinutes);
  }
  return starts;
}

/**
 * Compute open slots for the whole booking horizon, in the business timezone,
 * excluding busy intervals (confirmed bookings + blackouts) and slots inside
 * the minimum-notice period.
 */
export function computeAvailability(
  settings: BookingSettings,
  busy: BusyInterval[],
  now: Date = new Date(),
): DayAvailability[] {
  const earliestStart = addMinutes(now, settings.minNoticeHours * 60);
  const days: DayAvailability[] = [];
  const todayInTz = new TZDate(now.getTime(), settings.timezone);

  for (let offset = 0; offset <= settings.maxDaysAhead; offset++) {
    const day = new TZDate(addDays(todayInTz, offset), settings.timezone);
    const open = daySlotStarts(day, settings).filter((start) => {
      if (start < earliestStart) return false;
      const end = addMinutes(start, settings.slotMinutes);
      return !busy.some((interval) => overlaps(start, end, interval));
    });
    days.push({
      date: formatDateKey(day),
      slots: open.map((start) => start.toISOString()),
    });
  }
  return days;
}

/** True when startsAt is exactly one of the currently open computed slots. */
export function isOpenSlot(
  startsAt: Date,
  settings: BookingSettings,
  busy: BusyInterval[],
  now: Date = new Date(),
): boolean {
  const iso = startsAt.toISOString();
  return computeAvailability(settings, busy, now).some((day) =>
    day.slots.includes(iso),
  );
}

/**
 * True when [startsAt, endsAt) overlaps a busy interval (confirmed booking or
 * blackout). Unlike isOpenSlot, this ignores the window/notice/grid rules, so
 * it's the right check for confirming an off-window custom time request.
 */
export function hasBusyOverlap(
  startsAt: Date,
  endsAt: Date,
  busy: BusyInterval[],
): boolean {
  return busy.some((interval) => overlaps(startsAt, endsAt, interval));
}
