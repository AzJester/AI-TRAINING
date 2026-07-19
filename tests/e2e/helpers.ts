import type { Page } from "@playwright/test";

type TrainingLevelId = "beginner" | "intermediate" | "advanced";

export const STORAGE_KEY = "ai-practice-lab-progress-v2";

interface ProgressOptions {
  selectedLevel?: TrainingLevelId;
  completedModules?: string[];
  completedCapstones?: string[];
  quizScores?: Record<string, number>;
  currentTarget?: string | null;
  currentStage?: number;
}

export function progressFixture(options: ProgressOptions = {}) {
  return {
    version: 2,
    profile: {
      name: "Playwright Learner",
      role: "Cybersecurity & Information Assurance",
      confidence: 3,
      tasks: ["Research, analysis & data"],
    },
    selectedLevel: options.selectedLevel ?? "beginner",
    completedModules: options.completedModules ?? [],
    completedCapstones: options.completedCapstones ?? [],
    quizScores: options.quizScores ?? {},
    studioCompleted: [],
    bookmarks: [],
    currentTarget: options.currentTarget ?? null,
    currentStage: options.currentStage ?? 0,
    lastVisitedAt: null,
  };
}

export async function openWithProgress(
  page: Page,
  options: ProgressOptions = {},
) {
  const progress = progressFixture(options);
  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, JSON.stringify(value));
    },
    { key: STORAGE_KEY, value: progress },
  );
  await page.goto("/", { waitUntil: "domcontentloaded" });
}
