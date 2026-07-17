import type { NewCaseStudyBlock } from "@/drizzle/schema";

/**
 * Structured content blocks for the seeded case studies. These drive the public
 * work-detail narrative (heading / paragraph / list / comparison table / stats /
 * callout) via BlockRenderer, replacing the legacy problemStatement/solution
 * fallback. Shapes mirror BlockDataByType in content-blocks.ts.
 */

export type SeedCaseStudyIds = {
  atelier: string;
  cafe: string;
  megz: string;
  arabian: string;
  ba2olak: string;
  emanz: string;
};

type ComparisonRow = {
  featureEn: string;
  featureAr: string;
  manualEn: string;
  manualAr: string;
  automatedEn: string;
  automatedAr: string;
};

type StatItem = { labelEn: string; labelAr: string; value: string };

type StudyBlockSpec = {
  problemEn: string;
  problemAr: string;
  painPointsEn: string[];
  painPointsAr: string[];
  solutionEn: string;
  solutionAr: string;
  comparison: ComparisonRow[];
  stats: StatItem[];
  outcomeEn: string;
  outcomeAr: string;
};

const CHALLENGE_EN = "The Challenge";
const CHALLENGE_AR = "التحدي";
const SOLUTION_EN = "What We Built";
const SOLUTION_AR = "ما الذي بنيناه";

function studyBlocks(
  parentId: string,
  createdBy: string,
  spec: StudyBlockSpec,
): NewCaseStudyBlock[] {
  const base = { parentId, createdBy };
  return [
    {
      ...base,
      sortOrder: 0,
      type: "heading",
      contentEn: CHALLENGE_EN,
      contentAr: CHALLENGE_AR,
      data: { level: 2 },
    },
    {
      ...base,
      sortOrder: 1,
      type: "paragraph",
      contentEn: spec.problemEn,
      contentAr: spec.problemAr,
    },
    {
      ...base,
      sortOrder: 2,
      type: "list",
      data: {
        ordered: false,
        itemsEn: spec.painPointsEn,
        itemsAr: spec.painPointsAr,
      },
    },
    {
      ...base,
      sortOrder: 3,
      type: "heading",
      contentEn: SOLUTION_EN,
      contentAr: SOLUTION_AR,
      data: { level: 2 },
    },
    {
      ...base,
      sortOrder: 4,
      type: "paragraph",
      contentEn: spec.solutionEn,
      contentAr: spec.solutionAr,
    },
    {
      ...base,
      sortOrder: 5,
      type: "comparison",
      data: { rows: spec.comparison },
    },
    {
      ...base,
      sortOrder: 6,
      type: "stats",
      data: { items: spec.stats },
    },
    {
      ...base,
      sortOrder: 7,
      type: "callout",
      contentEn: spec.outcomeEn,
      contentAr: spec.outcomeAr,
      data: { variant: "success" },
    },
  ];
}

const atelierSpec: StudyBlockSpec = {
  problemEn:
    "Atelier Alaa El-Kasry runs a couture rental business across two branches. Fittings and reservations were tracked on paper and over the phone, so the team never had a reliable, shared view of which gowns were free, who had paid a deposit, or which pieces were due back.",
  problemAr:
    "يدير استوديو آلاء القصري نشاط تأجير أزياء راقية عبر فرعين. كانت المقاسات والحجوزات تُدار على الورق وعبر الهاتف، فلم يكن لدى الفريق رؤية موثوقة ومشتركة للفساتين المتاحة، أو من دفع عربوناً، أو القطع المستحقة الإرجاع.",
  painPointsEn: [
    "Reservations tracked on paper and split across two branches",
    "Frequent double-bookings for fittings and pickups",
    "No real-time view of which gowns were available where",
    "Deposits and balances reconciled by hand at day's end",
  ],
  painPointsAr: [
    "حجوزات تُدار على الورق ومتفرقة بين فرعين",
    "تكرار تعارض الحجوزات في المقاسات والاستلام",
    "غياب رؤية فورية للفساتين المتاحة وأماكنها",
    "تسوية العرابين والأرصدة يدوياً في نهاية اليوم",
  ],
  solutionEn:
    "We built a bilingual admin suite with branch-aware inventory, digital reservations that block conflicts before they happen, online payment tracking, and one-tap WhatsApp receipt sharing — giving both branches a single source of truth.",
  solutionAr:
    "بنينا منظومة إدارة ثنائية اللغة مع مخزون يراعي الفروع، وحجوزات رقمية تمنع التعارضات قبل حدوثها، وتتبعاً للمدفوعات إلكترونياً، ومشاركة الإيصالات عبر واتساب بضغطة واحدة — لتصبح لكلا الفرعين مرجعية واحدة.",
  comparison: [
    {
      featureEn: "Reservations",
      featureAr: "الحجوزات",
      manualEn: "Paper diary and phone calls",
      manualAr: "دفتر ورقي ومكالمات هاتفية",
      automatedEn: "Digital booking with conflict checks",
      automatedAr: "حجز رقمي مع فحص التعارضات",
    },
    {
      featureEn: "Inventory",
      featureAr: "المخزون",
      manualEn: "Guesswork, separate per branch",
      manualAr: "تخمين منفصل لكل فرع",
      automatedEn: "Real-time, branch-aware stock",
      automatedAr: "مخزون فوري يراعي الفروع",
    },
    {
      featureEn: "Payments",
      featureAr: "المدفوعات",
      manualEn: "Handwritten ledger",
      manualAr: "دفتر مكتوب بخط اليد",
      automatedEn: "Tracked online + WhatsApp receipts",
      automatedAr: "متابعة إلكترونية وإيصالات واتساب",
    },
  ],
  stats: [
    { labelEn: "Admin time saved", labelAr: "وقت الإدارة الموفر", value: "70%" },
    { labelEn: "Double-bookings", labelAr: "تعارضات الحجز", value: "0" },
    { labelEn: "Branches managed", labelAr: "الفروع المُدارة", value: "2+" },
  ],
  outcomeEn:
    "Zero double-bookings, real-time visibility across both branches, and a 70% reduction in daily admin time.",
  outcomeAr:
    "صفر تعارضات في الحجز، رؤية فورية عبر الفرعين، وتوفير 70% من وقت الإدارة اليومي.",
};

const cafeSpec: StudyBlockSpec = {
  problemEn:
    "Lavida Jungle Play Cafe hosts families in a busy kids' play area. Staff called parents' names over loud background music, so families in the play zone regularly missed their turn. Reservations lived on paper and there was no daily accountability for cash.",
  problemAr:
    "يستضيف كافيه لافيدا جانغل العائلات في منطقة لعب مزدحمة للأطفال. كان الموظفون ينادون أسماء الآباء وسط موسيقى صاخبة، فكانت العائلات في منطقة اللعب تفوّت دورها باستمرار. وكانت الحجوزات على الورق دون محاسبة يومية للنقد.",
  painPointsEn: [
    "Families missed callouts shouted over background music",
    "Reservations and kid check-ins tracked on paper",
    "No daily cash closure or per-cashier accountability",
    "No single view of tables, bookings, and orders",
  ],
  painPointsAr: [
    "العائلات تفوّت النداءات المرفوعة فوق الموسيقى",
    "الحجوزات وتسجيل الأطفال تُدار على الورق",
    "لا إغلاق نقدي يومي ولا محاسبة لكل أمين صندوق",
    "غياب رؤية موحّدة للطاولات والحجوزات والطلبات",
  ],
  solutionEn:
    "We delivered a reservation system paired with an AI text-to-speech announcer that automatically ducks the background music for each call, plus a POS with QR menus, thermal receipts, and daily cash-closure reports for every cashier.",
  solutionAr:
    "سلّمنا نظام حجز مقترناً بمُعلن ذكي يحوّل النص إلى كلام ويخفض الموسيقى تلقائياً مع كل نداء، إضافة إلى نظام نقاط بيع بقوائم QR وإيصالات حرارية وتقارير إغلاق نقدي يومية لكل أمين صندوق.",
  comparison: [
    {
      featureEn: "Announcements",
      featureAr: "الإعلانات",
      manualEn: "Staff shouting over music",
      manualAr: "نداء الموظفين فوق الموسيقى",
      automatedEn: "AI TTS that auto-ducks the music",
      automatedAr: "مُعلن ذكي يخفض الموسيقى تلقائياً",
    },
    {
      featureEn: "Reservations",
      featureAr: "الحجوزات",
      manualEn: "Paper list at the door",
      manualAr: "قائمة ورقية عند الباب",
      automatedEn: "Digital booking and check-in",
      automatedAr: "حجز وتسجيل دخول رقمي",
    },
    {
      featureEn: "Cash",
      featureAr: "النقد",
      manualEn: "No end-of-day reconciliation",
      manualAr: "لا تسوية في نهاية اليوم",
      automatedEn: "Daily closure per cashier",
      automatedAr: "إغلاق يومي لكل أمين صندوق",
    },
  ],
  stats: [
    { labelEn: "Missed callouts", labelAr: "نداءات فائتة", value: "0" },
    {
      labelEn: "Cash reconciliation",
      labelAr: "تسوية النقد",
      value: "Daily",
    },
    { labelEn: "Menus digitized", labelAr: "قوائم مرقمنة", value: "100%" },
  ],
  outcomeEn:
    "Zero missed family callouts, hands-free announcements every shift, and fully reconciled cash at the end of each day.",
  outcomeAr:
    "صفر نداءات فائتة للعائلات، إعلانات آلية في كل وردية، وتسوية نقدية كاملة في نهاية كل يوم.",
};

const megzSpec: StudyBlockSpec = {
  problemEn:
    "Megz Courses grew fast but ran enrolment through WhatsApp chats. The sales pipeline was invisible, leads slipped through the cracks, and teachers had no digital home for their materials or student progress.",
  problemAr:
    "نمت كورسات ميجز بسرعة لكن التسجيل كان يتم عبر محادثات واتساب. كان قمع المبيعات غير مرئي، وتضيع العملاء المحتملون، ولم يكن لدى المعلمين مكان رقمي لموادهم أو متابعة تقدم الطلاب.",
  painPointsEn: [
    "Student enrolment handled over WhatsApp",
    "No visibility into the sales pipeline",
    "Leads lost with no follow-up ownership",
    "Teachers without digital materials or progress tracking",
  ],
  painPointsAr: [
    "تسجيل الطلاب يتم عبر واتساب",
    "لا رؤية لقمع المبيعات",
    "ضياع العملاء المحتملين دون مسؤول متابعة",
    "معلمون بلا مواد رقمية أو متابعة للتقدم",
  ],
  solutionEn:
    "We built a full CRM with a lead-to-student pipeline, teacher portals with course materials, placement tests, and a 7-role access system covering owners, sales staff, and teachers — with orders and refunds handled in-app.",
  solutionAr:
    "بنينا نظام CRM كاملاً بمسار من العميل المحتمل حتى الطالب، وبوابات للمعلمين تضم المواد الدراسية واختبارات تحديد المستوى، ونظام صلاحيات من 7 أدوار يشمل الملاك وفريق المبيعات والمعلمين — مع إدارة الطلبات والمبالغ المستردة داخل النظام.",
  comparison: [
    {
      featureEn: "Enrolment",
      featureAr: "التسجيل",
      manualEn: "WhatsApp chats",
      manualAr: "محادثات واتساب",
      automatedEn: "CRM pipeline with stages",
      automatedAr: "قمع مبيعات بمراحل واضحة",
    },
    {
      featureEn: "Teaching materials",
      featureAr: "المواد الدراسية",
      manualEn: "Scattered files, none online",
      manualAr: "ملفات متفرقة وغير متاحة",
      automatedEn: "Teacher portals per course",
      automatedAr: "بوابات معلمين لكل دورة",
    },
    {
      featureEn: "Access control",
      featureAr: "الصلاحيات",
      manualEn: "Shared logins",
      manualAr: "حسابات مشتركة",
      automatedEn: "7 dedicated roles",
      automatedAr: "7 أدوار مخصصة",
    },
  ],
  stats: [
    { labelEn: "Students digitized", labelAr: "طلاب رُقمنوا", value: "500+" },
    {
      labelEn: "Lost leads",
      labelAr: "عملاء محتملون ضائعون",
      value: "0",
    },
    { labelEn: "User roles", labelAr: "أدوار المستخدمين", value: "7" },
  ],
  outcomeEn:
    "A complete lead-to-student pipeline digitized for 500+ students, with full accountability across the sales team.",
  outcomeAr:
    "رقمنة كاملة لمسار العميل حتى التسجيل لأكثر من 500 طالب، مع محاسبية كاملة عبر فريق المبيعات.",
};

const arabianSpec: StudyBlockSpec = {
  problemEn:
    "Arabian Foods, a MENA food distributor, relied on fragmented sales materials. Distributors had no single authoritative link to share with buyers, and every content change needed a developer.",
  problemAr:
    "اعتمدت الأغذية العربية، وهي موزّع أغذية في الشرق الأوسط، على مواد بيعية متفرقة. لم يكن لدى الموزعين رابط موثوق واحد لمشاركته مع المشترين، وكان كل تعديل في المحتوى يحتاج إلى مطوّر.",
  painPointsEn: [
    "Fragmented, inconsistent sales materials",
    "No single authoritative link for buyers",
    "Every content update required a developer",
    "Content available in one language only",
  ],
  painPointsAr: [
    "مواد بيعية متفرقة وغير متسقة",
    "لا رابط موثوق واحد للمشترين",
    "كل تحديث للمحتوى يحتاج مطوّراً",
    "المحتوى متاح بلغة واحدة فقط",
  ],
  solutionEn:
    "We rebuilt arabianfoods.net as a fully bilingual (EN/AR), content-driven website the marketing team updates in-house — giving distributors one polished link to share when pitching aged cheeses and private-label lines.",
  solutionAr:
    "أعدنا بناء arabianfoods.net كموقع ثنائي اللغة (عربي/إنجليزي) قائم على المحتوى يحدّثه فريق التسويق داخلياً — ليصبح لدى الموزعين رابط واحد أنيق لمشاركته عند تسويق الأجبان المعتّقة والعلامات الخاصة.",
  comparison: [
    {
      featureEn: "Content updates",
      featureAr: "تحديث المحتوى",
      manualEn: "Developer required each time",
      manualAr: "الحاجة لمطوّر في كل مرة",
      automatedEn: "In-house, no developer",
      automatedAr: "داخلياً دون مطوّر",
    },
    {
      featureEn: "Languages",
      featureAr: "اللغات",
      manualEn: "Single language",
      manualAr: "لغة واحدة",
      automatedEn: "Fully bilingual EN/AR",
      automatedAr: "ثنائي اللغة بالكامل",
    },
    {
      featureEn: "Sales sharing",
      featureAr: "المشاركة البيعية",
      manualEn: "Scattered PDFs and files",
      manualAr: "ملفات PDF متفرقة",
      automatedEn: "One authoritative link",
      automatedAr: "رابط موثوق واحد",
    },
  ],
  stats: [
    { labelEn: "Languages supported", labelAr: "اللغات المدعومة", value: "2" },
    {
      labelEn: "In-house updates",
      labelAr: "تحديث داخلي",
      value: "Yes",
    },
    { labelEn: "Developer needed", labelAr: "حاجة لمطوّر", value: "No" },
  ],
  outcomeEn:
    "Distributors across the region now share one authoritative, bilingual link when pitching products — updated entirely in-house.",
  outcomeAr:
    "يشارك الموزعون في المنطقة الآن رابطاً موثوقاً واحداً ثنائي اللغة عند تسويق المنتجات — يُحدَّث بالكامل داخلياً.",
};

const ba2olakSpec: StudyBlockSpec = {
  problemEn:
    "Grocery and market delivery in Egypt is concentrated in dense urban areas — established delivery apps rarely reach smaller towns and remote neighbourhoods, so residents there still walk between several stores, queue, and carry everything home themselves.",
  problemAr:
    "خدمات توصيل البقالة والسوق في مصر مركّزة في المناطق الحضرية الكثيفة — تطبيقات التوصيل الكبرى نادراً ما تصل إلى المدن الصغيرة والأحياء النائية، فما زال سكانها يمشون بين عدة محلات وينتظرون في الطوابير ويحملون كل شيء بأنفسهم.",
  painPointsEn: [
    "Delivery apps skip smaller towns and remote neighbourhoods",
    "Residents walk between multiple stores and queue in person",
    "No trusted way to order daily groceries by phone",
    "Card-first apps leave cash-only customers behind",
  ],
  painPointsAr: [
    "تطبيقات التوصيل تتجاهل المدن الصغيرة والأحياء النائية",
    "السكان يمشون بين عدة محلات وينتظرون في الطوابير",
    "لا وسيلة موثوقة لطلب البقالة اليومية عبر الهاتف",
    "التطبيقات التي تعتمد على البطاقات تُهمل عملاء الدفع النقدي",
  ],
  solutionEn:
    "A bilingual (Arabic-first) web + mobile marketplace where customers order from their phone and a ba2olak rider shops for the items in real stores and delivers to the door, cash on delivery. One Expo app serves both the customer and rider roles, backed by a crowd-sourced, AI-deduplicated bilingual catalog, WhatsApp OTP auth, and an admin dashboard for dispatch and catalog moderation.",
  solutionAr:
    "منصة ويب وموبايل ثنائية اللغة (عربي أولاً) يطلب من خلالها العميل من هاتفه، ويقوم سائق بقولك بشراء الأصناف من محلات حقيقية وتوصيلها للباب مع الدفع كاش عند الاستلام. تطبيق Expo واحد يخدم دوري العميل والسائق، مدعوماً بكتالوج ثنائي اللغة يُبنى من مساهمات المستخدمين ويُنقّى بالذكاء الاصطناعي، ومصادقة عبر واتساب OTP، ولوحة تحكم إدارية للتوزيع ومراجعة الكتالوج.",
  comparison: [
    {
      featureEn: "Ordering",
      featureAr: "الطلب",
      manualEn: "Walk store to store",
      manualAr: "المشي من محل لآخر",
      automatedEn: "Order by phone in ~2 minutes",
      automatedAr: "الطلب بالهاتف في دقيقتين تقريباً",
    },
    {
      featureEn: "Catalog",
      featureAr: "الكتالوج",
      manualEn: "No shared product list",
      manualAr: "لا قائمة منتجات موحّدة",
      automatedEn: "Crowd-sourced, AI-deduplicated & bilingual",
      automatedAr: "من مساهمات المستخدمين، مُنقّى بالذكاء وثنائي اللغة",
    },
    {
      featureEn: "Payment",
      featureAr: "الدفع",
      manualEn: "Pay and carry in person",
      manualAr: "الدفع والحمل شخصياً",
      automatedEn: "Cash on delivery to the door",
      automatedAr: "الدفع كاش عند الاستلام للباب",
    },
  ],
  stats: [
    {
      labelEn: "Platforms shipped",
      labelAr: "منصات تم إطلاقها",
      value: "Web + Mobile",
    },
    { labelEn: "Order status stages", labelAr: "مراحل حالة الطلب", value: "6" },
    { labelEn: "Languages", labelAr: "اللغات", value: "2" },
  ],
  outcomeEn:
    "ba2olak launched as a single Expo app serving both customers and riders — bringing phone-ordered, cash-on-delivery grocery runs to areas the big apps ignore.",
  outcomeAr:
    "أُطلق بقولك كتطبيق Expo واحد يخدم العملاء والسائقين معاً — ليصل بطلبات البقالة عبر الهاتف والدفع كاش عند الاستلام إلى المناطق التي تتجاهلها التطبيقات الكبرى.",
};

const emanzSpec: StudyBlockSpec = {
  problemEn:
    "Emanz Academy was driving traffic from Meta ads but had no conversion funnel to catch it. Bookings happened manually over chat, there was no online payment, and ad spend couldn't be tied to actual course sign-ups or revenue.",
  problemAr:
    "كانت أكاديمية إيمانز تجلب زيارات من إعلانات ميتا لكن دون قمع تحويل يلتقطها. كانت الحجوزات تتم يدوياً عبر المحادثة، ولا يوجد دفع إلكتروني، ولم يكن ممكناً ربط الإنفاق الإعلاني بالتسجيلات الفعلية أو الإيرادات.",
  painPointsEn: [
    "Course bookings handled manually over chat",
    "No online payment — students paid in person",
    "Meta ad spend couldn't be attributed to real bookings",
    "No bilingual, mobile-first landing built for campaigns",
  ],
  painPointsAr: [
    "حجوزات الدورات تُدار يدوياً عبر المحادثة",
    "لا دفع إلكتروني — يدفع الطلاب شخصياً",
    "تعذّر ربط إنفاق إعلانات ميتا بالحجوزات الفعلية",
    "لا صفحة هبوط ثنائية اللغة مبنية للحملات وتعمل أولاً على الموبايل",
  ],
  solutionEn:
    "A bilingual (AR/EN, RTL) landing-and-booking funnel: browse courses, book, then pay online with Paymob or reserve now and pay later. Every order stores its full ad attribution, with Meta Pixel + Conversions API (deduplicated by order id) and GA4 — plus a runtime marketing admin to manage tracking without redeploys.",
  solutionAr:
    "قمع هبوط وحجز ثنائي اللغة (عربي/إنجليزي، بتخطيط RTL): تصفّح الدورات، احجز، ثم ادفع إلكترونياً عبر Paymob أو احجز الآن وادفع لاحقاً. يخزّن كل طلب إسناده الإعلاني الكامل، مع Meta Pixel وواجهة التحويلات (مع إزالة التكرار حسب معرّف الطلب) وGA4 — إضافة إلى لوحة تسويق يمكن ضبطها دون إعادة نشر.",
  comparison: [
    {
      featureEn: "Booking",
      featureAr: "الحجز",
      manualEn: "Manual chat back-and-forth",
      manualAr: "أخذ ورد يدوي عبر المحادثة",
      automatedEn: "Online course booking form",
      automatedAr: "نموذج حجز إلكتروني للدورات",
    },
    {
      featureEn: "Payment",
      featureAr: "الدفع",
      manualEn: "Cash, in person",
      manualAr: "نقداً وشخصياً",
      automatedEn: "Paymob online or reserve-now-pay-later",
      automatedAr: "Paymob إلكترونياً أو احجز الآن وادفع لاحقاً",
    },
    {
      featureEn: "Ad attribution",
      featureAr: "الإسناد الإعلاني",
      manualEn: "Guesswork, nothing stored",
      manualAr: "تخمين دون تخزين",
      automatedEn: "Stored on every order (Pixel + CAPI, deduped)",
      automatedAr: "مُخزَّن على كل طلب (Pixel + CAPI، بلا تكرار)",
    },
  ],
  stats: [
    { labelEn: "Languages (RTL)", labelAr: "اللغات (RTL)", value: "2" },
    { labelEn: "Payment paths", labelAr: "مسارات الدفع", value: "2" },
    {
      labelEn: "Orders with ad attribution",
      labelAr: "طلبات بإسناد إعلاني",
      value: "100%",
    },
  ],
  outcomeEn:
    "A bilingual conversion funnel that turns ad clicks into booked, paid courses — with every order's ad attribution captured for clean, deduplicated Meta and GA4 reporting.",
  outcomeAr:
    "قمع تحويل ثنائي اللغة يحوّل نقرات الإعلان إلى دورات محجوزة ومدفوعة — مع التقاط الإسناد الإعلاني لكل طلب لتقارير ميتا وGA4 نظيفة وبلا تكرار.",
};

export function buildCaseStudyBlockRows(
  ids: SeedCaseStudyIds,
  createdBy: string,
): NewCaseStudyBlock[] {
  return [
    ...studyBlocks(ids.atelier, createdBy, atelierSpec),
    ...studyBlocks(ids.cafe, createdBy, cafeSpec),
    ...studyBlocks(ids.megz, createdBy, megzSpec),
    ...studyBlocks(ids.arabian, createdBy, arabianSpec),
    ...studyBlocks(ids.ba2olak, createdBy, ba2olakSpec),
    ...studyBlocks(ids.emanz, createdBy, emanzSpec),
  ];
}
