import type {
  DiscoveryCommitmentStatus,
  DiscoveryCommitmentType,
  DiscoveryDirection,
  DiscoveryEvidenceKind,
  DiscoveryHypothesisMeasure,
  DiscoveryStance,
  DiscoveryStep,
  DiscoveryTouchpointFormat,
  DiscoveryVerdict,
} from "@/drizzle/schema";

/**
 * The study readout: pure, so the rules are unit-tested and the UI and the MCP
 * show the same numbers. The rules are the validation kit's 10-call rule:
 *
 * - Conversation: a contact with a two-way exchange (a reply, an inbound
 *   message, a call or a meeting).
 * - Story: a contact with at least one `incident` evidence.
 * - Commitment: a contact with a paid deposit / pre-order, or a price accepted.
 * - Go: H1 or H2 passed (the "core pain" hypotheses = the first two by order)
 *   and commitments >= goMinCommitments.
 * - Fix pitch: stories >= killMinStories but too few commitments.
 * - Kill: stories < killMinStories.
 */

export type ReadoutTouchpoint = {
  contactId: string;
  direction: DiscoveryDirection;
  format: DiscoveryTouchpointFormat;
  repliedAt: Date | null;
};

export type ReadoutEvidence = {
  contactId: string;
  kind: DiscoveryEvidenceKind;
  links: { hypothesisId: string; stance: DiscoveryStance }[];
};

export type ReadoutCommitment = {
  contactId: string;
  type: DiscoveryCommitmentType;
  status: DiscoveryCommitmentStatus;
};

export type ReadoutHypothesis = {
  id: string;
  code: string;
  passThreshold: number;
  measure: DiscoveryHypothesisMeasure;
  verdict: DiscoveryVerdict;
  sortOrder: number;
};

export type ReadoutStudy = {
  step: DiscoveryStep;
  targetConversations: number;
  goMinCommitments: number;
  killMinStories: number;
};

export type HypothesisResult = {
  id: string;
  code: string;
  supporting: number;
  contradicting: number;
  threshold: number;
  passed: boolean;
  /** True when a person's verdict decided, not the evidence. */
  overridden: boolean;
};

export type StudyVerdict = "collecting" | "go" | "fix_pitch" | "kill";

export type StudyReadout = {
  conversations: number;
  stories: number;
  commitments: number;
  paidCommitments: number;
  arguedPrice: number;
  arguedNeed: number;
  compliments: number;
  hypotheses: HypothesisResult[];
  verdict: StudyVerdict;
  /** A suggestion only; a person moves the step. */
  suggestedStep: DiscoveryStep | null;
};

const TWO_WAY_FORMATS: ReadonlySet<DiscoveryTouchpointFormat> = new Set([
  "call",
  "meeting",
]);

export function isTwoWay(tp: ReadoutTouchpoint): boolean {
  return (
    tp.direction === "inbound" ||
    tp.repliedAt !== null ||
    TWO_WAY_FORMATS.has(tp.format)
  );
}

function isLiveCommitment(c: ReadoutCommitment): boolean {
  if (c.status === "refunded" || c.status === "withdrawn") return false;
  if (c.type === "price_accepted") return true;
  return (
    (c.type === "deposit" || c.type === "pre_order") && c.status === "paid"
  );
}

function distinct<T>(items: T[], key: (item: T) => string): number {
  return new Set(items.map(key)).size;
}

function hypothesisResult(
  h: ReadoutHypothesis,
  evidence: ReadoutEvidence[],
  commitments: number,
): HypothesisResult {
  const supporters = new Set<string>();
  const contradictors = new Set<string>();
  for (const e of evidence) {
    if (e.kind === "compliment") continue;
    for (const link of e.links) {
      if (link.hypothesisId !== h.id) continue;
      (link.stance === "supports" ? supporters : contradictors).add(
        e.contactId,
      );
    }
  }
  const supporting =
    h.measure === "commitments" ? commitments : supporters.size;
  const overridden = h.verdict !== "open";
  const passed = overridden
    ? h.verdict === "true"
    : h.measure !== "manual" && supporting >= h.passThreshold;
  return {
    id: h.id,
    code: h.code,
    supporting,
    contradicting: contradictors.size,
    threshold: h.passThreshold,
    passed,
    overridden,
  };
}

const NEXT_STEP: Partial<Record<DiscoveryStep, DiscoveryStep>> = {
  problem: "prototype",
  prototype: "payment",
  payment: "mvp",
};

export function computeReadout(input: {
  study: ReadoutStudy;
  hypotheses: ReadoutHypothesis[];
  touchpoints: ReadoutTouchpoint[];
  evidence: ReadoutEvidence[];
  commitments: ReadoutCommitment[];
}): StudyReadout {
  const { study } = input;
  const conversations = distinct(
    input.touchpoints.filter(isTwoWay),
    (t) => t.contactId,
  );
  const stories = distinct(
    input.evidence.filter((e) => e.kind === "incident"),
    (e) => e.contactId,
  );
  const live = input.commitments.filter(isLiveCommitment);
  const commitments = distinct(live, (c) => c.contactId);
  const paidCommitments = distinct(
    live.filter((c) => c.status === "paid"),
    (c) => c.contactId,
  );
  const arguedPrice = distinct(
    input.commitments.filter((c) => c.type === "argued_price"),
    (c) => c.contactId,
  );
  const arguedNeed = distinct(
    input.commitments.filter((c) => c.type === "argued_need"),
    (c) => c.contactId,
  );
  const compliments = input.evidence.filter(
    (e) => e.kind === "compliment",
  ).length;

  const ordered = [...input.hypotheses].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  const hypotheses = ordered.map((h) =>
    hypothesisResult(h, input.evidence, commitments),
  );
  const corePainPassed = hypotheses.slice(0, 2).some((h) => h.passed);

  let verdict: StudyVerdict;
  if (conversations < study.targetConversations) verdict = "collecting";
  else if (stories < study.killMinStories) verdict = "kill";
  else if (corePainPassed && commitments >= study.goMinCommitments)
    verdict = "go";
  else verdict = "fix_pitch";

  let suggestedStep: DiscoveryStep | null = null;
  if (study.step === "problem" && stories >= study.killMinStories)
    suggestedStep = NEXT_STEP.problem ?? null;
  else if (study.step === "prototype" && corePainPassed)
    suggestedStep = NEXT_STEP.prototype ?? null;
  else if (study.step === "payment" && commitments >= study.goMinCommitments)
    suggestedStep = NEXT_STEP.payment ?? null;

  return {
    conversations,
    stories,
    commitments,
    paidCommitments,
    arguedPrice,
    arguedNeed,
    compliments,
    hypotheses,
    verdict,
    suggestedStep,
  };
}
