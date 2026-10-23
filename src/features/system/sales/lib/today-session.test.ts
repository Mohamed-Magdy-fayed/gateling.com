import { describe, expect, it } from "vitest";

import {
  canSave,
  deriveView,
  initialSessionState,
  type SessionAction,
  type SessionState,
  type SessionSummary,
  sessionReducer,
} from "./today-session";
import type { TodayBucketId, TodayRow } from "./today-rules";

function row(id: string): TodayRow {
  return { lead: { id }, reason: { kind: "newQueue" } } as unknown as TodayRow;
}

type Shape = Partial<Record<TodayBucketId, string[]>> & {
  done?: number;
  touched?: number;
  cap?: number;
};

const ORDER: TodayBucketId[] = ["rescue", "overdue", "followUp", "newQueue", "autoPark"];

function summary(shape: Shape): SessionSummary {
  return {
    buckets: ORDER.map((id) => ({
      id,
      rows: (shape[id] ?? []).map(row),
      totalBeforeCap: (shape[id] ?? []).length,
    })),
    doneToday: shape.done ?? 0,
    newTouchedToday: shape.touched ?? 0,
    newQueueCap: shape.cap ?? 10,
  };
}

function run(actions: SessionAction[], from: SessionState = initialSessionState()) {
  return actions.reduce(sessionReducer, from);
}

const received = (s: SessionSummary, fetchStartedAt: number): SessionAction => ({
  type: "received",
  summary: s,
  fetchStartedAt,
});

const ids = (items: { row: TodayRow }[]) => items.map((i) => i.row.lead.id);

describe("Up next", () => {
  it("is the first row of the highest-priority bucket", () => {
    const s = summary({ overdue: ["o1"], newQueue: ["n1", "n2"] });
    const view = deriveView(run([received(s, 1)]), s);
    expect(view.upNext?.row.lead.id).toBe("o1");
    expect(view.upNext?.bucket).toBe("overdue");
  });

  it("stays pinned when a refetch surfaces a higher-priority lead, which is marked New", () => {
    const first = summary({ newQueue: ["n1", "n2"] });
    const later = summary({ rescue: ["r1"], newQueue: ["n1", "n2"] });
    const state = run([received(first, 1), { type: "promote", leadId: "n1" }, received(later, 2)]);
    const view = deriveView(state, later);
    expect(view.upNext?.row.lead.id).toBe("n1");
    const rescue = view.groups.find((g) => g.bucket === "rescue");
    expect(rescue?.items.map((i) => [i.row.lead.id, i.isNew])).toEqual([["r1", true]]);
  });

  it("returns the previous Up next to its own slot when another row is promoted", () => {
    const s = summary({ overdue: ["o1"], newQueue: ["n1", "n2"] });
    const state = run([received(s, 1), { type: "promote", leadId: "n2" }]);
    const view = deriveView(state, s);
    expect(view.upNext?.row.lead.id).toBe("n2");
    expect(view.groups.flatMap((g) => ids(g.items))).toEqual(["o1", "n1"]);
  });

  it("unpins a lead that a post-write response no longer contains", () => {
    const s = summary({ overdue: ["o1", "o2"] });
    const gone = summary({ overdue: ["o2"] });
    const state = run([
      received(s, 1),
      { type: "promote", leadId: "o1" },
      { type: "saveStarted", leadId: "o2" },
      { type: "saveSucceeded", leadId: "o2", at: 5 },
      received(gone, 6),
    ]);
    expect(state.pinnedId).toBeNull();
    expect(deriveView(state, gone).upNext?.row.lead.id).toBe("o2");
  });
});

describe("saving an outcome", () => {
  const s = summary({ overdue: ["o1", "o2"] });

  it("removes the lead optimistically and advances", () => {
    const state = run([received(s, 1), { type: "saveStarted", leadId: "o1" }]);
    const view = deriveView(state, s);
    expect(view.upNext?.row.lead.id).toBe("o2");
    expect(view.progress).toMatchObject({ done: 1, left: 1 });
  });

  it("blocks a second save on the same lead while one is pending", () => {
    const state = run([received(s, 1), { type: "saveStarted", leadId: "o1" }]);
    expect(canSave(state, "o1")).toBe(false);
    expect(canSave(state, "o2")).toBe(true);
  });

  it("rolls back a failed save, keeping the lead Up next", () => {
    const state = run([
      received(s, 1),
      { type: "saveStarted", leadId: "o1" },
      { type: "saveFailed", leadId: "o1" },
    ]);
    const view = deriveView(state, s);
    expect(view.upNext?.row.lead.id).toBe("o1");
    expect(view.progress).toMatchObject({ done: 0, left: 2 });
  });

  it("puts a rolled-back pinned lead back Up next", () => {
    const pinned = run([
      received(s, 1),
      { type: "promote", leadId: "o2" },
      { type: "saveStarted", leadId: "o2" },
      { type: "saveFailed", leadId: "o2" },
    ]);
    expect(deriveView(pinned, s).upNext?.row.lead.id).toBe("o2");
  });

  // A response whose fetch started before the write resolved still contains
  // the lead; it must not come back.
  it("keeps the lead hidden in a stale pre-write response", () => {
    const state = run([
      received(s, 1),
      { type: "saveStarted", leadId: "o1" },
      { type: "saveSucceeded", leadId: "o1", at: 10 },
      received(s, 9),
    ]);
    expect(ids(deriveView(state, s).all)).toEqual(["o2"]);
  });

  // Call back at 17:00 makes the lead due again the same day: the first
  // response fetched after the write is authoritative.
  it("shows the lead again when a post-write response still has it", () => {
    const state = run([
      received(s, 1),
      { type: "saveStarted", leadId: "o1" },
      { type: "saveSucceeded", leadId: "o1", at: 10 },
      received(summary({ overdue: ["o1", "o2"], done: 1 }), 11),
    ]);
    const view = deriveView(state, summary({ overdue: ["o1", "o2"], done: 1 }));
    expect(ids(view.all)).toEqual(["o1", "o2"]);
    // Counted in both Done and Left: the bar may dip (accepted).
    expect(view.progress).toMatchObject({ done: 1, left: 2 });
  });
});

describe("undo", () => {
  it("returns the lead at its slot and reverses the progress", () => {
    const s = summary({ overdue: ["o1", "o2"] });
    const state = run([
      received(s, 1),
      { type: "saveStarted", leadId: "o1" },
      { type: "saveSucceeded", leadId: "o1", at: 10 },
      { type: "undone", leadId: "o1", at: 20 },
    ]);
    const view = deriveView(state, s);
    expect(view.upNext?.row.lead.id).toBe("o1");
    expect(view.progress).toMatchObject({ done: 0, left: 2 });
  });
});

describe("skip", () => {
  const s = summary({ overdue: ["o1"], newQueue: ["n1", "n2"] });

  it("moves the lead to the end and advances", () => {
    const view = deriveView(run([received(s, 1), { type: "skip", leadId: "o1" }]), s);
    expect(view.upNext?.row.lead.id).toBe("n1");
    expect(ids(view.skipped)).toEqual(["o1"]);
  });

  it("survives a refetch", () => {
    const state = run([received(s, 1), { type: "skip", leadId: "o1" }, received(s, 2)]);
    expect(deriveView(state, s).upNext?.row.lead.id).toBe("n1");
  });

  it("restores skipped ids passed in from storage", () => {
    const view = deriveView(run([received(s, 1)], initialSessionState(["n1"])), s);
    expect(ids(view.skipped)).toEqual(["n1"]);
  });

  it("reports when every remaining lead was skipped, and Start over clears it", () => {
    const allSkipped = run([
      received(s, 1),
      { type: "skip", leadId: "o1" },
      { type: "skip", leadId: "n1" },
      { type: "skip", leadId: "n2" },
    ]);
    const view = deriveView(allSkipped, s);
    expect(view.upNext).toBeNull();
    expect(view.allSkipped).toBe(true);
    expect(view.allDone).toBe(false);

    const again = deriveView(sessionReducer(allSkipped, { type: "startOver" }), s);
    expect(again.upNext?.row.lead.id).toBe("o1");
    expect(again.allSkipped).toBe(false);
  });
});

describe("progress and the daily new-lead target", () => {
  it("is 0 when there is nothing done and nothing left", () => {
    const s = summary({});
    const view = deriveView(run([received(s, 1)]), s);
    expect(view.progress).toEqual({ done: 0, left: 0, ratio: 0 });
    expect(view.allDone).toBe(true);
  });

  // The new queue refills from a pool of 37, but today's goal is 10: working
  // through 10 must reach 100% and stay there, with the rest offered as Extra.
  it("reaches 100% after the daily cap of new leads and stays there", () => {
    const pool = Array.from({ length: 37 }, (_, i) => `n${i}`);
    let state = initialSessionState();
    let clock = 0;
    let s = summary({ newQueue: pool.slice(0, 10), cap: 10 });
    state = sessionReducer(state, received(s, ++clock));

    for (let worked = 1; worked <= 10; worked++) {
      const lead = pool[worked - 1];
      state = run(
        [
          { type: "saveStarted", leadId: lead },
          { type: "saveSucceeded", leadId: lead, at: ++clock },
        ],
        state,
      );
      s = summary({
        newQueue: pool.slice(worked, worked + 10),
        cap: 10,
        touched: worked,
        done: worked,
      });
      state = sessionReducer(state, received(s, ++clock));
    }

    const view = deriveView(state, s);
    expect(view.progress).toEqual({ done: 10, left: 0, ratio: 1 });
    expect(view.allDone).toBe(true);
    expect(view.upNext).toBeNull();
    expect(view.extra).toHaveLength(10);
  });

  it("does not let an extra row slip into the target while the last new lead saves", () => {
    const s = summary({
      newQueue: ["n9", "x1", "x2"],
      cap: 10,
      touched: 9,
      done: 9,
    });
    const state = run([received(s, 1), { type: "saveStarted", leadId: "n9" }]);
    const view = deriveView(state, s);
    expect(view.progress).toEqual({ done: 10, left: 0, ratio: 1 });
    expect(ids(view.extra)).toEqual(["x1", "x2"]);
  });
});

describe("outcome emphasis", () => {
  it("remembers that the call started, and on which channel, per lead", () => {
    const s = summary({ overdue: ["o1", "o2"] });
    const state = run([
      received(s, 1),
      { type: "started", leadId: "o1", channel: "whatsapp" },
    ]);
    expect(state.started).toEqual({ o1: "whatsapp" });
    expect(state.channel).toEqual({ o1: "whatsapp" });
  });

  it("lets the channel be switched without marking the call started", () => {
    const s = summary({ overdue: ["o1"] });
    const state = run([
      received(s, 1),
      { type: "switchChannel", leadId: "o1", channel: "whatsapp" },
    ]);
    expect(state.channel).toEqual({ o1: "whatsapp" });
    expect(state.started).toEqual({});
  });
});
