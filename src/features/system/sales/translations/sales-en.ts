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
    searchHint: "Search by name or phone",
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
    fieldBranchCount: "Branches",
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
  },
} as const satisfies LanguageMessages;
