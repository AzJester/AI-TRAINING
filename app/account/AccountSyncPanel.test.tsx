// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PROGRESS } from "../training-progress";
import {
  AccountSyncPanel,
  mergeCloudProgress,
  minimizeProgressForSync,
} from "./AccountSyncPanel";

describe("account sync privacy controls", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).includes("/api/account-sync")) {
          return Response.json(
            {
              signedIn: false,
              signInPath: "/signin-with-chatgpt?return_to=%2F",
            },
            { status: 401 },
          );
        }
        return Response.json({ error: "Not found" }, { status: 404 });
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("starts local-only and offers optional account sign-in", async () => {
    render(
      <AccountSyncPanel progress={DEFAULT_PROGRESS} onApplyProgress={vi.fn()} />,
    );

    expect(screen.getByText("Local only")).toBeTruthy();
    const signIn = await screen.findByRole("link", { name: /Sign in with ChatGPT/i });
    expect(signIn.getAttribute("href")).toBe(
      "/signin-with-chatgpt?return_to=%2F",
    );
    expect(
      screen.getByText(/No chat or model request is created/i),
    ).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("requires a separate explicit opt-in for anonymous counters", async () => {
    const user = userEvent.setup();
    render(
      <AccountSyncPanel progress={DEFAULT_PROGRESS} onApplyProgress={vi.fn()} />,
    );
    const checkbox = screen.getByRole("checkbox", {
      name: /Share anonymous usage counters/i,
    });
    expect((checkbox as HTMLInputElement).checked).toBe(false);

    await user.click(checkbox);
    await waitFor(() => expect((checkbox as HTMLInputElement).checked).toBe(true));
    expect(window.localStorage.getItem("ai-practice-lab-analytics-consent")).toBe(
      "enabled",
    );
  });

  it("does not upload progress merely because account sign-in completed", async () => {
    window.localStorage.setItem(
      "ai-practice-lab-sync-sign-in-pending",
      "pending",
    );
    const accountFetch = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        Response.json({
          signedIn: true,
          displayName: "Signed-in learner",
          progress: null,
          revision: 0,
        }),
    );
    vi.stubGlobal("fetch", accountFetch);

    render(
      <AccountSyncPanel progress={DEFAULT_PROGRESS} onApplyProgress={vi.fn()} />,
    );

    expect(
      await screen.findByRole("button", { name: /Sync with Signed-in learner/i }),
    ).toBeTruthy();
    await new Promise((resolve) => window.setTimeout(resolve, 1_000));
    expect(accountFetch).toHaveBeenCalledTimes(1);
    expect(accountFetch.mock.calls[0]?.[1]).toMatchObject({ cache: "no-store" });
    expect(window.localStorage.getItem("ai-practice-lab-sync-mode")).toBeNull();
  });

  it("acknowledges a cross-device deletion before explicit re-enable", async () => {
    window.localStorage.setItem("ai-practice-lab-sync-mode", "account");
    let accountPosts = 0;
    let reenableBody: Record<string, unknown> | null = null;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const path = String(input);
        if (path.includes("/api/cohorts")) {
          return Response.json({ owned: [], memberships: [] });
        }
        if (path.includes("/api/analytics")) {
          return Response.json({ error: "Restricted" }, { status: 403 });
        }
        if (path.includes("/api/account-sync") && init?.method === "POST") {
          accountPosts += 1;
          if (accountPosts === 1) {
            return Response.json(
              {
                error: "Cloud sync was deleted on another device.",
                syncDisabled: true,
                progress: { ...DEFAULT_PROGRESS, resetEpoch: 3 },
              },
              { status: 409 },
            );
          }
          reenableBody = JSON.parse(String(init.body)) as Record<string, unknown>;
          return Response.json({
            progress: { ...DEFAULT_PROGRESS, resetEpoch: 3 },
            revision: 1,
            syncEnabled: true,
          });
        }
        return Response.json({
          signedIn: true,
          displayName: "Signed-in learner",
          progress: null,
          revision: 0,
          syncEnabled: true,
        });
      }),
    );
    const applyProgress = vi.fn();
    const user = userEvent.setup();
    render(
      <AccountSyncPanel
        progress={DEFAULT_PROGRESS}
        onApplyProgress={applyProgress}
      />,
    );

    await screen.findByText(/remains local-only until you choose sync again/i, {}, {
      timeout: 2_500,
    });
    expect(accountPosts).toBe(1);
    const acknowledgement = applyProgress.mock.calls.at(-1)?.[0] as (
      current: typeof DEFAULT_PROGRESS,
    ) => typeof DEFAULT_PROGRESS;
    expect(acknowledgement(DEFAULT_PROGRESS).resetEpoch).toBe(3);

    await user.click(
      screen.getByRole("button", { name: /Sync with Signed-in learner/i }),
    );
    await waitFor(() => expect(accountPosts).toBe(2));
    expect(reenableBody).toMatchObject({
      enableSync: true,
      progress: { resetEpoch: 3 },
    });
  });

  it("never includes local names or task descriptions in sync data", () => {
    const local = {
      ...DEFAULT_PROGRESS,
      bookmarks: [
        "safe-data",
        "template:decision-brief",
        "use-case:proposal-review",
        "private bookmark text",
      ],
      profile: {
        name: "Private certificate name",
        role: "Cybersecurity & Information Assurance",
        confidence: 4,
        tasks: ["Private task description"],
      },
    };

    const minimized = minimizeProgressForSync(local);
    expect(minimized.profile).toEqual({
      name: "Learner",
      role: "Cybersecurity & Information Assurance",
      confidence: 4,
      tasks: [],
    });
    expect(JSON.stringify(minimized)).not.toContain("Private");
    expect(minimized.bookmarks).toEqual([
      "safe-data",
      "template:decision-brief",
      "use-case:proposal-review",
    ]);
  });

  it("restores cloud completion without replacing device-only profile fields", () => {
    const local = {
      ...DEFAULT_PROGRESS,
      profile: {
        name: "Device certificate name",
        role: "Systems Engineering & Integration",
        confidence: 2,
        tasks: ["Device-only task"],
      },
    };
    const cloud = {
      ...DEFAULT_PROGRESS,
      completedModules: ["beginner-clarify"],
      profile: {
        name: "Learner",
        role: "Cybersecurity & Information Assurance",
        confidence: 4,
        tasks: [],
      },
    };

    expect(mergeCloudProgress(local, cloud)).toMatchObject({
      completedModules: ["beginner-clarify"],
      profile: {
        name: "Device certificate name",
        role: "Cybersecurity & Information Assurance",
        confidence: 4,
        tasks: ["Device-only task"],
      },
    });
  });

  it("does not let a stale response undo newer local work or a reset", () => {
    const request = {
      ...DEFAULT_PROGRESS,
      bookmarks: ["template:decision-brief"],
    };
    const current = {
      ...DEFAULT_PROGRESS,
      completedModules: ["beginner-clarify"],
      bookmarks: [],
    };
    const cloud = {
      ...DEFAULT_PROGRESS,
      completedModules: ["beginner-limit"],
      bookmarks: [
        "template:decision-brief",
        "use-case:remote-recommendation",
      ],
    };

    expect(mergeCloudProgress(current, cloud, request)).toMatchObject({
      completedModules: ["beginner-limit", "beginner-clarify"],
      bookmarks: ["use-case:remote-recommendation"],
    });

    const locallyReset = { ...current, resetEpoch: 3, completedModules: [] };
    expect(mergeCloudProgress(locallyReset, cloud, request)).toBe(locallyReset);
  });
});
