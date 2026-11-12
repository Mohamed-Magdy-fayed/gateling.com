CREATE TYPE "public"."discovery_commitment_status" AS ENUM('promised', 'paid', 'refunded', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."discovery_commitment_type" AS ENUM('deposit', 'pre_order', 'price_accepted', 'argued_price', 'argued_need');--> statement-breakpoint
CREATE TYPE "public"."discovery_contact_kind" AS ENUM('person', 'business');--> statement-breakpoint
CREATE TYPE "public"."discovery_contact_role" AS ENUM('owner', 'staff', 'relative', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."discovery_channel" AS ENUM('facebook', 'instagram', 'whatsapp', 'phone', 'in_person', 'group_forum', 'linkedin', 'other');--> statement-breakpoint
CREATE TYPE "public"."discovery_persona" AS ENUM('personal', 'gateling');--> statement-breakpoint
CREATE TYPE "public"."discovery_step" AS ENUM('problem', 'prototype', 'payment', 'mvp', 'measure', 'distribution');--> statement-breakpoint
CREATE TYPE "public"."discovery_study_status" AS ENUM('active', 'go', 'fix_pitch', 'killed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."discovery_evidence_kind" AS ENUM('incident', 'workaround_tool', 'cost_loss', 'money_commitment', 'compliment', 'other_pain');--> statement-breakpoint
CREATE TYPE "public"."discovery_stance" AS ENUM('supports', 'contradicts');--> statement-breakpoint
CREATE TYPE "public"."discovery_hypothesis_measure" AS ENUM('supporting_contacts', 'commitments', 'manual');--> statement-breakpoint
CREATE TYPE "public"."discovery_verdict" AS ENUM('open', 'true', 'false');--> statement-breakpoint
CREATE TYPE "public"."discovery_direction" AS ENUM('outbound', 'inbound');--> statement-breakpoint
CREATE TYPE "public"."discovery_source" AS ENUM('manual', 'share', 'paste', 'mcp', 'meta_webhook');--> statement-breakpoint
CREATE TYPE "public"."discovery_touchpoint_format" AS ENUM('dm', 'comment', 'post', 'call', 'meeting', 'voice_note');--> statement-breakpoint
CREATE TABLE "discovery_commitments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"studyId" uuid NOT NULL,
	"contactId" uuid NOT NULL,
	"type" "discovery_commitment_type" NOT NULL,
	"status" "discovery_commitment_status" DEFAULT 'promised' NOT NULL,
	"amountEgp" integer,
	"priceQuoted" varchar(255),
	"note" text,
	"createdBy" varchar NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "discovery_contact_handles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contactId" uuid NOT NULL,
	"channel" "discovery_channel" NOT NULL,
	"url" varchar(2048),
	"handle" varchar(255),
	"externalId" varchar(255),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discovery_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "discovery_contact_kind" DEFAULT 'business' NOT NULL,
	"displayName" varchar(255) NOT NULL,
	"businessName" varchar(255),
	"phone" varchar(32),
	"city" varchar(128),
	"role" "discovery_contact_role" DEFAULT 'unknown' NOT NULL,
	"leadId" uuid,
	"notes" text,
	"createdBy" varchar NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "discovery_evidence_hypotheses" (
	"evidenceId" uuid NOT NULL,
	"hypothesisId" uuid NOT NULL,
	"stance" "discovery_stance" DEFAULT 'supports' NOT NULL,
	CONSTRAINT "discovery_evidence_hypotheses_evidenceId_hypothesisId_pk" PRIMARY KEY("evidenceId","hypothesisId")
);
--> statement-breakpoint
CREATE TABLE "discovery_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"studyId" uuid NOT NULL,
	"contactId" uuid NOT NULL,
	"touchpointId" uuid,
	"kind" "discovery_evidence_kind" NOT NULL,
	"quote" text NOT NULL,
	"note" text,
	"amountEgp" integer,
	"createdBy" varchar NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discovery_hypotheses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"studyId" uuid NOT NULL,
	"code" varchar(16) NOT NULL,
	"statement" text NOT NULL,
	"passRule" text NOT NULL,
	"passThreshold" integer DEFAULT 5 NOT NULL,
	"measure" "discovery_hypothesis_measure" DEFAULT 'supporting_contacts' NOT NULL,
	"verdict" "discovery_verdict" DEFAULT 'open' NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discovery_studies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"niche" varchar(255) NOT NULL,
	"problemStatement" text NOT NULL,
	"step" "discovery_step" DEFAULT 'problem' NOT NULL,
	"status" "discovery_study_status" DEFAULT 'active' NOT NULL,
	"targetConversations" integer DEFAULT 10 NOT NULL,
	"goMinCommitments" integer DEFAULT 3 NOT NULL,
	"killMinStories" integer DEFAULT 3 NOT NULL,
	"priceQuoted" varchar(255),
	"decisionNote" text,
	"createdBy" varchar NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "discovery_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"studyId" uuid,
	"step" "discovery_step" DEFAULT 'problem' NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "discovery_touchpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"studyId" uuid NOT NULL,
	"contactId" uuid NOT NULL,
	"channel" "discovery_channel" NOT NULL,
	"format" "discovery_touchpoint_format" DEFAULT 'dm' NOT NULL,
	"direction" "discovery_direction" DEFAULT 'outbound' NOT NULL,
	"persona" "discovery_persona" DEFAULT 'personal' NOT NULL,
	"templateId" uuid,
	"url" varchar(2048),
	"message" text,
	"replyText" text,
	"occurredAt" timestamp with time zone DEFAULT now() NOT NULL,
	"repliedAt" timestamp with time zone,
	"source" "discovery_source" DEFAULT 'manual' NOT NULL,
	"externalId" varchar(255),
	"webhookEventId" uuid,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"createdBy" varchar NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "discovery_commitments" ADD CONSTRAINT "discovery_commitments_studyId_discovery_studies_id_fk" FOREIGN KEY ("studyId") REFERENCES "public"."discovery_studies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_commitments" ADD CONSTRAINT "discovery_commitments_contactId_discovery_contacts_id_fk" FOREIGN KEY ("contactId") REFERENCES "public"."discovery_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_contact_handles" ADD CONSTRAINT "discovery_contact_handles_contactId_discovery_contacts_id_fk" FOREIGN KEY ("contactId") REFERENCES "public"."discovery_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_contacts" ADD CONSTRAINT "discovery_contacts_leadId_leads_id_fk" FOREIGN KEY ("leadId") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_evidence_hypotheses" ADD CONSTRAINT "discovery_evidence_hypotheses_evidenceId_discovery_evidence_id_fk" FOREIGN KEY ("evidenceId") REFERENCES "public"."discovery_evidence"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_evidence_hypotheses" ADD CONSTRAINT "discovery_evidence_hypotheses_hypothesisId_discovery_hypotheses_id_fk" FOREIGN KEY ("hypothesisId") REFERENCES "public"."discovery_hypotheses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_evidence" ADD CONSTRAINT "discovery_evidence_studyId_discovery_studies_id_fk" FOREIGN KEY ("studyId") REFERENCES "public"."discovery_studies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_evidence" ADD CONSTRAINT "discovery_evidence_contactId_discovery_contacts_id_fk" FOREIGN KEY ("contactId") REFERENCES "public"."discovery_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_evidence" ADD CONSTRAINT "discovery_evidence_touchpointId_discovery_touchpoints_id_fk" FOREIGN KEY ("touchpointId") REFERENCES "public"."discovery_touchpoints"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_hypotheses" ADD CONSTRAINT "discovery_hypotheses_studyId_discovery_studies_id_fk" FOREIGN KEY ("studyId") REFERENCES "public"."discovery_studies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_templates" ADD CONSTRAINT "discovery_templates_studyId_discovery_studies_id_fk" FOREIGN KEY ("studyId") REFERENCES "public"."discovery_studies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_touchpoints" ADD CONSTRAINT "discovery_touchpoints_studyId_discovery_studies_id_fk" FOREIGN KEY ("studyId") REFERENCES "public"."discovery_studies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_touchpoints" ADD CONSTRAINT "discovery_touchpoints_contactId_discovery_contacts_id_fk" FOREIGN KEY ("contactId") REFERENCES "public"."discovery_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_touchpoints" ADD CONSTRAINT "discovery_touchpoints_templateId_discovery_templates_id_fk" FOREIGN KEY ("templateId") REFERENCES "public"."discovery_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discovery_touchpoints" ADD CONSTRAINT "discovery_touchpoints_webhookEventId_webhook_events_id_fk" FOREIGN KEY ("webhookEventId") REFERENCES "public"."webhook_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "discovery_commitments_study_idx" ON "discovery_commitments" USING btree ("studyId");--> statement-breakpoint
CREATE INDEX "discovery_contact_handles_contact_idx" ON "discovery_contact_handles" USING btree ("contactId");--> statement-breakpoint
CREATE INDEX "discovery_contact_handles_url_idx" ON "discovery_contact_handles" USING btree ("url");--> statement-breakpoint
CREATE UNIQUE INDEX "discovery_contact_handles_external_uq" ON "discovery_contact_handles" USING btree ("channel","externalId");--> statement-breakpoint
CREATE INDEX "discovery_contacts_name_idx" ON "discovery_contacts" USING btree ("displayName");--> statement-breakpoint
CREATE INDEX "discovery_contacts_lead_idx" ON "discovery_contacts" USING btree ("leadId");--> statement-breakpoint
CREATE INDEX "discovery_evidence_study_idx" ON "discovery_evidence" USING btree ("studyId");--> statement-breakpoint
CREATE INDEX "discovery_evidence_contact_idx" ON "discovery_evidence" USING btree ("contactId");--> statement-breakpoint
CREATE INDEX "discovery_hypotheses_study_idx" ON "discovery_hypotheses" USING btree ("studyId");--> statement-breakpoint
CREATE INDEX "discovery_templates_study_idx" ON "discovery_templates" USING btree ("studyId");--> statement-breakpoint
CREATE INDEX "discovery_touchpoints_study_idx" ON "discovery_touchpoints" USING btree ("studyId","occurredAt");--> statement-breakpoint
CREATE INDEX "discovery_touchpoints_contact_idx" ON "discovery_touchpoints" USING btree ("contactId","occurredAt");--> statement-breakpoint
CREATE UNIQUE INDEX "discovery_touchpoints_external_uq" ON "discovery_touchpoints" USING btree ("source","externalId");