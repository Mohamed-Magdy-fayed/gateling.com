"use client";

import { useMutation } from "@tanstack/react-query";
import { ImageUpIcon, Loader2Icon, UploadCloudIcon } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import type { FileUploadProps } from "@/components/ui/file-upload";
import { FileUpload, FileUploadTrigger } from "@/components/ui/file-upload";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";
import { FormBase, type FormFieldProps } from "./form-base";
import { useFieldContext } from "./hooks";

export function FormImageField({
  placeholder,
  autoFocus,
  ...props
}: FormFieldProps & { placeholder?: string }) {
  const field = useFieldContext<string | null>();
  const { t } = useTranslation();
  const trpc = useTRPC();
  const { mutateAsync: uploadImage, isPending: isUploading } = useMutation(
    trpc.uploadImage.mutationOptions(),
  );
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const currentUrl = field.state.value;

  const onUpload: NonNullable<FileUploadProps["onUpload"]> = useCallback(
    async (files, options) => {
      for (const file of files) {
        try {
          options.onProgress(file, 20);

          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result;
              if (typeof result !== "string") {
                reject(new Error("Failed to read file"));
                return;
              }

              const [, encoded = ""] = result.split(",", 2);
              if (!encoded) {
                reject(new Error("Failed to encode file"));
                return;
              }

              resolve(encoded);
            };
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(file);
          });

          const payload = await uploadImage({
            mimeType: file.type,
            base64,
            folder: "uploads",
          });

          if (!payload?.url) {
            throw new Error("Upload failed");
          }

          const uploadedUrl = payload.url.startsWith("http")
            ? payload.url
            : new URL(payload.url, window.location.origin).toString();

          options.onProgress(file, 100);
          options.onSuccess(file);
          field.setValue(uploadedUrl);
          toast.success(t("forms.imageUpload.success" as never));
        } catch {
          const errMsg = t("forms.imageUpload.error" as never);
          options.onError(file, new Error(errMsg));
          toast.error(errMsg);
        }
      }
    },
    [field, uploadImage, t],
  );

  return (
    <FormBase {...props}>
      <FileUpload
        accept="image/*"
        maxFiles={1}
        maxSize={4 * 1024 * 1024}
        className="w-full flex items-center gap-2"
        onUpload={onUpload}
        disabled={isUploading}
      >
        <InputGroup>
          <InputGroupAddon>
            {isUploading ? (
              <Loader2Icon className="animate-spin" />
            ) : currentUrl ? (
              // biome-ignore lint/performance/noImgElement: thumbnail preview from user-uploaded URL
              <img
                src={currentUrl}
                alt=""
                aria-hidden
                className="size-5 rounded-full object-cover"
              />
            ) : (
              <ImageUpIcon />
            )}
          </InputGroupAddon>
          <InputGroupInput
            aria-invalid={isInvalid}
            autoComplete="off"
            autoFocus={autoFocus}
            id={field.name}
            name={field.name}
            onBlur={field.handleBlur}
            onChange={(e) =>
              field.handleChange(e.target.value ? e.target.value : null)
            }
            placeholder={
              isUploading
                ? (t("forms.imageUpload.uploading" as never) as string)
                : placeholder
            }
            readOnly={isUploading}
            value={field.state.value ?? ""}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              render={
                <FileUploadTrigger>
                  <UploadCloudIcon />
                </FileUploadTrigger>
              }
            />
          </InputGroupAddon>
        </InputGroup>
      </FileUpload>
    </FormBase>
  );
}
