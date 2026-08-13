import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/drizzle";
import {
  type BlockType,
  BlogPostBlocksTable,
  BlogPostsTable,
} from "@/drizzle/schema";

/**
 * Atelier / dress-rental vertical article pair, inserted as DRAFTS.
 *
 * Article A ("the perfect scenario") is vendor-neutral and targets
 * "dress rental management software". Article B ("the solution we built")
 * is the proof story and draws every fact from the real published
 * `atelier-alaa-el-kasry` case study — problem statement, solution, and the
 * three metrics in its `results.metrics` (70% admin time saved, 0
 * double-bookings, 2 branches). No invented clients, quotes, or numbers.
 *
 * Both stay `status: "draft"`. A human publishes from /blog-posts.
 */

const CONTENT_IMPORT_ACTOR = "system:content-import";

/** The real case study both articles cite. */
const CASE_STUDY_PATH = "/work/atelier-alaa-el-kasry";

type SeedBlock = {
  type: BlockType;
  contentEn?: string | null;
  contentAr?: string | null;
  data?: Record<string, unknown> | null;
};

type SeedArticle = {
  title: string;
  titleAr: string;
  slug: string;
  excerpt: string;
  excerptAr: string;
  tags: string[];
  tagsAr: string[];
  blocks: SeedBlock[];
};

const articleA: SeedArticle = {
  title:
    "Dress Rental Management Software: How to Stop Double Bookings and Track Every Dress",
  titleAr:
    "برنامج إدارة تأجير الفساتين: كيف تمنع الحجوزات المزدوجة وتتابع كل فستان",
  slug: "dress-rental-management-software",
  excerpt:
    "Double bookings, lost deposits, and gowns that vanish into cleaning for a week are not staffing problems — they are tracking problems. Here is what dress rental management software needs to do before it is worth paying for.",
  excerptAr:
    "الحجوزات المزدوجة، والعربون الضائع، والفساتين التي تختفي في التنظيف لأسبوع ليست مشاكل في الموظفين — بل مشاكل في التتبع. إليك ما يجب أن يفعله برنامج إدارة تأجير الفساتين قبل أن يستحق ما تدفعه فيه.",
  tags: ["Dress Rental", "Atelier", "Inventory", "Bookings"],
  tagsAr: ["تأجير فساتين", "أتيليه", "المخزون", "الحجوزات"],
  blocks: [
    {
      type: "paragraph",
      contentEn:
        "A dress rental business does not fail because the team is careless. It fails because a single gown lives in more states than a notebook can hold. One dress is reserved for a Thursday fitting, promised verbally to a second bride for the following weekend, sitting at the cleaner's until Tuesday, and carrying a deposit that only one person remembers collecting. Miss one of those states and you get the worst phone call in the business: the dress a customer already paid for is not available.",
      contentAr:
        "لا يفشل نشاط تأجير الفساتين لأن الفريق مهمل. يفشل لأن الفستان الواحد يمر بحالات أكثر مما يستطيع الدفتر أن يستوعبه. فستان محجوز لقياس يوم الخميس، ومَوعود به شفهيًا لعروس أخرى في نهاية الأسبوع التالي، وموجود عند المغسلة حتى الثلاثاء، وعليه عربون لا يتذكر تحصيله سوى شخص واحد. يكفي أن تفوتك حالة واحدة من هذه لتصل إلى أسوأ مكالمة في هذا المجال: الفستان الذي دفعت العميلة ثمنه بالفعل غير متاح.",
    },
    {
      type: "heading",
      contentEn: "Why Paper and Spreadsheets Break at Exactly the Wrong Moment",
      contentAr: "لماذا ينهار الورق وجداول البيانات في أسوأ لحظة ممكنة",
      data: { level: 2 },
    },
    {
      type: "paragraph",
      contentEn:
        "Paper and spreadsheets record what happened. They do not prevent what should not happen. A notebook will happily let you write the same dress into two overlapping dates, because it has no idea the first booking exists. A shared spreadsheet is slightly better until two people open it at once, or until the branch across town writes into their own copy. The gap is not effort — it is that nothing in the system is checking for a conflict at the moment the booking is made.",
      contentAr:
        "الورق وجداول البيانات تسجّل ما حدث، لكنها لا تمنع ما لا ينبغي أن يحدث. الدفتر سيسمح لك بكل بساطة أن تكتب الفستان نفسه في تاريخين متداخلين، لأنه لا يعرف أصلًا أن الحجز الأول موجود. وجدول البيانات المشترك أفضل قليلًا — إلى أن يفتحه شخصان في الوقت نفسه، أو إلى أن يكتب الفرع الآخر في نسخته الخاصة. المشكلة ليست في الاجتهاد، بل في أن لا شيء في النظام يفحص التعارض في اللحظة التي يُسجَّل فيها الحجز.",
    },
    {
      type: "paragraph",
      contentEn:
        "The second failure is subtler. A dress is not simply 'rented' or 'available'. It cycles through fitting, reservation, deposit, pickup, return, cleaning, tailoring, and repair — and during most of those stages it is physically absent while still being, on paper, 'in stock'. Any system that offers you only two states will quietly oversell your rack.",
      contentAr:
        "أما الخلل الثاني فأدق. الفستان ليس ببساطة «مؤجَّرًا» أو «متاحًا». إنه يدور في دورة كاملة: قياس، ثم حجز، ثم عربون، ثم استلام، ثم إرجاع، ثم تنظيف، ثم ترزي، ثم إصلاح — وفي معظم هذه المراحل يكون الفستان غائبًا فعليًا بينما يبقى على الورق «متوفرًا». وأي نظام يمنحك حالتين فقط سيبيع لك أكثر مما تملك دون أن تشعر.",
    },
    {
      type: "heading",
      contentEn: "The Four Questions Your System Must Answer Instantly",
      contentAr: "الأسئلة الأربعة التي يجب أن يجيب عنها نظامك فورًا",
      data: { level: 2 },
    },
    {
      type: "list",
      contentEn: null,
      contentAr: null,
      data: {
        ordered: true,
        itemsEn: [
          "Is this dress actually available on these dates — including the cleaning and tailoring days on either side of the rental?",
          "Who booked it, from which branch, and what was agreed at the fitting?",
          "What has been paid, what deposit is held, and what balance is still outstanding?",
          "When is it due back, and what happens to it between the return and the next booking?",
        ],
        itemsAr: [
          "هل هذا الفستان متاح فعلًا في هذه التواريخ — بما في ذلك أيام التنظيف والترزي قبل فترة التأجير وبعدها؟",
          "من حجزه، ومن أي فرع، وما الذي تم الاتفاق عليه أثناء القياس؟",
          "كم دُفع، وما قيمة العربون المحتجز، وما الرصيد المتبقي؟",
          "متى موعد إرجاعه، وماذا يحدث له بين الإرجاع والحجز التالي؟",
        ],
      },
    },
    {
      type: "paragraph",
      contentEn:
        "If answering any of these requires calling another branch or opening a second file, the system is not doing its job. These four answers are the whole product; everything else is convenience.",
      contentAr:
        "إذا كانت الإجابة عن أي من هذه الأسئلة تتطلب الاتصال بفرع آخر أو فتح ملف ثانٍ، فالنظام لا يؤدي وظيفته. هذه الإجابات الأربع هي المنتج كله، وما عداها وسائل راحة إضافية.",
    },
    {
      type: "heading",
      contentEn: "Manual Workflow vs. A Real Rental System",
      contentAr: "سير العمل اليدوي مقابل نظام تأجير حقيقي",
      data: { level: 2 },
    },
    {
      type: "comparison",
      contentEn: null,
      contentAr: null,
      data: {
        rows: [
          {
            featureEn: "Checking availability",
            featureAr: "التحقق من التوافر",
            manualEn: "Flip through a notebook or call the other branch",
            manualAr: "تقليب الدفتر أو الاتصال بالفرع الآخر",
            automatedEn:
              "Conflict check runs at booking time and blocks overlapping dates",
            automatedAr: "فحص التعارض يعمل لحظة الحجز ويمنع التواريخ المتداخلة",
          },
          {
            featureEn: "Deposits and balances",
            featureAr: "العربون والأرصدة",
            manualEn: "Remembered by whoever took the payment",
            manualAr: "يتذكرها من استلم الدفعة فقط",
            automatedEn:
              "Recorded against the reservation with a running balance",
            automatedAr: "تُسجَّل على الحجز نفسه مع رصيد محدَّث باستمرار",
          },
          {
            featureEn: "Dress status",
            featureAr: "حالة الفستان",
            manualEn: "Available or rented — nothing in between",
            manualAr: "متاح أو مؤجَّر — ولا شيء بينهما",
            automatedEn:
              "Distinct states for rental, cleaning, tailoring, and repair",
            automatedAr: "حالات منفصلة للتأجير والتنظيف والترزي والإصلاح",
          },
          {
            featureEn: "Multiple branches",
            featureAr: "تعدد الفروع",
            manualEn: "Each branch keeps its own record",
            manualAr: "كل فرع يحتفظ بسجله الخاص",
            automatedEn: "One shared source of truth, filtered by branch",
            automatedAr: "مصدر معلومات واحد مشترك، مُصفّى حسب الفرع",
          },
        ],
      },
    },
    {
      type: "heading",
      contentEn: "What to Look For Before You Buy",
      contentAr: "ما الذي تبحث عنه قبل الشراء",
      data: { level: 2 },
    },
    {
      type: "list",
      contentEn: null,
      contentAr: null,
      data: {
        ordered: false,
        itemsEn: [
          "Conflict checking that refuses the booking, rather than a warning someone can click past.",
          "Operational statuses that match your real workflow — cleaning and tailoring are not the same thing.",
          "Deposit and balance tracking attached to the reservation, not to a separate cash book.",
          "Branch awareness, so a two-branch atelier does not become two separate businesses.",
          "Arabic and English that both read naturally, because your team and your customers may not share one language.",
          "A receipt your team can send on WhatsApp, because that is where the conversation already is.",
        ],
        itemsAr: [
          "فحص تعارض يرفض الحجز فعليًا، لا مجرد تنبيه يستطيع أي شخص تجاوزه بضغطة.",
          "حالات تشغيلية تطابق سير عملك الحقيقي — فالتنظيف ليس هو الترزي.",
          "متابعة العربون والرصيد مرتبطة بالحجز نفسه، لا بدفتر نقدية منفصل.",
          "إدراك للفروع، حتى لا يتحول أتيليه من فرعين إلى نشاطين منفصلين.",
          "عربية وإنجليزية تُقرأ كلتاهما بشكل طبيعي، لأن فريقك وعميلاتك قد لا يتشاركون لغة واحدة.",
          "إيصال يستطيع فريقك إرساله عبر واتساب، لأن المحادثة تدور هناك أصلًا.",
        ],
      },
    },
    {
      type: "paragraph",
      contentEn: `This is not a theoretical checklist. We built exactly this for a two-branch couture atelier in Egypt — the full story, including what we got wrong first, is in our [dress rental management software case study](${CASE_STUDY_PATH}). If you want the operational detail rather than the product view, read the companion piece on [running dress-rental branches day to day](/blog/atelier-management-system).`,
      contentAr: `هذه ليست قائمة نظرية. لقد بنينا هذا بالضبط لأتيليه كوتور من فرعين في مصر — والقصة كاملة، بما فيها ما أخطأنا فيه في البداية، موجودة في [دراسة حالة برنامج إدارة تأجير الفساتين](${CASE_STUDY_PATH}). وإن كنت تريد التفاصيل التشغيلية بدلًا من نظرة المنتج، اقرأ المقال المرافق عن [إدارة فروع تأجير الفساتين يومًا بيوم](/blog/atelier-management-system).`,
    },
    {
      type: "cta",
      contentEn:
        "Tell us how your atelier tracks dresses today, and we'll tell you where the double bookings are coming from.",
      contentAr:
        "أخبرنا كيف تتابعون الفساتين اليوم، وسنخبركم من أين تأتي الحجوزات المزدوجة.",
      data: {
        labelEn: "Talk to us about your atelier",
        labelAr: "تحدث إلينا عن الأتيليه الخاص بك",
        href: "/contact?source=article-atelier-a",
      },
    },
  ],
};

const articleB: SeedArticle = {
  title:
    "Atelier Management System: A Practical Guide to Running Dress-Rental Branches",
  titleAr: "برنامج إدارة الأتيليه: دليل عملي لإدارة فروع تأجير الفساتين",
  slug: "atelier-management-system",
  excerpt:
    "What actually changes when a two-branch couture atelier moves off paper: the workflow we mapped, the decisions we made building the system, and the results the team measured afterwards.",
  excerptAr:
    "ما الذي يتغير فعليًا حين ينتقل أتيليه كوتور من فرعين بعيدًا عن الورق: سير العمل الذي رسمناه، والقرارات التي اتخذناها أثناء بناء النظام، والنتائج التي قاسها الفريق بعد ذلك.",
  tags: ["Atelier", "Multi-Branch", "Case Study", "Egypt"],
  tagsAr: ["أتيليه", "تعدد الفروع", "دراسة حالة", "مصر"],
  blocks: [
    {
      type: "paragraph",
      contentEn:
        "Atelier Alaa El-Kasry runs a couture dress-rental business across two branches. Before we started, reservations, fittings, deposits, and returns were tracked on paper and over the phone. The team had no single reliable view of which gowns were available, which customer had paid a deposit, or which pieces were due back — which meant a standing risk of double bookings, manual reconciliation at the end of every day, and slow coordination between the two locations.",
      contentAr:
        "يدير Atelier Alaa El-Kasry نشاط تأجير فساتين كوتور عبر فرعين. قبل أن نبدأ، كانت الحجوزات والقياسات والعربون والإرجاع تُسجَّل على الورق وعبر الهاتف. لم يكن لدى الفريق مصدر واحد موثوق لمعرفة الفساتين المتاحة، أو من دفعت العربون، أو القطع الواجب إرجاعها — ما يعني خطرًا دائمًا من الحجز المزدوج، وتسوية يدوية في نهاية كل يوم، وبطئًا في التنسيق بين الفرعين.",
    },
    {
      type: "heading",
      contentEn: "Step One: Map the Rental Cycle Before Writing Any Code",
      contentAr: "الخطوة الأولى: ارسم دورة التأجير قبل كتابة أي كود",
      data: { level: 2 },
    },
    {
      type: "paragraph",
      contentEn:
        "The temptation with an atelier is to model it as a shop: products, stock, sales. That model breaks immediately, because a rented gown comes back. The unit of work is not a sale, it is a cycle — fitting, reservation, deposit, pickup, return, cleaning, tailoring, repair, then availability again. We mapped that cycle with the team first, and only then decided what the database needed to hold. Almost every design decision that followed came from that map.",
      contentAr:
        "الإغراء عند التعامل مع أتيليه هو تصميمه كمحل تجاري: منتجات ومخزون ومبيعات. وهذا النموذج ينهار فورًا، لأن الفستان المؤجَّر يعود. وحدة العمل هنا ليست عملية بيع، بل دورة كاملة: قياس، حجز، عربون، استلام، إرجاع، تنظيف، ترزي، إصلاح، ثم الإتاحة من جديد. رسمنا هذه الدورة مع الفريق أولًا، وبعدها فقط قررنا ما الذي يجب أن تحتفظ به قاعدة البيانات. ومعظم قرارات التصميم التالية خرجت من تلك الخريطة.",
    },
    {
      type: "heading",
      contentEn: "Step Two: Make the Branch a First-Class Concept",
      contentAr: "الخطوة الثانية: اجعل الفرع مفهومًا أساسيًا في النظام",
      data: { level: 2 },
    },
    {
      type: "paragraph",
      contentEn:
        "Two branches is where most improvised systems collapse. If the branch is an afterthought — a column added late, or worse, a second copy of the spreadsheet — then every list, every availability check, and every report has to remember to account for it, and eventually one of them forgets. We made branch context part of how inventory and reservations are read from the start, so the team sees their own branch by default while owners can still review reservations, balances, payments, expenses, and performance across both.",
      contentAr:
        "الفرعان هما النقطة التي تنهار عندها معظم الأنظمة المرتجلة. فإذا كان الفرع فكرة لاحقة — عمود أُضيف متأخرًا، أو الأسوأ: نسخة ثانية من جدول البيانات — فإن كل قائمة وكل فحص توافر وكل تقرير عليه أن يتذكر أخذه في الحسبان، وفي النهاية سينسى أحدها. جعلنا سياق الفرع جزءًا من طريقة قراءة المخزون والحجوزات منذ البداية، فيرى الفريق فرعه افتراضيًا، بينما يظل بإمكان المالك مراجعة الحجوزات والأرصدة والتحصيلات والمصروفات والأداء عبر الفرعين معًا.",
    },
    {
      type: "heading",
      contentEn: "Step Three: Refuse the Conflict, Don't Just Warn About It",
      contentAr: "الخطوة الثالثة: ارفض التعارض، لا تكتفِ بالتنبيه عليه",
      data: { level: 2 },
    },
    {
      type: "paragraph",
      contentEn:
        "Digital reservations only remove double bookings if the conflict check is binding. A warning that can be dismissed will be dismissed, usually by the person under the most time pressure. We put the check at the point the reservation is created and gave dresses distinct operational statuses for rental, cleaning, tailoring, and repair — so a gown physically sitting at the cleaner's cannot be promised to anyone, and the availability answer is the same one everybody sees.",
      contentAr:
        "الحجوزات الرقمية لا تُنهي الحجز المزدوج إلا إذا كان فحص التعارض مُلزِمًا. فالتنبيه الذي يمكن تجاوزه سيُتجاوَز فعلًا، وغالبًا من الشخص الأكثر ضغطًا في الوقت. وضعنا الفحص عند نقطة إنشاء الحجز، ومنحنا الفساتين حالات تشغيلية منفصلة للتأجير والتنظيف والترزي والإصلاح — فالفستان الموجود فعليًا عند المغسلة لا يمكن الوعد به لأحد، وإجابة التوافر واحدة يراها الجميع.",
    },
    {
      type: "heading",
      contentEn: "Step Four: Put Money on the Reservation",
      contentAr: "الخطوة الرابعة: اربط المال بالحجز نفسه",
      data: { level: 2 },
    },
    {
      type: "paragraph",
      contentEn:
        "Deposits were the quietest source of end-of-day pain. When a deposit lives in someone's memory or a separate cash book, reconciling it means reconstructing the day from receipts. Attaching payments and deposits directly to the reservation turned that nightly reconstruction into a lookup, and made the outstanding balance visible at the moment a customer walks in rather than after they leave. Receipts go out over WhatsApp, which is where the customer conversation was already happening.",
      contentAr:
        "كان العربون أهدأ مصادر الوجع في نهاية اليوم. فحين يعيش العربون في ذاكرة أحدهم أو في دفتر نقدية منفصل، تصبح تسويته إعادة بناء لليوم كله من الإيصالات. ربط الدفعات والعربون مباشرة بالحجز حوّل إعادة البناء الليلية تلك إلى مجرد عملية بحث، وجعل الرصيد المتبقي ظاهرًا لحظة دخول العميلة لا بعد خروجها. أما الإيصالات فتُرسَل عبر واتساب، حيث تدور محادثة العميلة أصلًا.",
    },
    {
      type: "heading",
      contentEn: "What the Team Measured Afterwards",
      contentAr: "ما الذي قاسه الفريق بعد ذلك",
      data: { level: 2 },
    },
    {
      type: "stats",
      contentEn: null,
      contentAr: null,
      data: {
        items: [
          {
            labelEn: "Admin time saved",
            labelAr: "وقت الإدارة الموفر",
            value: "70%",
          },
          {
            labelEn: "Double-bookings",
            labelAr: "تعارضات الحجز",
            value: "0",
          },
          {
            labelEn: "Branches managed",
            labelAr: "الفروع المُدارة",
            value: "2",
          },
        ],
      },
    },
    {
      type: "paragraph",
      contentEn: `Both branches now work from one operational source of truth. The full project write-up, including the live system, is in the [multi-branch atelier management system](${CASE_STUDY_PATH}) case study. If you are still at the evaluation stage and want the vendor-neutral checklist instead, start with [what dress rental management software needs to do](/blog/dress-rental-management-software).`,
      contentAr: `يعمل الفرعان الآن من مصدر معلومات تشغيلي واحد. التوثيق الكامل للمشروع، بما فيه النظام المباشر، موجود في دراسة حالة [نظام إدارة الأتيليه متعدد الفروع](${CASE_STUDY_PATH}). وإن كنت لا تزال في مرحلة التقييم وتريد قائمة محايدة بدلًا من ذلك، فابدأ بمقال [ما الذي يجب أن يفعله برنامج إدارة تأجير الفساتين](/blog/dress-rental-management-software).`,
    },
    {
      type: "heading",
      contentEn: "What We'd Tell Another Atelier",
      contentAr: "ما الذي نقوله لأتيليه آخر",
      data: { level: 2 },
    },
    {
      type: "paragraph",
      contentEn:
        "Start with the workflow, not the feature list. The best rental system is not the one with the most modules — it is the one that gives your team a single trusted answer to whether the dress is free, who booked it, what has been paid, and when it comes back. If you can answer those four without picking up the phone, the software is working.",
      contentAr:
        "ابدأ بسير العمل، لا بقائمة المزايا. أفضل نظام تأجير ليس صاحب أكبر عدد من الوحدات، بل الذي يمنح فريقك إجابة واحدة موثوقة عن: هل الفستان متاح؟ ومن حجزه؟ وكم دُفع؟ ومتى يعود؟ فإذا استطعت الإجابة عن هذه الأربعة دون رفع سماعة الهاتف، فالبرنامج يؤدي عمله.",
    },
    {
      type: "cta",
      contentEn:
        "Running more than one branch and still reconciling by hand? Let's map your rental cycle together.",
      contentAr:
        "تدير أكثر من فرع وما زلت تسوّي الحسابات يدويًا؟ لنرسم دورة التأجير الخاصة بك معًا.",
      data: {
        labelEn: "Book a walkthrough",
        labelAr: "احجز جلسة استعراض",
        href: "/contact?source=article-atelier-b",
      },
    },
  ],
};

async function seedArticle(article: SeedArticle) {
  const existing = await db.query.BlogPostsTable.findFirst({
    columns: { id: true },
    where: and(
      eq(BlogPostsTable.slug, article.slug),
      isNull(BlogPostsTable.deletedAt),
    ),
  });
  if (existing) {
    console.log(
      `↷ Blog post "${article.slug}" already exists (id: ${existing.id}), skipping.`,
    );
    return existing;
  }

  const id = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(BlogPostsTable)
      .values({
        title: article.title,
        titleAr: article.titleAr,
        slug: article.slug,
        excerpt: article.excerpt,
        excerptAr: article.excerptAr,
        // Legacy scalar fallback only — the real body lives in blog_post_blocks
        // (see blocks[] below). Kept non-empty to satisfy the NOT NULL column
        // until it's dropped per the block-content migration plan.
        content: `<p>${article.excerpt}</p>`,
        contentAr: `<p>${article.excerptAr}</p>`,
        tags: article.tags,
        tagsAr: article.tagsAr,
        status: "draft",
        createdBy: CONTENT_IMPORT_ACTOR,
      })
      .returning({ id: BlogPostsTable.id });

    await tx.insert(BlogPostBlocksTable).values(
      article.blocks.map((block, idx) => ({
        parentId: row.id,
        type: block.type,
        sortOrder: idx,
        contentEn: block.contentEn ?? null,
        contentAr: block.contentAr ?? null,
        data: block.data ?? null,
        createdBy: CONTENT_IMPORT_ACTOR,
      })),
    );

    return row.id;
  });

  console.log(`✅ Inserted draft article "${article.slug}" (id: ${id}).`);
  return { id };
}

export async function seedAtelierVerticalArticles() {
  await seedArticle(articleA);
  await seedArticle(articleB);
  console.log(
    "   Reminder: both articles are drafts. Review + add cover images/media in /blog-posts, then publish.",
  );
}
