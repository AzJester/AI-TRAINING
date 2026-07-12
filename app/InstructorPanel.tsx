"use client";

import "./instructor-panel.css";

export interface InstructorPanelProps {
  learnerName: string;
  role: string;
  selectedLevel: string;
  moduleCompleted: number;
  moduleTotal: number;
  capstonesCompleted: number;
  capstoneTotal: number;
  creatorCompleted: number;
  creatorTotal: number;
  quizScores: Record<string, number>;
  bookmarksCount: number;
  onExport: () => void;
  onPrint: () => void;
  onReset: () => void;
}

type ReadinessTone = "ready" | "building" | "starting";

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function percentage(completed: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((clamp(completed, 0, total) / total) * 100);
}

function normalizeQuizScore(score: number) {
  if (!Number.isFinite(score)) return 0;
  if (score <= 3) return clamp((score / 3) * 100, 0, 100);
  return clamp(score, 0, 100);
}

function getReadiness(score: number): {
  label: string;
  tone: ReadinessTone;
  interpretation: string;
} {
  if (score >= 85) {
    return {
      label: "Ready to apply",
      tone: "ready",
      interpretation:
        "The learner has strong completion and assessment results. Focus the next conversation on transfer to real, approved work scenarios.",
    };
  }

  if (score >= 60) {
    return {
      label: "Building confidence",
      tone: "building",
      interpretation:
        "The learner is making useful progress. Reinforce the unfinished areas and ask for a short demonstration before independent use.",
    };
  }

  return {
    label: "Getting started",
    tone: "starting",
    interpretation:
      "The learner needs more guided practice. Start with one safe, role-relevant task and use feedback to build confidence step by step.",
  };
}

export function InstructorPanel({
  learnerName,
  role,
  selectedLevel,
  moduleCompleted,
  moduleTotal,
  capstonesCompleted,
  capstoneTotal,
  creatorCompleted,
  creatorTotal,
  quizScores,
  bookmarksCount,
  onExport,
  onPrint,
  onReset,
}: InstructorPanelProps) {
  const modulesPercent = percentage(moduleCompleted, moduleTotal);
  const capstonesPercent = percentage(capstonesCompleted, capstoneTotal);
  const creatorPercent = percentage(creatorCompleted, creatorTotal);
  const totalCompleted =
    clamp(moduleCompleted, 0, Math.max(moduleTotal, 0)) +
    clamp(capstonesCompleted, 0, Math.max(capstoneTotal, 0)) +
    clamp(creatorCompleted, 0, Math.max(creatorTotal, 0));
  const totalAvailable = moduleTotal + capstoneTotal + creatorTotal;
  const completionPercent = percentage(totalCompleted, totalAvailable);
  const scores = Object.values(quizScores)
    .filter((score) => Number.isFinite(score))
    .map(normalizeQuizScore);
  const quizAverage = scores.length
    ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)
    : 0;
  const readinessScore = Math.round(
    scores.length
      ? completionPercent * 0.75 + quizAverage * 0.25
      : completionPercent,
  );
  const readiness = getReadiness(readinessScore);
  const scoreDistribution = [
    {
      label: "Mastered",
      detail: "80% to 100%",
      className: "mastered",
      count: scores.filter((score) => score >= 80).length,
    },
    {
      label: "Developing",
      detail: "60% to 79%",
      className: "developing",
      count: scores.filter((score) => score >= 60 && score < 80).length,
    },
    {
      label: "Review",
      detail: "Below 60%",
      className: "review",
      count: scores.filter((score) => score < 60).length,
    },
  ];
  const displayName = learnerName.trim() || "Learner";
  const displayRole = role.trim() || "Role not selected";
  const displayLevel = selectedLevel.trim() || "Level not selected";

  return (
    <section className="instructor-panel" aria-labelledby="instructor-panel-title">
      <header className="instructor-header">
        <div>
          <p className="instructor-kicker">INSTRUCTOR VIEW</p>
          <h2 id="instructor-panel-title">Local learning snapshot</h2>
          <p>
            Review {displayName}&apos;s activity, identify the next coaching move,
            and prepare a progress record from this device.
          </p>
        </div>
        <div className={`instructor-readiness-badge ${readiness.tone}`}>
          <span>Readiness</span>
          <strong>{readiness.label}</strong>
        </div>
      </header>

      <div className="instructor-profile" aria-label="Learner profile">
        <div>
          <span>Learner</span>
          <strong>{displayName}</strong>
        </div>
        <div>
          <span>Role family</span>
          <strong>{displayRole}</strong>
        </div>
        <div>
          <span>Current level</span>
          <strong>{displayLevel}</strong>
        </div>
      </div>

      <div className="instructor-metric-grid">
        <ProgressMetric
          label="Lessons"
          completed={moduleCompleted}
          total={moduleTotal}
          percent={modulesPercent}
        />
        <ProgressMetric
          label="Capstones"
          completed={capstonesCompleted}
          total={capstoneTotal}
          percent={capstonesPercent}
        />
        <ProgressMetric
          label="Creator labs"
          completed={creatorCompleted}
          total={creatorTotal}
          percent={creatorPercent}
        />
        <article className="instructor-metric-card accent">
          <span className="instructor-metric-label">Saved resources</span>
          <strong className="instructor-metric-value">{bookmarksCount}</strong>
          <span className="instructor-metric-detail">
            {bookmarksCount === 1 ? "bookmark" : "bookmarks"} on this device
          </span>
        </article>
      </div>

      <div className="instructor-analysis-grid">
        <article className="instructor-analysis-card">
          <div className="instructor-card-heading">
            <div>
              <p className="instructor-kicker">ASSESSMENTS</p>
              <h3>Score distribution</h3>
            </div>
            <div className="instructor-average" aria-label={`Quiz average ${quizAverage}%`}>
              <strong>{scores.length ? `${quizAverage}%` : "N/A"}</strong>
              <span>average</span>
            </div>
          </div>

          {scores.length ? (
            <div className="instructor-distribution">
              {scoreDistribution.map((bucket) => {
                const bucketPercent = Math.round((bucket.count / scores.length) * 100);
                return (
                  <div className="instructor-distribution-row" key={bucket.label}>
                    <div className="instructor-distribution-copy">
                      <strong>{bucket.label}</strong>
                      <span>{bucket.detail}</span>
                    </div>
                    <div
                      className="instructor-bar"
                      role="progressbar"
                      aria-label={`${bucket.label} quiz results`}
                      aria-valuemin={0}
                      aria-valuemax={scores.length}
                      aria-valuenow={bucket.count}
                    >
                      <span
                        className={bucket.className}
                        style={{ width: `${bucketPercent}%` }}
                      />
                    </div>
                    <strong className="instructor-distribution-count">
                      {bucket.count}
                    </strong>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="instructor-empty-state">
              No quiz scores are recorded yet. Ask the learner to complete one
              lesson check, then return here to review the result.
            </p>
          )}
        </article>

        <article className={`instructor-analysis-card readiness ${readiness.tone}`}>
          <p className="instructor-kicker">READINESS INTERPRETATION</p>
          <div className="instructor-readiness-score">
            <strong>{readinessScore}%</strong>
            <span>combined readiness</span>
          </div>
          <div
            className="instructor-bar readiness-bar"
            role="progressbar"
            aria-label="Combined readiness"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={readinessScore}
          >
            <span style={{ width: `${readinessScore}%` }} />
          </div>
          <h3>{readiness.label}</h3>
          <p>{readiness.interpretation}</p>
          <small>
            This indicator combines activity completion and available quiz
            scores. It is coaching guidance, not a personnel evaluation.
          </small>
        </article>
      </div>

      <article className="instructor-talking-points">
        <div>
          <p className="instructor-kicker">FACILITATOR GUIDE</p>
          <h3>Suggested talking points</h3>
        </div>
        <ol>
          <li>
            Ask {displayName} to describe one useful lesson in their own words
            and connect it to a {displayRole.toLowerCase()} task.
          </li>
          <li>
            Review one completed practice item together. Confirm the learner
            checked accuracy, context, and appropriate data handling.
          </li>
          {scores.some((score) => score < 60) ? (
            <li>
              Revisit the quiz topics marked for review and practice a similar
              scenario with non-sensitive information.
            </li>
          ) : (
            <li>
              Invite the learner to explain how they would verify an AI result
              before using it in workplace decisions.
            </li>
          )}
          {creatorCompleted < creatorTotal ? (
            <li>
              Choose one unfinished Creator Studio lab that supports the
              learner&apos;s current work and set a specific practice goal.
            </li>
          ) : (
            <li>
              Review a Creator Studio output and identify one improvement that
              would make it safer, clearer, or easier to reuse.
            </li>
          )}
        </ol>
      </article>

      <aside className="instructor-privacy" aria-label="Local data notice">
        <span className="instructor-privacy-mark" aria-hidden="true">LOCAL</span>
        <div>
          <strong>Device-only view</strong>
          <p>
            This panel reads activity saved in this browser. It does not track
            a team, send data to an API, or provide organization-wide reporting.
          </p>
        </div>
      </aside>

      <footer className="instructor-actions">
        <div className="instructor-action-group">
          <button className="instructor-button primary" type="button" onClick={onExport}>
            Export local report
          </button>
          <button className="instructor-button secondary" type="button" onClick={onPrint}>
            Print local summary
          </button>
        </div>
        <button className="instructor-button danger" type="button" onClick={onReset}>
          Reset all progress to 0
        </button>
      </footer>
    </section>
  );
}

function ProgressMetric({
  label,
  completed,
  total,
  percent,
}: {
  label: string;
  completed: number;
  total: number;
  percent: number;
}) {
  const safeCompleted = clamp(completed, 0, Math.max(total, 0));

  return (
    <article className="instructor-metric-card">
      <span className="instructor-metric-label">{label}</span>
      <strong className="instructor-metric-value">
        {safeCompleted}<small>/{Math.max(total, 0)}</small>
      </strong>
      <div
        className="instructor-bar metric-bar"
        role="progressbar"
        aria-label={`${label} completed`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      <span className="instructor-metric-detail">{percent}% complete</span>
    </article>
  );
}
