export type MeetingsClientOptions = {
  /** `https://meetings.gateling.com` */
  baseUrl: string;
  /** `gm_live_…` from /settings/integrations. */
  apiKey: string;
  fetch?: typeof fetch;
  /** Per-request timeout. A hung connection must not hold a job until the platform kills it. */
  timeoutMs?: number;
};

export const DEFAULT_TIMEOUT_MS = 10_000;

export type ExternalUser = {
  /** Your own stable id for the person (user id, staff id, …). */
  externalId: string;
  name: string;
  email?: string;
};

export type MeetingSettings = {
  waitingRoom: boolean;
  muteOnEntry: boolean;
  allowGuests: boolean;
  allowScreenShare: boolean;
  locked: boolean;
};

export type Meeting = {
  id: string;
  code: string;
  title: string;
  status: "scheduled" | "live" | "ended";
  externalRef: string | null;
  scheduledAt: string | null;
  durationMinutes: number | null;
  timezone: string | null;
  startedAt: string | null;
  endedAt: string | null;
  settings: MeetingSettings;
  hasPasscode: boolean;
  /** The plain share link — passcode and waiting room apply. */
  guestUrl: string;
  createdAt: string;
};

export type CreateMeetingInput = {
  title: string;
  host: ExternalUser;
  /** Your handle for this meeting, e.g. `order:8812`. Searchable later. */
  externalRef?: string;
  /** ISO 8601 with offset. Omit for an instant meeting. */
  scheduledAt?: string;
  durationMinutes?: number;
  /** IANA zone, e.g. `Africa/Cairo`. */
  timezone?: string;
  passcode?: string;
  settings?: Partial<MeetingSettings>;
  /** Emailed an invite + .ics + reminder. */
  invitees?: string[];
};

export type UpdateMeetingInput = Partial<
  Omit<CreateMeetingInput, "host" | "invitees"> & {
    /** `""` removes the passcode. */
    passcode: string;
    externalRef: string | null;
  }
>;

export type JoinLinkInput = {
  user: ExternalUser;
  role: "host" | "participant";
  /** Seconds, 60–86400. Default 600. */
  expiresIn?: number;
  /** Where "Back to <you>" points after the meeting. Must be on an allowed origin. */
  returnUrl?: string;
};

export type JoinLink = {
  url: string;
  role: "host" | "participant";
  expiresAt: string;
  singleUse: boolean;
};

export type Participant = {
  id: string;
  identity: string;
  displayName: string;
  role: "host" | "participant";
  externalId: string | null;
  joinedAt: string;
  leftAt: string | null;
};

export class MeetingsApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "MeetingsApiError";
  }
}

/**
 * The only response fields this app turns into links (`guestUrl`, join
 * `url`) are checked at the boundary: a mis-pointed or compromised Meetings
 * host must not be able to put an arbitrary scheme into our emails and UI.
 */
function assertHttpsUrl(value: unknown, field: string): string {
  if (typeof value === "string") {
    try {
      if (new URL(value).protocol === "https:") return value;
    } catch {
      // fall through to the error below
    }
  }
  throw new MeetingsApiError(
    502,
    "invalid_response",
    `${field} is not an https URL`,
  );
}

export function createMeetingsClient({
  baseUrl,
  apiKey,
  fetch: fetchImpl = fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: MeetingsClientOptions) {
  const base = baseUrl.replace(/\/+$/, "");

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    extraHeaders: Record<string, string> = {},
  ): Promise<T> {
    const response = await fetchImpl(`${base}/api/v1${path}`, {
      method,
      headers: {
        authorization: `Bearer ${apiKey}`,
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
        ...extraHeaders,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (response.status === 204) return undefined as T;
    const json = (await response.json()) as
      | T
      | { error: { code: string; message: string; details?: unknown } };
    if (!response.ok) {
      const { error } = json as {
        error: { code: string; message: string; details?: unknown };
      };
      throw new MeetingsApiError(
        response.status,
        error?.code ?? "unknown",
        error?.message ?? response.statusText,
        error?.details,
      );
    }
    return json as T;
  }

  return {
    /** Pass `idempotencyKey` (e.g. `order:8812:meeting`) to make retries safe. */
    async createMeeting(
      input: CreateMeetingInput,
      idempotencyKey?: string,
    ): Promise<Meeting> {
      const { meeting } = await request<{ meeting: Meeting }>(
        "POST",
        "/meetings",
        input,
        idempotencyKey ? { "idempotency-key": idempotencyKey } : {},
      );
      assertHttpsUrl(meeting?.guestUrl, "meeting.guestUrl");
      return meeting;
    },

    async getMeeting(code: string): Promise<Meeting> {
      const { meeting } = await request<{ meeting: Meeting }>(
        "GET",
        `/meetings/${encodeURIComponent(code)}`,
      );
      assertHttpsUrl(meeting?.guestUrl, "meeting.guestUrl");
      return meeting;
    },

    async findMeetings(filters: {
      externalRef?: string;
      status?: Meeting["status"];
      limit?: number;
    }): Promise<Meeting[]> {
      const query = new URLSearchParams();
      if (filters.externalRef) query.set("externalRef", filters.externalRef);
      if (filters.status) query.set("status", filters.status);
      if (filters.limit) query.set("limit", String(filters.limit));
      const { meetings } = await request<{ meetings: Meeting[] }>(
        "GET",
        `/meetings?${query}`,
      );
      return meetings;
    },

    async updateMeeting(
      code: string,
      input: UpdateMeetingInput,
    ): Promise<Meeting> {
      const { meeting } = await request<{ meeting: Meeting }>(
        "PATCH",
        `/meetings/${encodeURIComponent(code)}`,
        input,
      );
      assertHttpsUrl(meeting?.guestUrl, "meeting.guestUrl");
      return meeting;
    },

    async deleteMeeting(code: string): Promise<void> {
      await request<undefined>(
        "DELETE",
        `/meetings/${encodeURIComponent(code)}`,
      );
    },

    async endMeeting(code: string): Promise<{ status: Meeting["status"] }> {
      return request("POST", `/meetings/${encodeURIComponent(code)}/end`);
    },

    /**
     * Mint a signed link and `redirect()` the signed-in person to `url`.
     * Host links are single-use and expire in 10 minutes by default — mint
     * one per click, never store it.
     */
    async createJoinLink(
      code: string,
      input: JoinLinkInput,
    ): Promise<JoinLink> {
      const { joinLink } = await request<{ joinLink: JoinLink }>(
        "POST",
        `/meetings/${encodeURIComponent(code)}/join-links`,
        input,
      );
      assertHttpsUrl(joinLink?.url, "joinLink.url");
      return joinLink;
    },

    async listParticipants(code: string): Promise<Participant[]> {
      const { participants } = await request<{ participants: Participant[] }>(
        "GET",
        `/meetings/${encodeURIComponent(code)}/participants`,
      );
      return participants;
    },
  };
}

export type MeetingsClient = ReturnType<typeof createMeetingsClient>;
