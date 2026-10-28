"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { XIcon } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";

import { MediaUploadButton } from "@/components/forms/block-editor/media-upload-button";
import { Button } from "@/components/ui/button";
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
import type { LeadSocialProfile, SocialPlatform } from "@/drizzle/schema";
import { useTranslation } from "@/features/core/i18n/client";
import { isPlatformUrl } from "@/features/system/sales/lib/social-profiles";
import { useTRPC } from "@/integrations/trpc/client";

import { ProfileAvatar } from "./profile-avatar";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  platform: SocialPlatform;
  /** What is stored for this platform now, if anything. */
  stored: LeadSocialProfile | undefined;
};

type Values = {
  url: string;
  handle: string;
  displayName: string;
  followers: string;
  avatarUrl: string | null;
};

function initialValues(stored: LeadSocialProfile | undefined): Values {
  const found = stored?.status === "found" ? stored : null;
  return {
    url: found?.url ?? "",
    handle: found?.handle ?? "",
    displayName: found?.displayName ?? "",
    followers: found?.followers != null ? String(found.followers) : "",
    avatarUrl: found?.avatarUrl ?? null,
  };
}

/**
 * Enter one platform's profile by hand — the same `setSocialProfile` the sales
 * agent uses, so both stay in one shape. The profile picture is uploaded to our
 * storage (Facebook's own image links expire).
 */
export function SocialProfileDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  platform,
  stored,
}: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [values, setValues] = useState<Values>(() => initialValues(stored));
  const ids = {
    url: useId(),
    handle: useId(),
    name: useId(),
    followers: useId(),
    urlError: useId(),
  };

  useEffect(() => {
    if (open) setValues(initialValues(stored));
  }, [open, stored]);

  const mutation = useMutation(
    trpc.sales.setSocialProfile.mutationOptions({
      onSuccess: async () => {
        toast.success(t("sales.account.profileSaved"));
        await queryClient.invalidateQueries({
          queryKey: trpc.sales.byId.pathKey(),
        });
        onOpenChange(false);
      },
      onError: () => toast.error(t("sales.account.profileSaveFailed")),
    }),
  );

  const urlInvalid =
    values.url.trim() !== "" && !isPlatformUrl(platform, values.url.trim());
  const canSave =
    values.url.trim() !== "" && !urlInvalid && !mutation.isPending;

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSave() {
    const followers = Number.parseInt(values.followers.replace(/\D/g, ""), 10);
    mutation.mutate({
      id: leadId,
      platform,
      status: "found",
      url: values.url.trim(),
      handle: values.handle.trim() || null,
      displayName: values.displayName.trim() || null,
      followers: Number.isFinite(followers) ? followers : null,
      // Keep what research found; the form edits only what it shows.
      posts: stored?.status === "found" ? stored.posts : null,
      bio: stored?.status === "found" ? stored.bio : null,
      avatarUrl: platform === "facebook" ? values.avatarUrl : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t("sales.account.editProfileTitle", { platform })}
          </DialogTitle>
          <DialogDescription>
            {t("sales.account.editProfileLead")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {platform === "facebook" && (
            <div className="flex items-center gap-3">
              <ProfileAvatar
                name={values.displayName || leadName}
                src={values.avatarUrl}
                alt={t("sales.account.profilePicture", { platform })}
                className="size-14"
              />
              <div className="flex flex-wrap items-center gap-2">
                <MediaUploadButton
                  label={t("sales.account.uploadPicture")}
                  onUploaded={(url) => set("avatarUrl", url)}
                />
                {values.avatarUrl && (
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={() => set("avatarUrl", null)}
                  >
                    <XIcon aria-hidden="true" />
                    {t("sales.account.removePicture")}
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.url}>
              {t("sales.account.profileUrl", { platform })}
            </Label>
            <Input
              id={ids.url}
              type="url"
              dir="ltr"
              className="text-start"
              value={values.url}
              onChange={(event) => set("url", event.target.value)}
              aria-invalid={urlInvalid || undefined}
              aria-describedby={urlInvalid ? ids.urlError : undefined}
              data-testid="social-url-input"
            />
            {urlInvalid && (
              <p
                id={ids.urlError}
                role="alert"
                className="text-destructive text-xs"
              >
                {t("sales.account.profileUrlInvalid", { platform })}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.name}>{t("sales.account.displayName")}</Label>
            <Input
              id={ids.name}
              value={values.displayName}
              onChange={(event) => set("displayName", event.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={ids.handle}>{t("sales.fieldSocialHandle")}</Label>
              <Input
                id={ids.handle}
                dir="ltr"
                className="text-start"
                value={values.handle}
                onChange={(event) => set("handle", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={ids.followers}>
                {t("sales.account.followersLabel")}
              </Label>
              <Input
                id={ids.followers}
                inputMode="numeric"
                dir="ltr"
                className="text-start"
                value={values.followers}
                onChange={(event) => set("followers", event.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          <Button
            variant="ghost"
            disabled={mutation.isPending}
            onClick={() =>
              mutation.mutate({ id: leadId, platform, status: "notFound" })
            }
          >
            {t("sales.account.markNotFound")}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={!canSave}
              data-testid="social-save"
            >
              <LoadingSwap isLoading={mutation.isPending}>
                {t("common.save")}
              </LoadingSwap>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
