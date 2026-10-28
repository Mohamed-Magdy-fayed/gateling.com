import { dt, type LanguageMessages } from "@/features/core/i18n/lib";

export default {
  sales: {
    // ─── Today's Work ────────────────────────────────────────────────────
    todayTitle: "Today's Work",
    todayLead:
      "Computed from pipeline state — not a list anyone maintains by hand.",
    todayEmpty: "Nothing to work right now. Add leads or check back tomorrow.",
    bucketEmpty: "Nothing in this bucket today.",

    bucketRescue: "Rescue",
    bucketRescueHint:
      "Said yes to a demo and is going cold. Highest value, most perishable.",
    bucketOverdue: "Overdue commitment",
    bucketOverdueHint: "You promised to follow up and the date has passed.",
    bucketFollowUp: "Follow-up due",
    bucketFollowUpHint: "Warm but unanswered.",
    bucketNewQueue: "New queue",
    bucketNewQueueHint: "Fresh dials, biggest businesses first.",
    bucketAutoPark: "Auto-park candidates",
    bucketAutoParkHint:
      "Chased twice with no reply. Park rather than risk a WhatsApp ban.",

    // Why a lead is in its bucket.
    reasonRescue: dt("Demo agreed, {days:number} days without contact", {}),
    reasonRescueNeverContacted: "Demo agreed, never contacted",
    reasonOverdue: dt("Follow-up was due {days:number} days ago", {}),
    reasonOverdueToday: "Follow-up was due today",
    reasonFollowUp: dt(
      "Awaiting reply for {days:number} days, {count:number} follow-up sent",
      {},
    ),
    reasonNewQueue: "Never contacted",
    reasonAutoPark: dt("{count:number} follow-ups, no reply", {}),

    capNotice: dt("Showing {shown:number} of {total:number} — daily cap", {}),

    callingWindowTooEarly:
      "Too early to call. Egyptian ateliers typically open between 11:00 and 12:00 — work the WhatsApp items below until then.",
    callingWindowTooLate:
      "Most ateliers have closed for the night. WhatsApp is the safer channel now.",

    daysSinceContact: dt("{days:number}d since contact", {}),
    neverContacted: "Never contacted",

    // Progress header.
    progressLabel: "Today's progress",
    progressDone: dt("{done:number} of {total:number} done", {}),
    conversationsToday: dt("Conversations today: {count:number}", {}),
    refreshing: "Refreshing",
    loadFailed: "Could not load today's work.",
    retry: "Retry",
    pipelineSummary: "Pipeline summary",

    // Up next.
    upNext: "Up next",
    primaryAction: dt("{action:enum}", {
      enum: {
        action: {
          call: "Call",
          whatsapp: "WhatsApp",
          park: "Park",
          openLead: "Open lead",
        },
      },
    }),
    copyNumber: "Copy number",
    numberCopied: "Number copied.",
    copyFailed: "Could not copy the number.",

    // Social profiles (Up next).
    socialTitle: "Social profiles",
    socialPlatform: dt("{platform:enum}", {
      enum: {
        platform: {
          instagram: "Instagram",

          facebook: "Facebook",

          tiktok: "TikTok",
        },
      },
    }),
    socialPosts: "Posts",
    socialCheckedAt: dt("Checked {date}", {}),
    socialNotFound: "Searched — no account found.",
    socialNotOnFile: "Not on file yet.",
    socialSearchGoogle: "Search on Google",
    socialOpenProfile: "Open profile",

    channelLabel: "Channel",
    channel: dt("{channel:enum}", {
      enum: { channel: { call: "Call", whatsapp: "WhatsApp" } },
    }),
    outcomesPromptCall: "After you call: how did it go?",
    outcomesPromptWhatsapp: "After you message: what happened?",
    outcomesPromptAutoPark: "Chased twice with no reply. What now?",
    outcome: dt("{outcome:enum}", {
      enum: {
        outcome: {
          interested: "Interested",
          bookDemo: "Book demo",
          callBack: "Call back",
          noAnswer: "No answer",
          notInterested: "Not interested",
          wrongNumber: "Wrong number",
          whatsappSent: "Sent",
          whatsappReplied: "Replied",
          park: "Park",
          theyReplied: "They replied",
          answeredCall: "Answered a call",
        },
      },
    }),
    disabledNoPhone: "No phone number on this lead.",
    whatsappUnconfirmed: "WhatsApp not confirmed for this number.",
    skipForNow: "Skip for now",
    moreDetails: "More details",
    rowActions: "More actions",

    // Time picker.
    pickTime: "When?",
    timePreset: dt("{preset:enum}", {
      enum: {
        preset: {
          today5pm: "Today 5 pm",
          tomorrow11am: "Tomorrow 11 am",
          in2Days11am: "In 2 days, 11 am",
        },
      },
    }),
    customTime: "Custom time",
    businessTimeNote: dt("Times are in {zone}.", {}),
    cairoTime: "Cairo time",
    noPresetsLeft: "No quick picks left today. Choose a time.",
    timeRequired: "Pick a time first.",
    timeInPast: "Pick a time in the future.",
    saveOutcome: "Save",
    cancel: "Cancel",

    // Saving and undo.
    outcomeSaved: dt("Logged for {name}.", {}),
    undo: "Undo",
    undone: "Restored.",
    undoFailed: "Could not undo. Reopen the lead from its page.",
    leadNotFound: "That lead is no longer in the pipeline.",
    doNotContactBlocked: "This lead asked not to be contacted.",

    // Queue and states.
    queueTitle: "Queue",
    queueSkipped: "Skipped",
    queueExtra: "Extra (daily goal met)",
    queueExtraHint: "Optional: today's new-lead goal is done.",
    newMarker: "New",
    noLeadsYet: "No leads yet",
    noLeadsYetHint: "Add prospects in the pipeline to start working them here.",
    openPipeline: "Open pipeline",
    allDoneTitle: "All done for today",
    allDoneRecap: dt(
      "{conversations:number} conversations · {demos:number} demos booked · {due:number} follow-ups due tomorrow",
      {},
    ),
    allSkippedTitle: "All remaining leads skipped",
    allSkippedHint: "Everything left today is skipped.",
    startOver: "Start over",

    // Keyboard shortcuts.
    shortcutsTitle: "Keyboard shortcuts",
    shortcutsOpen: "Shortcuts",
    shortcutsEnabled: "Keyboard shortcuts on",
    shortcutsHint: "Shortcuts work when no field is focused.",
    shortcut: dt("{id:enum}", {
      enum: {
        id: {
          call: "Start call (copies the number on a computer)",
          whatsapp: "Open WhatsApp",
          outcome: "Log the numbered outcome",
          skip: "Skip for now",
          help: "Show this list",
        },
      },
    }),

    // ─── Quick log ───────────────────────────────────────────────────────
    quickLog: "Log",
    quickLogTitle: "Log activity",
    quickLogDescription: "Record what happened. Takes a few seconds.",
    activityType: "What happened",
    activityChannel: "Channel",
    activityOccurredAt: "When",
    activityOccurredAtHint:
      "Defaults to now — change it if you are logging a past call.",
    activityOutcome: "Outcome",
    activityOutcomePlaceholder: "Short summary",
    activityNotes: "Notes",
    activityNextAction: "Follow up on",
    demoTime: "Demo time",
    demoTimeRequired: "A scheduled demo needs a time.",
    demoMeeting: "Demo meeting",
    demoMeetingHint:
      "Share the link with the prospect on WhatsApp. Host links are minted per click.",
    demoMeetingPending: "The meeting room is being set up…",
    demoMeetingCopy: "Copy link",
    demoMeetingCopied: "Link copied.",
    demoMeetingCopyFailed:
      "Could not copy — select the link and copy it manually.",
    demoMeetingJoin: "Join as host",
    demoMeetingJoinFailed: "Could not open the meeting room.",
    activityNewStatus: "Move to",
    activityNoStatusChange: "Leave status unchanged",
    logSaved: "Activity logged.",
    logFailed: "Could not log the activity.",
    park: "Park",
    parked: "Lead parked.",
    parkFailed: "Could not park the lead.",

    activityTypes: dt("{type:enum}", {
      enum: {
        type: {
          call: "Call",
          no_answer: "No answer",
          call_unclear: "Call unclear",
          whatsapp_sent: "WhatsApp sent",
          whatsapp_reply: "WhatsApp reply",
          demo_agreed: "Demo agreed",
          demo_scheduled: "Demo scheduled",
          demo_done: "Demo done",
          note: "Note",
          status_change: "Status change",
        },
      },
    }),

    channels: dt("{channel:enum}", {
      enum: {
        channel: {
          phone: "Phone",
          whatsapp: "WhatsApp",
          email: "Email",
          in_person: "In person",
        },
      },
    }),

    // ─── Pipeline table ──────────────────────────────────────────────────
    leadsTitle: "Sales Pipeline",
    leadsLead: "Every prospect, with the full outreach history.",
    searchHint: "Search name, phone, city or area",
    newLead: "Add lead",
    editLead: "Edit lead",
    createLeadTitle: "Add a prospect",
    leadSaved: "Lead saved.",
    leadSaveFailed: "Could not save the lead.",

    columnName: "Business",
    columnCity: "City / area",
    columnPhone: "Phone",
    columnWhatsapp: "WhatsApp",
    columnTier: "Tier",
    columnFollowers: "Followers",
    columnStatus: "Status",
    columnLastContacted: "Last contact",
    columnNextAction: "Next action",
    columnFollowUps: "Follow-ups",
    columnBusinessType: "Business type",
    columnCreated: "Added",
    columnDoNotContact: "Contact",
    doNotContact: "Do not contact",
    contactable: "Contactable",
    untiered: "No tier",
    overdue: "Overdue",
    openLead: "Open",

    quickViewsLabel: "Quick views",
    quickView: dt("{view:enum}", {
      enum: {
        view: {
          all: "All",
          followUp: "Needs follow-up",
          demos: "Demos",
          won: "Won",
          closed: "Parked / lost",
        },
      },
    }),

    pipelineLoadFailed: "Could not load the pipeline.",
    pipelineEmptyFiltered: "No leads match these filters.",
    pipelineEmptyHint: "Add a prospect to start the pipeline.",
    clearFilters: "Clear filters",
    exportTruncated: dt(
      "Only the first {limit:number} rows were exported. Narrow the filters to export the rest.",
      {},
    ),

    bulkPark: "Park",
    bulkLost: "Mark lost",
    bulkConfirmPark: dt("Park {count:number} leads?", {}),
    bulkConfirmLost: dt("Mark {count:number} leads as lost?", {}),
    bulkConfirmBody:
      "Each lead gets a status change in its timeline, and any open follow-up promise is closed.",
    bulkConfirm: "Confirm",
    bulkDone: dt("{count:number} leads updated.", {}),
    bulkFailed: dt("Nothing changed. Reference: {ref}", {}),
    bulkLimit: dt("Select at most {limit:number} leads for a bulk action.", {}),

    fieldName: "Business name",
    fieldNameAr: "Business name (Arabic)",
    fieldCity: "City",
    fieldArea: "Area",
    fieldAddress: "Address",
    fieldPhone: "Primary phone",
    fieldPhoneSecondary: "Secondary phone",
    fieldWhatsappStatus: "WhatsApp status",
    fieldWhatsappProfileName: "WhatsApp profile name",
    fieldWhatsappProfileHint:
      "The public display name — check it matches before opening a conversation.",
    fieldTier: "Tier",
    fieldSocialPlatform: "Social platform",
    fieldSocialHandle: "Handle",
    fieldSocialFollowers: "Followers",
    fieldWhatsappPhone: "WhatsApp number (if not the primary phone)",
    fieldWhatsappIsBusiness: "WhatsApp Business account",
    whatsappBusinessOptions: dt("{option:enum}", {
      enum: {
        option: { unknown: "Not checked", yes: "Yes", no: "No" },
      },
    }),
    fieldBusinessType: "Business type",
    fieldSourceUrl: "Source URL",
    fieldStatus: "Pipeline status",
    fieldDoNotContact: "Do not contact",
    fieldNotes: "Notes",

    statuses: dt("{status:enum}", {
      enum: {
        status: {
          new: "New",
          contacted: "Contacted",
          awaiting_reply: "Awaiting reply",
          callback_scheduled: "Callback scheduled",
          demo_agreed: "Demo agreed",
          demo_scheduled: "Demo scheduled",
          demo_done: "Demo done",
          won: "Won",
          lost: "Lost",
          parked: "Parked",
          blocked_no_number: "No number",
        },
      },
    }),

    whatsappStatuses: dt("{status:enum}", {
      enum: {
        status: {
          confirmed: "Confirmed",
          not_confirmed: "Not confirmed",
          unknown: "Unknown",
        },
      },
    }),

    filterStatus: "Status",
    filterTier: "Tier",
    filterCity: "City",
    filterWhatsapp: "WhatsApp",
    filterAll: "All",

    // ─── Detail ──────────────────────────────────────────────────────────
    detailTitle: "Lead",
    backToPipeline: "Back to pipeline",
    timeline: "Activity timeline",
    timelineEmpty: "No activity logged yet.",
    timelineAppendOnly:
      "Append-only — entries are never edited or deleted, which is what makes the Today list trustworthy.",
    details: "Details",
    openWhatsapp: "Open WhatsApp",
    callNow: "Call",
    sourceLink: "Source",
    noPhone: "No phone number",

    // ─── Counters ────────────────────────────────────────────────────────
    countersTotal: "Total prospects",
    countersContactedThisWeek: "Contacted this week",
    countersDemosBooked: "Demos booked",
    countersByStatus: "By status",

    // ─── Client account page (/sales/leads/[id]) ─────────────────────────
    account: {
      tierBadge: dt("Tier {tier}", {}),
      whatsapp: "WhatsApp",
      quickActions: "Quick actions",
      noPhone: "No phone on file.",

      reachTotal: "Total reach",
      followers: "followers",
      reviewsCount: dt("{count:plural}", {
        plural: { count: { one: "{?} review", other: "{?} reviews" } },
      }),

      mapsHeading: "Google Maps",
      editMaps: "Edit Google Maps listing",
      mapsSaved: "Maps listing saved.",
      mapsSaveFailed: "Could not save the Maps listing.",
      mapsDialogLead:
        "Paste the embed and copy what the listing shows. The numbers are a snapshot, dated when you save.",
      mapTitle: dt("Map of {name}", {}),
      mapMissing: "Paste this listing's embed code to show the map here.",
      addEmbed: "Add map embed",
      ratingLabel: dt("Rated {rating} out of 5", {}),
      openInMaps: "Open in Maps",

      embedLabel: "Embed code",
      embedHint: "Google Maps › Share › Embed a map › Copy HTML",
      embedHintReplace:
        "Paste a new embed to replace the current map, or leave empty to keep it.",
      embedInvalid:
        "That is not a Google Maps embed. Copy the HTML from Share › Embed a map.",
      removeMap: "Remove the current map",
      category: "Category (as shown on Maps)",
      rating: "Rating (0–5)",
      ratingInvalid: "Enter a rating between 0 and 5.",
      reviews: "Reviews",

      businessAccount: "Business account",
      whatsappNoName: "No WhatsApp name on file",
      whatsappMissing: "No WhatsApp number on file.",
      openWhatsappChat: "Open WhatsApp chat",

      beforeYouCall: "Before you call",
      beforeYouCallLead: "Built from this client's profiles",
      tipsEmpty: "Add the Maps rating and social profiles to get openers here.",
      tipAskFor: dt(
        "Ask for “{name}” — that is the name on their WhatsApp.",
        {},
      ),
      tipRating: dt(
        "Open with their {rating}★ Google rating from {reviews:number} reviews.",
        {},
      ),
      tipTopPlatform: dt(
        "Their biggest audience is {platform:enum} ({followers}) — lead with that channel.",
        {
          enum: {
            platform: {
              facebook: "Facebook",
              instagram: "Instagram",
              tiktok: "TikTok",
            },
          },
        },
      ),

      noAccount: "No account found",
      search: "Search",
      editWhatsapp: "Edit WhatsApp details",
      editProfileOn: dt("Edit {platform:enum} profile", {
        enum: {
          platform: {
            facebook: "Facebook",
            instagram: "Instagram",
            tiktok: "TikTok",
          },
        },
      }),
      editProfileTitle: dt("{platform:enum} profile", {
        enum: {
          platform: {
            facebook: "Facebook",
            instagram: "Instagram",
            tiktok: "TikTok",
          },
        },
      }),
      editProfileLead: "Enter it as it appears on the profile today.",
      profilePicture: dt("{platform:enum} profile picture", {
        enum: {
          platform: {
            facebook: "Facebook",
            instagram: "Instagram",
            tiktok: "TikTok",
          },
        },
      }),
      profileUrl: dt("{platform:enum} link", {
        enum: {
          platform: {
            facebook: "Facebook",
            instagram: "Instagram",
            tiktok: "TikTok",
          },
        },
      }),
      profileUrlInvalid: dt("Paste a link on {platform:enum} itself.", {
        enum: {
          platform: {
            facebook: "Facebook",
            instagram: "Instagram",
            tiktok: "TikTok",
          },
        },
      }),
      displayName: "Name on the profile",
      followersLabel: "Followers",
      uploadPicture: "Upload picture",
      removePicture: "Remove picture",
      markNotFound: "No account exists",
      profileSaved: "Profile saved.",
      profileSaveFailed: "Could not save the profile.",
    },
  },
} as const satisfies LanguageMessages;
