"use client";

import { useState } from "react";
import { AccountSyncPanel } from "../account/AccountSyncPanel";
import { InstructorPanel } from "../InstructorPanel";
import {
  ALL_CAPSTONES,
  ALL_COURSE_MODULES,
  CLEAR_STEPS,
  TRAINING_LEVELS,
  type TrainingLevel,
  type TrainingLevelId,
} from "../training-data";
import {
  GENERAL_ROLE,
  ROLE_OPTIONS,
  type ModuleTarget,
  type TrainingProgress,
} from "../training-progress";
import { LevelSelector } from "./dashboard";
import { isLevelComplete } from "./ui-utils";

const CREATOR_STUDIO_LAB_IDS = [
  "model-selector",
  "custom-gpt",
  "chatgpt-skills",
  "image-prompts",
  "role-use-cases",
  "template-library",
  "safe-data",
  "ai-updates",
];

export function ProgressPage({
  level,
  progress,
  progressPercent,
  onOpen,
  onSelectLevel,
  onExport,
  onDownloadCertificate,
  onReset,
  showReset,
  onCancelReset,
  onConfirmReset,
  onRoleChange,
  onNameChange,
  onApplyProgress,
}: {
  level: TrainingLevel;
  progress: TrainingProgress;
  progressPercent: number;
  onOpen: (target: ModuleTarget, stage?: number) => void;
  onSelectLevel: (levelId: TrainingLevelId) => void;
  onExport: () => void;
  onDownloadCertificate: () => void;
  onReset: () => void;
  showReset: boolean;
  onCancelReset: () => void;
  onConfirmReset: () => void;
  onRoleChange: (role: string) => void;
  onNameChange: (name: string) => void;
  onApplyProgress: (
    updater: (current: TrainingProgress) => TrainingProgress,
  ) => void;
}) {
  const [progressMode, setProgressMode] = useState<"learner" | "instructor">(
    "learner",
  );
  const completedCount =
    level.modules.filter((module) => progress.completedModules.includes(module.id))
      .length +
    (progress.completedCapstones.includes(level.capstone.id) ? 1 : 0);
  const completedLevels = TRAINING_LEVELS.filter((item) =>
    isLevelComplete(progress, item),
  ).length;
  const lessonsComplete = level.modules.every((module) =>
    progress.completedModules.includes(module.id),
  );
  const capstoneComplete = progress.completedCapstones.includes(level.capstone.id);
  const levelComplete = isLevelComplete(progress, level);
  const currentCreatorCompleted = CREATOR_STUDIO_LAB_IDS.filter((id) =>
    progress.studioCompleted.includes(id),
  ).length;
  const legacySkillsCredit =
    progress.studioCompleted.includes("codex-skills") &&
    !progress.studioCompleted.includes("chatgpt-skills")
      ? 1
      : 0;
  const creatorCompleted = Math.min(
    CREATOR_STUDIO_LAB_IDS.length,
    currentCreatorCompleted + legacySkillsCredit,
  );

  return (
    <div className="page standard-page progress-page">
      <header className="page-header with-actions">
        <div>
          <p className="eyebrow">YOUR SKILL PROFILE</p>
          <h1>Progress you can see and use.</h1>
          <p>
            Completion reflects mastery, not first-attempt perfection. Practice
            as often as it helps.
          </p>
        </div>
        <div className="page-actions no-print">
          <button className="button button-quiet" type="button" onClick={() => window.print()}>
            Print summary
          </button>
          <button className="button button-quiet" type="button" onClick={onExport}>
            Export progress
          </button>
          <button
            className="button button-primary"
            type="button"
            disabled={!levelComplete}
            title={
              levelComplete
                ? "Download this level certificate"
                : "Complete all five lessons and the capstone first"
            }
            onClick={onDownloadCertificate}
          >
            Download certificate
          </button>
        </div>
      </header>

      <LevelSelector
        activeLevel={level}
        progress={progress}
        onSelect={onSelectLevel}
      />

      <div className="progress-view-switcher no-print" role="group" aria-label="Progress view">
        <button
          type="button"
          className={progressMode === "learner" ? "is-active" : ""}
          onClick={() => setProgressMode("learner")}
        >
          Learner view
        </button>
        <button
          type="button"
          className={progressMode === "instructor" ? "is-active" : ""}
          onClick={() => setProgressMode("instructor")}
        >
          Instructor view
        </button>
      </div>

      <AccountSyncPanel
        progress={progress}
        onApplyProgress={onApplyProgress}
      />

      {progressMode === "instructor" ? (
        <InstructorPanel
          learnerName={progress.profile?.name ?? "Learner"}
          role={progress.profile?.role ?? GENERAL_ROLE}
          selectedLevel={level.name}
          moduleCompleted={progress.completedModules.length}
          moduleTotal={ALL_COURSE_MODULES.length}
          capstonesCompleted={progress.completedCapstones.length}
          capstoneTotal={ALL_CAPSTONES.length}
          creatorCompleted={creatorCompleted}
          creatorTotal={CREATOR_STUDIO_LAB_IDS.length}
          quizScores={progress.quizScores}
          bookmarksCount={progress.bookmarks.length}
          onExport={onExport}
          onPrint={() => window.print()}
          onReset={() => {
            if (window.confirm("Reset all saved progress and bookmarks to 0?")) {
              onConfirmReset();
            }
          }}
        />
      ) : (
        <>

      <section className="progress-overview">
        <div className="progress-score">
          <strong>{progressPercent}%</strong>
          <span>{level.name.toLowerCase()} complete</span>
        </div>
        <div>
          <h2>{completedCount === 6 ? "All six milestones ready" : `${completedCount} of 6 milestones ready`}</h2>
          <div className="progress-track large" aria-hidden="true">
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <p>
            {completedLevels} of {TRAINING_LEVELS.length} levels complete · Starting confidence: {progress.profile?.confidence ?? "not set"} / 5
            · Choose device-only or account sync above
          </p>
        </div>
      </section>

      <section className="role-profile-card no-print">
        <div>
          <p className="eyebrow">ROLE-BASED PATH</p>
          <h2>Defense-contractor role profile</h2>
          <p>
            Choose the function closest to your work. Every lesson stays
            available; this profile tunes how the learning path is framed.
          </p>
        </div>
        <div className="role-profile-fields">
          <label>
            <span>Name for certificates</span>
            <input
              type="text"
              maxLength={80}
              value={progress.profile?.name ?? "Learner"}
              onChange={(event) => onNameChange(event.target.value)}
            />
          </label>
          <label>
            <span>Your role family</span>
            <select
              value={progress.profile?.role ?? ROLE_OPTIONS[0]}
              onChange={(event) => onRoleChange(event.target.value)}
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role}>{role}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="skill-table" aria-labelledby="skill-table-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CLEAR SKILLS</p>
            <h2 id="skill-table-title">Your learning record</h2>
          </div>
        </div>
        {level.modules.map((module) => {
          const complete = progress.completedModules.includes(module.id);
          return (
            <article key={module.id}>
              <span className={`skill-letter ${complete ? "ready" : ""}`}>
                {CLEAR_STEPS.find((step) => step.key === module.clearStep)?.letter}
              </span>
              <div>
                <h3>{module.skillName}</h3>
                <p>{module.title}</p>
              </div>
              <div className="skill-score">
                <span className={`status-pill ${complete ? "ready" : ""}`}>
                  {complete ? "Ready" : "Not started"}
                </span>
                {progress.quizScores[module.id] ? (
                  <small>Best check: {progress.quizScores[module.id]}/3</small>
                ) : null}
              </div>
              <button
                className="button button-small button-quiet no-print"
                type="button"
                onClick={() => onOpen(module.id, complete ? 1 : 0)}
              >
                {complete ? "Practice" : "Start"}
              </button>
            </article>
          );
        })}
        <article className="capstone-row">
          <span className={`skill-letter ${capstoneComplete ? "ready" : ""}`}>★</span>
          <div>
            <h3>Responsible AI workflow</h3>
            <p>{level.capstone.title}</p>
          </div>
          <div className="skill-score">
            <span className={`status-pill ${capstoneComplete ? "ready" : ""}`}>
              {capstoneComplete ? "Complete" : "Not started"}
            </span>
          </div>
          <button
            className="button button-small button-quiet no-print"
            type="button"
            disabled={!lessonsComplete}
            onClick={() => onOpen(level.capstone.id)}
          >
            {capstoneComplete
              ? "Run again"
              : lessonsComplete
                ? "Start"
                : "Finish lessons first"}
          </button>
        </article>
      </section>

      {levelComplete ? (
        <section className="completion-summary">
          <p className="eyebrow">COMPLETION SUMMARY</p>
          <h2>{level.name}: {level.title}</h2>
          <p>
            This learner completed the interactive AI Practice Lab and applied
            the CLEAR framework to a workplace capstone. This is a personal
            learning record, not an externally verified certification.
          </p>
          <div className="completion-signature">
            <span>Completed locally</span>
            <strong>AI Practice Lab</strong>
          </div>
        </section>
      ) : null}

      <section className="data-controls no-print">
        <div>
          <h2>Your data stays yours</h2>
          <p>
            The app stores course progress in this browser. No exercise text is
            sent to an AI service.
          </p>
        </div>
        {!showReset ? (
          <button className="text-button danger" type="button" onClick={onReset}>
            Reset all progress to 0
          </button>
        ) : (
          <div className="reset-confirm" role="group" aria-label="Confirm reset">
            <span>Reset lessons, Creator Studio, quizzes, and bookmarks to 0? Your profile stays saved.</span>
            <button className="button button-danger button-small" type="button" onClick={onConfirmReset}>
              Yes, reset to 0
            </button>
            <button className="button button-quiet button-small" type="button" onClick={onCancelReset}>
              Cancel
            </button>
          </div>
        )}
      </section>
        </>
      )}
    </div>
  );
}
