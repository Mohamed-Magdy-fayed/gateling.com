"use client";

import { useMutation } from "@tanstack/react-query";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ImagePlusIcon,
  Loader2Icon,
  StarIcon,
  Trash2Icon,
  VideoIcon,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useId, useState } from "react";
import { toast } from "sonner";

import { FileUpload, FileUploadTrigger } from "@/components/ui/file-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/features/core/i18n/client";
import { useTRPC } from "@/integrations/trpc/client";
import { cn } from "@/lib/utils";

export type GalleryItem = {
  id?: string;
  type: "image" | "video";
  url: string;
  title?: string | null;
  isFeatured: boolean;
  isSecondary: boolean;
  sortOrder: number;
};

type Props = {
  value: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
  disabled?: boolean;
};

function isValidVideoUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.hostname.includes("youtube.com") ||
      u.hostname === "youtu.be" ||
      u.hostname === "vimeo.com"
    );
  } catch {
    return false;
  }
}

export function GalleryManager({ value, onChange, disabled }: Props) {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const videoInputId = useId();

  const [videoUrl, setVideoUrl] = useState("");
  const [videoError, setVideoError] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);

  const { mutateAsync: uploadImage } = useMutation(
    trpc.uploadImage.mutationOptions(),
  );

  const handleUpload = useCallback(
    async (files: File[], options: { onProgress: (f: File, p: number) => void; onSuccess: (f: File) => void; onError: (f: File, e: Error) => void }) => {
      for (const file of files) {
        setUploadingCount((n) => n + 1);
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
            folder: "gallery",
          });

          if (!payload?.url) throw new Error("upload failed");

          const url = payload.url.startsWith("http")
            ? payload.url
            : new URL(payload.url, window.location.origin).toString();

          options.onProgress(file, 100);
          options.onSuccess(file);

          onChange([
            ...value,
            {
              type: "image",
              url,
              title: null,
              isFeatured: value.length === 0,
              isSecondary: false,
              sortOrder: value.length,
            },
          ]);
        } catch {
          options.onError(file, new Error("upload failed"));
          toast.error(t("galleryManager.invalidVideoUrl" as never));
        } finally {
          setUploadingCount((n) => n - 1);
        }
      }
    },
    [value, onChange, uploadImage, t],
  );

  function addVideo() {
    const trimmed = videoUrl.trim();
    if (!isValidVideoUrl(trimmed)) {
      setVideoError(true);
      return;
    }
    setVideoError(false);
    setVideoUrl("");
    onChange([
      ...value,
      {
        type: "video",
        url: trimmed,
        title: null,
        isFeatured: value.length === 0,
        isSecondary: false,
        sortOrder: value.length,
      },
    ]);
  }

  function remove(index: number) {
    const next = value.filter((_, i) => i !== index).map((item, i) => ({
      ...item,
      sortOrder: i,
    }));
    onChange(next);
  }

  function setFeatured(index: number) {
    onChange(
      value.map((item, i) => ({
        ...item,
        isFeatured: i === index ? !item.isFeatured : false,
      })),
    );
  }

  function setSecondary(index: number) {
    onChange(
      value.map((item, i) => ({
        ...item,
        isSecondary: i === index ? !item.isSecondary : false,
      })),
    );
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next.map((item, i) => ({ ...item, sortOrder: i })));
  }

  function updateTitle(index: number, title: string) {
    onChange(
      value.map((item, i) =>
        i === index ? { ...item, title: title || null } : item,
      ),
    );
  }

  const isDisabled = disabled || uploadingCount > 0;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">
          {String(t("galleryManager.label" as never))}
        </p>
        <p className="text-muted-foreground text-xs">
          {String(t("galleryManager.description" as never))}
        </p>
      </div>

      {/* Existing items */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((item, index) => (
            <div
              key={item.id ?? `new-${index}`}
              className="border-border/60 flex items-start gap-3 rounded-lg border p-3"
            >
              {/* Thumbnail */}
              <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                {item.type === "image" ? (
                  <Image
                    src={item.url}
                    alt={item.title ?? ""}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <VideoIcon className="text-muted-foreground h-5 w-5" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap gap-1">
                  {item.isFeatured && (
                    <Badge variant="default" className="text-xs">
                      {String(t("galleryManager.featured" as never))}
                    </Badge>
                  )}
                  {item.isSecondary && (
                    <Badge variant="secondary" className="text-xs">
                      {String(t("galleryManager.secondary" as never))}
                    </Badge>
                  )}
                </div>
                <Input
                  value={item.title ?? ""}
                  onChange={(e) => updateTitle(index, e.target.value)}
                  placeholder={String(
                    t("galleryManager.titlePlaceholder" as never),
                  )}
                  className="h-7 text-xs"
                  disabled={isDisabled}
                />
              </div>

              {/* Controls */}
              <div className="flex shrink-0 flex-col gap-1">
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon-xs"
                    variant={item.isFeatured ? "default" : "outline"}
                    onClick={() => setFeatured(index)}
                    disabled={isDisabled}
                    title={String(
                      t(
                        item.isFeatured
                          ? ("galleryManager.clearFeatured" as never)
                          : ("galleryManager.markFeatured" as never),
                      ),
                    )}
                  >
                    <StarIcon className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="icon-xs"
                    variant={item.isSecondary ? "secondary" : "outline"}
                    onClick={() => setSecondary(index)}
                    disabled={isDisabled}
                    title={String(
                      t(
                        item.isSecondary
                          ? ("galleryManager.clearSecondary" as never)
                          : ("galleryManager.markSecondary" as never),
                      ),
                    )}
                  >
                    <span className="text-[10px] font-bold">2</span>
                  </Button>
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => move(index, -1)}
                    disabled={isDisabled || index === 0}
                    title={String(t("galleryManager.moveUp" as never))}
                  >
                    <ArrowUpIcon className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    size="icon-xs"
                    variant="ghost"
                    onClick={() => move(index, 1)}
                    disabled={isDisabled || index === value.length - 1}
                    title={String(t("galleryManager.moveDown" as never))}
                  >
                    <ArrowDownIcon className="h-3 w-3" />
                  </Button>
                </div>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => remove(index)}
                  disabled={isDisabled}
                  title={String(t("galleryManager.remove" as never))}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2Icon className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Separator />

      {/* Add controls */}
      <div className="flex flex-wrap gap-2">
        <FileUpload
          accept="image/*"
          maxFiles={5}
          maxSize={4 * 1024 * 1024}
          onUpload={handleUpload}
          disabled={isDisabled}
        >
          <FileUploadTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDisabled}
              className={cn(uploadingCount > 0 && "opacity-70")}
            >
              {uploadingCount > 0 ? (
                <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ImagePlusIcon className="h-3.5 w-3.5" />
              )}
              {String(t("galleryManager.addImage" as never))}
            </Button>
          </FileUploadTrigger>
        </FileUpload>
      </div>

      {/* Video URL input */}
      <div className="space-y-1.5">
        <Label htmlFor={videoInputId} className="text-xs">
          {String(t("galleryManager.videoUrl" as never))}
        </Label>
        <div className="flex gap-2">
          <Input
            id={videoInputId}
            value={videoUrl}
            onChange={(e) => {
              setVideoUrl(e.target.value);
              setVideoError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addVideo();
              }
            }}
            placeholder={String(t("galleryManager.videoUrlPlaceholder" as never))}
            className={cn("text-sm", videoError && "border-destructive")}
            disabled={isDisabled}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addVideo}
            disabled={isDisabled || !videoUrl.trim()}
          >
            <VideoIcon className="h-3.5 w-3.5" />
            {String(t("galleryManager.addVideo" as never))}
          </Button>
        </div>
        {videoError && (
          <p className="text-destructive text-xs">
            {String(t("galleryManager.invalidVideoUrl" as never))}
          </p>
        )}
      </div>
    </div>
  );
}
