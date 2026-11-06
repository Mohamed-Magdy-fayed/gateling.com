import { dt, type LanguageMessages } from "@/features/core/i18n/lib";

export default {
  sales: {
    // ─── عمل اليوم ────────────────────────────────────────────────────────
    todayTitle: "عمل اليوم",
    todayLead:
      "اضغط على العميل علشان تفتحه. أول ما تسجّل أي حاجة، بيختفي من قايمة النهارده ويرجع لوحده يوم الخطوة الجاية.",

    bucketRescue: "إنقاذ",
    bucketRescueHint:
      "وافق على العرض التوضيحي وبدأ يفتر. الأعلى قيمة والأسرع ضياعًا.",
    bucketOverdue: "معاده النهارده",
    bucketOverdueHint:
      "مكالمة أو متابعة معادها النهارده، أو اتوعدنا بيها ولسه ما اتعملتش.",
    bucketFollowUp: "متابعة مستحقة",
    bucketFollowUpHint: "مهتم لكنه لم يرد بعد.",
    bucketNewQueue: "قائمة جديدة",
    bucketNewQueueHint: "اتصالات جديدة، الأكبر حجمًا أولًا.",
    bucketAutoPark: "مرشحون للتأجيل",
    bucketAutoParkHint:
      "تمت متابعتهم مرتين دون رد. أجّلهم بدل المخاطرة بحظر رقم واتساب.",

    callingWindowTooEarly:
      "الوقت مبكر على الاتصال. أتيليهات مصر تفتح عادة بين الحادية عشرة والثانية عشرة — اعمل على عناصر واتساب أدناه حتى ذلك الحين.",
    callingWindowTooLate:
      "أغلب الأتيليهات أغلقت. واتساب هو القناة الأنسب الآن.",

    neverContacted: "لم يتم التواصل",

    // شريط التقدّم.
    progressLabel: "تقدّم اليوم",
    progressDone: dt("تم {done:number} من {total:number}", {}),
    conversationsToday: dt("محادثات اليوم: {count:number}", {}),
    todayCardFollowers: dt("{count} متابع", {}),
    refreshing: "جارٍ التحديث",
    loadFailed: "تعذّر تحميل عمل اليوم.",
    retry: "إعادة المحاولة",
    pipelineSummary: "ملخص خط المبيعات",

    // حسابات التواصل.
    socialPlatform: dt("{platform:enum}", {
      enum: {
        platform: {
          instagram: "إنستجرام",

          facebook: "فيسبوك",

          tiktok: "تيك توك",
        },
      },
    }),
    socialNotOnFile: "غير مسجّل بعد.",
    socialOpenProfile: "فتح الحساب",

    rowActions: "إجراءات أخرى",

    // أزرار مشتركة.
    cancel: "إلغاء",

    // الحفظ والتراجع.
    doNotContactBlocked: "طلب هذا العميل عدم التواصل معه.",

    // القائمة والحالات.
    noLeadsYet: "لا يوجد عملاء محتملون بعد",
    noLeadsYetHint: "أضف عملاء محتملين في خط المبيعات لتبدأ العمل عليهم هنا.",
    openPipeline: "فتح خط المبيعات",
    allDoneTitle: "انتهى عمل اليوم",
    allDoneRecap: dt(
      "{conversations:number} محادثات · {demos:number} عروض محجوزة · {due:number} متابعات مستحقة غدًا",
      {},
    ),

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
    fieldDoNotContactLocked:
      "العميل طلب ما نتواصلش معاه. الأدمن بس يقدر يلغي ده.",
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

    filterCity: "المدينة",

    // ─── التفاصيل ─────────────────────────────────────────────────────────
    backToPipeline: "العودة إلى خط المبيعات",
    timeline: "سجل الأنشطة",
    timelineEmpty: "لم يتم تسجيل أي نشاط بعد.",
    timelineAppendOnly:
      "سجل إضافة فقط — لا يتم تعديل أو حذف الإدخالات، وهذا ما يجعل قائمة اليوم موثوقة.",
    details: "التفاصيل",
    openWhatsapp: "فتح واتساب",
    callNow: "اتصال",
    sourceLink: "المصدر",

    // ─── العدادات ─────────────────────────────────────────────────────────
    countersContactedThisWeek: "تم التواصل هذا الأسبوع",
    countersDemosBooked: "عروض محجوزة",

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
        "انسخ ما يظهر في صفحة المكان. تُرسم الخريطة من الاسم والعنوان، والأرقام لقطة بتاريخ الحفظ.",
      mapTitle: dt("خريطة {name}", {}),
      mapMissing: "أضف عنوان العميل لعرض الخريطة هنا.",
      addAddress: "إضافة العنوان",
      ratingLabel: dt("التقييم {rating} من 5", {}),
      openInMaps: "فتح في الخرائط",

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

    // ─── مرحلة العميل والخطوة الجاية (lib/funnel.ts) ──────────────────────
    funnel: {
      title: "العميل فين دلوقتي",
      nextLabel: "الخطوة الجاية",
      stage: dt("{stage:enum}", {
        enum: {
          stage: {
            discovery: "التعارف",
            outreach: "التواصل",
            demo: "الديمو",
            trial: "فترة التجربة",
            paying: "عميل دافع",
            closed: "مقفول",
          },
        },
      }),
      stageProgress: dt("مرحلة {current} من {total}", {}),
      startDiscovery: {
        now: "لسه ما اتكلمناش معاها.",
        next: "اطلب منها ١٠ دقايق من وقتها لمكالمة، واسألها بتنظم الحجوزات والعرابين والمرتجعات إزاي. من غير ما تبيع، واكتب كلامها بالظبط.",
      },
      awaitDiscoveryReply: {
        now: "رسالة التعارف اتبعتت. مستنيين ردها.",
        next: dt("ما ردتش لحد {date}؟ ابعت متابعة واحدة بس.", {}),
      },
      awaitDiscoveryReplyChased: {
        now: "اتبعت رسالة التعارف ومتابعة واحدة. مفيش رسايل تاني.",
        next: "لو فضلت ساكتة كام يوم، اركنها.",
      },
      sendVideo: {
        now: "حكتلنا عن مشكلتها. اتأكد إن كلامها بالظبط مكتوب في الملاحظات.",
        next: "ابعت الفيديو (٦٠ ثانية) ولينك قصة نجاح أتيليه آلاء.",
      },
      awaitVideoReply: {
        now: "الفيديو وقصة النجاح اتبعتوا. مستنيين ردها.",
        next: dt("ما ردتش لحد {date}؟ ابعت متابعة واحدة بس.", {}),
      },
      awaitVideoReplyChased: {
        now: "الفيديو اتبعت واتعمل متابعة مرة. مفيش رسايل تاني.",
        next: "لو فضلت ساكتة كام يوم، اركنها.",
      },
      offerDemo: {
        now: "ردت بعد الفيديو.",
        next: "اعرض عليها ديمو على مشكلتها هي بس، وحددوا معاد.",
      },
      callBack: {
        now: "طلبت نكلمها تاني.",
        next: dt("كلمها {date}.", {}),
      },
      callBackNoTime: {
        now: "طلبت نكلمها تاني.",
        next: "كلمها واتفقوا على الخطوة الجاية.",
      },
      bookDemo: {
        now: "وافقت على ديمو.",
        next: "حدد اليوم والساعة، وسجّله ديمو محجوز.",
      },
      runDemo: {
        now: dt("الديمو محجوز {date} على Gateling Meetings.", {}),
        next: "اعرض مشكلتها هي بس، وبعدها اعرض التجهيز ببلاش وشهر تجربة.",
      },
      runDemoNoTime: {
        now: "الديمو محجوز.",
        next: "اعرض مشكلتها هي بس، وبعدها اعرض التجهيز ببلاش وشهر تجربة.",
      },
      runTrial: {
        now: "الديمو اتعمل: تجهيز ببلاش وشهر تجربة.",
        next: dt(
          "اطمّن عليها يوم {week1} ويوم {week4}، واطلب منها تشترك يوم {day30}.",
          {},
        ),
      },
      startTrial: {
        now: "الديمو اتعمل.",
        next: "اعرض التجهيز ببلاش وشهر تجربة، واطمّن عليها بعد أول أسبوع.",
      },
      askReferral: {
        now: "عميل دافع.",
        next: "بعد ما تنبسط معانا شهر أو شهرين، اطلب منها أسامي أصحاب أتيليهات تانيين تعرفهم.",
      },
      closed: {
        now: "مقفول. مفيش حاجة نعملها.",
        next: "افتحه تاني بس لو هي رجعت كلمتنا.",
      },
      followUpNow: "لسه ما ردتش. ابعت المتابعة دلوقتي (مرة واحدة بس).",
      markVideoSent: "بعت الفيديو وقصة النجاح",
      videoSentSaved: "اتسجل: الفيديو وقصة النجاح اتبعتوا.",
      videoSentFailed: "ما اتسجلش. جرّب تاني.",
    },

    // ─── The owner's yeses (lib/yeses.ts) ────────────────────────────────
    yeses: {
      title: "موافقاتها",
      hint: "علّم على كل خطوة أول ما تحصل: ✓ لو وافقت، ✗ لو رفضت. دوس تاني عشان تمسح.",
      summary: dt("{yes} موافقة، {no} رفض، من {total}", {}),
      step: dt("{step:enum}", {
        enum: {
          step: {
            callTime: "تدينا ١٠ دقايق لمكالمة",
            shareProblems: "تحكيلنا مشاكلها في الحجوزات والعرابين والمرتجعات",
            watchVideo: "تشوف الفيديو ودراسة حالة أتيليه آلاء",
            demo: "توافق على ديمو ليها ونحدد المعاد",
            trial: "توافق على الإعداد المجاني وتجربة شهر",
            subscribe: "تشترك بعد التجربة",
            referrals: "ترشحلنا أتيليهات تانية (بعد شهر أو شهرين)",
          },
        },
      }),
      stepShort: dt("{step:enum}", {
        enum: {
          step: {
            callTime: "مكالمة ١٠ دقايق",
            shareProblems: "تحكي مشاكلها",
            watchVideo: "تشوف الفيديو",
            demo: "ديمو بمعاد",
            trial: "تجربة مجانية",
            subscribe: "تشترك",
            referrals: "ترشيحات",
          },
        },
      }),
      timelineYes: dt("وافقت: {step}", {}),
      timelineNo: dt("رفضت: {step}", {}),
      timelineClear: dt("اتمسحت: {step}", {}),
      statusMoved: dt("الحالة اتغيرت لـ {status}.", {}),
      demoDialogTitle: "الديمو إمتى؟",
      demoDialogDesc:
        "العلامة دي بتحجز الديمو: العميل هيتنقل لـ «ديمو محجوز» وأوضة الاجتماع هتتجهز.",
      demoDialogLabel: "تاريخ ووقت الديمو",
      demoDialogHint: "اختار وقت جاي، مش فات.",
      demoDialogConfirm: "احجز الديمو",
      noDialogTitle: dt("رفضت: {step}", {}),
      noDialogDesc:
        "الرفض هيتسجل في الحالتين. اقفل العميل كـ «خسرناه» بس لو ده آخر الكلام؛ الرفض النهارده ممكن يبقى موافقة بعدين.",
      noDialogKeep: "سجّل الرفض بس",
      noDialogLost: "اقفله كـ «خسرناه»",
      markYes: "موافقة",
      markNo: "رفض",
      saved: "اتحفظ.",
      saveFailed: "ما اتحفظش. جرّب تاني.",
    },
  },
} as const satisfies LanguageMessages;
