CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" varchar(32) NOT NULL,
	"object" varchar(64),
	"payloadHash" varchar(64) NOT NULL,
	"payload" jsonb NOT NULL,
	"processedAt" timestamp with time zone,
	"error" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_events_payloadHash_unique" UNIQUE("payloadHash")
);
--> statement-breakpoint
CREATE INDEX "webhook_events_unprocessed_idx" ON "webhook_events" USING btree ("source","processedAt");