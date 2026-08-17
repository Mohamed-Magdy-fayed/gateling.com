CREATE TYPE "public"."lead_activity_channel" AS ENUM('phone', 'whatsapp', 'email', 'in_person');--> statement-breakpoint
CREATE TYPE "public"."lead_activity_type" AS ENUM('call', 'no_answer', 'call_unclear', 'whatsapp_sent', 'whatsapp_reply', 'demo_agreed', 'demo_scheduled', 'demo_done', 'note', 'status_change');--> statement-breakpoint
CREATE TYPE "public"."lead_kind" AS ENUM('inbound', 'prospect');--> statement-breakpoint
CREATE TYPE "public"."lead_pipeline_status" AS ENUM('new', 'contacted', 'awaiting_reply', 'callback_scheduled', 'demo_agreed', 'demo_scheduled', 'demo_done', 'won', 'lost', 'parked', 'blocked_no_number');--> statement-breakpoint
CREATE TYPE "public"."lead_tier" AS ENUM('A', 'B', 'C');--> statement-breakpoint
CREATE TYPE "public"."whatsapp_status" AS ENUM('confirmed', 'not_confirmed', 'unknown');--> statement-breakpoint
CREATE TABLE "lead_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"leadId" uuid NOT NULL,
	"type" "lead_activity_type" NOT NULL,
	"channel" "lead_activity_channel",
	"occurredAt" timestamp with time zone DEFAULT now() NOT NULL,
	"outcome" text,
	"notes" text,
	"nextActionAt" timestamp with time zone,
	"nextActionDoneAt" timestamp with time zone,
	"createdBy" varchar NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "message" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "kind" "lead_kind" DEFAULT 'inbound' NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "pipelineStatus" "lead_pipeline_status" DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "nameAr" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "city" varchar(128);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "area" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "phoneSecondary" varchar(32);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "whatsappStatus" "whatsapp_status" DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "whatsappProfileName" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "tier" "lead_tier";--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "socialPlatform" varchar(64);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "socialHandle" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "socialFollowers" integer;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "branchCount" integer;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "businessType" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "sourceUrl" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "doNotContact" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "ownerId" uuid;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "lastContactedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "followUpCount" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "nextActionAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "updatedBy" varchar;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_leadId_leads_id_fk" FOREIGN KEY ("leadId") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_activities_lead_id_occurred_at_idx" ON "lead_activities" USING btree ("leadId","occurredAt");--> statement-breakpoint
CREATE INDEX "lead_activities_type_idx" ON "lead_activities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "lead_activities_next_action_at_idx" ON "lead_activities" USING btree ("nextActionAt");--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "leads_kind_pipeline_status_idx" ON "leads" USING btree ("kind","pipelineStatus");--> statement-breakpoint
CREATE INDEX "leads_next_action_at_idx" ON "leads" USING btree ("nextActionAt");--> statement-breakpoint
CREATE INDEX "leads_last_contacted_at_idx" ON "leads" USING btree ("lastContactedAt");--> statement-breakpoint
CREATE INDEX "leads_phone_idx" ON "leads" USING btree ("phone");