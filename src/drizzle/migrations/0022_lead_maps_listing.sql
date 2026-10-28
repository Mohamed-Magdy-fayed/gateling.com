ALTER TABLE "leads" ADD COLUMN "mapsEmbedSrc" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "mapsLat" double precision;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "mapsLng" double precision;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "mapsRating" real;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "mapsReviewCount" integer;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "mapsCategory" varchar(128);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "mapsCheckedAt" timestamp with time zone;