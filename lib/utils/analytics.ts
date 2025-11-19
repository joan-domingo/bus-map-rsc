declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Track a custom event in Google Analytics
 * Only sends events if GA is loaded (not on localhost)
 */
export function trackEvent(
  eventName: string,
  eventParams?: Record<string, unknown>,
): void {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, eventParams);
  }
}

