// Per-file size caps for direct-to-Firebase gallery/block uploads. Uploads go
// straight to Firebase Storage via a signed URL, so they aren't bound by the
// serverless request-body limit — but we still cap to keep assets sane.
// Enforced client-side (a signed PUT URL can't enforce size on its own).
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15MB
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100MB

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
