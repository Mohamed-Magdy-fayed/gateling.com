"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { useTranslation } from "@/features/core/i18n/client";
import {
  YES_ACTIVITY_TYPE,
  YES_STEPS,
  type YesAnswer,
  type YesAnswers,
  type YesStep,
  yesOutcome,
  yesProgress,
} from "@/features/system/sales/lib/yeses";
import { useTRPC } from "@/integrations/trpc/client";
import { cn } from "@/lib/utils";

/**
 * Segment colours. The project has no success token, so emerald is the
 * documented fallback (as for the `won` badge).
 */
const SEGMENT_CLASS: Record<YesAnswer | "none", string> = {
  yes: "bg-emerald-500",
  no: "bg-destructive",
  none: "bg-muted",
};

/**
 * The lead's yeses as a bar of seven segments, filled start → end: green for
 * each yes. Once any step got a no the whole bar turns red — the no step
 * solid, the yeses faded — and so does the count.
 */
export function YesProgress({
  answers,
  className,
}: {
  answers: YesAnswers;
  className?: string;
}) {
  const { t } = useTranslation();
  const progress = yesProgress(answers);
  const counts = {
    yes: String(progress.yes),
    no: String(progress.no),
    total: String(progress.total),
  };

  return (
    <div
      data-testid="yes-progress"
      data-has-no={progress.hasNo}
      className={cn("flex items-center gap-2", className)}
    >
      <div
        role="img"
        aria-label={t("sales.yeses.summary", counts)}
        className="flex h-2 min-w-20 flex-1 gap-0.5"
      >
        {YES_STEPS.map((step) => (
          <span
            key={step}
            className={cn(
              "h-full flex-1 first:rounded-s-full last:rounded-e-full",
              progress.hasNo && answers[step] === "yes"
                ? "bg-destructive/40"
                : SEGMENT_CLASS[answers[step] ?? "none"],
            )}
          />
        ))}
      </div>
      <span
        aria-hidden="true"
        className={cn(
          "shrink-0 font-medium text-xs tabular-nums",
          progress.hasNo && "text-destructive",
          !progress.hasNo &&
            progress.yes > 0 &&
            "text-emerald-700 dark:text-emerald-400",
          !progress.hasNo && progress.yes === 0 && "text-muted-foreground",
        )}
      >
        <span dir="ltr">
          {progress.yes}/{progress.total}
        </span>
      </span>
    </div>
  );
}

/**
 * The seven yeses as a path: a horizontal stepper on wide screens, a vertical
 * one on phones. Each step's dot shows its state (number, ✓ or ✗) and a pair
 * of toggles sets it; tapping the lit toggle again clears the step. Every tick
 * is appended to the activity log (`lib/yeses.ts`).
 */
export function YesPath({
  leadId,
  answers,
}: {
  leadId: string;
  answers: YesAnswers;
}) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const leadKey = trpc.sales.byId.queryKey({ id: leadId });

  // Optimistic: the tick is appended to the cached lead as if the server had
  // already logged it, so the dot, the bar and the timeline change on click.
  // A failure restores the snapshot; either way the lead is then refetched.
  const saveTick = useMutation(
    trpc.sales.logActivity.mutationOptions({
      onMutate: async (input) => {
        await queryClient.cancelQueries({ queryKey: leadKey });
        const previous = queryClient.getQueryData(leadKey);
        queryClient.setQueryData(leadKey, (data) => {
          if (!data) return data;
          const now = new Date();
          const tick: (typeof data.activities)[number] = {
            id: `optimistic-${now.getTime()}-${input.outcome}`,
            leadId,
            type: YES_ACTIVITY_TYPE,
            channel: null,
            occurredAt: now,
            outcome: input.outcome ?? null,
            notes: null,
            nextActionAt: null,
            nextActionDoneAt: null,
            createdBy: "",
            createdAt: now,
          };
          return { ...data, activities: [tick, ...data.activities] };
        });
        return { previous };
      },
      onError: (_error, _input, context) => {
        if (context?.previous) {
          queryClient.setQueryData(leadKey, context.previous);
        }
        toast.error(t("sales.yeses.saveFailed"));
      },
      // Refetch once the last tick in flight settles; refetching after an
      // earlier one would briefly undo the later ticks still optimistic.
      onSettled: () => {
        const inFlight = queryClient.isMutating({
          mutationKey: trpc.sales.logActivity.mutationKey(),
        });
        if (inFlight <= 1) return queryClient.invalidateQueries();
      },
    }),
  );

  function setAnswer(step: YesStep, answer: YesAnswer) {
    saveTick.mutate({
      leadId,
      type: YES_ACTIVITY_TYPE,
      outcome: yesOutcome(step, answers[step] === answer ? null : answer),
    });
  }

  return (
    <ol
      data-testid="yes-path"
      className="grid grid-cols-1 lg:grid-cols-7 lg:gap-2"
    >
      {YES_STEPS.map((step, index) => {
        const answer = answers[step];
        const isLast = index === YES_STEPS.length - 1;
        return (
          <li
            key={step}
            data-testid={`yes-step-${step}`}
            data-answer={answer ?? "none"}
            className="relative flex items-center gap-3 pb-5 last:pb-0 lg:flex-col lg:items-center lg:gap-2 lg:pb-0 lg:text-center"
          >
            {!isLast && (
              <span
                aria-hidden="true"
                className={cn(
                  // Phones: down from this dot to the next.
                  "absolute start-3.5 top-9 bottom-1 w-px",
                  // Wide: across from this dot to the next column's dot.
                  "lg:start-[calc(50%+1.25rem)] lg:-end-[calc(50%-0.75rem)] lg:top-3.5 lg:bottom-auto lg:h-px lg:w-auto",
                  answer === "yes" ? "bg-emerald-500" : "bg-border",
                )}
              />
            )}
            <StepDot answer={answer} number={index + 1} />
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3 lg:flex-col lg:justify-start lg:gap-2">
              <span
                className={cn(
                  "text-pretty font-medium text-sm leading-snug",
                  answer === "no" && "text-muted-foreground line-through",
                )}
              >
                {t("sales.yeses.stepShort", { step })}
              </span>
              <ButtonGroup aria-label={t("sales.yeses.step", { step })}>
                <ToggleMark
                  kind="yes"
                  isOn={answer === "yes"}
                  label={t("sales.yeses.markYes")}
                  onClick={() => setAnswer(step, "yes")}
                />
                <ToggleMark
                  kind="no"
                  isOn={answer === "no"}
                  label={t("sales.yeses.markNo")}
                  onClick={() => setAnswer(step, "no")}
                />
              </ButtonGroup>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StepDot({
  answer,
  number,
}: {
  answer: YesAnswer | undefined;
  number: number;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border font-medium text-xs tabular-nums",
        answer === "yes" && "border-emerald-600 bg-emerald-600 text-white",
        answer === "no" &&
          "border-destructive bg-destructive text-destructive-foreground",
        !answer && "border-border bg-background text-muted-foreground",
      )}
    >
      {answer === "yes" && <CheckIcon className="size-4" />}
      {answer === "no" && <XIcon className="size-4" />}
      {!answer && number}
    </span>
  );
}

const MARK_ON_CLASS: Record<YesAnswer, string> = {
  yes: "border-emerald-600 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400",
  no: "border-destructive bg-destructive/10 text-destructive hover:bg-destructive/20",
};

function ToggleMark({
  kind,
  isOn,
  label,
  onClick,
}: {
  kind: YesAnswer;
  isOn: boolean;
  label: string;
  onClick: () => void;
}) {
  const Icon = kind === "yes" ? CheckIcon : XIcon;
  return (
    <Button
      size="icon-lg"
      variant="outline"
      aria-pressed={isOn}
      aria-label={label}
      onClick={onClick}
      className={cn(isOn && MARK_ON_CLASS[kind])}
    >
      <Icon aria-hidden="true" />
    </Button>
  );
}
