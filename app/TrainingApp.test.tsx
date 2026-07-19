import { readFile } from "node:fs/promises";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TrainingApp } from "./TrainingApp";
import {
  ALL_CAPSTONES,
  ALL_COURSE_MODULES,
  TRAINING_LEVELS,
} from "./training-data";

const EXPECTED_LEVELS = [
  {
    id: "beginner",
    name: "Beginner",
    title: "Use AI with confidence",
  },
  {
    id: "intermediate",
    name: "Intermediate",
    title: "Build reliable AI workflows",
  },
  {
    id: "advanced",
    name: "Advanced",
    title: "Govern and scale AI systems",
  },
] as const;

const TRAINING_APP_SOURCE = new URL("./TrainingApp.tsx", import.meta.url);
const ONBOARDING_SOURCE = new URL(
  "./training/onboarding.tsx",
  import.meta.url,
);
const PROGRESS_PAGE_SOURCE = new URL(
  "./training/progress-page.tsx",
  import.meta.url,
);
const GLOBALS_CSS_SOURCE = new URL("./globals.css", import.meta.url);
const USER_FACING_SOURCE_FILES = [
  TRAINING_APP_SOURCE,
  ONBOARDING_SOURCE,
  PROGRESS_PAGE_SOURCE,
  new URL("./training/dashboard.tsx", import.meta.url),
  new URL("./training/lesson-player.tsx", import.meta.url),
  new URL("./training/practice-exercises.tsx", import.meta.url),
  new URL("./training/quiz-panel.tsx", import.meta.url),
  new URL("./training/completion-panel.tsx", import.meta.url),
  new URL("./training/capstone-player.tsx", import.meta.url),
  new URL("./training/practice-library.tsx", import.meta.url),
  new URL("./training/resources-page.tsx", import.meta.url),
  new URL("./training-data.ts", import.meta.url),
  new URL("./layout.tsx", import.meta.url),
  GLOBALS_CSS_SOURCE,
  new URL("./training/styles/dashboard.css", import.meta.url),
  new URL("./training/styles/standard-pages.css", import.meta.url),
  new URL("./training/styles/practice.css", import.meta.url),
  new URL("./training/styles/lesson.css", import.meta.url),
  new URL("./training/styles/practice-exercises.css", import.meta.url),
  new URL("./training/styles/quiz-and-completion.css", import.meta.url),
  new URL("./training/styles/capstone.css", import.meta.url),
  new URL("./training/styles/progress.css", import.meta.url),
  new URL("./training/styles/resources.css", import.meta.url),
  new URL("./training/styles/onboarding.css", import.meta.url),
  new URL("../README.md", import.meta.url),
];

describe("AI Practice Lab training levels", () => {
  it("provides 15 lessons and three capstones across three levels", () => {
    expect(TRAINING_LEVELS).toHaveLength(3);
    expect(ALL_COURSE_MODULES).toHaveLength(15);
    expect(ALL_CAPSTONES).toHaveLength(3);

    for (const expected of EXPECTED_LEVELS) {
      const level = TRAINING_LEVELS.find((item) => item.id === expected.id);

      expect(level).toMatchObject({
        id: expected.id,
        name: expected.name,
        title: expected.title,
        minutes: 60,
        moduleCount: 5,
      });
      expect(level?.modules).toHaveLength(5);
      expect(level?.modules.every((module) => module.levelId === expected.id)).toBe(
        true,
      );
      expect(level?.capstone.levelId).toBe(expected.id);
    }
  });

  it("renders every level with an independent progress indicator", () => {
    const html = renderToStaticMarkup(<TrainingApp />);

    for (const level of EXPECTED_LEVELS) {
      expect(html).toContain(level.name);
      expect(html).toContain(level.title);
    }

    expect(html.match(/name="training-level"/g)).toHaveLength(3);
    expect(html.match(/class="level-option-progress"/g)).toHaveLength(3);
    expect(html).toContain("Beginner progress");
  });

  it("renders the creator attribution", () => {
    const html = renderToStaticMarkup(<TrainingApp />);

    expect(html).toContain("Created by Dr Shane Turner");
    expect(html).toContain("Version 2.1.0");
    expect(html).toContain("Updated July 18, 2026");
    expect(html).toContain("© 2026 Dr Shane Turner. All rights reserved.");
  });

  it("keeps each capstone locked until its five lessons are complete", () => {
    for (const level of TRAINING_LEVELS) {
      expect(level.modules).toHaveLength(5);
    }

    const html = renderToStaticMarkup(<TrainingApp />);
    expect(html).toMatch(
      /<button class="button button-dark" type="button" disabled="">\s*Complete lessons first\s*<\/button>/,
    );
  });

  it("keeps the page inert and moves focus into the onboarding dialog", async () => {
    const appSource = await readFile(TRAINING_APP_SOURCE, "utf8");
    const onboardingSource = await readFile(ONBOARDING_SOURCE, "utf8");

    expect(appSource).toMatch(
      /className="app-shell"\s+inert=\{hydrated && !progress\.profile \? true : undefined\}/,
    );
    expect(onboardingSource).toMatch(
      /className="onboarding-dialog"\s+role="dialog"\s+aria-modal="true"/,
    );
    expect(onboardingSource).toMatch(/roleSelectRef\.current\?\.focus\(\)/);
    expect(onboardingSource).toMatch(/<select\s+ref=\{roleSelectRef\}/);
  });

  it("preserves prior Skills progress while moving into the expanded pathway", async () => {
    const source = await readFile(PROGRESS_PAGE_SOURCE, "utf8");
    const progressSource = await readFile(
      new URL("./training-progress.ts", import.meta.url),
      "utf8",
    );

    expect(progressSource).toContain('studioCompleted.includes("codex-skills")');
    expect(progressSource).toContain(
      'studioCompleted.push("chatgpt-skills-beginner")',
    );
    expect(source).toContain('"chatgpt-skills"');
    expect(source).toContain('studioCompleted.includes("codex-skills")');
    expect(source).toContain("currentCreatorCompleted + legacySkillsCredit");
  });

  it("keeps the onboarding brand mark in normal flow at mobile and tablet widths", async () => {
    const source = await readFile(GLOBALS_CSS_SOURCE, "utf8");
    const mobileRule = source.match(
      /@media \(max-width:\s*840px\)\s*\{([\s\S]*?)@media \(max-width:\s*540px\)/,
    )?.[1];

    expect(mobileRule).toBeDefined();
    expect(mobileRule).toMatch(
      /\.onboarding-aside \.brand-mark\s*\{[^}]*position:\s*static;[^}]*flex-basis:\s*58px;[^}]*margin-bottom:\s*18px;/,
    );
  });

  it("keeps removed company branding out of rendered markup and user-facing source", async () => {
    const removedBrand = ["ast", "rion"].join("");
    const html = renderToStaticMarkup(<TrainingApp />);
    expect(html.toLowerCase()).not.toContain(removedBrand);

    for (const file of USER_FACING_SOURCE_FILES) {
      const source = await readFile(file, "utf8");
      expect(
        source.toLowerCase(),
        `${file.pathname} contains removed company branding`,
      ).not.toContain(removedBrand);
    }
  });

  it("keeps em dashes out of user-facing source and documentation", async () => {
    for (const file of USER_FACING_SOURCE_FILES) {
      const source = await readFile(file, "utf8");
      expect(source, `${file.pathname} contains an em dash`).not.toContain("\u2014");
    }
  });
});
