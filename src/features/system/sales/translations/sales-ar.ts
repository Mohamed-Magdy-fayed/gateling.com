import { dt, type LanguageMessages } from "@/features/core/i18n/lib";

export default {
  sales: {
    // ─── عمل اليوم ────────────────────────────────────────────────────────
    todayTitle: "عمل اليوم",
    todayLead: "محسوبة من حالة خط المبيعات — وليست قائمة يحدّثها أحد يدويًا.",
    todayEmpty: "لا يوجد عمل الآن. أضف عملاء محتملين أو عد غدًا.",
    bucketEmpty: "لا يوجد شيء في هذه المجموعة اليوم.",

    bucketRescue: "إنقاذ",
    bucketRescueHint:
      "وافق على العرض التوضيحي وبدأ يفتر. الأعلى قيمة والأسرع ضياعًا.",
    bucketOverdue: "التزام متأخر",
    bucketOverdueHint: "وعدت بالمتابعة وفات الموعد.",
    bucketFollowUp: "متابعة مستحقة",
    bucketFollowUpHint: "مهتم لكنه لم يرد بعد.",
    bucketNewQueue: "قائمة جديدة",
    bucketNewQueueHint: "اتصالات جديدة، الأكبر حجمًا أولًا.",
    bucketAutoPark: "مرشحون للتأجيل",
    bucketAutoParkHint:
      "تمت متابعتهم مرتين دون رد. أجّلهم بدل المخاطرة بحظر رقم واتساب.",

    reasonRescue: dt("وافق على العرض، {days:number} أيام دون تواصل", {}),
    reasonRescueNeverContacted: "وافق على العرض، ولم يتم التواصل معه إطلاقًا",
    reasonOverdue: dt("كانت المتابعة مستحقة منذ {days:number} أيام", {}),
    reasonOverdueToday: "المتابعة مستحقة اليوم",
    reasonFollowUp: dt(
      "في انتظار الرد منذ {days:number} أيام، وتم إرسال {count:number} متابعة",
      {},
    ),
    reasonNewQueue: "لم يتم التواصل معه بعد",
    reasonAutoPark: dt("{count:number} متابعات دون رد", {}),

    capNotice: dt("عرض {shown:number} من {total:number} — الحد اليومي", {}),

    callingWindowTooEarly:
      "الوقت مبكر على الاتصال. أتيليهات مصر تفتح عادة بين الحادية عشرة والثانية عشرة — اعمل على عناصر واتساب أدناه حتى ذلك الحين.",
    callingWindowTooLate:
      "أغلب الأتيليهات أغلقت. واتساب هو القناة الأنسب الآن.",

    daysSinceContact: dt("{days:number} يوم منذ آخر تواصل", {}),
    neverContacted: "لم يتم التواصل",

    // ─── تسجيل سريع ───────────────────────────────────────────────────────
    quickLog: "تسجيل",
    quickLogTitle: "تسجيل نشاط",
    quickLogDescription: "سجّل ما حدث. لا يستغرق سوى ثوانٍ.",
    activityType: "ماذا حدث",
    activityChannel: "القناة",
    activityOccurredAt: "متى",
    activityOccurredAtHint:
      "الافتراضي هو الآن — غيّره إذا كنت تسجل مكالمة سابقة.",
    activityOutcome: "النتيجة",
    activityOutcomePlaceholder: "ملخص قصير",
    activityNotes: "ملاحظات",
    activityNextAction: "المتابعة في",
    activityNewStatus: "نقل إلى",
    activityNoStatusChange: "إبقاء الحالة كما هي",
    logSaved: "تم تسجيل النشاط.",
    logFailed: "تعذّر تسجيل النشاط.",
    park: "تأجيل",
    parked: "تم تأجيل العميل المحتمل.",
    parkFailed: "تعذّر تأجيل العميل المحتمل.",

    activityTypes: dt("{type:enum}", {
      enum: {
        type: {
          call: "مكالمة",
          no_answer: "لا يوجد رد",
          call_unclear: "مكالمة غير واضحة",
          whatsapp_sent: "تم إرسال واتساب",
          whatsapp_reply: "رد على واتساب",
          demo_agreed: "تمت الموافقة على العرض",
          demo_scheduled: "تم تحديد موعد العرض",
          demo_done: "تم تنفيذ العرض",
          note: "ملاحظة",
          status_change: "تغيير الحالة",
        },
      },
    }),

    channels: dt("{channel:enum}", {
      enum: {
        channel: {
          phone: "هاتف",
          whatsapp: "واتساب",
          email: "بريد إلكتروني",
          in_person: "لقاء مباشر",
        },
      },
    }),

    // ─── جدول خط المبيعات ─────────────────────────────────────────────────
    leadsTitle: "خط المبيعات",
    leadsLead: "كل عميل محتمل، مع سجل التواصل الكامل.",
    searchHint: "ابحث بالاسم أو رقم الهاتف",
    newLead: "إضافة عميل محتمل",
    editLead: "تعديل العميل المحتمل",
    createLeadTitle: "إضافة عميل محتمل",
    leadSaved: "تم حفظ العميل المحتمل.",
    leadSaveFailed: "تعذّر حفظ العميل المحتمل.",

    columnName: "النشاط التجاري",
    columnCity: "المدينة / المنطقة",
    columnPhone: "الهاتف",
    columnWhatsapp: "واتساب",
    columnTier: "الفئة",
    columnFollowers: "المتابعون",
    columnStatus: "الحالة",
    columnLastContacted: "آخر تواصل",
    columnNextAction: "الإجراء التالي",
    columnFollowUps: "المتابعات",

    fieldName: "اسم النشاط التجاري",
    fieldNameAr: "اسم النشاط التجاري (بالعربية)",
    fieldCity: "المدينة",
    fieldArea: "المنطقة",
    fieldAddress: "العنوان",
    fieldPhone: "الهاتف الأساسي",
    fieldPhoneSecondary: "الهاتف الثانوي",
    fieldWhatsappStatus: "حالة واتساب",
    fieldWhatsappProfileName: "اسم الملف على واتساب",
    fieldWhatsappProfileHint:
      "الاسم الظاهر للعامة — تأكد من تطابقه قبل بدء المحادثة.",
    fieldTier: "الفئة",
    fieldSocialPlatform: "منصة التواصل",
    fieldSocialHandle: "المعرّف",
    fieldSocialFollowers: "المتابعون",
    fieldBranchCount: "الفروع",
    fieldBusinessType: "نوع النشاط",
    fieldSourceUrl: "رابط المصدر",
    fieldStatus: "حالة خط المبيعات",
    fieldDoNotContact: "عدم التواصل",
    fieldNotes: "ملاحظات",

    statuses: dt("{status:enum}", {
      enum: {
        status: {
          new: "جديد",
          contacted: "تم التواصل",
          awaiting_reply: "في انتظار الرد",
          callback_scheduled: "معاودة اتصال محددة",
          demo_agreed: "تمت الموافقة على العرض",
          demo_scheduled: "تم تحديد موعد العرض",
          demo_done: "تم تنفيذ العرض",
          won: "تم الفوز",
          lost: "خسارة",
          parked: "مؤجل",
          blocked_no_number: "بدون رقم",
        },
      },
    }),

    whatsappStatuses: dt("{status:enum}", {
      enum: {
        status: {
          confirmed: "مؤكد",
          not_confirmed: "غير مؤكد",
          unknown: "غير معروف",
        },
      },
    }),

    filterStatus: "الحالة",
    filterTier: "الفئة",
    filterCity: "المدينة",
    filterWhatsapp: "واتساب",
    filterAll: "الكل",

    // ─── التفاصيل ─────────────────────────────────────────────────────────
    detailTitle: "العميل المحتمل",
    backToPipeline: "العودة إلى خط المبيعات",
    timeline: "سجل الأنشطة",
    timelineEmpty: "لم يتم تسجيل أي نشاط بعد.",
    timelineAppendOnly:
      "سجل إضافة فقط — لا يتم تعديل أو حذف الإدخالات، وهذا ما يجعل قائمة اليوم موثوقة.",
    details: "التفاصيل",
    openWhatsapp: "فتح واتساب",
    callNow: "اتصال",
    sourceLink: "المصدر",
    noPhone: "لا يوجد رقم هاتف",

    // ─── العدادات ─────────────────────────────────────────────────────────
    countersTotal: "إجمالي العملاء المحتملين",
    countersContactedThisWeek: "تم التواصل هذا الأسبوع",
    countersDemosBooked: "عروض محجوزة",
    countersByStatus: "حسب الحالة",
  },
} as const satisfies LanguageMessages;
