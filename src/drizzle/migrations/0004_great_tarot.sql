ALTER TABLE "blog_posts" ADD COLUMN "titleAr" varchar(255);--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "excerptAr" varchar(512);--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "contentAr" text;--> statement-breakpoint
ALTER TABLE "case_studies" ADD COLUMN "titleAr" varchar(255);--> statement-breakpoint
ALTER TABLE "case_studies" ADD COLUMN "clientAr" varchar(255);--> statement-breakpoint
ALTER TABLE "case_studies" ADD COLUMN "industryAr" varchar(128);--> statement-breakpoint
ALTER TABLE "case_studies" ADD COLUMN "problemStatementAr" text;--> statement-breakpoint
ALTER TABLE "case_studies" ADD COLUMN "solutionAr" text;--> statement-breakpoint
ALTER TABLE "case_studies" ADD COLUMN "resultsAr" jsonb;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "titleAr" varchar(255);--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "shortDescriptionAr" varchar(512);--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "fullDescriptionAr" varchar(2048);--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "featuresAr" jsonb;--> statement-breakpoint
ALTER TABLE "testimonials" ADD COLUMN "roleAr" varchar(128);--> statement-breakpoint
ALTER TABLE "testimonials" ADD COLUMN "contentAr" varchar(1024);