import { describe, expect, it } from "vitest";
import {
  ALL_CAPSTONES,
  ALL_COURSE_MODULES,
  CLEAR_STEPS,
  COURSE,
  RESOURCES,
  TRAINING_LEVELS,
} from "../training-data";
import {
  ContentValidationError,
  parseCapstone,
  parseCourseDocument,
  parseCourseModules,
  validateCurriculum,
} from "./schema";

function courseDocument() {
  return {
    course: structuredClone(COURSE),
    clearSteps: structuredClone(CLEAR_STEPS),
    levels: TRAINING_LEVELS.map(({ modules: _modules, capstone: _capstone, ...level }) =>
      structuredClone(level),
    ),
  };
}

describe("training content loader", () => {
  it("assembles the independently maintained content packages", () => {
    expect(TRAINING_LEVELS).toHaveLength(COURSE.levelCount);
    expect(ALL_COURSE_MODULES).toHaveLength(COURSE.moduleCount);
    expect(ALL_CAPSTONES).toHaveLength(COURSE.levelCount);
    expect(
      ALL_CAPSTONES.reduce((minutes, capstone) => minutes + capstone.minutes, 0),
    ).toBe(COURSE.capstoneMinutes);

    for (const level of TRAINING_LEVELS) {
      expect(level.modules).toHaveLength(level.moduleCount);
      expect(level.modules.every((module) => module.levelId === level.id)).toBe(
        true,
      );
      expect(level.capstone.levelId).toBe(level.id);
    }
  });

  it("rejects unknown fields with an actionable JSON path", () => {
    const document = courseDocument() as ReturnType<typeof courseDocument> & {
      typo?: string;
    };
    document.typo = "not allowed";

    expect(() => parseCourseDocument(document)).toThrowError(
      new ContentValidationError("content/course.json.typo", "unknown field"),
    );
  });

  it("rejects a quiz whose answer does not name one of its options", () => {
    const module = structuredClone(ALL_COURSE_MODULES[0]);
    module.quiz[0].correctOptionId = "missing-option";

    expect(() =>
      parseCourseModules(
        [module],
        module.levelId,
        "content/levels/test/modules.json",
      ),
    ).toThrow(/quiz\[0\]\.correctOptionId: must match an option id/);
  });

  it("rejects content placed in the wrong level package", () => {
    expect(() =>
      parseCourseModules(
        [structuredClone(ALL_COURSE_MODULES[0])],
        "advanced",
        "content/levels/advanced/modules.json",
      ),
    ).toThrow(/expected "advanced", received "beginner"/);
  });

  it("rejects a capstone that omits a CLEAR stage", () => {
    const capstone = structuredClone(ALL_CAPSTONES[0]);
    capstone.stages = capstone.stages.slice(0, -1);

    expect(() =>
      parseCapstone(
        capstone,
        capstone.levelId,
        "content/levels/test/capstone.json",
      ),
    ).toThrow(/capstone\.json\.stages: must contain each CLEAR step exactly once \(missing: refine\)/);
  });

  it("rejects a level that repeats one CLEAR lesson step", () => {
    const levels = structuredClone(TRAINING_LEVELS);
    levels[0].modules[4].clearStep = levels[0].modules[0].clearStep;

    expect(() =>
      validateCurriculum({
        course: COURSE,
        clearSteps: CLEAR_STEPS,
        levels,
        resources: RESOURCES,
      }),
    ).toThrow(/levels\.beginner\.modules: must contain each CLEAR step exactly once \(missing: refine; repeated: clarify\)/);
  });

  it("rejects inconsistent course totals", () => {
    const course = { ...COURSE, moduleCount: COURSE.moduleCount + 1 };

    expect(() =>
      validateCurriculum({
        course,
        clearSteps: CLEAR_STEPS,
        levels: TRAINING_LEVELS,
        resources: RESOURCES,
      }),
    ).toThrow(/declares 16, but 15 modules were loaded/);
  });
});
