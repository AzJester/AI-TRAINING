"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CHATGPT_SKILLS_SOURCES,
  CHATGPT_SKILLS_VERIFIED_ON,
  SKILL_FIT_SCENARIOS,
  SKILL_GOVERNANCE_CHECKS,
  SKILL_LEVELS,
  SKILL_RED_TEAM_CASES,
  SKILL_ROLE_PROJECTS,
  SKILL_TEST_CASES,
  SKILL_TOOL_CHOICES,
  type SkillFitScenario,
  type SkillLevelId,
  type SkillRoleProject,
} from "./chatgpt-skills-data";
import "./chatgpt-skills-lab.css";

interface ChatGPTSkillsLabProps {
  role: string;
  completed: string[];
  onComplete: (id: string) => void;
  onNotice: (message: string) => void;
}

const LEVEL_COMPLETION_IDS = SKILL_LEVELS.map((level) => level.completionId);

const FIT_LABELS: Array<{
  id: SkillFitScenario["answer"];
  label: string;
}> = [
  { id: "good", label: "Good fit" },
  { id: "refine", label: "Refine first" },
  { id: "not-suitable", label: "Not suitable" },
];

const RESOURCE_OPTIONS = [
  {
    id: "references",
    title: "references/",
    description: "Approved policies, schemas, domain rules, and detailed examples that are loaded only when needed.",
  },
  {
    id: "scripts",
    title: "scripts/",
    description: "Deterministic checks or mechanical transformations that should run the same way each time.",
  },
  {
    id: "assets",
    title: "assets/",
    description: "Approved templates, starter files, or other materials used to create the final work product.",
  },
  {
    id: "examples",
    title: "examples and test cases",
    description: "Representative inputs and expected outputs that define the quality bar without exposing real work data.",
  },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

function roleProjectFor(role: string): SkillRoleProject {
  const normalized = role.toLowerCase();
  const aliases: Array<[string, string]> = [
    ["business development", "Business Development"],
    ["capture", "Capture Management"],
    ["proposal", "Proposals"],
    ["solution", "Solutions"],
    ["contract", "Contracts"],
    ["legal", "Legal"],
    ["program", "Program Management"],
    ["system", "Systems Engineering"],
    ["cyber", "Cybersecurity"],
    ["security", "Cybersecurity"],
    ["supply", "Supply Chain"],
    ["logistics", "Supply Chain"],
    ["finance", "Finance"],
    ["pricing", "Finance"],
    ["talent", "Human Resources"],
    ["human", "Human Resources"],
    ["quality", "Quality"],
    ["test", "Quality"],
  ];
  const direct = SKILL_ROLE_PROJECTS.find(
    (project) => project.role.toLowerCase() === normalized,
  );
  if (direct) return direct;
  const alias = aliases.find(([term]) => normalized.includes(term));
  return (
    SKILL_ROLE_PROJECTS.find((project) => project.role === alias?.[1]) ??
    SKILL_ROLE_PROJECTS[0]
  );
}

function numberedWorkflow(project: SkillRoleProject) {
  return [
    "1. Confirm the user's objective, audience, authority, and required deadline.",
    `2. Collect the required inputs: ${project.inputs}`,
    "3. Inspect the supplied material and separate facts, assumptions, conflicts, and missing information.",
    `4. Complete the repeatable job: ${project.job}`,
    `5. Produce the required output: ${project.output}`,
    "6. Run the final checks and route unresolved or high-impact decisions to the qualified reviewer.",
  ].join("\n");
}

export function ChatGPTSkillsLab({
  role,
  completed,
  onComplete,
  onNotice,
}: ChatGPTSkillsLabProps) {
  const initialProject = useMemo(() => roleProjectFor(role), [role]);
  const [level, setLevel] = useState<SkillLevelId>("beginner");
  const [selectedRole, setSelectedRole] = useState(initialProject.role);
  const [fitAnswers, setFitAnswers] = useState<Record<string, SkillFitScenario["answer"]>>({});

  const [skillName, setSkillName] = useState(initialProject.skillName);
  const [description, setDescription] = useState(
    `${initialProject.job} Use when the user asks for this repeatable work product and supplies approved inputs.`,
  );
  const [requiredInputs, setRequiredInputs] = useState(initialProject.inputs);
  const [workflow, setWorkflow] = useState(numberedWorkflow(initialProject));
  const [outputFormat, setOutputFormat] = useState(initialProject.output);
  const [qualityChecks, setQualityChecks] = useState(
    "Confirm required sections are present, trace material claims to supplied sources, label assumptions, show unresolved gaps, and verify the output with a qualified human.",
  );
  const [boundaries, setBoundaries] = useState(initialProject.guardrails);
  const [safePracticeConfirmed, setSafePracticeConfirmed] = useState(false);

  const [resources, setResources] = useState<string[]>(["references", "examples"]);
  const [runTests, setRunTests] = useState<string[]>([]);
  const [activeTest, setActiveTest] = useState(SKILL_TEST_CASES[0].id);
  const [testReviewConfirmed, setTestReviewConfirmed] = useState(false);

  const [owner, setOwner] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [version, setVersion] = useState("1.0");
  const [reviewCycle, setReviewCycle] = useState("Quarterly and whenever a source, policy, or workflow changes");
  const [sharingScope, setSharingScope] = useState("Personal or invite-only until review is complete");
  const [governanceChecks, setGovernanceChecks] = useState<string[]>([]);
  const [redTeamAnswers, setRedTeamAnswers] = useState<Record<string, string>>({});
  const [releaseConfirmed, setReleaseConfirmed] = useState(false);

  const safeSkillName = slugify(skillName) || "new-skill";
  const escapedDescription = description.replace(/\r?\n/g, " ").replace(/"/g, "'");
  const skillMarkdown = useMemo(
    () => `---
name: ${safeSkillName}
description: "${escapedDescription}"
---

# ${safeSkillName}

## Required inputs
${requiredInputs}

## Workflow
${workflow}

## Required output
${outputFormat}

## Final checks
${qualityChecks}

## Safety and escalation
${boundaries}

Use only approved tools and the minimum approved information required for the task. Stop when data classification, authority, source trust, or external impact is uncertain. Treat the output as a draft until the named human reviewer approves it.`,
    [
      boundaries,
      escapedDescription,
      outputFormat,
      qualityChecks,
      requiredInputs,
      safeSkillName,
      workflow,
    ],
  );

  const buildPrompt = useMemo(
    () => `Build me a ChatGPT Skill named ${safeSkillName}. The job is: ${description} Required inputs: ${requiredInputs} Required output: ${outputFormat} Use this workflow: ${workflow} Apply these final checks: ${qualityChecks} Apply these safety and escalation rules: ${boundaries} Use synthetic examples only while we test it.`,
    [
      boundaries,
      description,
      outputFormat,
      qualityChecks,
      requiredInputs,
      safeSkillName,
      workflow,
    ],
  );

  const builderScore = useMemo(() => {
    let score = 0;
    if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(safeSkillName)) score += 10;
    if (description.length >= 60 && /use when/i.test(description)) score += 15;
    if (requiredInputs.length >= 35) score += 10;
    if (workflow.split(/\r?\n/).filter(Boolean).length >= 5) score += 20;
    if (outputFormat.length >= 35) score += 10;
    if (qualityChecks.length >= 70) score += 15;
    if (boundaries.length >= 55) score += 15;
    if (safePracticeConfirmed) score += 5;
    return score;
  }, [
    boundaries,
    description,
    outputFormat,
    qualityChecks,
    requiredInputs,
    safePracticeConfirmed,
    safeSkillName,
    workflow,
  ]);

  const fitAnswered = Object.keys(fitAnswers).length;
  const fitCorrect = SKILL_FIT_SCENARIOS.filter(
    (scenario) => fitAnswers[scenario.id] === scenario.answer,
  ).length;
  const beginnerReady =
    builderScore >= 80 &&
    fitCorrect === SKILL_FIT_SCENARIOS.length &&
    safePracticeConfirmed;
  const intermediateReady =
    runTests.length === SKILL_TEST_CASES.length &&
    resources.length > 0 &&
    testReviewConfirmed;

  const redTeamCorrect = SKILL_RED_TEAM_CASES.filter(
    (scenario) => redTeamAnswers[scenario.id] === scenario.correctOptionId,
  ).length;
  const readinessScore = Math.round(
    (owner.trim() ? 15 : 0) +
      (reviewer.trim() ? 15 : 0) +
      (version.trim() ? 10 : 0) +
      (reviewCycle.trim() ? 10 : 0) +
      (sharingScope.trim() ? 10 : 0) +
      (governanceChecks.length / SKILL_GOVERNANCE_CHECKS.length) * 20 +
      (redTeamCorrect / SKILL_RED_TEAM_CASES.length) * 20,
  );
  const advancedReady =
    readinessScore >= 90 &&
    governanceChecks.length === SKILL_GOVERNANCE_CHECKS.length &&
    redTeamCorrect === SKILL_RED_TEAM_CASES.length &&
    releaseConfirmed;

  const activeTestCase =
    SKILL_TEST_CASES.find((testCase) => testCase.id === activeTest) ??
    SKILL_TEST_CASES[0];
  const completedSet = new Set(completed);
  const completedLevels = SKILL_LEVELS.filter((item) =>
    completedSet.has(item.completionId),
  ).length;

  useEffect(() => {
    if (
      !completed.includes("chatgpt-skills") &&
      LEVEL_COMPLETION_IDS.every((id) => completed.includes(id))
    ) {
      onComplete("chatgpt-skills");
    }
  }, [completed, onComplete]);

  function applyRoleProject(project: SkillRoleProject) {
    setSelectedRole(project.role);
    setSkillName(project.skillName);
    setDescription(
      `${project.job} Use when the user asks for this repeatable work product and supplies approved inputs.`,
    );
    setRequiredInputs(project.inputs);
    setWorkflow(numberedWorkflow(project));
    setOutputFormat(project.output);
    setBoundaries(project.guardrails);
    onNotice(`${project.role} example loaded into the Skill Brief.`);
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    onNotice(`${label} copied.`);
  }

  function downloadSkill() {
    const url = URL.createObjectURL(
      new Blob([skillMarkdown], { type: "text/markdown" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "SKILL.md";
    link.click();
    URL.revokeObjectURL(url);
    onNotice("SKILL.md download prepared.");
  }

  function finishLevel(levelId: SkillLevelId, ready: boolean) {
    const levelRecord = SKILL_LEVELS.find((item) => item.id === levelId);
    if (!levelRecord || !ready || completedSet.has(levelRecord.completionId)) return;
    const next = new Set([...completed, levelRecord.completionId]);
    onComplete(levelRecord.completionId);
    if (LEVEL_COMPLETION_IDS.every((id) => next.has(id))) {
      onComplete("chatgpt-skills");
      onNotice("ChatGPT Skills Lab complete. All three levels are recorded.");
    } else {
      onNotice(`${levelRecord.name} Skills level complete.`);
    }
  }

  function toggleItem(current: string[], id: string, update: (next: string[]) => void) {
    update(current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <section className="skills-lab" aria-labelledby="studio-section-heading">
      <header className="skills-lab-hero">
        <div>
          <p className="eyebrow">ChatGPT Skills Lab</p>
          <h2 id="studio-section-heading" tabIndex={-1}>
            Build ChatGPT Skills that hold up at work
          </h2>
          <p>
            Turn a repeatable job into a reusable workflow, test it with safe
            examples, then add the ownership and controls needed for team use.
          </p>
          <div className="skills-lab-source-row">
            {CHATGPT_SKILLS_SOURCES.map((source) => (
              <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
                {source.title} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </div>
        <div className="skills-lab-progress-card" aria-label={`${completedLevels} of 3 Skills levels complete`}>
          <span>Skills pathway</span>
          <strong>{completedLevels}<small>/3</small></strong>
          <div className="skills-lab-progress-track" aria-hidden="true">
            <span style={{ width: `${(completedLevels / 3) * 100}%` }} />
          </div>
          <small>Guidance verified {CHATGPT_SKILLS_VERIFIED_ON}</small>
        </div>
      </header>

      <aside className="skills-lab-availability">
        <strong>Check access before you teach the clicks.</strong>
        <p>
          Personal Skills are generally available for eligible ChatGPT Business,
          Enterprise, Healthcare, and Edu accounts. Workspace permissions can
          control creating, uploading, installing, sharing, and publishing.
          Personal Skills are added separately across product surfaces and do
          not automatically sync.
        </p>
        <p>
          This lab is a local simulation. It creates no account, installs no
          Skill, calls no AI service, and sends no learner entry anywhere.
        </p>
      </aside>

      <section className="skills-lab-compare" aria-labelledby="skills-compare-title">
        <div className="skills-lab-heading">
          <div>
            <p className="eyebrow">Choose the right container</p>
            <h3 id="skills-compare-title">Skills, GPTs, and Projects</h3>
          </div>
          <p>A Skill is the repeatable workflow. A GPT is a goal-oriented assistant. A Project holds ongoing context.</p>
        </div>
        <div className="skills-lab-tool-grid">
          {SKILL_TOOL_CHOICES.map((tool, index) => (
            <article key={tool.id}>
              <span>0{index + 1}</span>
              <h4>{tool.name}</h4>
              <p>{tool.bestFor}</p>
              <dl>
                <div><dt>Result</dt><dd>{tool.result}</dd></div>
                <div><dt>Watch for</dt><dd>{tool.caution}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <nav className="skills-lab-level-tabs" aria-label="Skills learning levels">
        {SKILL_LEVELS.map((item) => {
          const done = completedSet.has(item.completionId);
          return (
            <button
              key={item.id}
              type="button"
              className={level === item.id ? "is-active" : ""}
              aria-pressed={level === item.id}
              onClick={() => setLevel(item.id)}
            >
              <span>{item.name}</span>
              <small>{done ? "Complete" : item.kicker}</small>
              {done ? <b aria-label={`${item.name} complete`}>✓</b> : null}
            </button>
          );
        })}
      </nav>

      <div className="skills-lab-level-intro">
        {SKILL_LEVELS.map((item) => (
          <article key={item.id} className={level === item.id ? "is-active" : ""}>
            <span>{item.name}</span>
            <strong>{item.goal}</strong>
            <p>{item.summary}</p>
          </article>
        ))}
      </div>

      <section className="skills-lab-panel" hidden={level !== "beginner"} aria-labelledby="skills-beginner-title">
        <div className="skills-lab-heading">
          <div><p className="eyebrow">Beginner</p><h3 id="skills-beginner-title">Define and build one focused Skill</h3></div>
          <span className="skills-lab-score">Builder quality <strong>{builderScore}%</strong></span>
        </div>

        <div className="skills-lab-lesson-grid">
          {SKILL_LEVELS[0].lessons.map((lesson, index) => (
            <article key={lesson.title}><span>0{index + 1}</span><h4>{lesson.title}</h4><p>{lesson.description}</p><small>{lesson.practice}</small></article>
          ))}
        </div>

        <section className="skills-lab-fit" aria-labelledby="skill-fit-title">
          <div className="skills-lab-heading compact">
            <div><p className="eyebrow">Fit check</p><h4 id="skill-fit-title">Is this a good Skill?</h4></div>
            <span>{fitCorrect} of {SKILL_FIT_SCENARIOS.length} correct</span>
          </div>
          <div className="skills-lab-fit-grid">
            {SKILL_FIT_SCENARIOS.map((scenario) => {
              const answer = fitAnswers[scenario.id];
              return (
                <article key={scenario.id}>
                  <h5>{scenario.title}</h5>
                  <p>{scenario.description}</p>
                  <div role="group" aria-label={`Classify ${scenario.title}`}>
                    {FIT_LABELS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={answer === option.id}
                        className={answer === option.id ? "is-selected" : ""}
                        onClick={() => setFitAnswers((current) => ({ ...current, [scenario.id]: option.id }))}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {answer ? (
                    <small className={answer === scenario.answer ? "is-correct" : "is-review"}>
                      {answer === scenario.answer ? "Correct. " : "Try again. "}{scenario.explanation}
                    </small>
                  ) : null}
                </article>
              );
            })}
          </div>
          <p className="skills-lab-inline-status">Answered {fitAnswered} of {SKILL_FIT_SCENARIOS.length}. Correctly classify every scenario to complete Beginner.</p>
        </section>

        <div className="skills-lab-builder-grid">
          <form className="skills-lab-form" onSubmit={(event) => event.preventDefault()}>
            <div className="skills-lab-form-title">
              <div><p className="eyebrow">Guided build</p><h4>Skill Brief builder</h4></div>
              <label>Role example
                <select
                  value={selectedRole}
                  onChange={(event) => {
                    const project = SKILL_ROLE_PROJECTS.find((item) => item.role === event.target.value);
                    if (project) applyRoleProject(project);
                  }}
                >
                  {SKILL_ROLE_PROJECTS.map((project) => <option key={project.role}>{project.role}</option>)}
                </select>
              </label>
            </div>
            <label>Skill name
              <input value={skillName} onChange={(event) => setSkillName(event.target.value)} />
              <small>Use lowercase letters, numbers, and hyphens. Current folder: {safeSkillName}/</small>
            </label>
            <label>Description and trigger
              <textarea rows={4} value={description} onChange={(event) => setDescription(event.target.value)} />
              <small>Describe what the Skill does and include when it should be used.</small>
            </label>
            <label>Required inputs
              <textarea rows={3} value={requiredInputs} onChange={(event) => setRequiredInputs(event.target.value)} />
            </label>
            <label>Ordered workflow
              <textarea rows={8} value={workflow} onChange={(event) => setWorkflow(event.target.value)} />
            </label>
            <label>Required output
              <textarea rows={3} value={outputFormat} onChange={(event) => setOutputFormat(event.target.value)} />
            </label>
            <label>Final quality checks
              <textarea rows={4} value={qualityChecks} onChange={(event) => setQualityChecks(event.target.value)} />
            </label>
            <label>Boundaries and escalation
              <textarea rows={4} value={boundaries} onChange={(event) => setBoundaries(event.target.value)} />
            </label>
            <label className="skills-lab-confirm">
              <input type="checkbox" checked={safePracticeConfirmed} onChange={(event) => setSafePracticeConfirmed(event.target.checked)} />
              <span>I will practice with public or synthetic information and treat the output as a draft for human review.</span>
            </label>
          </form>

          <div className="skills-lab-output">
            <div className="skills-lab-output-head">
              <div><span>Generated package entry</span><strong>SKILL.md</strong></div>
              <div>
                <button className="button button-small button-quiet" type="button" onClick={() => copyText(skillMarkdown, "SKILL.md")}>Copy SKILL.md</button>
                <button className="button button-small button-primary" type="button" onClick={downloadSkill}>Download SKILL.md</button>
              </div>
            </div>
            <pre>{skillMarkdown}</pre>
            <div className="skills-lab-create-paths">
              <h5>Three ways to create it in ChatGPT</h5>
              <ol>
                <li><strong>Create with chat:</strong> Open Profile, Skills, Create, then Create with chat. Describe the job and review the generated draft.</li>
                <li><strong>Create with editor:</strong> Open Skills, Create, then Create with editor to manage the files directly.</li>
                <li><strong>Upload a package:</strong> Review a trusted Skill package, then choose Create and Upload from your computer.</li>
              </ol>
              <button className="button button-small button-dark" type="button" onClick={() => copyText(buildPrompt, "Build-me-a-Skill prompt")}>Copy build prompt</button>
            </div>
          </div>
        </div>

        <div className="skills-lab-completion">
          <div><strong>{beginnerReady ? "Beginner is ready" : "Finish the Beginner gates"}</strong><p>Reach 80 percent builder quality, correctly classify all fit scenarios, and confirm safe practice.</p></div>
          <button className="button button-primary" type="button" disabled={!beginnerReady || completedSet.has("chatgpt-skills-beginner")} onClick={() => finishLevel("beginner", beginnerReady)}>
            {completedSet.has("chatgpt-skills-beginner") ? "Beginner complete" : "Complete Beginner"}
          </button>
        </div>
      </section>

      <section className="skills-lab-panel" hidden={level !== "intermediate"} aria-labelledby="skills-intermediate-title">
        <div className="skills-lab-heading">
          <div><p className="eyebrow">Intermediate</p><h3 id="skills-intermediate-title">Build a package and prove the behavior</h3></div>
          <span className="skills-lab-score">Tests run <strong>{runTests.length}/{SKILL_TEST_CASES.length}</strong></span>
        </div>
        <div className="skills-lab-lesson-grid">
          {SKILL_LEVELS[1].lessons.map((lesson, index) => (
            <article key={lesson.title}><span>0{index + 1}</span><h4>{lesson.title}</h4><p>{lesson.description}</p><small>{lesson.practice}</small></article>
          ))}
        </div>

        <div className="skills-lab-package-grid">
          <fieldset className="skills-lab-resource-picker">
            <legend>Choose only useful support material</legend>
            <p>The core SKILL.md should stay concise. Put detailed content in resources that are loaded or run only when needed.</p>
            {RESOURCE_OPTIONS.map((resource) => (
              <label key={resource.id}>
                <input type="checkbox" checked={resources.includes(resource.id)} onChange={() => toggleItem(resources, resource.id, setResources)} />
                <span><strong>{resource.title}</strong><small>{resource.description}</small></span>
              </label>
            ))}
          </fieldset>
          <div className="skills-lab-package-tree" aria-label="Generated Skill package structure">
            <span>{safeSkillName}/</span>
            <strong>SKILL.md</strong>
            {resources.includes("references") ? <span>references/approved-guidance.md</span> : null}
            {resources.includes("scripts") ? <span>scripts/validate-output</span> : null}
            {resources.includes("assets") ? <span>assets/approved-template</span> : null}
            {resources.includes("examples") ? <span>references/test-cases.md</span> : null}
            <small>No credentials, secrets, real restricted data, or unnecessary files belong in the package.</small>
          </div>
        </div>

        <section className="skills-lab-test-bench" aria-labelledby="skills-test-title">
          <div className="skills-lab-heading compact">
            <div><p className="eyebrow">Evaluation</p><h4 id="skills-test-title">Simulated test bench</h4></div>
            <span>Safe, rule-based simulation</span>
          </div>
          <div className="skills-lab-test-tabs" role="group" aria-label="Skill test cases">
            {SKILL_TEST_CASES.map((testCase) => (
              <button
                key={testCase.id}
                type="button"
                aria-pressed={activeTest === testCase.id}
                className={activeTest === testCase.id ? "is-active" : ""}
                onClick={() => setActiveTest(testCase.id)}
              >
                <span>{testCase.label}</span>
                <small>{runTests.includes(testCase.id) ? "Run complete" : testCase.category}</small>
              </button>
            ))}
          </div>
          <article className="skills-lab-test-result">
            <div><span>Test request</span><p>{activeTestCase.request}</p></div>
            <div><span>Expected behavior</span><p>{activeTestCase.expected}</p></div>
            <div><span>Pass signal</span><p>{activeTestCase.passSignal}</p></div>
            <button
              className="button button-dark"
              type="button"
              onClick={() => {
                if (!runTests.includes(activeTestCase.id)) setRunTests((current) => [...current, activeTestCase.id]);
                onNotice(`${activeTestCase.label} simulation recorded.`);
              }}
            >
              {runTests.includes(activeTestCase.id) ? "Test recorded" : "Run this simulation"}
            </button>
          </article>
          <label className="skills-lab-confirm">
            <input type="checkbox" checked={testReviewConfirmed} onChange={(event) => setTestReviewConfirmed(event.target.checked)} />
            <span>I compared expected behavior, documented needed revisions, and used only synthetic examples.</span>
          </label>
        </section>

        <div className="skills-lab-completion">
          <div><strong>{intermediateReady ? "Intermediate is ready" : "Finish the Intermediate gates"}</strong><p>Select the useful package resources, run all four test cases, and confirm the review.</p></div>
          <button className="button button-primary" type="button" disabled={!intermediateReady || completedSet.has("chatgpt-skills-intermediate")} onClick={() => finishLevel("intermediate", intermediateReady)}>
            {completedSet.has("chatgpt-skills-intermediate") ? "Intermediate complete" : "Complete Intermediate"}
          </button>
        </div>
      </section>

      <section className="skills-lab-panel" hidden={level !== "advanced"} aria-labelledby="skills-advanced-title">
        <div className="skills-lab-heading">
          <div><p className="eyebrow">Advanced</p><h3 id="skills-advanced-title">Govern the Skill through its full lifecycle</h3></div>
          <span className="skills-lab-score">Release readiness <strong>{readinessScore}%</strong></span>
        </div>
        <div className="skills-lab-lesson-grid">
          {SKILL_LEVELS[2].lessons.map((lesson, index) => (
            <article key={lesson.title}><span>0{index + 1}</span><h4>{lesson.title}</h4><p>{lesson.description}</p><small>{lesson.practice}</small></article>
          ))}
        </div>

        <div className="skills-lab-governance-grid">
          <form className="skills-lab-form" onSubmit={(event) => event.preventDefault()}>
            <div className="skills-lab-form-title"><div><p className="eyebrow">Capstone</p><h4>Governance and release readiness</h4></div></div>
            <label>Business owner<input value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="Role or accountable owner" /></label>
            <label>Qualified reviewer<input value={reviewer} onChange={(event) => setReviewer(event.target.value)} placeholder="Domain, security, legal, or other reviewer" /></label>
            <label>Version<input value={version} onChange={(event) => setVersion(event.target.value)} /></label>
            <label>Review cycle<textarea rows={3} value={reviewCycle} onChange={(event) => setReviewCycle(event.target.value)} /></label>
            <label>Sharing scope<select value={sharingScope} onChange={(event) => setSharingScope(event.target.value)}><option>Personal or invite-only until review is complete</option><option>Specific approved group</option><option>Workspace library after formal approval</option></select></label>
          </form>

          <fieldset className="skills-lab-governance-checks">
            <legend>Production-readiness controls</legend>
            {SKILL_GOVERNANCE_CHECKS.map((check) => (
              <label key={check.id}>
                <input type="checkbox" checked={governanceChecks.includes(check.id)} onChange={() => toggleItem(governanceChecks, check.id, setGovernanceChecks)} />
                <span><strong>{check.title}</strong><small>{check.description}</small></span>
              </label>
            ))}
          </fieldset>
        </div>

        <section className="skills-lab-red-team" aria-labelledby="skills-red-team-title">
          <div className="skills-lab-heading compact">
            <div><p className="eyebrow">Challenge mode</p><h4 id="skills-red-team-title">Red-team the release</h4></div>
            <span>{redTeamCorrect} of {SKILL_RED_TEAM_CASES.length} passed</span>
          </div>
          <div className="skills-lab-red-team-grid">
            {SKILL_RED_TEAM_CASES.map((scenario) => {
              const answer = redTeamAnswers[scenario.id];
              return (
                <fieldset key={scenario.id}>
                  <legend>{scenario.title}</legend>
                  <p>{scenario.prompt}</p>
                  {scenario.options.map((option) => (
                    <label key={option.id}>
                      <input type="radio" name={scenario.id} value={option.id} checked={answer === option.id} onChange={() => setRedTeamAnswers((current) => ({ ...current, [scenario.id]: option.id }))} />
                      <span>{option.label}</span>
                    </label>
                  ))}
                  {answer ? <small className={answer === scenario.correctOptionId ? "is-correct" : "is-review"}>{answer === scenario.correctOptionId ? "Pass. " : "Review. "}{scenario.explanation}</small> : null}
                </fieldset>
              );
            })}
          </div>
          <label className="skills-lab-confirm">
            <input type="checkbox" checked={releaseConfirmed} onChange={(event) => setReleaseConfirmed(event.target.checked)} />
            <span>I will not publish or share until the named owners approve the Skill, its resources, permissions, and test evidence.</span>
          </label>
        </section>

        <div className="skills-lab-completion">
          <div><strong>{advancedReady ? "Advanced capstone is ready" : "Finish the Advanced gates"}</strong><p>Reach 90 percent readiness, select every control, pass every red-team case, and confirm the release rule.</p></div>
          <button className="button button-primary" type="button" disabled={!advancedReady || completedSet.has("chatgpt-skills-advanced")} onClick={() => finishLevel("advanced", advancedReady)}>
            {completedSet.has("chatgpt-skills-advanced") ? "Advanced complete" : "Complete Advanced capstone"}
          </button>
        </div>
      </section>

      <footer className="skills-lab-footer-note">
        <strong>Safe practice rule</strong>
        <p>
          Never enter classified information. Use only the tools, data types,
          sources, and actions your organization has approved for the exact use
          case. Require qualified human review for legal, contractual,
          financial, security, personnel, and customer commitments.
        </p>
      </footer>
    </section>
  );
}
