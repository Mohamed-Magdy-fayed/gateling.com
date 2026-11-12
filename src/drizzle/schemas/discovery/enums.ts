import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Discovery is the problem-first validation process (docs/designs/discovery-module.md).
 * It is deliberately separate from the sales pipeline: nothing here writes to
 * `leads`. A discovery contact may only *point* at a lead.
 */

/** The 6 steps of the method, in order. */
export const discoveryStepValues = [
  "problem",
  "prototype",
  "payment",
  "mvp",
  "measure",
  "distribution",
] as const;
export type DiscoveryStep = (typeof discoveryStepValues)[number];
export const discoveryStepEnum = pgEnum("discovery_step", discoveryStepValues);

export const discoveryStudyStatusValues = [
  "active",
  "go",
  "fix_pitch",
  "killed",
  "archived",
] as const;
export type DiscoveryStudyStatus = (typeof discoveryStudyStatusValues)[number];
export const discoveryStudyStatusEnum = pgEnum(
  "discovery_study_status",
  discoveryStudyStatusValues,
);

export const discoveryChannelValues = [
  "facebook",
  "instagram",
  "whatsapp",
  "phone",
  "in_person",
  "group_forum",
  "linkedin",
  "other",
] as const;
export type DiscoveryChannel = (typeof discoveryChannelValues)[number];
export const discoveryChannelEnum = pgEnum(
  "discovery_channel",
  discoveryChannelValues,
);

/** Who the message was sent as: the experiment behind "Gateling gets no replies". */
export const discoveryPersonaValues = ["personal", "gateling"] as const;
export type DiscoveryPersona = (typeof discoveryPersonaValues)[number];
export const discoveryPersonaEnum = pgEnum(
  "discovery_persona",
  discoveryPersonaValues,
);
