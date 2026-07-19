import type { TrainingLevel } from "../training-data";
import type { TrainingProgress } from "../training-progress";

export function percentage(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

export function isLevelComplete(
  progress: TrainingProgress,
  level: TrainingLevel,
) {
  return (
    level.modules.every((module) =>
      progress.completedModules.includes(module.id),
    ) && progress.completedCapstones.includes(level.capstone.id)
  );
}
