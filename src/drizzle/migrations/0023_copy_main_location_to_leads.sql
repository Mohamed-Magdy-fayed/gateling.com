-- Data migration: branches are dropped (one Google Maps listing per lead), so
-- each lead's main location moves onto the lead before 0024 drops
-- "lead_locations".
--
-- Copies the primary location's embed, coordinates, rating, reviews, category
-- and check date into the new "maps*" columns. Its address replaces
-- "leads"."address" only when it has one, so a lead whose location has no
-- address keeps its own.
--
-- Data effect: non-primary (branch) locations are not copied; 0024 deletes
-- them with the table. The location's own name is dropped (the lead's name
-- is used). Idempotent: re-running writes the same values.
UPDATE "leads" l
SET
	"mapsEmbedSrc" = ll."embedSrc",
	"mapsLat" = ll."lat",
	"mapsLng" = ll."lng",
	"mapsRating" = ll."rating",
	"mapsReviewCount" = ll."reviewCount",
	"mapsCategory" = ll."category",
	"mapsCheckedAt" = ll."checkedAt",
	"address" = coalesce(nullif(trim(ll."address"), ''), l."address")
FROM "lead_locations" ll
WHERE ll."leadId" = l."id"
	AND ll."isPrimary";
