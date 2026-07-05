CREATE TYPE "public"."booking_cancelled_by" AS ENUM('customer', 'admin');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('requested', 'confirmed', 'cancelled', 'completed', 'no_show');--> statement-breakpoint
CREATE TABLE "booking_blackouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"startsAt" timestamp with time zone NOT NULL,
	"endsAt" timestamp with time zone NOT NULL,
	"reason" varchar(255),
	"createdBy" varchar NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(256) NOT NULL,
	"phone" varchar(32),
	"startsAt" timestamp with time zone NOT NULL,
	"endsAt" timestamp with time zone NOT NULL,
	"status" "booking_status" DEFAULT 'requested' NOT NULL,
	"customerNote" text,
	"cancelledBy" "booking_cancelled_by",
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_blackouts_starts_at_idx" ON "booking_blackouts" USING btree ("startsAt");--> statement-breakpoint
CREATE INDEX "bookings_user_id_idx" ON "bookings" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bookings_starts_at_idx" ON "bookings" USING btree ("startsAt");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_confirmed_starts_at_uq" ON "bookings" USING btree ("startsAt") WHERE "bookings"."status" = 'confirmed';