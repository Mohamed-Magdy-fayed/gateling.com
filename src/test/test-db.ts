import { readFileSync } from "node:fs";
import path from "node:path";

import { parse } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { describe } from "vitest";

import * as schema from "@/drizzle/schema";

/**
 * Database-backed tests run only against `TEST_DATABASE_URL` — a throwaway
 * local container or a Neon branch, migrated with `npm run db:migrate`.
 * Without it they are skipped, so `npx vitest run` stays DB-free.
 *
 * `.env` points at the production database, so this refuses any URL whose
 * host matches it: a test suite that writes and truncates must never get
 * there by a copy-paste.
 */
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

function hostOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function productionHost(): string | null {
  try {
    const file = readFileSync(path.resolve(process.cwd(), ".env"), "utf8");
    return hostOf(parse(file).DATABASE_URL);
  } catch {
    return null;
  }
}

function connect() {
  if (!TEST_DATABASE_URL) throw new Error("TEST_DATABASE_URL is not set");
  const host = hostOf(TEST_DATABASE_URL);
  if (!host) throw new Error("TEST_DATABASE_URL is not a valid URL");
  if (host === productionHost()) {
    throw new Error(
      `TEST_DATABASE_URL points at the .env database host (${host}). Use a local container or a Neon branch.`,
    );
  }
  const conn = postgres(TEST_DATABASE_URL, { max: 2, onnotice: () => {} });
  return { db: drizzle(conn, { schema }), close: () => conn.end() };
}

/** `describe` when a test database is configured, `describe.skip` otherwise. */
export const describeWithDb = TEST_DATABASE_URL ? describe : describe.skip;

export const connectTestDb = connect;
