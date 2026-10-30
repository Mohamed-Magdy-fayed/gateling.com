import { describe, expect, it } from "vitest";

import { mapsDirectionsUrl, mapsEmbedUrl, mapsSearchUrl } from "./maps-embed";

const TARGET = { name: "SASHA", address: "Tanta" };

describe("mapsEmbedUrl", () => {
  it("builds a keyless embed for name + address", () => {
    expect(mapsEmbedUrl(TARGET)).toBe(
      "https://www.google.com/maps?q=SASHA%2C%20Tanta&output=embed",
    );
  });

  it("encodes characters that would break out of the query", () => {
    expect(mapsEmbedUrl({ name: 'A&B"<x>', address: "x#y?z=1" })).toBe(
      "https://www.google.com/maps?q=A%26B%22%3Cx%3E%2C%20x%23y%3Fz%3D1&output=embed",
    );
  });

  it("is null without an address", () => {
    expect(mapsEmbedUrl({ name: "SASHA", address: null })).toBeNull();
    expect(mapsEmbedUrl({ name: "SASHA", address: "   " })).toBeNull();
  });
});

describe("maps links", () => {
  it("search and directions use name and address", () => {
    expect(mapsSearchUrl(TARGET)).toBe(
      "https://www.google.com/maps/search/?api=1&query=SASHA%2C%20Tanta",
    );
    expect(mapsDirectionsUrl(TARGET)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=SASHA%2C%20Tanta",
    );
  });

  it("searches the name alone when there is no address", () => {
    expect(mapsSearchUrl({ name: "SASHA", address: null })).toBe(
      "https://www.google.com/maps/search/?api=1&query=SASHA",
    );
  });
});
