import { sql } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { UsersTable } from "@/drizzle/schemas/auth/users-table";
import { id } from "@/drizzle/schemas/helpers";

export const bookingStatusValues = [
  "requested",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
] as const;
export type BookingStatus = (typeof bookingStatusValues)[number];
export const bookingStatusEnum = pgEnum("booking_status", bookingStatusValues);

export const bookingCancelledByValues = ["customer", "admin"] as const;
export type BookingCancelledBy = (typeof bookingCancelledByValues)[number];
export const bookingCancelledByEnum = pgEnum(
  "booking_cancelled_by",
  bookingCancelledByValues,
);

export const BookingsTable = pgTable(
  "bookings",
  {
    id,
    userId: uuid()
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 256 }).notNull(),
    phone: varchar({ length: 32 }),
    startsAt: timestamp({ withTimezone: true }).notNull(),
    endsAt: timestamp({ withTimezone: true }).notNull(),
    /** IANA timezone of the customer's browser at booking time, for emails */
    timezone: varchar({ length: 64 }),
    status: bookingStatusEnum().notNull().default("requested"),
    customerNote: text(),
    cancelledBy: bookingCancelledByEnum(),
    /** Gateling Meetings room provisioned for this booking (externalRef `booking:<id>`). */
    meetingCode: varchar({ length: 12 }),
    /** The room's guest link, put in customer emails and My Account. */
    meetingGuestUrl: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  },
  (table) => [
    index("bookings_user_id_idx").on(table.userId),
    index("bookings_status_idx").on(table.status),
    index("bookings_starts_at_idx").on(table.startsAt),
    index("bookings_meeting_code_idx").on(table.meetingCode),
    uniqueIndex("bookings_confirmed_starts_at_uq")
      .on(table.startsAt)
      .where(sql`${table.status} = 'confirmed'`),
  ],
);

export type Booking = typeof BookingsTable.$inferSelect;
export type NewBooking = typeof BookingsTable.$inferInsert;
