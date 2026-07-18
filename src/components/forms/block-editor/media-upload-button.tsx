"use client";

import { useMutation } from "@tanstack/react-query";
import { ImagePlusIcon, Loader2Icon } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileUpload, FileUploadTrigger } from "@/components/ui/file-upload";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";
import {
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  putFileToSignedUrl,
} from "@/lib/upload-to-signed-url";
import { cn } from "@/lib/utils";

type Props = {
  onUploaded: (url: string) => void;
  label?: string;
  disabled?: boolean;
  accept?: string;
};

/**
 * Single-file-in / single-file-out upload button. Uploads straight to Firebase
 * Storage through a signed URL (the same path GalleryManager uses), so it
 * handles both images and videos without hitting the serverless body limit.
 * Scoped to one block field (`data.url`, `data.videoUrl`, etc.) rather than a
 * full multi-item gallery.
 */
export function MediaUploadButton({
  onUploaded,
  label,
  disabled,
  accept = "image/*",
}: Props) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const [uploading, setUploading] = useState(false);

  const { mutateAsync: createUploadUrl } = useMutation(
    trpc.createUploadUrl.mutationOptions(),
  );

  const validateFile = useCallback(
    (file: File): string | null => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) {
        return String(t("blocks.unsupportedType" as never));
      }
      const cap = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
      if (file.size > cap) {
        return String(
          t(
            (isVideo
              ? "blocks.videoTooLarge"
              : "blocks.imageTooLarge") as never,
          ),
        );
      }
      return null;
    },
    [t],
  );

  const handleUpload = useCallback(
    async (
      files: File[],
      options: {
        onProgress: (f: File, p: number) => void;
        onSuccess: (f: File) => void;
        onError: (f: File, e: Error) => void;
      },
    ) => {
      const file = files[0];
      if (!file) return;
      setUploading(true);
      try {
        options.onProgress(file, 5);

        const target = await createUploadUrl({
          contentType: file.type,
          folder: "blocks",
        });

        await putFileToSignedUrl(
          target.uploadUrl,
          target.headers,
          file,
          (percent) => options.onProgress(file, Math.max(5, percent)),
        );

        options.onProgress(file, 100);
        options.onSuccess(file);
        onUploaded(target.publicUrl);
      } catch (err) {
        options.onError(
          file,
          err instanceof Error ? err : new Error("upload failed"),
        );
        toast.error(t("blocks.uploadFailed" as never));
      } finally {
        setUploading(false);
      }
    },
    [onUploaded, createUploadUrl, t],
  );

  return (
    <FileUpload
      accept={accept}
      maxFiles={1}
      onUpload={handleUpload}
      onFileValidate={validateFile}
      onFileReject={(_file, message) => toast.error(message)}
      disabled={disabled || uploading}
    >
      <FileUploadTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading}
          className={cn(uploading && "opacity-70")}
        >
          {uploading ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <ImagePlusIcon className="size-3.5" />
          )}
          {label ?? String(t("blocks.upload" as never))}
        </Button>
      </FileUploadTrigger>
    </FileUpload>
  );
}
