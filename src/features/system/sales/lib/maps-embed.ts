/**
 * Google Maps links and the lead page's map, built from the lead's name and
 * address. Nothing is pasted or stored: the map is Google's keyless
 * `maps?q=…&output=embed` page for a search on those two fields.
 */

const MAPS_ORIGIN = "https://www.google.com";

type MapsTarget = {
  name: string;
  address: string | null;
};

function mapsQuery(target: MapsTarget): string {
  return [target.name, target.address]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}

/**
 * The iframe `src` for the lead's map, or null without an address: a name
 * alone too often lands on another business with the same name.
 */
export function mapsEmbedUrl(target: MapsTarget): string | null {
  if (!target.address?.trim()) return null;
  return `${MAPS_ORIGIN}/maps?q=${encodeURIComponent(mapsQuery(target))}&output=embed`;
}

/** "Open in Maps": a search for name + address. */
export function mapsSearchUrl(target: MapsTarget): string {
  return `${MAPS_ORIGIN}/maps/search/?api=1&query=${encodeURIComponent(mapsQuery(target))}`;
}

export function mapsDirectionsUrl(target: MapsTarget): string {
  return `${MAPS_ORIGIN}/maps/dir/?api=1&destination=${encodeURIComponent(mapsQuery(target))}`;
}
