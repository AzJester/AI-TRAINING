"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  ALL_CAPSTONES,
  ALL_COURSE_MODULES,
  CLEAR_STEPS,
  COURSE,
  RESOURCES,
  TRAINING_LEVELS,
  type ActionPlanPractice,
  type CapstoneScenario,
  type ClaimVerdict,
  type ContextBuilderPractice,
  type CourseModule,
  type PracticeExercise,
  type ResourceItem,
  type RewriteLabPractice,
  type RiskCategoryId,
  type RiskSortPractice,
  type TrainingLevel,
  type TrainingLevelId,
  type VerificationCheckPractice,
} from "./training-data";

type View = "home" | "practice" | "progress" | "resources";
type ModuleTarget = string;

interface LearnerProfile {
  role: string;
  confidence: number;
  tasks: string[];
}

interface TrainingProgress {
  version: 2;
  profile: LearnerProfile | null;
  selectedLevel: TrainingLevelId;
  completedModules: string[];
  completedCapstones: string[];
  quizScores: Record<string, number>;
  currentTarget: ModuleTarget | null;
  currentStage: number;
  lastVisitedAt: string | null;
}

const STORAGE_KEY = "ai-practice-lab-progress-v2";
const LEGACY_STORAGE_KEY = "ai-practice-lab-progress-v1";

const DEFAULT_PROGRESS: TrainingProgress = {
  version: 2,
  profile: null,
  selectedLevel: "beginner",
  completedModules: [],
  completedCapstones: [],
  quizScores: {},
  currentTarget: null,
  currentStage: 0,
  lastVisitedAt: null,
};

const GENERAL_ROLE = "Defense-contractor mission and business teams";

const ROLE_OPTIONS = [
  "Systems Engineering & Integration",
  "Software, Data, AI & Information Technology",
  "Cybersecurity & Information Assurance",
  "Test, Evaluation, Training, Quality & Safety",
  "Program & Project Management",
  "Acquisition, Contracts & Subcontracts",
  "Business Development, Capture & Proposals",
  "Solutions Architecture & Technical Strategy",
  "Mission Support, Logistics & Sustainment",
  "Space, UxS & Mission Technology",
  "Analysis, Configuration & Technical Services",
  "Legal, Ethics, Compliance & Corporate Security",
  "Finance, Accounting, Pricing & Procurement",
  "Human Resources, Talent & Workforce Development",
  "Communications, Marketing & Business Operations",
  GENERAL_ROLE,
];

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

const NAV_ITEMS: Array<{ id: View; label: string; icon: string }> = [
  { id: "home", label: "Course", icon: "01" },
  { id: "practice", label: "Practice", icon: "02" },
  { id: "progress", label: "Progress", icon: "03" },
  { id: "resources", label: "Resources", icon: "04" },
];

function readProgress(): TrainingProgress {
  if (typeof window === "undefined") return DEFAULT_PROGRESS;
  try {
    const stored =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!stored) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(stored) as Record<string, unknown>;
    const profile = parsed.profile as LearnerProfile | null | undefined;
    const normalizedProfile = profile
      ? {
          ...profile,
          role: ROLE_OPTIONS.includes(profile.role)
            ? profile.role
            : ROLE_OPTIONS[0],
        }
      : null;

    if (parsed.version === 1) {
      const legacyIds: Record<string, string> = {
        clarify: "beginner-clarify",
        limit: "beginner-limit",
        engineer: "beginner-engineer",
        assess: "beginner-assess",
        refine: "beginner-refine",
      };
      const completedModules = Array.isArray(parsed.completedModules)
        ? parsed.completedModules
            .map((id) => legacyIds[String(id)])
            .filter((id): id is string => Boolean(id))
        : [];
      const legacyScores = (parsed.quizScores ?? {}) as Record<string, number>;
      const quizScores = Object.fromEntries(
        Object.entries(legacyScores)
          .map(([id, score]) => [legacyIds[id], score] as const)
          .filter(([id]) => Boolean(id)),
      );

      return {
        ...DEFAULT_PROGRESS,
        profile: normalizedProfile,
        completedModules,
        completedCapstones:
          parsed.capstoneComplete === true ? ["beginner-capstone"] : [],
        quizScores,
      currentTarget:
        typeof parsed.currentTarget === "string"
            ? parsed.currentTarget === "capstone"
              ? "beginner-capstone"
              : legacyIds[parsed.currentTarget] ?? null
            : null,
        currentStage: 0,
      };
    }

    if (parsed.version !== 2) return DEFAULT_PROGRESS;
    const selectedLevel = TRAINING_LEVELS.some(
      (level) => level.id === parsed.selectedLevel,
    )
      ? (parsed.selectedLevel as TrainingLevelId)
      : "beginner";

    const currentTarget =
      typeof parsed.currentTarget === "string" &&
      (ALL_COURSE_MODULES.some(
        (module) => module.id === parsed.currentTarget,
      ) ||
        ALL_CAPSTONES.some(
          (capstone) => capstone.id === parsed.currentTarget,
        ))
        ? parsed.currentTarget
        : null;
    const targetLevel =
      ALL_COURSE_MODULES.find((module) => module.id === currentTarget)?.levelId ??
      ALL_CAPSTONES.find((capstone) => capstone.id === currentTarget)?.levelId;

    return {
      ...DEFAULT_PROGRESS,
      selectedLevel: targetLevel ?? selectedLevel,
      profile: normalizedProfile,
      completedModules: Array.isArray(parsed.completedModules)
        ? parsed.completedModules
            .map(String)
            .filter((id) =>
              ALL_COURSE_MODULES.some((module) => module.id === id),
            )
        : [],
      completedCapstones: Array.isArray(parsed.completedCapstones)
        ? parsed.completedCapstones
            .map(String)
            .filter((id) =>
              ALL_CAPSTONES.some((capstone) => capstone.id === id),
            )
        : [],
      quizScores:
        parsed.quizScores && typeof parsed.quizScores === "object"
          ? (parsed.quizScores as Record<string, number>)
          : {},
      currentTarget,
      currentStage:
        typeof parsed.currentStage === "number" &&
        Number.isFinite(parsed.currentStage)
          ? Math.max(0, Math.min(3, Math.floor(parsed.currentStage)))
          : 0,
      lastVisitedAt:
        typeof parsed.lastVisitedAt === "string" ? parsed.lastVisitedAt : null,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function percentage(value: number, total: number) {
  return Math.round((value / total) * 100);
}

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}

function isLevelComplete(progress: TrainingProgress, level: TrainingLevel) {
  return (
    level.modules.every((module) =>
      progress.completedModules.includes(module.id),
    ) && progress.completedCapstones.includes(level.capstone.id)
  );
}

export function TrainingApp() {
  const [view, setView] = useState<View>("home");
  const [progress, setProgress] = useState<TrainingProgress>(DEFAULT_PROGRESS);
  const [hydrated, setHydrated] = useState(false);
  const [activeTarget, setActiveTarget] = useState<ModuleTarget | null>(null);
  const [lessonStage, setLessonStage] = useState(0);
  const [notice, setNotice] = useState("");
  const [showReset, setShowReset] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const savedProgress = readProgress();
      setProgress(savedProgress);
      setActiveTarget(savedProgress.currentTarget);
      setLessonStage(savedProgress.currentStage);
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...progress, lastVisitedAt: new Date().toISOString() }),
    );
  }, [hydrated, progress]);

  useEffect(() => {
    if (!activeTarget) return;
    const heading = document.getElementById("lesson-heading");
    heading?.focus();
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
  }, [activeTarget, lessonStage]);

  const activeLevel =
    TRAINING_LEVELS.find((level) => level.id === progress.selectedLevel) ??
    TRAINING_LEVELS[0];
  const completedCount =
    activeLevel.modules.filter((module) =>
      progress.completedModules.includes(module.id),
    ).length +
    (progress.completedCapstones.includes(activeLevel.capstone.id) ? 1 : 0);
  const totalCount = activeLevel.modules.length + 1;
  const progressPercent = percentage(completedCount, totalCount);
  const nextModule = activeLevel.modules.find(
    (module) => !progress.completedModules.includes(module.id),
  );
  const nextTarget: ModuleTarget = nextModule?.id ?? activeLevel.capstone.id;

  function changeView(nextView: View) {
    setProgress((current) => ({
      ...current,
      currentTarget: null,
      currentStage: 0,
    }));
    setActiveTarget(null);
    setLessonStage(0);
    setView(nextView);
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
  }

  function openTarget(target: ModuleTarget, stage = 0) {
    const targetLevel =
      ALL_COURSE_MODULES.find((module) => module.id === target)?.levelId ??
      ALL_CAPSTONES.find((capstone) => capstone.id === target)?.levelId;
    setProgress((current) => ({
      ...current,
      currentTarget: target,
      currentStage: stage,
      selectedLevel: targetLevel ?? current.selectedLevel,
    }));
    setLessonStage(stage);
    setActiveTarget(target);
  }

  function changeLessonStage(stage: number) {
    setProgress((current) => ({
      ...current,
      currentTarget: activeTarget ?? current.currentTarget,
      currentStage: stage,
    }));
    setLessonStage(stage);
  }

  function closeTarget(nextView: View = "home") {
    setProgress((current) => ({
      ...current,
      currentTarget: null,
      currentStage: 0,
    }));
    setActiveTarget(null);
    setLessonStage(0);
    setView(nextView);
  }

  function selectLevel(levelId: TrainingLevelId) {
    setProgress((current) => ({
      ...current,
      selectedLevel: levelId,
      currentTarget: null,
      currentStage: 0,
    }));
    setActiveTarget(null);
    setLessonStage(0);
    const levelName = TRAINING_LEVELS.find((level) => level.id === levelId)?.name;
    setNotice(`${levelName} level selected.`);
  }

  function completeModule(module: CourseModule, score: number) {
    setProgress((current) => ({
      ...current,
      completedModules: current.completedModules.includes(module.id)
        ? current.completedModules
        : [...current.completedModules, module.id],
      quizScores: {
        ...current.quizScores,
        [module.id]: Math.max(current.quizScores[module.id] ?? 0, score),
      },
      currentTarget: module.id,
      currentStage: 3,
    }));
    setLessonStage(3);
    setNotice(`${module.skillName} is now ready.`);
  }

  function completeCapstone(capstone: CapstoneScenario) {
    setProgress((current) => ({
      ...current,
      completedCapstones: current.completedCapstones.includes(capstone.id)
        ? current.completedCapstones
        : [...current.completedCapstones, capstone.id],
      currentTarget: capstone.id,
      currentStage: 2,
    }));
    setLessonStage(2);
    setNotice(`${activeLevel.name} capstone complete. Your course summary is ready.`);
  }

  function saveProfile(profile: LearnerProfile, levelId: TrainingLevelId) {
    setProgress((current) => ({
      ...current,
      profile,
      selectedLevel: levelId,
    }));
    setNotice("Your learning path is ready.");
  }

  function resetProgress() {
    window.localStorage.removeItem(STORAGE_KEY);
    setProgress({
      ...DEFAULT_PROGRESS,
      profile: progress.profile,
      selectedLevel: progress.selectedLevel,
    });
    setActiveTarget(null);
    setView("home");
    setShowReset(false);
    setNotice("Course progress has been reset.");
  }

  function exportProgress() {
    const payload = JSON.stringify(
      {
        course: COURSE.title,
        selectedLevel: progress.selectedLevel,
        exportedAt: new Date().toISOString(),
        completedModules: progress.completedModules,
        completedCapstones: progress.completedCapstones,
        quizScores: progress.quizScores,
      },
      null,
      2,
    );
    const url = URL.createObjectURL(
      new Blob([payload], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "ai-practice-lab-progress.json";
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Progress export prepared.");
  }

  const activeModule = useMemo(
    () =>
      activeTarget
        ? ALL_COURSE_MODULES.find((module) => module.id === activeTarget)
        : undefined,
    [activeTarget],
  );
  const activeCapstone = useMemo(
    () =>
      activeTarget
        ? ALL_CAPSTONES.find((capstone) => capstone.id === activeTarget)
        : undefined,
    [activeTarget],
  );

  return (
    <>
      <div
        className="app-shell"
        inert={hydrated && !progress.profile ? true : undefined}
      >
      <a className="skip-link" href="#main-content">
        Skip to course content
      </a>

      <aside className="sidebar" aria-label="Primary navigation">
        <button
          className="brand"
          type="button"
          onClick={() => changeView("home")}
          aria-label="AI Practice Lab home"
        >
          <span className="brand-mark" aria-hidden="true">
            AI
          </span>
          <span>
            <strong>Practice Lab</strong>
            <small>Learn it. Try it. Check it.</small>
          </span>
        </button>

        <nav className="side-nav">
          {NAV_ITEMS.map((item) => (
            <button
              className={view === item.id && !activeTarget ? "is-active" : ""}
              type="button"
              key={item.id}
              onClick={() => changeView(item.id)}
              aria-current={
                view === item.id && !activeTarget ? "page" : undefined
              }
            >
              <span className="nav-index" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-progress">
          <div className="sidebar-progress-label">
            <span>{activeLevel.name} progress</span>
            <strong>{progressPercent}%</strong>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="Course progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
          >
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <small>
            {completedCount} of {totalCount} learning milestones ready
          </small>
        </div>
      </aside>

      <div className="app-column">
        <header className="mobile-header">
          <button
            className="brand"
            type="button"
            onClick={() => changeView("home")}
            aria-label="AI Practice Lab home"
          >
            <span className="brand-mark" aria-hidden="true">
              AI
            </span>
            <strong>Practice Lab</strong>
          </button>
          <span className="mobile-progress">{progressPercent}% complete</span>
        </header>

        <main id="main-content" tabIndex={-1}>
          {activeModule ? (
            <LessonPlayer
              module={activeModule}
              stage={lessonStage}
              isComplete={progress.completedModules.includes(activeModule.id)}
              onStageChange={changeLessonStage}
              onComplete={completeModule}
              onExit={() => closeTarget("home")}
              onOpenNext={() => {
                const lessonLevel =
                  TRAINING_LEVELS.find(
                    (level) => level.id === activeModule.levelId,
                  ) ?? activeLevel;
                const index = lessonLevel.modules.findIndex(
                  (module) => module.id === activeModule.id,
                );
                const following = lessonLevel.modules[index + 1];
                openTarget(following?.id ?? lessonLevel.capstone.id);
              }}
            />
          ) : activeCapstone ? (
            <CapstonePlayer
              capstone={activeCapstone}
              stage={lessonStage}
              complete={progress.completedCapstones.includes(activeCapstone.id)}
              lessonsComplete={activeLevel.modules.every((module) =>
                progress.completedModules.includes(module.id),
              )}
              onStageChange={changeLessonStage}
              onComplete={() => completeCapstone(activeCapstone)}
              onExit={() => closeTarget("home")}
            />
          ) : view === "home" ? (
            <Dashboard
              progress={progress}
              level={activeLevel}
              progressPercent={progressPercent}
              nextTarget={nextTarget}
              onOpen={openTarget}
              onSelectLevel={selectLevel}
              onViewProgress={() => changeView("progress")}
            />
          ) : view === "practice" ? (
            <PracticeLibrary
              level={activeLevel}
              progress={progress}
              onOpen={openTarget}
              onSelectLevel={selectLevel}
            />
          ) : view === "progress" ? (
            <ProgressPage
              level={activeLevel}
              progress={progress}
              progressPercent={progressPercent}
              onOpen={openTarget}
              onSelectLevel={selectLevel}
              onExport={exportProgress}
              onReset={() => setShowReset(true)}
              showReset={showReset}
              onCancelReset={() => setShowReset(false)}
              onConfirmReset={resetProgress}
              onRoleChange={(role) =>
                setProgress((current) => ({
                  ...current,
                  profile: {
                    role,
                    confidence: current.profile?.confidence ?? 3,
                    tasks: current.profile?.tasks ?? [],
                  },
                }))
              }
            />
          ) : (
            <ResourcesPage onNotice={setNotice} />
          )}
        </main>

        <footer className="app-footer">
          <strong>Created by Dr Shane Turner</strong>
          <span>© 2026 Dr Shane Turner. All rights reserved.</span>
        </footer>

        <nav className="bottom-nav" aria-label="Mobile navigation">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={view === item.id && !activeTarget ? "is-active" : ""}
              onClick={() => changeView(item.id)}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {notice}
        </div>
      </div>

      {hydrated && !progress.profile ? (
        <Onboarding onSave={saveProfile} />
      ) : null}
    </>
  );
}

function Dashboard({
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
            style={{ "--progress": `${progressPercent * 3.6}deg` } as React.CSSProperties}
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

function LevelSelector({
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

function LessonPlayer({
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

function PracticeRenderer({
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

function FeedbackPanel({
  success,
  children,
}: {
  success: boolean;
  children: React.ReactNode;
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

function QuizPanel({
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

function CompletionPanel({
  module,
  alreadyComplete,
  onExit,
  onOpenNext,
}: {
  module: CourseModule;
  alreadyComplete: boolean;
  onExit: () => void;
  onOpenNext: () => void;
}) {
  const moduleLevel = TRAINING_LEVELS.find(
    (level) => level.id === module.levelId,
  );
  const isLastModule =
    moduleLevel?.modules[moduleLevel.modules.length - 1]?.id === module.id;
  return (
    <section className="completion-panel">
      <div className="completion-mark" aria-hidden="true">
        ✓
      </div>
      <p className="eyebrow">SKILL READY</p>
      <h2>{module.skillName}</h2>
      <p>{module.takeaway}</p>
      <div className="takeaway-card">
        <span>KEEP THIS</span>
        <blockquote>“{module.takeaway}”</blockquote>
      </div>
      <div className="completion-actions">
        <button className="button button-primary" type="button" onClick={onOpenNext}>
          {isLastModule ? "Open capstone" : "Next lesson"}
          <span aria-hidden="true">→</span>
        </button>
        <button className="button button-quiet" type="button" onClick={onExit}>
          {alreadyComplete ? "Back to course" : "See course path"}
        </button>
      </div>
    </section>
  );
}

function CapstonePlayer({
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

function PracticeLibrary({
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

function ProgressPage({
  level,
  progress,
  progressPercent,
  onOpen,
  onSelectLevel,
  onExport,
  onReset,
  showReset,
  onCancelReset,
  onConfirmReset,
  onRoleChange,
}: {
  level: TrainingLevel;
  progress: TrainingProgress;
  progressPercent: number;
  onOpen: (target: ModuleTarget, stage?: number) => void;
  onSelectLevel: (levelId: TrainingLevelId) => void;
  onExport: () => void;
  onReset: () => void;
  showReset: boolean;
  onCancelReset: () => void;
  onConfirmReset: () => void;
  onRoleChange: (role: string) => void;
}) {
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
        </div>
      </header>

      <LevelSelector
        activeLevel={level}
        progress={progress}
        onSelect={onSelectLevel}
      />

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
            · Saved only in this browser
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
            Reset course progress
          </button>
        ) : (
          <div className="reset-confirm" role="group" aria-label="Confirm reset">
            <span>Reset all lesson and quiz progress?</span>
            <button className="button button-danger button-small" type="button" onClick={onConfirmReset}>
              Yes, reset
            </button>
            <button className="button button-quiet button-small" type="button" onClick={onCancelReset}>
              Cancel
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function ResourcesPage({ onNotice }: { onNotice: (notice: string) => void }) {
  return (
    <div className="page standard-page resources-page">
      <header className="page-header">
        <p className="eyebrow">FIELD GUIDE</p>
        <h1>Keep the method close.</h1>
        <p>
          Copy a template, run a safety check, or refresh a CLEAR move whenever
          real work gets messy.
        </p>
      </header>

      <section className="clear-framework" aria-labelledby="framework-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE FIVE MOVES</p>
            <h2 id="framework-title">The CLEAR framework</h2>
          </div>
        </div>
        <div className="clear-framework-grid">
          {CLEAR_STEPS.map((step) => (
            <article key={step.key}>
              <span>{step.letter}</span>
              <h3>{step.name}</h3>
              <strong>{step.action}</strong>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="resource-list" aria-labelledby="resource-list-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">REUSABLE TOOLS</p>
            <h2 id="resource-list-title">Ready when the work is</h2>
          </div>
        </div>
        {RESOURCES.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} onNotice={onNotice} />
        ))}
      </section>
    </div>
  );
}

function ResourceCard({
  resource,
  onNotice,
}: {
  resource: ResourceItem;
  onNotice: (notice: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <article className="resource-card">
      <div className="resource-card-head">
        <span className="resource-kind">{resource.kind}</span>
        <div>
          <h3>{resource.title}</h3>
          <p>{resource.description}</p>
          <small>Use when: {resource.useWhen}</small>
        </div>
        <button
          className="button button-small button-quiet"
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? "Close" : "Open"}
        </button>
      </div>
      {open ? (
        <div className="resource-body">
          <div className="resource-sections">
            {resource.sections.map((section) => (
              <section key={section.heading}>
                <h4>{section.heading}</h4>
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <div className="copy-box">
            <pre>{resource.copyText}</pre>
            <button
              className="button button-dark button-small"
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(resource.copyText);
                onNotice(`${resource.title} copied to the clipboard.`);
              }}
            >
              Copy to clipboard
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function Onboarding({
  onSave,
}: {
  onSave: (profile: LearnerProfile, levelId: TrainingLevelId) => void;
}) {
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
              onClick={() => onSave({ role, confidence, tasks }, levelId)}
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
