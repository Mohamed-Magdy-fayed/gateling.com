declare global {
  interface Window {
    fbq: (
      action: "track" | "trackCustom" | "init",
      event: string,
      params?: Record<string, unknown>,
    ) => void;
  }
}

export function trackPixelEvent(
  eventName: string,
  params?: Record<string, unknown>,
) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", eventName, params);
}

export function trackCustomPixelEvent(
  eventName: string,
  params?: Record<string, unknown>,
) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("trackCustom", eventName, params);
}
