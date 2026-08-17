import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { createdBy, id } from "@/drizzle/schemas/helpers";
import { LeadsTable } from "@/drizzle/schemas/portfolio/leads-table";

/**
 * APPEND-ONLY. Rows are never updated or deleted.
 *
 * This log is what makes the Today view trustworthy: every bucket is derived
 * from it, so a row that can be edited after the fact is a row that can quietly
 * change who you are told to call. The sales service layer deliberately exposes
 * no update or delete function for activities.
 *
 * A promise made (`nextActionAt`) is discharged by setting `nextActionDoneAt`
 * on that same row — the one permitted write, and the only one, because the
 * alternative is either mutating history or never being able to close a
 * commitment. Everything else is expressed by appending a new row.
 */

export const leadActivityTypeValues = [
  "call",
  "no_answer",
  "call_unclear",
  "whatsapp_sent",
  "whatsapp_reply",
  "demo_agreed",
  "demo_scheduled",
  "demo_done",
  "note",
  "status_change",
] as const;
export type LeadActivityType = (typeof leadActivityTypeValues)[number];
export const leadActivityTypeEnum = pgEnum(
  "lead_activity_type",
  leadActivityTypeValues,
);

export const leadActivityChannelValues = [
  "phone",
  "whatsapp",
  "email",
  "in_person",
] as const;
export type LeadActivityChannel = (typeof leadActivityChannelValues)[number];
export const leadActivityChannelEnum = pgEnum(
  "lead_activity_channel",
  leadActivityChannelValues,
);

export const LeadActivitiesTable = pgTable(
  "lead_activities",
  {
    id,
    leadId: uuid()
      .notNull()
      .references(() => LeadsTable.id, { onDelete: "cascade" }),
    type: leadActivityTypeEnum().notNull(),
    channel: leadActivityChannelEnum(),
    /**
     * When the thing actually happened, not when it was typed in. Defaults to
     * now but is user-editable — calls get logged after the fact, and a log
     * that forces "now" would corrupt every day-based rule downstream.
     */
    occurredAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    outcome: text(),
    notes: text(),
    /** When the next follow-up was promised. Null when nothing was promised. */
    nextActionAt: timestamp({ withTimezone: true }),
    /** Set when that promise is kept; until then the lead counts as overdue. */
    nextActionDoneAt: timestamp({ withTimezone: true }),
    createdBy,
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // The timeline query and every derived-value recompute read this order.
    index("lead_activities_lead_id_occurred_at_idx").on(
      table.leadId,
      table.occurredAt,
    ),
    index("lead_activities_type_idx").on(table.type),
    index("lead_activities_next_action_at_idx").on(table.nextActionAt),
  ],
);

export type LeadActivity = typeof LeadActivitiesTable.$inferSelect;
export type NewLeadActivity = typeof LeadActivitiesTable.$inferInsert;
