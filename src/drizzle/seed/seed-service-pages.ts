import { eq, isNull } from "drizzle-orm";

import { db } from "@/drizzle";
import { ServicesTable } from "@/drizzle/schema";

const SERVICE_CONTENT_ACTOR = "system:content-import";

/**
 * Long-form body copy for `/services/[slug]`, plus the three service rows the
 * SEO program's Phase 1 adds. Written as prose, not marketing filler — the page
 * exists to rank and to answer a buying question, and thin copy does neither.
 *
 * Paragraphs are separated by a blank line and split on render; `fullDescription`
 * is a `varchar(2048)`, so each entry must stay under that.
 */
type ServiceContent = {
  slug: string;
  fullDescription: string;
  fullDescriptionAr: string;
  /** Present only for rows this seed creates; existing rows are never rewritten. */
  create?: {
    title: string;
    titleAr: string;
    shortDescription: string;
    shortDescriptionAr: string;
    icon: string;
    features: string[];
    featuresAr: string[];
    sortOrder: number;
  };
};

const SERVICE_CONTENT: ServiceContent[] = [
  {
    slug: "custom-software-development",
    fullDescription: [
      "Off-the-shelf systems make you change how you work. A custom build does the opposite — it starts from the way your team already runs and removes the parts that waste time.",
      "We build business management systems end to end: the data model, the admin interface your staff uses every day, the reporting your managers need, and the integrations that connect it to what you already pay for. Everything ships bilingual English and Arabic with genuine RTL layout, works on the phones your team actually carries, and enforces who can see and change what.",
      "Typical builds are ERPs, booking and inventory systems, multi-branch operations platforms, and internal tools that replace a stack of spreadsheets and WhatsApp threads. Most reach production in six to twelve weeks, delivered in phases, so you have something usable long before the full scope is finished.",
      "You own the code and the data. There is no per-seat licence, no forced upgrade cycle, and no vendor deciding your roadmap.",
    ].join("\n\n"),
    fullDescriptionAr: [
      "الأنظمة الجاهزة تجبرك على تغيير طريقة عملك. البناء المخصص يفعل العكس تماماً — يبدأ من الطريقة التي يعمل بها فريقك بالفعل ويزيل الأجزاء التي تهدر الوقت.",
      "نبني أنظمة إدارة الأعمال من البداية إلى النهاية: نموذج البيانات، وواجهة الإدارة التي يستخدمها موظفوك يومياً، والتقارير التي يحتاجها مديروك، والتكاملات التي تربط النظام بما تدفع مقابله بالفعل. كل شيء يُسلَّم ثنائي اللغة عربي وإنجليزي بتخطيط عربي حقيقي من اليمين لليسار، ويعمل على الهواتف التي يحملها فريقك فعلاً، ويفرض من يرى ومن يعدّل ماذا.",
      "أكثر ما نبنيه: أنظمة تخطيط موارد المؤسسات، وأنظمة الحجز والمخزون، ومنصات تشغيل متعددة الفروع، وأدوات داخلية تحل محل أكوام من ملفات إكسل ومحادثات واتساب. معظم المشاريع تصل إلى الإنتاج خلال ستة إلى اثني عشر أسبوعاً، وتُسلَّم على مراحل، فتحصل على شيء قابل للاستخدام قبل اكتمال النطاق الكامل بوقت طويل.",
      "الكود والبيانات ملكك أنت. لا رسوم لكل مستخدم، ولا دورة ترقية إجبارية، ولا مورّد يقرر خارطة طريقك.",
    ].join("\n\n"),
  },
  {
    slug: "business-process-automation",
    fullDescription: [
      "Manual work is expensive twice: the hours it consumes, and the errors it introduces. Automation is usually the cheapest improvement a business can make, because the process already exists — it just runs on people instead of software.",
      "We start by mapping the workflow as it actually happens, not as the org chart describes it. Then we automate the parts that are repetitive and rule-driven: order and receipt generation, status notifications to staff and customers, approval chains, recurring reports, data that gets re-typed from one system into another, and scheduled jobs that run overnight without anyone remembering to start them.",
      "The work is incremental by design. We automate the single most painful step first, measure what it saved, then move to the next — so the investment starts paying for itself while the rest is still being built.",
      "On the workflows we touch, clients typically cut manual admin time by 60–80%, with fewer dropped handoffs and a clear audit trail of what happened, when, and who approved it.",
    ].join("\n\n"),
    fullDescriptionAr: [
      "العمل اليدوي مكلف مرتين: الساعات التي يستهلكها، والأخطاء التي يسببها. الأتمتة عادةً أرخص تحسين يمكن لأي شركة أن تقوم به، لأن العملية موجودة بالفعل — لكنها تعمل بالبشر بدلاً من البرمجيات.",
      "نبدأ برسم خريطة سير العمل كما يحدث فعلاً، لا كما يصفه الهيكل التنظيمي. ثم نؤتمت الأجزاء المتكررة والمحكومة بقواعد واضحة: إصدار الطلبات والإيصالات، وإشعارات الحالة للموظفين والعملاء، وسلاسل الموافقات، والتقارير الدورية، والبيانات التي يُعاد إدخالها من نظام إلى آخر، والمهام المجدولة التي تعمل ليلاً دون أن يتذكر أحد تشغيلها.",
      "العمل تدريجي بشكل مقصود. نؤتمت أكثر خطوة مؤلمة أولاً، ونقيس ما وفّرته، ثم ننتقل إلى التالية — فيبدأ الاستثمار في تغطية تكلفته بينما ما زال الباقي قيد التنفيذ.",
      "في المسارات التي نعمل عليها، يخفض عملاؤنا عادةً وقت العمل الإداري اليدوي بنسبة 60–80%، مع تسليمات أقل ضياعاً وسجل تدقيق واضح لما حدث ومتى ومن وافق عليه.",
    ].join("\n\n"),
  },
  {
    slug: "ai-integration",
    fullDescription: [
      "AI is only useful when it is wired into a process someone actually runs. We integrate it where it removes a specific task — not as a feature to advertise.",
      "In practice that means text-to-speech announcements that call customers by name without a staff member on a microphone; smart scheduling that fills the gaps in a booking calendar; document and invoice extraction that turns a photo into structured data; classification that routes incoming leads and messages to the right person; and forecasting built on your own historical numbers rather than a generic model.",
      "We build on established providers rather than training models from scratch, which keeps cost predictable and time-to-value measured in weeks. Every integration has a defined fallback: if the model is unavailable or returns something unusable, the process continues manually instead of stopping.",
      "We will also tell you when AI is the wrong tool. A good share of problems described as AI problems are solved better, cheaper, and far more reliably by a rule and a database index.",
    ].join("\n\n"),
    fullDescriptionAr: [
      "الذكاء الاصطناعي لا يكون مفيداً إلا حين يُدمج داخل عملية يقوم بها شخص فعلاً. ندمجه حيث يزيل مهمة محددة — لا كميزة للدعاية.",
      "عملياً يعني ذلك: إعلانات صوتية تنادي العملاء بأسمائهم دون أن يقف موظف أمام ميكروفون؛ وجدولة ذكية تملأ الفجوات في تقويم الحجوزات؛ واستخراج بيانات المستندات والفواتير الذي يحوّل صورة إلى بيانات منظمة؛ وتصنيف يوجّه العملاء المحتملين والرسائل الواردة إلى الشخص المناسب؛ وتنبؤات مبنية على أرقامك التاريخية أنت لا على نموذج عام.",
      "نبني على مزودين راسخين بدلاً من تدريب النماذج من الصفر، ما يبقي التكلفة قابلة للتوقع وزمن الاستفادة بالأسابيع. ولكل تكامل مسار احتياطي محدد: إذا كان النموذج غير متاح أو أعاد نتيجة غير صالحة، تستمر العملية يدوياً بدلاً من أن تتوقف.",
      "وسنخبرك أيضاً حين يكون الذكاء الاصطناعي هو الأداة الخاطئة. نسبة كبيرة من المشكلات التي تُوصف بأنها مشكلات ذكاء اصطناعي تُحل بشكل أفضل وأرخص وأكثر موثوقية بقاعدة بسيطة وفهرس في قاعدة البيانات.",
    ].join("\n\n"),
  },
  {
    slug: "digital-transformation-consulting",
    fullDescription: [
      "Most digital transformation fails at the same point: a tool gets bought before anyone agrees on the problem. We start at the other end.",
      "An engagement begins with an audit of how work actually moves through your business today — the systems, the spreadsheets, the messages, and the steps that exist only in one person's head. We quantify where time and money leak, then rank the fixes by return rather than by how modern they sound.",
      "What you get is a roadmap you can act on with or without us: a current-state map, a prioritised list of changes with effort and expected saving on each, a technology recommendation that includes where your existing tools are fine and should be kept, and a sequencing plan that avoids halting operations during the change.",
      "We also handle the part most consultants skip — team training and handover — so the new way of working survives after the project ends. This is the right starting point if you know something is wrong but not yet what to build.",
    ].join("\n\n"),
    fullDescriptionAr: [
      "معظم مشاريع التحول الرقمي تفشل عند النقطة نفسها: تُشترى الأداة قبل أن يتفق أحد على المشكلة. نحن نبدأ من الطرف الآخر.",
      "يبدأ التعاون بمراجعة لكيفية سير العمل فعلياً في شركتك اليوم — الأنظمة، وملفات إكسل، والرسائل، والخطوات الموجودة في رأس شخص واحد فقط. نقيس أين يتسرب الوقت والمال، ثم نرتب الحلول حسب العائد لا حسب حداثتها.",
      "ما تحصل عليه خارطة طريق يمكنك تنفيذها معنا أو بدوننا: خريطة للوضع الحالي، وقائمة مرتبة بالأولوية للتغييرات مع الجهد والتوفير المتوقع لكل منها، وتوصية تقنية تشمل تحديد الأدوات الحالية الجيدة التي يجب الإبقاء عليها، وخطة تسلسل تتجنب توقف العمليات أثناء التغيير.",
      "ونتولى كذلك الجزء الذي يتخطاه معظم الاستشاريين — تدريب الفريق والتسليم — كي تبقى طريقة العمل الجديدة بعد انتهاء المشروع. هذه هي نقطة البداية الصحيحة إذا كنت تعرف أن هناك خللاً لكنك لا تعرف بعد ما الذي يجب بناؤه.",
    ].join("\n\n"),
  },
  {
    slug: "web-app-development",
    create: {
      title: "Web App Development",
      titleAr: "تطوير تطبيقات الويب",
      shortDescription:
        "Fast, bilingual web applications your customers and your staff can open on any device.",
      shortDescriptionAr:
        "تطبيقات ويب سريعة وثنائية اللغة يفتحها عملاؤك وموظفوك من أي جهاز.",
      icon: "Globe",
      features: [
        "Bilingual EN + AR with full RTL layout",
        "Installable as an app — no app store required",
        "Built for mid-range phones and slow connections",
        "Search-engine visible from day one",
      ],
      featuresAr: [
        "ثنائي اللغة عربي + إنجليزي بتخطيط كامل من اليمين لليسار",
        "قابل للتثبيت كتطبيق — دون الحاجة لمتجر تطبيقات",
        "مبني للهواتف المتوسطة والاتصالات البطيئة",
        "ظاهر في محركات البحث من اليوم الأول",
      ],
      sortOrder: 4,
    },
    fullDescription: [
      "A web app reaches every device without an app-store review, an install, or a separate build per platform. For most businesses in Egypt and MENA it is the fastest route to something customers will actually use.",
      "We build customer-facing products and internal applications on the same stack we run our own systems on: React and Next.js on the front, a typed API and PostgreSQL behind it, deployed on infrastructure that scales without a rewrite. Everything is bilingual English/Arabic with genuine RTL layout, responsive down to the phones your customers actually own, and fast on a 3G connection.",
      "Typical builds: marketplaces, booking and ordering flows, customer portals, multi-tenant SaaS products, and progressive web apps that install to the home screen and keep working offline.",
      "We handle the whole path — design, build, deployment, monitoring, and the first rounds of iteration after launch based on what real usage shows rather than what the plan assumed.",
    ].join("\n\n"),
    fullDescriptionAr: [
      "تطبيق الويب يصل إلى كل جهاز دون مراجعة من متجر التطبيقات، ودون تثبيت، ودون نسخة منفصلة لكل نظام. ولمعظم الشركات في مصر والشرق الأوسط هو أسرع طريق إلى منتج يستخدمه العملاء فعلاً.",
      "نبني المنتجات الموجهة للعملاء والتطبيقات الداخلية على نفس التقنيات التي نشغّل بها أنظمتنا: React وNext.js في الواجهة، وواجهة برمجية مُحكمة الأنواع مع PostgreSQL خلفها، منشورة على بنية تحتية تتوسع دون إعادة كتابة. كل شيء ثنائي اللغة عربي/إنجليزي بتخطيط عربي حقيقي، ومتجاوب حتى الهواتف التي يملكها عملاؤك فعلاً، وسريع على شبكة الجيل الثالث.",
      "أكثر ما نبنيه: الأسواق الإلكترونية، ومسارات الحجز والطلب، وبوابات العملاء، ومنتجات SaaS متعددة المستأجرين، وتطبيقات ويب تقدمية تُثبَّت على الشاشة الرئيسية وتستمر في العمل دون إنترنت.",
      "نتولى المسار كاملاً — التصميم والبناء والنشر والمراقبة وأول دورات التحسين بعد الإطلاق بناءً على ما يظهره الاستخدام الحقيقي لا ما افترضته الخطة.",
    ].join("\n\n"),
  },
  {
    slug: "dashboards-and-reporting",
    create: {
      title: "Dashboards & Reporting",
      titleAr: "لوحات المعلومات والتقارير",
      shortDescription:
        "Turn the data you already collect into numbers your team acts on the same day.",
      shortDescriptionAr:
        "حوّل البيانات التي تجمعها بالفعل إلى أرقام يتصرف فريقك بناءً عليها في نفس اليوم.",
      icon: "LayoutDashboard",
      features: [
        "Live data instead of month-end snapshots",
        "Role-scoped views per branch and per user",
        "Scheduled reports by email and WhatsApp",
        "Threshold alerts on the numbers that matter",
      ],
      featuresAr: [
        "بيانات حية بدلاً من لقطات نهاية الشهر",
        "عروض محددة الصلاحيات لكل فرع ولكل مستخدم",
        "تقارير مجدولة عبر البريد الإلكتروني وواتساب",
        "تنبيهات عند تجاوز الحدود على الأرقام المهمة",
      ],
      sortOrder: 5,
    },
    fullDescription: [
      "Most businesses already have the data. What they lack is a view of it that someone checks before making a decision — so the numbers get assembled by hand, once a month, and are stale by the time anyone reads them.",
      "We build live dashboards on top of the systems you already run: revenue by branch, product, or channel; operational throughput and where it bottlenecks; staff performance; inventory movement and stock risk; and cash position. Each view is scoped by role, so a branch manager sees their branch and the owner sees everything.",
      "Where the data is spread across several places — a POS here, a spreadsheet there, an accounting package that only exports CSV — we consolidate it first and report on the consolidated set, rather than asking anyone to reconcile by hand.",
      "Reports can be scheduled and delivered automatically by email or WhatsApp, and alerts fire when a number crosses a threshold you set, so a problem surfaces the same day instead of at month end.",
    ].join("\n\n"),
    fullDescriptionAr: [
      "معظم الشركات تمتلك البيانات بالفعل. ما ينقصها هو عرض لها يطّلع عليه أحد قبل اتخاذ القرار — فتُجمَّع الأرقام يدوياً مرة كل شهر، وتكون قديمة بحلول موعد قراءتها.",
      "نبني لوحات معلومات حية فوق الأنظمة التي تشغّلها بالفعل: الإيرادات حسب الفرع أو المنتج أو القناة؛ ومعدل الإنجاز التشغيلي وأين يختنق؛ وأداء الموظفين؛ وحركة المخزون ومخاطر النفاد؛ والوضع النقدي. كل عرض محدد حسب الدور، فيرى مدير الفرع فرعه ويرى المالك كل شيء.",
      "وحين تكون البيانات موزعة في أماكن عدة — نقطة بيع هنا، وملف إكسل هناك، وبرنامج محاسبة لا يصدّر إلا CSV — نوحّدها أولاً ونصدر التقارير من المجموعة الموحدة، بدلاً من مطالبة أحد بمطابقتها يدوياً.",
      "يمكن جدولة التقارير وتسليمها تلقائياً عبر البريد الإلكتروني أو واتساب، وتنطلق التنبيهات عند تجاوز رقم للحد الذي تحدده، فتظهر المشكلة في نفس اليوم بدلاً من نهاية الشهر.",
    ].join("\n\n"),
  },
  {
    slug: "system-integrations",
    create: {
      title: "System Integrations",
      titleAr: "تكامل الأنظمة",
      shortDescription:
        "Connect the systems you already run so the same data stops being re-typed between them.",
      shortDescriptionAr:
        "اربط الأنظمة التي تشغّلها بالفعل حتى تتوقف إعادة إدخال البيانات نفسها بينها.",
      icon: "RefreshCw",
      features: [
        "Two-way sync with retries and queueing",
        "Payment gateways: Paymob, Fawry, Stripe",
        "Egyptian e-invoicing (ETA) submission",
        "Works with legacy systems that have no API",
      ],
      featuresAr: [
        "مزامنة ثنائية الاتجاه مع إعادة المحاولة والانتظار في الطابور",
        "بوابات الدفع: باي موب، فوري، Stripe",
        "إرسال الفاتورة الإلكترونية المصرية (مصلحة الضرائب)",
        "يعمل مع الأنظمة القديمة التي لا تملك واجهة برمجية",
      ],
      sortOrder: 6,
    },
    fullDescription: [
      "Re-typing the same order into two systems is not a data-entry problem — it is an integration problem, and it is where a surprising share of operational errors begins.",
      "We connect the tools you already pay for so information moves once, automatically: point of sale to accounting, e-commerce to inventory, CRM to the booking system, payment gateways such as Paymob, Fawry and Stripe to your order flow, WhatsApp Business and SMS to your notifications, and Egypt's e-invoicing portal to your billing.",
      "Where a system has no usable API, we work with what exists — scheduled file exports, database replication, or a thin service wrapped around the legacy system — instead of telling you to replace something that still does its job.",
      "Every integration is built to survive failure: retries with backoff, a queue that holds work while the other side is down, idempotent writes so a retry cannot double-charge or double-book, and logging that shows exactly which record failed and why.",
    ].join("\n\n"),
    fullDescriptionAr: [
      "إعادة إدخال الطلب نفسه في نظامين ليست مشكلة إدخال بيانات — إنها مشكلة تكامل، ومنها تبدأ نسبة كبيرة من الأخطاء التشغيلية.",
      "نربط الأدوات التي تدفع مقابلها بالفعل حتى تنتقل المعلومة مرة واحدة وتلقائياً: من نقطة البيع إلى المحاسبة، ومن المتجر الإلكتروني إلى المخزون، ومن إدارة العملاء إلى نظام الحجز، ومن بوابات الدفع مثل باي موب وفوري وStripe إلى مسار الطلبات، ومن واتساب للأعمال والرسائل النصية إلى إشعاراتك، ومن منظومة الفاتورة الإلكترونية المصرية إلى فوترتك.",
      "وحين لا يملك نظام واجهة برمجية صالحة، نعمل بما هو متاح — تصدير ملفات مجدول، أو نسخ متماثل لقاعدة البيانات، أو خدمة رفيعة تغلّف النظام القديم — بدلاً من مطالبتك باستبدال شيء ما زال يؤدي عمله.",
      "كل تكامل مبني ليتحمل الأعطال: إعادة محاولة بفواصل متزايدة، وطابور يحتفظ بالعمل أثناء تعطل الطرف الآخر، وكتابة لا تتكرر أثرها حتى لا تؤدي إعادة المحاولة إلى خصم مزدوج أو حجز مزدوج، وسجلات تُظهر بالضبط أي سجل فشل ولماذا.",
    ].join("\n\n"),
  },
];

/**
 * Backfills long-form copy for `/services/[slug]` and adds the three service
 * rows introduced in Phase 1 of the SEO program.
 *
 * Idempotent, and deliberately conservative about what it overwrites:
 *
 * - Existing rows: only `fullDescription` / `fullDescriptionAr` are written, and
 *   only while they are still NULL. Re-running never clobbers copy an admin has
 *   since edited through the CMS.
 * - New rows: inserted only when the slug is absent.
 */
export async function seedServicePages(): Promise<void> {
  let created = 0;
  let backfilled = 0;
  let skipped = 0;

  for (const entry of SERVICE_CONTENT) {
    const existing = await db.query.ServicesTable.findFirst({
      where: eq(ServicesTable.slug, entry.slug),
      columns: { id: true, fullDescription: true, fullDescriptionAr: true },
    });

    if (!existing) {
      if (!entry.create) {
        console.warn(
          `⚠️  "${entry.slug}" is missing from the database and this seed has ` +
            `no row definition for it — skipping. Expected it to already exist.`,
        );
        skipped++;
        continue;
      }
      await db.insert(ServicesTable).values({
        slug: entry.slug,
        ...entry.create,
        fullDescription: entry.fullDescription,
        fullDescriptionAr: entry.fullDescriptionAr,
        isActive: true,
        createdBy: SERVICE_CONTENT_ACTOR,
      });
      console.log(`✅ Created service "${entry.slug}".`);
      created++;
      continue;
    }

    if (
      existing.fullDescription != null &&
      existing.fullDescriptionAr != null
    ) {
      console.log(
        `↩️  "${entry.slug}" already has long-form copy — leaving it alone.`,
      );
      skipped++;
      continue;
    }

    await db
      .update(ServicesTable)
      .set({
        ...(existing.fullDescription == null
          ? { fullDescription: entry.fullDescription }
          : {}),
        ...(existing.fullDescriptionAr == null
          ? { fullDescriptionAr: entry.fullDescriptionAr }
          : {}),
        updatedBy: SERVICE_CONTENT_ACTOR,
      })
      .where(eq(ServicesTable.id, existing.id));
    console.log(`✅ Backfilled long-form copy for "${entry.slug}".`);
    backfilled++;
  }

  const orphans = await db.query.ServicesTable.findMany({
    where: isNull(ServicesTable.deletedAt),
    columns: { slug: true, fullDescription: true },
  });
  for (const row of orphans) {
    if (row.fullDescription == null) {
      console.warn(
        `⚠️  Service "${row.slug}" still has no fullDescription — its detail ` +
          `page will render short. Add copy through the admin CMS.`,
      );
    }
  }

  console.log(
    `\nService pages seed: ${created} created, ${backfilled} backfilled, ${skipped} skipped.`,
  );
}
