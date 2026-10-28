-- Data migration: give every existing prospect that has a known place a main
-- location, so the Branches section and the derived branch count start from
-- what the lead record already says.
--
-- Source per lead: its own name and address. When the lead was sourced from
-- Google Maps (a Maps link in "sourceUrl"), the review count the importer wrote
-- into "notes" ("… · 123 Google reviews · …") is carried over as well.
-- Ratings, category and the map embed are not known yet; the operator adds
-- them from the page. Idempotent: leads that already have a location are
-- skipped, so a re-run inserts nothing.
--
-- Data effect: inserts at most one "lead_locations" row per prospect that has
-- an address or a Google Maps link. No existing row is changed.
INSERT INTO "lead_locations" ("leadId", "isPrimary", "name", "address", "reviewCount", "sortOrder")
SELECT
	l."id",
	true,
	l."name",
	l."address",
	CASE
		WHEN l."sourceUrl" ~* '(google\.[a-z.]+/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl/maps)'
		THEN substring(l."notes" from '(\d{1,9}) Google reviews')::integer
	END,
	0
FROM "leads" l
WHERE l."kind" = 'prospect'
	AND (
		nullif(trim(l."address"), '') IS NOT NULL
		OR l."sourceUrl" ~* '(google\.[a-z.]+/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl/maps)'
	)
	AND NOT EXISTS (
		SELECT 1 FROM "lead_locations" ll WHERE ll."leadId" = l."id"
	);
