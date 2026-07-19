"use client";

import { useState } from "react";
import {
  CLEAR_STEPS,
  TRAINING_LEVELS,
  type CapstoneScenario,
} from "../training-data";
import { FeedbackPanel } from "./practice-exercises";

export function CapstonePlayer({
  capstone,
  stage,
  complete,
  lessonsComplete,
  onStageChange,
  onComplete,
  onExit,
}: {
  capstone: CapstoneScenario;
  stage: number;
  complete: boolean;
  lessonsComplete: boolean;
  onStageChange: (stage: number) => void;
  onComplete: () => void;
  onExit: () => void;
}) {
  return (
    <div className="lesson-page capstone-page">
      <header className="lesson-topbar">
        <button className="text-button" type="button" onClick={onExit}>
          <span aria-hidden="true">←</span> Back to course
        </button>
        <div className="lesson-progress-copy">
          <span>Capstone · {stage === 0 ? "Brief" : stage === 1 ? "Workbench" : "Complete"}</span>
          <strong>{stage === 0 ? "20%" : stage === 1 ? "65%" : "100%"}</strong>
        </div>
        <div className="lesson-progress-track" aria-hidden="true">
          <span style={{ width: stage === 0 ? "20%" : stage === 1 ? "65%" : "100%" }} />
        </div>
      </header>
      <div className="capstone-content">
        <p className="eyebrow">FINAL CHALLENGE</p>
        <h1 id="lesson-heading" tabIndex={-1}>
          {capstone.title}
        </h1>
        <p className="lesson-lede">{capstone.outcome}</p>
        {stage === 0 ? (
          <CapstoneBrief capstone={capstone} onContinue={() => onStageChange(1)} />
        ) : stage === 1 ? (
          <CapstoneWorkbench capstone={capstone} onComplete={onComplete} />
        ) : (
          <CapstoneComplete
            capstone={capstone}
            complete={complete}
            lessonsComplete={lessonsComplete}
            onExit={onExit}
          />
        )}
      </div>
    </div>
  );
}

function CapstoneBrief({
  capstone,
  onContinue,
}: {
  capstone: CapstoneScenario;
  onContinue: () => void;
}) {
  return (
    <div className="capstone-brief">
      <section className="scenario-banner large">
        <span>THE ASSIGNMENT</span>
        <p>{capstone.scenario}</p>
      </section>
      <section className="source-pack">
        <span>YOUR SOURCE PACK</span>
        <ul>
          {capstone.sourcePack.map((source) => (
            <li key={source}>{source}</li>
          ))}
        </ul>
      </section>
      <section>
        <p className="eyebrow">YOUR FIVE MOVES</p>
        <div className="capstone-stage-list">
          {capstone.stages.map((item) => {
            const clearStep = CLEAR_STEPS.find((step) => step.key === item.step);
            return (
              <article key={item.step}>
                <span>{clearStep?.letter}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.deliverable}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <button className="button button-primary" type="button" onClick={onContinue}>
        Enter the workbench <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}

function CapstoneWorkbench({
  capstone,
  onComplete,
}: {
  capstone: CapstoneScenario;
  onComplete: () => void;
}) {
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [rubric, setRubric] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const strongResponses = capstone.stages.filter(
    (item) => (responses[item.step] ?? "").trim().length >= 18,
  ).length;
  const ready = strongResponses >= 4 && rubric.length === capstone.rubric.length;

  return (
    <div className="capstone-workbench">
      <div className="capstone-response-grid">
        {capstone.stages.map((item, index) => {
          const clearStep = CLEAR_STEPS.find((step) => step.key === item.step);
          return (
            <label className="capstone-response" key={item.step}>
              <span className="capstone-response-head">
                <b>{clearStep?.letter}</b>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.deliverable}</small>
                </span>
              </span>
              <span className="prompt-question">{item.prompt}</span>
              <textarea
                rows={4}
                value={responses[item.step] ?? ""}
                placeholder={`Write your ${index + 1 === 3 ? "prompt" : "decision"} here…`}
                onChange={(event) => {
                  setResponses((current) => ({ ...current, [item.step]: event.target.value }));
                  setSubmitted(false);
                }}
              />
            </label>
          );
        })}
      </div>
      <section className="model-response">
        <span>SIMULATED AI RESPONSE</span>
        <p>{capstone.modelResponse}</p>
      </section>
      <fieldset className="rubric-checklist">
        <legend>Final human review</legend>
        <p>Confirm each standard before the result is ready to use.</p>
        {capstone.rubric.map((item) => (
          <label key={item.id}>
            <input
              type="checkbox"
              checked={rubric.includes(item.id)}
              onChange={(event) => {
                setRubric((current) =>
                  event.target.checked
                    ? [...current, item.id]
                    : current.filter((id) => id !== item.id),
                );
                setSubmitted(false);
              }}
            />
            <span>
              <strong>{item.label}</strong>
              {item.description}
            </span>
          </label>
        ))}
      </fieldset>
      <button
        className="button button-primary"
        type="button"
        onClick={() => setSubmitted(true)}
      >
        Score my capstone
      </button>
      {submitted ? (
        <FeedbackPanel success={ready}>
          <h3>{ready ? "You can stand behind this workflow" : "One more review pass"}</h3>
          <p>
            {ready
              ? "You used at least four CLEAR moves and completed every human review checkpoint."
              : `You have ${strongResponses} of 5 CLEAR moves and ${rubric.length} of ${capstone.rubric.length} review checks. Strengthen the missing parts, then resubmit.`}
          </p>
          {ready ? (
            <button className="button button-dark" type="button" onClick={onComplete}>
              Complete the course <span aria-hidden="true">→</span>
            </button>
          ) : null}
        </FeedbackPanel>
      ) : null}
    </div>
  );
}

function CapstoneComplete({
  capstone,
  complete,
  lessonsComplete,
  onExit,
}: {
  capstone: CapstoneScenario;
  complete: boolean;
  lessonsComplete: boolean;
  onExit: () => void;
}) {
  const level = TRAINING_LEVELS.find((item) => item.id === capstone.levelId);
  const levelComplete = complete && lessonsComplete;
  return (
    <section className="completion-panel course-complete">
      <div className="completion-mark" aria-hidden="true">
        ✓
      </div>
      <p className="eyebrow">
        {levelComplete
          ? `${level?.name.toUpperCase()} LEVEL COMPLETE`
          : "CAPSTONE COMPLETE"}
      </p>
      <h2>
        {levelComplete
          ? `You’re ready to work CLEAR at the ${level?.name.toLowerCase()} level.`
          : "Finish the remaining lessons to complete this level."}
      </h2>
      <p>
        You can frame a task, protect information, build useful context, verify
        the result, and keep human judgment in charge.
      </p>
      <div className="clear-completion-row" aria-label="CLEAR skills completed">
        {CLEAR_STEPS.map((step) => (
          <span key={step.key}>
            <b>{step.letter}</b>
            {step.name}
          </span>
        ))}
      </div>
      <button className="button button-primary" type="button" onClick={onExit}>
        Return to course
      </button>
    </section>
  );
}
