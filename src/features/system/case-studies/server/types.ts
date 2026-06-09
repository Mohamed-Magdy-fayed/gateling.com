import type { CaseStudy, CaseStudyResults } from "@/drizzle/schema";

export type CaseStudyRow = Pick<
  CaseStudy,
  | "id"
  | "title"
  | "titleAr"
  | "slug"
  | "client"
  | "clientAr"
  | "industry"
  | "industryAr"
  | "problemStatement"
  | "problemStatementAr"
  | "solution"
  | "solutionAr"
  | "status"
  | "publishedAt"
  | "sortOrder"
  | "coverImageUrl"
  | "liveUrl"
  | "createdAt"
  | "updatedAt"
> & { results: CaseStudyResults; resultsAr: CaseStudyResults | null };

export type CaseStudyDetail = CaseStudy;
