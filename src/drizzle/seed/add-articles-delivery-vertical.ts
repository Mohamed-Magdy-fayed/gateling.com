import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/drizzle";
import {
  type BlockType,
  BlogPostBlocksTable,
  BlogPostsTable,
} from "@/drizzle/schema";

const CONTENT_IMPORT_ACTOR = "system:content-import";

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
    "What the Ideal Delivery Experience Looks Like for Egypt's Small Towns and Remote Neighborhoods",
  titleAr:
    "كيف تبدو تجربة التوصيل المثالية للمدن الصغيرة والأحياء النائية في مصر",
  slug: "delivery-app-for-underserved-towns-egypt",
  excerpt:
    "Most delivery apps are built for dense city demand and never reach smaller towns. Here's what a genuinely good delivery experience looks like when it's designed around a small town's real constraints instead.",
  excerptAr:
    "معظم تطبيقات التوصيل مبنية لكثافة الطلب في المدن الكبرى ولا تصل أبداً إلى المدن الصغيرة. إليك كيف تبدو تجربة توصيل جيدة فعلاً عندما تُصمَّم حول القيود الحقيقية لمدينة صغيرة بدلاً من ذلك.",
  tags: ["Delivery", "Marketplace", "Logistics", "Egypt"],
  tagsAr: ["توصيل", "سوق إلكتروني", "لوجستيات", "مصر"],
  blocks: [
    {
      type: "paragraph",
      contentEn:
        "Delivery in Egypt has boomed in Cairo, Alexandria, and a handful of other big cities — but drive an hour outside any of them and the picture changes. The apps that dominate app-store rankings rarely operate there at all, and the ones that do usually treat smaller towns as an afterthought bolted onto a system built for dense urban demand. The result: households in these areas still walk between multiple stores, wait in line, and carry everything home themselves — the exact friction delivery apps exist to remove.",
      contentAr:
        "شهد التوصيل في مصر ازدهاراً كبيراً في القاهرة والإسكندرية وعدد قليل من المدن الكبرى — لكن بمجرد أن تبتعد بالسيارة ساعة واحدة عن أي منها تتغير الصورة تماماً. التطبيقات التي تتصدر متاجر التطبيقات نادراً ما تعمل هناك من الأساس، وما يعمل منها غالباً يعامل المدن الصغيرة كإضافة ثانوية فوق نظام مبني أصلاً لكثافة الطلب في المدن الكبرى. والنتيجة أن سكان هذه المناطق ما زالوا يمشون بين عدة محلات، وينتظرون في الطوابير، ويحملون مشترياتهم بأنفسهم — وهو بالضبط العناء الذي وُجدت تطبيقات التوصيل لإزالته.",
    },
    {
      type: "heading",
      contentEn: "Why the Big Delivery Apps Skip Smaller Towns",
      contentAr: "لماذا تتجاهل تطبيقات التوصيل الكبرى المدن الصغيرة",
      data: { level: 2 },
    },
    {
      type: "paragraph",
      contentEn:
        "The reasons are mostly economic, not technical. Delivery margins depend on order density — enough orders per square kilometer that a driver's trip pays for itself. Small towns and remote neighborhoods have the opposite: fewer households per route, longer distances between stops, and a driver pool that's harder to recruit and retain because the volume of work doesn't yet exist to make it a full-time job. On top of that, these markets usually lack a ready-made store catalog — no big-city aggregator has spent years digitizing every neighborhood grocer's shelf, so there's no data to build on.",
      contentAr:
        "الأسباب في معظمها اقتصادية وليست تقنية. هامش ربح التوصيل يعتمد على كثافة الطلبات — عدد كافٍ من الطلبات في الكيلومتر المربع الواحد بحيث تغطي رحلة السائق تكلفتها. المدن الصغيرة والأحياء النائية على العكس تماماً: عدد أقل من المنازل في كل خط سير، مسافات أطول بين التوقفات، وصعوبة أكبر في استقطاب سائقين والحفاظ عليهم لأن حجم العمل لا يكفي بعد ليكون وظيفة بدوام كامل. يُضاف إلى ذلك أن هذه الأسواق غالباً تفتقر لكتالوج جاهز للمحلات — فلم تقضِ أي منصة كبرى سنوات في رقمنة رفوف كل بقال في كل حي، فلا توجد بيانات جاهزة يُبنى عليها.",
    },
    {
      type: "heading",
      contentEn: "What a Genuinely Good Delivery Experience Looks Like There",
      contentAr: "كيف تبدو تجربة توصيل جيدة فعلاً في هذه المناطق",
      data: { level: 2 },
    },
    {
      type: "paragraph",
      contentEn:
        "Solving this isn't about shrinking a big-city app down — it's about designing for the constraints from day one. A handful of decisions separate a platform that actually works in these areas from one that technically launches there but never gets used:",
      contentAr:
        "حل هذه المشكلة لا يكون باختصار تطبيق مدينة كبرى ليعمل في مساحة أصغر — بل بالتصميم من اليوم الأول حول هذه القيود بالذات. هناك عدد قليل من القرارات يفصل بين منصة تعمل فعلاً في هذه المناطق ومنصة تُطلق تقنياً هناك لكن لا يستخدمها أحد:",
    },
    {
      type: "list",
      data: {
        ordered: false,
        itemsEn: [
          "A catalog that's built from what shoppers find in real stores, not assumed from a head-office spreadsheet — and ideally cleaned up automatically as it grows, since no one has time to moderate thousands of duplicate entries by hand.",
          "Cash on delivery as the default payment method, not a fallback — because digital payment adoption in smaller towns is still catching up, and forcing card-only checkout is the fastest way to lose the entire market.",
          "Login that works for someone who's never installed an app before — a WhatsApp OTP flow is far more familiar than an email/password form to most first-time users here.",
          "One person able to cover both roles — shopping the order in-store and delivering it — because the order volume in a new area rarely supports separate specialist roles from day one.",
          "Arabic that reads like Arabic, not like a translated afterthought — across the whole product, not just the marketing page.",
        ],
        itemsAr: [
          "كتالوج يُبنى مما يجده المتسوقون فعلاً داخل المحلات الحقيقية، لا مما يُفترض من جدول بيانات في المكتب الرئيسي — ويُفضّل أن يُنظَّف تلقائياً كلما كبر، لأنه لا أحد لديه وقت لمراجعة آلاف الإدخالات المكررة يدوياً.",
          "الدفع كاش عند الاستلام كخيار افتراضي لا كحل بديل — لأن تبني الدفع الرقمي في المدن الصغيرة ما زال في مراحله الأولى، وإجبار العملاء على الدفع بالبطاقة فقط هو أسرع طريق لخسارة السوق بالكامل.",
          "تسجيل دخول يناسب شخصاً لم يُثبّت تطبيقاً من قبل — التفعيل عبر واتساب أقرب لعادات أغلب المستخدمين الجدد هنا من نموذج بريد إلكتروني وكلمة مرور.",
          "شخص واحد يمكنه القيام بالدورين معاً — التسوق من المحل والتوصيل — لأن حجم الطلبات في منطقة جديدة نادراً ما يكفي لتخصيص دورين منفصلين من اليوم الأول.",
          "عربية تُقرأ كعربية أصيلة لا كترجمة لاحقة — في المنتج كله، وليس فقط في صفحة التسويق.",
        ],
      },
    },
    {
      type: "paragraph",
      contentEn:
        "None of this is theoretical — it's the exact set of decisions behind [ba2olak](/work/ba2olak), the bilingual delivery marketplace we built for Egypt's underserved towns. We cover how each piece came together in [the solution we built](/blog/ba2olak-delivery-marketplace-case-study).",
      contentAr:
        "لا شيء من هذا نظري — إنه بالضبط مجموعة القرارات التي بُنيت عليها [بقولك](/work/ba2olak)، منصة التوصيل ثنائية اللغة التي بنيناها للمدن غير المخدومة في مصر. نستعرض كيف اجتمعت كل هذه الأجزاء في [الحل الذي بنيناه](/blog/ba2olak-delivery-marketplace-case-study).",
    },
    {
      type: "heading",
      contentEn: "Manual Errands vs. a Well-Built Local Delivery Platform",
      contentAr: "المشاوير اليدوية مقابل منصة توصيل محلية مبنية جيداً",
      data: { level: 2 },
    },
    {
      type: "comparison",
      data: {
        rows: [
          {
            featureEn: "Getting groceries",
            featureAr: "الحصول على البقالة",
            manualEn:
              "Walk to 2-3 stores, compare prices in person, carry everything home",
            manualAr:
              "المشي بين 2-3 محلات، مقارنة الأسعار شخصياً، وحمل كل شيء للمنزل",
            automatedEn:
              "Order from a phone, driver shops and delivers to the door",
            automatedAr: "الطلب من الهاتف، والسائق يتسوق ويوصّل حتى الباب",
          },
          {
            featureEn: "Paying",
            featureAr: "الدفع",
            manualEn: "Cash only, no record of what was bought or when",
            manualAr: "كاش فقط، بلا أي سجل لما تم شراؤه أو متى",
            automatedEn:
              "Cash on delivery by default, with an order history you can check anytime",
            automatedAr:
              "دفع كاش عند الاستلام كخيار افتراضي، مع سجل طلبات يمكن مراجعته في أي وقت",
          },
          {
            featureEn: "Finding what's in stock",
            featureAr: "معرفة المتوفر",
            manualEn: "Call ahead or walk over and hope it's there",
            manualAr: "الاتصال مسبقاً أو الذهاب شخصياً على أمل توفر الصنف",
            automatedEn: "Browse a live catalog before you leave the house",
            automatedAr: "تصفح كتالوج مباشر قبل الخروج من المنزل",
          },
          {
            featureEn: "Trusting who shows up",
            featureAr: "الثقة بمن يأتي للتوصيل",
            manualEn: "Rely on knowing the shopkeeper personally",
            manualAr: "الاعتماد على معرفة صاحب المحل شخصياً",
            automatedEn:
              "Verified drivers, order status tracked stage by stage",
            automatedAr: "سائقون موثقون، وتتبع حالة الطلب مرحلة بمرحلة",
          },
        ],
      },
    },
    {
      type: "heading",
      contentEn: "What to Look For If You're Evaluating or Building One",
      contentAr: "ما الذي يجب البحث عنه عند تقييم أو بناء منصة كهذه",
      data: { level: 2 },
    },
    {
      type: "list",
      data: {
        ordered: true,
        itemsEn: [
          "Does the catalog reflect real, local store inventory — or a generic list copied from a big-city competitor?",
          "Is cash on delivery a first-class payment method, not a workaround?",
          "Can someone sign up and place an order without needing tech support?",
          "Is the driver/shopper role flexible enough to work at low order volume?",
          "Is Arabic the primary language the product was designed in, not a translation pass at the end?",
        ],
        itemsAr: [
          "هل يعكس الكتالوج مخزون محلات حقيقية ومحلية — أم قائمة عامة منسوخة من منافس في مدينة كبرى؟",
          "هل الدفع كاش عند الاستلام وسيلة دفع أساسية لا حلاً مؤقتاً؟",
          "هل يمكن لأي شخص التسجيل وتقديم طلب دون الحاجة لدعم فني؟",
          "هل دور السائق/المتسوق مرن بما يكفي للعمل حتى مع حجم طلبات منخفض؟",
          "هل العربية هي اللغة التي صُمم بها المنتج أصلاً، لا ترجمة أُضيفت في النهاية؟",
        ],
      },
    },
    {
      type: "callout",
      contentEn:
        "The single biggest predictor of adoption in these markets isn't the app's design — it's whether cash on delivery is genuinely supported end to end, from checkout to driver settlement.",
      contentAr:
        "أكبر عامل منفرد يحدد مدى تبني هذه المنصات في هذه الأسواق ليس تصميم التطبيق — بل ما إذا كان الدفع كاش عند الاستلام مدعوماً فعلياً من البداية للنهاية، من صفحة الدفع وحتى تسوية حساب السائق.",
      data: { variant: "info" },
    },
    {
      type: "paragraph",
      contentEn:
        "If you're weighing whether a platform like this pencils out for your town or region, it helps to run the numbers on the operational time and cost it would actually save.",
      contentAr:
        "إذا كنت تُقيّم ما إذا كانت منصة كهذه مجدية لمدينتك أو منطقتك، من المفيد حساب الوقت والتكلفة التشغيلية التي ستوفرها فعلياً.",
    },
    { type: "roi_embed", data: {} },
    {
      type: "cta",
      data: {
        labelEn: "Talk to us about your delivery idea",
        labelAr: "تحدث معنا عن فكرة التوصيل الخاصة بك",
        href: "/contact?source=article-delivery-a",
      },
    },
  ],
};

const articleB: SeedArticle = {
  title:
    "ba2olak: The Delivery Marketplace We Built for Egypt's Underserved Towns",
  titleAr: "بقولك: منصة التوصيل التي بنيناها للمدن غير المخدومة في مصر",
  slug: "ba2olak-delivery-marketplace-case-study",
  excerpt:
    "Grocery and market delivery in Egypt rarely reaches smaller towns. Here's how we built ba2olak — a bilingual, cash-on-delivery marketplace with one app for both customers and drivers — and what we learned shipping it.",
  excerptAr:
    "توصيل البقالة والسوق في مصر نادراً ما يصل إلى المدن الصغيرة. إليك كيف بنينا بقولك — منصة ثنائية اللغة تعتمد الدفع كاش عند الاستلام بتطبيق واحد للعملاء والسائقين معاً — وما تعلمناه من إطلاقها.",
  tags: ["Delivery", "Marketplace", "Case Study", "Egypt"],
  tagsAr: ["توصيل", "سوق إلكتروني", "دراسة حالة", "مصر"],
  blocks: [
    {
      type: "paragraph",
      contentEn:
        "Grocery and market delivery in Egypt has scaled fast in Cairo and Alexandria — but ask anyone living outside the major cities and you'll hear the same thing: none of the big delivery apps reach them. We set out to build a delivery marketplace specifically for the towns and neighborhoods that the existing players have left behind, launching it first in the areas where the need was clearest.",
      contentAr:
        "توسّع توصيل البقالة والسوق في مصر بسرعة كبيرة في القاهرة والإسكندرية — لكن اسأل أي شخص يعيش خارج المدن الكبرى وستسمع نفس الإجابة: لا يصل إليه أي من تطبيقات التوصيل الكبرى. انطلقنا لبناء منصة توصيل مخصصة للمدن والأحياء التي تجاهلتها المنصات الحالية، وأطلقناها أولاً في المناطق التي كانت الحاجة فيها أوضح.",
    },
    {
      type: "heading",
      contentEn: "The Problem: Delivery That Never Reaches These Neighborhoods",
      contentAr: "المشكلة: توصيل لا يصل أبداً لهذه الأحياء",
      data: { level: 2 },
    },
    {
      type: "paragraph",
      contentEn:
        "Grocery and market delivery in Egypt is concentrated in dense urban areas. Established delivery apps rarely reach smaller towns and remote neighborhoods, so residents there still walk between multiple stores, queue, and carry their purchases home themselves — the exact friction that delivery is supposed to remove, still fully present for a large share of the country.",
      contentAr:
        "خدمات توصيل البقالة والسوق في مصر مركّزة في المناطق الحضرية الكثيفة. تطبيقات التوصيل الكبرى نادراً ما تصل إلى المدن الصغيرة والأحياء النائية، فما زال سكانها يمشون بين عدة محلات، وينتظرون في الطوابير، ويحملون مشترياتهم بأنفسهم — وهو بالضبط العناء الذي من المفترض أن يزيله التوصيل، وما زال حاضراً بالكامل لشريحة كبيرة من سكان البلاد.",
    },
    {
      type: "heading",
      contentEn: "What We Built",
      contentAr: "ما الذي بنيناه",
      data: { level: 2 },
    },
    {
      type: "paragraph",
      contentEn:
        "ba2olak is a bilingual, Arabic-first web and mobile marketplace. A customer orders grocery and market items from their phone; a ba2olak driver shops for those exact items in real, local stores and delivers them to the door, cash on delivery. The product is deliberately built around the constraints of a new market rather than a scaled-down copy of a big-city app.",
      contentAr:
        "بقولك منصة ويب وموبايل ثنائية اللغة، عربية أولاً. يطلب العميل أصناف البقالة والسوق من هاتفه، ويقوم سائق بقولك بشراء هذه الأصناف تحديداً من محلات حقيقية ومحلية ويوصّلها حتى الباب، مع الدفع كاش عند الاستلام. المنتج مبني عمداً حول قيود سوق جديد، لا كنسخة مصغّرة من تطبيق مدينة كبرى.",
    },
    {
      type: "list",
      data: {
        ordered: false,
        itemsEn: [
          "One Expo app, two roles — the same app serves both the customer ordering flow and the driver fulfillment flow, so onboarding a new driver doesn't require a separate build.",
          "A crowd-sourced, AI-deduplicated catalog — instead of manually digitizing every store's inventory before launch, the catalog grows from what drivers and customers actually enter, with an AI pass catching duplicate and near-duplicate items so it stays clean as it scales.",
          "WhatsApp OTP authentication — no email/password form to fill in; verification happens over the messaging app almost everyone already has open.",
          "An admin dashboard for dispatch and catalog moderation — giving the team a single place to assign orders and keep the crowd-sourced catalog trustworthy.",
          "Bilingual from the ground up — Arabic is the primary language throughout the product, not a translated layer added after the English version shipped.",
        ],
        itemsAr: [
          "تطبيق واحد بـ Expo، بدورين — نفس التطبيق يخدم رحلة طلب العميل ورحلة تنفيذ السائق معاً، فلا يحتاج تسجيل سائق جديد لبناء منفصل.",
          "كتالوج يُبنى من مساهمات المستخدمين وينقّى بالذكاء الاصطناعي — بدلاً من رقمنة مخزون كل محل يدوياً قبل الإطلاق، يكبر الكتالوج مما يُدخله السائقون والعملاء فعلياً، مع مراجعة بالذكاء الاصطناعي تلتقط الأصناف المكررة أو شبه المكررة حتى يبقى نظيفاً كلما اتسع.",
          "مصادقة عبر واتساب OTP — بلا نموذج بريد إلكتروني وكلمة مرور؛ يتم التحقق عبر تطبيق المراسلة الذي يفتحه الجميع بالفعل.",
          "لوحة تحكم إدارية للتوزيع ومراجعة الكتالوج — تمنح الفريق مكاناً واحداً لتوزيع الطلبات والحفاظ على مصداقية الكتالوج التشاركي.",
          "ثنائية اللغة من الأساس — العربية هي اللغة الأساسية في المنتج بالكامل، لا طبقة ترجمة أُضيفت بعد إطلاق النسخة الإنجليزية.",
        ],
      },
    },
    {
      type: "heading",
      contentEn: "Design Decisions Worth Explaining",
      contentAr: "قرارات تصميم تستحق الشرح",
      data: { level: 2 },
    },
    {
      type: "paragraph",
      contentEn:
        "A few choices weren't obvious upfront. Making cash on delivery the default rather than an option meant rethinking how driver settlement and reconciliation work, since the money doesn't move digitally until the very last step. Letting one person be both shopper and driver kept the platform viable at low order volumes in a brand-new area — a dedicated shopper role only makes sense once demand is proven. And crowd-sourcing the catalog instead of building it centrally traded a slower, messier start for the ability to launch in a new town without months of manual data entry first — the AI deduplication pass exists specifically to make that trade-off safe.",
      contentAr:
        "بعض الخيارات لم تكن واضحة من البداية. جعل الدفع كاش عند الاستلام الخيار الافتراضي وليس الاستثناء تطلّب إعادة التفكير في كيفية تسوية حسابات السائقين، لأن الأموال لا تنتقل رقمياً إلا في الخطوة الأخيرة. السماح لشخص واحد بأن يكون المتسوق والسائق معاً حافظ على جدوى المنصة عند حجم طلبات منخفض في منطقة جديدة تماماً — دور متسوق مخصص لا يكون منطقياً إلا بعد إثبات الطلب. أما بناء الكتالوج بمساهمة المستخدمين بدلاً من بنائه مركزياً فقد استبدل بداية أبطأ وأقل ترتيباً بالقدرة على الإطلاق في مدينة جديدة دون شهور من إدخال البيانات يدوياً — وتحديداً لهذا وُجدت خطوة إزالة التكرار بالذكاء الاصطناعي، لجعل هذه المقايضة آمنة.",
    },
    {
      type: "heading",
      contentEn: "Where Things Stand",
      contentAr: "أين وصلنا",
      data: { level: 2 },
    },
    {
      type: "stats",
      data: {
        items: [
          {
            labelEn: "Platforms shipped",
            labelAr: "منصات تم إطلاقها",
            value: "Web + Mobile",
          },
          {
            labelEn: "Order status stages tracked",
            labelAr: "مراحل تتبع حالة الطلب",
            value: "6",
          },
          {
            labelEn: "Languages supported",
            labelAr: "اللغات المدعومة",
            value: "2",
          },
        ],
      },
    },
    {
      type: "callout",
      contentEn:
        "ba2olak has just launched. We'll update this page with real usage numbers — orders processed, drivers onboarded, delivery areas covered — as they come in, rather than publish projected figures now.",
      contentAr:
        "بقولك أُطلقت للتو. سنُحدّث هذه الصفحة بأرقام استخدام حقيقية — عدد الطلبات، السائقون المسجلون، مناطق التوصيل المغطاة — فور توفرها، بدلاً من نشر أرقام تقديرية الآن.",
      data: { variant: "info" },
    },
    {
      type: "heading",
      contentEn: "Lessons We're Taking Into the Next Build",
      contentAr: "دروس ننقلها إلى المشروع القادم",
      data: { level: 2 },
    },
    {
      type: "list",
      data: {
        ordered: true,
        itemsEn: [
          "Cash-first payment design has to be planned from the data model up, not retrofitted — driver settlement logic is much harder to bolt on afterward.",
          "A single flexible role (shopper + driver) is the right default for any new-market launch; specialize only once volume justifies it.",
          "Crowd-sourced data needs an automated cleanup pass from day one, or the catalog degrades faster than a small team can moderate it by hand.",
        ],
        itemsAr: [
          "يجب التخطيط لتصميم الدفع كاش من مستوى نموذج البيانات نفسه، لا إضافته لاحقاً — منطق تسوية حسابات السائقين أصعب بكثير عند إضافته بعد ذلك.",
          "دور واحد مرن (متسوق + سائق) هو الخيار الافتراضي الصحيح لأي إطلاق في سوق جديد؛ التخصص يأتي فقط بعد أن يبرره حجم الطلبات.",
          "البيانات التشاركية تحتاج خطوة تنظيف آلية من اليوم الأول، وإلا يتدهور الكتالوج أسرع مما يستطيع فريق صغير مراجعته يدوياً.",
        ],
      },
    },
    {
      type: "paragraph",
      contentEn:
        "If you're weighing whether a similar approach fits your own underserved market, [the perfect delivery experience](/blog/delivery-app-for-underserved-towns-egypt) breaks down the decisions in more general terms, and [the ba2olak case study](/work/ba2olak) has the full project detail.",
      contentAr:
        "إذا كنت تُقيّم ما إذا كان نهج مشابه يناسب سوقك غير المخدوم، فمقال [تجربة التوصيل المثالية](/blog/delivery-app-for-underserved-towns-egypt) يشرح القرارات بشكل أعم، وصفحة [دراسة حالة بقولك](/work/ba2olak) تحتوي على تفاصيل المشروع كاملة.",
    },
    {
      type: "cta",
      data: {
        labelEn: "Bring this to your town or business",
        labelAr: "اجعل هذا الحل متاحاً في مدينتك أو مشروعك",
        href: "/contact?source=article-delivery-b",
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

export async function seedDeliveryVerticalArticles() {
  await seedArticle(articleA);
  await seedArticle(articleB);
  console.log(
    "   Reminder: both articles are drafts. Review + add cover images/media in /blog-posts, then publish.",
  );
}
