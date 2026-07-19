"use client";

import type { CSSProperties } from "react";
import {
  CLEAR_STEPS,
  TRAINING_LEVELS,
  type TrainingLevel,
  type TrainingLevelId,
} from "../training-data";
import {
  GENERAL_ROLE,
  type ModuleTarget,
  type TrainingProgress,
} from "../training-progress";
import { isLevelComplete, percentage } from "./ui-utils";

export function Dashboard({
  level,
  progress,
  progressPercent,
  nextTarget,
  onOpen,
  onSelectLevel,
  onViewProgress,
}: {
  level: TrainingLevel;
  progress: TrainingProgress;
  progressPercent: number;
  nextTarget: ModuleTarget;
  onOpen: (target: ModuleTarget, stage?: number) => void;
  onSelectLevel: (levelId: TrainingLevelId) => void;
  onViewProgress: () => void;
}) {
  const nextModule = level.modules.find((module) => module.id === nextTarget);
  const nextTitle = nextModule?.title ?? level.capstone.title;
  const levelHasStarted = level.modules.some((module) =>
    progress.completedModules.includes(module.id),
  );
  const lessonsComplete = level.modules.every((module) =>
    progress.completedModules.includes(module.id),
  );
  const capstoneComplete = progress.completedCapstones.includes(level.capstone.id);
  const levelComplete = isLevelComplete(progress, level);
  const selectedRole = progress.profile?.role ?? GENERAL_ROLE;

  return (
    <div className="page dashboard-page">
      <LevelSelector
        activeLevel={level}
        progress={progress}
        onSelect={onSelectLevel}
      />
      <section className="hero-panel" aria-labelledby="dashboard-title">
        <div className="hero-copy">
          <p className="eyebrow">AI PRACTICE LAB · {level.name.toUpperCase()}</p>
          <h1 id="dashboard-title">{level.title}</h1>
          <p className="hero-lede">{level.description}</p>
          <div className="hero-actions">
            <button
              className="button button-primary"
              type="button"
              onClick={() => onOpen(nextTarget)}
            >
              {!levelHasStarted
                ? `Start ${level.name}`
                : levelComplete
                  ? "Practice again"
                  : `Continue ${level.name}`}
              <span aria-hidden="true">→</span>
            </button>
            <button
              className="button button-quiet"
              type="button"
              onClick={onViewProgress}
            >
              View my progress
            </button>
          </div>
        </div>

        <div className="hero-meter" aria-label={`${progressPercent}% complete`}>
          <div
            className="progress-ring"
            style={{ "--progress": `${progressPercent * 3.6}deg` } as CSSProperties}
          >
            <div>
              <strong>{progressPercent}%</strong>
              <span>complete</span>
            </div>
          </div>
          <p>
            <span className="status-dot" aria-hidden="true" />
            Your progress stays in this browser.
          </p>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="course-section" aria-labelledby="course-path-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR LEARNING PATH</p>
              <h2 id="course-path-title">Course path</h2>
            </div>
            <p>{level.minutes} focused minutes</p>
          </div>

          <div className="course-path">
            {level.modules.map((module) => {
              const complete = progress.completedModules.includes(module.id);
              const current = nextTarget === module.id;
              return (
                <article
                  className={`module-card ${complete ? "is-complete" : ""} ${current ? "is-current" : ""}`}
                  key={module.id}
                >
                  <div className="module-number" aria-hidden="true">
                    {complete ? "✓" : module.number}
                  </div>
                  <div className="module-copy">
                    <div className="module-meta">
                      <span>Lesson {module.number}</span>
                      <span>{module.minutes} min</span>
                      <span
                        className={`status-pill ${complete ? "ready" : current ? "practicing" : ""}`}
                      >
                        {complete ? "Ready" : current ? "Up next" : "Not started"}
                      </span>
                    </div>
                    <h3>{module.title}</h3>
                    <p>{module.description}</p>
                    <div className="module-outcome">
                      <span>Skill</span>
                      <strong>{module.skillName}</strong>
                    </div>
                  </div>
                  <button
                    className="button button-small button-quiet"
                    type="button"
                    onClick={() => onOpen(module.id)}
                    aria-label={`${complete ? "Practice" : "Open"} ${module.title}`}
                  >
                    {complete ? "Practice again" : current ? "Start lesson" : "Open"}
                  </button>
                </article>
              );
            })}
          </div>

          <article className="capstone-card">
            <div className="capstone-kicker">CAPSTONE · {level.capstone.minutes} MIN</div>
            <div>
              <h3>{level.capstone.title}</h3>
              <p>{level.capstone.description}</p>
            </div>
            <button
              className="button button-dark"
              type="button"
              disabled={!lessonsComplete}
              onClick={() => onOpen(level.capstone.id)}
            >
              {!lessonsComplete
                ? "Complete lessons first"
                : capstoneComplete
                  ? "Run it again"
                  : "Open capstone"}
              {lessonsComplete ? <span aria-hidden="true">→</span> : null}
            </button>
          </article>
        </div>

        <aside className="dashboard-aside" aria-label="Recommended next step">
          <section className="next-card">
            <p className="eyebrow">YOUR NEXT MOVE</p>
            <span className="next-index">
              {nextModule ? `0${nextModule.number}` : "GO"}
            </span>
            <h2>{nextTitle}</h2>
            <p>
              {level.name} path for <strong>{selectedRole}</strong>. Examples are
              grounded in defense-contractor mission and business work.
            </p>
            <button
              className="button button-primary button-full"
              type="button"
              onClick={() => onOpen(nextTarget)}
            >
              Continue <span aria-hidden="true">→</span>
            </button>
          </section>

          <section className="clear-card" aria-labelledby="clear-title">
            <p className="eyebrow">THE METHOD</p>
            <h2 id="clear-title">Think CLEAR</h2>
            <div className="clear-mini-list">
              {CLEAR_STEPS.map((step) => (
                <div key={step.key}>
                  <span>{step.letter}</span>
                  <p>
                    <strong>{step.name}</strong>
                    <small>{step.action}</small>
                  </p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}

export function LevelSelector({
  activeLevel,
  progress,
  onSelect,
}: {
  activeLevel: TrainingLevel;
  progress: TrainingProgress;
  onSelect: (levelId: TrainingLevelId) => void;
}) {
  return (
    <section className="level-selector" aria-labelledby="level-selector-title">
      <div className="level-selector-heading">
        <div>
          <p className="eyebrow">CHOOSE YOUR LEVEL</p>
          <h2 id="level-selector-title">Three levels. One CLEAR method.</h2>
        </div>
        <p>{activeLevel.outcome}</p>
      </div>
      <fieldset>
        <legend className="sr-only">Training level</legend>
        <div className="level-options">
          {TRAINING_LEVELS.map((level) => {
            const completed =
              level.modules.filter((module) =>
                progress.completedModules.includes(module.id),
              ).length +
              (progress.completedCapstones.includes(level.capstone.id) ? 1 : 0);
            const percent = percentage(completed, level.modules.length + 1);
            return (
              <label key={level.id}>
                <input
                  type="radio"
                  name="training-level"
                  value={level.id}
                  checked={activeLevel.id === level.id}
                  onChange={() => onSelect(level.id)}
                />
                <span className="level-option-card">
                  <span className="level-option-number">0{level.number}</span>
                  <span className="level-option-copy">
                    <strong>{level.name}</strong>
                    <small>{level.title}</small>
                  </span>
                  <span className="level-option-progress">
                    {percent === 100 ? "Complete" : `${percent}%`}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </section>
  );
}
