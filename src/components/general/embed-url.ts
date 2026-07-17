/**
 * Converts a third-party video URL (YouTube, Vimeo, Facebook, TikTok) into its
 * iframe-embeddable form. Returns "" for anything it doesn't recognize — an
 * unrecognized or non-http(s) scheme is never passed through to an iframe
 * `src`, so a self-hosted clip falls through to the native <video> path.
 *
 * This is a pure function with no React or browser dependency. It lives in its
 * own module (not a "use client" file) so both Server and Client Components can
 * call it directly — importing it from a client module made it a client-only
 * reference that crashed when invoked during server render.
 */
export function toEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    if (!/^https?:$/i.test(u.protocol)) return "";
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}?rel=0`;
      const shorts = u.pathname.match(/\/shorts\/([^/?]+)/);
      if (shorts?.[1])
        return `https://www.youtube.com/embed/${shorts[1]}?rel=0`;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1).split("?")[0];
      if (id) return `https://www.youtube.com/embed/${id}?rel=0`;
    }
    if (u.hostname === "vimeo.com" || u.hostname === "www.vimeo.com") {
      const id = u.pathname.slice(1);
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    if (u.hostname.includes("facebook.com") || u.hostname === "fb.watch") {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
    }
    if (u.hostname.includes("tiktok.com")) {
      const match = u.pathname.match(/\/video\/(\d+)/);
      if (match?.[1]) return `https://www.tiktok.com/embed/v2/${match[1]}`;
    }
  } catch {
    return "";
  }
  // No recognized host pattern matched (or an unsupported host) — never
  // pass an arbitrary string through to an iframe `src`.
  return "";
}

/**
 * Best-effort guess of a video's aspect orientation from its URL, so the
 * gallery/player can size the frame correctly without a stored orientation
 * field. Short-form formats (Reels, Shorts, TikTok) are vertical by design;
 * everything else defaults to landscape. A stored/explicit orientation, where
 * one exists, should take precedence over this heuristic.
 */
export function getVideoOrientation(url: string): "landscape" | "portrait" {
  try {
    const u = new URL(url);
    if (u.hostname.includes("tiktok.com")) return "portrait";
    // YouTube Shorts, Facebook/Instagram Reels.
    if (/\/(shorts|reels?)\//i.test(u.pathname)) return "portrait";
  } catch {
    return "landscape";
  }
  return "landscape";
}
