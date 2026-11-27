/**
 * Site rule: numbers are always written with 0-9, Arabic included. Browsers
 * format "ar" / "ar-EG" with Arabic-Indic digits (١٢٣) by default, so every
 * Intl / toLocale* call passes its locale through here. Arabic keeps its
 * month and day names; only the digits change.
 */
export function withLatinDigits(locale: string): string;
export function withLatinDigits(locale: string | undefined): string | undefined;
export function withLatinDigits(locale: string | undefined) {
  if (!locale?.startsWith("ar") || locale.includes("-u-")) return locale;
  return `${locale}-u-nu-latn`;
}
