"use client";

import { useMutation } from "@tanstack/react-query";
import { ImagePlusIcon, Loader2Icon } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FileUpload, FileUploadTrigger } from "@/components/ui/file-upload";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";
import { cn } from "@/lib/utils";

type Props = {
  onUploaded: (url: string) => void;
  label?: string;
  disabled?: boolean;
  accept?: string;
};

/**
 * Single-file-in / single-file-out upload button reusing the same Firebase
 * upload mutation GalleryManager uses (`uploadImage`), but scoped to one
 * block field (`data.url`, `data.beforeUrl`, etc.) instead of a full
 * multi-item gallery manager.
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

  const { mutateAsync: uploadImage } = useMutation(
    trpc.uploadImage.mutationOptions(),
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
        options.onProgress(file, 20);
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result;
            if (typeof result !== "string") {
              reject(new Error("read failed"));
              return;
            }
            const [, encoded = ""] = result.split(",", 2);
            resolve(encoded);
          };
          reader.onerror = () => reject(new Error("read failed"));
          reader.readAsDataURL(file);
        });

        const payload = await uploadImage({
          mimeType: file.type,
          base64,
          folder: "blocks",
        });

        if (!payload?.url) throw new Error("upload failed");

        const url = payload.url.startsWith("http")
          ? payload.url
          : new URL(payload.url, window.location.origin).toString();

        options.onProgress(file, 100);
        options.onSuccess(file);
        onUploaded(url);
      } catch {
        options.onError(file, new Error("upload failed"));
        toast.error(t("blocks.uploadFailed" as never));
      } finally {
        setUploading(false);
      }
    },
    [onUploaded, uploadImage, t],
  );

  return (
    <FileUpload
      accept={accept}
      maxFiles={1}
      maxSize={4 * 1024 * 1024}
      onUpload={handleUpload}
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
