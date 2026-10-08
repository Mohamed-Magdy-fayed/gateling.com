// Per-file size caps for direct-to-Firebase (signed-URL) uploads. Shared by the
// browser (early, friendly rejection) and the server, which signs the caps into
// the upload URL so Cloud Storage itself refuses anything larger.
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15MB
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100MB

/**
 * Signed extension header that makes Cloud Storage reject a PUT whose body is
 * outside the range. It is part of the v4 signature, so a client can't drop or
 * widen it, and the bucket CORS must allow it as a request header.
 */
export const CONTENT_LENGTH_RANGE_HEADER = "x-goog-content-length-range";

export function maxUploadBytes(contentType: string): number {
  return contentType.startsWith("video/") ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
}

/** Value for {@link CONTENT_LENGTH_RANGE_HEADER}: `0,<max bytes>`. */
export function contentLengthRange(contentType: string): string {
  return `0,${maxUploadBytes(contentType)}`;
}
