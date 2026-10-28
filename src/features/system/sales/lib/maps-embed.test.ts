import { describe, expect, it } from "vitest";

import {
  isMapsEmbedSrc,
  mapsDirectionsUrl,
  mapsSearchUrl,
  parseMapsEmbed,
} from "./maps-embed";

const PB =
  "!1m18!1m12!1m3!1d3453.1!2d31.0112!3d30.5571!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14f7d6a1b2c3d4e5%3A0x1a2b3c4d5e6f7a8b!2sSASHA%20Wedding%20Dresses!5e0!3m2!1sen!2seg!4v1700000000000!5m2!1sen!2seg";
const SRC = `https://www.google.com/maps/embed?pb=${PB}`;
const IFRAME = `<iframe src="${SRC}" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;

describe("parseMapsEmbed", () => {
  it("reads the src, place name and coordinates from Google's embed HTML", () => {
    expect(parseMapsEmbed(IFRAME)).toEqual({
      src: SRC,
      name: "SASHA Wedding Dresses",
      lat: 30.5571,
      lng: 31.0112,
    });
  });

  it("accepts a bare embed URL", () => {
    expect(parseMapsEmbed(SRC)?.src).toBe(SRC);
  });

  it("drops extra parameters and fragments from the stored src", () => {
    expect(parseMapsEmbed(`${SRC}&evil=1#x`)?.src).toBe(SRC);
  });

  it("returns no name for a coordinate-only embed", () => {
    const pb =
      "!1m14!1m12!1m3!1d1000!2d31.2!3d30.0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2seg";
    expect(
      parseMapsEmbed(`https://www.google.com/maps/embed?pb=${pb}`)?.name,
    ).toBeNull();
  });

  it.each([
    ["another host", SRC.replace("www.google.com", "evil.example")],
    [
      "a lookalike host",
      SRC.replace("www.google.com", "www.google.com.evil.example"),
    ],
    ["plain http", SRC.replace("https:", "http:")],
    ["a non-embed Maps page", "https://www.google.com/maps/place/SASHA"],
    ["no pb", "https://www.google.com/maps/embed?q=cairo"],
    [
      "script characters in pb",
      `https://www.google.com/maps/embed?pb=!1m2"onload="alert(1)`,
    ],
    ["javascript url", "javascript:alert(1)"],
    [
      "an iframe pointing elsewhere",
      '<iframe src="https://evil.example/maps/embed?pb=!1m2"></iframe>',
    ],
    ["html without an iframe src", "<script>alert(1)</script>"],
    ["empty input", "   "],
  ])("rejects %s", (_label, input) => {
    expect(parseMapsEmbed(input)).toBeNull();
  });

  it("rejects input over the length cap", () => {
    expect(parseMapsEmbed(`${SRC}${"!".repeat(5000)}`)).toBeNull();
  });
});

describe("isMapsEmbedSrc", () => {
  it("is true only for a rebuilt src", () => {
    expect(isMapsEmbedSrc(SRC)).toBe(true);
    expect(isMapsEmbedSrc(`${SRC}&x=1`)).toBe(false);
  });
});

describe("maps links", () => {
  it("uses coordinates when known", () => {
    const target = { name: "SASHA", address: "Tanta", lat: 30.1, lng: 31.2 };
    expect(mapsSearchUrl(target)).toBe(
      "https://www.google.com/maps/search/?api=1&query=30.1%2C31.2",
    );
    expect(mapsDirectionsUrl(target)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=30.1%2C31.2",
    );
  });

  it("falls back to name and address", () => {
    expect(
      mapsSearchUrl({ name: "SASHA", address: "Tanta", lat: null, lng: null }),
    ).toBe("https://www.google.com/maps/search/?api=1&query=SASHA%2C%20Tanta");
  });
});
