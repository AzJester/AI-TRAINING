import rawCourseContent from "../../content/course.json";
import rawResources from "../../content/resources.json";
import rawAdvancedCapstone from "../../content/levels/advanced/capstone.json";
import rawAdvancedModules from "../../content/levels/advanced/modules.json";
import rawBeginnerCapstone from "../../content/levels/beginner/capstone.json";
import rawBeginnerModules from "../../content/levels/beginner/modules.json";
import rawIntermediateCapstone from "../../content/levels/intermediate/capstone.json";
import rawIntermediateModules from "../../content/levels/intermediate/modules.json";
import {
  parseCapstone,
  parseCourseDocument,
  parseCourseModules,
  parseResources,
  validateCurriculum,
} from "./schema";
import type {
  CourseModule,
  TrainingLevel,
  TrainingLevelDefinition,
  TrainingLevelId,
} from "./types";

const courseContent = parseCourseDocument(rawCourseContent);

export const COURSE = courseContent.course;
export const CLEAR_STEPS = courseContent.clearSteps;

export const BEGINNER_MODULES = parseCourseModules(
  rawBeginnerModules,
  "beginner",
  "content/levels/beginner/modules.json",
);

export const INTERMEDIATE_MODULES = parseCourseModules(
  rawIntermediateModules,
  "intermediate",
  "content/levels/intermediate/modules.json",
);

export const ADVANCED_MODULES = parseCourseModules(
  rawAdvancedModules,
  "advanced",
  "content/levels/advanced/modules.json",
);

export const BEGINNER_CAPSTONE = parseCapstone(
  rawBeginnerCapstone,
  "beginner",
  "content/levels/beginner/capstone.json",
);

export const INTERMEDIATE_CAPSTONE = parseCapstone(
  rawIntermediateCapstone,
  "intermediate",
  "content/levels/intermediate/capstone.json",
);

export const ADVANCED_CAPSTONE = parseCapstone(
  rawAdvancedCapstone,
  "advanced",
  "content/levels/advanced/capstone.json",
);

const MODULES_BY_LEVEL: Record<TrainingLevelId, CourseModule[]> = {
  beginner: BEGINNER_MODULES,
  intermediate: INTERMEDIATE_MODULES,
  advanced: ADVANCED_MODULES,
};

const CAPSTONES_BY_LEVEL = {
  beginner: BEGINNER_CAPSTONE,
  intermediate: INTERMEDIATE_CAPSTONE,
  advanced: ADVANCED_CAPSTONE,
};

function assembleLevel(definition: TrainingLevelDefinition): TrainingLevel {
  return {
    ...definition,
    modules: MODULES_BY_LEVEL[definition.id],
    capstone: CAPSTONES_BY_LEVEL[definition.id],
  };
}

export const TRAINING_LEVELS = courseContent.levels.map(assembleLevel);

export const ALL_COURSE_MODULES = [
  ...BEGINNER_MODULES,
  ...INTERMEDIATE_MODULES,
  ...ADVANCED_MODULES,
];

export const ALL_CAPSTONES = [
  BEGINNER_CAPSTONE,
  INTERMEDIATE_CAPSTONE,
  ADVANCED_CAPSTONE,
];

// Backward-compatible aliases for the original beginner experience.
export const COURSE_MODULES = BEGINNER_MODULES;
export const CAPSTONE = BEGINNER_CAPSTONE;

export const RESOURCES = parseResources(rawResources);

validateCurriculum({
  course: COURSE,
  clearSteps: CLEAR_STEPS,
  levels: TRAINING_LEVELS,
  resources: RESOURCES,
});
