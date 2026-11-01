import type { useTranslation } from "@/features/core/i18n/client";
import {
  FUNNEL_STAGES,
  type FunnelPosition,
} from "@/features/system/sales/lib/funnel";

type Translate = ReturnType<typeof useTranslation>["t"];

export type FunnelCopy = {
  stage: string;
  /** "Stage 2 of 5"; null for a closed lead, which is off the line. */
  progress: string | null;
  now: string;
  next: string;
};

/** Turns the funnel module's structured position into two plain sentences. */
export function funnelCopy(
  position: FunnelPosition,
  t: Translate,
  formatDate: (date: Date, withTime?: boolean) => string,
  now: Date = new Date(),
): FunnelCopy {
  const index = (FUNNEL_STAGES as readonly string[]).indexOf(position.stage);
  return {
    stage: t("sales.funnel.stage", { stage: position.stage }),
    progress:
      index < 0
        ? null
        : t("sales.funnel.stageProgress", {
            current: String(index + 1),
            total: String(FUNNEL_STAGES.length),
          }),
    ...stepCopy(position.step, t, formatDate, now),
  };
}

function stepCopy(
  step: FunnelPosition["step"],
  t: Translate,
  formatDate: (date: Date, withTime?: boolean) => string,
  now: Date,
): { now: string; next: string } {
  // A follow-up date already reached reads as "send it now", not a past date.
  const followUpNext = (followUpOn: Date, upcoming: () => string): string =>
    followUpOn.getTime() <= now.getTime()
      ? t("sales.funnel.followUpNow")
      : upcoming();

  switch (step.id) {
    case "startDiscovery":
      return {
        now: t("sales.funnel.startDiscovery.now"),
        next: t("sales.funnel.startDiscovery.next"),
      };
    case "awaitDiscoveryReply":
      return step.followUpOn
        ? {
            now: t("sales.funnel.awaitDiscoveryReply.now"),
            next: followUpNext(step.followUpOn, () =>
              t("sales.funnel.awaitDiscoveryReply.next", {
                date: formatDate(step.followUpOn as Date),
              }),
            ),
          }
        : {
            now: t("sales.funnel.awaitDiscoveryReplyChased.now"),
            next: t("sales.funnel.awaitDiscoveryReplyChased.next"),
          };
    case "sendVideo":
      return {
        now: t("sales.funnel.sendVideo.now"),
        next: t("sales.funnel.sendVideo.next"),
      };
    case "awaitVideoReply":
      return step.followUpOn
        ? {
            now: t("sales.funnel.awaitVideoReply.now"),
            next: followUpNext(step.followUpOn, () =>
              t("sales.funnel.awaitVideoReply.next", {
                date: formatDate(step.followUpOn as Date),
              }),
            ),
          }
        : {
            now: t("sales.funnel.awaitVideoReplyChased.now"),
            next: t("sales.funnel.awaitVideoReplyChased.next"),
          };
    case "offerDemo":
      return {
        now: t("sales.funnel.offerDemo.now"),
        next: t("sales.funnel.offerDemo.next"),
      };
    case "callBack":
      return step.at
        ? {
            now: t("sales.funnel.callBack.now"),
            next: t("sales.funnel.callBack.next", {
              date: formatDate(step.at, true),
            }),
          }
        : {
            now: t("sales.funnel.callBackNoTime.now"),
            next: t("sales.funnel.callBackNoTime.next"),
          };
    case "bookDemo":
      return {
        now: t("sales.funnel.bookDemo.now"),
        next: t("sales.funnel.bookDemo.next"),
      };
    case "runDemo":
      return step.at
        ? {
            now: t("sales.funnel.runDemo.now", {
              date: formatDate(step.at, true),
            }),
            next: t("sales.funnel.runDemo.next"),
          }
        : {
            now: t("sales.funnel.runDemoNoTime.now"),
            next: t("sales.funnel.runDemoNoTime.next"),
          };
    case "runTrial":
      return {
        now: t("sales.funnel.runTrial.now"),
        next: t("sales.funnel.runTrial.next", {
          week1: formatDate(step.week1),
          week4: formatDate(step.week4),
          day30: formatDate(step.day30),
        }),
      };
    case "startTrial":
      return {
        now: t("sales.funnel.startTrial.now"),
        next: t("sales.funnel.startTrial.next"),
      };
    case "askReferral":
      return {
        now: t("sales.funnel.askReferral.now"),
        next: t("sales.funnel.askReferral.next"),
      };
    case "closed":
      return {
        now: t("sales.funnel.closed.now"),
        next: t("sales.funnel.closed.next"),
      };
  }
}
