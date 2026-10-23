"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo, useReducer } from "react";
import { toast } from "sonner";

import { useTranslation } from "@/features/core/i18n/client";
import { localDateKey } from "@/features/system/sales/lib/day-window";
import {
  type Channel,
  type Outcome,
  outcomeToLogInput,
} from "@/features/system/sales/lib/outcomes";
import {
  canSave,
  deriveView,
  initialSessionState,
  type SessionItem,
  sessionReducer,
  UNDO_WINDOW_MS,
} from "@/features/system/sales/lib/today-session";
import type { TodayWorkSummary } from "@/features/system/sales/server/schemas";
import { DEFAULT_BUSINESS_TIMEZONE } from "@/features/system/settings/lib/system-settings-registry";
import { useTRPC, useTRPCClient } from "@/integrations/trpc/client";

const SKIP_KEY_PREFIX = "sales-today-skips:";

/** Storage can be missing or throw (private mode); the page works without it. */
function readSkips(dateKey: string): string[] {
  try {
    const raw = window.sessionStorage.getItem(SKIP_KEY_PREFIX + dateKey);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeSkips(dateKey: string, skipped: string[]) {
  try {
    window.sessionStorage.setItem(SKIP_KEY_PREFIX + dateKey, JSON.stringify(skipped));
  } catch {
    // Skips then last for this page view only.
  }
}

type SaveError = "notFound" | "doNotContact" | "failed";

function classify(error: unknown): SaveError {
  if (error instanceof TRPCClientError) {
    const code: unknown = error.data?.code;
    if (code === "NOT_FOUND") return "notFound";
    if (code === "PRECONDITION_FAILED") return "doNotContact";
  }
  return "failed";
}

/**
 * The Today page's data and session in one place: fetches `sales.today`
 * stamped with when each fetch started (the stale-refetch guard needs it),
 * runs the session reducer, persists skips for the local day, and performs
 * outcome saves with optimistic removal, rollback and compensating Undo.
 */
export function useTodaySession() {
  const trpc = useTRPC();
  const client = useTRPCClient();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const todayKey = useMemo(() => trpc.sales.today.queryKey(), [trpc]);
  const query = useQuery({
    queryKey: [...todayKey, "session"],
    queryFn: async ({ signal }) => {
      const fetchStartedAt = Date.now();
      const summary: TodayWorkSummary = await client.sales.today.query({}, { signal });
      return { summary, fetchStartedAt };
    },
  });

  const [state, dispatch] = useReducer(sessionReducer, undefined, () =>
    initialSessionState(
      typeof window === "undefined"
        ? []
        : readSkips(localDateKey(new Date(), DEFAULT_BUSINESS_TIMEZONE)),
    ),
  );

  const response = query.data;
  useEffect(() => {
    if (response) {
      dispatch({
        type: "received",
        summary: response.summary,
        fetchStartedAt: response.fetchStartedAt,
      });
    }
  }, [response]);

  const summary = response?.summary;
  const dateKey = summary ? localDateKey(summary.now, summary.timeZone) : null;
  useEffect(() => {
    if (dateKey) writeSkips(dateKey, state.skipped);
  }, [dateKey, state.skipped]);

  const view = useMemo(() => (summary ? deriveView(state, summary) : null), [state, summary]);

  const refetchToday = useCallback(
    () => queryClient.invalidateQueries({ queryKey: todayKey }),
    [queryClient, todayKey],
  );

  const logMutation = useMutation(trpc.sales.logActivity.mutationOptions());
  const parkMutation = useMutation(trpc.sales.park.mutationOptions());

  const undo = useCallback(
    async (item: SessionItem) => {
      const { lead } = item.row;
      try {
        await logMutation.mutateAsync({
          leadId: lead.id,
          type: "status_change",
          pipelineStatus: lead.pipelineStatus,
          nextActionAt: lead.nextActionAt,
        });
        dispatch({ type: "undone", leadId: lead.id, at: Date.now() });
        toast.success(t("sales.undone"));
      } catch {
        toast.error(t("sales.undoFailed"));
      }
      await refetchToday();
    },
    [logMutation, refetchToday, t],
  );

  const save = useCallback(
    async (item: SessionItem, outcome: Outcome, at: Date | null) => {
      const { lead } = item.row;
      if (!canSave(state, lead.id)) return;

      const payload =
        outcome.kind === "park" ? null : outcomeToLogInput(outcome, lead.id, at, new Date());
      if (payload && !payload.ok) return;

      // A fetch already in flight would return the lead we are removing.
      await queryClient.cancelQueries({ queryKey: todayKey });
      dispatch({ type: "saveStarted", leadId: lead.id });

      try {
        if (payload) await logMutation.mutateAsync(payload.input);
        else await parkMutation.mutateAsync({ leadId: lead.id });
        dispatch({ type: "saveSucceeded", leadId: lead.id, at: Date.now() });

        const message = t("sales.outcomeSaved", { name: lead.name });
        if (outcome.terminal) {
          toast.success(message, {
            duration: UNDO_WINDOW_MS,
            action: { label: t("sales.undo"), onClick: () => void undo(item) },
          });
        } else {
          toast.success(message);
        }
      } catch (error) {
        const kind = classify(error);
        if (kind === "notFound") {
          // Gone from the pipeline: drop it rather than bring it back.
          dispatch({ type: "saveSucceeded", leadId: lead.id, at: Date.now() });
          toast.error(t("sales.leadNotFound"));
        } else {
          dispatch({ type: "saveFailed", leadId: lead.id });
          toast.error(
            kind === "doNotContact" ? t("sales.doNotContactBlocked") : t("sales.logFailed"),
            kind === "failed"
              ? {
                  action: {
                    label: t("sales.retry"),
                    onClick: () => void save(item, outcome, at),
                  },
                }
              : undefined,
          );
        }
      }
      await refetchToday();
    },
    [state, queryClient, todayKey, logMutation, parkMutation, refetchToday, t, undo],
  );

  const actions = useMemo(
    () => ({
      promote: (leadId: string) => dispatch({ type: "promote", leadId }),
      skip: (leadId: string) => dispatch({ type: "skip", leadId }),
      startOver: () => dispatch({ type: "startOver" }),
      started: (leadId: string, channel: Channel) =>
        dispatch({ type: "started", leadId, channel }),
      switchChannel: (leadId: string, channel: Channel) =>
        dispatch({ type: "switchChannel", leadId, channel }),
      save,
      refetch: refetchToday,
    }),
    [save, refetchToday],
  );

  return { query, summary, state, view, actions };
}
