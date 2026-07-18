import {
  ALL_CAPSTONES,
  ALL_COURSE_MODULES,
  TRAINING_LEVELS,
  type TrainingLevelId,
} from "./training-data";

export type ModuleTarget = string;

export interface LearnerProfile {
  name: string;
  role: string;
  confidence: number;
  tasks: string[];
}

export interface TrainingProgress {
  version: 2;
  profile: LearnerProfile | null;
  selectedLevel: TrainingLevelId;
  completedModules: string[];
  completedCapstones: string[];
  quizScores: Record<string, number>;
  studioCompleted: string[];
  bookmarks: string[];
  currentTarget: ModuleTarget | null;
  currentStage: number;
  lastVisitedAt: string | null;
}

export const STORAGE_KEY = "ai-practice-lab-progress-v2";
export const LEGACY_STORAGE_KEY = "ai-practice-lab-progress-v1";
export const GENERAL_ROLE = "Defense-contractor mission and business teams";

export const ROLE_OPTIONS = [
  "Systems Engineering & Integration",
  "Software, Data, AI & Information Technology",
  "Cybersecurity & Information Assurance",
  "Test, Evaluation, Training, Quality & Safety",
  "Program & Project Management",
  "Acquisition, Contracts & Subcontracts",
  "Business Development, Capture & Proposals",
  "Solutions Architecture & Technical Strategy",
  "Mission Support, Logistics & Sustainment",
  "Space, UxS & Mission Technology",
  "Analysis, Configuration & Technical Services",
  "Legal, Ethics, Compliance & Corporate Security",
  "Finance, Accounting, Pricing & Procurement",
  "Human Resources, Talent & Workforce Development",
  "Communications, Marketing & Business Operations",
  GENERAL_ROLE,
];

export const DEFAULT_PROGRESS: TrainingProgress = {
  version: 2,
  profile: null,
  selectedLevel: "beginner",
  completedModules: [],
  completedCapstones: [],
  quizScores: {},
  studioCompleted: [],
  bookmarks: [],
  currentTarget: null,
  currentStage: 0,
  lastVisitedAt: null,
};

export function readProgress(storage: Storage | undefined): TrainingProgress {
  if (!storage) return DEFAULT_PROGRESS;
  try {
    const stored = storage.getItem(STORAGE_KEY) ?? storage.getItem(LEGACY_STORAGE_KEY);
    if (!stored) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(stored) as Record<string, unknown>;
    const profile = parsed.profile as LearnerProfile | null | undefined;
    const normalizedProfile = profile
      ? {
          ...profile,
          name:
            typeof profile.name === "string" && profile.name.trim()
              ? profile.name.trim().slice(0, 80)
              : "Learner",
          role: ROLE_OPTIONS.includes(profile.role) ? profile.role : ROLE_OPTIONS[0],
        }
      : null;

    if (parsed.version === 1) {
      const legacyIds: Record<string, string> = {
        clarify: "beginner-clarify",
        limit: "beginner-limit",
        engineer: "beginner-engineer",
        assess: "beginner-assess",
        refine: "beginner-refine",
      };
      const completedModules = Array.isArray(parsed.completedModules)
        ? parsed.completedModules
            .map((id) => legacyIds[String(id)])
            .filter((id): id is string => Boolean(id))
        : [];
      const legacyScores = (parsed.quizScores ?? {}) as Record<string, number>;
      const quizScores = Object.fromEntries(
        Object.entries(legacyScores)
          .map(([id, score]) => [legacyIds[id], score] as const)
          .filter(([id]) => Boolean(id)),
      );

      return {
        ...DEFAULT_PROGRESS,
        profile: normalizedProfile,
        completedModules,
        completedCapstones:
          parsed.capstoneComplete === true ? ["beginner-capstone"] : [],
        quizScores,
        currentTarget:
          typeof parsed.currentTarget === "string"
            ? parsed.currentTarget === "capstone"
              ? "beginner-capstone"
              : legacyIds[parsed.currentTarget] ?? null
            : null,
      };
    }

    if (parsed.version !== 2) return DEFAULT_PROGRESS;
    const selectedLevel = TRAINING_LEVELS.some(
      (level) => level.id === parsed.selectedLevel,
    )
      ? (parsed.selectedLevel as TrainingLevelId)
      : "beginner";
    const currentTarget =
      typeof parsed.currentTarget === "string" &&
      (ALL_COURSE_MODULES.some((module) => module.id === parsed.currentTarget) ||
        ALL_CAPSTONES.some((capstone) => capstone.id === parsed.currentTarget))
        ? parsed.currentTarget
        : null;
    const targetLevel =
      ALL_COURSE_MODULES.find((module) => module.id === currentTarget)?.levelId ??
      ALL_CAPSTONES.find((capstone) => capstone.id === currentTarget)?.levelId;
    const studioCompleted = Array.isArray(parsed.studioCompleted)
      ? [...new Set(parsed.studioCompleted.map(String))]
      : [];

    if (
      studioCompleted.includes("codex-skills") &&
      !studioCompleted.includes("chatgpt-skills-beginner")
    ) {
      studioCompleted.push("chatgpt-skills-beginner");
    }

    return {
      ...DEFAULT_PROGRESS,
      selectedLevel: targetLevel ?? selectedLevel,
      profile: normalizedProfile,
      completedModules: Array.isArray(parsed.completedModules)
        ? parsed.completedModules
            .map(String)
            .filter((id) => ALL_COURSE_MODULES.some((module) => module.id === id))
        : [],
      completedCapstones: Array.isArray(parsed.completedCapstones)
        ? parsed.completedCapstones
            .map(String)
            .filter((id) => ALL_CAPSTONES.some((capstone) => capstone.id === id))
        : [],
      quizScores:
        parsed.quizScores && typeof parsed.quizScores === "object"
          ? (parsed.quizScores as Record<string, number>)
          : {},
      studioCompleted,
      bookmarks: Array.isArray(parsed.bookmarks)
        ? [...new Set(parsed.bookmarks.map(String))]
        : [],
      currentTarget,
      currentStage:
        typeof parsed.currentStage === "number" && Number.isFinite(parsed.currentStage)
          ? Math.max(0, Math.min(3, Math.floor(parsed.currentStage)))
          : 0,
      lastVisitedAt:
        typeof parsed.lastVisitedAt === "string" ? parsed.lastVisitedAt : null,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}
