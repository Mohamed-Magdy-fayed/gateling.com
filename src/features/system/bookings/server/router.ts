import { TRPCError } from "@trpc/server";
import { addDays, addMinutes } from "date-fns";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
} from "drizzle-orm";
import { z } from "zod";

import {
  BookingBlackoutsTable,
  BookingsTable,
  bookingStatusValues,
  UsersTable,
} from "@/drizzle/schema";
import { env } from "@/env/server";
import { getWebsiteMeetingHost } from "@/features/system/meetings/host";
import {
  bookingCancelledEvent,
  bookingConfirmedEvent,
  bookingRequestedEvent,
  inngest,
} from "@/integrations/inngest/client";
import { getMeetingsClient } from "@/integrations/meetings";
import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/integrations/trpc/init";

import { type BookingSettings, getBookingSettings } from "../lib/settings";
import {
  type BusyInterval,
  computeAvailability,
  hasBusyOverlap,
  isOpenSlot,
} from "../lib/slots";
import { bookingHostJoinLink } from "./meeting";

const MAX_CUSTOM_REQUEST_DAYS_AHEAD = 365;

const MAX_ACTIVE_BOOKINGS = 3;

function assertStaff(role: string) {
  if (role !== "admin" && role !== "employee")
    throw new TRPCError({ code: "FORBIDDEN" });
}

type Db = typeof import("@/drizzle").db;

async function getBusyIntervals(
  db: Db,
  settings: BookingSettings,
  now: Date,
): Promise<BusyInterval[]> {
  const horizonEnd = addDays(now, settings.maxDaysAhead + 1);
  const [bookings, blackouts] = await Promise.all([
    db
      .select({
        startsAt: BookingsTable.startsAt,
        endsAt: BookingsTable.endsAt,
      })
      .from(BookingsTable)
      .where(
        and(
          eq(BookingsTable.status, "confirmed"),
          gte(BookingsTable.endsAt, now),
          lte(BookingsTable.startsAt, horizonEnd),
        ),
      ),
    db
      .select({
        startsAt: BookingBlackoutsTable.startsAt,
        endsAt: BookingBlackoutsTable.endsAt,
      })
      .from(BookingBlackoutsTable)
      .where(
        and(
          gte(BookingBlackoutsTable.endsAt, now),
          lte(BookingBlackoutsTable.startsAt, horizonEnd),
        ),
      ),
  ]);
  return [...bookings, ...blackouts];
}

async function assertBookableSlot(
  db: Db,
  startsAt: Date,
  settings: BookingSettings,
): Promise<void> {
  if (!settings.enabled)
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "disabled" });
  const busy = await getBusyIntervals(db, settings, new Date());
  if (!isOpenSlot(startsAt, settings, busy))
    throw new TRPCError({ code: "CONFLICT", message: "slot_unavailable" });
}

async function assertActiveBookingsBelowCap(db: Db, userId: string) {
  const [{ total }] = await db
    .select({ total: count() })
    .from(BookingsTable)
    .where(
      and(
        eq(BookingsTable.userId, userId),
        inArray(BookingsTable.status, ["requested", "confirmed"]),
        gte(BookingsTable.startsAt, new Date()),
      ),
    );
  if (Number(total) >= MAX_ACTIVE_BOOKINGS)
    throw new TRPCError({ code: "FORBIDDEN", message: "too_many_bookings" });
}

const listBookingsInput = z.object({
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(100).default(20),
  sorting: z.array(z.object({ id: z.string(), desc: z.boolean() })).default([]),
  globalFilter: z.string().optional(),
  status: z
    .enum([...bookingStatusValues, "all"])
    .optional()
    .default("all"),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const bookingsRouter = createTRPCRouter({
  getAvailability: baseProcedure.query(async ({ ctx }) => {
    const settings = await getBookingSettings(ctx.db);
    if (!settings.enabled) {
      return {
        enabled: false as const,
        timezone: settings.timezone,
        slotMinutes: settings.slotMinutes,
        days: [],
      };
    }
    const now = new Date();
    const busy = await getBusyIntervals(ctx.db, settings, now);
    return {
      enabled: true as const,
      timezone: settings.timezone,
      slotMinutes: settings.slotMinutes,
      days: computeAvailability(settings, busy, now),
    };
  }),

  book: protectedProcedure
    .input(
      z.object({
        startsAt: z.date(),
        note: z.string().trim().max(1000).optional(),
        timezone: z.string().trim().max(64).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const settings = await getBookingSettings(ctx.db);
      await assertBookableSlot(ctx.db, input.startsAt, settings);
      await assertActiveBookingsBelowCap(ctx.db, ctx.session.user.id);

      const user = await ctx.db.query.UsersTable.findFirst({
        where: eq(UsersTable.id, ctx.session.user.id),
        columns: { name: true, email: true, phone: true },
      });
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const [booking] = await ctx.db
        .insert(BookingsTable)
        .values({
          userId: ctx.session.user.id,
          name: user.name ?? user.email,
          email: user.email,
          phone: user.phone,
          startsAt: input.startsAt,
          endsAt: addMinutes(input.startsAt, settings.slotMinutes),
          timezone: input.timezone || null,
          status: "confirmed",
          customerNote: input.note || null,
        })
        .returning({ id: BookingsTable.id });

      try {
        await inngest.send(
          bookingConfirmedEvent.create({
            bookingId: booking.id,
            startsAt: input.startsAt.toISOString(),
          }),
        );
      } catch {}
      return { bookingId: booking.id };
    }),

  requestCustomTime: protectedProcedure
    .input(
      z.object({
        preferredAt: z.date(),
        note: z.string().trim().min(1).max(1000),
        timezone: z.string().trim().max(64).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const settings = await getBookingSettings(ctx.db);
      if (!settings.enabled)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "disabled",
        });
      if (input.preferredAt <= new Date())
        throw new TRPCError({ code: "BAD_REQUEST", message: "past_time" });
      if (
        input.preferredAt > addDays(new Date(), MAX_CUSTOM_REQUEST_DAYS_AHEAD)
      )
        throw new TRPCError({ code: "BAD_REQUEST", message: "too_far_ahead" });
      await assertActiveBookingsBelowCap(ctx.db, ctx.session.user.id);

      const user = await ctx.db.query.UsersTable.findFirst({
        where: eq(UsersTable.id, ctx.session.user.id),
        columns: { name: true, email: true, phone: true },
      });
      if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const [booking] = await ctx.db
        .insert(BookingsTable)
        .values({
          userId: ctx.session.user.id,
          name: user.name ?? user.email,
          email: user.email,
          phone: user.phone,
          startsAt: input.preferredAt,
          endsAt: addMinutes(input.preferredAt, settings.slotMinutes),
          timezone: input.timezone || null,
          status: "requested",
          customerNote: input.note,
        })
        .returning({ id: BookingsTable.id });

      try {
        await inngest.send(
          bookingRequestedEvent.create({ bookingId: booking.id }),
        );
      } catch {}
      return { bookingId: booking.id };
    }),

  myBookings: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: BookingsTable.id,
        startsAt: BookingsTable.startsAt,
        endsAt: BookingsTable.endsAt,
        status: BookingsTable.status,
        customerNote: BookingsTable.customerNote,
        meetingGuestUrl: BookingsTable.meetingGuestUrl,
        createdAt: BookingsTable.createdAt,
      })
      .from(BookingsTable)
      .where(eq(BookingsTable.userId, ctx.session.user.id))
      .orderBy(desc(BookingsTable.startsAt));
  }),

  cancelMine: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.query.BookingsTable.findFirst({
        where: eq(BookingsTable.id, input.id),
      });
      if (!booking || booking.userId !== ctx.session.user.id)
        throw new TRPCError({ code: "NOT_FOUND" });
      if (booking.status !== "requested" && booking.status !== "confirmed")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "not_cancellable",
        });

      await ctx.db
        .update(BookingsTable)
        .set({ status: "cancelled", cancelledBy: "customer" })
        .where(eq(BookingsTable.id, input.id));
      try {
        await inngest.send(
          bookingCancelledEvent.create({
            bookingId: input.id,
            cancelledBy: "customer",
          }),
        );
      } catch {}
      return { cancelled: true };
    }),

  rescheduleMine: protectedProcedure
    .input(z.object({ id: z.string().uuid(), startsAt: z.date() }))
    .mutation(async ({ ctx, input }) => {
      const booking = await ctx.db.query.BookingsTable.findFirst({
        where: eq(BookingsTable.id, input.id),
      });
      if (!booking || booking.userId !== ctx.session.user.id)
        throw new TRPCError({ code: "NOT_FOUND" });
      if (booking.status !== "requested" && booking.status !== "confirmed")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "not_reschedulable",
        });

      const settings = await getBookingSettings(ctx.db);
      await assertBookableSlot(ctx.db, input.startsAt, settings);

      await ctx.db
        .update(BookingsTable)
        .set({
          startsAt: input.startsAt,
          endsAt: addMinutes(input.startsAt, settings.slotMinutes),
          status: "confirmed",
        })
        .where(eq(BookingsTable.id, input.id));
      try {
        await inngest.send(
          bookingConfirmedEvent.create({
            bookingId: input.id,
            startsAt: input.startsAt.toISOString(),
          }),
        );
      } catch {}
      return { rescheduled: true };
    }),

  list: protectedProcedure
    .input(listBookingsInput)
    .query(async ({ ctx, input }) => {
      assertStaff(ctx.session.user.role);
      const conditions: ReturnType<typeof eq>[] = [];
      if (input.status && input.status !== "all")
        conditions.push(eq(BookingsTable.status, input.status));
      if (input.from)
        conditions.push(gte(BookingsTable.startsAt, new Date(input.from)));
      if (input.to)
        conditions.push(lte(BookingsTable.startsAt, new Date(input.to)));

      let where = conditions.length > 0 ? and(...conditions) : undefined;
      if (input.globalFilter?.trim()) {
        const like = `%${input.globalFilter.trim()}%`;
        const textWhere = or(
          ilike(BookingsTable.name, like),
          ilike(BookingsTable.email, like),
        );
        where = where ? and(where, textWhere) : textWhere;
      }

      const [{ total }] = await ctx.db
        .select({ total: count() })
        .from(BookingsTable)
        .where(where);
      const pageCount = Math.max(1, Math.ceil(Number(total) / input.perPage));
      const page = Math.min(input.page, pageCount);
      const firstSort = input.sorting[0];
      const orderBy =
        firstSort?.id === "status"
          ? [
              firstSort.desc
                ? desc(BookingsTable.status)
                : asc(BookingsTable.status),
            ]
          : firstSort?.id === "startsAt" && !firstSort.desc
            ? [asc(BookingsTable.startsAt)]
            : [desc(BookingsTable.startsAt)];

      const rows = await ctx.db
        .select()
        .from(BookingsTable)
        .where(where)
        .orderBy(...orderBy)
        .limit(input.perPage)
        .offset((page - 1) * input.perPage);
      return { rows, pageCount, total: Number(total) };
    }),

  confirm: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      assertStaff(ctx.session.user.role);
      const booking = await ctx.db.query.BookingsTable.findFirst({
        where: eq(BookingsTable.id, input.id),
      });
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
      if (booking.status !== "requested")
        throw new TRPCError({ code: "BAD_REQUEST", message: "not_requested" });

      const settings = await getBookingSettings(ctx.db);
      const busy = await getBusyIntervals(ctx.db, settings, new Date());
      if (hasBusyOverlap(booking.startsAt, booking.endsAt, busy))
        throw new TRPCError({ code: "CONFLICT", message: "slot_unavailable" });

      await ctx.db
        .update(BookingsTable)
        .set({ status: "confirmed" })
        .where(eq(BookingsTable.id, input.id));
      try {
        await inngest.send(
          bookingConfirmedEvent.create({
            bookingId: input.id,
            startsAt: booking.startsAt.toISOString(),
          }),
        );
      } catch {}
      return { confirmed: true };
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      assertStaff(ctx.session.user.role);
      const booking = await ctx.db.query.BookingsTable.findFirst({
        where: eq(BookingsTable.id, input.id),
      });
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
      if (booking.status !== "requested" && booking.status !== "confirmed")
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "not_cancellable",
        });

      await ctx.db
        .update(BookingsTable)
        .set({ status: "cancelled", cancelledBy: "admin" })
        .where(eq(BookingsTable.id, input.id));
      try {
        await inngest.send(
          bookingCancelledEvent.create({
            bookingId: input.id,
            cancelledBy: "admin",
          }),
        );
      } catch {}
      return { cancelled: true };
    }),

  /**
   * Mint a single-use host link for the booking's Meetings room and hand it
   * to the browser. Never stored: Meetings expires it in minutes and burns it
   * on first use, so every click is a fresh mint.
   */
  hostJoinLink: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      assertStaff(ctx.session.user.role);
      const booking = await ctx.db.query.BookingsTable.findFirst({
        where: eq(BookingsTable.id, input.id),
        columns: { status: true, meetingCode: true },
      });
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
      if (booking.status !== "confirmed" || !booking.meetingCode)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "no_meeting",
        });
      const client = getMeetingsClient();
      if (!client)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "meetings_not_configured",
        });

      const link = await bookingHostJoinLink(
        client,
        booking.meetingCode,
        await getWebsiteMeetingHost(ctx.db),
        `${env.BASE_URL}/bookings`,
      );
      // Audit: Meetings only ever sees the shared host identity, so this is
      // the one record of which person joined which customer's call as host.
      console.info("meetings.host_link_minted", {
        userId: ctx.session.user.id,
        bookingId: input.id,
        meetingCode: booking.meetingCode,
      });
      return { url: link.url, expiresAt: link.expiresAt };
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(["completed", "no_show"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      assertStaff(ctx.session.user.role);
      const booking = await ctx.db.query.BookingsTable.findFirst({
        where: eq(BookingsTable.id, input.id),
      });
      if (!booking) throw new TRPCError({ code: "NOT_FOUND" });
      if (booking.status !== "confirmed" || booking.endsAt > new Date())
        throw new TRPCError({ code: "BAD_REQUEST", message: "not_past_due" });

      await ctx.db
        .update(BookingsTable)
        .set({ status: input.status })
        .where(eq(BookingsTable.id, input.id));
      return { updated: true };
    }),

  blackouts: {
    list: protectedProcedure.query(async ({ ctx }) => {
      assertStaff(ctx.session.user.role);
      return ctx.db
        .select()
        .from(BookingBlackoutsTable)
        .where(gte(BookingBlackoutsTable.endsAt, new Date()))
        .orderBy(asc(BookingBlackoutsTable.startsAt));
    }),

    create: protectedProcedure
      .input(
        z
          .object({
            startsAt: z.date(),
            endsAt: z.date(),
            reason: z.string().trim().max(255).optional(),
          })
          .refine((val) => val.endsAt > val.startsAt, {
            message: "invalid_range",
          }),
      )
      .mutation(async ({ ctx, input }) => {
        assertStaff(ctx.session.user.role);
        const [row] = await ctx.db
          .insert(BookingBlackoutsTable)
          .values({
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            reason: input.reason || null,
            createdBy: ctx.session.user.id,
          })
          .returning({ id: BookingBlackoutsTable.id });
        return { id: row.id };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        assertStaff(ctx.session.user.role);
        await ctx.db
          .delete(BookingBlackoutsTable)
          .where(eq(BookingBlackoutsTable.id, input.id));
        return { deleted: true };
      }),
  },
});
