-- Drift repair, hand-written by design (see docs/decisions/adr-0007-drop-orphan-subscriber-segment.md).
-- Production carries objects from an abandoned branch's migration (0010_married_randall, never merged)
-- that the schema and snapshots never knew, so `drizzle-kit generate` has no diff to emit drops from.
-- IF EXISTS keeps this a no-op on environments built from the repo journal alone.
-- Data effect: drops subscribers.segment. On 2026-10-24 production had 1 row, value 'newsletter' (the default).
DROP INDEX IF EXISTS "subscribers_segment_idx";--> statement-breakpoint
ALTER TABLE "subscribers" DROP COLUMN IF EXISTS "segment";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."subscriber_segment";
