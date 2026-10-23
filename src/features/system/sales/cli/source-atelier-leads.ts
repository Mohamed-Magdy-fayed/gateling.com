/**
 * Pulls atelier listings from Google Places (New) Text Search for Cairo, Giza
 * and Alexandria, drops anything we already have, and writes daily batch files
 * in the `leads-seed.csv` format.
 *
 *   npm run leads:source -- --dry-run          # plan only, no API calls
 *   npm run leads:source                       # fetch + write batches
 *   npm run leads:source -- --db               # also dedupe against the DB
 *
 * Each batch is meant to be verified by hand (WhatsApp profile name, Instagram
 * handle, followers, tier) and then imported with
 * `npm run seed -- sales-leads <batch file>`. That import WRITES to whatever
 * DATABASE_URL points at — production by default.
 *
 * Batch files hold phone numbers, so they are written outside the repo.
 *
 * Google Maps Platform terms limit how long Places content may be stored. The
 * batches are working files: verify, import what you will contact, delete the
 * rest. The `places:<id>` marker is the part that is allowed to persist.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

import { config as loadEnv } from "dotenv";

import { DEFAULT_CSV_PATH, parseCsv } from "@/drizzle/seed/sales-csv";
import {
  buildDedupeIndex,
  buildSearchRequest,
  chunk,
  dedupeCandidates,
  type ExistingLead,
  MAX_PAGES_PER_QUERY,
  mapPlaceToRow,
  PLACES_FIELD_MASK,
  type RankedRow,
  SEARCH_CITIES,
  SEARCH_QUERIES,
  type SearchCity,
  type TextSearchResponse,
  toLeadCsv,
  toSkippedCsv,
} from "@/features/system/sales/lib/places-leads";

loadEnv({
  path: process.env.DOTENV_CONFIG_PATH ?? path.resolve(process.cwd(), ".env"),
});

const PLACES_ENDPOINT = "https://places.googleapis.com/v1/places:searchText";
const DEFAULT_OUT_DIR = path.join(
  path.dirname(DEFAULT_CSV_PATH),
  "places-batches",
);
const BATCH_PREFIX = "batch-";

const { values: args } = parseArgs({
  options: {
    out: { type: "string", default: DEFAULT_OUT_DIR },
    existing: { type: "string", multiple: true, default: [] },
    "batch-size": { type: "string", default: "10" },
    cities: {
      type: "string",
      default: SEARCH_CITIES.map((c) => c.key).join(","),
    },
    "max-pages": { type: "string", default: String(MAX_PAGES_PER_QUERY) },
    db: { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
  },
});

function selectedCities(): SearchCity[] {
  const keys = (args.cities ?? "")
    .split(",")
    .map((k) => k.trim().toLowerCase());
  const cities = SEARCH_CITIES.filter((c) => keys.includes(c.key));
  if (cities.length === 0) {
    throw new Error(
      `--cities must name at least one of: ${SEARCH_CITIES.map((c) => c.key).join(", ")}`,
    );
  }
  return cities;
}

function positiveInt(
  value: string | undefined,
  flag: string,
  max = Number.POSITIVE_INFINITY,
) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) {
    throw new Error(`${flag} must be a whole number between 1 and ${max}`);
  }
  return parsed;
}

async function searchPage(
  apiKey: string,
  query: string,
  city: SearchCity,
  pageToken?: string,
): Promise<TextSearchResponse> {
  const response = await fetch(PLACES_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": PLACES_FIELD_MASK,
    },
    body: JSON.stringify(buildSearchRequest(query, city, pageToken)),
  });

  if (!response.ok) {
    // The body explains quota/billing/key problems; it never echoes the key.
    const detail = await response.text();
    throw new Error(
      `Places search failed (${response.status}) for "${query}" in ${city.label}: ${detail.slice(0, 500)}`,
    );
  }
  return (await response.json()) as TextSearchResponse;
}

function readExistingCsvs(outDir: string): {
  leads: ExistingLead[];
  files: string[];
} {
  const previousBatches = existsSync(outDir)
    ? readdirSync(outDir)
        .filter((f) => f.startsWith(BATCH_PREFIX) && f.endsWith(".csv"))
        .map((f) => path.join(outDir, f))
    : [];
  const files = [
    DEFAULT_CSV_PATH,
    ...(args.existing ?? []),
    ...previousBatches,
  ].filter((file, i, all) => existsSync(file) && all.indexOf(file) === i);

  const leads = files.flatMap((file) =>
    parseCsv(readFileSync(file, "utf8")).map((r) => ({
      name: r.name,
      city: r.city,
      phone: r.phone_primary,
      phoneSecondary: r.phone_secondary,
      notes: r.notes,
    })),
  );
  return { leads, files };
}

/** Read-only: prospects already in the pipeline, wherever they came from. */
async function readExistingFromDb(): Promise<ExistingLead[]> {
  const { db, closeDbConnection } = await import("@/drizzle");
  const { LeadsTable } = await import("@/drizzle/schema");
  const { eq } = await import("drizzle-orm");
  try {
    const rows = await db
      .select({
        name: LeadsTable.name,
        city: LeadsTable.city,
        phone: LeadsTable.phone,
        phoneSecondary: LeadsTable.phoneSecondary,
        notes: LeadsTable.notes,
      })
      .from(LeadsTable)
      .where(eq(LeadsTable.kind, "prospect"));
    return rows.map((r) => ({
      name: r.name,
      city: r.city ?? undefined,
      phone: r.phone ?? undefined,
      phoneSecondary: r.phoneSecondary ?? undefined,
      notes: r.notes ?? undefined,
    }));
  } finally {
    await closeDbConnection();
  }
}

async function main() {
  const cities = selectedCities();
  const batchSize = positiveInt(args["batch-size"], "--batch-size");
  const maxPages = positiveInt(
    args["max-pages"],
    "--max-pages",
    MAX_PAGES_PER_QUERY,
  );
  const outDir = path.resolve(args.out ?? DEFAULT_OUT_DIR);
  const maxRequests = cities.length * SEARCH_QUERIES.length * maxPages;

  if (args["dry-run"]) {
    console.log(
      `Dry run: ${cities.length} cities × ${SEARCH_QUERIES.length} queries × up to ${maxPages} pages`,
    );
    console.log(
      `= at most ${maxRequests} Text Search requests (phone fields bill at the Enterprise SKU).`,
    );
    console.log(`Batches of ${batchSize} would be written to ${outDir}`);
    return;
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey)
    throw new Error("GOOGLE_PLACES_API_KEY is not set (see .env.example)");

  const candidates: RankedRow[] = [];
  const skipped = { closed: 0, no_phone: 0, out_of_area: 0 };
  let requests = 0;

  for (const city of cities) {
    for (const query of SEARCH_QUERIES) {
      let pageToken: string | undefined;
      for (let page = 0; page < maxPages; page++) {
        const result = await searchPage(apiKey, query, city, pageToken);
        requests++;
        for (const place of result.places ?? []) {
          const outcome = mapPlaceToRow(place);
          if (outcome.kind === "row") candidates.push(outcome);
          else skipped[outcome.reason]++;
        }
        pageToken = result.nextPageToken;
        if (!pageToken) break;
      }
    }
  }

  const fromCsv = readExistingCsvs(outDir);
  const fromDb = args.db ? await readExistingFromDb() : [];
  const index = buildDedupeIndex([...fromCsv.leads, ...fromDb]);
  const { fresh, duplicates } = dedupeCandidates(candidates, index);

  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const batches = chunk(fresh, batchSize);
  const written = batches.map((batch, i) => {
    const file = path.join(
      outDir,
      `${BATCH_PREFIX}${stamp}-${String(i + 1).padStart(3, "0")}.csv`,
    );
    writeFileSync(file, toLeadCsv(batch), "utf8");
    return file;
  });

  const skippedFile = path.join(outDir, `skipped-duplicates-${stamp}.csv`);
  writeFileSync(skippedFile, toSkippedCsv(duplicates), "utf8");

  console.log(`Places requests:      ${requests}`);
  console.log(`Listings with phone:  ${candidates.length}`);
  console.log(
    `Dropped:              ${skipped.closed} closed, ${skipped.no_phone} no phone, ${skipped.out_of_area} outside Cairo/Giza/Alexandria`,
  );
  console.log(
    `Deduped against:      ${fromCsv.files.length} CSV file(s)${args.db ? ` + ${fromDb.length} DB prospects` : ""}`,
  );
  console.log(
    `Duplicates skipped:   ${duplicates.length} (see ${skippedFile})`,
  );
  console.log(
    `New leads:            ${fresh.length} in ${written.length} batch file(s) of ${batchSize}`,
  );
  for (const file of written) console.log(`  ${file}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
