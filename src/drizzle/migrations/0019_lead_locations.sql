CREATE TABLE "lead_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"leadId" uuid NOT NULL,
	"isPrimary" boolean DEFAULT false NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text,
	"category" varchar(128),
	"rating" real,
	"reviewCount" integer,
	"lat" double precision,
	"lng" double precision,
	"embedSrc" text,
	"checkedAt" timestamp with time zone,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone,
	"updatedBy" varchar
);
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "whatsappPhone" varchar(32);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "whatsappIsBusiness" boolean;--> statement-breakpoint
ALTER TABLE "lead_locations" ADD CONSTRAINT "lead_locations_leadId_leads_id_fk" FOREIGN KEY ("leadId") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_locations_lead_id_idx" ON "lead_locations" USING btree ("leadId");--> statement-breakpoint
CREATE UNIQUE INDEX "lead_locations_one_primary_idx" ON "lead_locations" USING btree ("leadId") WHERE "lead_locations"."isPrimary";