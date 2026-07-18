import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROGRESS,
  LEGACY_STORAGE_KEY,
  STORAGE_KEY,
  readProgress,
} from "./training-progress";

function storageWith(entries: Record<string, string>): Storage {
  const values = new Map(Object.entries(entries));
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => values.set(key, value),
  };
}

describe("training progress storage", () => {
  it("returns clean defaults for absent, malformed, or unknown data", () => {
    expect(readProgress(undefined)).toEqual(DEFAULT_PROGRESS);
    expect(readProgress(storageWith({ [STORAGE_KEY]: "not-json" }))).toEqual(
      DEFAULT_PROGRESS,
    );
    expect(
      readProgress(storageWith({ [STORAGE_KEY]: JSON.stringify({ version: 99 }) })),
    ).toEqual(DEFAULT_PROGRESS);
  });

  it("migrates version 1 lesson, capstone, score, and target records", () => {
    const progress = readProgress(
      storageWith({
        [LEGACY_STORAGE_KEY]: JSON.stringify({
          version: 1,
          profile: {
            name: " Legacy Learner ",
            role: "Cybersecurity & Information Assurance",
            confidence: 2,
            tasks: [],
          },
          completedModules: ["clarify", "unknown"],
          capstoneComplete: true,
          quizScores: { clarify: 3 },
          currentTarget: "clarify",
        }),
      }),
    );

    expect(progress.profile?.name).toBe("Legacy Learner");
    expect(progress.completedModules).toEqual(["beginner-clarify"]);
    expect(progress.completedCapstones).toEqual(["beginner-capstone"]);
    expect(progress.quizScores).toEqual({ "beginner-clarify": 3 });
    expect(progress.currentTarget).toBe("beginner-clarify");
  });

  it("drops unknown course IDs and restores a valid active lesson stage", () => {
    const progress = readProgress(
      storageWith({
        [STORAGE_KEY]: JSON.stringify({
          version: 2,
          profile: {
            name: "Learner",
            role: "not-a-role",
            confidence: 3,
            tasks: [],
          },
          selectedLevel: "advanced",
          completedModules: ["beginner-clarify", "unknown"],
          completedCapstones: ["unknown"],
          quizScores: { "beginner-clarify": 3 },
          studioCompleted: ["codex-skills"],
          bookmarks: ["brief", "brief"],
          currentTarget: "beginner-clarify",
          currentStage: 12,
          lastVisitedAt: null,
        }),
      }),
    );

    expect(progress.selectedLevel).toBe("beginner");
    expect(progress.completedModules).toEqual(["beginner-clarify"]);
    expect(progress.completedCapstones).toEqual([]);
    expect(progress.currentStage).toBe(3);
    expect(progress.studioCompleted).toContain("chatgpt-skills-beginner");
    expect(progress.bookmarks).toEqual(["brief"]);
  });
});
