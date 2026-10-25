import { describe, expect, it } from "vitest";

import {
  createLeadSchema,
  setSocialProfileSchema,
  updateLeadSchema,
} from "./schemas";

const ID = "3f1c2b7e-9a4d-4c1e-8b2a-1d2e3f4a5b6c";

describe("updateLeadSchema", () => {
  // A partial update used to inject the create defaults, so changing only the
  // notes reopened a lost lead (`new`) and cleared do-not-contact.
  it("leaves omitted fields out instead of filling create defaults", () => {
    expect(updateLeadSchema.parse({ id: ID, notes: "Prefers mornings" })).toEqual({
      id: ID,
      notes: "Prefers mornings",
    });
  });

  it("still accepts the fields it is given", () => {
    expect(
      updateLeadSchema.parse({ id: ID, pipelineStatus: "lost", doNotContact: true }),
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
      expect(setSocialProfileSchema.safeParse({ ...base, status: "found", url }).success).toBe(false);
    }
  });

  it("needs no url for notFound or clear", () => {
    expect(setSocialProfileSchema.safeParse({ ...base, status: "notFound" }).success).toBe(true);
    expect(setSocialProfileSchema.safeParse({ ...base, status: "clear" }).success).toBe(true);
  });
});
