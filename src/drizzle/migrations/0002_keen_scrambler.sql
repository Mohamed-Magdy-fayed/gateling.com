ALTER TABLE "testimonials" ADD COLUMN "rating" integer;--> statement-breakpoint
ALTER TABLE "testimonials" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "testimonials_user_idx" ON "testimonials" USING btree ("user_id");