ALTER TYPE "public"."user_token_type" ADD VALUE 'magic_link';--> statement-breakpoint
ALTER TABLE "case_studies" ADD COLUMN "client_user_id" uuid;--> statement-breakpoint
ALTER TABLE "case_studies" ADD CONSTRAINT "case_studies_client_user_id_users_id_fk" FOREIGN KEY ("client_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "case_studies_client_user_idx" ON "case_studies" USING btree ("client_user_id");