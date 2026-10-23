"use client";

import { CopyIcon, MessageCircleIcon, PhoneIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/features/core/i18n/client";
import {
  type Channel,
  contactActions,
  type Outcome,
  outcomeById,
  outcomesFor,
  primaryActionFor,
  startingChannel,
} from "@/features/system/sales/lib/outcomes";
import {
  callShortcutBehaviour,
  mapShortcut,
} from "@/features/system/sales/lib/today-shortcuts";
import type { SessionItem } from "@/features/system/sales/lib/today-session";
import { toWhatsAppUrl } from "@/lib/phone";

import { OutcomeButtons, OutcomeTimePicker } from "./outcome-buttons";
import { QuickLogPopover } from "./quick-log-popover";
import { reasonText } from "./today-reason";

type Props = {
  item: SessionItem;
  timeZone: string;
  /** The primary contact action already fired for this lead. */
  startedChannel: Channel | undefined;
  /** The outcome set the operator switched to, if any. */
  channel: Channel | undefined;
  saving: boolean;
  shortcutsEnabled: boolean;
  onStarted: (channel: Channel) => void;
  onSwitchChannel: (channel: Channel) => void;
  onSave: (outcome: Outcome, at: Date | null) => void;
  onSkip: () => void;
  onHelp: () => void;
};

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

function overlayOpen(): boolean {
  return document.querySelector('[role="dialog"],[role="alertdialog"],[role="menu"]') !== null;
}

/**
 * The one lead to work now. Everything needed to make the contact is here,
 * and the bucket's recommended action is the only primary button.
 */
export function TodayUpNextCard({
  item,
  timeZone,
  startedChannel,
  channel,
  saving,
  shortcutsEnabled,
  onStarted,
  onSwitchChannel,
  onSave,
  onSkip,
  onHelp,
}: Props) {
  const { t } = useTranslation();
  const { lead } = item.row;
  const reasonId = useId();
  const callRef = useRef<HTMLAnchorElement>(null);
  const whatsappRef = useRef<HTMLAnchorElement>(null);
  const firstOutcomeRef = useRef<HTMLButtonElement>(null);
  const [pendingOutcome, setPendingOutcome] = useState<Outcome | null>(null);

  const primary = primaryActionFor(item.bucket, lead);
  const contact = contactActions(item.bucket, lead);
  const activeChannel = channel ?? startingChannel(item.bucket, lead);
  const outcomes = outcomesFor(item.bucket, activeChannel);
  const whatsappUrl = toWhatsAppUrl(lead.phone);
  const promoted = startedChannel !== undefined || item.bucket === "autoPark";

  // Pressing Call or WhatsApp promotes the outcomes and puts focus on them.
  useEffect(() => {
    if (startedChannel) firstOutcomeRef.current?.focus();
  }, [startedChannel]);

  function selectOutcome(outcome: Outcome) {
    if (outcome.needsTime) setPendingOutcome(outcome);
    else onSave(outcome, null);
  }

  async function copyNumber() {
    if (!lead.phone) return;
    try {
      await navigator.clipboard.writeText(lead.phone);
      toast.success(t("sales.numberCopied"));
      onStarted("call");
    } catch {
      toast.error(t("sales.copyFailed"));
    }
  }

  const keyState = useRef({ outcomes, pendingOutcome, contact, shortcutsEnabled });
  keyState.current = { outcomes, pendingOutcome, contact, shortcutsEnabled };
  const handlers = useRef({ copyNumber, onSkip, onHelp, onStarted, selectOutcome });
  handlers.current = { copyNumber, onSkip, onHelp, onStarted, selectOutcome };

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const s = keyState.current;
      const action = mapShortcut(event, {
        enabled: s.shortcutsEnabled,
        targetIsEditable: isEditable(event.target),
        overlayOpen: overlayOpen(),
        canCall: s.contact.call.visible && s.contact.call.enabled,
        canWhatsapp: s.contact.whatsapp.visible && s.contact.whatsapp.enabled,
        canSkip: true,
        outcomeCount: s.outcomes.length,
        outcomesSuspended: s.pendingOutcome !== null,
      });
      if (!action) return;
      event.preventDefault();
      const h = handlers.current;
      switch (action.kind) {
        case "call": {
          const coarse = window.matchMedia("(pointer: coarse)").matches;
          if (callShortcutBehaviour(coarse ? "coarse" : "fine") === "dial") {
            callRef.current?.click();
          } else {
            void h.copyNumber();
          }
          return;
        }
        case "whatsapp":
          whatsappRef.current?.click();
          return;
        case "skip":
          h.onSkip();
          return;
        case "help":
          h.onHelp();
          return;
        case "outcome": {
          const outcome = s.outcomes[action.index];
          if (outcome) h.selectOutcome(outcome);
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const disabledReason =
    contact.call.visible && !contact.call.enabled ? t("sales.disabledNoPhone") : null;
  const unconfirmed =
    contact.whatsapp.visible && contact.whatsapp.enabled && contact.whatsapp.unconfirmed;

  const callLink = (isPrimary: boolean) => {
    if (!contact.call.visible) return null;
    const label = (
      <>
        <PhoneIcon aria-hidden="true" />
        {t("sales.primaryAction", { action: "call" })}
      </>
    );
    // Disabled but focusable, so the reason is reachable by keyboard.
    if (!contact.call.enabled) {
      return (
        <Button
          variant={isPrimary ? "default" : "outline"}
          size="lg"
          disabled
          focusableWhenDisabled
          aria-describedby={reasonId}
          className="max-sm:min-h-11 max-sm:w-full"
        >
          {label}
        </Button>
      );
    }
    return (
      <Button
        variant={isPrimary ? "default" : "outline"}
        size="lg"
        aria-keyshortcuts="C"
        className="max-sm:min-h-11 max-sm:w-full"
        render={(props) => (
          <a ref={callRef} href={`tel:${lead.phone}`} onClick={() => onStarted("call")} {...props}>
            {label}
          </a>
        )}
      />
    );
  };

  const whatsappLink = (isPrimary: boolean) =>
    contact.whatsapp.visible &&
    whatsappUrl && (
      <Button
        variant={isPrimary ? "default" : "outline"}
        size="lg"
        aria-keyshortcuts="W"
        className="max-sm:min-h-11 max-sm:w-full"
        render={(props) => (
          <a
            ref={whatsappRef}
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onStarted("whatsapp")}
            {...props}
          >
            <MessageCircleIcon aria-hidden="true" />
            {t("sales.primaryAction", { action: "whatsapp" })}
          </a>
        )}
      />
    );

  return (
    <Card className="shadow-md ring-primary/20">
      <CardContent className="flex flex-col gap-5">
        {/* 1. Who */}
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-xl">
              <Link href={`/sales/leads/${lead.id}`} className="hover:underline">
                {lead.name}
              </Link>
            </h3>
            {lead.tier && <Badge variant="secondary">{lead.tier}</Badge>}
            {item.isNew && <Badge variant="outline">{t("sales.newMarker")}</Badge>}
          </div>
          <p className="text-muted-foreground text-sm">
            {[lead.nameAr, lead.city, lead.area].filter(Boolean).join(" · ")}
            {item.row.daysSinceLastContact !== null &&
              ` · ${t("sales.daysSinceContact", { days: item.row.daysSinceLastContact })}`}
          </p>
        </div>

        {/* 2. Why now */}
        <div className="flex flex-col gap-1">
          <p className="text-sm">{reasonText(item.row.reason, t)}</p>
          {item.row.openingAngle && (
            <p className="text-muted-foreground text-sm">{item.row.openingAngle}</p>
          )}
        </div>

        {/* 3. Contact zone */}
        <div className="flex flex-col gap-3">
          {lead.phone && (
            <div className="flex flex-wrap items-center gap-2">
              <span dir="ltr" className="font-mono font-semibold text-2xl tabular-nums">
                {lead.phone}
              </span>
              <Button
                variant="outline"
                size="lg"
                onClick={() => void copyNumber()}
                className="max-sm:min-h-11"
              >
                <CopyIcon aria-hidden="true" />
                {t("sales.copyNumber")}
              </Button>
            </div>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {primary === "call" && callLink(true)}
            {primary === "whatsapp" && whatsappLink(true)}
            {primary === "park" && (
              <Button
                size="lg"
                disabled={saving}
                onClick={() => onSave(outcomeById("park"), null)}
                className="max-sm:min-h-11 max-sm:w-full"
              >
                {t("sales.primaryAction", { action: "park" })}
              </Button>
            )}
            {primary === "openLead" && (
              <Button
                size="lg"
                className="max-sm:min-h-11 max-sm:w-full"
                render={(props) => (
                  <Link href={`/sales/leads/${lead.id}`} {...props}>
                    {t("sales.primaryAction", { action: "openLead" })}
                  </Link>
                )}
              />
            )}
            {primary !== "call" && callLink(false)}
            {primary !== "whatsapp" && whatsappLink(false)}
          </div>
          {(disabledReason || unconfirmed) && (
            <p id={reasonId} className="text-muted-foreground text-xs">
              {disabledReason ?? t("sales.whatsappUnconfirmed")}
            </p>
          )}
        </div>

        {/* 4. How did it go */}
        <div className="flex flex-col gap-3">
          {item.bucket !== "autoPark" && (
            <ButtonGroup aria-label={t("sales.channelLabel")}>
              {(["call", "whatsapp"] as const).map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={activeChannel === value ? "secondary" : "outline"}
                  aria-pressed={activeChannel === value}
                  onClick={() => onSwitchChannel(value)}
                  className="max-sm:min-h-11"
                >
                  {t("sales.channel", { channel: value })}
                </Button>
              ))}
            </ButtonGroup>
          )}
          <OutcomeButtons
            outcomes={outcomes}
            promoted={promoted}
            prompt={
              item.bucket === "autoPark"
                ? t("sales.outcomesPromptAutoPark")
                : activeChannel === "whatsapp"
                  ? t("sales.outcomesPromptWhatsapp")
                  : t("sales.outcomesPromptCall")
            }
            pendingId={pendingOutcome?.id ?? null}
            disabled={saving}
            onSelect={selectOutcome}
            firstRef={firstOutcomeRef}
          />
          {pendingOutcome && (
            <OutcomeTimePicker
              timeZone={timeZone}
              saving={saving}
              onConfirm={(at) => {
                onSave(pendingOutcome, at);
                setPendingOutcome(null);
              }}
              onCancel={() => setPendingOutcome(null)}
            />
          )}
        </div>

        {/* 5. Tertiary */}
        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            aria-keyshortcuts="S"
            onClick={onSkip}
            className="max-sm:min-h-11"
          >
            {t("sales.skipForNow")}
          </Button>
          <QuickLogPopover
            leadId={lead.id}
            triggerLabel={t("sales.moreDetails")}
            triggerVariant="ghost"
          />
        </div>
      </CardContent>
    </Card>
  );
}
