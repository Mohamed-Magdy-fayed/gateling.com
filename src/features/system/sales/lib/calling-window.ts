import { TZDate } from "@date-fns/tz";

/**
 * Egyptian ateliers keep late hours: most open between 11:00 and 12:00 and
 * close around 22:00–23:00. Calling at 09:00 reaches a locked shop and burns
 * the first impression, so the Today page advises against phone work before
 * midday — it never hides the buckets, because the operator may know better
 * about a specific shop.
 */

/** Ateliers are reliably open from this local hour onward. */
export const CALLING_WINDOW_OPENS_HOUR = 12;
/** Past this local hour most shops have closed. */
export const CALLING_WINDOW_CLOSES_HOUR = 23;

export type CallingWindowAdvice = {
  localHour: number;
  /** Too early to phone — suggest WhatsApp-channel items instead. */
  isBeforeCallingHours: boolean;
  /** Too late to phone. */
  isAfterCallingHours: boolean;
};

export function getCallingWindowAdvice(
  now: Date,
  timeZone: string,
): CallingWindowAdvice {
  const local = new TZDate(now, timeZone);
  const localHour = local.getHours();

  return {
    localHour,
    isBeforeCallingHours: localHour < CALLING_WINDOW_OPENS_HOUR,
    isAfterCallingHours: localHour >= CALLING_WINDOW_CLOSES_HOUR,
  };
}
