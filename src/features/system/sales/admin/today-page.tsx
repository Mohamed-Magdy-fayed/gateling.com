"use client";

import { KeyboardIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { H1, Lead } from "@/components/ui/typography";
import { useTranslation } from "@/features/core/i18n/client";
import { outcomeById } from "@/features/system/sales/lib/outcomes";
import { canSave } from "@/features/system/sales/lib/today-session";

import { TodayProgress } from "./components/today-progress";
import { TodayQueue } from "./components/today-queue";
import { TodayShortcutsDialog } from "./components/today-shortcuts-dialog";
import { TodaySocialProfiles } from "./components/today-social-profiles";
import { TodayUpNextCard } from "./components/today-up-next-card";
import { useTodaySession } from "./hooks/use-today-session";

const SHORTCUTS_PREF_KEY = "sales-today-shortcuts";

/** Per-viewer on/off for keyboard shortcuts; default on, works without storage. */
function useShortcutPreference(): [boolean, (on: boolean) => void] {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    try {
      setEnabled(window.localStorage.getItem(SHORTCUTS_PREF_KEY) !== "off");
    } catch {
      // Storage unavailable: keep the default.
    }
  }, []);
  const update = (on: boolean) => {
    setEnabled(on);
    try {
      window.localStorage.setItem(SHORTCUTS_PREF_KEY, on ? "on" : "off");
    } catch {
      // The choice then lasts for this page view.
    }
  };
  return [enabled, update];
}

type Props = {
  /**
   * Computed on the server so the advice reflects Cairo business hours rather
   * than whatever timezone the operator's laptop happens to be in.
   */
  callingWindow: {
    isBeforeCallingHours: boolean;
    isAfterCallingHours: boolean;
  };
};

export function SalesTodayPage({ callingWindow }: Props) {
  const { t } = useTranslation();
  const { query, summary, state, view, actions } = useTodaySession();
  const [helpOpen, setHelpOpen] = useState(false);
  const [shortcutsOn, setShortcutsOn] = useShortcutPreference();

  const callingAdvice = callingWindow.isBeforeCallingHours
    ? t("sales.callingWindowTooEarly")
    : callingWindow.isAfterCallingHours
      ? t("sales.callingWindowTooLate")
      : null;
  const upNext = view?.upNext ?? null;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <H1>{t("sales.todayTitle")}</H1>
            {query.isFetching && !query.isPending && (
              <Spinner role="status" aria-label={t("sales.refreshing")} />
            )}
          </div>
          <Lead>{t("sales.todayLead")}</Lead>
        </div>
        <Button
          variant="ghost"
          size="sm"
          aria-keyshortcuts="Shift+Slash"
          onClick={() => setHelpOpen(true)}
          className="pointer-coarse:hidden"
        >
          <KeyboardIcon aria-hidden="true" />
          {t("sales.shortcutsOpen")}
        </Button>
      </header>

      {/* Advice, never a gate — the queue stays visible either way. */}
      {callingAdvice && (
        <Alert>
          <AlertDescription>{callingAdvice}</AlertDescription>
        </Alert>
      )}

      {query.isPending && (
        <div className="flex flex-col gap-4" aria-busy="true">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-80 w-full rounded-lg" />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {query.isError && !summary && (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-wrap items-center gap-3">
            {t("sales.loadFailed")}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void query.refetch()}
            >
              {t("sales.retry")}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {summary && view && !summary.hasProspects && (
        <Card>
          <CardContent className="flex flex-col items-start gap-2">
            <h2 className="font-semibold text-base">{t("sales.noLeadsYet")}</h2>
            <p className="text-muted-foreground text-sm">
              {t("sales.noLeadsYetHint")}
            </p>
            <Button
              variant="outline"
              render={(props) => (
                <Link href="/sales/leads" {...props}>
                  {t("sales.openPipeline")}
                </Link>
              )}
            />
          </CardContent>
        </Card>
      )}

      {summary && view && summary.hasProspects && (
        <>
          <TodayProgress
            done={view.progress.done}
            left={view.progress.left}
            ratio={view.progress.ratio}
            conversations={summary.conversationsToday}
          />

          <section
            aria-labelledby="today-up-next-heading"
            className="flex flex-col gap-3"
          >
            <h2 id="today-up-next-heading" className="font-semibold text-base">
              {t("sales.upNext")}
            </h2>

            {upNext && (
              <div
                key={upNext.row.lead.id}
                className="fade-in-0 animate-in duration-200 motion-reduce:animate-none"
              >
                <TodayUpNextCard
                  item={upNext}
                  timeZone={summary.timeZone}
                  startedChannel={state.started[upNext.row.lead.id]}
                  channel={state.channel[upNext.row.lead.id]}
                  saving={!canSave(state, upNext.row.lead.id)}
                  shortcutsEnabled={shortcutsOn}
                  onStarted={(channel) =>
                    actions.started(upNext.row.lead.id, channel)
                  }
                  onSwitchChannel={(channel) =>
                    actions.switchChannel(upNext.row.lead.id, channel)
                  }
                  onSave={(outcome, at) =>
                    void actions.save(upNext, outcome, at)
                  }
                  onSkip={() => actions.skip(upNext.row.lead.id)}
                  onHelp={() => setHelpOpen(true)}
                />
              </div>
            )}

            {!upNext && view.allSkipped && (
              <Card>
                <CardContent className="flex flex-col items-start gap-2">
                  <p className="font-semibold text-base">
                    {t("sales.allSkippedTitle")}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {t("sales.allSkippedHint")}
                  </p>
                  <Button variant="outline" onClick={actions.startOver}>
                    {t("sales.startOver")}
                  </Button>
                </CardContent>
              </Card>
            )}

            {!upNext && view.allDone && (
              <Card>
                <CardContent className="flex flex-col items-start gap-2">
                  <p className="font-semibold text-base">
                    {t("sales.allDoneTitle")}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {t("sales.allDoneRecap", {
                      conversations: summary.conversationsToday,
                      demos: summary.demosBookedToday,
                      due: summary.dueTomorrow,
                    })}
                  </p>
                </CardContent>
              </Card>
            )}
          </section>

          {upNext && (
            <TodaySocialProfiles key={upNext.row.lead.id} lead={upNext.row.lead} />
          )}

          <TodayQueue
            groups={view.groups}
            skipped={view.skipped}
            extra={view.extra}
            saving={false}
            onPromote={actions.promote}
            onStart={actions.started}
            onPark={(item) =>
              void actions.save(item, outcomeById("park"), null)
            }
            onSkip={actions.skip}
          />
        </>
      )}

      <TodayShortcutsDialog
        open={helpOpen}
        onOpenChange={setHelpOpen}
        enabled={shortcutsOn}
        onEnabledChange={setShortcutsOn}
      />
    </div>
  );
}
