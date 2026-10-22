import { describe, expect, it } from "vitest";

import { mapRecord, parseCsv } from "@/drizzle/seed/sales-csv";

import {
  buildDedupeIndex,
  buildSearchRequest,
  chunk,
  dedupeCandidates,
  type LeadCsvRow,
  mapPlaceToRow,
  normalizeName,
  normalizePhone,
  type Place,
  SEARCH_CITIES,
  toLeadCsv,
} from "./places-leads";

const cairoComponents = [
  { longText: "Nasr City", types: ["sublocality_level_1", "sublocality"] },
  { longText: "Cairo Governorate", types: ["administrative_area_level_1"] },
];

function place(overrides: Partial<Place> = {}): Place {
  return {
    id: "ChIJ_test_1",
    displayName: { text: "Atelier Mary" },
    formattedAddress: "12 Abbas El-Akkad, Nasr City, Cairo",
    addressComponents: cairoComponents,
    nationalPhoneNumber: "010 0467 0407",
    googleMapsUri: "https://maps.google.com/?cid=1",
    businessStatus: "OPERATIONAL",
    userRatingCount: 40,
    ...overrides,
  };
}

function rowOf(p: Place): { row: LeadCsvRow; ratingCount: number } {
  const outcome = mapPlaceToRow(p);
  if (outcome.kind !== "row")
    throw new Error(`expected a row, got ${outcome.reason}`);
  return { row: outcome.row, ratingCount: outcome.ratingCount };
}

describe("normalizePhone", () => {
  it("folds +20 and 0020 prefixes onto the local leading zero", () => {
    expect(normalizePhone("+20 10 0467 0407")).toBe("01004670407");
    expect(normalizePhone("0020 1004670407")).toBe("01004670407");
    expect(normalizePhone("010 0467 0407")).toBe("01004670407");
  });

  it("keeps landlines and rejects fragments", () => {
    expect(normalizePhone("03 4690542")).toBe("034690542");
    expect(normalizePhone("shop 66")).toBeNull();
    expect(normalizePhone(undefined)).toBeNull();
  });
});

describe("normalizeName", () => {
  it("ignores case, punctuation and the word atelier", () => {
    expect(normalizeName("ATELIER MARY.")).toBe(normalizeName("Mary"));
  });

  it("folds Arabic letter variants and the Arabic word for atelier", () => {
    expect(normalizeName("أتيليه الملكة")).toBe(normalizeName("اتيليه الملكه"));
    expect(normalizeName("اتيليه الملكه")).toBe("الملكه");
  });
});

describe("mapPlaceToRow", () => {
  it("maps a Cairo listing into the seed CSV shape", () => {
    const { row } = rowOf(place());
    expect(row).toMatchObject({
      name: "Atelier Mary",
      city: "Cairo",
      area: "Nasr City",
      phone_primary: "010 0467 0407",
      whatsapp_status: "unknown",
      status: "new",
      source_url: "https://maps.google.com/?cid=1",
    });
    expect(row.notes).toContain("places:ChIJ_test_1");
  });

  it("assigns the city from the governorate, not the search box", () => {
    const giza = place({
      addressComponents: [
        {
          longText: "Giza Governorate",
          types: ["administrative_area_level_1"],
        },
      ],
    });
    expect(rowOf(giza).row.city).toBe("Giza");
  });

  it("drops closed, phoneless and out-of-area listings with a reason", () => {
    expect(
      mapPlaceToRow(place({ businessStatus: "CLOSED_PERMANENTLY" })),
    ).toEqual({
      kind: "skipped",
      reason: "closed",
    });
    expect(
      mapPlaceToRow(
        place({
          nationalPhoneNumber: undefined,
          internationalPhoneNumber: undefined,
        }),
      ),
    ).toEqual({ kind: "skipped", reason: "no_phone" });
    expect(
      mapPlaceToRow(
        place({
          addressComponents: [
            {
              longText: "Qalyubia Governorate",
              types: ["administrative_area_level_1"],
            },
          ],
        }),
      ),
    ).toEqual({ kind: "skipped", reason: "out_of_area" });
  });
});

describe("dedupeCandidates", () => {
  it("drops leads already known by phone, name+city or place id", () => {
    const index = buildDedupeIndex([
      { name: "Other", city: "Cairo", phone: "+20 10 0467 0407" },
      { name: "Atelier Bella", city: "Giza", phone: "" },
      {
        name: "X",
        city: "Cairo",
        phone: "",
        notes: "places:ChIJ_known · 3 reviews",
      },
    ]);

    const result = dedupeCandidates(
      [
        rowOf(place({ id: "a" })),
        rowOf(
          place({
            id: "b",
            displayName: { text: "BELLA" },
            nationalPhoneNumber: "012 2222 2222",
            addressComponents: [
              {
                longText: "Giza Governorate",
                types: ["administrative_area_level_1"],
              },
            ],
          }),
        ),
        rowOf(
          place({
            id: "ChIJ_known",
            displayName: { text: "New" },
            nationalPhoneNumber: "011 1111 1111",
          }),
        ),
        rowOf(
          place({
            id: "c",
            displayName: { text: "Fresh" },
            nationalPhoneNumber: "012 3333 3333",
          }),
        ),
      ],
      index,
    );

    expect(result.fresh.map((r) => r.name)).toEqual(["Fresh"]);
    expect(result.duplicates.map((d) => d.reason).sort()).toEqual([
      "name_city",
      "phone",
      "place_id",
    ]);
  });

  it("collapses repeats within the same run and orders by review count", () => {
    const small = rowOf(
      place({
        id: "s",
        displayName: { text: "Small" },
        nationalPhoneNumber: "012 0000 0001",
        userRatingCount: 2,
      }),
    );
    const big = rowOf(
      place({
        id: "b",
        displayName: { text: "Big" },
        nationalPhoneNumber: "012 0000 0002",
        userRatingCount: 300,
      }),
    );
    const bigAgain = rowOf(
      place({
        id: "b",
        displayName: { text: "Big" },
        nationalPhoneNumber: "012 0000 0002",
        userRatingCount: 300,
      }),
    );

    const result = dedupeCandidates(
      [small, big, bigAgain],
      buildDedupeIndex([]),
    );

    expect(result.fresh.map((r) => r.name)).toEqual(["Big", "Small"]);
    expect(result.duplicates).toHaveLength(1);
  });

  it("does not mutate the index it was given", () => {
    const index = buildDedupeIndex([]);
    dedupeCandidates([rowOf(place())], index);
    expect(index.phones.size).toBe(0);
  });
});

describe("toLeadCsv", () => {
  it("round-trips Arabic names and quoted commas through the seed importer", () => {
    const { row } = rowOf(
      place({
        displayName: { text: "اتيليه الملكه" },
        formattedAddress: 'Shop 5, "Anaba" Mall, Heliopolis',
      }),
    );

    const csv = toLeadCsv([row]);
    expect(csv.startsWith("﻿")).toBe(true);

    const [parsed] = parseCsv(csv);
    const mapped = mapRecord(parsed);
    expect(mapped?.lead).toMatchObject({
      name: "اتيليه الملكه",
      address: 'Shop 5, "Anaba" Mall, Heliopolis',
      phone: "010 0467 0407",
      city: "Cairo",
      pipelineStatus: "new",
      whatsappStatus: "unknown",
    });
    expect(mapped?.activity).toBeNull();
  });
});

describe("chunk", () => {
  it("splits into daily batches with a short last batch", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(() => chunk([1], 0)).toThrow();
  });
});

describe("buildSearchRequest", () => {
  it("restricts to the city rectangle and only sends a page token when paging", () => {
    const cairo = SEARCH_CITIES[0];
    const first = buildSearchRequest("bridal atelier", cairo);
    expect(first.locationRestriction.rectangle).toEqual(cairo.rectangle);
    expect(first).not.toHaveProperty("pageToken");
    expect(buildSearchRequest("bridal atelier", cairo, "tok").pageToken).toBe(
      "tok",
    );
  });
});
