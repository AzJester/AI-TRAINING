export const ANALYTICS_CONSENT_KEY = "ai-practice-lab-analytics-consent";

export type PrivacyEvent =
  | "onboarding_completed"
  | "lesson_started"
  | "lesson_abandoned"
  | "quiz_retried"
  | "studio_opened"
  | "studio_activity_completed";

export function analyticsConsentEnabled(): boolean {
  return (
    typeof window !== "undefined" &&
    window.localStorage.getItem(ANALYTICS_CONSENT_KEY) === "enabled"
  );
}

export function setAnalyticsConsent(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    ANALYTICS_CONSENT_KEY,
    enabled ? "enabled" : "disabled",
  );
}

export function trackPrivacyEvent(event: PrivacyEvent, context = "general"): void {
  if (!analyticsConsentEnabled()) return;
  const payload = JSON.stringify({
    event,
    context: /^[a-z0-9-]{1,80}$/.test(context) ? context : "general",
  });
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      "/api/analytics",
      new Blob([payload], { type: "application/json" }),
    );
    return;
  }
  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  });
}
