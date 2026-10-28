import { describe, expect, it } from "vitest";

import {
  createLeadSchema,
  setMapsListingSchema,
  setSocialProfileSchema,
  updateLeadSchema,
} from "./schemas";

const ID = "3f1c2b7e-9a4d-4c1e-8b2a-1d2e3f4a5b6c";

describe("setMapsListingSchema", () => {
  it("accepts a Google Maps embed and rejects anything else", () => {
    const embed =
      '<iframe src="https://www.google.com/maps/embed?pb=!1m2!2sSASHA"></iframe>';
    expect(setMapsListingSchema.safeParse({ id: ID, embed }).success).toBe(
      true,
    );
    expect(
      setMapsListingSchema.safeParse({
        id: ID,
        embed: '<iframe src="https://evil.example/maps/embed?pb=!1"></iframe>',
      }).success,
    ).toBe(false);
  });

  it("leaves omitted fields out and caps the rating at 5", () => {
    expect(setMapsListingSchema.parse({ id: ID, rating: 4.7 })).toEqual({
      id: ID,
      rating: 4.7,
    });
    expect(
      setMapsListingSchema.safeParse({ id: ID, rating: 5.5 }).success,
    ).toBe(false);
  });
});

describe("setSocialProfileSchema avatar input", () => {
  it("rejects a malformed avatar URL instead of throwing", () => {
    expect(() =>
      setSocialProfileSchema.safeParse({
        id: ID,
        platform: "facebook",
        status: "found",
        url: "https://www.facebook.com/sasha",
        avatarUrl: "not a url",
      }),
    ).not.toThrow();
  });
});

describe("setSocialProfileSchema avatar", () => {
  const found = {
    id: ID,
    platform: "facebook" as const,
    status: "found" as const,
    url: "https://www.facebook.com/sasha",
  };

  it("accepts our storage URL and rejects a platform CDN link", () => {
    expect(
      setSocialProfileSchema.safeParse({
        ...found,
        avatarUrl: "https://storage.googleapis.com/bucket/blocks/a.jpg",
      }).success,
    ).toBe(true);
    expect(
      setSocialProfileSchema.safeParse({
        ...found,
        avatarUrl: "https://scontent.xx.fbcdn.net/v/a.jpg?oe=123",
      }).success,
    ).toBe(false);
  });
});

describe("updateLeadSchema", () => {
  // A partial update used to inject the create defaults, so changing only the
  // notes reopened a lost lead (`new`) and cleared do-not-contact.
  it("leaves omitted fields out instead of filling create defaults", () => {
    expect(
      updateLeadSchema.parse({ id: ID, notes: "Prefers mornings" }),
    ).toEqual({
      id: ID,
      notes: "Prefers mornings",
    });
  });

  it("still accepts the fields it is given", () => {
    expect(
      updateLeadSchema.parse({
        id: ID,
        pipelineStatus: "lost",
        doNotContact: true,
      }),
    ).toEqual({ id: ID, pipelineStatus: "lost", doNotContact: true });
  });
});

describe("createLeadSchema", () => {
  it("keeps its defaults for a new lead", () => {
    expect(createLeadSchema.parse({ name: "Atelier" })).toMatchObject({
      name: "Atelier",
      pipelineStatus: "new",
      doNotContact: false,
      whatsappStatus: "unknown",
    });
  });
});

describe("setSocialProfileSchema", () => {
  const base = { id: ID, platform: "instagram" as const };

  it("accepts a found profile on the platform's domain", () => {
    expect(
      setSocialProfileSchema.safeParse({
        ...base,
        status: "found",
        url: "https://www.instagram.com/farida",
        followers: 1200,
      }).success,
    ).toBe(true);
  });

  it("rejects a found profile linking elsewhere or to a script", () => {
    for (const url of ["https://farida.com", "javascript:alert(1)"]) {
      expect(
        setSocialProfileSchema.safeParse({ ...base, status: "found", url })
          .success,
      ).toBe(false);
    }
  });

  it("needs no url for notFound or clear", () => {
    expect(
      setSocialProfileSchema.safeParse({ ...base, status: "notFound" }).success,
    ).toBe(true);
    expect(
      setSocialProfileSchema.safeParse({ ...base, status: "clear" }).success,
    ).toBe(true);
  });
});
