/**
 * The yeses we need from an atelier owner, in order — the founder's checklist
 * for every lead. The operator ticks each one as yes (✓) or no (✗) as the
 * conversation goes; the lead's progress bar counts the yeses and turns red
 * once any step got a no.
 *
 * Stored with no schema change, as an outcome-text convention like the VIDEO
 * and DEPOSIT notes: each tick appends a `note` activity whose outcome is
 * `YES:<step>:<answer>`. The log is append-only, so the latest entry per step
 * wins and `clear` un-ticks a step.
 *
 * Ticks are bookkeeping, not contact: a `note` never touches the derived
 * columns (`derived.ts`), and Today does not count a tick as work done.
 */

export const YES_STEPS = [
  "callTime",
  "shareProblems",
  "watchVideo",
  "demo",
  "trial",
  "subscribe",
  "referrals",
] as const;

export type YesStep = (typeof YES_STEPS)[number];
export type YesAnswer = "yes" | "no";
export type YesAnswers = Partial<Record<YesStep, YesAnswer>>;

export type YesProgressSummary = {
  yes: number;
  no: number;
  total: number;
  /** At least one step got a no: the bar turns red. */
  hasNo: boolean;
};

const OUTCOME_PREFIX = "YES:";
const STEP_SET = new Set<string>(YES_STEPS);

/** The activity type a tick is logged as. */
export const YES_ACTIVITY_TYPE = "note";

/** SQL `like` pattern matching every tick's outcome. */
export const YES_OUTCOME_LIKE = `${OUTCOME_PREFIX}%`;

export function yesOutcome(step: YesStep, answer: YesAnswer | null): string {
  return `${OUTCOME_PREFIX}${step}:${answer ?? "clear"}`;
}

type ParsedTick = { step: YesStep; answer: YesAnswer | null };

export function parseYesOutcome(
  type: string,
  outcome: string | null,
): ParsedTick | null {
  if (type !== YES_ACTIVITY_TYPE || !outcome?.startsWith(OUTCOME_PREFIX)) {
    return null;
  }
  const [step, answer] = outcome.slice(OUTCOME_PREFIX.length).split(":");
  if (!step || !STEP_SET.has(step)) return null;
  if (answer === "yes" || answer === "no") {
    return { step: step as YesStep, answer };
  }
  if (answer === "clear") return { step: step as YesStep, answer: null };
  return null;
}

export type YesActivityFacts = {
  type: string;
  outcome: string | null;
  createdAt: Date;
};

/** A step's current answer and when it was given. */
export type YesTicks = Partial<
  Record<YesStep, { answer: YesAnswer; at: Date }>
>;

/** Each step's current answer: the latest tick (by when it was logged) wins. */
export function yesTicksFromActivities(
  activities: readonly YesActivityFacts[],
): YesTicks {
  const latest = new Map<YesStep, { at: Date; answer: YesAnswer | null }>();
  for (const activity of activities) {
    const tick = parseYesOutcome(activity.type, activity.outcome);
    if (!tick) continue;
    const seen = latest.get(tick.step);
    if (!seen || activity.createdAt >= seen.at) {
      latest.set(tick.step, { at: activity.createdAt, answer: tick.answer });
    }
  }
  const ticks: YesTicks = {};
  for (const [step, { answer, at }] of latest) {
    if (answer) ticks[step] = { answer, at };
  }
  return ticks;
}

export function yesAnswersFromActivities(
  activities: readonly YesActivityFacts[],
): YesAnswers {
  const answers: YesAnswers = {};
  for (const [step, tick] of Object.entries(
    yesTicksFromActivities(activities),
  )) {
    answers[step as YesStep] = tick.answer;
  }
  return answers;
}

export type YesFunnelStep = {
  step: YesStep;
  /** Leads whose current answer for this step is yes. */
  yes: number;
  /** Leads who said no here — where the funnel leaks. */
  no: number;
  /** Of those yeses, how many were ticked since `since`. */
  yesRecent: number;
  /** Yeses here per yes at the step before (the lead count for step 1); null when nothing came in. */
  rate: number | null;
};

export type YesFunnel = {
  leads: number;
  steps: YesFunnelStep[];
  /** The step losing the most of what reached it, among steps fed enough to judge. */
  weakestStep: YesStep | null;
};

/** A step needs this many leads coming in before its rate says anything. */
export const WEAKEST_STEP_MIN_INFLOW = 3;

/**
 * The yes funnel across all leads: how many reached each yes, how many said
 * no there, and the step-to-step rate. Steps are counted independently — a
 * yes ticked out of order still counts at its own step.
 */
export function yesFunnel(leads: readonly YesTicks[], since: Date): YesFunnel {
  const counted = YES_STEPS.map((step) => {
    const ticks = leads.map((lead) => lead[step]);
    return {
      step,
      yes: ticks.filter((tick) => tick?.answer === "yes").length,
      no: ticks.filter((tick) => tick?.answer === "no").length,
      yesRecent: ticks.filter(
        (tick) => tick?.answer === "yes" && tick.at >= since,
      ).length,
    };
  });

  const steps = counted.map((current, index): YesFunnelStep => {
    const inflow = index === 0 ? leads.length : counted[index - 1].yes;
    return {
      ...current,
      rate: inflow > 0 ? Math.min(1, current.yes / inflow) : null,
    };
  });

  const judged = steps.filter(
    (step, index) =>
      step.rate !== null &&
      (index === 0 ? leads.length : steps[index - 1].yes) >=
        WEAKEST_STEP_MIN_INFLOW,
  );
  const weakest = judged.reduce<YesFunnelStep | null>(
    (worst, step) =>
      !worst || (step.rate ?? 1) < (worst.rate ?? 1) ? step : worst,
    null,
  );

  return { leads: leads.length, steps, weakestStep: weakest?.step ?? null };
}

export function yesProgress(answers: YesAnswers): YesProgressSummary {
  const values = YES_STEPS.map((step) => answers[step]);
  const yes = values.filter((a) => a === "yes").length;
  const no = values.filter((a) => a === "no").length;
  return { yes, no, total: YES_STEPS.length, hasNo: no > 0 };
}
