"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GlobeIcon, Loader2Icon, SaveIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import type { EditorBlock } from "@/components/forms/block-editor/block-defaults";
import { BlockListEditor } from "@/components/forms/block-editor/block-list-editor";
import { BlockLivePreview } from "@/components/forms/block-editor/block-live-preview";
import {
  type GalleryItem,
  GalleryManager,
} from "@/components/forms/gallery-manager";
import { BackLink } from "@/components/general/back-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/features/core/i18n/client";
import type { BlockItemInput } from "@/features/system/shared/content-blocks";
import { useTRPC } from "@/integrations/trpc/client";

type ScalarState = {
  title: string;
  titleAr: string;
  slug: string;
  client: string;
  clientAr: string;
  industry: string;
  industryAr: string;
  problemStatement: string;
  problemStatementAr: string;
  solution: string;
  solutionAr: string;
  resultsSummary: string;
  resultsArSummary: string;
  coverImageUrl: string;
  liveUrl: string;
  sortOrder: number;
};

const emptyScalars: ScalarState = {
  title: "",
  titleAr: "",
  slug: "",
  client: "",
  clientAr: "",
  industry: "",
  industryAr: "",
  problemStatement: "",
  problemStatementAr: "",
  solution: "",
  solutionAr: "",
  resultsSummary: "",
  resultsArSummary: "",
  coverImageUrl: "",
  liveUrl: "",
  sortOrder: 0,
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

function toEditorBlocks(blocks: BlockItemInput[] | undefined): EditorBlock[] {
  if (!blocks) return [];
  return blocks
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((b) => ({ ...b, data: (b.data ?? {}) as never }));
}

export function CaseStudyBlockEditor({ id }: { id: string }) {
  const isNew = id === "new";
  const { t } = useTranslation();
  const router = useRouter();
  const trpc = useTRPC();
  const qc = useQueryClient();
  const titleId = useId();
  const clientId = useId();
  const industryId = useId();
  const problemId = useId();
  const solutionId = useId();
  const resultsSummaryId = useId();
  const titleArId = useId();
  const clientArId = useId();
  const industryArId = useId();
  const problemArId = useId();
  const solutionArId = useId();
  const resultsSummaryArId = useId();
  const slugId = useId();
  const coverImageId = useId();
  const liveUrlId = useId();
  const sortOrderId = useId();

  const { data: caseStudy } = useQuery({
    ...trpc.caseStudies.getById.queryOptions({ id }),
    enabled: !isNew,
  });

  const [scalars, setScalars] = useState<ScalarState>(emptyScalars);
  const [media, setMedia] = useState<GalleryItem[]>([]);
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  const [status, setStatus] = useState<"draft" | "published" | "archived">(
    "draft",
  );
  const [recordId, setRecordId] = useState<string | null>(isNew ? null : id);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    if (isNew || !caseStudy || hydrated.current) return;
    hydrated.current = true;
    setScalars({
      title: caseStudy.title,
      titleAr: caseStudy.titleAr ?? "",
      slug: caseStudy.slug,
      client: caseStudy.client,
      clientAr: caseStudy.clientAr ?? "",
      industry: caseStudy.industry,
      industryAr: caseStudy.industryAr ?? "",
      problemStatement: caseStudy.problemStatement,
      problemStatementAr: caseStudy.problemStatementAr ?? "",
      solution: caseStudy.solution,
      solutionAr: caseStudy.solutionAr ?? "",
      resultsSummary: caseStudy.results.summary,
      resultsArSummary: caseStudy.resultsAr?.summary ?? "",
      coverImageUrl: caseStudy.coverImageUrl ?? "",
      liveUrl: caseStudy.liveUrl ?? "",
      sortOrder: caseStudy.sortOrder,
    });
    setMedia(
      caseStudy.media.map((m) => ({
        id: m.id,
        type: m.type,
        url: m.url,
        title: m.title,
        isFeatured: m.isFeatured,
        isSecondary: m.isSecondary,
        sortOrder: m.sortOrder,
      })),
    );
    setBlocks(toEditorBlocks(caseStudy.blocks as BlockItemInput[] | undefined));
    setStatus(
      caseStudy.status === "published" || caseStudy.status === "archived"
        ? caseStudy.status
        : "draft",
    );
  }, [isNew, caseStudy]);

  const createMut = useMutation(trpc.caseStudies.create.mutationOptions());
  const updateMut = useMutation(trpc.caseStudies.update.mutationOptions());
  const publishMut = useMutation(trpc.caseStudies.publish.mutationOptions());
  const pending = createMut.isPending || updateMut.isPending;

  const buildPayload = useCallback(
    () => ({
      title: scalars.title,
      titleAr: scalars.titleAr || null,
      slug: scalars.slug,
      client: scalars.client,
      clientAr: scalars.clientAr || null,
      industry: scalars.industry,
      industryAr: scalars.industryAr || null,
      problemStatement: scalars.problemStatement,
      problemStatementAr: scalars.problemStatementAr || null,
      solution: scalars.solution,
      solutionAr: scalars.solutionAr || null,
      results: {
        summary: scalars.resultsSummary,
        metrics: caseStudy?.results.metrics.length
          ? caseStudy.results.metrics
          : [{ label: "N/A", value: "N/A" }],
      },
      resultsAr: scalars.resultsArSummary
        ? {
          summary: scalars.resultsArSummary,
          metrics: caseStudy?.resultsAr?.metrics ?? [],
        }
        : null,
      coverImageUrl: scalars.coverImageUrl || null,
      liveUrl: scalars.liveUrl || null,
      sortOrder: scalars.sortOrder,
      media: media.map((m, i) => ({
        id: m.id,
        type: m.type,
        url: m.url,
        title: m.title ?? null,
        isFeatured: m.isFeatured,
        isSecondary: m.isSecondary,
        sortOrder: i,
      })),
      blocks: blocks.map((b, i) => ({ ...b, sortOrder: i })),
    }),
    [scalars, media, blocks, caseStudy],
  );

  const save = useCallback(
    async (silent: boolean) => {
      if (
        !scalars.title.trim() ||
        !scalars.slug.trim() ||
        !scalars.client.trim() ||
        !scalars.industry.trim() ||
        !scalars.problemStatement.trim() ||
        !scalars.solution.trim() ||
        !scalars.resultsSummary.trim()
      ) {
        return;
      }
      const payload = buildPayload();
      try {
        if (recordId) {
          await updateMut.mutateAsync({ id: recordId, ...payload });
          if (!silent) toast.success(t("work.workUpdated"));
        } else {
          const created = await createMut.mutateAsync(payload);
          setRecordId(created.id);
          router.replace(`/work-mgmt/${created.id}/edit`);
          if (!silent) toast.success(t("work.workCreated"));
        }
        setSavedAt(new Date());
        await qc.invalidateQueries({ queryKey: trpc.caseStudies.pathKey() });
      } catch {
        if (!silent) toast.error(t("work.workSaveFailed"));
      }
    },
    [
      scalars,
      buildPayload,
      recordId,
      updateMut,
      createMut,
      router,
      qc,
      trpc,
      t,
    ],
  );

  async function handlePublish() {
    if (!recordId) {
      await save(true);
    }
    if (!recordId) return;
    try {
      await toast.promise(publishMut.mutateAsync({ id: recordId }), {
        loading: t("common.saving"),
        success: t("work.workPublished"),
        error: t("work.workPublishFailed"),
      });
      setStatus("published");
      await qc.invalidateQueries({ queryKey: trpc.caseStudies.pathKey() });
    } catch {
      /* surfaced by toast */
    }
  }

  return (
    <div className="pb-16">
      <BackLink href="/work-mgmt" variant={"ghost"} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {isNew ? t("work.addWork") : t("work.editWork")}
          </h1>
          <p
            data-testid="autosave-status"
            className="text-xs text-muted-foreground"
          >
            {pending
              ? t("blocks.autosaving" as never)
              : savedAt
                ? (t as (key: string, args: Record<string, string>) => string)(
                  "blocks.autosavedAt",
                  { time: savedAt.toLocaleTimeString() },
                )
                : t("blocks.notSavedYet" as never)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status === "published" ? "default" : "secondary"}>
            {status === "published"
              ? t("work.statusValues.published" as never)
              : t("work.statusValues.draft" as never)}
          </Badge>
          <Button
            type="button"
            variant="outline"
            onClick={() => void save(false)}
            disabled={pending}
          >
            {pending ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <SaveIcon className="size-3.5" />
            )}
            {t("common.save")}
          </Button>
          <Button
            type="button"
            onClick={handlePublish}
            disabled={publishMut.isPending || status === "published"}
          >
            <GlobeIcon className="size-3.5" />
            {t("work.publishWork")}
          </Button>
        </div>
      </div>

      <div className="grid mt-4 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <FieldSet className="space-y-4 rounded-xl border p-4">
            <Tabs defaultValue="en">
              <TabsList>
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="ar">العربية</TabsTrigger>
              </TabsList>
              <TabsContent value="en">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor={titleId}>{t("work.name")}</FieldLabel>
                    <Input
                      id={titleId}
                      value={scalars.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        setScalars((s) => ({
                          ...s,
                          title,
                          slug: isNew ? slugify(title) : s.slug,
                        }));
                      }}
                    />
                  </Field>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor={clientId}>
                        {t("work.client")}
                      </FieldLabel>
                      <Input
                        id={clientId}
                        value={scalars.client}
                        onChange={(e) =>
                          setScalars((s) => ({ ...s, client: e.target.value }))
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={industryId}>
                        {t("work.industry")}
                      </FieldLabel>
                      <Input
                        id={industryId}
                        value={scalars.industry}
                        onChange={(e) =>
                          setScalars((s) => ({
                            ...s,
                            industry: e.target.value,
                          }))
                        }
                      />
                    </Field>
                  </FieldGroup>
                  <Field>
                    <FieldLabel htmlFor={problemId}>
                      {t("work.problem")}
                    </FieldLabel>
                    <Textarea
                      id={problemId}
                      rows={3}
                      value={scalars.problemStatement}
                      onChange={(e) =>
                        setScalars((s) => ({
                          ...s,
                          problemStatement: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={solutionId}>
                      {t("work.solution")}
                    </FieldLabel>
                    <Textarea
                      id={solutionId}
                      rows={3}
                      value={scalars.solution}
                      onChange={(e) =>
                        setScalars((s) => ({ ...s, solution: e.target.value }))
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={resultsSummaryId}>
                      {t("work.resultsSummary")}
                    </FieldLabel>
                    <Textarea
                      id={resultsSummaryId}
                      rows={2}
                      value={scalars.resultsSummary}
                      onChange={(e) =>
                        setScalars((s) => ({
                          ...s,
                          resultsSummary: e.target.value,
                        }))
                      }
                    />
                  </Field>
                </FieldGroup>
              </TabsContent>
              <TabsContent value="ar" dir="rtl">
                <FieldGroup>
                  <Field>
                    <FieldLabel
                      htmlFor={titleArId}
                    >{`${t("work.name")} (AR)`}</FieldLabel>
                    <Input
                      id={titleArId}
                      value={scalars.titleAr}
                      onChange={(e) =>
                        setScalars((s) => ({ ...s, titleAr: e.target.value }))
                      }
                    />
                  </Field>
                  <FieldGroup>
                    <Field>
                      <FieldLabel
                        htmlFor={clientArId}
                      >{`${t("work.client")} (AR)`}</FieldLabel>
                      <Input
                        id={clientArId}
                        value={scalars.clientAr}
                        onChange={(e) =>
                          setScalars((s) => ({
                            ...s,
                            clientAr: e.target.value,
                          }))
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel
                        htmlFor={industryArId}
                      >{`${t("work.industry")} (AR)`}</FieldLabel>
                      <Input
                        id={industryArId}
                        value={scalars.industryAr}
                        onChange={(e) =>
                          setScalars((s) => ({
                            ...s,
                            industryAr: e.target.value,
                          }))
                        }
                      />
                    </Field>
                  </FieldGroup>
                  <Field>
                    <FieldLabel
                      htmlFor={problemArId}
                    >{`${t("work.problem")} (AR)`}</FieldLabel>
                    <Textarea
                      id={problemArId}
                      rows={3}
                      value={scalars.problemStatementAr}
                      onChange={(e) =>
                        setScalars((s) => ({
                          ...s,
                          problemStatementAr: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel
                      htmlFor={solutionArId}
                    >{`${t("work.solution")} (AR)`}</FieldLabel>
                    <Textarea
                      id={solutionArId}
                      rows={3}
                      value={scalars.solutionAr}
                      onChange={(e) =>
                        setScalars((s) => ({
                          ...s,
                          solutionAr: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel
                      htmlFor={resultsSummaryArId}
                    >{`${t("work.resultsSummary")} (AR)`}</FieldLabel>
                    <Textarea
                      id={resultsSummaryArId}
                      rows={2}
                      value={scalars.resultsArSummary}
                      onChange={(e) =>
                        setScalars((s) => ({
                          ...s,
                          resultsArSummary: e.target.value,
                        }))
                      }
                    />
                  </Field>
                </FieldGroup>
              </TabsContent>
            </Tabs>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={slugId}>{t("work.slug")}</FieldLabel>
                <Input
                  id={slugId}
                  value={scalars.slug}
                  onChange={(e) =>
                    setScalars((s) => ({ ...s, slug: e.target.value }))
                  }
                  className="font-mono text-sm"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={coverImageId}>
                  {t("work.coverImage")}
                </FieldLabel>
                <Input
                  id={coverImageId}
                  value={scalars.coverImageUrl}
                  onChange={(e) =>
                    setScalars((s) => ({ ...s, coverImageUrl: e.target.value }))
                  }
                  placeholder="https://..."
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={liveUrlId}>Live App URL</FieldLabel>
                <Input
                  id={liveUrlId}
                  value={scalars.liveUrl}
                  onChange={(e) =>
                    setScalars((s) => ({ ...s, liveUrl: e.target.value }))
                  }
                  placeholder="https://myapp.gateling.com/"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={sortOrderId}>
                  {t("work.sortOrder")}
                </FieldLabel>
                <Input
                  id={sortOrderId}
                  type="number"
                  value={scalars.sortOrder}
                  onChange={(e) =>
                    setScalars((s) => ({
                      ...s,
                      sortOrder: Number(e.target.value) || 0,
                    }))
                  }
                />
              </Field>
            </FieldGroup>

            <GalleryManager
              value={media}
              onChange={setMedia}
              disabled={pending}
            />
          </FieldSet>

          <BlockListEditor
            blocks={blocks}
            onChange={setBlocks}
            disabled={pending}
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">
            {t("blocks.livePreview" as never)}
          </p>
          <BlockLivePreview blocks={blocks} />
        </div>
      </div>
    </div>
  );
}
