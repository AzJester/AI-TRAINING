// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ANALYTICS_CONSENT_KEY,
  analyticsConsentEnabled,
  setAnalyticsConsent,
  trackPrivacyEvent,
} from "./privacy-analytics";

describe("privacy analytics", () => {
  const sendBeacon = vi.fn(function sendBeaconMock(
    _url: string,
    _data?: BodyInit | null,
  ) {
    return true;
  });
  const readBlob = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(String(reader.result)));
      reader.addEventListener("error", () => reject(reader.error));
      reader.readAsText(blob);
    });

  beforeEach(() => {
    window.localStorage.clear();
    sendBeacon.mockClear();
    Object.defineProperty(navigator, "sendBeacon", {
      configurable: true,
      value: sendBeacon,
    });
  });

  it("does not transmit anything until the learner opts in", () => {
    trackPrivacyEvent("lesson_started", "beginner-clarify");
    expect(sendBeacon).not.toHaveBeenCalled();
    expect(analyticsConsentEnabled()).toBe(false);
  });

  it("records only a bounded event and context after consent", async () => {
    setAnalyticsConsent(true);
    trackPrivacyEvent("quiz_retried", "beginner-clarify");

    expect(window.localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe("enabled");
    expect(sendBeacon).toHaveBeenCalledOnce();
    const [url, blob] = sendBeacon.mock.calls[0];
    expect(url).toBe("/api/analytics");
    expect(JSON.parse(await readBlob(blob as Blob))).toEqual({
      event: "quiz_retried",
      context: "beginner-clarify",
    });
  });

  it("replaces an unsafe context instead of sending it", async () => {
    setAnalyticsConsent(true);
    trackPrivacyEvent("studio_opened", "private text with spaces");

    const blob = sendBeacon.mock.calls[0][1] as Blob;
    expect(JSON.parse(await readBlob(blob)).context).toBe("general");
  });
});
