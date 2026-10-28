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

    // شريط التقدّم.
    progressLabel: "تقدّم اليوم",
    progressDone: dt("تم {done:number} من {total:number}", {}),
    conversationsToday: dt("محادثات اليوم: {count:number}", {}),
    refreshing: "جارٍ التحديث",
    loadFailed: "تعذّر تحميل عمل اليوم.",
    retry: "إعادة المحاولة",
    pipelineSummary: "ملخص خط المبيعات",

    // التالي.
    upNext: "التالي",
    primaryAction: dt("{action:enum}", {
      enum: {
        action: {
          call: "اتصال",
          whatsapp: "واتساب",
          park: "تأجيل",
          openLead: "فتح العميل",
        },
      },
    }),
    copyNumber: "نسخ الرقم",
    numberCopied: "تم نسخ الرقم.",
    copyFailed: "تعذّر نسخ الرقم.",

    // حسابات التواصل (التالي).
    socialTitle: "حسابات التواصل الاجتماعي",
    socialPlatform: dt("{platform:enum}", {
      enum: {
        platform: {
          instagram: "إنستجرام",

          facebook: "فيسبوك",

          tiktok: "تيك توك",
        },
      },
    }),
    socialPosts: "المنشورات",
    socialCheckedAt: dt("آخر تحقق {date}", {}),
    socialNotFound: "تم البحث — لا يوجد حساب.",
    socialNotOnFile: "غير مسجّل بعد.",
    socialSearchGoogle: "ابحث على جوجل",
    socialOpenProfile: "فتح الحساب",

    channelLabel: "القناة",
    channel: dt("{channel:enum}", {
      enum: { channel: { call: "اتصال", whatsapp: "واتساب" } },
    }),
    outcomesPromptCall: "بعد الاتصال: كيف كانت المكالمة؟",
    outcomesPromptWhatsapp: "بعد الرسالة: ماذا حدث؟",
    outcomesPromptAutoPark: "تمت المتابعة مرتين دون رد. ما الخطوة التالية؟",
    outcome: dt("{outcome:enum}", {
      enum: {
        outcome: {
          interested: "مهتم",
          bookDemo: "حجز عرض",
          callBack: "معاودة الاتصال",
          noAnswer: "لا رد",
          notInterested: "غير مهتم",
          wrongNumber: "رقم خاطئ",
          whatsappSent: "تم الإرسال",
          whatsappReplied: "تم الرد",
          park: "تأجيل",
          theyReplied: "ردّوا",
          answeredCall: "ردّوا على مكالمة",
        },
      },
    }),
    disabledNoPhone: "لا يوجد رقم هاتف لهذا العميل.",
    whatsappUnconfirmed: "لم يتم تأكيد واتساب لهذا الرقم.",
    skipForNow: "تخطٍّ الآن",
    moreDetails: "تفاصيل أكثر",
    rowActions: "إجراءات أخرى",

    // اختيار الوقت.
    pickTime: "متى؟",
    timePreset: dt("{preset:enum}", {
      enum: {
        preset: {
          today5pm: "اليوم 5 مساءً",
          tomorrow11am: "غدًا 11 صباحًا",
          in2Days11am: "بعد يومين، 11 صباحًا",
        },
      },
    }),
    customTime: "وقت مخصص",
    businessTimeNote: dt("الأوقات حسب {zone}.", {}),
    cairoTime: "توقيت القاهرة",
    noPresetsLeft: "لم يتبقَّ اختيار سريع اليوم. اختر وقتًا.",
    timeRequired: "اختر وقتًا أولًا.",
    timeInPast: "اختر وقتًا في المستقبل.",
    saveOutcome: "حفظ",
    cancel: "إلغاء",

    // الحفظ والتراجع.
    outcomeSaved: dt("تم التسجيل لـ {name}.", {}),
    undo: "تراجع",
    undone: "تمت الاستعادة.",
    undoFailed: "تعذّر التراجع. افتح العميل من صفحته.",
    leadNotFound: "هذا العميل لم يعد في خط المبيعات.",
    doNotContactBlocked: "طلب هذا العميل عدم التواصل معه.",

    // القائمة والحالات.
    queueTitle: "القائمة",
    queueSkipped: "تم تخطيها",
    queueExtra: "إضافي (تم تحقيق هدف اليوم)",
    queueExtraHint: "اختياري: تم تحقيق هدف اليوم من العملاء الجدد.",
    newMarker: "جديد",
    noLeadsYet: "لا يوجد عملاء محتملون بعد",
    noLeadsYetHint: "أضف عملاء محتملين في خط المبيعات لتبدأ العمل عليهم هنا.",
    openPipeline: "فتح خط المبيعات",
    allDoneTitle: "انتهى عمل اليوم",
    allDoneRecap: dt(
      "{conversations:number} محادثات · {demos:number} عروض محجوزة · {due:number} متابعات مستحقة غدًا",
      {},
    ),
    allSkippedTitle: "تم تخطي كل العملاء المتبقين",
    allSkippedHint: "كل ما تبقى اليوم تم تخطيه.",
    startOver: "البدء من جديد",

    // اختصارات لوحة المفاتيح.
    shortcutsTitle: "اختصارات لوحة المفاتيح",
    shortcutsOpen: "الاختصارات",
    shortcutsEnabled: "تفعيل اختصارات لوحة المفاتيح",
    shortcutsHint: "تعمل الاختصارات عندما لا يكون أي حقل نشطًا.",
    shortcut: dt("{id:enum}", {
      enum: {
        id: {
          call: "بدء الاتصال (ينسخ الرقم على الكمبيوتر)",
          whatsapp: "فتح واتساب",
          outcome: "تسجيل النتيجة المرقّمة",
          skip: "تخطٍّ الآن",
          help: "عرض هذه القائمة",
        },
      },
    }),

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
    demoTime: "موعد العرض التوضيحي",
    demoTimeRequired: "العرض التوضيحي المجدول يحتاج إلى موعد.",
    demoMeeting: "اجتماع العرض التوضيحي",
    demoMeetingHint:
      "شارك الرابط مع العميل المحتمل عبر واتساب. روابط المضيف تُنشأ عند كل نقرة.",
    demoMeetingPending: "جارٍ تجهيز غرفة الاجتماع…",
    demoMeetingCopy: "نسخ الرابط",
    demoMeetingCopied: "تم نسخ الرابط.",
    demoMeetingCopyFailed: "تعذر النسخ — حدد الرابط وانسخه يدويًا.",
    demoMeetingJoin: "الانضمام كمضيف",
    demoMeetingJoinFailed: "تعذر فتح غرفة الاجتماع.",
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
    searchHint: "ابحث بالاسم أو الهاتف أو المدينة أو المنطقة",
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
    columnBusinessType: "نوع النشاط",
    columnCreated: "تاريخ الإضافة",
    columnDoNotContact: "التواصل",
    doNotContact: "عدم التواصل",
    contactable: "يمكن التواصل",
    untiered: "بدون فئة",
    overdue: "متأخر",
    openLead: "فتح",

    quickViewsLabel: "عروض سريعة",
    quickView: dt("{view:enum}", {
      enum: {
        view: {
          all: "الكل",
          followUp: "بحاجة إلى متابعة",
          demos: "العروض التوضيحية",
          won: "تم الفوز",
          closed: "مؤجل / خاسر",
        },
      },
    }),

    pipelineLoadFailed: "تعذر تحميل خط المبيعات.",
    pipelineEmptyFiltered: "لا يوجد عملاء محتملون يطابقون هذه الفلاتر.",
    pipelineEmptyHint: "أضف عميلًا محتملًا لتبدأ خط المبيعات.",
    clearFilters: "مسح الفلاتر",
    exportTruncated: dt(
      "تم تصدير أول {limit:number} صف فقط. ضيّق الفلاتر لتصدير الباقي.",
      {},
    ),

    bulkPark: "تأجيل",
    bulkLost: "تحديد كخاسر",
    bulkConfirmPark: dt("تأجيل {count:number} من العملاء المحتملين؟", {}),
    bulkConfirmLost: dt(
      "تحديد {count:number} من العملاء المحتملين كخاسرين؟",
      {},
    ),
    bulkConfirmBody:
      "يُسجَّل تغيير الحالة في السجل الزمني لكل عميل، وتُغلق أي متابعة موعودة مفتوحة.",
    bulkConfirm: "تأكيد",
    bulkDone: dt("تم تحديث {count:number} من العملاء المحتملين.", {}),
    bulkFailed: dt("لم يتغير شيء. المرجع: {ref}", {}),
    bulkLimit: dt(
      "اختر {limit:number} عميلًا محتملًا كحد أقصى للإجراء الجماعي.",
      {},
    ),

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
    fieldWhatsappPhone: "رقم واتساب (لو مختلف عن الرقم الأساسي)",
    fieldWhatsappIsBusiness: "حساب واتساب للأعمال",
    whatsappBusinessOptions: dt("{option:enum}", {
      enum: {
        option: { unknown: "لم يتم التحقق", yes: "نعم", no: "لا" },
      },
    }),
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

    // ─── صفحة حساب العميل (/sales/leads/[id]) ────────────────────────────
    account: {
      tierBadge: dt("الفئة {tier}", {}),
      whatsapp: "واتساب",
      quickActions: "إجراءات سريعة",
      noPhone: "لا يوجد رقم هاتف.",

      reachTotal: "إجمالي الوصول",
      followers: "متابع",
      reviewsCount: dt("{count:plural}", {
        plural: {
          count: {
            zero: "لا توجد مراجعات",
            one: "مراجعة واحدة",
            two: "مراجعتان",
            few: "{?} مراجعات",
            many: "{?} مراجعة",
            other: "{?} مراجعة",
          },
        },
      }),

      mapsHeading: "خرائط جوجل",
      editMaps: "تعديل بيانات خرائط جوجل",
      mapsSaved: "تم حفظ بيانات الخرائط.",
      mapsSaveFailed: "تعذّر حفظ بيانات الخرائط.",
      mapsDialogLead:
        "الصق كود التضمين وانسخ ما يظهر في صفحة المكان. الأرقام لقطة بتاريخ الحفظ.",
      mapTitle: dt("خريطة {name}", {}),
      mapMissing: "الصق كود التضمين الخاص بهذا المكان لعرض الخريطة هنا.",
      addEmbed: "إضافة كود الخريطة",
      ratingLabel: dt("التقييم {rating} من 5", {}),
      openInMaps: "فتح في الخرائط",

      embedLabel: "كود التضمين",
      embedHint: "خرائط جوجل › مشاركة › تضمين خريطة › نسخ HTML",
      embedHintReplace:
        "الصق كودًا جديدًا لاستبدال الخريطة الحالية، أو اتركه فارغًا للإبقاء عليها.",
      embedInvalid:
        "هذا ليس كود تضمين من خرائط جوجل. انسخ HTML من مشاركة › تضمين خريطة.",
      removeMap: "إزالة الخريطة الحالية",
      category: "التصنيف (كما يظهر على الخرائط)",
      rating: "التقييم (0–5)",
      ratingInvalid: "أدخل تقييمًا بين 0 و5.",
      reviews: "المراجعات",

      businessAccount: "حساب أعمال",
      whatsappNoName: "لا يوجد اسم واتساب",
      whatsappMissing: "لا يوجد رقم واتساب.",
      openWhatsappChat: "فتح محادثة واتساب",

      beforeYouCall: "قبل الاتصال",
      beforeYouCallLead: "من حسابات هذا العميل",
      tipsEmpty: "أضف تقييم الخرائط وحسابات التواصل لتظهر هنا نقاط البداية.",
      tipAskFor: dt("اسأل عن «{name}» — هذا الاسم الظاهر على واتساب.", {}),
      tipRating: dt(
        "ابدأ بتقييمهم {rating}★ على جوجل من {reviews:number} مراجعة.",
        {},
      ),
      tipTopPlatform: dt(
        "أكبر جمهور لهم على {platform:enum} ({followers}) — ابدأ بهذه القناة.",
        {
          enum: {
            platform: {
              facebook: "فيسبوك",
              instagram: "إنستجرام",
              tiktok: "تيك توك",
            },
          },
        },
      ),

      noAccount: "لا يوجد حساب",
      search: "بحث",
      editWhatsapp: "تعديل بيانات واتساب",
      editProfileOn: dt("تعديل حساب {platform:enum}", {
        enum: {
          platform: {
            facebook: "فيسبوك",
            instagram: "إنستجرام",
            tiktok: "تيك توك",
          },
        },
      }),
      editProfileTitle: dt("حساب {platform:enum}", {
        enum: {
          platform: {
            facebook: "فيسبوك",
            instagram: "إنستجرام",
            tiktok: "تيك توك",
          },
        },
      }),
      editProfileLead: "أدخله كما يظهر على الحساب اليوم.",
      profilePicture: dt("صورة حساب {platform:enum}", {
        enum: {
          platform: {
            facebook: "فيسبوك",
            instagram: "إنستجرام",
            tiktok: "تيك توك",
          },
        },
      }),
      profileUrl: dt("رابط {platform:enum}", {
        enum: {
          platform: {
            facebook: "فيسبوك",
            instagram: "إنستجرام",
            tiktok: "تيك توك",
          },
        },
      }),
      profileUrlInvalid: dt("الصق رابطًا من {platform:enum} نفسه.", {
        enum: {
          platform: {
            facebook: "فيسبوك",
            instagram: "إنستجرام",
            tiktok: "تيك توك",
          },
        },
      }),
      displayName: "الاسم على الحساب",
      followersLabel: "المتابعون",
      uploadPicture: "رفع صورة",
      removePicture: "إزالة الصورة",
      markNotFound: "لا يوجد حساب",
      profileSaved: "تم حفظ الحساب.",
      profileSaveFailed: "تعذّر حفظ الحساب.",
    },
  },
} as const satisfies LanguageMessages;
