export function localize<T>(
  enValue: T,
  arValue: T | null | undefined,
  locale: string,
): T {
  if (locale === "ar" && arValue != null && arValue !== ("" as unknown as T)) {
    return arValue;
  }
  return enValue;
}
