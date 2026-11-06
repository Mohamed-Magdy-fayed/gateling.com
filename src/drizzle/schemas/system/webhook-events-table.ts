import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { createdAt, id } from "@/drizzle/schemas/helpers";

/**
 * Raw inbound webhook deliveries, stored verbatim before any processing.
 *
 * Capture comes first because some deliveries happen once (WhatsApp history
 * sync at onboarding): a later ingest step replays unprocessed rows, so a
 * processing bug never loses data. Holds third-party PII — readable only by a
 * DB query; no UI or API exposes `payload`.
 *
 * `payloadHash` (sha256 of the raw body) dedupes provider retries, which
 * resend the identical body.
 */
export const WebhookEventsTable = pgTable(
  "webhook_events",
  {
    id,
    source: varchar({ length: 32 }).notNull(),
    object: varchar({ length: 64 }),
    payloadHash: varchar({ length: 64 }).notNull().unique(),
    payload: jsonb().$type<unknown>().notNull(),
    processedAt: timestamp({ withTimezone: true }),
    error: text(),
    createdAt,
  },
  (table) => [
    index("webhook_events_unprocessed_idx").on(table.source, table.processedAt),
  ],
);

export type WebhookEvent = typeof WebhookEventsTable.$inferSelect;
export type NewWebhookEvent = typeof WebhookEventsTable.$inferInsert;
