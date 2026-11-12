import type { DiscoveryChannel, DiscoveryPersona } from "@/drizzle/schema";

/**
 * Reply rate and median reply time over outbound touchpoints, grouped by a
 * key (template, persona or channel). Pure, so the UI and MCP agree.
 */

export type ReplyStatInput = {
  direction: "outbound" | "inbound";
  templateId: string | null;
  persona: DiscoveryPersona;
  channel: DiscoveryChannel;
  occurredAt: Date;
  repliedAt: Date | null;
};

export type ReplyStat = {
  key: string;
  sent: number;
  replied: number;
  /** 0..1, null when nothing was sent. */
  rate: number | null;
  /** Minutes; null when there are no replies. */
  medianReplyMinutes: number | null;
};

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value =
    sorted.length % 2 === 0
      ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
      : (sorted[mid] ?? 0);
  return Math.round(value);
}

export function replyStatsBy(
  rows: ReplyStatInput[],
  keyOf: (row: ReplyStatInput) => string | null,
): ReplyStat[] {
  const groups = new Map<string, ReplyStatInput[]>();
  for (const row of rows) {
    if (row.direction !== "outbound") continue;
    const key = keyOf(row);
    if (key === null) continue;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups.entries()]
    .map(([key, group]) => {
      const repliedRows = group.filter((r) => r.repliedAt !== null);
      const minutes = repliedRows.map((r) =>
        Math.max(
          0,
          ((r.repliedAt?.getTime() ?? 0) - r.occurredAt.getTime()) / 60_000,
        ),
      );
      return {
        key,
        sent: group.length,
        replied: repliedRows.length,
        rate: group.length ? repliedRows.length / group.length : null,
        medianReplyMinutes: median(minutes),
      };
    })
    .sort((a, b) => b.sent - a.sent);
}

export function replyStats(rows: ReplyStatInput[]) {
  return {
    byTemplate: replyStatsBy(rows, (r) => r.templateId),
    byPersona: replyStatsBy(rows, (r) => r.persona),
    byChannel: replyStatsBy(rows, (r) => r.channel),
  };
}
