import { describe, expect, it } from "vitest";

import { createLeadSchema, updateLeadSchema } from "./schemas";

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
