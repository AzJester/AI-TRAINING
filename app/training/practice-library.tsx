"use client";

import type { TrainingLevel, TrainingLevelId } from "../training-data";
import type { ModuleTarget, TrainingProgress } from "../training-progress";
import { LevelSelector } from "./dashboard";

export function PracticeLibrary({
  level,
  progress,
  onOpen,
  onSelectLevel,
}: {
  level: TrainingLevel;
  progress: TrainingProgress;
  onOpen: (target: ModuleTarget, stage?: number) => void;
  onSelectLevel: (levelId: TrainingLevelId) => void;
}) {
  const lessonsComplete = level.modules.every((module) =>
    progress.completedModules.includes(module.id),
  );

  return (
    <div className="page standard-page">
      <header className="page-header">
        <p className="eyebrow">PRACTICE LIBRARY</p>
        <h1>Build the habit by doing the work.</h1>
        <p>
          Revisit any exercise without changing your best quiz score. Every
          practice is deterministic and stays on this device.
        </p>
      </header>
      <LevelSelector
        activeLevel={level}
        progress={progress}
        onSelect={onSelectLevel}
      />
      <div className="practice-library-grid">
        {level.modules.map((module) => (
          <article className="practice-card" key={module.id}>
            <div className="practice-card-top">
              <span>{module.practice.eyebrow}</span>
              <small>{module.practice.estimatedMinutes} min</small>
            </div>
            <h2>{module.practice.title}</h2>
            <p>{module.practice.scenario}</p>
            <div className="practice-card-footer">
              <span className={progress.completedModules.includes(module.id) ? "ready" : ""}>
                {progress.completedModules.includes(module.id) ? "✓ Skill ready" : module.skillName}
              </span>
              <button
                className="button button-small button-quiet"
                type="button"
                onClick={() => onOpen(module.id, 1)}
              >
                Open practice <span aria-hidden="true">→</span>
              </button>
            </div>
          </article>
        ))}
      </div>
      <section className="practice-capstone-strip">
        <div>
          <p className="eyebrow">READY FOR THE FULL WORKFLOW?</p>
          <h2>{level.capstone.title}</h2>
          <p>{level.capstone.description}</p>
        </div>
        <button
          className="button button-dark"
          type="button"
          disabled={!lessonsComplete}
          onClick={() => onOpen(level.capstone.id)}
        >
          {lessonsComplete ? "Open capstone" : "Complete lessons first"}
          {lessonsComplete ? <span aria-hidden="true">→</span> : null}
        </button>
      </section>
    </div>
  );
}
