// Size caps are checked here for a friendly early error and enforced by Cloud
// Storage through the signed `x-goog-content-length-range` header.
export { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from "./upload-limits";

/**
 * PUT a file directly to a Firebase Storage signed URL, reporting upload
 * progress. Uses XHR because `fetch` can't surface upload progress. The headers
 * must be exactly those returned with the signed URL (they are part of the
 * signature).
 */
export function putFileToSignedUrl(
  uploadUrl: string,
  headers: Record<string, string>,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    for (const [key, val] of Object.entries(headers)) {
      xhr.setRequestHeader(key, val);
    }
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("network error"));
    xhr.send(file);
  });
}
