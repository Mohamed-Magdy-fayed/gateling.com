import type { SettingsLabel } from "@/drizzle/schemas/system/settings-table";
import { BUSINESS_WHATSAPP_NUMBER } from "@/lib/phone";

export const DEFAULT_BUSINESS_TIMEZONE = "Africa/Cairo";
export const DEFAULT_CONTACT_EMAIL = "info@gateling.com";
/**
 * Re-exported from the shared constant rather than written out here. This used
 * to be a `+201000000000` placeholder that shipped to production, so the number
 * now has exactly one definition — see `BUSINESS_WHATSAPP_NUMBER`.
 */
export const DEFAULT_WHATSAPP_NUMBER = BUSINESS_WHATSAPP_NUMBER;

export const DEFAULT_BOOKING_WINDOW_START = "19:00";
export const DEFAULT_BOOKING_WINDOW_END = "23:00";
export const DEFAULT_BOOKING_SLOT_MINUTES = 30;
export const DEFAULT_BOOKING_MIN_NOTICE_HOURS = 4;
export const DEFAULT_BOOKING_MAX_DAYS_AHEAD = 14;

export const DEFAULT_MEETINGS_API_URL = "https://meetings.gateling.com";

export const SYSTEM_SETTING_CODE = {
  CONTACT_EMAIL: "00001",
  WHATSAPP_NUMBER: "00002",
  BUSINESS_TIMEZONE: "00003",
  FACEBOOK_PIXEL_ID: "00004",
  BOOKING_ENABLED: "00005",
  BOOKING_WINDOW_START: "00006",
  BOOKING_WINDOW_END: "00007",
  BOOKING_SLOT_MINUTES: "00008",
  BOOKING_MIN_NOTICE_HOURS: "00009",
  BOOKING_MAX_DAYS_AHEAD: "00010",
  BOOKING_MEETING_LINK: "00011",
  GA4_MEASUREMENT_ID: "00012",
  WAPILOT_INSTANCE_ID: "00013",
  WAPILOT_API_TOKEN: "00014",
  WAPILOT_WEBHOOK_SECRET: "00015",
  CHAT_WIDGET_ENABLED: "00016",
  SALES_DAILY_NEW_QUEUE_CAP: "00017",
  MEETINGS_API_URL: "00018",
  MEETINGS_API_KEY: "00019",
  MEETINGS_WEBHOOK_SECRET: "00020",
} as const;

export type SystemSettingCode =
  (typeof SYSTEM_SETTING_CODE)[keyof typeof SYSTEM_SETTING_CODE];

export const SYSTEM_SETTING_CODES: SystemSettingCode[] = [
  SYSTEM_SETTING_CODE.CONTACT_EMAIL,
  SYSTEM_SETTING_CODE.WHATSAPP_NUMBER,
  SYSTEM_SETTING_CODE.BUSINESS_TIMEZONE,
  SYSTEM_SETTING_CODE.FACEBOOK_PIXEL_ID,
  SYSTEM_SETTING_CODE.BOOKING_ENABLED,
  SYSTEM_SETTING_CODE.BOOKING_WINDOW_START,
  SYSTEM_SETTING_CODE.BOOKING_WINDOW_END,
  SYSTEM_SETTING_CODE.BOOKING_SLOT_MINUTES,
  SYSTEM_SETTING_CODE.BOOKING_MIN_NOTICE_HOURS,
  SYSTEM_SETTING_CODE.BOOKING_MAX_DAYS_AHEAD,
  SYSTEM_SETTING_CODE.BOOKING_MEETING_LINK,
  SYSTEM_SETTING_CODE.GA4_MEASUREMENT_ID,
  SYSTEM_SETTING_CODE.WAPILOT_INSTANCE_ID,
  SYSTEM_SETTING_CODE.WAPILOT_API_TOKEN,
  SYSTEM_SETTING_CODE.WAPILOT_WEBHOOK_SECRET,
  SYSTEM_SETTING_CODE.CHAT_WIDGET_ENABLED,
  SYSTEM_SETTING_CODE.SALES_DAILY_NEW_QUEUE_CAP,
  SYSTEM_SETTING_CODE.MEETINGS_API_URL,
  SYSTEM_SETTING_CODE.MEETINGS_API_KEY,
  SYSTEM_SETTING_CODE.MEETINGS_WEBHOOK_SECRET,
];

export type SystemSettingDefinition = {
  code: SystemSettingCode;
  label: SettingsLabel;
  nameKey:
    | "settingName00001"
    | "settingName00002"
    | "settingName00003"
    | "settingName00004"
    | "settingName00005"
    | "settingName00006"
    | "settingName00007"
    | "settingName00008"
    | "settingName00009"
    | "settingName00010"
    | "settingName00011"
    | "settingName00012"
    | "settingName00013"
    | "settingName00014"
    | "settingName00015"
    | "settingName00016"
    | "settingName00017"
    | "settingName00018"
    | "settingName00019"
    | "settingName00020";
  descriptionKey:
    | "settingDesc00001"
    | "settingDesc00002"
    | "settingDesc00003"
    | "settingDesc00004"
    | "settingDesc00005"
    | "settingDesc00006"
    | "settingDesc00007"
    | "settingDesc00008"
    | "settingDesc00009"
    | "settingDesc00010"
    | "settingDesc00011"
    | "settingDesc00012"
    | "settingDesc00013"
    | "settingDesc00014"
    | "settingDesc00015"
    | "settingDesc00016"
    | "settingDesc00017"
    | "settingDesc00018"
    | "settingDesc00019"
    | "settingDesc00020";
  descriptionEn: string;
  /**
   * A credential for another system (API token, webhook secret). Never
   * returned to a browser once set: the grid reports only whether a value
   * exists, search skips its value, and saving replaces it wholesale — an
   * admin who needs to see one again rotates it on the issuing system.
   */
  isSecret?: boolean;
  editable: {
    isActive?: boolean;
    value?: boolean;
    amount?: boolean;
  };
  seed: {
    isActive: boolean | null;
    value?: string | null;
    amount?: number | null;
  };
  /** Optional extra validation for `value`, beyond the generic max-length check. */
  validateValue?: (value: string) => boolean;
};

/**
 * https only, except a Meetings instance on this machine for local development.
 * The API key travels in a header to whatever host this says, so a plaintext
 * non-local URL must never be accepted. (A copy of the block's own check —
 * `@/integrations/meetings` is server-only and this registry is shared with
 * the browser.)
 */
export function isAllowedMeetingsApiUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol === "https:") return true;
    return (
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
}

export const SYSTEM_SETTINGS: SystemSettingDefinition[] = [
  {
    code: SYSTEM_SETTING_CODE.CONTACT_EMAIL,
    label: "integration",
    nameKey: "settingName00001",
    descriptionKey: "settingDesc00001",
    descriptionEn: "Email address displayed on the public contact page.",
    editable: { value: true },
    seed: { isActive: true, value: DEFAULT_CONTACT_EMAIL },
  },
  {
    code: SYSTEM_SETTING_CODE.WHATSAPP_NUMBER,
    label: "integration",
    nameKey: "settingName00002",
    descriptionKey: "settingDesc00002",
    descriptionEn:
      "WhatsApp number for the floating contact button (E.164 format, e.g. +201001234567).",
    editable: { isActive: true, value: true },
    seed: { isActive: true, value: DEFAULT_WHATSAPP_NUMBER },
  },
  {
    code: SYSTEM_SETTING_CODE.BUSINESS_TIMEZONE,
    label: "integration",
    nameKey: "settingName00003",
    descriptionKey: "settingDesc00003",
    descriptionEn:
      "IANA timezone used for date display across the admin dashboard.",
    editable: { isActive: true, value: true },
    seed: { isActive: true, value: DEFAULT_BUSINESS_TIMEZONE },
  },
  {
    code: SYSTEM_SETTING_CODE.FACEBOOK_PIXEL_ID,
    label: "integration",
    nameKey: "settingName00004",
    descriptionKey: "settingDesc00004",
    descriptionEn:
      "Facebook Pixel ID for conversion tracking and retargeting on Meta platforms.",
    editable: { isActive: true, value: true },
    seed: { isActive: false, value: null },
  },
  {
    code: SYSTEM_SETTING_CODE.BOOKING_ENABLED,
    label: "policy",
    nameKey: "settingName00005",
    descriptionKey: "settingDesc00005",
    descriptionEn:
      "Enables the public book-a-call page. When inactive, customers cannot book or request calls.",
    editable: { isActive: true },
    seed: { isActive: true },
  },
  {
    code: SYSTEM_SETTING_CODE.BOOKING_WINDOW_START,
    label: "policy",
    nameKey: "settingName00006",
    descriptionKey: "settingDesc00006",
    descriptionEn:
      "Daily start of the bookable window, 24h HH:mm in the business timezone (e.g. 19:00).",
    editable: { value: true },
    seed: { isActive: true, value: DEFAULT_BOOKING_WINDOW_START },
  },
  {
    code: SYSTEM_SETTING_CODE.BOOKING_WINDOW_END,
    label: "policy",
    nameKey: "settingName00007",
    descriptionKey: "settingDesc00007",
    descriptionEn:
      "Daily end of the bookable window, 24h HH:mm in the business timezone (e.g. 23:00).",
    editable: { value: true },
    seed: { isActive: true, value: DEFAULT_BOOKING_WINDOW_END },
  },
  {
    code: SYSTEM_SETTING_CODE.BOOKING_SLOT_MINUTES,
    label: "policy",
    nameKey: "settingName00008",
    descriptionKey: "settingDesc00008",
    descriptionEn: "Length of each bookable call slot, in minutes.",
    editable: { amount: true },
    seed: { isActive: true, amount: DEFAULT_BOOKING_SLOT_MINUTES },
  },
  {
    code: SYSTEM_SETTING_CODE.BOOKING_MIN_NOTICE_HOURS,
    label: "policy",
    nameKey: "settingName00009",
    descriptionKey: "settingDesc00009",
    descriptionEn:
      "Minimum notice in hours before a slot can be booked (hides slots that start too soon).",
    editable: { amount: true },
    seed: { isActive: true, amount: DEFAULT_BOOKING_MIN_NOTICE_HOURS },
  },
  {
    code: SYSTEM_SETTING_CODE.BOOKING_MAX_DAYS_AHEAD,
    label: "policy",
    nameKey: "settingName00010",
    descriptionKey: "settingDesc00010",
    descriptionEn: "How many days into the future customers can book.",
    editable: { amount: true },
    seed: { isActive: true, amount: DEFAULT_BOOKING_MAX_DAYS_AHEAD },
  },
  {
    code: SYSTEM_SETTING_CODE.BOOKING_MEETING_LINK,
    label: "integration",
    nameKey: "settingName00011",
    descriptionKey: "settingDesc00011",
    descriptionEn:
      "Static meeting room URL (Google Meet/Zoom) included in booking confirmation emails.",
    editable: { isActive: true, value: true },
    seed: { isActive: false, value: null },
    validateValue: (value) => /^https:\/\//i.test(value),
  },
  {
    code: SYSTEM_SETTING_CODE.GA4_MEASUREMENT_ID,
    label: "integration",
    nameKey: "settingName00012",
    descriptionKey: "settingDesc00012",
    descriptionEn:
      "Google Analytics 4 Measurement ID for site analytics and conversion tracking (format: G-XXXXXXXXXX).",
    editable: { isActive: true, value: true },
    seed: { isActive: false, value: null },
    validateValue: (value) => /^G-[A-Z0-9]+$/i.test(value),
  },
  {
    code: SYSTEM_SETTING_CODE.WAPILOT_INSTANCE_ID,
    label: "integration",
    nameKey: "settingName00013",
    descriptionKey: "settingDesc00013",
    descriptionEn:
      "WaPilot instance ID used to send website chat messages over WhatsApp.",
    editable: { isActive: true, value: true },
    seed: { isActive: false, value: null },
  },
  {
    code: SYSTEM_SETTING_CODE.WAPILOT_API_TOKEN,
    label: "integration",
    nameKey: "settingName00014",
    descriptionKey: "settingDesc00014",
    descriptionEn: "WaPilot API token used to authenticate send requests.",
    isSecret: true,
    editable: { isActive: true, value: true },
    seed: { isActive: false, value: null },
  },
  {
    code: SYSTEM_SETTING_CODE.WAPILOT_WEBHOOK_SECRET,
    label: "integration",
    nameKey: "settingName00015",
    descriptionKey: "settingDesc00015",
    descriptionEn:
      "Shared secret appended to the WaPilot webhook URL (?secret=...) to authenticate incoming replies.",
    isSecret: true,
    editable: { isActive: true, value: true },
    seed: { isActive: false, value: null },
  },
  {
    code: SYSTEM_SETTING_CODE.CHAT_WIDGET_ENABLED,
    label: "policy",
    nameKey: "settingName00016",
    descriptionKey: "settingDesc00016",
    descriptionEn:
      "Enables the on-site WhatsApp chat widget. When inactive, the floating button falls back to a wa.me link.",
    editable: { isActive: true },
    seed: { isActive: false },
  },
  {
    code: SYSTEM_SETTING_CODE.SALES_DAILY_NEW_QUEUE_CAP,
    label: "policy",
    nameKey: "settingName00017",
    descriptionKey: "settingDesc00017",
    descriptionEn:
      "How many fresh prospects the Today's Work new-dial queue shows per day. An uncapped list gets ignored; a short one gets worked.",
    editable: { amount: true },
    seed: { isActive: true, amount: 10 },
  },
  // Gateling Meetings (docs/meetings-integration.md). The key and secret are
  // issued together on meetings.gateling.com/settings/integrations and pasted
  // here — no environment variables, no redeploy. Presence of the key is what
  // turns the integration on, so `isActive` is not editable.
  {
    code: SYSTEM_SETTING_CODE.MEETINGS_API_URL,
    label: "integration",
    nameKey: "settingName00018",
    descriptionKey: "settingDesc00018",
    descriptionEn:
      "Base URL of the Gateling Meetings instance this site creates rooms on. https only; http is accepted for localhost during local development.",
    editable: { value: true },
    seed: { isActive: true, value: DEFAULT_MEETINGS_API_URL },
    validateValue: isAllowedMeetingsApiUrl,
  },
  {
    code: SYSTEM_SETTING_CODE.MEETINGS_API_KEY,
    label: "integration",
    nameKey: "settingName00019",
    descriptionKey: "settingDesc00019",
    descriptionEn:
      "API key issued on meetings.gateling.com/settings/integrations. Stored, never shown again; paste a new one to replace it, clear it to disconnect.",
    isSecret: true,
    editable: { value: true },
    seed: { isActive: true, value: null },
  },
  {
    code: SYSTEM_SETTING_CODE.MEETINGS_WEBHOOK_SECRET,
    label: "integration",
    nameKey: "settingName00020",
    descriptionKey: "settingDesc00020",
    descriptionEn:
      "Webhook secret issued with the API key; verifies room-ended deliveries to /api/meetings-webhook. Until it is set, deliveries are answered 503 and retried.",
    isSecret: true,
    editable: { value: true },
    seed: { isActive: true, value: null },
  },
];

export const SECRET_SYSTEM_SETTING_CODES: SystemSettingCode[] =
  SYSTEM_SETTINGS.filter((def) => def.isSecret).map((def) => def.code);

export function isSecretSystemSetting(code: string): boolean {
  return getSystemSettingDefinition(code)?.isSecret === true;
}

export function getSystemSettingDefinition(
  code: string,
): SystemSettingDefinition | undefined {
  return SYSTEM_SETTINGS.find((row) => row.code === code);
}

export function isSystemSettingCode(code: string): code is SystemSettingCode {
  return SYSTEM_SETTING_CODES.includes(code as SystemSettingCode);
}

export const LEGACY_SETTING_CODE_VALUES: string[] = [];
