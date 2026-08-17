import {
  type LeadActivityChannel,
  type LeadActivityType,
  type LeadPipelineStatus,
  type LeadTier,
  leadActivityTypeValues,
  leadPipelineStatusValues,
  leadTierValues,
  type WhatsappStatus,
  whatsappStatusValues,
} from "@/drizzle/schema";

/**
 * Parsing and field mapping for the prospecting CSV. Kept free of database
 * imports so the mapping can be tested directly — the acceptance counts
 * (2 Rescue / 1 Overdue / 7 Follow-up) depend on this file being right, and a
 * test that reimplements the mapping would pass while production broke.
 */

export const DEFAULT_CSV_PATH =
  "G:/AI projects/Gateling Atelier/leads-seed.csv";

/**
 * The CSV carries no next-action column, but a `callback_scheduled` lead by
 * definition has a promised callback. Without deriving one, a scheduled
 * callback would never surface as overdue — the exact failure the Overdue
 * bucket exists to prevent.
 */
export const CALLBACK_PROMISE_DAYS = 1;

/**
 * Minimal RFC-4180 parser. The file has a UTF-8 BOM and quoted fields
 * containing commas (addresses, notes), so `split(",")` is not an option, and
 * a dependency for 44 rows is not worth it.
 */
export function parseCsv(text: string): Record<string, string>[] {
  const clean = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];

    if (inQuotes) {
      if (char === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  // Trailing field/row when the file does not end with a newline.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ""));
  const [header, ...body] = nonEmpty;
  if (!header) return [];

  return body.map((cells) =>
    Object.fromEntries(
      header.map((key, index) => [key.trim(), (cells[index] ?? "").trim()]),
    ),
  );
}

// ─── Field coercion ─────────────────────────────────────────────────────────

const orNull = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const toInt = (value: string | undefined) => {
  const digits = value?.replace(/\D/g, "") ?? "";
  if (!digits) return null;
  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const toBool = (value: string | undefined) =>
  value?.trim().toLowerCase() === "true";

function toEnum<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  const candidate = value?.trim() as T | undefined;
  return candidate && allowed.includes(candidate) ? candidate : fallback;
}

/** `2026-08-10` → midday UTC, so a timezone shift cannot move it a day. */
export function parseSeedDate(value: string | undefined): Date | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const parsed = new Date(`${trimmed}T12:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Which channel a seeded activity happened over. */
export function channelFor(type: LeadActivityType): LeadActivityChannel | null {
  if (type === "whatsapp_sent" || type === "whatsapp_reply") return "whatsapp";
  if (type === "call" || type === "no_answer" || type === "call_unclear") {
    return "phone";
  }
  return null;
}

// ─── Mapping ────────────────────────────────────────────────────────────────

export type MappedLead = {
  name: string;
  city: string | null;
  area: string | null;
  address: string | null;
  phone: string | null;
  phoneSecondary: string | null;
  whatsappStatus: WhatsappStatus;
  whatsappProfileName: string | null;
  tier: LeadTier | null;
  socialPlatform: string | null;
  socialHandle: string | null;
  socialFollowers: number | null;
  branchCount: number | null;
  businessType: string | null;
  sourceUrl: string | null;
  pipelineStatus: LeadPipelineStatus;
  doNotContact: boolean;
  notes: string | null;
};

export type MappedSeedActivity = {
  type: LeadActivityType;
  channel: LeadActivityChannel | null;
  occurredAt: Date;
  nextActionAt: Date | null;
};

export type MappedRecord = {
  lead: MappedLead;
  /** Null when the row has no `last_activity_type`. */
  activity: MappedSeedActivity | null;
};

/** One CSV row → the columns to write plus the history to seed. */
export function mapRecord(record: Record<string, string>): MappedRecord | null {
  const name = record.name?.trim();
  if (!name) return null;

  const pipelineStatus = toEnum<LeadPipelineStatus>(
    record.status,
    leadPipelineStatusValues,
    "new",
  );

  const lead: MappedLead = {
    name,
    city: orNull(record.city),
    area: orNull(record.area),
    address: orNull(record.address),
    // Stored exactly as entered — never normalised destructively, because a
    // mis-normalised Egyptian mobile is an un-callable lead.
    phone: orNull(record.phone_primary),
    phoneSecondary: orNull(record.phone_secondary),
    whatsappStatus: toEnum<WhatsappStatus>(
      record.whatsapp_status,
      whatsappStatusValues,
      "unknown",
    ),
    whatsappProfileName: orNull(record.whatsapp_profile_name),
    tier: record.tier?.trim()
      ? toEnum<LeadTier>(record.tier, leadTierValues, "C")
      : null,
    socialPlatform: orNull(record.social_platform),
    socialHandle: orNull(record.social_handle),
    socialFollowers: toInt(record.social_followers),
    branchCount: toInt(record.branch_count),
    businessType: orNull(record.business_type),
    sourceUrl: orNull(record.source_url),
    pipelineStatus,
    doNotContact: toBool(record.do_not_contact),
    notes: orNull(record.notes),
  };

  const rawType = record.last_activity_type?.trim();
  const occurredAt = parseSeedDate(record.last_activity_date);

  if (!rawType || !occurredAt) return { lead, activity: null };

  const type = toEnum<LeadActivityType>(
    rawType,
    leadActivityTypeValues,
    "note",
  );

  return {
    lead,
    activity: {
      type,
      channel: channelFor(type),
      occurredAt,
      nextActionAt:
        pipelineStatus === "callback_scheduled"
          ? new Date(occurredAt.getTime() + CALLBACK_PROMISE_DAYS * 86_400_000)
          : null,
    },
  };
}
