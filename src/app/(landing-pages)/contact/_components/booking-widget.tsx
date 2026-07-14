"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { CalendarClockIcon, CheckCircle2Icon, GlobeIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { useAppForm } from "@/components/forms/hooks";
import { LinkButton } from "@/components/general/link-button";
import { SelectDateField } from "@/components/general/select-date-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CardHeading,
  ContentCard,
  ProseText,
} from "@/components/ui/containers";
import { LoadingSwap } from "@/components/ui/loading-swap";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";
import { trackGaEvent } from "@/lib/ga4";
import { trackCustomPixelEvent, trackPixelEvent } from "@/lib/meta-pixel";
import { readAndClearBookingDraft, saveBookingDraft } from "./booking-draft";

const SIGN_IN_RETURN_TO = encodeURIComponent("/contact?tab=book");
const SIGN_IN_URL = `/sign-in?returnTo=${SIGN_IN_RETURN_TO}`;

const customRequestSchema = z.object({
  preferredAt: z.date(),
  note: z.string().trim().min(10).max(1000),
});

function localDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function BookingWidget({
  isSignedIn,
  rescheduleId = null,
}: {
  isSignedIn: boolean;
  rescheduleId?: string | null;
}) {
  const { t, locale } = useTranslation();
  const trpc = useTRPC();

  const visitorTimezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );
  const intlLocale = locale === "ar" ? "ar-EG" : "en";

  const availabilityQuery = useQuery(
    trpc.bookings.getAvailability.queryOptions(),
  );

  const [selectedDay, setSelectedDay] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [note, setNote] = useState("");
  const [bookedAt, setBookedAt] = useState<Date | null>(null);
  const [customRequestSent, setCustomRequestSent] = useState(false);

  // Server groups slots by business-timezone day; regroup by the visitor's
  // local day so the calendar matches what the customer actually sees.
  const slotsByLocalDay = useMemo(() => {
    const map = new Map<string, Date[]>();
    for (const day of availabilityQuery.data?.days ?? []) {
      for (const iso of day.slots) {
        const slot = new Date(iso);
        const key = localDayKey(slot);
        const list = map.get(key) ?? [];
        list.push(slot);
        map.set(key, list);
      }
    }
    for (const list of map.values())
      list.sort((a, b) => a.getTime() - b.getTime());
    return map;
  }, [availabilityQuery.data]);

  const daySlots = selectedDay
    ? (slotsByLocalDay.get(localDayKey(selectedDay)) ?? [])
    : [];

  const bookMutation = useMutation(
    trpc.bookings.book.mutationOptions({
      onSuccess: (_, variables) => {
        trackPixelEvent("Schedule", { content_name: "Book a Call" });
        trackGaEvent("schedule", { content_name: "Book a Call" });
        setBookedAt(variables.startsAt);
        setSelectedSlot(null);
        setNote("");
      },
      onError: (error) => {
        if (error instanceof TRPCClientError) {
          if (error.message === "slot_unavailable") {
            toast.error(t("publicPages.bookCallPage.slotTakenError"));
            setSelectedSlot(null);
            void availabilityQuery.refetch();
            return;
          }
          if (error.message === "too_many_bookings") {
            toast.error(t("publicPages.bookCallPage.tooManyBookingsError"));
            return;
          }
        }
        toast.error(t("publicPages.bookCallPage.genericError"));
      },
    }),
  );

  const rescheduleMutation = useMutation(
    trpc.bookings.rescheduleMine.mutationOptions({
      onSuccess: (_, variables) => {
        setBookedAt(variables.startsAt);
        setSelectedSlot(null);
      },
      onError: (error) => {
        if (
          error instanceof TRPCClientError &&
          error.message === "slot_unavailable"
        ) {
          toast.error(t("publicPages.bookCallPage.slotTakenError"));
          setSelectedSlot(null);
          void availabilityQuery.refetch();
          return;
        }
        toast.error(t("publicPages.bookCallPage.genericError"));
      },
    }),
  );

  const requestMutation = useMutation(
    trpc.bookings.requestCustomTime.mutationOptions({
      onSuccess: () => {
        trackCustomPixelEvent("BookingRequested", {
          content_name: "Custom Booking Request",
        });
        trackGaEvent("generate_lead", {
          content_name: "Custom Booking Request",
        });
        setCustomRequestSent(true);
      },
      onError: (error) => {
        if (
          error instanceof TRPCClientError &&
          error.message === "too_many_bookings"
        ) {
          toast.error(t("publicPages.bookCallPage.tooManyBookingsError"));
          return;
        }
        toast.error(t("publicPages.bookCallPage.genericError"));
      },
    }),
  );

  const customForm = useAppForm({
    defaultValues: { preferredAt: null as Date | null, note: "" },
    validators: { onSubmit: customRequestSchema },
    onSubmit: async ({ value }) => {
      if (!value.preferredAt) return;
      await requestMutation.mutateAsync({
        preferredAt: value.preferredAt,
        note: value.note,
        timezone: visitorTimezone,
      });
    },
  });

  // One-time restore of the in-progress selection saved before the user was
  // sent to sign in, so returning from auth doesn't lose their picks.
  const hasRestoredDraft = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional one-time restore, not a reactive sync
  useEffect(() => {
    if (!isSignedIn || hasRestoredDraft.current) return;
    hasRestoredDraft.current = true;

    const draft = readAndClearBookingDraft();
    if (!draft) return;

    if (draft.selectedDay) setSelectedDay(draft.selectedDay);
    if (draft.selectedSlot) setSelectedSlot(draft.selectedSlot);
    if (draft.note) setNote(draft.note);
    if (draft.customPreferredAt)
      customForm.setFieldValue("preferredAt", draft.customPreferredAt);
    if (draft.customNote) customForm.setFieldValue("note", draft.customNote);
  }, [isSignedIn]);

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(intlLocale, {
        hour: "numeric",
        minute: "2-digit",
      }),
    [intlLocale],
  );
  const fullFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(intlLocale, {
        dateStyle: "full",
        timeStyle: "short",
      }),
    [intlLocale],
  );

  if (availabilityQuery.isLoading) {
    return (
      <ProseText className="py-16 text-center">
        {t("publicPages.bookCallPage.loading")}
      </ProseText>
    );
  }

  if (!availabilityQuery.data?.enabled) {
    return (
      <ContentCard className="mx-auto flex max-w-xl flex-col items-center gap-4 p-10 text-center">
        <CalendarClockIcon className="text-muted-foreground h-12 w-12" />
        <ProseText>{t("publicPages.bookCallPage.bookingDisabled")}</ProseText>
      </ContentCard>
    );
  }

  if (bookedAt) {
    return (
      <ContentCard className="mx-auto flex max-w-xl flex-col items-center gap-4 p-10 text-center">
        <CheckCircle2Icon className="text-primary h-16 w-16" />
        <CardHeading>{t("publicPages.bookCallPage.bookedTitle")}</CardHeading>
        <ProseText className="font-semibold">
          {fullFormatter.format(bookedAt)}
        </ProseText>
        <ProseText size="sm">
          {t("publicPages.bookCallPage.bookedMessage")}
        </ProseText>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <LinkButton href="/my-account">
            {t("publicPages.bookCallPage.goToMyAccount")}
          </LinkButton>
          <Button
            variant="outline"
            onClick={() => {
              setBookedAt(null);
              void availabilityQuery.refetch();
            }}
          >
            {t("publicPages.bookCallPage.bookAnother")}
          </Button>
        </div>
      </ContentCard>
    );
  }

  return (
    <div className="space-y-10">
      {rescheduleId && (
        <ProseText className="bg-primary/10 text-primary mx-auto max-w-xl rounded-lg px-4 py-3 text-center text-sm font-medium">
          {t("publicPages.bookCallPage.rescheduleBanner")}
        </ProseText>
      )}

      <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
        <GlobeIcon className="h-4 w-4" />
        <span>
          {t("publicPages.bookCallPage.timezoneNote")}{" "}
          <strong>{visitorTimezone}</strong>
        </span>
      </div>

      <Card>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <span className="block text-sm font-medium">
                {t("publicPages.bookCallPage.dateLabel")}
              </span>
              <SelectDateField
                mode="single"
                value={selectedDay}
                setValue={(value) => {
                  setSelectedDay(value as Date | undefined);
                  setSelectedSlot(null);
                }}
                disabledDays={(day) => !slotsByLocalDay.has(localDayKey(day))}
              />
            </div>
            <div className="space-y-2">
              <span className="block text-sm font-medium">
                {t("publicPages.bookCallPage.timeLabel")}
              </span>
              <Select
                value={selectedSlot ? selectedSlot.toISOString() : ""}
                onValueChange={(value) =>
                  value && setSelectedSlot(new Date(value))
                }
                disabled={!selectedDay || daySlots.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      !selectedDay
                        ? t("publicPages.bookCallPage.selectDayFirst")
                        : daySlots.length === 0
                          ? t("publicPages.bookCallPage.noSlotsForDay")
                          : t("publicPages.bookCallPage.selectTimePlaceholder")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {daySlots.map((slot) => (
                    <SelectItem
                      key={slot.toISOString()}
                      value={slot.toISOString()}
                    >
                      {timeFormatter.format(slot)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedSlot && (
            <ProseText size="sm" className="text-muted-foreground">
              {t("publicPages.bookCallPage.selectedTimeLabel")}:{" "}
              <strong className="text-foreground">
                {fullFormatter.format(selectedSlot)}
              </strong>
            </ProseText>
          )}

          {isSignedIn ? (
            <>
              <div className="space-y-2">
                <label htmlFor="booking-note" className="text-sm font-medium">
                  {t("publicPages.bookCallPage.noteLabel")}
                </label>
                <Textarea
                  id="booking-note"
                  rows={3}
                  maxLength={1000}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("publicPages.bookCallPage.notePlaceholder")}
                />
              </div>
              <Button
                className="w-full"
                disabled={
                  !selectedSlot ||
                  bookMutation.isPending ||
                  rescheduleMutation.isPending
                }
                onClick={() => {
                  if (!selectedSlot) return;
                  if (rescheduleId) {
                    rescheduleMutation.mutate({
                      id: rescheduleId,
                      startsAt: selectedSlot,
                    });
                  } else {
                    bookMutation.mutate({
                      startsAt: selectedSlot,
                      note: note.trim() || undefined,
                      timezone: visitorTimezone,
                    });
                  }
                }}
              >
                <LoadingSwap
                  isLoading={
                    bookMutation.isPending || rescheduleMutation.isPending
                  }
                  loadingText={t("publicPages.bookCallPage.bookingInProgress")}
                >
                  {t(
                    rescheduleId
                      ? "publicPages.bookCallPage.rescheduleConfirmButton"
                      : "publicPages.bookCallPage.confirmButton",
                  )}
                </LoadingSwap>
              </Button>
            </>
          ) : (
            <>
              <LinkButton
                href={SIGN_IN_URL}
                className="w-full"
                onClick={() =>
                  saveBookingDraft({ selectedDay, selectedSlot, note })
                }
              >
                {t("publicPages.bookCallPage.signInToBook")}
              </LinkButton>
              <ProseText size="sm">
                {t("publicPages.bookCallPage.signInHint")}
              </ProseText>
            </>
          )}
        </CardContent>
      </Card>

      {/* Custom time request */}
      <ContentCard className="mx-auto max-w-2xl p-8">
        {customRequestSent ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <CheckCircle2Icon className="text-primary h-12 w-12" />
            <CardHeading>
              {t("publicPages.bookCallPage.customSuccessTitle")}
            </CardHeading>
            <ProseText size="sm">
              {t("publicPages.bookCallPage.customSuccessMessage")}
            </ProseText>
          </div>
        ) : (
          <>
            <CardHeading>
              {t("publicPages.bookCallPage.customTitle")}
            </CardHeading>
            <ProseText size="sm" className="mt-2">
              {t("publicPages.bookCallPage.customSubtitle")}
            </ProseText>
            {isSignedIn ? (
              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  customForm.handleSubmit();
                }}
              >
                <customForm.AppField name="preferredAt">
                  {(field) => (
                    <field.DateTimeField
                      label={t("publicPages.bookCallPage.customTimeLabel")}
                    />
                  )}
                </customForm.AppField>
                <customForm.AppField name="note">
                  {(field) => (
                    <field.TextareaField
                      label={t("publicPages.bookCallPage.customNoteLabel")}
                      placeholder={t(
                        "publicPages.bookCallPage.customNotePlaceholder",
                      )}
                      rows={4}
                    />
                  )}
                </customForm.AppField>
                <customForm.Subscribe
                  selector={(state) => [state.isSubmitting]}
                >
                  {([isSubmitting]) => (
                    <Button type="submit" disabled={isSubmitting}>
                      <LoadingSwap
                        isLoading={isSubmitting}
                        loadingText={t(
                          "publicPages.bookCallPage.customSubmitting",
                        )}
                      >
                        {t("publicPages.bookCallPage.customSubmit")}
                      </LoadingSwap>
                    </Button>
                  )}
                </customForm.Subscribe>
              </form>
            ) : (
              <LinkButton
                href={SIGN_IN_URL}
                className="mt-6"
                onClick={() =>
                  saveBookingDraft({
                    customPreferredAt: customForm.getFieldValue("preferredAt"),
                    customNote: customForm.getFieldValue("note"),
                  })
                }
              >
                {t("publicPages.bookCallPage.signInToRequest")}
              </LinkButton>
            )}
          </>
        )}
      </ContentCard>
    </div>
  );
}
