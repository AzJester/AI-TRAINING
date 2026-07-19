import { readFileSync } from "node:fs";

export const EXPECTED_PRACTICE_TYPES = [
  "rewrite-lab",
  "risk-sort",
  "context-builder",
  "verification-check",
  "action-plan",
] as const;

export type PracticeType = (typeof EXPECTED_PRACTICE_TYPES)[number];

export type TrainingLevelId =
  | "beginner"
  | "intermediate"
  | "advanced";

interface RewritePractice {
  type: "rewrite-lab";
  fields: Array<{ id: string }>;
}

interface ContextBuilderPractice {
  type: "context-builder";
  fields: Array<{ id: string }>;
}

interface RiskSortPractice {
  type: "risk-sort";
  items: Array<{ answer: string }>;
}

interface VerificationPractice {
  type: "verification-check";
  claims: Array<{ answer: string }>;
}

interface ActionPlanPractice {
  type: "action-plan";
  concerns: Array<{ id: string }>;
  planPrompts: Array<{ id: string }>;
}

export type TestPractice =
  | RewritePractice
  | ContextBuilderPractice
  | RiskSortPractice
  | VerificationPractice
  | ActionPlanPractice;

export interface TestModule {
  id: string;
  title: string;
  practice: TestPractice;
}

export interface TestCapstone {
  id: string;
  levelId: TrainingLevelId;
  title: string;
  stages: Array<{ step: string }>;
  rubric: Array<{ id: string }>;
}

export interface TestLevelContent {
  id: TrainingLevelId;
  modules: TestModule[];
  capstone: TestCapstone;
}

export interface TestCapstoneVariant extends TestLevelContent {
  interactionSignature: string;
}

function readJson<T>(relativePath: string): T {
  const fileUrl = new URL(relativePath, import.meta.url);
  return JSON.parse(readFileSync(fileUrl, "utf8")) as T;
}

const courseDocument = readJson<{
  levels: Array<{ id: TrainingLevelId }>;
}>("../../content/course.json");
const TRAINING_LEVEL_IDS = courseDocument.levels.map((level) => level.id);

function loadLevel(id: TrainingLevelId): TestLevelContent {
  return {
    id,
    modules: readJson<TestModule[]>(`../../content/levels/${id}/modules.json`),
    capstone: readJson<TestCapstone>(`../../content/levels/${id}/capstone.json`),
  };
}

export const TEST_LEVELS = TRAINING_LEVEL_IDS.map(loadLevel);
export const ALL_TEST_MODULES = TEST_LEVELS.flatMap((level) => level.modules);

const discoveredPracticeTypes = new Set(
  ALL_TEST_MODULES.map((module) => String(module.practice.type)),
);
const unsupportedPracticeTypes = [...discoveredPracticeTypes].filter(
  (type) => !EXPECTED_PRACTICE_TYPES.includes(type as PracticeType),
);
if (unsupportedPracticeTypes.length) {
  throw new Error(
    `Playwright needs coverage for new practice type(s): ${unsupportedPracticeTypes.join(", ")}`,
  );
}

export const LESSON_TYPE_EXAMPLES = EXPECTED_PRACTICE_TYPES.map((type) => {
  const module = ALL_TEST_MODULES.find((candidate) => candidate.practice.type === type);
  if (!module) {
    throw new Error(`No curriculum lesson exercises the required practice type: ${type}`);
  }
  return module;
});

function capstoneInteractionSignature(capstone: TestCapstone): string {
  return JSON.stringify({
    stages: capstone.stages.map((stage) => stage.step),
    rubricItems: capstone.rubric.length,
  });
}

const seenCapstoneSignatures = new Set<string>();
export const CAPSTONE_VARIANTS = TEST_LEVELS.flatMap((level) => {
  const interactionSignature = capstoneInteractionSignature(level.capstone);
  if (seenCapstoneSignatures.has(interactionSignature)) return [];
  seenCapstoneSignatures.add(interactionSignature);
  return [{ ...level, interactionSignature } satisfies TestCapstoneVariant];
});

const beginnerLevel = TEST_LEVELS.find((level) => level.id === "beginner");
if (!beginnerLevel) throw new Error("The beginner curriculum package is missing.");

export const BEGINNER_MODULES = beginnerLevel.modules;
export const BEGINNER_CAPSTONE = beginnerLevel.capstone;
