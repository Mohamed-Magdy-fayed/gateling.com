import type { Channel } from "./outcomes";
import type { TodayBucket, TodayBucketId, TodayRow } from "./today-rules";

/**
 * Client session state for the Today page, as a pure reducer plus a pure
 * view derivation — so the parts that decide what the operator sees next are
 * unit-tested without React.
 *
 * The server's bucket list stays the source of truth. The session only adds
 * what a single sitting needs: the pinned Up next lead, skips, leads hidden
 * while their write settles, and which leads already had their call started.
 */

/** How long a terminal outcome (lost, wrong number, park) offers Undo. */
export const UNDO_WINDOW_MS = 5000;
/** Crossfade when Up next advances; disabled under reduced motion. */
export const CROSSFADE_MS = 180;

export type SessionSummary = {
  buckets: TodayBucket[];
  /** Distinct leads with any activity but a note today (server-side, local day). */
  doneToday: number;
  /** Leads whose first contact was today: progress toward the daily cap. */
  newTouchedToday: number;
  newQueueCap: number;
};

type HiddenEntry = {
  /** When the write resolved (client clock); null while it is in flight. */
  resolvedAt: number | null;
  wasPinned: boolean;
};

export type SessionState = {
  pinnedId: string | null;
  skipped: string[];
  hidden: Record<string, HiddenEntry>;
  /** The primary contact action fired for this lead (outcomes promoted). */
  started: Record<string, Channel>;
  /** The outcome set shown, when the operator chose one. */
  channel: Record<string, Channel>;
  seen: string[] | null;
  newIds: string[];
  /** Last write resolution; older responses may not unpin Up next. */
  lastWriteAt: number;
};

export type SessionAction =
  | { type: "received"; summary: SessionSummary; fetchStartedAt: number }
  | { type: "promote"; leadId: string }
  | { type: "skip"; leadId: string }
  | { type: "startOver" }
  | { type: "started"; leadId: string; channel: Channel }
  | { type: "switchChannel"; leadId: string; channel: Channel }
  | { type: "saveStarted"; leadId: string }
  | { type: "saveSucceeded"; leadId: string; at: number }
  | { type: "saveFailed"; leadId: string }
  | { type: "undone"; leadId: string; at: number };

export function initialSessionState(skipped: string[] = []): SessionState {
  return {
    pinnedId: null,
    skipped,
    hidden: {},
    started: {},
    channel: {},
    seen: null,
    newIds: [],
    lastWriteAt: 0,
  };
}

function leadIds(summary: SessionSummary): string[] {
  return summary.buckets.flatMap((b) => b.rows.map((r) => r.lead.id));
}

function without<T>(record: Record<string, T>, key: string): Record<string, T> {
  const { [key]: _removed, ...rest } = record;
  return rest;
}

function onReceived(
  state: SessionState,
  summary: SessionSummary,
  fetchStartedAt: number,
): SessionState {
  const ids = leadIds(summary);
  const present = new Set(ids);

  // The first response fetched after a write resolved is authoritative for
  // that lead: if it is still there (due again today), it shows again.
  const hidden = Object.fromEntries(
    Object.entries(state.hidden).filter(
      ([, entry]) => entry.resolvedAt === null || fetchStartedAt < entry.resolvedAt,
    ),
  );

  const seen = state.seen ?? ids;
  const seenSet = new Set(seen);
  const newIds = [
    ...state.newIds.filter((id) => present.has(id)),
    ...(state.seen ? ids.filter((id) => !seenSet.has(id)) : []),
  ];

  const pinnedGone =
    state.pinnedId !== null &&
    fetchStartedAt >= state.lastWriteAt &&
    !present.has(state.pinnedId) &&
    !(state.pinnedId in hidden);

  return {
    ...state,
    hidden,
    seen: [...new Set([...seen, ...ids])],
    newIds: [...new Set(newIds)],
    pinnedId: pinnedGone ? null : state.pinnedId,
  };
}

export function sessionReducer(
  state: SessionState,
  action: SessionAction,
): SessionState {
  switch (action.type) {
    case "received":
      return onReceived(state, action.summary, action.fetchStartedAt);
    case "promote":
      return {
        ...state,
        pinnedId: action.leadId,
        skipped: state.skipped.filter((id) => id !== action.leadId),
      };
    case "skip":
      return {
        ...state,
        pinnedId: state.pinnedId === action.leadId ? null : state.pinnedId,
        skipped: [...state.skipped.filter((id) => id !== action.leadId), action.leadId],
      };
    case "startOver":
      return { ...state, skipped: [] };
    case "started":
      return {
        ...state,
        started: { ...state.started, [action.leadId]: action.channel },
        channel: { ...state.channel, [action.leadId]: action.channel },
      };
    case "switchChannel":
      return { ...state, channel: { ...state.channel, [action.leadId]: action.channel } };
    case "saveStarted":
      return {
        ...state,
        pinnedId: state.pinnedId === action.leadId ? null : state.pinnedId,
        hidden: {
          ...state.hidden,
          [action.leadId]: {
            resolvedAt: null,
            wasPinned: state.pinnedId === action.leadId,
          },
        },
      };
    case "saveSucceeded": {
      const entry = state.hidden[action.leadId];
      if (!entry) return state;
      return {
        ...state,
        lastWriteAt: Math.max(state.lastWriteAt, action.at),
        hidden: { ...state.hidden, [action.leadId]: { ...entry, resolvedAt: action.at } },
      };
    }
    case "saveFailed":
    case "undone": {
      const entry = state.hidden[action.leadId];
      if (!entry) return state;
      return {
        ...state,
        hidden: without(state.hidden, action.leadId),
        pinnedId: entry.wasPinned ? action.leadId : state.pinnedId,
        lastWriteAt:
          action.type === "undone" ? Math.max(state.lastWriteAt, action.at) : state.lastWriteAt,
      };
    }
  }
}

/** A second outcome cannot be logged for a lead whose write is in flight. */
export function canSave(state: SessionState, leadId: string): boolean {
  return !(leadId in state.hidden);
}

export type SessionItem = {
  row: TodayRow;
  bucket: TodayBucketId;
  isNew: boolean;
};

export type SessionGroup = {
  bucket: TodayBucketId;
  items: SessionItem[];
  /** Rows the server returned for this bucket, before any session hiding. */
  shown: number;
  totalBeforeCap: number;
};

export type SessionView = {
  upNext: SessionItem | null;
  /** Remaining target rows by bucket, excluding Up next and skipped rows. */
  groups: SessionGroup[];
  skipped: SessionItem[];
  /** New-queue rows beyond today's goal — optional work. */
  extra: SessionItem[];
  /** Every visible row, in display order (Up next included). */
  all: SessionItem[];
  progress: { done: number; left: number; ratio: number };
  allSkipped: boolean;
  allDone: boolean;
};

export function deriveView(state: SessionState, summary: SessionSummary): SessionView {
  const hidden = state.hidden;
  const newSet = new Set(state.newIds);
  const skippedSet = new Set(state.skipped);

  const item = (row: TodayRow, bucket: TodayBucketId): SessionItem => ({
    row,
    bucket,
    isNew: newSet.has(row.lead.id),
  });

  // Today's new-lead goal: the cap minus leads already first-contacted today,
  // minus new-queue leads whose first contact is saving right now.
  const newQueue = summary.buckets.find((b) => b.id === "newQueue");
  const savingNew = (newQueue?.rows ?? []).filter((r) => r.lead.id in hidden).length;
  const newTarget = Math.max(0, summary.newQueueCap - summary.newTouchedToday - savingNew);

  const target: SessionItem[] = [];
  const extra: SessionItem[] = [];
  for (const bucket of summary.buckets) {
    const visible = bucket.rows.filter((r) => !(r.lead.id in hidden));
    visible.forEach((row, index) => {
      const into = bucket.id === "newQueue" && index >= newTarget ? extra : target;
      into.push(item(row, bucket.id));
    });
  }

  const skipped = state.skipped
    .map((id) => target.find((t) => t.row.lead.id === id))
    .filter((t): t is SessionItem => t !== undefined);
  const active = target.filter((t) => !skippedSet.has(t.row.lead.id));

  const pinned =
    state.pinnedId === null
      ? undefined
      : [...target, ...extra].find((t) => t.row.lead.id === state.pinnedId);
  const upNext = pinned ?? active[0] ?? null;
  const upNextId = upNext?.row.lead.id;

  const groups: SessionGroup[] = summary.buckets.map((bucket) => ({
    bucket: bucket.id,
    items: active.filter((t) => t.bucket === bucket.id && t.row.lead.id !== upNextId),
    shown: bucket.rows.length,
    totalBeforeCap: bucket.totalBeforeCap,
  }));

  const done = summary.doneToday + Object.keys(hidden).length;
  const left = target.length;
  const ratio = done + left === 0 ? 0 : done / (done + left);

  return {
    upNext,
    groups,
    skipped: skipped.filter((t) => t.row.lead.id !== upNextId),
    extra: extra.filter((t) => t.row.lead.id !== upNextId),
    all: [...target, ...extra],
    progress: { done, left, ratio },
    allSkipped: upNext === null && left > 0,
    allDone: left === 0,
  };
}
