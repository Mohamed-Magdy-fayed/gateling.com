"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSwap } from "@/components/ui/loading-swap";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  type LeadPipelineStatus,
  type LeadTier,
  leadPipelineStatusValues,
  leadTierValues,
  type WhatsappStatus,
  whatsappStatusValues,
} from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";

/**
 * Create and edit. Deliberately a plain controlled form rather than the shared
 * `useAppForm` stack — this is an internal tool with no validation nuance
 * beyond "name is required", and the server re-validates every field with Zod.
 */

export type LeadFormValues = {
  id?: string;
  name: string;
  nameAr: string;
  city: string;
  area: string;
  address: string;
  phone: string;
  phoneSecondary: string;
  whatsappStatus: WhatsappStatus;
  whatsappProfileName: string;
  tier: LeadTier | "none";
  socialPlatform: string;
  socialHandle: string;
  socialFollowers: string;
  branchCount: string;
  businessType: string;
  sourceUrl: string;
  pipelineStatus: LeadPipelineStatus;
  doNotContact: boolean;
  notes: string;
};

const EMPTY: LeadFormValues = {
  name: "",
  nameAr: "",
  city: "",
  area: "",
  address: "",
  phone: "",
  phoneSecondary: "",
  whatsappStatus: "unknown",
  whatsappProfileName: "",
  tier: "none",
  socialPlatform: "",
  socialHandle: "",
  socialFollowers: "",
  branchCount: "",
  businessType: "",
  sourceUrl: "",
  pipelineStatus: "new",
  doNotContact: false,
  notes: "",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Omit to create; provide to edit. */
  initial?: LeadFormValues;
};

/** "" → null, so an emptied field clears rather than storing a blank string. */
const orNull = (value: string) => (value.trim() ? value.trim() : null);
const orNullNumber = (value: string) => {
  const parsed = Number.parseInt(value.replace(/\D/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
};

export function LeadFormDialog({ open, onOpenChange, initial }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [values, setValues] = useState<LeadFormValues>(initial ?? EMPTY);

  useEffect(() => {
    if (open) setValues(initial ?? EMPTY);
  }, [open, initial]);

  const onSettled = async () => {
    toast.success(t("sales.leadSaved"));
    await queryClient.invalidateQueries();
    onOpenChange(false);
  };
  const onError = () => toast.error(t("sales.leadSaveFailed"));

  const create = useMutation(
    trpc.sales.create.mutationOptions({ onSuccess: onSettled, onError }),
  );
  const update = useMutation(
    trpc.sales.update.mutationOptions({ onSuccess: onSettled, onError }),
  );

  const isPending = create.isPending || update.isPending;

  function set<K extends keyof LeadFormValues>(
    key: K,
    value: LeadFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit() {
    const payload = {
      name: values.name.trim(),
      nameAr: orNull(values.nameAr),
      city: orNull(values.city),
      area: orNull(values.area),
      address: orNull(values.address),
      phone: orNull(values.phone),
      phoneSecondary: orNull(values.phoneSecondary),
      whatsappStatus: values.whatsappStatus,
      whatsappProfileName: orNull(values.whatsappProfileName),
      tier: values.tier === "none" ? null : values.tier,
      socialPlatform: orNull(values.socialPlatform),
      socialHandle: orNull(values.socialHandle),
      socialFollowers: orNullNumber(values.socialFollowers),
      branchCount: orNullNumber(values.branchCount),
      businessType: orNull(values.businessType),
      sourceUrl: orNull(values.sourceUrl),
      pipelineStatus: values.pipelineStatus,
      doNotContact: values.doNotContact,
      notes: orNull(values.notes),
    };

    if (values.id) {
      update.mutate({ ...payload, id: values.id });
    } else {
      create.mutate(payload);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {values.id ? t("sales.editLead") : t("sales.createLeadTitle")}
          </DialogTitle>
          <DialogDescription>{t("sales.leadsLead")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Text
            label={t("sales.fieldName")}
            value={values.name}
            onChange={(v) => set("name", v)}
          />
          <Text
            label={t("sales.fieldNameAr")}
            value={values.nameAr}
            onChange={(v) => set("nameAr", v)}
          />
          <Text
            label={t("sales.fieldCity")}
            value={values.city}
            onChange={(v) => set("city", v)}
          />
          <Text
            label={t("sales.fieldArea")}
            value={values.area}
            onChange={(v) => set("area", v)}
          />
          <Text
            label={t("sales.fieldPhone")}
            value={values.phone}
            onChange={(v) => set("phone", v)}
          />
          <Text
            label={t("sales.fieldPhoneSecondary")}
            value={values.phoneSecondary}
            onChange={(v) => set("phoneSecondary", v)}
          />

          <div className="flex flex-col gap-1.5">
            <Label>{t("sales.fieldWhatsappStatus")}</Label>
            <Select
              value={values.whatsappStatus}
              onValueChange={(v) => set("whatsappStatus", v as WhatsappStatus)}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {whatsappStatusValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t("sales.whatsappStatuses", { status: value })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t("sales.fieldWhatsappProfileName")}</Label>
            <Input
              value={values.whatsappProfileName}
              onChange={(event) =>
                set("whatsappProfileName", event.target.value)
              }
            />
            <p className="text-muted-foreground text-xs">
              {t("sales.fieldWhatsappProfileHint")}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t("sales.fieldTier")}</Label>
            <Select
              value={values.tier}
              onValueChange={(v) => set("tier", v as LeadTier | "none")}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {leadTierValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t("sales.fieldStatus")}</Label>
            <Select
              value={values.pipelineStatus}
              onValueChange={(v) =>
                set("pipelineStatus", v as LeadPipelineStatus)
              }
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {leadPipelineStatusValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t("sales.statuses", { status: value })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Text
            label={t("sales.fieldSocialPlatform")}
            value={values.socialPlatform}
            onChange={(v) => set("socialPlatform", v)}
          />
          <Text
            label={t("sales.fieldSocialHandle")}
            value={values.socialHandle}
            onChange={(v) => set("socialHandle", v)}
          />
          <Text
            label={t("sales.fieldSocialFollowers")}
            value={values.socialFollowers}
            onChange={(v) => set("socialFollowers", v)}
          />
          <Text
            label={t("sales.fieldBranchCount")}
            value={values.branchCount}
            onChange={(v) => set("branchCount", v)}
          />
          <Text
            label={t("sales.fieldBusinessType")}
            value={values.businessType}
            onChange={(v) => set("businessType", v)}
          />
          <Text
            label={t("sales.fieldSourceUrl")}
            value={values.sourceUrl}
            onChange={(v) => set("sourceUrl", v)}
          />

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>{t("sales.fieldAddress")}</Label>
            <Input
              value={values.address}
              onChange={(event) => set("address", event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>{t("sales.fieldNotes")}</Label>
            <Textarea
              rows={3}
              value={values.notes}
              onChange={(event) => set("notes", event.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 sm:col-span-2">
            <Checkbox
              id="doNotContact"
              checked={values.doNotContact}
              onCheckedChange={(checked) =>
                set("doNotContact", checked === true)
              }
            />
            <Label htmlFor="doNotContact">{t("sales.fieldDoNotContact")}</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !values.name.trim()}
          >
            <LoadingSwap isLoading={isPending}>{t("common.save")}</LoadingSwap>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Text({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
