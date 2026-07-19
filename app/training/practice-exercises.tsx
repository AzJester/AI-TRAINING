"use client";

import { useState, type ReactNode } from "react";
import {
  type ActionPlanPractice,
  type ClaimVerdict,
  type ContextBuilderPractice,
  type PracticeExercise,
  type RewriteLabPractice,
  type RiskCategoryId,
  type RiskSortPractice,
  type VerificationCheckPractice,
} from "../training-data";

export function PracticeRenderer({
  practice,
  onComplete,
}: {
  practice: PracticeExercise;
  onComplete: () => void;
}) {
  return (
    <div className="practice-shell">
      <div className="practice-heading">
        <p className="eyebrow">{practice.eyebrow}</p>
        <h2>{practice.title}</h2>
        <p className="practice-time">About {practice.estimatedMinutes} minutes</p>
      </div>
      <div className="scenario-banner">
        <span>WORKPLACE SCENARIO</span>
        <p>{practice.scenario}</p>
      </div>
      <ol className="instruction-list">
        {practice.instructions.map((instruction) => (
          <li key={instruction}>{instruction}</li>
        ))}
      </ol>

      {practice.type === "rewrite-lab" ? (
        <RewriteLab practice={practice} onComplete={onComplete} />
      ) : practice.type === "risk-sort" ? (
        <RiskSort practice={practice} onComplete={onComplete} />
      ) : practice.type === "context-builder" ? (
        <ContextBuilder practice={practice} onComplete={onComplete} />
      ) : practice.type === "verification-check" ? (
        <VerificationCheck practice={practice} onComplete={onComplete} />
      ) : (
        <ActionPlan practice={practice} onComplete={onComplete} />
      )}
    </div>
  );
}

function BuilderFields({
  fields,
  values,
  onChange,
}: {
  fields: Array<{ id: string; label: string; prompt: string; placeholder: string }>;
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
}) {
  return (
    <div className="builder-fields">
      {fields.map((field, index) => (
        <label className="builder-field" key={field.id}>
          <span className="builder-label">
            <b>{index + 1}</b>
            <strong>{field.label}</strong>
          </span>
          <small>{field.prompt}</small>
          <textarea
            value={values[field.id] ?? ""}
            placeholder={field.placeholder}
            onChange={(event) => onChange(field.id, event.target.value)}
            rows={3}
          />
        </label>
      ))}
    </div>
  );
}

function RewriteLab({
  practice,
  onComplete,
}: {
  practice: RewriteLabPractice;
  onComplete: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const strongCount = practice.fields.filter(
    (field) => (values[field.id] ?? "").trim().length >= 12,
  ).length;
  const ready = strongCount >= Math.max(3, practice.fields.length - 1);

  return (
    <div className="workbench">
      <div className="starter-prompt">
        <span>STARTING PROMPT</span>
        <p>{practice.starterPrompt}</p>
      </div>
      <BuilderFields
        fields={practice.fields}
        values={values}
        onChange={(id, value) => {
          setValues((current) => ({ ...current, [id]: value }));
          setSubmitted(false);
        }}
      />
      <div className="rubric-row">
        {practice.successChecks.map((check, index) => (
          <span className={index < strongCount ? "is-strong" : ""} key={check}>
            {index < strongCount ? "✓" : "○"} {check}
          </span>
        ))}
      </div>
      <button
        className="button button-primary"
        type="button"
        onClick={() => setSubmitted(true)}
      >
        Check my rewrite
      </button>
      {submitted ? (
        <FeedbackPanel success={ready}>
          <h3>{ready ? "Strong foundation" : "Give the prompt a little more shape"}</h3>
          <p>
            {ready
              ? "You included enough concrete direction to make a useful first draft likely. Compare your version with the example, then continue."
              : `You have ${strongCount} strong elements. Add a useful audience, constraint, format, or review instruction before you continue.`}
          </p>
          <details>
            <summary>Show a model answer</summary>
            <p className="model-answer">{practice.modelAnswer}</p>
          </details>
          {ready ? (
            <button className="button button-dark" type="button" onClick={onComplete}>
              Continue to knowledge check <span aria-hidden="true">→</span>
            </button>
          ) : null}
        </FeedbackPanel>
      ) : null}
    </div>
  );
}

function RiskSort({
  practice,
  onComplete,
}: {
  practice: RiskSortPractice;
  onComplete: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, RiskCategoryId | "">>({});
  const [submitted, setSubmitted] = useState(false);
  const answered = practice.items.filter((item) => answers[item.id]).length;
  const correct = practice.items.filter(
    (item) => answers[item.id] === item.answer,
  ).length;
  const ready = correct === practice.items.length;

  return (
    <div className="workbench">
      <div className="category-key">
        {practice.categories.map((category) => (
          <div key={category.id}>
            <strong>{category.label}</strong>
            <p>{category.description}</p>
          </div>
        ))}
      </div>
      <div className="sort-list">
        {practice.items.map((item) => (
          <div className="sort-item" key={item.id}>
            <div>
              <strong>{item.text}</strong>
              <p>{item.detail}</p>
              {submitted ? (
                <small
                  className={answers[item.id] === item.answer ? "correct" : "incorrect"}
                >
                  {answers[item.id] === item.answer ? "Correct. " : "Reconsider. "}
                  {item.feedback}
                </small>
              ) : null}
            </div>
            <label>
              <span className="sr-only">Classify {item.text}</span>
              <select
                value={answers[item.id] ?? ""}
                onChange={(event) => {
                  setAnswers((current) => ({
                    ...current,
                    [item.id]: event.target.value as RiskCategoryId,
                  }));
                  setSubmitted(false);
                }}
              >
                <option value="">Choose…</option>
                {practice.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ))}
      </div>
      <button
        className="button button-primary"
        type="button"
        disabled={answered !== practice.items.length}
        onClick={() => setSubmitted(true)}
      >
        Check my decisions
      </button>
      {submitted ? (
        <FeedbackPanel success={ready}>
          <h3>
            {ready
              ? "You set the right boundaries"
              : `${correct} of ${practice.items.length} decisions are on track`}
          </h3>
          <p>{practice.debrief}</p>
          {ready ? (
            <button className="button button-dark" type="button" onClick={onComplete}>
              Continue to knowledge check <span aria-hidden="true">→</span>
            </button>
          ) : (
            <p className="feedback-hint">Use the feedback above, revise, and check again.</p>
          )}
        </FeedbackPanel>
      ) : null}
    </div>
  );
}

function ContextBuilder({
  practice,
  onComplete,
}: {
  practice: ContextBuilderPractice;
  onComplete: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const strongCount = practice.fields.filter(
    (field) => (values[field.id] ?? "").trim().length >= 12,
  ).length;
  const ready = strongCount >= Math.max(3, practice.fields.length - 1);

  return (
    <div className="workbench">
      <section className="source-pack">
        <span>SOURCE NOTES</span>
        <ul>
          {practice.sourceNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>
      <BuilderFields
        fields={practice.fields}
        values={values}
        onChange={(id, value) => {
          setValues((current) => ({ ...current, [id]: value }));
          setSubmitted(false);
        }}
      />
      <div className="rubric-row">
        {practice.successChecks.map((check, index) => (
          <span className={index < strongCount ? "is-strong" : ""} key={check}>
            {index < strongCount ? "✓" : "○"} {check}
          </span>
        ))}
      </div>
      <button
        className="button button-primary"
        type="button"
        onClick={() => setSubmitted(true)}
      >
        Review my context
      </button>
      {submitted ? (
        <FeedbackPanel success={ready}>
          <h3>{ready ? "Useful context, without the clutter" : "Add the missing direction"}</h3>
          <p>
            {ready
              ? "Your instructions make the source material easier to use and harder to misread."
              : "Complete more of the context fields. The tool should know the job, the source, the limits, and the final format."}
          </p>
          <details>
            <summary>Compare with a model answer</summary>
            <p className="model-answer">{practice.modelAnswer}</p>
          </details>
          {ready ? (
            <button className="button button-dark" type="button" onClick={onComplete}>
              Continue to knowledge check <span aria-hidden="true">→</span>
            </button>
          ) : null}
        </FeedbackPanel>
      ) : null}
    </div>
  );
}

function VerificationCheck({
  practice,
  onComplete,
}: {
  practice: VerificationCheckPractice;
  onComplete: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, ClaimVerdict | "">>({});
  const [submitted, setSubmitted] = useState(false);
  const correct = practice.claims.filter(
    (claim) => answers[claim.id] === claim.answer,
  ).length;
  const ready = correct === practice.claims.length;

  return (
    <div className="workbench">
      <div className="evidence-grid">
        <section className="source-pack">
          <span>SOURCE PACK</span>
          <ul>
            {practice.sourcePack.map((source) => (
              <li key={source}>{source}</li>
            ))}
          </ul>
        </section>
        <section className="draft-box">
          <span>AI DRAFT</span>
          <p>{practice.draft}</p>
        </section>
      </div>
      <div className="claim-list">
        {practice.claims.map((claim) => (
          <fieldset key={claim.id}>
            <legend>{claim.text}</legend>
            <div className="segmented-control">
              {(["supported", "unsupported", "needs-context"] as ClaimVerdict[]).map(
                (verdict) => (
                  <label key={verdict}>
                    <input
                      type="radio"
                      name={claim.id}
                      value={verdict}
                      checked={answers[claim.id] === verdict}
                      onChange={() => {
                        setAnswers((current) => ({ ...current, [claim.id]: verdict }));
                        setSubmitted(false);
                      }}
                    />
                    <span>
                      {verdict === "needs-context"
                        ? "Needs context"
                        : verdict[0].toUpperCase() + verdict.slice(1)}
                    </span>
                  </label>
                ),
              )}
            </div>
            {submitted ? (
              <p
                className={`claim-feedback ${answers[claim.id] === claim.answer ? "correct" : "incorrect"}`}
              >
                {claim.feedback}
              </p>
            ) : null}
          </fieldset>
        ))}
      </div>
      <button
        className="button button-primary"
        type="button"
        disabled={Object.keys(answers).length !== practice.claims.length}
        onClick={() => setSubmitted(true)}
      >
        Check the evidence
      </button>
      {submitted ? (
        <FeedbackPanel success={ready}>
          <h3>{ready ? "Every important claim accounted for" : `${correct} of ${practice.claims.length} verdicts match the evidence`}</h3>
          <details>
            <summary>Show the improved draft</summary>
            <p className="model-answer">{practice.improvedDraft}</p>
          </details>
          {ready ? (
            <button className="button button-dark" type="button" onClick={onComplete}>
              Continue to knowledge check <span aria-hidden="true">→</span>
            </button>
          ) : (
            <p className="feedback-hint">Compare each sentence with the source pack, then try again.</p>
          )}
        </FeedbackPanel>
      ) : null}
    </div>
  );
}

function ActionPlan({
  practice,
  onComplete,
}: {
  practice: ActionPlanPractice;
  onComplete: () => void;
}) {
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [plan, setPlan] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const filled = practice.planPrompts.filter(
    (prompt) => (plan[prompt.id] ?? "").trim().length >= 10,
  ).length;
  const ready =
    selectedConcerns.length >= Math.min(3, practice.concerns.length) &&
    filled === practice.planPrompts.length;

  return (
    <div className="workbench">
      <section className="draft-box wide">
        <span>AI DRAFT TO REVIEW</span>
        <p>{practice.aiDraft}</p>
      </section>
      <fieldset className="concern-list">
        <legend>Which concerns need a human checkpoint?</legend>
        {practice.concerns.map((concern) => (
          <label key={concern.id}>
            <input
              type="checkbox"
              checked={selectedConcerns.includes(concern.id)}
              onChange={(event) => {
                setSelectedConcerns((current) =>
                  event.target.checked
                    ? [...current, concern.id]
                    : current.filter((id) => id !== concern.id),
                );
                setSubmitted(false);
              }}
            />
            <span>
              <strong>{concern.category}</strong>
              {concern.text}
            </span>
          </label>
        ))}
      </fieldset>
      <div className="builder-fields compact">
        {practice.planPrompts.map((prompt, index) => (
          <label className="builder-field" key={prompt.id}>
            <span className="builder-label">
              <b>{index + 1}</b>
              <strong>{prompt.label}</strong>
            </span>
            <textarea
              rows={3}
              value={plan[prompt.id] ?? ""}
              placeholder={prompt.placeholder}
              onChange={(event) => {
                setPlan((current) => ({ ...current, [prompt.id]: event.target.value }));
                setSubmitted(false);
              }}
            />
          </label>
        ))}
      </div>
      <button
        className="button button-primary"
        type="button"
        onClick={() => setSubmitted(true)}
      >
        Check my action plan
      </button>
      {submitted ? (
        <FeedbackPanel success={ready}>
          <h3>{ready ? "A repeatable workflow with human ownership" : "Add the checkpoints that keep this work responsible"}</h3>
          <ol>
            {practice.modelPlan.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {ready ? (
            <button className="button button-dark" type="button" onClick={onComplete}>
              Continue to knowledge check <span aria-hidden="true">→</span>
            </button>
          ) : null}
        </FeedbackPanel>
      ) : null}
    </div>
  );
}

export function FeedbackPanel({
  success,
  children,
}: {
  success: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={`feedback-panel ${success ? "success" : "try-again"}`}
      aria-live="polite"
    >
      <span className="feedback-icon" aria-hidden="true">
        {success ? "✓" : "↻"}
      </span>
      <div>{children}</div>
    </section>
  );
}
