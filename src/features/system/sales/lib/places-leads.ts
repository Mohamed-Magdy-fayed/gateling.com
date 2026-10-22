/**
 * Turns Google Places (New) Text Search results into rows of the prospecting
 * CSV (`leads-seed.csv` format), deduplicated against leads we already have.
 *
 * Pure and IO-free on purpose: the CLI in `scripts/source-atelier-leads.ts`
 * does the HTTP and file work, and everything that decides *which* rows reach
 * the pipeline lives here, where it can be tested without an API key.
 *
 * Only the business's own published listing is used (name, phone, address,
 * Maps link) — never a person's details found elsewhere. The output is a list
 * to verify by hand before it is imported, not an import itself.
 */

// ─── Search configuration ───────────────────────────────────────────────────

type LatLng = { latitude: number; longitude: number };

export type SearchCity = {
  key: "cairo" | "giza" | "alexandria";
  /** Value written to the CSV `city` column — matches the existing seed. */
  label: "Cairo" | "Giza" | "Alexandria";
  /** Matched against the `administrative_area_level_1` component. */
  governorate: RegExp;
  /** Hard search boundary; the governorate check settles overlaps. */
  rectangle: { low: LatLng; high: LatLng };
};

export const SEARCH_CITIES: readonly SearchCity[] = [
  {
    key: "cairo",
    label: "Cairo",
    governorate: /cairo/i,
    rectangle: {
      low: { latitude: 29.85, longitude: 31.1 },
      high: { latitude: 30.25, longitude: 31.75 },
    },
  },
  {
    key: "giza",
    label: "Giza",
    governorate: /giza/i,
    rectangle: {
      low: { latitude: 29.85, longitude: 30.85 },
      high: { latitude: 30.15, longitude: 31.25 },
    },
  },
  {
    key: "alexandria",
    label: "Alexandria",
    governorate: /alexandria/i,
    rectangle: {
      low: { latitude: 31.05, longitude: 29.7 },
      high: { latitude: 31.35, longitude: 30.1 },
    },
  },
];

/**
 * Several phrasings because Places matches on the business's own wording:
 * rental-only shops rarely say "atelier", and many list in English only.
 */
export const SEARCH_QUERIES = [
  "اتيليه فساتين زفاف",
  "اتيليه سواريه",
  "تأجير فساتين زفاف",
  "bridal atelier",
  "wedding dress shop",
] as const;

/** Places caps a page at 20 and a query at 3 pages (60 results). */
export const PAGE_SIZE = 20;
export const MAX_PAGES_PER_QUERY = 3;

/**
 * Phone fields put the request in a pricier SKU, so the mask asks for exactly
 * what the CSV needs and nothing more.
 */
export const PLACES_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.addressComponents",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.googleMapsUri",
  "places.businessStatus",
  "places.userRatingCount",
  "nextPageToken",
].join(",");

export type TextSearchRequest = {
  textQuery: string;
  languageCode: "en";
  regionCode: "EG";
  pageSize: number;
  pageToken?: string;
  locationRestriction: { rectangle: SearchCity["rectangle"] };
};

export function buildSearchRequest(
  query: string,
  city: SearchCity,
  pageToken?: string,
): TextSearchRequest {
  return {
    textQuery: query,
    // English address components keep the governorate match and the
    // `area` column consistent; display names stay as the business wrote them.
    languageCode: "en",
    regionCode: "EG",
    pageSize: PAGE_SIZE,
    ...(pageToken ? { pageToken } : {}),
    locationRestriction: { rectangle: city.rectangle },
  };
}

// ─── Places response (the subset we request) ───────────────────────────────

export type PlaceAddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

export type Place = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  addressComponents?: PlaceAddressComponent[];
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  googleMapsUri?: string;
  businessStatus?: string;
  userRatingCount?: number;
};

export type TextSearchResponse = {
  places?: Place[];
  nextPageToken?: string;
};

// ─── CSV row ────────────────────────────────────────────────────────────────

/** Column order of `leads-seed.csv`, which `sales-csv.ts` maps on import. */
export const LEAD_CSV_COLUMNS = [
  "name",
  "city",
  "area",
  "address",
  "phone_primary",
  "phone_secondary",
  "whatsapp_status",
  "whatsapp_profile_name",
  "tier",
  "social_platform",
  "social_handle",
  "social_followers",
  "branch_count",
  "business_type",
  "source_url",
  "status",
  "last_activity_type",
  "last_activity_date",
  "follow_up_count",
  "do_not_contact",
  "notes",
] as const;

export type LeadCsvRow = Record<(typeof LEAD_CSV_COLUMNS)[number], string>;

/** Marker in `notes` so later runs can dedupe on the stable place id. */
export const PLACE_ID_PREFIX = "places:";

export type MapOutcome =
  | { kind: "row"; row: LeadCsvRow; ratingCount: number }
  | { kind: "skipped"; reason: "closed" | "no_phone" | "out_of_area" };

function component(place: Place, type: string): string | undefined {
  return place.addressComponents?.find((c) => c.types?.includes(type))
    ?.longText;
}

/**
 * One Places result → one CSV row, or the reason it was dropped. A listing
 * with no phone is dropped rather than kept: the new-dial queue cannot use it.
 */
export function mapPlaceToRow(place: Place): MapOutcome {
  if (place.businessStatus === "CLOSED_PERMANENTLY") {
    return { kind: "skipped", reason: "closed" };
  }

  const governorate = component(place, "administrative_area_level_1") ?? "";
  const city = SEARCH_CITIES.find((c) => c.governorate.test(governorate));
  if (!city) return { kind: "skipped", reason: "out_of_area" };

  const phone = place.nationalPhoneNumber ?? place.internationalPhoneNumber;
  if (!phone) return { kind: "skipped", reason: "no_phone" };

  const ratingCount = place.userRatingCount ?? 0;
  const area =
    component(place, "sublocality_level_1") ??
    component(place, "administrative_area_level_2") ??
    component(place, "locality") ??
    "";

  const row: LeadCsvRow = {
    name: place.displayName?.text?.trim() || "(unnamed listing)",
    city: city.label,
    area,
    address: place.formattedAddress ?? "",
    // Exactly as Google lists it; normalisation is for comparison only.
    phone_primary: phone,
    phone_secondary: "",
    whatsapp_status: "unknown",
    whatsapp_profile_name: "",
    tier: "",
    social_platform: "",
    social_handle: "",
    social_followers: "",
    branch_count: "",
    business_type: "",
    source_url: place.googleMapsUri ?? "",
    status: "new",
    last_activity_type: "",
    last_activity_date: "",
    follow_up_count: "",
    do_not_contact: "",
    notes: `${PLACE_ID_PREFIX}${place.id} · ${ratingCount} Google reviews · verify before outreach`,
  };

  return { kind: "row", row, ratingCount };
}

// ─── Deduplication ──────────────────────────────────────────────────────────

/**
 * Comparable form of an Egyptian number: digits only, `+20`/`0020` folded to
 * the leading `0`. Never written back — stored phones stay as entered.
 */
export function normalizePhone(raw: string | undefined): string | null {
  let digits = raw?.replace(/\D/g, "") ?? "";
  if (digits.startsWith("0020")) digits = `0${digits.slice(4)}`;
  else if (digits.startsWith("20") && digits.length >= 11) {
    digits = `0${digits.slice(2)}`;
  }
  return digits.length >= 8 ? digits : null;
}

/**
 * Comparable form of a business name: case, Arabic letter variants and the
 * word "atelier" in either script are folded away, so "Atelier Mary" and
 * "اتيليه ماري" do not match each other but "ATELIER MARY." and "Mary" do.
 */
export function normalizeName(raw: string | undefined): string {
  return (raw ?? "")
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "") // harakat + tatweel
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/(atelier|atelie|اتيليه|اتلييه|اتيلييه|اتليه)/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

export type DedupeIndex = {
  phones: Set<string>;
  nameCity: Set<string>;
  placeIds: Set<string>;
};

export type ExistingLead = {
  name?: string;
  city?: string;
  phone?: string;
  phoneSecondary?: string;
  notes?: string;
};

const nameCityKey = (name: string | undefined, city: string | undefined) =>
  `${normalizeName(name)}|${(city ?? "").trim().toLowerCase()}`;

const PLACE_ID_PATTERN = new RegExp(`${PLACE_ID_PREFIX}(\\S+)`);

export function buildDedupeIndex(
  existing: readonly ExistingLead[],
): DedupeIndex {
  const index: DedupeIndex = {
    phones: new Set(),
    nameCity: new Set(),
    placeIds: new Set(),
  };
  for (const lead of existing) addToIndex(index, lead);
  return index;
}

function addToIndex(index: DedupeIndex, lead: ExistingLead) {
  for (const raw of [lead.phone, lead.phoneSecondary]) {
    const phone = normalizePhone(raw);
    if (phone) index.phones.add(phone);
  }
  if (normalizeName(lead.name))
    index.nameCity.add(nameCityKey(lead.name, lead.city));
  const placeId = lead.notes?.match(PLACE_ID_PATTERN)?.[1];
  if (placeId) index.placeIds.add(placeId);
}

export type DuplicateReason = "place_id" | "phone" | "name_city";

export function duplicateReason(
  index: DedupeIndex,
  row: LeadCsvRow,
): DuplicateReason | null {
  const placeId = row.notes.match(PLACE_ID_PATTERN)?.[1];
  if (placeId && index.placeIds.has(placeId)) return "place_id";
  const phone = normalizePhone(row.phone_primary);
  if (phone && index.phones.has(phone)) return "phone";
  if (index.nameCity.has(nameCityKey(row.name, row.city))) return "name_city";
  return null;
}

export type RankedRow = { row: LeadCsvRow; ratingCount: number };

export type DedupeResult = {
  fresh: LeadCsvRow[];
  duplicates: { row: LeadCsvRow; reason: DuplicateReason }[];
};

/**
 * Drops anything already known, including repeats within this run (the same
 * shop comes back from several queries). Survivors are ordered by Google
 * review count, the cheapest available proxy for business size, so the
 * first daily batch holds the most established ateliers.
 */
export function dedupeCandidates(
  candidates: readonly RankedRow[],
  index: DedupeIndex,
): DedupeResult {
  const working: DedupeIndex = {
    phones: new Set(index.phones),
    nameCity: new Set(index.nameCity),
    placeIds: new Set(index.placeIds),
  };
  const ordered = [...candidates].sort((a, b) => b.ratingCount - a.ratingCount);
  const fresh: LeadCsvRow[] = [];
  const duplicates: DedupeResult["duplicates"] = [];

  for (const { row } of ordered) {
    const reason = duplicateReason(working, row);
    if (reason) {
      duplicates.push({ row, reason });
      continue;
    }
    fresh.push(row);
    addToIndex(working, {
      name: row.name,
      city: row.city,
      phone: row.phone_primary,
      notes: row.notes,
    });
  }

  return { fresh, duplicates };
}

// ─── Output ─────────────────────────────────────────────────────────────────

export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (size < 1) throw new Error("Batch size must be at least 1");
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * UTF-8 with a BOM so Excel opens Arabic names correctly; `parseCsv` in
 * `sales-csv.ts` strips the BOM on import.
 */
export function toLeadCsv(rows: readonly LeadCsvRow[]): string {
  const lines = [
    LEAD_CSV_COLUMNS.join(","),
    ...rows.map((row) =>
      LEAD_CSV_COLUMNS.map((col) => csvCell(row[col])).join(","),
    ),
  ];
  return `﻿${lines.join("\r\n")}\r\n`;
}

/** The run's skipped duplicates, so a wrong match can be spotted and re-added. */
export function toSkippedCsv(duplicates: DedupeResult["duplicates"]): string {
  const lines = [
    "name,city,phone_primary,reason",
    ...duplicates.map(({ row, reason }) =>
      [row.name, row.city, row.phone_primary, reason].map(csvCell).join(","),
    ),
  ];
  return `﻿${lines.join("\r\n")}\r\n`;
}
