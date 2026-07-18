// @vitest-environment jsdom

import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TrainingApp } from "./TrainingApp";

const STORAGE_KEY = "ai-practice-lab-progress-v2";

beforeEach(() => {
  window.localStorage.clear();
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  window.requestAnimationFrame = (callback) => {
    callback(0);
    return 1;
  };
  window.cancelAnimationFrame = vi.fn();
  window.scrollTo = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AI Practice Lab learner behavior", () => {
  it("completes and restores a lesson through the real UI", async () => {
    const user = userEvent.setup();
    const firstRender = render(<TrainingApp />);
    const dialog = await screen.findByRole("dialog", {
      name: /Choose an AI learning path/i,
    });

    await user.selectOptions(
      within(dialog).getByRole("combobox"),
      "Cybersecurity & Information Assurance",
    );
    await user.type(
      within(dialog).getByRole("textbox", { name: /Name for your certificate/i }),
      "Review Test",
    );
    await user.click(within(dialog).getByRole("radio", { name: /Beginner/i }));
    await user.click(within(dialog).getByRole("button", { name: /Build my learning path/i }));

    await user.click(screen.getByRole("button", { name: /Start Beginner/i }));
    await user.click(screen.getByRole("button", { name: /Try it now/i }));

    const framingFields = screen.getAllByRole("textbox");
    expect(framingFields).toHaveLength(4);
    for (const field of framingFields) {
      await user.type(field, "Clear direction for this workplace task");
    }
    await user.click(screen.getByRole("button", { name: /Check my rewrite/i }));
    await user.click(
      screen.getByRole("button", { name: /Continue to knowledge check/i }),
    );

    await user.click(
      screen.getByRole("radio", {
        name: "Who will use the report, and what should they be able to decide?",
      }),
    );
    await user.click(
      screen.getByRole("radio", {
        name: /Create a five-bullet summary for the budget review/i,
      }),
    );
    await user.click(
      screen.getByRole("radio", {
        name: "The prompt did not define the intended outcome and success criteria.",
      }),
    );
    await user.click(screen.getByRole("button", { name: /Check my answers/i }));
    await user.click(screen.getByRole("button", { name: /Complete lesson/i }));

    expect(await screen.findByRole("heading", { name: "Task framing" })).toBeTruthy();
    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
      expect(stored.completedModules).toContain("beginner-clarify");
      expect(stored.currentTarget).toBe("beginner-clarify");
      expect(stored.currentStage).toBe(3);
    });

    firstRender.unmount();
    render(<TrainingApp />);

    expect(await screen.findByRole("heading", { name: "Task framing" })).toBeTruthy();
    expect(screen.getByText("Lesson 1 · Ready")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("resets learning records while retaining the learner profile", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        profile: {
          name: "Persistent Learner",
          role: "Cybersecurity & Information Assurance",
          confidence: 2,
          tasks: [],
        },
        selectedLevel: "beginner",
        completedModules: ["beginner-clarify"],
        completedCapstones: [],
        quizScores: { "beginner-clarify": 3 },
        studioCompleted: ["model-selector"],
        bookmarks: ["prompt-brief"],
        currentTarget: null,
        currentStage: 0,
        lastVisitedAt: null,
      }),
    );
    const user = userEvent.setup();
    render(<TrainingApp />);

    await user.click(await screen.findByRole("button", { name: "Reset to 0" }));
    await user.click(screen.getByRole("button", { name: /Yes, reset to 0/i }));

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
      expect(stored.profile.name).toBe("Persistent Learner");
      expect(stored.completedModules).toEqual([]);
      expect(stored.quizScores).toEqual({});
      expect(stored.studioCompleted).toEqual([]);
      expect(stored.bookmarks).toEqual([]);
    });
    expect(screen.getByText("0 of 6 learning milestones ready")).toBeTruthy();
  });
});
