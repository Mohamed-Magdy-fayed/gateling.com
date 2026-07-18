import "server-only";

import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { getStorageBucket } from "./admin";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

/**
 * MIME types accepted for direct (signed-URL) gallery uploads. Videos are only
 * viable through the signed-URL path — pushing them base64 through the tRPC
 * mutation would hit Vercel's ~4.5MB serverless request-body limit.
 */
const SIGNED_UPLOAD_EXTENSION_BY_MIME: Record<string, string> = {
  ...EXTENSION_BY_MIME,
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
  "video/ogg": ".ogv",
};

// Object ACL the browser must apply on PUT so the uploaded file is publicly
// readable — matches the per-object `public: true` used by base64 uploads.
const PUBLIC_READ_ACL = "public-read";
const SIGNED_UPLOAD_TTL_MS = 15 * 60 * 1000; // 15 minutes

export type SignedUploadTarget = {
  uploadUrl: string;
  publicUrl: string;
  /** Headers the client MUST send on the PUT, verbatim — they are signed. */
  headers: Record<string, string>;
};

/**
 * Generate a short-lived v4 signed URL that lets the browser upload a single
 * file straight to Firebase Storage (bypassing the serverless body limit).
 *
 * The signature covers the `Content-Type` and `x-goog-acl` headers, so the
 * client must send exactly the returned `headers`. The bucket also needs a CORS
 * rule allowing PUT + those request headers from the site origin.
 */
export async function createSignedUploadUrl(
  contentType: string,
  folder = "uploads",
): Promise<SignedUploadTarget> {
  const extension = SIGNED_UPLOAD_EXTENSION_BY_MIME[contentType];
  if (!extension) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Unsupported file type",
    });
  }

  const filename = `${folder}/${Date.now()}-${randomUUID()}${extension}`;
  const file = getStorageBucket().file(filename);

  const [uploadUrl] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + SIGNED_UPLOAD_TTL_MS,
    contentType,
    extensionHeaders: { "x-goog-acl": PUBLIC_READ_ACL },
  });

  return {
    uploadUrl,
    publicUrl: file.publicUrl(),
    headers: { "Content-Type": contentType, "x-goog-acl": PUBLIC_READ_ACL },
  };
}

/**
 * Upload a base64-encoded image to Firebase Storage.
 * Returns the public download URL.
 *
 * @param base64 - base64 string (no data URI prefix)
 * @param mimeType - MIME type of the image
 * @param folder - storage folder path (e.g. "case-studies", "blog-posts")
 */
export async function uploadImage(
  base64: string,
  mimeType: string,
  folder = "uploads",
): Promise<string> {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Unsupported image type",
    });
  }

  const buffer = Buffer.from(base64, "base64");

  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Image exceeds the maximum allowed size (8MB)",
    });
  }

  const extension = EXTENSION_BY_MIME[mimeType] ?? ".jpg";
  const filename = `${folder}/${Date.now()}-${randomUUID()}${extension}`;

  const bucket = getStorageBucket();
  const file = bucket.file(filename);

  await file.save(buffer, {
    metadata: { contentType: mimeType },
    public: true,
  });

  return file.publicUrl();
}

/**
 * Delete an image from Firebase Storage given its public URL.
 * Silently ignores errors (file already deleted, wrong bucket, etc.)
 */
export async function deleteImage(publicUrl: string): Promise<void> {
  try {
    const bucket = getStorageBucket();
    const bucketName = bucket.name;
    const prefix = `https://storage.googleapis.com/${bucketName}/`;

    if (!publicUrl.startsWith(prefix)) return;

    const filePath = decodeURIComponent(publicUrl.slice(prefix.length));
    await bucket.file(filePath).delete();
  } catch {
    // Ignore failures — image already deleted or wrong URL format
  }
}
