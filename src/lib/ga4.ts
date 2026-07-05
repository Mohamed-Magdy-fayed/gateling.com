declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export function trackGaEvent(
  eventName: string,
  params?: Record<string, unknown>,
) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", eventName, params);
}
