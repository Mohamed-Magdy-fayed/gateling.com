ALTER TABLE "bookings" ADD COLUMN "meetingCode" varchar(12);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "meetingGuestUrl" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "demoMeetingCode" varchar(12);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "demoMeetingUrl" text;--> statement-breakpoint
CREATE INDEX "bookings_meeting_code_idx" ON "bookings" USING btree ("meetingCode");