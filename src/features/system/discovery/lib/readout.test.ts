import { describe, expect, it } from "vitest";

import {
  computeReadout,
  type ReadoutCommitment,
  type ReadoutEvidence,
  type ReadoutHypothesis,
  type ReadoutTouchpoint,
} from "./readout";

const study = {
  step: "problem" as const,
  targetConversations: 10,
  goMinCommitments: 3,
  killMinStories: 3,
};

const hypotheses: ReadoutHypothesis[] = [
  {
    id: "h1",
    code: "H1",
    passThreshold: 5,
    measure: "supporting_contacts",
    verdict: "open",
    sortOrder: 1,
  },
  {
    id: "h2",
    code: "H2",
    passThreshold: 5,
    measure: "supporting_contacts",
    verdict: "open",
    sortOrder: 2,
  },
  {
    id: "h4",
    code: "H4",
    passThreshold: 3,
    measure: "commitments",
    verdict: "open",
    sortOrder: 4,
  },
];

const contacts = (n: number) =>
  Array.from({ length: n }, (_, i) => `c${i + 1}`);

function replied(ids: string[]): ReadoutTouchpoint[] {
  return ids.map((contactId) => ({
    contactId,
    direction: "outbound",
    format: "dm",
    repliedAt: new Date("2026-11-12T10:00:00Z"),
  }));
}

function incidents(ids: string[], hypothesisId = "h1"): ReadoutEvidence[] {
  return ids.map((contactId) => ({
    contactId,
    kind: "incident",
    links: [{ hypothesisId, stance: "supports" }],
  }));
}

function paid(ids: string[]): ReadoutCommitment[] {
  return ids.map((contactId) => ({
    contactId,
    type: "deposit",
    status: "paid",
  }));
}

describe("computeReadout", () => {
  it("stays collecting below the target conversation count", () => {
    const r = computeReadout({
      study,
      hypotheses,
      touchpoints: replied(contacts(9)),
      evidence: [],
      commitments: [],
    });
    expect(r.conversations).toBe(9);
    expect(r.verdict).toBe("collecting");
  });

  it("does not count unanswered outbound messages as conversations", () => {
    const r = computeReadout({
      study,
      hypotheses,
      touchpoints: contacts(12).map((contactId) => ({
        contactId,
        direction: "outbound",
        format: "dm",
        repliedAt: null,
      })),
      evidence: [],
      commitments: [],
    });
    expect(r.conversations).toBe(0);
  });

  it("counts calls, meetings and inbound messages as two-way", () => {
    const r = computeReadout({
      study,
      hypotheses,
      touchpoints: [
        {
          contactId: "a",
          direction: "outbound",
          format: "call",
          repliedAt: null,
        },
        {
          contactId: "b",
          direction: "outbound",
          format: "meeting",
          repliedAt: null,
        },
        { contactId: "c", direction: "inbound", format: "dm", repliedAt: null },
      ],
      evidence: [],
      commitments: [],
    });
    expect(r.conversations).toBe(3);
  });

  it("does not count a removed call as a conversation", () => {
    const removedAt = new Date("2026-11-14T09:00:00Z");
    const r = computeReadout({
      study,
      hypotheses,
      touchpoints: [
        // Only staff answered: logged by mistake, then removed.
        {
          contactId: "staff-only",
          direction: "outbound",
          format: "call",
          repliedAt: null,
          removedAt,
        },
        {
          contactId: "owner",
          direction: "outbound",
          format: "call",
          repliedAt: null,
          removedAt: null,
        },
        {
          contactId: "dm",
          direction: "outbound",
          format: "dm",
          repliedAt: new Date("2026-11-13T10:00:00Z"),
          removedAt,
        },
      ],
      evidence: [],
      commitments: [],
    });
    expect(r.conversations).toBe(1);
  });

  it("still counts a contact whose other touchpoint is live", () => {
    const r = computeReadout({
      study,
      hypotheses,
      touchpoints: [
        {
          contactId: "c1",
          direction: "outbound",
          format: "call",
          repliedAt: null,
          removedAt: new Date("2026-11-14T09:00:00Z"),
        },
        {
          contactId: "c1",
          direction: "inbound",
          format: "dm",
          repliedAt: null,
        },
      ],
      evidence: [],
      commitments: [],
    });
    expect(r.conversations).toBe(1);
  });

  it("drops to collecting when a removal takes conversations below target", () => {
    const touchpoints: ReadoutTouchpoint[] = [
      ...replied(contacts(9)),
      {
        contactId: "c10",
        direction: "outbound",
        format: "call",
        repliedAt: null,
      },
    ];
    const input = {
      study,
      hypotheses,
      evidence: incidents(contacts(5)),
      commitments: [],
    };
    expect(computeReadout({ ...input, touchpoints }).verdict).not.toBe(
      "collecting",
    );
    const removed = touchpoints.map((t) =>
      t.contactId === "c10" ? { ...t, removedAt: new Date() } : t,
    );
    const r = computeReadout({ ...input, touchpoints: removed });
    expect(r.conversations).toBe(9);
    expect(r.verdict).toBe("collecting");
  });

  it("returns kill when fewer than 3 contacts told a real story", () => {
    const r = computeReadout({
      study,
      hypotheses,
      touchpoints: replied(contacts(10)),
      evidence: incidents(["c1", "c2"]),
      commitments: [],
    });
    expect(r.stories).toBe(2);
    expect(r.verdict).toBe("kill");
  });

  it("returns fix_pitch when the pain is real but nobody pays", () => {
    const r = computeReadout({
      study,
      hypotheses,
      touchpoints: replied(contacts(10)),
      evidence: incidents(contacts(6)),
      commitments: [
        { contactId: "c1", type: "argued_price", status: "promised" },
        { contactId: "c2", type: "argued_need", status: "promised" },
      ],
    });
    expect(r.verdict).toBe("fix_pitch");
    expect(r.arguedPrice).toBe(1);
    expect(r.arguedNeed).toBe(1);
  });

  it("returns go when H1 passes and 3 contacts paid a deposit", () => {
    const r = computeReadout({
      study,
      hypotheses,
      touchpoints: replied(contacts(10)),
      evidence: incidents(contacts(5)),
      commitments: paid(["c1", "c2", "c3"]),
    });
    expect(r.hypotheses[0]).toMatchObject({ code: "H1", passed: true });
    expect(r.hypotheses[2]).toMatchObject({
      code: "H4",
      supporting: 3,
      passed: true,
    });
    expect(r.verdict).toBe("go");
  });

  it("does not count promised, refunded or withdrawn deposits", () => {
    const r = computeReadout({
      study,
      hypotheses,
      touchpoints: replied(contacts(10)),
      evidence: incidents(contacts(5)),
      commitments: [
        { contactId: "c1", type: "deposit", status: "promised" },
        { contactId: "c2", type: "deposit", status: "refunded" },
        { contactId: "c3", type: "pre_order", status: "withdrawn" },
        { contactId: "c4", type: "price_accepted", status: "promised" },
      ],
    });
    expect(r.commitments).toBe(1);
    expect(r.paidCommitments).toBe(0);
    expect(r.verdict).toBe("fix_pitch");
  });

  it("ignores compliments as evidence for a hypothesis", () => {
    const r = computeReadout({
      study,
      hypotheses,
      touchpoints: [],
      evidence: contacts(6).map((contactId) => ({
        contactId,
        kind: "compliment",
        links: [{ hypothesisId: "h1", stance: "supports" }],
      })),
      commitments: [],
    });
    expect(r.compliments).toBe(6);
    expect(r.hypotheses[0]?.supporting).toBe(0);
  });

  it("counts a contact once even with several supporting quotes", () => {
    const r = computeReadout({
      study,
      hypotheses,
      touchpoints: [],
      evidence: [...incidents(["c1"]), ...incidents(["c1"])],
      commitments: [],
    });
    expect(r.hypotheses[0]?.supporting).toBe(1);
    expect(r.stories).toBe(1);
  });

  it("lets a manual verdict override the evidence", () => {
    const r = computeReadout({
      study,
      hypotheses: hypotheses
        .slice(0, 1)
        .map((h) => ({ ...h, verdict: "false" as const })),
      touchpoints: [],
      evidence: incidents(contacts(6)),
      commitments: [],
    });
    expect(r.hypotheses[0]).toMatchObject({ passed: false, overridden: true });
  });

  it("suggests moving to the prototype step once there are 3 stories", () => {
    const r = computeReadout({
      study,
      hypotheses,
      touchpoints: [],
      evidence: incidents(contacts(3)),
      commitments: [],
    });
    expect(r.suggestedStep).toBe("prototype");
  });
});
