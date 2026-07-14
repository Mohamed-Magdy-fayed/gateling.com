CREATE TYPE "public"."block_type" AS ENUM('heading', 'paragraph', 'list', 'quote', 'image', 'video', 'gallery', 'before_after', 'device_player', 'stats', 'comparison', 'roi_embed', 'callout', 'cta');--> statement-breakpoint
CREATE TABLE "blog_post_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"type" "block_type" NOT NULL,
	"content_en" text,
	"content_ar" text,
	"data" jsonb,
	"media_id" uuid,
	"createdBy" varchar NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedBy" varchar,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "case_study_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"type" "block_type" NOT NULL,
	"content_en" text,
	"content_ar" text,
	"data" jsonb,
	"media_id" uuid,
	"createdBy" varchar NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedBy" varchar,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "blog_post_blocks" ADD CONSTRAINT "blog_post_blocks_parent_id_blog_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_blocks" ADD CONSTRAINT "blog_post_blocks_media_id_blog_post_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."blog_post_media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_study_blocks" ADD CONSTRAINT "case_study_blocks_parent_id_case_studies_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_study_blocks" ADD CONSTRAINT "case_study_blocks_media_id_case_study_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."case_study_media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blog_post_blocks_parent_sort_idx" ON "blog_post_blocks" USING btree ("parent_id","sort_order");--> statement-breakpoint
CREATE INDEX "case_study_blocks_parent_sort_idx" ON "case_study_blocks" USING btree ("parent_id","sort_order");