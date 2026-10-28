/**
 * Google Maps "Share › Embed a map" code → a URL we are willing to put in an
 * iframe. Shared by the add-branch form (to pre-fill the name) and the server
 * (which re-parses and stores only the rebuilt `src`).
 *
 * The pasted HTML is never rendered. Only the iframe's `src` is read, and it
 * must be exactly `https://www.google.com/maps/embed?pb=…` with a `pb` made of
 * the characters Google uses there. The stored URL is rebuilt from that `pb`,
 * so any other query parameter, fragment, or host trick in the paste is dropped.
 */

export const MAPS_EMBED_ORIGIN = "https://www.google.com";
const MAPS_EMBED_PATH = "/maps/embed";
const MAX_INPUT_LENGTH = 4000;
/** `!`-separated protobuf-ish tokens, percent-encoded text and nothing else. */
const PB_PATTERN = /^[A-Za-z0-9!._~%+*-]{1,2000}$/;

export type ParsedMapsEmbed = {
  /** The rebuilt, safe iframe `src`. */
  src: string;
  /** Place name carried in the embed, when it points at a listing. */
  name: string | null;
  lat: number | null;
  lng: number | null;
};

function iframeSrc(input: string): string | null {
  if (!input.startsWith("<")) return input;
  const match = input.match(
    /<iframe\b[^>]*?\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)')/i,
  );
  const src = match?.[1] ?? match?.[2];
  return src ? src.replace(/&amp;/g, "&") : null;
}

function decodeText(value: string): string | null {
  try {
    const text = decodeURIComponent(value.replace(/\+/g, " ")).trim();
    return text ? text.slice(0, 255) : null;
  } catch {
    return null;
  }
}

function coordinate(
  pb: string,
  key: "2d" | "3d",
  limit: number,
): number | null {
  const match = pb.match(new RegExp(`!${key}(-?\\d{1,3}(?:\\.\\d+)?)`));
  if (!match) return null;
  const value = Number.parseFloat(match[1]);
  return Number.isFinite(value) && Math.abs(value) <= limit ? value : null;
}

export function parseMapsEmbed(input: string): ParsedMapsEmbed | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > MAX_INPUT_LENGTH) return null;

  const raw = iframeSrc(trimmed);
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.origin !== MAPS_EMBED_ORIGIN || url.pathname !== MAPS_EMBED_PATH) {
    return null;
  }
  // Read `pb` raw: URLSearchParams would decode it and lose the encoding the
  // embed relies on.
  const pb = url.search.match(/[?&]pb=([^&]*)/)?.[1];
  if (!pb || !PB_PATTERN.test(pb)) return null;

  // A listing embed carries its feature id then its name: `!1s0x…:0x…!2s<name>`.
  const name = pb.match(/!1s0x[0-9a-f]+(?:%3A|:)0x[0-9a-f]+!2s([^!]+)/i)?.[1];

  return {
    src: `${MAPS_EMBED_ORIGIN}${MAPS_EMBED_PATH}?pb=${pb}`,
    name: name ? decodeText(name) : null,
    lat: coordinate(pb, "3d", 90),
    lng: coordinate(pb, "2d", 180),
  };
}

/** True for a URL this module produced (what the iframe may load). */
export function isMapsEmbedSrc(src: string): boolean {
  return parseMapsEmbed(src)?.src === src;
}

type MapsTarget = {
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
};

function mapsQuery(target: MapsTarget): string {
  if (target.lat !== null && target.lng !== null) {
    return `${target.lat},${target.lng}`;
  }
  return [target.name, target.address].filter(Boolean).join(", ");
}

/** "Open in Maps": the pinned point when known, else a search for name + address. */
export function mapsSearchUrl(target: MapsTarget): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery(target))}`;
}

export function mapsDirectionsUrl(target: MapsTarget): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsQuery(target))}`;
}
