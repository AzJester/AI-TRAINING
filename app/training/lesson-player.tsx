"use client";

import { CLEAR_STEPS, type CourseModule } from "../training-data";
import { CompletionPanel } from "./completion-panel";
import { PracticeRenderer } from "./practice-exercises";
import { QuizPanel } from "./quiz-panel";

export function LessonPlayer({
  module,
  stage,
  isComplete,
  onStageChange,
  onComplete,
  onExit,
  onOpenNext,
}: {
  module: CourseModule;
  stage: number;
  isComplete: boolean;
  onStageChange: (stage: number) => void;
  onComplete: (module: CourseModule, score: number) => void;
  onExit: () => void;
  onOpenNext: () => void;
}) {
  const stepNames = ["Learn", "Practice", "Check", "Ready"];
  const stepPercent = [20, 55, 80, 100][stage] ?? 20;

  return (
    <div className="lesson-page">
      <header className="lesson-topbar">
        <button className="text-button" type="button" onClick={onExit}>
          <span aria-hidden="true">←</span> Back to course
        </button>
        <div className="lesson-progress-copy">
          <span>
            Lesson {module.number} · {stepNames[stage]}
          </span>
          <strong>{stepPercent}%</strong>
        </div>
        <div className="lesson-progress-track" aria-hidden="true">
          <span style={{ width: `${stepPercent}%` }} />
        </div>
      </header>

      <div className="lesson-layout">
        <article className="lesson-content">
          <p className="eyebrow">
            {module.levelId.toUpperCase()} · CLEAR · {CLEAR_STEPS.find((step) => step.key === module.clearStep)?.letter}
          </p>
          <h1 id="lesson-heading" tabIndex={-1}>
            {module.title}
          </h1>
          <p className="lesson-lede">{module.outcome}</p>

          {stage === 0 ? (
            <ConceptLesson module={module} onContinue={() => onStageChange(1)} />
          ) : stage === 1 ? (
            <PracticeRenderer
              practice={module.practice}
              onComplete={() => onStageChange(2)}
            />
          ) : stage === 2 ? (
            <QuizPanel
              module={module}
              onPassed={(score) => onComplete(module, score)}
            />
          ) : (
            <CompletionPanel
              module={module}
              alreadyComplete={isComplete}
              onExit={onExit}
              onOpenNext={onOpenNext}
            />
          )}
        </article>

        <aside className="lesson-outline" aria-label="Lesson outline">
          <p className="eyebrow">IN THIS LESSON</p>
          <ol>
            {stepNames.map((name, index) => (
              <li
                className={
                  index === stage ? "is-current" : index < stage ? "is-done" : ""
                }
                key={name}
              >
                <span>{index < stage ? "✓" : index + 1}</span>
                {name}
              </li>
            ))}
          </ol>
          <div className="lesson-skill">
            <span>Skill stamp</span>
            <strong>{module.skillName}</strong>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ConceptLesson({
  module,
  onContinue,
}: {
  module: CourseModule;
  onContinue: () => void;
}) {
  return (
    <div className="lesson-blocks">
      <section className="objective-card">
        <span className="card-label">YOUR FINISH LINE</span>
        <ul>
          {module.objectives.map((objective) => (
            <li key={objective}>{objective}</li>
          ))}
        </ul>
      </section>

      {module.concepts.map((concept, index) => (
        <section className="concept-card" key={concept.title}>
          <span className="concept-index">0{index + 1}</span>
          <div>
            <h2>{concept.title}</h2>
            <p>{concept.body}</p>
            {concept.example ? (
              <div className="example-box">
                <span>IN PRACTICE</span>
                <p>{concept.example}</p>
              </div>
            ) : null}
          </div>
        </section>
      ))}

      <div className="lesson-continue">
        <p>
          Next: <strong>{module.practice.title}</strong>
        </p>
        <button className="button button-primary" type="button" onClick={onContinue}>
          Try it now <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
