"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSwap } from "@/components/ui/loading-swap";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  type LeadActivityChannel,
  type LeadActivityType,
  type LeadPipelineStatus,
  leadActivityChannelValues,
  leadActivityTypeValues,
  leadPipelineStatusValues,
} from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

/**
 * One click to open, one short form, one click to save.
 *
 * This is the load-bearing interaction of the whole module: if logging a call
 * takes more than a few seconds it stops happening, the activity log goes
 * stale, and every bucket on the Today page becomes a lie. Hence a popover
 * anchored on the row rather than a dialog or a detail-page round trip, and
 * sensible defaults on every field so the fast path is type-nothing-and-save.
 */

/** Sensible channel for each activity type, so the operator rarely picks one. */
const DEFAULT_CHANNEL: Partial<Record<LeadActivityType, LeadActivityChannel>> =
  {
    call: "phone",
    no_answer: "phone",
    call_unclear: "phone",
    whatsapp_sent: "whatsapp",
    whatsapp_reply: "whatsapp",
  };

/**
 * Where a given outcome usually moves the lead. Pre-selecting this is what
 * makes a row leave its bucket on save without the operator thinking about
 * status at all.
 */
const SUGGESTED_STATUS: Partial<Record<LeadActivityType, LeadPipelineStatus>> =
  {
    call: "contacted",
    no_answer: "awaiting_reply",
    call_unclear: "contacted",
    whatsapp_sent: "awaiting_reply",
    whatsapp_reply: "contacted",
    demo_agreed: "demo_agreed",
    demo_scheduled: "demo_scheduled",
    demo_done: "demo_done",
  };

/** `datetime-local` wants a local-time string with no zone suffix. */
function toLocalInputValue(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

type Props = {
  leadId: string;
  /** Called after a successful save so the parent can refetch. */
  onLogged?: () => void;
};

export function QuickLogPopover({ leadId, onLogged }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<LeadActivityType>("call");
  const [channel, setChannel] = useState<LeadActivityChannel | "">("phone");
  const [occurredAt, setOccurredAt] = useState(() =>
    toLocalInputValue(new Date()),
  );
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");
  const [nextActionAt, setNextActionAt] = useState("");
  const [status, setStatus] = useState<LeadPipelineStatus | "none">(
    SUGGESTED_STATUS.call ?? "none",
  );

  const logActivity = useMutation(
    trpc.sales.logActivity.mutationOptions({
      onSuccess: async () => {
        toast.success(t("sales.logSaved"));
        setOpen(false);
        resetForm();
        // Invalidate rather than patch: the row's bucket is *computed*, so the
        // server is the only thing that knows where it belongs now.
        await queryClient.invalidateQueries();
        onLogged?.();
      },
      onError: () => toast.error(t("sales.logFailed")),
    }),
  );

  function resetForm() {
    setType("call");
    setChannel("phone");
    setOccurredAt(toLocalInputValue(new Date()));
    setOutcome("");
    setNotes("");
    setNextActionAt("");
    setStatus(SUGGESTED_STATUS.call ?? "none");
  }

  function handleTypeChange(next: LeadActivityType) {
    setType(next);
    setChannel(DEFAULT_CHANNEL[next] ?? "");
    setStatus(SUGGESTED_STATUS[next] ?? "none");
  }

  function handleSubmit() {
    logActivity.mutate({
      leadId,
      type,
      channel: channel === "" ? null : channel,
      occurredAt: occurredAt ? new Date(occurredAt) : undefined,
      outcome: outcome.trim() || null,
      notes: notes.trim() || null,
      nextActionAt: nextActionAt ? new Date(nextActionAt) : null,
      pipelineStatus: status === "none" ? undefined : status,
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={(props) => (
          <Button size="sm" variant="default" {...props}>
            {t("sales.quickLog")}
          </Button>
        )}
      />
      <PopoverContent align="end" className="w-80 gap-3">
        <div className="flex flex-col gap-1">
          <p className="font-medium text-sm">{t("sales.quickLogTitle")}</p>
          <p className="text-muted-foreground text-xs">
            {t("sales.quickLogDescription")}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`type-${leadId}`}>{t("sales.activityType")}</Label>
          <Select
            value={type}
            onValueChange={(value) =>
              handleTypeChange(value as LeadActivityType)
            }
          >
            <SelectTrigger size="sm" id={`type-${leadId}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {leadActivityTypeValues.map((value) => (
                <SelectItem key={value} value={value}>
                  {t("sales.activityTypes", { type: value })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`channel-${leadId}`}>
            {t("sales.activityChannel")}
          </Label>
          <Select
            value={channel}
            onValueChange={(value) =>
              setChannel(value as LeadActivityChannel | "")
            }
          >
            <SelectTrigger size="sm" id={`channel-${leadId}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {leadActivityChannelValues.map((value) => (
                <SelectItem key={value} value={value}>
                  {t("sales.channels", { channel: value })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`when-${leadId}`}>
            {t("sales.activityOccurredAt")}
          </Label>
          <Input
            id={`when-${leadId}`}
            type="datetime-local"
            value={occurredAt}
            onChange={(event) => setOccurredAt(event.target.value)}
          />
          <p className="text-muted-foreground text-xs">
            {t("sales.activityOccurredAtHint")}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`outcome-${leadId}`}>
            {t("sales.activityOutcome")}
          </Label>
          <Input
            id={`outcome-${leadId}`}
            value={outcome}
            placeholder={t("sales.activityOutcomePlaceholder")}
            onChange={(event) => setOutcome(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`notes-${leadId}`}>{t("sales.activityNotes")}</Label>
          <Textarea
            id={`notes-${leadId}`}
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`next-${leadId}`}>
            {t("sales.activityNextAction")}
          </Label>
          <Input
            id={`next-${leadId}`}
            type="datetime-local"
            value={nextActionAt}
            onChange={(event) => setNextActionAt(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`status-${leadId}`}>
            {t("sales.activityNewStatus")}
          </Label>
          <Select
            value={status}
            onValueChange={(value) =>
              setStatus(value as LeadPipelineStatus | "none")
            }
          >
            <SelectTrigger size="sm" id={`status-${leadId}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                {t("sales.activityNoStatusChange")}
              </SelectItem>
              {leadPipelineStatusValues.map((value) => (
                <SelectItem key={value} value={value}>
                  {t("sales.statuses", { status: value })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={logActivity.isPending}
        >
          <LoadingSwap isLoading={logActivity.isPending}>
            {t("common.save")}
          </LoadingSwap>
        </Button>
      </PopoverContent>
    </Popover>
  );
}
