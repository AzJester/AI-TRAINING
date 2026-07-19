"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ALL_CAPSTONES,
  ALL_COURSE_MODULES,
  COURSE,
  TRAINING_LEVELS,
  type CapstoneScenario,
  type CourseModule,
  type TrainingLevel,
  type TrainingLevelId,
} from "./training-data";
import { CreatorStudio } from "./CreatorStudio";
import { trackPrivacyEvent } from "./privacy-analytics";
import { CapstonePlayer } from "./training/capstone-player";
import { Dashboard } from "./training/dashboard";
import { LessonPlayer } from "./training/lesson-player";
import { Onboarding } from "./training/onboarding";
import { PracticeLibrary } from "./training/practice-library";
import { ProgressPage } from "./training/progress-page";
import { ResourcesPage } from "./training/resources-page";
import {
  DEFAULT_PROGRESS,
  GENERAL_ROLE,
  STORAGE_KEY,
  readProgress,
  type LearnerProfile,
  type ModuleTarget,
  type TrainingProgress,
} from "./training-progress";

type View = "home" | "studio" | "practice" | "progress" | "resources";
const APP_VERSION = "2.1.0";
const APP_UPDATED = "July 18, 2026";

const NAV_ITEMS: Array<{ id: View; label: string; icon: string }> = [
  { id: "home", label: "Course", icon: "01" },
  { id: "studio", label: "Studio", icon: "02" },
  { id: "practice", label: "Practice", icon: "03" },
  { id: "progress", label: "Progress", icon: "04" },
  { id: "resources", label: "Resources", icon: "05" },
];

function percentage(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
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
      const savedProgress = readProgress(window.localStorage);
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
    if (
      activeTarget &&
      lessonStage < 3 &&
      ALL_COURSE_MODULES.some((module) => module.id === activeTarget)
    ) {
      trackPrivacyEvent("lesson_abandoned", activeTarget);
    }
    setProgress((current) => ({
      ...current,
      currentTarget: null,
      currentStage: 0,
    }));
    setActiveTarget(null);
    setLessonStage(0);
    setView(nextView);
    if (nextView === "studio") trackPrivacyEvent("studio_opened");
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
    if (ALL_COURSE_MODULES.some((module) => module.id === target)) {
      trackPrivacyEvent("lesson_started", target);
    }
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
    if (
      activeTarget &&
      lessonStage < 3 &&
      ALL_COURSE_MODULES.some((module) => module.id === activeTarget)
    ) {
      trackPrivacyEvent("lesson_abandoned", activeTarget);
    }
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
    trackPrivacyEvent("onboarding_completed", levelId);
  }

  function completeStudioActivity(activityId: string) {
    setProgress((current) => ({
      ...current,
      studioCompleted: current.studioCompleted.includes(activityId)
        ? current.studioCompleted
        : [...current.studioCompleted, activityId],
    }));
    setNotice("Creator Studio activity marked complete.");
    trackPrivacyEvent("studio_activity_completed", activityId);
  }

  function toggleBookmark(templateId: string) {
    setProgress((current) => ({
      ...current,
      bookmarks: current.bookmarks.includes(templateId)
        ? current.bookmarks.filter((id) => id !== templateId)
        : [...current.bookmarks, templateId],
    }));
    setNotice(
      progress.bookmarks.includes(templateId)
        ? "Bookmark removed."
        : "Template bookmarked on this device.",
    );
  }

  function resetProgress() {
    window.localStorage.removeItem(STORAGE_KEY);
    setProgress((current) => ({
      ...DEFAULT_PROGRESS,
      profile: current.profile,
      selectedLevel: current.selectedLevel,
      resetEpoch: current.resetEpoch + 1,
    }));
    setActiveTarget(null);
    setLessonStage(0);
    setView("home");
    setShowReset(false);
    setNotice("All saved progress and bookmarks are reset to 0.");
  }

  function exportProgress() {
    const payload = JSON.stringify(
      {
        course: COURSE.title,
        learner: progress.profile,
        selectedLevel: progress.selectedLevel,
        exportedAt: new Date().toISOString(),
        completedModules: progress.completedModules,
        completedCapstones: progress.completedCapstones,
        quizScores: progress.quizScores,
        creatorStudioActivities: progress.studioCompleted,
        bookmarkedTemplates: progress.bookmarks,
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

  function downloadCertificate(level: TrainingLevel) {
    if (!isLevelComplete(progress, level)) {
      setNotice("Complete this level before downloading its certificate.");
      return;
    }

    const learnerName = escapeHtml(progress.profile?.name || "Learner");
    const role = escapeHtml(progress.profile?.role || GENERAL_ROLE);
    const levelName = escapeHtml(level.name);
    const levelTitle = escapeHtml(level.title);
    const completedOn = new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date());
    const certificate = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI Practice Lab Certificate</title><style>
body{margin:0;background:#f4f3f7;color:#1f2537;font-family:Segoe UI,Arial,sans-serif}.certificate{box-sizing:border-box;max-width:1000px;min-height:700px;margin:40px auto;border:12px solid #442c81;background:#fff;padding:70px;text-align:center;box-shadow:0 20px 60px rgba(31,37,55,.15)}.mark{display:grid;width:72px;height:72px;margin:0 auto 28px;place-items:center;border-radius:20px 20px 6px 20px;background:#29aae1;color:#1f2537;font-weight:900}.eyebrow{color:#442c81;font-size:13px;font-weight:800;letter-spacing:.18em;text-transform:uppercase}h1{margin:18px 0;font-size:52px}h2{margin:20px 0 8px;color:#442c81;font-size:30px}.role{color:#66677a}.rule{width:120px;height:5px;margin:34px auto;background:#29aae1}.footer{display:flex;justify-content:space-between;gap:20px;margin-top:60px;border-top:1px solid #ced4da;padding-top:20px;color:#66677a;font-size:13px}@media print{body{background:#fff}.certificate{margin:0;box-shadow:none}}
</style></head><body><main class="certificate"><div class="mark">AI</div><p class="eyebrow">Certificate of completion</p><h1>${learnerName}</h1><p>has completed the</p><h2>${levelName}: ${levelTitle}</h2><p class="role">Role path: ${role}</p><div class="rule"></div><p>Applied the CLEAR framework through five lessons and a workplace capstone.</p><div class="footer"><span>Completed ${completedOn}<br>Version ${APP_VERSION} | Updated ${APP_UPDATED}</span><span>Created by Dr Shane Turner<br>&copy; 2026 Dr Shane Turner</span></div></main></body></html>`;
    const url = URL.createObjectURL(
      new Blob([certificate], { type: "text/html;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `ai-practice-lab-${level.id}-certificate.html`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice(`${level.name} certificate downloaded.`);
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
          <button
            className="sidebar-reset"
            type="button"
            onClick={() => {
              setShowReset(true);
              changeView("progress");
            }}
          >
            Reset to 0
          </button>
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
          ) : view === "studio" ? (
            <CreatorStudio
              role={progress.profile?.role ?? GENERAL_ROLE}
              completed={progress.studioCompleted}
              bookmarks={progress.bookmarks}
              onComplete={completeStudioActivity}
              onToggleBookmark={toggleBookmark}
              onNotice={setNotice}
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
              onDownloadCertificate={() => downloadCertificate(activeLevel)}
              onReset={() => setShowReset(true)}
              showReset={showReset}
              onCancelReset={() => setShowReset(false)}
              onConfirmReset={resetProgress}
              onRoleChange={(role) =>
                setProgress((current) => ({
                  ...current,
                  profile: {
                    name: current.profile?.name ?? "Learner",
                    role,
                    confidence: current.profile?.confidence ?? 3,
                    tasks: current.profile?.tasks ?? [],
                  },
                }))
              }
              onNameChange={(name) =>
                setProgress((current) => ({
                  ...current,
                  profile: {
                    name,
                    role: current.profile?.role ?? GENERAL_ROLE,
                    confidence: current.profile?.confidence ?? 3,
                    tasks: current.profile?.tasks ?? [],
                  },
                }))
              }
              onApplyProgress={(updater) => {
                setProgress((current) => ({
                  ...updater(current),
                  currentTarget: null,
                  currentStage: 0,
                }));
                setActiveTarget(null);
                setLessonStage(0);
                setNotice("Account progress merged with this device.");
              }}
            />
          ) : (
            <ResourcesPage onNotice={setNotice} />
          )}
        </main>

        <footer className="app-footer">
          <strong>Created by Dr Shane Turner</strong>
          <span>Version {APP_VERSION} | Updated {APP_UPDATED}</span>
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
