import { index, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

import { createdAt, createdBy, id } from "@/drizzle/schemas/helpers";

export const BookingBlackoutsTable = pgTable(
  "booking_blackouts",
  {
    id,
    startsAt: timestamp({ withTimezone: true }).notNull(),
    endsAt: timestamp({ withTimezone: true }).notNull(),
    reason: varchar({ length: 255 }),
    createdBy,
    createdAt,
  },
  (table) => [index("booking_blackouts_starts_at_idx").on(table.startsAt)],
);

export type BookingBlackout = typeof BookingBlackoutsTable.$inferSelect;
export type NewBookingBlackout = typeof BookingBlackoutsTable.$inferInsert;
