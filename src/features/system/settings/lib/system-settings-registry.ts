import type { SettingsLabel } from "@/drizzle/schemas/system/settings-table";

export const DEFAULT_BUSINESS_TIMEZONE = "Africa/Cairo";
export const DEFAULT_CONTACT_EMAIL = "info@gateling.com";
export const DEFAULT_WHATSAPP_NUMBER = "+201000000000";

export const DEFAULT_BOOKING_WINDOW_START = "19:00";
export const DEFAULT_BOOKING_WINDOW_END = "23:00";
export const DEFAULT_BOOKING_SLOT_MINUTES = 30;
export const DEFAULT_BOOKING_MIN_NOTICE_HOURS = 4;
export const DEFAULT_BOOKING_MAX_DAYS_AHEAD = 14;

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
    | "settingName00016";
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
    | "settingDesc00016";
  descriptionEn: string;
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
];

export function getSystemSettingDefinition(
  code: string,
): SystemSettingDefinition | undefined {
  return SYSTEM_SETTINGS.find((row) => row.code === code);
}

export function isSystemSettingCode(code: string): code is SystemSettingCode {
  return SYSTEM_SETTING_CODES.includes(code as SystemSettingCode);
}

export const LEGACY_SETTING_CODE_VALUES: string[] = [];
