CREATE TYPE "public"."media_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TABLE "blog_post_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blog_post_id" uuid NOT NULL,
	"type" "media_type" DEFAULT 'image' NOT NULL,
	"url" varchar(1024) NOT NULL,
	"title" varchar(255),
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_secondary" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"createdBy" varchar NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedBy" varchar,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "case_study_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_study_id" uuid NOT NULL,
	"type" "media_type" DEFAULT 'image' NOT NULL,
	"url" varchar(1024) NOT NULL,
	"title" varchar(255),
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_secondary" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"createdBy" varchar NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedBy" varchar,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "service_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"type" "media_type" DEFAULT 'image' NOT NULL,
	"url" varchar(1024) NOT NULL,
	"title" varchar(255),
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_secondary" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"createdBy" varchar NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedBy" varchar,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "coverImageUrl" varchar(1024);--> statement-breakpoint
ALTER TABLE "blog_post_media" ADD CONSTRAINT "blog_post_media_blog_post_id_blog_posts_id_fk" FOREIGN KEY ("blog_post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_study_media" ADD CONSTRAINT "case_study_media_case_study_id_case_studies_id_fk" FOREIGN KEY ("case_study_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_media" ADD CONSTRAINT "service_media_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blog_post_media_blog_post_idx" ON "blog_post_media" USING btree ("blog_post_id");--> statement-breakpoint
CREATE INDEX "blog_post_media_featured_idx" ON "blog_post_media" USING btree ("blog_post_id","is_featured");--> statement-breakpoint
CREATE INDEX "case_study_media_case_study_idx" ON "case_study_media" USING btree ("case_study_id");--> statement-breakpoint
CREATE INDEX "case_study_media_featured_idx" ON "case_study_media" USING btree ("case_study_id","is_featured");--> statement-breakpoint
CREATE INDEX "service_media_service_idx" ON "service_media" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "service_media_featured_idx" ON "service_media" USING btree ("service_id","is_featured");