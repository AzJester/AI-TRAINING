import type {
  ActionPlanPractice,
  BuilderField,
  CapstoneScenario,
  ClearStep,
  ClearStepKey,
  Concept,
  ContextBuilderPractice,
  CourseContentDocument,
  CourseMetadata,
  CourseModule,
  PracticeExercise,
  QuizQuestion,
  ResourceItem,
  RewriteLabPractice,
  RiskSortPractice,
  TrainingLevel,
  TrainingLevelDefinition,
  TrainingLevelId,
  VerificationCheckPractice,
} from "./types";

type JsonRecord = Record<string, unknown>;

const CLEAR_STEP_KEYS = [
  "clarify",
  "limit",
  "engineer",
  "assess",
  "refine",
] as const satisfies readonly ClearStepKey[];

const LEVEL_IDS = [
  "beginner",
  "intermediate",
  "advanced",
] as const satisfies readonly TrainingLevelId[];

const PRACTICE_TYPES = [
  "rewrite-lab",
  "risk-sort",
  "context-builder",
  "verification-check",
  "action-plan",
] as const;

export class ContentValidationError extends Error {
  constructor(path: string, message: string) {
    super(`Invalid training content at ${path}: ${message}`);
    this.name = "ContentValidationError";
  }
}

function fail(path: string, message: string): never {
  throw new ContentValidationError(path, message);
}

function record(value: unknown, path: string): JsonRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(path, "expected an object");
  }
  return value as JsonRecord;
}

function nonEmptyString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    fail(path, "expected a non-empty string");
  }
  return value;
}

function positiveInteger(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    fail(path, "expected a positive integer");
  }
  return value;
}

function booleanValue(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") {
    fail(path, "expected a boolean");
  }
  return value;
}

function enumValue<const T extends readonly string[]>(
  value: unknown,
  values: T,
  path: string,
): T[number] {
  if (typeof value !== "string" || !values.includes(value)) {
    fail(path, `expected one of: ${values.join(", ")}`);
  }
  return value;
}

function list<T>(
  value: unknown,
  path: string,
  validate: (item: unknown, itemPath: string) => T,
  options: { allowEmpty?: boolean } = {},
): T[] {
  if (!Array.isArray(value)) {
    fail(path, "expected an array");
  }
  if (!options.allowEmpty && value.length === 0) {
    fail(path, "must contain at least one item");
  }
  return value.map((item, index) => validate(item, `${path}[${index}]`));
}

function stringList(value: unknown, path: string): string[] {
  return list(value, path, nonEmptyString);
}

function assertKeys(
  value: JsonRecord,
  path: string,
  required: readonly string[],
  optional: readonly string[] = [],
): void {
  const allowed = new Set([...required, ...optional]);
  for (const key of required) {
    if (!(key in value)) {
      fail(`${path}.${key}`, "required field is missing");
    }
  }
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      fail(`${path}.${key}`, "unknown field");
    }
  }
}

function assertUnique<T>(
  items: readonly T[],
  path: string,
  key: (item: T) => string,
): void {
  const seen = new Set<string>();
  for (const item of items) {
    const id = key(item);
    if (seen.has(id)) {
      fail(path, `duplicate identifier "${id}"`);
    }
    seen.add(id);
  }
}

function assertExactClearSteps(
  steps: readonly ClearStepKey[],
  path: string,
): void {
  const counts = new Map<ClearStepKey, number>(
    CLEAR_STEP_KEYS.map((step) => [step, 0]),
  );
  for (const step of steps) {
    counts.set(step, (counts.get(step) ?? 0) + 1);
  }

  const missing = CLEAR_STEP_KEYS.filter((step) => counts.get(step) === 0);
  const repeated = CLEAR_STEP_KEYS.filter((step) => (counts.get(step) ?? 0) > 1);
  if (steps.length !== CLEAR_STEP_KEYS.length || missing.length || repeated.length) {
    const details = [
      missing.length ? `missing: ${missing.join(", ")}` : "",
      repeated.length ? `repeated: ${repeated.join(", ")}` : "",
    ].filter(Boolean);
    fail(
      path,
      `must contain each CLEAR step exactly once${details.length ? ` (${details.join("; ")})` : ""}`,
    );
  }
}

function parseBuilderField(value: unknown, path: string): BuilderField {
  const item = record(value, path);
  assertKeys(item, path, ["id", "label", "prompt", "placeholder"]);
  nonEmptyString(item.id, `${path}.id`);
  nonEmptyString(item.label, `${path}.label`);
  nonEmptyString(item.prompt, `${path}.prompt`);
  nonEmptyString(item.placeholder, `${path}.placeholder`);
  return item as unknown as BuilderField;
}

function parseConcept(value: unknown, path: string): Concept {
  const item = record(value, path);
  assertKeys(item, path, ["title", "body"], ["example"]);
  nonEmptyString(item.title, `${path}.title`);
  nonEmptyString(item.body, `${path}.body`);
  if (item.example !== undefined) {
    nonEmptyString(item.example, `${path}.example`);
  }
  return item as unknown as Concept;
}

function parseQuizQuestion(value: unknown, path: string): QuizQuestion {
  const item = record(value, path);
  assertKeys(
    item,
    path,
    ["id", "prompt", "options", "correctOptionId", "explanation"],
    ["critical"],
  );
  nonEmptyString(item.id, `${path}.id`);
  nonEmptyString(item.prompt, `${path}.prompt`);
  const options = list(item.options, `${path}.options`, (option, optionPath) => {
    const optionRecord = record(option, optionPath);
    assertKeys(optionRecord, optionPath, ["id", "text", "feedback"]);
    nonEmptyString(optionRecord.id, `${optionPath}.id`);
    nonEmptyString(optionRecord.text, `${optionPath}.text`);
    nonEmptyString(optionRecord.feedback, `${optionPath}.feedback`);
    return optionRecord as unknown as QuizQuestion["options"][number];
  });
  assertUnique(options, `${path}.options`, (option) => option.id);
  const correctOptionId = nonEmptyString(
    item.correctOptionId,
    `${path}.correctOptionId`,
  );
  if (!options.some((option) => option.id === correctOptionId)) {
    fail(`${path}.correctOptionId`, "must match an option id");
  }
  if (item.critical !== undefined) {
    booleanValue(item.critical, `${path}.critical`);
  }
  nonEmptyString(item.explanation, `${path}.explanation`);
  return item as unknown as QuizQuestion;
}

const PRACTICE_BASE_KEYS = [
  "id",
  "type",
  "eyebrow",
  "title",
  "estimatedMinutes",
  "instructions",
  "scenario",
] as const;

function validatePracticeBase(item: JsonRecord, path: string): void {
  nonEmptyString(item.id, `${path}.id`);
  nonEmptyString(item.eyebrow, `${path}.eyebrow`);
  nonEmptyString(item.title, `${path}.title`);
  positiveInteger(item.estimatedMinutes, `${path}.estimatedMinutes`);
  stringList(item.instructions, `${path}.instructions`);
  nonEmptyString(item.scenario, `${path}.scenario`);
}

function parsePractice(value: unknown, path: string): PracticeExercise {
  const item = record(value, path);
  const type = enumValue(item.type, PRACTICE_TYPES, `${path}.type`);

  switch (type) {
    case "rewrite-lab": {
      assertKeys(item, path, [
        ...PRACTICE_BASE_KEYS,
        "starterPrompt",
        "fields",
        "successChecks",
        "modelAnswer",
      ]);
      validatePracticeBase(item, path);
      nonEmptyString(item.starterPrompt, `${path}.starterPrompt`);
      const fields = list(item.fields, `${path}.fields`, parseBuilderField);
      assertUnique(fields, `${path}.fields`, (field) => field.id);
      stringList(item.successChecks, `${path}.successChecks`);
      nonEmptyString(item.modelAnswer, `${path}.modelAnswer`);
      return item as unknown as RewriteLabPractice;
    }
    case "risk-sort": {
      assertKeys(item, path, [
        ...PRACTICE_BASE_KEYS,
        "categories",
        "items",
        "debrief",
      ]);
      validatePracticeBase(item, path);
      const categories = list(
        item.categories,
        `${path}.categories`,
        (category, categoryPath) => {
          const categoryRecord = record(category, categoryPath);
          assertKeys(categoryRecord, categoryPath, [
            "id",
            "label",
            "description",
          ]);
          enumValue(
            categoryRecord.id,
            ["ready", "pause", "restricted"] as const,
            `${categoryPath}.id`,
          );
          nonEmptyString(categoryRecord.label, `${categoryPath}.label`);
          nonEmptyString(
            categoryRecord.description,
            `${categoryPath}.description`,
          );
          return categoryRecord as unknown as RiskSortPractice["categories"][number];
        },
      );
      assertUnique(categories, `${path}.categories`, (category) => category.id);
      const items = list(item.items, `${path}.items`, (riskItem, itemPath) => {
        const riskRecord = record(riskItem, itemPath);
        assertKeys(riskRecord, itemPath, [
          "id",
          "text",
          "detail",
          "answer",
          "feedback",
        ]);
        nonEmptyString(riskRecord.id, `${itemPath}.id`);
        nonEmptyString(riskRecord.text, `${itemPath}.text`);
        nonEmptyString(riskRecord.detail, `${itemPath}.detail`);
        const answer = enumValue(
          riskRecord.answer,
          ["ready", "pause", "restricted"] as const,
          `${itemPath}.answer`,
        );
        if (!categories.some((category) => category.id === answer)) {
          fail(`${itemPath}.answer`, "must match a declared category");
        }
        nonEmptyString(riskRecord.feedback, `${itemPath}.feedback`);
        return riskRecord as unknown as RiskSortPractice["items"][number];
      });
      assertUnique(items, `${path}.items`, (riskItem) => riskItem.id);
      nonEmptyString(item.debrief, `${path}.debrief`);
      return item as unknown as RiskSortPractice;
    }
    case "context-builder": {
      assertKeys(item, path, [
        ...PRACTICE_BASE_KEYS,
        "sourceNotes",
        "fields",
        "successChecks",
        "modelAnswer",
      ]);
      validatePracticeBase(item, path);
      stringList(item.sourceNotes, `${path}.sourceNotes`);
      const fields = list(item.fields, `${path}.fields`, parseBuilderField);
      assertUnique(fields, `${path}.fields`, (field) => field.id);
      stringList(item.successChecks, `${path}.successChecks`);
      nonEmptyString(item.modelAnswer, `${path}.modelAnswer`);
      return item as unknown as ContextBuilderPractice;
    }
    case "verification-check": {
      assertKeys(item, path, [
        ...PRACTICE_BASE_KEYS,
        "sourcePack",
        "draft",
        "claims",
        "improvedDraft",
      ]);
      validatePracticeBase(item, path);
      stringList(item.sourcePack, `${path}.sourcePack`);
      nonEmptyString(item.draft, `${path}.draft`);
      const claims = list(item.claims, `${path}.claims`, (claim, claimPath) => {
        const claimRecord = record(claim, claimPath);
        assertKeys(claimRecord, claimPath, [
          "id",
          "text",
          "answer",
          "feedback",
        ]);
        nonEmptyString(claimRecord.id, `${claimPath}.id`);
        nonEmptyString(claimRecord.text, `${claimPath}.text`);
        enumValue(
          claimRecord.answer,
          ["supported", "unsupported", "needs-context"] as const,
          `${claimPath}.answer`,
        );
        nonEmptyString(claimRecord.feedback, `${claimPath}.feedback`);
        return claimRecord as unknown as VerificationCheckPractice["claims"][number];
      });
      assertUnique(claims, `${path}.claims`, (claim) => claim.id);
      nonEmptyString(item.improvedDraft, `${path}.improvedDraft`);
      return item as unknown as VerificationCheckPractice;
    }
    case "action-plan": {
      assertKeys(item, path, [
        ...PRACTICE_BASE_KEYS,
        "aiDraft",
        "concerns",
        "planPrompts",
        "modelPlan",
      ]);
      validatePracticeBase(item, path);
      nonEmptyString(item.aiDraft, `${path}.aiDraft`);
      const concerns = list(
        item.concerns,
        `${path}.concerns`,
        (concern, concernPath) => {
          const concernRecord = record(concern, concernPath);
          assertKeys(concernRecord, concernPath, ["id", "text", "category"]);
          nonEmptyString(concernRecord.id, `${concernPath}.id`);
          nonEmptyString(concernRecord.text, `${concernPath}.text`);
          enumValue(
            concernRecord.category,
            ["accuracy", "judgment", "tone", "policy"] as const,
            `${concernPath}.category`,
          );
          return concernRecord as unknown as ActionPlanPractice["concerns"][number];
        },
      );
      assertUnique(concerns, `${path}.concerns`, (concern) => concern.id);
      const planPrompts = list(
        item.planPrompts,
        `${path}.planPrompts`,
        (prompt, promptPath) => {
          const promptRecord = record(prompt, promptPath);
          assertKeys(promptRecord, promptPath, ["id", "label", "placeholder"]);
          nonEmptyString(promptRecord.id, `${promptPath}.id`);
          nonEmptyString(promptRecord.label, `${promptPath}.label`);
          nonEmptyString(promptRecord.placeholder, `${promptPath}.placeholder`);
          return promptRecord as unknown as ActionPlanPractice["planPrompts"][number];
        },
      );
      assertUnique(planPrompts, `${path}.planPrompts`, (prompt) => prompt.id);
      stringList(item.modelPlan, `${path}.modelPlan`);
      return item as unknown as ActionPlanPractice;
    }
  }
}

function parseCourseMetadata(value: unknown, path: string): CourseMetadata {
  const item = record(value, path);
  assertKeys(item, path, [
    "title",
    "shortTitle",
    "description",
    "audience",
    "minutes",
    "levelCount",
    "moduleCount",
    "capstoneMinutes",
    "promise",
  ]);
  nonEmptyString(item.title, `${path}.title`);
  nonEmptyString(item.shortTitle, `${path}.shortTitle`);
  nonEmptyString(item.description, `${path}.description`);
  nonEmptyString(item.audience, `${path}.audience`);
  positiveInteger(item.minutes, `${path}.minutes`);
  positiveInteger(item.levelCount, `${path}.levelCount`);
  positiveInteger(item.moduleCount, `${path}.moduleCount`);
  positiveInteger(item.capstoneMinutes, `${path}.capstoneMinutes`);
  nonEmptyString(item.promise, `${path}.promise`);
  return item as unknown as CourseMetadata;
}

function parseClearStep(value: unknown, path: string): ClearStep {
  const item = record(value, path);
  assertKeys(item, path, ["key", "letter", "name", "action", "description"]);
  enumValue(item.key, CLEAR_STEP_KEYS, `${path}.key`);
  const letter = nonEmptyString(item.letter, `${path}.letter`);
  if (letter.length !== 1) {
    fail(`${path}.letter`, "must be one character");
  }
  nonEmptyString(item.name, `${path}.name`);
  nonEmptyString(item.action, `${path}.action`);
  nonEmptyString(item.description, `${path}.description`);
  return item as unknown as ClearStep;
}

function parseLevelDefinition(
  value: unknown,
  path: string,
): TrainingLevelDefinition {
  const item = record(value, path);
  assertKeys(item, path, [
    "id",
    "number",
    "name",
    "title",
    "description",
    "audience",
    "outcome",
    "minutes",
    "moduleCount",
  ]);
  enumValue(item.id, LEVEL_IDS, `${path}.id`);
  positiveInteger(item.number, `${path}.number`);
  nonEmptyString(item.name, `${path}.name`);
  nonEmptyString(item.title, `${path}.title`);
  nonEmptyString(item.description, `${path}.description`);
  nonEmptyString(item.audience, `${path}.audience`);
  nonEmptyString(item.outcome, `${path}.outcome`);
  positiveInteger(item.minutes, `${path}.minutes`);
  positiveInteger(item.moduleCount, `${path}.moduleCount`);
  return item as unknown as TrainingLevelDefinition;
}

export function parseCourseDocument(
  value: unknown,
  path = "content/course.json",
): CourseContentDocument {
  const document = record(value, path);
  assertKeys(document, path, ["course", "clearSteps", "levels"]);
  const course = parseCourseMetadata(document.course, `${path}.course`);
  const clearSteps = list(
    document.clearSteps,
    `${path}.clearSteps`,
    parseClearStep,
  );
  const levels = list(
    document.levels,
    `${path}.levels`,
    parseLevelDefinition,
  );
  assertUnique(clearSteps, `${path}.clearSteps`, (step) => step.key);
  assertUnique(levels, `${path}.levels`, (level) => level.id);
  assertUnique(levels, `${path}.levels`, (level) => String(level.number));

  if (clearSteps.length !== CLEAR_STEP_KEYS.length) {
    fail(
      `${path}.clearSteps`,
      `expected exactly ${CLEAR_STEP_KEYS.length} CLEAR steps`,
    );
  }
  if (levels.length !== course.levelCount) {
    fail(`${path}.levels`, `expected ${course.levelCount} course levels`);
  }

  return { course, clearSteps, levels };
}

export function parseCourseModules(
  value: unknown,
  expectedLevelId?: TrainingLevelId,
  path = "content/modules.json",
): CourseModule[] {
  const modules = list(value, path, (moduleValue, modulePath) => {
    const item = record(moduleValue, modulePath);
    assertKeys(item, modulePath, [
      "id",
      "clearStep",
      "levelId",
      "number",
      "title",
      "minutes",
      "description",
      "outcome",
      "skillName",
      "objectives",
      "concepts",
      "practice",
      "quiz",
      "takeaway",
    ]);
    nonEmptyString(item.id, `${modulePath}.id`);
    enumValue(item.clearStep, CLEAR_STEP_KEYS, `${modulePath}.clearStep`);
    const levelId = enumValue(item.levelId, LEVEL_IDS, `${modulePath}.levelId`);
    if (expectedLevelId && levelId !== expectedLevelId) {
      fail(
        `${modulePath}.levelId`,
        `expected "${expectedLevelId}", received "${levelId}"`,
      );
    }
    positiveInteger(item.number, `${modulePath}.number`);
    nonEmptyString(item.title, `${modulePath}.title`);
    positiveInteger(item.minutes, `${modulePath}.minutes`);
    nonEmptyString(item.description, `${modulePath}.description`);
    nonEmptyString(item.outcome, `${modulePath}.outcome`);
    nonEmptyString(item.skillName, `${modulePath}.skillName`);
    stringList(item.objectives, `${modulePath}.objectives`);
    list(item.concepts, `${modulePath}.concepts`, parseConcept);
    parsePractice(item.practice, `${modulePath}.practice`);
    const quiz = list(item.quiz, `${modulePath}.quiz`, parseQuizQuestion);
    assertUnique(quiz, `${modulePath}.quiz`, (question) => question.id);
    nonEmptyString(item.takeaway, `${modulePath}.takeaway`);
    return item as unknown as CourseModule;
  });
  assertUnique(modules, path, (module) => module.id);
  assertUnique(modules, path, (module) => String(module.number));
  return modules;
}

export function parseCapstone(
  value: unknown,
  expectedLevelId?: TrainingLevelId,
  path = "content/capstone.json",
): CapstoneScenario {
  const item = record(value, path);
  assertKeys(item, path, [
    "id",
    "levelId",
    "number",
    "title",
    "minutes",
    "description",
    "outcome",
    "scenario",
    "sourcePack",
    "stages",
    "rubric",
    "modelResponse",
  ]);
  nonEmptyString(item.id, `${path}.id`);
  const levelId = enumValue(item.levelId, LEVEL_IDS, `${path}.levelId`);
  if (expectedLevelId && levelId !== expectedLevelId) {
    fail(`${path}.levelId`, `expected "${expectedLevelId}", received "${levelId}"`);
  }
  positiveInteger(item.number, `${path}.number`);
  nonEmptyString(item.title, `${path}.title`);
  positiveInteger(item.minutes, `${path}.minutes`);
  nonEmptyString(item.description, `${path}.description`);
  nonEmptyString(item.outcome, `${path}.outcome`);
  nonEmptyString(item.scenario, `${path}.scenario`);
  stringList(item.sourcePack, `${path}.sourcePack`);
  const stages = list(item.stages, `${path}.stages`, (stage, stagePath) => {
    const stageRecord = record(stage, stagePath);
    assertKeys(stageRecord, stagePath, [
      "step",
      "title",
      "prompt",
      "deliverable",
    ]);
    enumValue(stageRecord.step, CLEAR_STEP_KEYS, `${stagePath}.step`);
    nonEmptyString(stageRecord.title, `${stagePath}.title`);
    nonEmptyString(stageRecord.prompt, `${stagePath}.prompt`);
    nonEmptyString(stageRecord.deliverable, `${stagePath}.deliverable`);
    return stageRecord as unknown as CapstoneScenario["stages"][number];
  });
  assertUnique(stages, `${path}.stages`, (stage) => stage.step);
  assertExactClearSteps(
    stages.map((stage) => stage.step),
    `${path}.stages`,
  );
  const rubric = list(item.rubric, `${path}.rubric`, (criterion, criterionPath) => {
    const criterionRecord = record(criterion, criterionPath);
    assertKeys(criterionRecord, criterionPath, ["id", "label", "description"]);
    nonEmptyString(criterionRecord.id, `${criterionPath}.id`);
    nonEmptyString(criterionRecord.label, `${criterionPath}.label`);
    nonEmptyString(criterionRecord.description, `${criterionPath}.description`);
    return criterionRecord as unknown as CapstoneScenario["rubric"][number];
  });
  assertUnique(rubric, `${path}.rubric`, (criterion) => criterion.id);
  nonEmptyString(item.modelResponse, `${path}.modelResponse`);
  return item as unknown as CapstoneScenario;
}

export function parseResources(
  value: unknown,
  path = "content/resources.json",
): ResourceItem[] {
  const resources = list(value, path, (resource, resourcePath) => {
    const item = record(resource, resourcePath);
    assertKeys(item, resourcePath, [
      "id",
      "kind",
      "title",
      "description",
      "useWhen",
      "sections",
      "copyText",
    ]);
    nonEmptyString(item.id, `${resourcePath}.id`);
    enumValue(
      item.kind,
      ["checklist", "template", "guide"] as const,
      `${resourcePath}.kind`,
    );
    nonEmptyString(item.title, `${resourcePath}.title`);
    nonEmptyString(item.description, `${resourcePath}.description`);
    nonEmptyString(item.useWhen, `${resourcePath}.useWhen`);
    const sections = list(
      item.sections,
      `${resourcePath}.sections`,
      (section, sectionPath) => {
        const sectionRecord = record(section, sectionPath);
        assertKeys(sectionRecord, sectionPath, ["heading", "items"]);
        nonEmptyString(sectionRecord.heading, `${sectionPath}.heading`);
        stringList(sectionRecord.items, `${sectionPath}.items`);
        return sectionRecord as unknown as ResourceItem["sections"][number];
      },
    );
    assertUnique(sections, `${resourcePath}.sections`, (section) => section.heading);
    nonEmptyString(item.copyText, `${resourcePath}.copyText`);
    return item as unknown as ResourceItem;
  });
  assertUnique(resources, path, (resource) => resource.id);
  return resources;
}

export interface CurriculumValidationInput {
  course: CourseMetadata;
  clearSteps: ClearStep[];
  levels: TrainingLevel[];
  resources: ResourceItem[];
}

export function validateCurriculum(
  { course, clearSteps, levels, resources }: CurriculumValidationInput,
  path = "content",
): void {
  const modules = levels.flatMap((level) => level.modules);
  const capstones = levels.map((level) => level.capstone);

  assertUnique(modules, `${path}.modules`, (module) => module.id);
  assertUnique(capstones, `${path}.capstones`, (capstone) => capstone.id);
  assertUnique(resources, `${path}.resources`, (resource) => resource.id);

  if (modules.length !== course.moduleCount) {
    fail(
      `${path}.course.moduleCount`,
      `declares ${course.moduleCount}, but ${modules.length} modules were loaded`,
    );
  }
  if (levels.length !== course.levelCount) {
    fail(
      `${path}.course.levelCount`,
      `declares ${course.levelCount}, but ${levels.length} levels were loaded`,
    );
  }
  if (levels.reduce((sum, level) => sum + level.minutes, 0) !== course.minutes) {
    fail(
      `${path}.course.minutes`,
      "must equal the total minutes declared by all levels",
    );
  }
  if (
    capstones.reduce((sum, capstone) => sum + capstone.minutes, 0) !==
    course.capstoneMinutes
  ) {
    fail(
      `${path}.course.capstoneMinutes`,
      "must equal the total minutes declared by all capstones",
    );
  }

  for (const level of levels) {
    if (level.modules.length !== level.moduleCount) {
      fail(
        `${path}.levels.${level.id}.moduleCount`,
        `declares ${level.moduleCount}, but ${level.modules.length} modules were loaded`,
      );
    }
    const expectedMinutes =
      level.modules.reduce((sum, module) => sum + module.minutes, 0) +
      level.capstone.minutes;
    if (expectedMinutes !== level.minutes) {
      fail(
        `${path}.levels.${level.id}.minutes`,
        `declares ${level.minutes}, but its modules and capstone total ${expectedMinutes}`,
      );
    }
    level.modules.forEach((module, index) => {
      if (module.levelId !== level.id) {
        fail(
          `${path}.levels.${level.id}.modules[${index}].levelId`,
          `expected "${level.id}"`,
        );
      }
      if (module.number !== index + 1) {
        fail(
          `${path}.levels.${level.id}.modules[${index}].number`,
          `expected sequential number ${index + 1}`,
        );
      }
    });
    assertExactClearSteps(
      level.modules.map((module) => module.clearStep),
      `${path}.levels.${level.id}.modules`,
    );
    if (level.capstone.levelId !== level.id) {
      fail(
        `${path}.levels.${level.id}.capstone.levelId`,
        `expected "${level.id}"`,
      );
    }
    assertExactClearSteps(
      level.capstone.stages.map((stage) => stage.step),
      `${path}.levels.${level.id}.capstone.stages`,
    );
  }

  const declaredSteps = new Set(clearSteps.map((step) => step.key));
  for (const module of modules) {
    if (!declaredSteps.has(module.clearStep)) {
      fail(
        `${path}.modules.${module.id}.clearStep`,
        `references undeclared CLEAR step "${module.clearStep}"`,
      );
    }
  }
}
