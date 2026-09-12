import {
  type ExternalUser,
  type JoinLink,
  type Meeting,
  type MeetingSettings,
  MeetingsApiError,
  type MeetingsClient,
} from "./client";

/**
 * The orchestration every consumer repeats for an entity that "has a meeting"
 * (a booking, a lesson, a fitting, a demo): create it once, move it when the
 * entity is rescheduled, drop it when the entity is cancelled, and let the
 * right person in. Pure over the client — no database, no framework — so the
 * consuming app decides where the returned `code` and `guestUrl` are stored.
 */

export type EnsureScheduledMeetingInput = {
  /** Your handle for the entity, e.g. `booking:<uuid>`. Stable across reschedules. */
  externalRef: string;
  /** The code stored from an earlier call, if any. Triggers a reschedule. */
  existingCode?: string | null;
  title: string;
  host: ExternalUser;
  scheduledAt: Date;
  durationMinutes: number;
  /** IANA zone the time should be presented in, e.g. `Africa/Cairo`. */
  timezone: string;
  settings?: Partial<MeetingSettings>;
  passcode?: string;
};

export type EnsureScheduledMeetingResult = {
  meeting: Meeting;
  action: "created" | "rescheduled";
};

/**
 * Idempotency key for a create: the same entity at the same time is the same
 * meeting, so a retried job (Inngest, a double-click, a webhook replay) cannot
 * open two rooms. Meetings honours the key for 24 h.
 */
export function scheduledMeetingIdempotencyKey(
  externalRef: string,
  scheduledAt: Date,
): string {
  return `${externalRef}:${scheduledAt.toISOString()}`;
}

/** A PATCH that cannot land on the old room: it was deleted or has ended. */
function isStaleMeeting(error: unknown): boolean {
  return (
    error instanceof MeetingsApiError &&
    (error.status === 404 || error.status === 412)
  );
}

/**
 * Create the meeting for `externalRef`, or move the existing one to the new
 * time. If the stored code no longer resolves (deleted, ended), a fresh room
 * is created rather than failing — the caller then overwrites its stored code.
 */
export async function ensureScheduledMeeting(
  client: MeetingsClient,
  input: EnsureScheduledMeetingInput,
): Promise<EnsureScheduledMeetingResult> {
  const scheduledAt = input.scheduledAt.toISOString();

  if (input.existingCode) {
    try {
      const meeting = await client.updateMeeting(input.existingCode, {
        title: input.title,
        scheduledAt,
        durationMinutes: input.durationMinutes,
        timezone: input.timezone,
      });
      return { meeting, action: "rescheduled" };
    } catch (error) {
      if (!isStaleMeeting(error)) throw error;
    }
  }

  const meeting = await client.createMeeting(
    {
      title: input.title,
      host: input.host,
      externalRef: input.externalRef,
      scheduledAt,
      durationMinutes: input.durationMinutes,
      timezone: input.timezone,
      settings: input.settings,
      passcode: input.passcode,
    },
    scheduledMeetingIdempotencyKey(input.externalRef, input.scheduledAt),
  );
  return { meeting, action: "created" };
}

/**
 * Soft-delete the room. Returns `false` when it was already gone, which is
 * the normal outcome of a retried cancellation and not an error.
 */
export async function cancelScheduledMeeting(
  client: MeetingsClient,
  code: string,
): Promise<boolean> {
  try {
    await client.deleteMeeting(code);
    return true;
  } catch (error) {
    if (error instanceof MeetingsApiError && error.status === 404) return false;
    throw error;
  }
}

export type JoinLinkOptions = {
  /** Where "Back to <you>" points after the meeting. Must be on an allowed origin. */
  returnUrl?: string;
  /** Seconds, 60–86400. Default 600. */
  expiresIn?: number;
};

/**
 * Host links are single-use and short-lived: mint one per click in a server
 * procedure and hand the URL straight to the browser. `host` must be the same
 * `externalId` the meeting was created with or Meetings answers 403.
 */
export function mintHostJoinLink(
  client: MeetingsClient,
  code: string,
  host: ExternalUser,
  options: JoinLinkOptions = {},
): Promise<JoinLink> {
  return client.createJoinLink(code, { user: host, role: "host", ...options });
}

/** Participant links skip the passcode and waiting room; reusable until expiry. */
export function mintParticipantJoinLink(
  client: MeetingsClient,
  code: string,
  user: ExternalUser,
  options: JoinLinkOptions = {},
): Promise<JoinLink> {
  return client.createJoinLink(code, { user, role: "participant", ...options });
}
