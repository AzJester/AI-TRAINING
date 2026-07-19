"use client";

import { TRAINING_LEVELS, type CourseModule } from "../training-data";

export function CompletionPanel({
  module,
  alreadyComplete,
  onExit,
  onOpenNext,
}: {
  module: CourseModule;
  alreadyComplete: boolean;
  onExit: () => void;
  onOpenNext: () => void;
}) {
  const moduleLevel = TRAINING_LEVELS.find(
    (level) => level.id === module.levelId,
  );
  const isLastModule =
    moduleLevel?.modules[moduleLevel.modules.length - 1]?.id === module.id;
  return (
    <section className="completion-panel">
      <div className="completion-mark" aria-hidden="true">
        ✓
      </div>
      <p className="eyebrow">SKILL READY</p>
      <h2>{module.skillName}</h2>
      <p>{module.takeaway}</p>
      <div className="takeaway-card">
        <span>KEEP THIS</span>
        <blockquote>“{module.takeaway}”</blockquote>
      </div>
      <div className="completion-actions">
        <button className="button button-primary" type="button" onClick={onOpenNext}>
          {isLastModule ? "Open capstone" : "Next lesson"}
          <span aria-hidden="true">→</span>
        </button>
        <button className="button button-quiet" type="button" onClick={onExit}>
          {alreadyComplete ? "Back to course" : "See course path"}
        </button>
      </div>
    </section>
  );
}
