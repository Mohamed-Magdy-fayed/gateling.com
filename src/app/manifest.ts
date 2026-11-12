import type { MetadataRoute } from "next";

/**
 * Web app manifest. Its job today is the Discovery **Web Share Target**:
 * once Gateling is installed on an Android phone (Chrome → Add to Home
 * screen), it appears in the Facebook / Instagram share sheet, and sharing a
 * post or profile opens `/discovery/log` with the link and text pre-filled.
 *
 * GET only (links and text). Sharing screenshots would need a POST target and
 * a service worker; that is a later step. iOS Safari does not support share
 * targets at all. See docs/designs/discovery-module.md.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gateling",
    short_name: "Gateling",
    description: "Gateling: workspace and discovery log.",
    start_url: "/discovery/log",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    share_target: {
      action: "/discovery/log",
      method: "GET",
      params: { title: "title", text: "text", url: "url" },
    },
  };
}
