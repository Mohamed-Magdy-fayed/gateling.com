"use client";

import { useMutation } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { CheckCircle2Icon, StarIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useAppForm } from "@/components/forms/hooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { H1, H2, Lead, Muted } from "@/components/ui/typography";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";
import type { clientFeedbackRouter } from "@/integrations/trpc/routers/client-feedback";

type RouterOutput = inferRouterOutputs<typeof clientFeedbackRouter>;
type CaseStudy = RouterOutput["getForCaseStudy"]["caseStudy"];
type Testimonial = RouterOutput["getForCaseStudy"]["testimonial"];
type User = RouterOutput["getForCaseStudy"]["user"];

type Props = {
  caseStudy: CaseStudy;
  testimonial: Testimonial;
  user: User;
  projectFeatures: readonly string[];
};

const feedbackSchema = z.object({
  name: z.string().trim().min(1).max(255),
  imageUrl: z.string().max(1024).nullable(),
  role: z.string().trim().max(128).nullable(),
  company: z.string().trim().min(1).max(255),
  rating: z.number().int().min(1).max(5),
  content: z.string().trim().min(1).max(1024),
});

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="cursor-pointer transition-transform hover:scale-110"
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          <StarIcon
            className={`h-7 w-7 transition-colors ${
              star <= (hovered || value)
                ? "fill-yellow-400 stroke-yellow-400"
                : "stroke-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function FeedbackForm({
  caseStudy,
  testimonial,
  user,
  projectFeatures,
}: Props) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const [saved, setSaved] = useState(false);

  const { mutateAsync: upsert } = useMutation(
    trpc.clientFeedback.upsert.mutationOptions(),
  );

  const form = useAppForm({
    defaultValues: {
      name: testimonial?.clientName ?? user.name ?? "",
      imageUrl: testimonial?.avatarUrl ?? user.imageUrl ?? null,
      role: testimonial?.role ?? null,
      company: testimonial?.company ?? "",
      rating: testimonial?.rating ?? 5,
      content: testimonial?.content ?? "",
    },
    validators: { onSubmit: feedbackSchema },
    onSubmit: async ({ value }) => {
      try {
        await upsert({
          caseStudyId: caseStudy.id,
          name: value.name,
          imageUrl: value.imageUrl ?? null,
          role: value.role ?? null,
          company: value.company,
          rating: value.rating,
          content: value.content,
        });
        setSaved(true);
        toast.success(t("publicPages.feedbackPage.successTitle"));
      } catch {
        toast.error(
          t("common.errorGeneric" as never) ?? "Something went wrong",
        );
      }
    },
  });

  if (saved) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <CheckCircle2Icon className="text-primary h-16 w-16" />
        <H2>{t("publicPages.feedbackPage.successTitle")}</H2>
        <Lead className="max-w-md">
          {t("publicPages.feedbackPage.successMessage")}
        </Lead>
        <Button variant="outline" onClick={() => setSaved(false)}>
          {t("publicPages.feedbackPage.submit")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Project header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{caseStudy.industry}</Badge>
          {testimonial && (
            <Badge variant="outline">
              {t("publicPages.feedbackPage.alreadySaved")}
            </Badge>
          )}
        </div>
        <H1>{t("publicPages.feedbackPage.pageTitle")}</H1>
        <Lead>{t("publicPages.feedbackPage.pageSubtitle")}</Lead>
      </div>

      {/* Features context */}
      {projectFeatures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("publicPages.feedbackPage.projectFeaturesLabel")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {projectFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <CheckCircle2Icon className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <form
        className="space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        {/* Profile section */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("publicPages.feedbackPage.profileSection.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FieldSet className="grid gap-6 sm:grid-cols-2">
              <form.AppField name="name">
                {(field) => (
                  <field.StringField
                    label={t(
                      "publicPages.feedbackPage.profileSection.nameLabel",
                    )}
                    placeholder={t(
                      "publicPages.feedbackPage.profileSection.namePlaceholder",
                    )}
                  />
                )}
              </form.AppField>
              <form.AppField name="imageUrl">
                {(field) => (
                  <field.ImageField
                    label={t(
                      "publicPages.feedbackPage.profileSection.avatarLabel",
                    )}
                    placeholder={t(
                      "publicPages.feedbackPage.profileSection.avatarHint",
                    )}
                  />
                )}
              </form.AppField>
            </FieldSet>
          </CardContent>
        </Card>

        {/* Testimonial section */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t("publicPages.feedbackPage.testimonialSection.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup className="grid gap-6">
              <FieldSet className="grid gap-6 sm:grid-cols-2">
                <form.AppField name="role">
                  {(field) => (
                    <field.StringField
                      label={t(
                        "publicPages.feedbackPage.testimonialSection.roleLabel",
                      )}
                      placeholder={t(
                        "publicPages.feedbackPage.testimonialSection.rolePlaceholder",
                      )}
                    />
                  )}
                </form.AppField>
                <form.AppField name="company">
                  {(field) => (
                    <field.StringField
                      label={t(
                        "publicPages.feedbackPage.testimonialSection.companyLabel",
                      )}
                      placeholder={t(
                        "publicPages.feedbackPage.testimonialSection.companyPlaceholder",
                      )}
                    />
                  )}
                </form.AppField>
              </FieldSet>

              {/* Star rating */}
              <form.AppField name="rating">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="rating">
                      {t(
                        "publicPages.feedbackPage.testimonialSection.ratingLabel",
                      )}
                    </FieldLabel>
                    <StarPicker
                      value={field.state.value}
                      onChange={(v) => field.handleChange(v)}
                    />
                    <Muted className="text-xs">
                      {t(
                        "publicPages.feedbackPage.testimonialSection.ratingHint",
                      )}
                    </Muted>
                  </Field>
                )}
              </form.AppField>

              <form.AppField name="content">
                {(field) => (
                  <field.TextareaField
                    label={t(
                      "publicPages.feedbackPage.testimonialSection.contentLabel",
                    )}
                    placeholder={t(
                      "publicPages.feedbackPage.testimonialSection.contentPlaceholder",
                    )}
                    rows={5}
                  />
                )}
              </form.AppField>
            </FieldGroup>
          </CardContent>
        </Card>

        <form.Subscribe selector={(state) => [state.isSubmitting]}>
          {([isSubmitting]) => (
            <Button
              className="w-full sm:w-auto"
              disabled={isSubmitting}
              size="lg"
              type="submit"
            >
              <LoadingSwap
                isLoading={isSubmitting}
                loadingText={t("publicPages.feedbackPage.submitting")}
              >
                {t("publicPages.feedbackPage.submit")}
              </LoadingSwap>
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
