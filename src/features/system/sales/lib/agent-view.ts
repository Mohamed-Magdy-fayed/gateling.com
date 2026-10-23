import { toWhatsAppUrl } from "@/lib/phone";

import type { TodayWorkSummary } from "../server/schemas";
import { localDateKey } from "./day-window";
import { type OutcomeId, outcomesFor, type PrimaryAction, primaryActionFor } from "./outcomes";
import type { TodayBucketId, TodayRow } from "./today-rules";

/**
 * Today's work as the sales MCP server returns it: the same buckets the
 * Today page shows, flattened in priority order, with what the agent may
 * suggest and log for each lead. Pure, so what an agent is told is tested.
 */

export type AgentWorkItem = {
  leadId: string;
  bucket: TodayBucketId;
  name: string;
  nameAr: string | null;
  city: string | null;
  area: string | null;
  phone: string | null;
  phoneSecondary: string | null;
  whatsappStatus: string;
  whatsappProfileName: string | null;
  /** Opens a chat with the number; the operator sends, never the app. */
  whatsappUrl: string | null;
  tier: string | null;
  socialFollowers: number | null;
  pipelineStatus: string;
  reason: TodayRow["reason"];
  daysSinceLastContact: number | null;
  openingAngle: string | null;
  notes: string | null;
  primaryAction: PrimaryAction;
  /** Ids accepted by `log_outcome` for this lead. */
  outcomes: OutcomeId[];
  /** New lead past today's goal: optional work. */
  beyondDailyGoal: boolean;
};

export type AgentToday = {
  /** Business-local date, `YYYY-MM-DD`. */
  date: string;
  timeZone: string;
  progress: {
    doneToday: number;
    conversationsToday: number;
    demosBookedToday: number;
    newTouchedToday: number;
    newQueueCap: number;
    dueTomorrow: number;
  };
  work: AgentWorkItem[];
};

function outcomeIds(bucket: TodayBucketId): OutcomeId[] {
  if (bucket === "autoPark") return outcomesFor("autoPark", "call").map((o) => o.id);
  return [...outcomesFor(bucket, "call"), ...outcomesFor(bucket, "whatsapp")].map((o) => o.id);
}

export function agentToday(summary: TodayWorkSummary): AgentToday {
  const newGoal = Math.max(0, summary.newQueueCap - summary.newTouchedToday);

  const work = summary.buckets.flatMap((bucket) =>
    bucket.rows.map((row, index): AgentWorkItem => {
      const { lead } = row;
      return {
        leadId: lead.id,
        bucket: bucket.id,
        name: lead.name,
        nameAr: lead.nameAr,
        city: lead.city,
        area: lead.area,
        phone: lead.phone,
        phoneSecondary: lead.phoneSecondary,
        whatsappStatus: lead.whatsappStatus,
        whatsappProfileName: lead.whatsappProfileName,
        whatsappUrl: toWhatsAppUrl(lead.phone),
        tier: lead.tier,
        socialFollowers: lead.socialFollowers,
        pipelineStatus: lead.pipelineStatus,
        reason: row.reason,
        daysSinceLastContact: row.daysSinceLastContact,
        openingAngle: row.openingAngle,
        notes: lead.notes,
        primaryAction: primaryActionFor(bucket.id, lead),
        outcomes: outcomeIds(bucket.id),
        beyondDailyGoal: bucket.id === "newQueue" && index >= newGoal,
      };
    }),
  );

  return {
    date: localDateKey(summary.now, summary.timeZone),
    timeZone: summary.timeZone,
    progress: {
      doneToday: summary.doneToday,
      conversationsToday: summary.conversationsToday,
      demosBookedToday: summary.demosBookedToday,
      newTouchedToday: summary.newTouchedToday,
      newQueueCap: summary.newQueueCap,
      dueTomorrow: summary.dueTomorrow,
    },
    work,
  };
}
