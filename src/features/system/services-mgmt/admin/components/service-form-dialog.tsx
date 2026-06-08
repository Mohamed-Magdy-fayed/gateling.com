"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2Icon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import type { FormEvent } from "react";
import { useCallback, useEffect, useId, useMemo } from "react";
import { toast } from "sonner";
import { z } from "zod";

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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";
import type { Service } from "@/integrations/trpc/routers/services-mgmt";

const formSchema = z.object({
  title: z.string().trim().min(1).max(255),
  titleAr: z.string().trim().max(255).optional().nullable(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/),
  shortDescription: z.string().trim().min(1).max(512),
  shortDescriptionAr: z.string().trim().max(512).optional().nullable(),
  fullDescription: z.string().trim().max(2048).optional().nullable(),
  fullDescriptionAr: z.string().trim().max(2048).optional().nullable(),
  icon: z.string().trim().min(1).max(64),
  features: z.array(z.string().trim().min(1)),
  featuresAr: z.array(z.string()).optional().nullable(),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

type Props = {
  service?: Service | null;
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

export function ServiceFormDialog({ service, onOpenChange, open }: Props) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const qc = useQueryClient();
  const formId = useId();
  const isEdit = service != null;

  const createMut = useMutation(trpc.servicesMgmt.create.mutationOptions());
  const updateMut = useMutation(trpc.servicesMgmt.update.mutationOptions());
  const pending = createMut.isPending || updateMut.isPending;

  const defaultValues = useMemo<FormValues>(
    () => ({
      title: "",
      titleAr: null,
      slug: "",
      shortDescription: "",
      shortDescriptionAr: null,
      fullDescription: null,
      fullDescriptionAr: null,
      icon: "Zap",
      features: [""],
      featuresAr: [""],
      sortOrder: 0,
      isActive: true,
    }),
    [],
  );

  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: formSchema },
    onSubmit: async ({ value }) => {
      try {
        const featuresArFiltered = (value.featuresAr ?? []).filter(Boolean);
        const payload = {
          ...value,
          titleAr: value.titleAr || null,
          shortDescriptionAr: value.shortDescriptionAr || null,
          fullDescription: value.fullDescription || null,
          fullDescriptionAr: value.fullDescriptionAr || null,
          features: value.features.filter(Boolean),
          featuresAr: featuresArFiltered.length > 0 ? featuresArFiltered : null,
        };
        if (isEdit && service) {
          await toast
            .promise(updateMut.mutateAsync({ id: service.id, ...payload }), {
              loading: String(t("common.saving")),
              success: String(t("services.serviceUpdated")),
              error: String(t("services.serviceSaveFailed")),
            })
            .unwrap();
        } else {
          await toast
            .promise(createMut.mutateAsync(payload), {
              loading: String(t("common.saving")),
              success: String(t("services.serviceCreated")),
              error: String(t("services.serviceSaveFailed")),
            })
            .unwrap();
        }
        await qc.invalidateQueries({ queryKey: trpc.servicesMgmt.pathKey() });
        onOpenChange(false);
      } catch {
        /* surfaced */
      }
    },
  });

  const resetToService = useCallback(() => {
    if (!service) return;
    const features = service.features as string[];
    const featuresAr = service.featuresAr as string[] | null;
    form.reset({
      title: service.title,
      titleAr: service.titleAr ?? null,
      slug: service.slug,
      shortDescription: service.shortDescription,
      shortDescriptionAr: service.shortDescriptionAr ?? null,
      fullDescription: service.fullDescription ?? null,
      fullDescriptionAr: service.fullDescriptionAr ?? null,
      icon: service.icon,
      features: features.length > 0 ? features : [""],
      featuresAr:
        featuresAr && featuresAr.length > 0 ? featuresAr : [""],
      sortOrder: service.sortOrder,
      isActive: service.isActive,
    });
  }, [service, form]);

  useEffect(() => {
    if (open && isEdit && service) resetToService();
    else if (open && !isEdit) form.reset(defaultValues);
  }, [open, isEdit, service, resetToService, form, defaultValues]);

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
            {String(t(isEdit ? "services.editService" : "services.addService"))}
          </DialogTitle>
          <DialogDescription>
            {String(
              t(
                isEdit
                  ? "services.editServiceDescription"
                  : "services.addServiceDescription",
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
                            {String(t("services.name"))}
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
                            placeholder={String(t("services.namePlaceholder"))}
                          />
                        </Field>
                      )}
                    </form.Field>
                    <form.AppField name="shortDescription">
                      {(field) => (
                        <field.TextareaField
                          label={String(t("services.shortDescription"))}
                          placeholder={String(
                            t("services.shortDescriptionPlaceholder"),
                          )}
                          rows={2}
                        />
                      )}
                    </form.AppField>
                    <form.AppField name="fullDescription">
                      {(field) => (
                        <field.TextareaField
                          label={String(t("services.fullDescription"))}
                          placeholder={String(
                            t("services.fullDescriptionPlaceholder"),
                          )}
                          rows={4}
                        />
                      )}
                    </form.AppField>
                    <form.Field name="features" mode="array">
                      {(field) => (
                        <Field>
                          <FieldLabel>{String(t("services.features"))}</FieldLabel>
                          <div className="space-y-2">
                            {field.state.value.map((_, index) => (
                              // biome-ignore lint/suspicious/noArrayIndexKey: TanStack Form array fields have no stable ID
                              <div key={index} className="flex gap-2">
                                <form.Field name={`features[${index}]`}>
                                  {(subField) => (
                                    <Input
                                      value={subField.state.value as string}
                                      onChange={(e) =>
                                        subField.handleChange(e.target.value)
                                      }
                                      placeholder={String(
                                        t("services.featurePlaceholder"),
                                      )}
                                      className="flex-1"
                                    />
                                  )}
                                </form.Field>
                                {field.state.value.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => field.removeValue(index)}
                                  >
                                    <Trash2Icon className="size-3.5" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => field.pushValue("")}
                            >
                              <PlusIcon className="me-1 size-3.5" />
                              {String(t("services.addFeature"))}
                            </Button>
                          </div>
                        </Field>
                      )}
                    </form.Field>
                  </FieldGroup>
                </TabsContent>

                <TabsContent value="ar" dir="rtl">
                  <FieldGroup>
                    <form.AppField name="titleAr">
                      {(field) => (
                        <field.StringField
                          label={`${String(t("services.name"))} (AR)`}
                          placeholder="اسم الخدمة بالعربية..."
                        />
                      )}
                    </form.AppField>
                    <form.AppField name="shortDescriptionAr">
                      {(field) => (
                        <field.TextareaField
                          label={`${String(t("services.shortDescription"))} (AR)`}
                          placeholder="وصف مختصر بالعربية..."
                          rows={2}
                        />
                      )}
                    </form.AppField>
                    <form.AppField name="fullDescriptionAr">
                      {(field) => (
                        <field.TextareaField
                          label={`${String(t("services.fullDescription"))} (AR)`}
                          placeholder="وصف تفصيلي بالعربية..."
                          rows={4}
                        />
                      )}
                    </form.AppField>
                    <form.Field name="featuresAr" mode="array">
                      {(field) => (
                        <Field>
                          <FieldLabel>
                            {`${String(t("services.features"))} (AR)`}
                          </FieldLabel>
                          <div className="space-y-2">
                            {(field.state.value ?? []).map((_, index) => (
                              // biome-ignore lint/suspicious/noArrayIndexKey: TanStack Form array fields have no stable ID
                              <div key={index} className="flex gap-2">
                                <form.Field name={`featuresAr[${index}]`}>
                                  {(subField) => (
                                    <Input
                                      value={subField.state.value as string}
                                      onChange={(e) =>
                                        subField.handleChange(e.target.value)
                                      }
                                      placeholder="ميزة بالعربية..."
                                      className="flex-1"
                                    />
                                  )}
                                </form.Field>
                                {(field.state.value ?? []).length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => field.removeValue(index)}
                                  >
                                    <Trash2Icon className="size-3.5" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => field.pushValue("")}
                            >
                              <PlusIcon className="me-1 size-3.5" />
                              {String(t("services.addFeature"))}
                            </Button>
                          </div>
                        </Field>
                      )}
                    </form.Field>
                  </FieldGroup>
                </TabsContent>
              </Tabs>

              <Separator />

              <FieldGroup>
                <form.Field name="slug">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Slug</FieldLabel>
                      <Input
                        id={field.name}
                        value={field.state.value as string}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        className="font-mono text-sm"
                      />
                    </Field>
                  )}
                </form.Field>
                <form.AppField name="icon">
                  {(field) => (
                    <field.StringField
                      label={String(t("services.icon"))}
                      placeholder={String(t("services.iconPlaceholder"))}
                    />
                  )}
                </form.AppField>
                <form.AppField name="sortOrder">
                  {(field) => (
                    <field.NumberField
                      label={String(t("services.sortOrder"))}
                    />
                  )}
                </form.AppField>
              </FieldGroup>
              <form.AppField name="isActive">
                {(field) => (
                  <field.BooleanField label={String(t("services.isActive"))} />
                )}
              </form.AppField>
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
              {String(t("common.cancel"))}
            </Button>
            <OverlayFormSubmitButton formId={formId} disabled={pending}>
              {pending ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <SaveIcon className="size-3.5" />
              )}
              {pending ? String(t("common.saving")) : String(t("common.save"))}
            </OverlayFormSubmitButton>
          </OverlayFormFooterActions>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
