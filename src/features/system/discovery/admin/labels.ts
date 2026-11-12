import type {
  DiscoveryChannel,
  DiscoveryCommitmentStatus,
  DiscoveryCommitmentType,
  DiscoveryContactRole,
  DiscoveryEvidenceKind,
  DiscoveryHypothesisMeasure,
  DiscoveryPersona,
  DiscoveryStep,
  DiscoveryStudyStatus,
  DiscoveryTouchpointFormat,
} from "@/drizzle/schema";
import type { StudyVerdict } from "@/features/system/discovery/lib/readout";

/**
 * Enum value → translation key. Kept as literal maps (not string building)
 * so every key is type-checked against the dictionaries.
 */

export const STEP_KEY = {
  problem: "discovery.stepProblem",
  prototype: "discovery.stepPrototype",
  payment: "discovery.stepPayment",
  mvp: "discovery.stepMvp",
  measure: "discovery.stepMeasure",
  distribution: "discovery.stepDistribution",
} as const satisfies Record<DiscoveryStep, string>;

export const STUDY_STATUS_KEY = {
  active: "discovery.statusActive",
  go: "discovery.statusGo",
  fix_pitch: "discovery.statusFixPitch",
  killed: "discovery.statusKilled",
  archived: "discovery.statusArchived",
} as const satisfies Record<DiscoveryStudyStatus, string>;

export const VERDICT_KEY = {
  collecting: "discovery.verdictCollecting",
  go: "discovery.verdictGo",
  fix_pitch: "discovery.verdictFixPitch",
  kill: "discovery.verdictKill",
} as const satisfies Record<StudyVerdict, string>;

export const VERDICT_STATUS_VARIANT = {
  collecting: "default",
  go: "success",
  fix_pitch: "warning",
  kill: "error",
} as const satisfies Record<StudyVerdict, string>;

export const CHANNEL_KEY = {
  facebook: "discovery.channelFacebook",
  instagram: "discovery.channelInstagram",
  whatsapp: "discovery.channelWhatsapp",
  phone: "discovery.channelPhone",
  in_person: "discovery.channelInPerson",
  group_forum: "discovery.channelGroupForum",
  linkedin: "discovery.channelLinkedin",
  other: "discovery.channelOther",
} as const satisfies Record<DiscoveryChannel, string>;

export const FORMAT_KEY = {
  dm: "discovery.formatDm",
  comment: "discovery.formatComment",
  post: "discovery.formatPost",
  call: "discovery.formatCall",
  meeting: "discovery.formatMeeting",
  voice_note: "discovery.formatVoiceNote",
} as const satisfies Record<DiscoveryTouchpointFormat, string>;

export const PERSONA_KEY = {
  personal: "discovery.personaPersonal",
  gateling: "discovery.personaGateling",
} as const satisfies Record<DiscoveryPersona, string>;

export const EVIDENCE_KIND_KEY = {
  incident: "discovery.kindIncident",
  workaround_tool: "discovery.kindWorkaroundTool",
  cost_loss: "discovery.kindCostLoss",
  money_commitment: "discovery.kindMoneyCommitment",
  compliment: "discovery.kindCompliment",
  other_pain: "discovery.kindOtherPain",
} as const satisfies Record<DiscoveryEvidenceKind, string>;

export const COMMITMENT_TYPE_KEY = {
  deposit: "discovery.typeDeposit",
  pre_order: "discovery.typePreOrder",
  price_accepted: "discovery.typePriceAccepted",
  argued_price: "discovery.typeArguedPrice",
  argued_need: "discovery.typeArguedNeed",
} as const satisfies Record<DiscoveryCommitmentType, string>;

export const COMMITMENT_STATUS_KEY = {
  promised: "discovery.commitPromised",
  paid: "discovery.commitPaid",
  refunded: "discovery.commitRefunded",
  withdrawn: "discovery.commitWithdrawn",
} as const satisfies Record<DiscoveryCommitmentStatus, string>;

export const ROLE_KEY = {
  owner: "discovery.roleOwner",
  staff: "discovery.roleStaff",
  relative: "discovery.roleRelative",
  unknown: "discovery.roleUnknown",
} as const satisfies Record<DiscoveryContactRole, string>;

export const MEASURE_KEY = {
  supporting_contacts: "discovery.measureSupporting",
  commitments: "discovery.measureCommitments",
  manual: "discovery.measureManual",
} as const satisfies Record<DiscoveryHypothesisMeasure, string>;

/** Minutes → the largest sensible unit, as [key, value]. */
export function durationParts(
  minutes: number,
): [
  "discovery.minutesShort" | "discovery.hoursShort" | "discovery.daysShort",
  number,
] {
  if (minutes < 60) return ["discovery.minutesShort", minutes];
  if (minutes < 60 * 48)
    return ["discovery.hoursShort", Math.round(minutes / 60)];
  return ["discovery.daysShort", Math.round(minutes / (60 * 24))];
}
