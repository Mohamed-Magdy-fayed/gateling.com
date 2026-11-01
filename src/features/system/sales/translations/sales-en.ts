import { dt, type LanguageMessages } from "@/features/core/i18n/lib";

export default {
  sales: {
    // ─── Today's Work ────────────────────────────────────────────────────
    todayTitle: "Today's Work",
    todayLead:
      "Tap a client to open it. Once you log anything, it leaves today's list and comes back by itself on its next action day.",

    bucketRescue: "Rescue",
    bucketRescueHint:
      "Said yes to a demo and is going cold. Highest value, most perishable.",
    bucketOverdue: "Scheduled for today",
    bucketOverdueHint:
      "A call-back or follow-up scheduled for today, or promised and not done yet.",
    bucketFollowUp: "Follow-up due",
    bucketFollowUpHint: "Warm but unanswered.",
    bucketNewQueue: "New queue",
    bucketNewQueueHint: "Fresh dials, biggest businesses first.",
    bucketAutoPark: "Auto-park candidates",
    bucketAutoParkHint:
      "Chased twice with no reply. Park rather than risk a WhatsApp ban.",

    callingWindowTooEarly:
      "Too early to call. Egyptian ateliers typically open between 11:00 and 12:00 — work the WhatsApp items below until then.",
    callingWindowTooLate:
      "Most ateliers have closed for the night. WhatsApp is the safer channel now.",

    neverContacted: "Never contacted",

    // Progress header.
    progressLabel: "Today's progress",
    progressDone: dt("{done:number} of {total:number} done", {}),
    conversationsToday: dt("Conversations today: {count:number}", {}),
    todayCardFollowers: dt("{count} followers", {}),
    refreshing: "Refreshing",
    loadFailed: "Could not load today's work.",
    retry: "Retry",
    pipelineSummary: "Pipeline summary",

    // Social profiles.
    socialPlatform: dt("{platform:enum}", {
      enum: {
        platform: {
          instagram: "Instagram",

          facebook: "Facebook",

          tiktok: "TikTok",
        },
      },
    }),
    socialNotOnFile: "Not on file yet.",
    socialOpenProfile: "Open profile",

    rowActions: "More actions",

    // Shared buttons.
    cancel: "Cancel",

    // Saving and undo.
    doNotContactBlocked: "This lead asked not to be contacted.",

    // Queue and states.
    noLeadsYet: "No leads yet",
    noLeadsYetHint: "Add prospects in the pipeline to start working them here.",
    openPipeline: "Open pipeline",
    allDoneTitle: "All done for today",
    allDoneRecap: dt(
      "{conversations:number} conversations · {demos:number} demos booked · {due:number} follow-ups due tomorrow",
      {},
    ),

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
    fieldDoNotContactLocked:
      "This client asked not to be contacted. Only an admin can lift it.",
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

    filterCity: "City",

    // ─── Detail ──────────────────────────────────────────────────────────
    backToPipeline: "Back to pipeline",
    timeline: "Activity timeline",
    timelineEmpty: "No activity logged yet.",
    timelineAppendOnly:
      "Append-only — entries are never edited or deleted, which is what makes the Today list trustworthy.",
    details: "Details",
    openWhatsapp: "Open WhatsApp",
    callNow: "Call",
    sourceLink: "Source",

    // ─── Counters ────────────────────────────────────────────────────────
    countersContactedThisWeek: "Contacted this week",
    countersDemosBooked: "Demos booked",

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
        "Copy what the listing shows. The map is drawn from the name and address; the numbers are a snapshot, dated when you save.",
      mapTitle: dt("Map of {name}", {}),
      mapMissing: "Add this client's address to show the map here.",
      addAddress: "Add address",
      ratingLabel: dt("Rated {rating} out of 5", {}),
      openInMaps: "Open in Maps",

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

    // ─── Funnel stage and next step (lib/funnel.ts) ──────────────────────
    funnel: {
      title: "Where this client is",
      nextLabel: "Next",
      stage: dt("{stage:enum}", {
        enum: {
          stage: {
            discovery: "Discovery",
            outreach: "Outreach",
            demo: "Demo",
            trial: "Trial",
            paying: "Paying",
            closed: "Closed",
          },
        },
      }),
      stageProgress: dt("Stage {current} of {total}", {}),
      startDiscovery: {
        now: "Not contacted yet.",
        next: "Start a discovery chat: ask how she manages bookings, deposits and returns. Don't pitch, and write down her exact words.",
      },
      awaitDiscoveryReply: {
        now: "Discovery message sent. Waiting for her reply.",
        next: dt("No reply by {date}? Send one follow-up only.", {}),
      },
      awaitDiscoveryReplyChased: {
        now: "Discovery message and one follow-up sent. No more messages.",
        next: "Still silent after a few days? Park it.",
      },
      sendVideo: {
        now: "She told us about her problem. Make sure her exact words are in the notes.",
        next: "Send the 60-second video and Aalaa's case study link.",
      },
      awaitVideoReply: {
        now: "Video and case study sent. Waiting for her reply.",
        next: dt("No reply by {date}? Send one follow-up only.", {}),
      },
      awaitVideoReplyChased: {
        now: "Video sent and followed up once. No more messages.",
        next: "Still silent after a few days? Park it.",
      },
      offerDemo: {
        now: "She replied after the video.",
        next: "Offer a 15-minute demo of her own problem only.",
      },
      callBack: {
        now: "She asked us to call back.",
        next: dt("Call her back {date}.", {}),
      },
      callBackNoTime: {
        now: "She asked us to call back.",
        next: "Call her back and agree what happens next.",
      },
      bookDemo: {
        now: "She agreed to a demo.",
        next: "Fix the day and time, then log it as a booked demo.",
      },
      runDemo: {
        now: dt("Demo booked for {date} on Gateling Meetings.", {}),
        next: "Show only her problem, then offer free setup and a 1-month trial.",
      },
      runDemoNoTime: {
        now: "Demo booked.",
        next: "Show only her problem, then offer free setup and a 1-month trial.",
      },
      runTrial: {
        now: "Demo done: free setup and a 1-month trial.",
        next: dt(
          "Check in on {week1} and {week4}. Ask her to subscribe on {day30}.",
          {},
        ),
      },
      startTrial: {
        now: "Demo done.",
        next: "Offer free setup and a 1-month trial, then check in after week 1.",
      },
      askReferral: {
        now: "Paying client.",
        next: "After about 2 weeks, ask for the names of other owners she knows.",
      },
      closed: {
        now: "Closed. Nothing to do.",
        next: "Reopen it only if she gets back in touch.",
      },
      followUpNow: "No reply yet. Send the one follow-up now (only one).",
      markVideoSent: "Sent video + case study",
      videoSentSaved: "Logged: video and case study sent.",
      videoSentFailed: "Could not log it. Try again.",
    },
  },
} as const satisfies LanguageMessages;
