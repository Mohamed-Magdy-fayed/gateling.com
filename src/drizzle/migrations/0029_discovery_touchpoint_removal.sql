ALTER TABLE "discovery_touchpoints" ADD COLUMN "removedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "discovery_touchpoints" ADD COLUMN "removedBy" varchar;--> statement-breakpoint
ALTER TABLE "discovery_touchpoints" ADD COLUMN "removedReason" text;