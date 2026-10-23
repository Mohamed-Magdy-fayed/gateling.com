import { and, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/drizzle";
import { LeadsTable, UsersTable } from "@/drizzle/schema";
import { inngest, userEmailVerifiedEvent } from "../client";

/** `leads.source` for leads created from a verified self-signup. */
export const SIGNUP_LEAD_SOURCE = "signup";

/**
 * A customer who verified their email becomes an inbound lead in `/leads`.
 *
 * Verification, not sign-up, is the trigger: the sign-up form is bot-guarded,
 * but only a person who opened the email has shown the address is theirs.
 * Idempotent per email — re-verifying, or an existing contact-form lead from
 * the same address, never creates a second row.
 */
export const onUserEmailVerified = inngest.createFunction(
  {
    id: "on-user-email-verified",
    triggers: [userEmailVerifiedEvent],
    // Events are delivered at least once and a user can verify twice in quick
    // succession; one run per user keeps the check-then-insert below safe.
    idempotency: "event.data.userId",
  },
  async ({ event }) => {
    const user = await db.query.UsersTable.findFirst({
      where: and(
        eq(UsersTable.id, event.data.userId),
        isNull(UsersTable.deletedAt),
      ),
      columns: {
        name: true,
        email: true,
        phone: true,
        role: true,
        emailVerifiedAt: true,
      },
    });

    if (!user || user.role !== "customer" || !user.emailVerifiedAt) {
      return { skipped: "not a verified customer" };
    }

    const email = user.email.toLowerCase();
    const existing = await db.query.LeadsTable.findFirst({
      columns: { id: true },
      where: and(
        eq(LeadsTable.kind, "inbound"),
        sql`lower(${LeadsTable.email}) = ${email}`,
      ),
    });
    if (existing) return { skipped: "lead exists", leadId: existing.id };

    const [lead] = await db
      .insert(LeadsTable)
      .values({
        kind: "inbound",
        name: user.name?.trim() || email,
        email,
        phone: user.phone,
        source: SIGNUP_LEAD_SOURCE,
      })
      .returning({ id: LeadsTable.id });

    return { created: lead.id };
  },
);
