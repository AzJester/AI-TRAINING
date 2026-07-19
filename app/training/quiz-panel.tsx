"use client";

import { useState } from "react";
import { type CourseModule } from "../training-data";
import { trackPrivacyEvent } from "../privacy-analytics";
import { FeedbackPanel } from "./practice-exercises";

export function QuizPanel({
  module,
  onPassed,
}: {
  module: CourseModule;
  onPassed: (score: number) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const score = module.quiz.filter(
    (question) => answers[question.id] === question.correctOptionId,
  ).length;
  const criticalPassed = module.quiz
    .filter((question) => question.critical)
    .every((question) => answers[question.id] === question.correctOptionId);
  const passed = score >= 2 && criticalPassed;

  return (
    <div className="quiz-shell">
      <div className="quiz-intro">
        <p className="eyebrow">KNOWLEDGE CHECK</p>
        <h2>Make the call</h2>
        <p>
          Choose the best answer for each workplace situation. You can retry as
          often as you need.
        </p>
      </div>
      {module.quiz.map((question, questionIndex) => {
        const selected = answers[question.id];
        const isCorrect = selected === question.correctOptionId;
        const selectedOption = question.options.find((option) => option.id === selected);
        return (
          <fieldset className="quiz-question" key={question.id}>
            <legend>
              <span>{questionIndex + 1}</span>
              {question.prompt}
              {question.critical ? <small>Safety-critical</small> : null}
            </legend>
            <div className="quiz-options">
              {question.options.map((option) => (
                <label key={option.id}>
                  <input
                    type="radio"
                    name={question.id}
                    value={option.id}
                    checked={selected === option.id}
                    onChange={() => {
                      setAnswers((current) => ({ ...current, [question.id]: option.id }));
                      setSubmitted(false);
                    }}
                  />
                  <span>{option.text}</span>
                </label>
              ))}
            </div>
            {submitted && selectedOption ? (
              <div className={`answer-feedback ${isCorrect ? "correct" : "incorrect"}`}>
                <strong>{isCorrect ? "Good call." : "Not quite."}</strong>
                <p>{selectedOption.feedback}</p>
                {isCorrect ? <small>{question.explanation}</small> : null}
              </div>
            ) : null}
          </fieldset>
        );
      })}

      {!submitted ? (
        <button
          className="button button-primary"
          type="button"
          disabled={Object.keys(answers).length !== module.quiz.length}
          onClick={() => setSubmitted(true)}
        >
          Check my answers
        </button>
      ) : (
        <FeedbackPanel success={passed}>
          <h3>{passed ? `${score} of 3: ready to use` : `${score} of 3: keep practicing`}</h3>
          <p>
            {passed
              ? "You applied the core idea and passed every critical safety question."
              : criticalPassed
                ? "Review the explanations, then take another pass."
                : "A safety-critical answer needs another look before this skill is ready."}
          </p>
          {passed ? (
            <button
              className="button button-dark"
              type="button"
              onClick={() => onPassed(score)}
            >
              Complete lesson <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button
              className="button button-quiet"
              type="button"
              onClick={() => {
                setAnswers({});
                setSubmitted(false);
                trackPrivacyEvent("quiz_retried", module.id);
              }}
            >
              Try again
            </button>
          )}
        </FeedbackPanel>
      )}
    </div>
  );
}
