"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, SaveIcon, XIcon } from "lucide-react";
import type { FormEvent } from "react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
  type GalleryItem,
  GalleryManager,
} from "@/components/forms/gallery-manager";
import { useAppForm } from "@/components/forms/hooks";
import {
  OverlayFormBody,
  OverlayFormFooterActions,
  OverlayFormSubmitButton,
} from "@/components/forms/overlay-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";
import type { BlogPostRow } from "@/integrations/trpc/routers/blog-posts";

const formSchema = z.object({
  title: z.string().trim().min(1).max(255),
  titleAr: z.string().trim().max(255).optional().nullable(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/),
  excerpt: z.string().trim().min(1).max(512),
  excerptAr: z.string().trim().max(512).optional().nullable(),
  content: z.string().trim().min(1),
  contentAr: z.string().trim().optional().nullable(),
  authorName: z.string().trim().min(1).max(255),
  coverImageUrl: z.string().max(1024).optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

type Props = {
  post?: BlogPostRow | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

export function BlogPostFormDialog({ post, onOpenChange, open }: Props) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const qc = useQueryClient();
  const formId = useId();
  const isEdit = post != null;

  const [media, setMedia] = useState<GalleryItem[]>([]);

  const { data: postDetail } = useQuery({
    ...trpc.blogPosts.getById.queryOptions({ id: post?.id ?? "" }),
    enabled: open && isEdit && !!post?.id,
  });

  useEffect(() => {
    if (postDetail?.media) {
      setMedia(
        postDetail.media.map((m) => ({
          id: m.id,
          type: m.type,
          url: m.url,
          title: m.title,
          isFeatured: m.isFeatured,
          isSecondary: m.isSecondary,
          sortOrder: m.sortOrder,
        })),
      );
    }
  }, [postDetail]);

  const createMut = useMutation(trpc.blogPosts.create.mutationOptions());
  const updateMut = useMutation(trpc.blogPosts.update.mutationOptions());
  const pending = createMut.isPending || updateMut.isPending;

  const defaultValues = useMemo<FormValues>(
    () => ({
      title: "",
      titleAr: null,
      slug: "",
      excerpt: "",
      excerptAr: null,
      content: "",
      contentAr: null,
      authorName: "Gateling Solutions",
      coverImageUrl: null,
    }),
    [],
  );

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      try {
        const payload = {
          ...value,
          titleAr: value.titleAr || null,
          excerptAr: value.excerptAr || null,
          contentAr: value.contentAr || null,
          coverImageUrl: value.coverImageUrl || null,
          media: media.map((m, i) => ({
            id: m.id,
            type: m.type,
            url: m.url,
            title: m.title ?? null,
            isFeatured: m.isFeatured,
            isSecondary: m.isSecondary,
            sortOrder: i,
          })),
        };
        if (isEdit && post) {
          await toast
            .promise(updateMut.mutateAsync({ id: post.id, ...payload }), {
              loading: t("common.saving"),
              success: t("blogPosts.postUpdated"),
              error: t("blogPosts.postSaveFailed"),
            })
            .unwrap();
        } else {
          await toast
            .promise(createMut.mutateAsync(payload), {
              loading: t("common.saving"),
              success: t("blogPosts.postCreated"),
              error: t("blogPosts.postSaveFailed"),
            })
            .unwrap();
        }
        await qc.invalidateQueries({ queryKey: trpc.blogPosts.pathKey() });
        onOpenChange(false);
      } catch {
        /* surfaced */
      }
    },
  });

  const resetToPost = useCallback(() => {
    if (!post) return;
    form.reset(
      {
        title: post.title,
        titleAr: post.titleAr ?? null,
        slug: post.slug,
        excerpt: post.excerpt,
        excerptAr: post.excerptAr ?? null,
        content: "",
        contentAr: post.contentAr ?? null,
        authorName: post.authorName,
        coverImageUrl: post.coverImageUrl ?? null,
      },
      { keepDefaultValues: true },
    );
  }, [post, form]);

  useEffect(() => {
    if (open && isEdit && post) {
      resetToPost();
    } else if (open && !isEdit) {
      form.reset(defaultValues);
      setMedia([]);
    }
  }, [open, isEdit, post, resetToPost, form, defaultValues]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();
    void form.handleSubmit();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] max-w-2xl flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>
            {t(isEdit ? "blogPosts.editPost" : "blogPosts.addPost")}
          </DialogTitle>
          <DialogDescription>
            {String(
              t(
                isEdit
                  ? "blogPosts.editPostDescription"
                  : "blogPosts.addPostDescription",
              ),
            )}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 overflow-auto">
          <OverlayFormBody
            formId={formId}
            onSubmit={handleSubmit}
            className="space-y-4 p-6"
          >
            <FieldSet disabled={pending}>
              <Tabs defaultValue="en">
                <TabsList>
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="ar">العربية</TabsTrigger>
                </TabsList>

                <TabsContent value="en">
                  <FieldGroup>
                    <form.Field name="title">
                      {(field) => (
                        <Field>
                          <FieldLabel htmlFor={field.name}>
                            {t("blogPosts.postTitle")}
                          </FieldLabel>
                          <Input
                            id={field.name}
                            value={field.state.value as string}
                            onChange={(e) => {
                              field.handleChange(e.target.value);
                              if (!isEdit)
                                form.setFieldValue(
                                  "slug",
                                  slugify(e.target.value),
                                );
                            }}
                            onBlur={field.handleBlur}
                            placeholder={String(
                              t("blogPosts.postTitlePlaceholder"),
                            )}
                          />
                        </Field>
                      )}
                    </form.Field>
                    <form.AppField name="excerpt">
                      {(field) => (
                        <field.TextareaField
                          label={t("blogPosts.excerpt")}
                          placeholder={String(
                            t("blogPosts.excerptPlaceholder"),
                          )}
                          rows={3}
                        />
                      )}
                    </form.AppField>
                    <form.AppField name="content">
                      {(field) => (
                        <field.TextareaField
                          label={t("blogPosts.content")}
                          placeholder={String(
                            t("blogPosts.contentPlaceholder"),
                          )}
                          rows={8}
                        />
                      )}
                    </form.AppField>
                  </FieldGroup>
                </TabsContent>

                <TabsContent value="ar" dir="rtl">
                  <FieldGroup>
                    <form.AppField name="titleAr">
                      {(field) => (
                        <field.StringField
                          label={`${t("blogPosts.postTitle")} (AR)`}
                          placeholder="عنوان المقال بالعربية..."
                        />
                      )}
                    </form.AppField>
                    <form.AppField name="excerptAr">
                      {(field) => (
                        <field.TextareaField
                          label={`${t("blogPosts.excerpt")} (AR)`}
                          placeholder="ملخص المقال بالعربية..."
                          rows={3}
                        />
                      )}
                    </form.AppField>
                    <form.AppField name="contentAr">
                      {(field) => (
                        <field.TextareaField
                          label={`${t("blogPosts.content")} (AR)`}
                          placeholder="محتوى المقال بالعربية..."
                          rows={8}
                        />
                      )}
                    </form.AppField>
                  </FieldGroup>
                </TabsContent>
              </Tabs>

              <FieldGroup>
                <form.Field name="slug">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        {t("blogPosts.slug")}
                      </FieldLabel>
                      <Input
                        id={field.name}
                        value={field.state.value as string}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder={t("blogPosts.slugPlaceholder")}
                        className="font-mono text-sm"
                      />
                    </Field>
                  )}
                </form.Field>
                <form.AppField name="authorName">
                  {(field) => (
                    <field.StringField
                      label={t("blogPosts.author")}
                      placeholder={t("blogPosts.authorPlaceholder")}
                    />
                  )}
                </form.AppField>
                <form.Field name="coverImageUrl">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        {t("blogPosts.coverImage")}
                      </FieldLabel>
                      <Input
                        id={field.name}
                        value={(field.state.value as string) ?? ""}
                        onChange={(e) =>
                          field.handleChange(e.target.value || null)
                        }
                        onBlur={field.handleBlur}
                        placeholder="https://..."
                      />
                    </Field>
                  )}
                </form.Field>
              </FieldGroup>

              {/* Media gallery */}
              <GalleryManager
                value={media}
                onChange={setMedia}
                disabled={pending}
              />
            </FieldSet>
          </OverlayFormBody>
        </ScrollArea>
        <DialogFooter className="border-t px-6 py-4">
          <OverlayFormFooterActions>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              <XIcon className="size-3.5" />
              {t("common.cancel")}
            </Button>
            <OverlayFormSubmitButton formId={formId} disabled={pending}>
              {pending ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <SaveIcon className="size-3.5" />
              )}
              {pending ? t("common.saving") : t("common.save")}
            </OverlayFormSubmitButton>
          </OverlayFormFooterActions>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
