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
  excerpt: string;
  excerptAr: string;
  authorName: string;
  authorNameAr: string;
  coverImageUrl: string;
  tags: string;
  tagsAr: string;
};

const emptyScalars: ScalarState = {
  title: "",
  titleAr: "",
  slug: "",
  excerpt: "",
  excerptAr: "",
  authorName: "Gateling Solutions",
  authorNameAr: "",
  coverImageUrl: "",
  tags: "",
  tagsAr: "",
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

export function BlogPostBlockEditor({ id }: { id: string }) {
  const isNew = id === "new";
  const { t } = useTranslation();
  const router = useRouter();
  const trpc = useTRPC();
  const qc = useQueryClient();
  const titleId = useId();
  const excerptId = useId();
  const titleArId = useId();
  const excerptArId = useId();
  const slugId = useId();
  const authorId = useId();
  const coverImageId = useId();
  const tagsId = useId();

  const { data: post } = useQuery({
    ...trpc.blogPosts.getById.queryOptions({ id }),
    enabled: !isNew,
  });

  const [scalars, setScalars] = useState<ScalarState>(emptyScalars);
  const [media, setMedia] = useState<GalleryItem[]>([]);
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [recordId, setRecordId] = useState<string | null>(isNew ? null : id);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    if (isNew || !post || hydrated.current) return;
    hydrated.current = true;
    setScalars({
      title: post.title,
      titleAr: post.titleAr ?? "",
      slug: post.slug,
      excerpt: post.excerpt,
      excerptAr: post.excerptAr ?? "",
      authorName: post.authorName,
      authorNameAr: post.authorNameAr ?? "",
      coverImageUrl: post.coverImageUrl ?? "",
      tags: (post.tags ?? []).join(", "),
      tagsAr: (post.tagsAr ?? []).join(", "),
    });
    setMedia(
      post.media.map((m) => ({
        id: m.id,
        type: m.type,
        url: m.url,
        title: m.title,
        isFeatured: m.isFeatured,
        isSecondary: m.isSecondary,
        sortOrder: m.sortOrder,
      })),
    );
    setBlocks(toEditorBlocks(post.blocks as BlockItemInput[] | undefined));
    setStatus(post.status === "published" ? "published" : "draft");
  }, [isNew, post]);

  const createMut = useMutation(trpc.blogPosts.create.mutationOptions());
  const updateMut = useMutation(trpc.blogPosts.update.mutationOptions());
  const publishMut = useMutation(trpc.blogPosts.publish.mutationOptions());
  const pending = createMut.isPending || updateMut.isPending;

  const buildPayload = useCallback(
    () => ({
      title: scalars.title,
      titleAr: scalars.titleAr || null,
      slug: scalars.slug,
      excerpt: scalars.excerpt,
      excerptAr: scalars.excerptAr || null,
      content: "",
      contentAr: null,
      coverImageUrl: scalars.coverImageUrl || null,
      authorName: scalars.authorName,
      authorNameAr: scalars.authorNameAr || null,
      tags: scalars.tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      tagsAr: scalars.tagsAr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
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
    [scalars, media, blocks],
  );

  const save = useCallback(
    async (silent: boolean) => {
      if (!scalars.title.trim() || !scalars.slug.trim()) return;
      const payload = buildPayload();
      try {
        if (recordId) {
          await updateMut.mutateAsync({ id: recordId, ...payload });
          if (!silent) toast.success(t("blogPosts.postUpdated"));
        } else {
          const created = await createMut.mutateAsync(payload);
          setRecordId(created.id);
          router.replace(`/blog-posts/${created.id}/edit`);
          if (!silent) toast.success(t("blogPosts.postCreated"));
        }
        setSavedAt(new Date());
        await qc.invalidateQueries({ queryKey: trpc.blogPosts.pathKey() });
      } catch {
        if (!silent) toast.error(t("blogPosts.postSaveFailed"));
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

  // Debounced autosave (~2s) whenever meaningful state changes. `save`
  // intentionally omitted from deps — it's rebuilt every render from the
  // same scalars/media/blocks already listed, so including it would just
  // duplicate this effect's trigger condition.
  // biome-ignore lint/correctness/useExhaustiveDependencies: save is derived from the listed deps
  useEffect(() => {
    if (!scalars.title.trim() || !scalars.slug.trim()) return;
    const timer = setTimeout(() => {
      void save(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [scalars, media, blocks]);

  async function handlePublish() {
    if (!recordId) {
      await save(true);
    }
    if (!recordId) return;
    try {
      await toast.promise(publishMut.mutateAsync({ id: recordId }), {
        loading: t("common.saving"),
        success: t("blogPosts.postPublished"),
        error: t("blogPosts.postSaveFailed"),
      });
      setStatus("published");
      await qc.invalidateQueries({ queryKey: trpc.blogPosts.pathKey() });
    } catch {
      /* surfaced by toast */
    }
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {isNew ? t("blogPosts.addPost") : t("blogPosts.editPost")}
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
              ? t("blogPosts.statusValues.published" as never)
              : t("blogPosts.statusValues.draft" as never)}
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
            {t("blogPosts.publishPost")}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
                    <FieldLabel htmlFor={titleId}>
                      {t("blogPosts.postTitle")}
                    </FieldLabel>
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
                  <Field>
                    <FieldLabel htmlFor={excerptId}>
                      {t("blogPosts.excerpt")}
                    </FieldLabel>
                    <Textarea
                      id={excerptId}
                      rows={3}
                      value={scalars.excerpt}
                      onChange={(e) =>
                        setScalars((s) => ({ ...s, excerpt: e.target.value }))
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
                    >{`${t("blogPosts.postTitle")} (AR)`}</FieldLabel>
                    <Input
                      id={titleArId}
                      value={scalars.titleAr}
                      onChange={(e) =>
                        setScalars((s) => ({ ...s, titleAr: e.target.value }))
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel
                      htmlFor={excerptArId}
                    >{`${t("blogPosts.excerpt")} (AR)`}</FieldLabel>
                    <Textarea
                      id={excerptArId}
                      rows={3}
                      value={scalars.excerptAr}
                      onChange={(e) =>
                        setScalars((s) => ({ ...s, excerptAr: e.target.value }))
                      }
                    />
                  </Field>
                </FieldGroup>
              </TabsContent>
            </Tabs>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={slugId}>{t("blogPosts.slug")}</FieldLabel>
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
                <FieldLabel htmlFor={authorId}>
                  {t("blogPosts.author")}
                </FieldLabel>
                <Input
                  id={authorId}
                  value={scalars.authorName}
                  onChange={(e) =>
                    setScalars((s) => ({ ...s, authorName: e.target.value }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={coverImageId}>
                  {t("blogPosts.coverImage")}
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
                <FieldLabel htmlFor={tagsId}>
                  {t("blogPosts.tags" as never)}
                </FieldLabel>
                <Input
                  id={tagsId}
                  value={scalars.tags}
                  onChange={(e) =>
                    setScalars((s) => ({ ...s, tags: e.target.value }))
                  }
                  placeholder="automation, saas"
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
