import { index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { UsersTable } from "@/drizzle/schemas/auth/users-table";
import { createdAt, createdBy, id } from "@/drizzle/schemas/helpers";

/**
 * Bearer keys for machine clients (the content MCP server). The key itself
 * is shown once at creation and never stored: `keyPrefix` is the clear-text
 * lookup column, `keyHash` the SHA-256 of the whole key. Every key acts as
 * the user who owns it, so it can never do more than that user can, and
 * demoting or deleting the user switches the key off.
 */
export const ApiKeysTable = pgTable(
  "api_keys",
  {
    id,
    name: varchar({ length: 100 }).notNull(),
    keyPrefix: varchar({ length: 16 }).notNull().unique(),
    keyHash: varchar({ length: 64 }).notNull(),
    userId: uuid()
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    lastUsedAt: timestamp({ withTimezone: true }),
    revokedAt: timestamp({ withTimezone: true }),
    createdBy,
    createdAt,
  },
  (table) => [index("api_keys_user_id_idx").on(table.userId)],
);

export type ApiKey = typeof ApiKeysTable.$inferSelect;
