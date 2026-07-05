import { and, eq, isNull, max } from "drizzle-orm";

import { db } from "@/drizzle";
import {
  CaseStudiesTable,
  type CaseStudyResults,
} from "@/drizzle/schema";

const CONTENT_IMPORT_ACTOR = "system:content-import";

const results: CaseStudyResults = {
  metrics: [
    { label: "Platforms shipped", value: "Web + Mobile" },
    { label: "Order status stages tracked", value: "6" },
    { label: "Languages supported", value: "2" },
  ],
  summary:
    "TODO: replace with real launch metrics before publishing (orders processed, drivers onboarded, delivery areas covered).",
};

const resultsAr: CaseStudyResults = {
  metrics: [
    { label: "منصات تم إطلاقها", value: "ويب + موبايل" },
    { label: "مراحل تتبع حالة الطلب", value: "6" },
    { label: "اللغات المدعومة", value: "2" },
  ],
  summary:
    "TODO: استبدل هذا بمقاييس الإطلاق الفعلية قبل النشر (عدد الطلبات، السائقون المسجلون، مناطق التوصيل المغطاة).",
};

export async function seedBa2olakCaseStudy() {
  const slug = "ba2olak";

  const existing = await db.query.CaseStudiesTable.findFirst({
    columns: { id: true },
    where: and(
      eq(CaseStudiesTable.slug, slug),
      isNull(CaseStudiesTable.deletedAt),
    ),
  });
  if (existing) {
    console.log(`↷ Case study "${slug}" already exists (id: ${existing.id}), skipping.`);
    return existing;
  }

  const [{ nextSortOrder }] = await db
    .select({ nextSortOrder: max(CaseStudiesTable.sortOrder) })
    .from(CaseStudiesTable);

  const [row] = await db
    .insert(CaseStudiesTable)
    .values({
      title: "ba2olak: A Delivery Marketplace for Egypt's Underserved Areas",
      titleAr: "بقولك: منصة توصيل للمناطق غير المخدومة في مصر",
      slug,
      // TODO: replace with the real client/company name before publishing.
      client: "ba2olak",
      clientAr: "بقولك",
      industry: "Delivery / Marketplace",
      industryAr: "توصيل / سوق إلكتروني",
      problemStatement:
        "Grocery and market delivery in Egypt is concentrated in dense urban areas — established delivery apps rarely reach smaller towns and remote neighborhoods, so residents there still have to walk to multiple stores, queue, and carry goods home themselves.",
      problemStatementAr:
        "خدمات توصيل البقالة والسوق في مصر مركّزة في المناطق الحضرية الكثيفة — تطبيقات التوصيل الكبرى نادراً ما تصل إلى المدن الصغيرة والأحياء النائية، فما زال سكانها مضطرين للمشي بين عدة محلات والانتظار في الطوابير وحمل مشترياتهم بأنفسهم.",
      solution:
        "Built a bilingual (Arabic-first) web + mobile marketplace where customers order grocery and market items from their phone and a ba2olak driver shops for the items in real stores and delivers to the door, cash on delivery. One Expo app serves both customer ordering and driver fulfillment roles, backed by a crowd-sourced, AI-deduplicated bilingual catalog, WhatsApp OTP auth, and an admin dashboard for dispatch and catalog moderation.",
      solutionAr:
        "بناء منصة ويب وموبايل ثنائية اللغة (عربي أولاً) يطلب من خلالها العميل أصناف البقالة والسوق من هاتفه، ويقوم سائق بقولك بشراء الأصناف من محلات حقيقية وتوصيلها للباب، مع الدفع كاش عند الاستلام. تطبيق واحد مبني بـ Expo يخدم كلاً من دور العميل ودور السائق، مدعوماً بكتالوج ثنائي اللغة يُبنى من مساهمات المستخدمين ويُنقّى بالذكاء الاصطناعي، ومصادقة عبر واتساب OTP، ولوحة تحكم إدارية لتوزيع الطلبات ومراجعة الكتالوج.",
      // TODO: confirm this is the correct production URL before publishing.
      liveUrl: "https://ba2olak.gateling.com",
      results,
      resultsAr,
      status: "draft",
      sortOrder: (nextSortOrder ?? -1) + 1,
      createdBy: CONTENT_IMPORT_ACTOR,
    })
    .returning({ id: CaseStudiesTable.id, slug: CaseStudiesTable.slug });

  console.log(`✅ Inserted draft case study "${row.slug}" (id: ${row.id}).`);
  console.log(
    "   Reminder: fill in the real client name and launch metrics, then publish from /work-mgmt.",
  );
  return row;
}
