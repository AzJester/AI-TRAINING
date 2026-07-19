"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { TRAINING_LEVELS, type TrainingLevelId } from "../training-data";
import {
  GENERAL_ROLE,
  ROLE_OPTIONS,
  type LearnerProfile,
} from "../training-progress";

const TASK_OPTIONS = [
  "Technical writing & documentation",
  "Program status, schedule & risk",
  "Requirements & systems engineering",
  "Research, analysis & data",
  "Test, evaluation & training",
  "Logistics, sustainment & mission support",
  "Capture strategy & opportunity research",
  "Proposal writing, compliance & reviews",
  "Solutions architecture & technical narratives",
  "Contracts, subcontracts & acquisition",
  "Legal, ethics, compliance & policy",
  "Pricing, finance & cost analysis",
  "Talent, communications & administration",
];

export function Onboarding({
  onSave,
}: {
  onSave: (profile: LearnerProfile, levelId: TrainingLevelId) => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState(ROLE_OPTIONS[0]);
  const [confidence, setConfidence] = useState(3);
  const [tasks, setTasks] = useState<string[]>([]);
  const [levelId, setLevelId] = useState<TrainingLevelId>("intermediate");
  const dialogRef = useRef<HTMLElement>(null);
  const roleSelectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    roleSelectRef.current?.focus();
  }, []);

  function skipOnboarding() {
    onSave(
      {
        name: "Learner",
        role: GENERAL_ROLE,
        confidence: 3,
        tasks: [],
      },
      "beginner",
    );
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      skipOnboarding();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="dialog-backdrop">
      <section
        ref={dialogRef}
        className="onboarding-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        onKeyDown={handleDialogKeyDown}
      >
        <div className="onboarding-aside" aria-hidden="true">
          <span className="brand-mark large">AI</span>
          <p>Training simulation</p>
          <strong>No information is sent to an AI service.</strong>
        </div>
        <div className="onboarding-main">
          <p className="eyebrow">MAKE IT YOURS</p>
          <h2 id="onboarding-title">Choose an AI learning path for your work.</h2>
          <p>
            Choose the work area closest to your role and the tasks you want to
            improve. You can still explore every lesson and practice.
          </p>
          <label className="form-field">
            <span>Your role family</span>
            <select
              ref={roleSelectRef}
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Name for your certificate (optional)</span>
            <input
              type="text"
              maxLength={80}
              value={name}
              placeholder="Your name"
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <fieldset className="confidence-field">
            <legend>How confident do you feel using AI at work?</legend>
            <div>
              {[1, 2, 3, 4, 5].map((value) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="confidence"
                    value={value}
                    checked={confidence === value}
                    onChange={() => {
                      setConfidence(value);
                      setLevelId(
                        value <= 2
                          ? "beginner"
                          : value <= 4
                            ? "intermediate"
                            : "advanced",
                      );
                    }}
                  />
                  <span>{value}</span>
                </label>
              ))}
            </div>
            <small>
              <span>New to this</span>
              <span>Very confident</span>
            </small>
          </fieldset>
          <fieldset className="task-field">
            <legend>What kind of work do you want to improve?</legend>
            <div>
              {TASK_OPTIONS.map((task) => (
                <label key={task}>
                  <input
                    type="checkbox"
                    checked={tasks.includes(task)}
                    onChange={(event) =>
                      setTasks((current) =>
                        event.target.checked
                          ? [...current, task]
                          : current.filter((item) => item !== task),
                      )
                    }
                  />
                  <span>{task}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="onboarding-level-field">
            <legend>Choose where to start</legend>
            <div>
              {TRAINING_LEVELS.map((level) => {
                const recommended =
                  (confidence <= 2 && level.id === "beginner") ||
                  (confidence >= 3 && confidence <= 4 && level.id === "intermediate") ||
                  (confidence === 5 && level.id === "advanced");
                return (
                  <label key={level.id}>
                    <input
                      type="radio"
                      name="starting-level"
                      value={level.id}
                      checked={levelId === level.id}
                      onChange={() => setLevelId(level.id)}
                    />
                    <span>
                      <b>0{level.number}</b>
                      <strong>{level.name}</strong>
                      <small>{level.title}</small>
                      {recommended ? <em>Recommended for you</em> : null}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <div className="onboarding-actions">
            <button
              className="button button-primary"
              type="button"
              onClick={() =>
                onSave(
                  {
                    name: name.trim() || "Learner",
                    role,
                    confidence,
                    tasks,
                  },
                  levelId,
                )
              }
            >
              Build my learning path <span aria-hidden="true">→</span>
            </button>
            <button
              className="text-button"
              type="button"
              onClick={skipOnboarding}
            >
              Skip for now
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
