const BOOKING_DRAFT_KEY = "gateling:booking-draft";

type BookingDraft = {
  selectedDay?: string;
  selectedSlot?: string;
  note?: string;
  customPreferredAt?: string;
  customNote?: string;
};

export function saveBookingDraft(draft: {
  selectedDay?: Date;
  selectedSlot?: Date | null;
  note?: string;
  customPreferredAt?: Date | null;
  customNote?: string;
}) {
  if (typeof window === "undefined") return;

  const payload: BookingDraft = {
    selectedDay: draft.selectedDay?.toISOString(),
    selectedSlot: draft.selectedSlot?.toISOString(),
    note: draft.note || undefined,
    customPreferredAt: draft.customPreferredAt?.toISOString(),
    customNote: draft.customNote || undefined,
  };

  try {
    window.sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(payload));
  } catch {}
}

export function readAndClearBookingDraft(): {
  selectedDay?: Date;
  selectedSlot?: Date;
  note?: string;
  customPreferredAt?: Date;
  customNote?: string;
} | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(BOOKING_DRAFT_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(BOOKING_DRAFT_KEY);

    const parsed = JSON.parse(raw) as BookingDraft;
    return {
      selectedDay: parsed.selectedDay ? new Date(parsed.selectedDay) : undefined,
      selectedSlot: parsed.selectedSlot ? new Date(parsed.selectedSlot) : undefined,
      note: parsed.note,
      customPreferredAt: parsed.customPreferredAt
        ? new Date(parsed.customPreferredAt)
        : undefined,
      customNote: parsed.customNote,
    };
  } catch {
    return null;
  }
}
