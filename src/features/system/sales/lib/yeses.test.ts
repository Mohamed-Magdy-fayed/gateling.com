import { describe, expect, it } from "vitest";

import {
  parseYesOutcome,
  YES_STEPS,
  yesAnswersFromActivities,
  yesFunnel,
  yesOutcome,
  yesProgress,
} from "./yeses";

const t0 = new Date("2026-11-03T09:00:00Z");
const at = (minutes: number) => new Date(t0.getTime() + minutes * 60_000);

function tick(outcome: string, minutes: number, type = "note") {
  return { type, outcome, createdAt: at(minutes) };
}

describe("yesOutcome / parseYesOutcome", () => {
  it("round-trips yes, no and clear", () => {
    expect(parseYesOutcome("note", yesOutcome("demo", "yes"))).toEqual({
      step: "demo",
      answer: "yes",
    });
    expect(parseYesOutcome("note", yesOutcome("trial", "no"))).toEqual({
      step: "trial",
      answer: "no",
    });
    expect(parseYesOutcome("note", yesOutcome("callTime", null))).toEqual({
      step: "callTime",
      answer: null,
    });
  });

  it("ignores other activity types, plain notes and unknown steps", () => {
    expect(parseYesOutcome("whatsapp_sent", "YES:demo:yes")).toBeNull();
    expect(parseYesOutcome("note", "Called, she was busy")).toBeNull();
    expect(parseYesOutcome("note", null)).toBeNull();
    expect(parseYesOutcome("note", "YES:dance:yes")).toBeNull();
    expect(parseYesOutcome("note", "YES:demo:maybe")).toBeNull();
  });
});

describe("yesAnswersFromActivities", () => {
  it("is empty for a lead with no ticks", () => {
    expect(yesAnswersFromActivities([tick("just a note", 1)])).toEqual({});
  });

  it("takes the latest tick per step, whatever order the log is in", () => {
    const answers = yesAnswersFromActivities([
      tick("YES:demo:no", 5),
      tick("YES:demo:yes", 1),
      tick("YES:callTime:yes", 2),
    ]);
    expect(answers).toEqual({ demo: "no", callTime: "yes" });
  });

  it("lets a clear un-tick a step", () => {
    const answers = yesAnswersFromActivities([
      tick("YES:watchVideo:yes", 1),
      tick("YES:watchVideo:clear", 2),
    ]);
    expect(answers).toEqual({});
  });
});

describe("yesProgress", () => {
  it("counts yeses out of all seven steps", () => {
    expect(YES_STEPS).toHaveLength(7);
    expect(yesProgress({ callTime: "yes", shareProblems: "yes" })).toEqual({
      yes: 2,
      no: 0,
      total: 7,
      hasNo: false,
    });
  });

  it("flags any no", () => {
    expect(yesProgress({ callTime: "yes", demo: "no" })).toEqual({
      yes: 1,
      no: 1,
      total: 7,
      hasNo: true,
    });
  });
});

describe("yesFunnel", () => {
  const since = at(0);
  const yes = (minutes: number) => ({
    answer: "yes" as const,
    at: at(minutes),
  });
  const no = (minutes: number) => ({ answer: "no" as const, at: at(minutes) });

  it("counts yes and no per step, and the rate from the step before", () => {
    const funnel = yesFunnel(
      [
        { callTime: yes(1), shareProblems: yes(2) },
        { callTime: yes(1), shareProblems: no(2) },
        { callTime: yes(1) },
        {},
      ],
      since,
    );
    expect(funnel.leads).toBe(4);
    expect(funnel.steps[0]).toMatchObject({
      step: "callTime",
      yes: 3,
      no: 0,
      rate: 0.75,
    });
    expect(funnel.steps[1]).toMatchObject({
      step: "shareProblems",
      yes: 1,
      no: 1,
      rate: 1 / 3,
    });
    // Nothing reached step 3, so its rate is unknown rather than 0%.
    expect(funnel.steps[3].rate).toBeNull();
  });

  it("counts recent yeses only from `since`", () => {
    const funnel = yesFunnel(
      [{ callTime: yes(-60) }, { callTime: yes(5) }],
      since,
    );
    expect(funnel.steps[0]).toMatchObject({ yes: 2, yesRecent: 1 });
  });

  it("flags the weakest step among steps fed enough leads", () => {
    const leads = [
      { callTime: yes(1), shareProblems: yes(1), watchVideo: yes(1) },
      { callTime: yes(1), shareProblems: yes(1) },
      { callTime: yes(1), shareProblems: yes(1) },
      { callTime: yes(1) },
    ];
    // callTime 4/4, shareProblems 3/4, watchVideo 1/3; demo 0/1 is too thin to judge.
    expect(yesFunnel(leads, since).weakestStep).toBe("watchVideo");
  });

  it("has no weakest step with no leads", () => {
    const funnel = yesFunnel([], since);
    expect(funnel.weakestStep).toBeNull();
    expect(funnel.steps.every((step) => step.rate === null)).toBe(true);
  });
});
