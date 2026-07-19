export type ClearStepKey =
  | "clarify"
  | "limit"
  | "engineer"
  | "assess"
  | "refine";

export type TrainingLevelId = "beginner" | "intermediate" | "advanced";

export interface CourseMetadata {
  title: string;
  shortTitle: string;
  description: string;
  audience: string;
  minutes: number;
  levelCount: number;
  moduleCount: number;
  capstoneMinutes: number;
  promise: string;
}

export interface ClearStep {
  key: ClearStepKey;
  letter: string;
  name: string;
  action: string;
  description: string;
}

export interface Concept {
  title: string;
  body: string;
  example?: string;
}

export interface QuizOption {
  id: string;
  text: string;
  feedback: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
  correctOptionId: string;
  critical?: boolean;
  explanation: string;
}

export interface PracticeBase {
  id: string;
  eyebrow: string;
  title: string;
  estimatedMinutes: number;
  instructions: string[];
  scenario: string;
}

export interface BuilderField {
  id: string;
  label: string;
  prompt: string;
  placeholder: string;
}

export interface RewriteLabPractice extends PracticeBase {
  type: "rewrite-lab";
  starterPrompt: string;
  fields: BuilderField[];
  successChecks: string[];
  modelAnswer: string;
}

export type RiskCategoryId = "ready" | "pause" | "restricted";

export interface RiskSortPractice extends PracticeBase {
  type: "risk-sort";
  categories: {
    id: RiskCategoryId;
    label: string;
    description: string;
  }[];
  items: {
    id: string;
    text: string;
    detail: string;
    answer: RiskCategoryId;
    feedback: string;
  }[];
  debrief: string;
}

export interface ContextBuilderPractice extends PracticeBase {
  type: "context-builder";
  sourceNotes: string[];
  fields: BuilderField[];
  successChecks: string[];
  modelAnswer: string;
}

export type ClaimVerdict = "supported" | "unsupported" | "needs-context";

export interface VerificationCheckPractice extends PracticeBase {
  type: "verification-check";
  sourcePack: string[];
  draft: string;
  claims: {
    id: string;
    text: string;
    answer: ClaimVerdict;
    feedback: string;
  }[];
  improvedDraft: string;
}

export type ConcernCategory = "accuracy" | "judgment" | "tone" | "policy";

export interface ActionPlanPractice extends PracticeBase {
  type: "action-plan";
  aiDraft: string;
  concerns: {
    id: string;
    text: string;
    category: ConcernCategory;
  }[];
  planPrompts: {
    id: string;
    label: string;
    placeholder: string;
  }[];
  modelPlan: string[];
}

export type PracticeExercise =
  | RewriteLabPractice
  | RiskSortPractice
  | ContextBuilderPractice
  | VerificationCheckPractice
  | ActionPlanPractice;

export interface CourseModule {
  id: string;
  clearStep: ClearStepKey;
  levelId: TrainingLevelId;
  number: number;
  title: string;
  minutes: number;
  description: string;
  outcome: string;
  skillName: string;
  objectives: string[];
  concepts: Concept[];
  practice: PracticeExercise;
  quiz: QuizQuestion[];
  takeaway: string;
}

export interface CapstoneStage {
  step: ClearStepKey;
  title: string;
  prompt: string;
  deliverable: string;
}

export interface CapstoneScenario {
  id: string;
  levelId: TrainingLevelId;
  number: number;
  title: string;
  minutes: number;
  description: string;
  outcome: string;
  scenario: string;
  sourcePack: string[];
  stages: CapstoneStage[];
  rubric: {
    id: string;
    label: string;
    description: string;
  }[];
  modelResponse: string;
}

export interface TrainingLevel {
  id: TrainingLevelId;
  number: number;
  name: string;
  title: string;
  description: string;
  audience: string;
  outcome: string;
  minutes: number;
  moduleCount: number;
  modules: CourseModule[];
  capstone: CapstoneScenario;
}

export type TrainingLevelDefinition = Omit<
  TrainingLevel,
  "modules" | "capstone"
>;

export interface ResourceSection {
  heading: string;
  items: string[];
}

export interface ResourceItem {
  id: string;
  kind: "checklist" | "template" | "guide";
  title: string;
  description: string;
  useWhen: string;
  sections: ResourceSection[];
  copyText: string;
}

export interface CourseContentDocument {
  course: CourseMetadata;
  clearSteps: ClearStep[];
  levels: TrainingLevelDefinition[];
}
