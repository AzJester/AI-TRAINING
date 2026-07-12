"use client";

import { useMemo, useState } from "react";
import {
  AI_UPDATES,
  GPT_BUILDER_STEPS,
  IMAGE_PROMPT_FIELDS,
  MODEL_CHOICES,
  OFFICIAL_SOURCES,
  PROMPT_TEMPLATES,
  ROLE_USE_CASES,
  SAFE_DATA_QUESTIONS,
  SKILL_BUILDER_STEPS,
  STUDIO_QUIZ,
} from "./creator-studio-data";
import "./creator-studio.css";

interface CreatorStudioProps {
  role: string;
  completed: string[];
  bookmarks: string[];
  onComplete: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onNotice: (message: string) => void;
}

type DataRecord = Record<string, unknown>;
type StudioSection =
  | "overview"
  | "models"
  | "gpts"
  | "skills"
  | "images"
  | "use-cases"
  | "templates"
  | "safety"
  | "updates";

interface NormalizedModel {
  id: string;
  name: string;
  family: string;
  bestFor: string[];
  avoidWhen: string;
  speed: string;
  depth: string;
  examples: string[];
  availability: string;
  sourceUrl: string;
}

interface NormalizedUseCase {
  id: string;
  role: string;
  roles: string[];
  title: string;
  task: string;
  model: string;
  starterPrompt: string;
  checks: string[];
}

interface NormalizedTemplate {
  id: string;
  title: string;
  category: string;
  roles: string[];
  purpose: string;
  template: string;
  caution: string;
}

interface QuizOption {
  value: string;
  label: string;
  correct: boolean;
}

interface NormalizedQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
  explanation: string;
}

const SECTION_ITEMS: Array<{
  id: StudioSection;
  label: string;
  shortLabel: string;
}> = [
  { id: "overview", label: "Overview", shortLabel: "Start" },
  { id: "models", label: "Model Selector", shortLabel: "Models" },
  { id: "gpts", label: "Custom GPT", shortLabel: "GPT" },
  { id: "skills", label: "Skills", shortLabel: "Skills" },
  { id: "images", label: "Images", shortLabel: "Images" },
  { id: "use-cases", label: "Use Cases", shortLabel: "Use Cases" },
  { id: "templates", label: "Templates", shortLabel: "Templates" },
  { id: "safety", label: "Safety", shortLabel: "Safety" },
  { id: "updates", label: "Updates", shortLabel: "Updates" },
];

const LAB_IDS: Record<Exclude<StudioSection, "overview">, string> = {
  models: "model-selector",
  gpts: "custom-gpt",
  skills: "codex-skills",
  images: "image-prompts",
  "use-cases": "role-use-cases",
  templates: "template-library",
  safety: "safe-data",
  updates: "ai-updates",
};

function asRecords(value: unknown): DataRecord[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is DataRecord => Boolean(item) && typeof item === "object",
  );
}

function textValue(
  item: DataRecord,
  keys: string[],
  fallback = "",
): string {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return fallback;
}

function listValue(item: DataRecord, keys: string[]): string[] {
  for (const key of keys) {
    const value = item[key];
    if (Array.isArray(value)) {
      const list = value
        .map((entry) => {
          if (typeof entry === "string") return entry.trim();
          if (entry && typeof entry === "object") {
            return textValue(entry as DataRecord, [
              "label",
              "text",
              "title",
              "name",
              "value",
            ]);
          }
          return "";
        })
        .filter(Boolean);
      if (list.length) return list;
    }
    if (typeof value === "string" && value.trim()) {
      return value
        .split(/\r?\n|;/)
        .map((entry) => entry.replace(/^[-*]\s*/, "").trim())
        .filter(Boolean);
    }
  }
  return [];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function normalizedModels(): NormalizedModel[] {
  const sources = asRecords(OFFICIAL_SOURCES);
  return asRecords(MODEL_CHOICES).map((item, index) => {
    const sourceId = textValue(item, ["sourceId", "source_id"]);
    const source = sources.find(
      (sourceItem) => textValue(sourceItem, ["id"]) === sourceId,
    );
    return {
      id: textValue(item, ["id", "slug"], `model-${index + 1}`),
      name: textValue(item, ["label", "name", "model", "title"], `Model ${index + 1}`),
      family: textValue(item, ["engine", "family", "subtitle", "type"], "AI model"),
      bestFor: listValue(item, ["bestFor", "best_for", "useCases", "strengths"]),
      avoidWhen:
        listValue(item, ["avoidWhen", "avoid_when", "tradeoffs"]).join(" • ") ||
        textValue(item, ["tradeoff", "caution"]),
      speed: textValue(item, ["speed", "latency"], "Varies by plan"),
      depth: textValue(item, ["depth", "reasoning", "intelligence", "summary"], "General purpose"),
      examples: listValue(item, ["examples", "sampleUseCases", "use_cases", "roleExamples"]),
      availability: textValue(item, ["availability", "access", "where"], "Check your approved workspace"),
      sourceUrl:
        textValue(item, ["sourceUrl", "source_url", "url"]) ||
        (source ? textValue(source, ["url", "sourceUrl"]) : ""),
    };
  });
}

function normalizedUseCases(): NormalizedUseCase[] {
  return asRecords(ROLE_USE_CASES).map((item, index) => {
    const roles = listValue(item, ["roles", "roleFamilies", "audiences"]);
    const role = textValue(item, ["role", "roleFamily", "audience"], roles[0] ?? "All roles");
    return {
      id: textValue(item, ["id", "slug"], `use-case-${index + 1}`),
      role,
      roles: roles.length ? roles : [role],
      title: textValue(item, ["title", "name"], `Use case ${index + 1}`),
      task: textValue(item, ["task", "purpose", "description", "scenario"]),
      model: textValue(item, ["model", "recommendedModel", "tool"], "Use an approved model"),
      starterPrompt: textValue(item, ["starterPrompt", "prompt", "example", "template"]),
      checks: listValue(item, ["checks", "reviewChecks", "verify", "guardrails", "humanChecks"]),
    };
  });
}

function normalizedTemplates(): NormalizedTemplate[] {
  return asRecords(PROMPT_TEMPLATES).map((item, index) => ({
    id: textValue(item, ["id", "slug"], `template-${index + 1}`),
    title: textValue(item, ["title", "name"], `Template ${index + 1}`),
    category: textValue(item, ["category", "type", "skill"], "General"),
    roles: listValue(item, ["roles", "roleFamilies", "audiences"]),
    purpose: textValue(item, ["purpose", "description", "summary"]),
    template: textValue(item, ["template", "prompt", "starterPrompt", "content"]),
    caution: textValue(item, ["caution", "guardrail", "review", "note"]),
  }));
}

function normalizedQuiz(): NormalizedQuestion[] {
  return asRecords(STUDIO_QUIZ).map((item, questionIndex) => {
    const rawOptions = Array.isArray(item.options) ? item.options : [];
    const correctIndexRaw = item.correctIndex ?? item.correct_index;
    const correctIndex =
      typeof correctIndexRaw === "number"
        ? correctIndexRaw
        : Number.parseInt(String(correctIndexRaw ?? ""), 10);
    const correctText = textValue(item, [
      "correctAnswer",
      "correct_answer",
      "answer",
    ]).toLowerCase();
    const correctOptionId = textValue(item, ["correctOptionId", "correct_option_id"]);
    const options = rawOptions.map((option, optionIndex) => {
      if (typeof option === "string") {
        return {
          value: `${questionIndex}-${optionIndex}`,
          label: option,
          correct:
            optionIndex === correctIndex || option.toLowerCase() === correctText,
        };
      }
      const record = (option ?? {}) as DataRecord;
      const label = textValue(record, ["label", "text", "answer", "value"], `Option ${optionIndex + 1}`);
      const optionId = textValue(record, ["id", "value"], `${optionIndex}`);
      return {
        value: `${questionIndex}-${optionId}`,
        label,
        correct:
          record.correct === true ||
          record.isCorrect === true ||
          optionId === correctOptionId ||
          optionIndex === correctIndex ||
          label.toLowerCase() === correctText,
      };
    });
    if (options.length && !options.some((option) => option.correct)) {
      options[0] = { ...options[0], correct: true };
    }
    return {
      id: textValue(item, ["id", "slug"], `studio-question-${questionIndex + 1}`),
      prompt: textValue(item, ["question", "prompt", "title"], `Question ${questionIndex + 1}`),
      options,
      explanation: textValue(item, ["explanation", "feedback", "rationale"]),
    };
  });
}

function GuidanceCards({
  data,
  label,
}: {
  data: unknown;
  label: string;
}) {
  const items = asRecords(data);
  if (!items.length) return null;
  return (
    <div className="studio-guide-grid" aria-label={label}>
      {items.map((item, index) => (
        <article className="studio-guide-card" key={textValue(item, ["id"], `${label}-${index}`)}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <div>
            <h3>{textValue(item, ["title", "name", "label", "step", "prompt"], `Step ${index + 1}`)}</h3>
            <p>{textValue(item, ["description", "purpose", "guidance", "detail", "summary", "goal", "whyItMatters"]) || listValue(item, ["actions"]).join(" ")}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function KnowledgeCheck({
  onComplete,
  onNotice,
}: {
  onComplete: (id: string) => void;
  onNotice: (message: string) => void;
}) {
  const questions = useMemo(() => normalizedQuiz(), []);
  const [queue, setQueue] = useState(() => questions.map((_, index) => index));
  const [position, setPosition] = useState(0);
  const [selected, setSelected] = useState("");
  const [checked, setChecked] = useState(false);
  const [correctIds, setCorrectIds] = useState<string[]>([]);
  const [retryIds, setRetryIds] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);

  if (!questions.length) return null;
  const question = questions[queue[position] ?? 0];
  const answer = question.options.find((option) => option.value === selected);
  const correct = Boolean(answer?.correct);

  function checkAnswer() {
    if (!selected) return;
    setChecked(true);
    if (correct && !correctIds.includes(question.id)) {
      setCorrectIds((current) => [...current, question.id]);
    }
    if (!correct && !retryIds.includes(question.id)) {
      setRetryIds((current) => [...current, question.id]);
      setQueue((current) => [...current, queue[position]]);
    }
  }

  function nextQuestion() {
    const atEnd = position >= queue.length - 1;
    if (atEnd) {
      const finalCorrect = correct && !correctIds.includes(question.id)
        ? [...correctIds, question.id]
        : correctIds;
      setCorrectIds(finalCorrect);
      setFinished(true);
      if (finalCorrect.length === questions.length) {
        onComplete("knowledge-check");
        onNotice("Knowledge check complete. Every concept is ready.");
      } else {
        onNotice("Knowledge check complete. Review the missed concepts and try again.");
      }
      return;
    }
    setPosition((current) => current + 1);
    setSelected("");
    setChecked(false);
  }

  function restart() {
    const missed = questions
      .map((questionItem, index) => ({ questionItem, index }))
      .filter(({ questionItem }) => !correctIds.includes(questionItem.id))
      .map(({ index }) => index);
    setQueue(missed.length ? missed : questions.map((_, index) => index));
    setPosition(0);
    setSelected("");
    setChecked(false);
    setRetryIds([]);
    setFinished(false);
  }

  if (finished) {
    return (
      <section className="studio-quiz studio-quiz-finished" aria-labelledby="studio-quiz-result">
        <p className="eyebrow">Adaptive knowledge check</p>
        <h3 id="studio-quiz-result">
          {correctIds.length} of {questions.length} concepts ready
        </h3>
        <p>
          Questions you miss return later in the check. A complete score means you correctly answered every concept at least once.
        </p>
        <button className="button button-primary" type="button" onClick={restart}>
          {correctIds.length === questions.length ? "Practice again" : "Retry missed concepts"}
        </button>
      </section>
    );
  }

  return (
    <section className="studio-quiz" aria-labelledby="studio-quiz-heading">
      <div className="studio-quiz-head">
        <div>
          <p className="eyebrow">Adaptive knowledge check</p>
          <h3 id="studio-quiz-heading">Question {position + 1} of {queue.length}</h3>
        </div>
        <span>{correctIds.length}/{questions.length} ready</span>
      </div>
      <fieldset disabled={checked}>
        <legend>{question.prompt}</legend>
        <div className="studio-answer-grid">
          {question.options.map((option) => (
            <label key={option.value} className={selected === option.value ? "is-selected" : ""}>
              <input
                type="radio"
                name={`studio-${question.id}`}
                value={option.value}
                checked={selected === option.value}
                onChange={(event) => setSelected(event.target.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {checked ? (
        <div className={`studio-feedback ${correct ? "is-correct" : "is-review"}`} role="status">
          <strong>{correct ? "Correct" : "Review and retry later"}</strong>
          <p>{question.explanation || (correct ? "You selected the responsible path." : "This concept will return after the next questions.")}</p>
        </div>
      ) : null}
      <div className="studio-actions">
        {!checked ? (
          <button className="button button-primary" type="button" disabled={!selected} onClick={checkAnswer}>
            Check answer
          </button>
        ) : (
          <button className="button button-primary" type="button" onClick={nextQuestion}>
            {position >= queue.length - 1 ? "See results" : "Next question"}
          </button>
        )}
      </div>
    </section>
  );
}

export function CreatorStudio({
  role,
  completed,
  bookmarks,
  onComplete,
  onToggleBookmark,
  onNotice,
}: CreatorStudioProps) {
  const models = useMemo(() => normalizedModels(), []);
  const useCases = useMemo(() => normalizedUseCases(), []);
  const templates = useMemo(() => normalizedTemplates(), []);
  const [section, setSection] = useState<StudioSection>("overview");

  const [modelTask, setModelTask] = useState("everyday");
  const [modelPriority, setModelPriority] = useState("balanced");
  const [modelSurface, setModelSurface] = useState("chatgpt");
  const [modelSensitivity, setModelSensitivity] = useState("public");

  const [gptName, setGptName] = useState("Mission Work Assistant");
  const [gptAudience, setGptAudience] = useState(role);
  const [gptPurpose, setGptPurpose] = useState("Help users turn approved source material into clear, review-ready work products.");
  const [gptBehavior, setGptBehavior] = useState("Ask for the objective, audience, source material, constraints, and desired format before drafting.");
  const [gptBoundaries, setGptBoundaries] = useState("Do not invent facts. Do not request restricted data. Label assumptions and require human review.");
  const [gptFormat, setGptFormat] = useState("Start with a concise answer, then provide evidence, assumptions, risks, and next actions.");

  const [skillName, setSkillName] = useState("review-ready-brief");
  const [skillDescription, setSkillDescription] = useState("Create a concise, evidence-based brief from approved source material and verify it before delivery.");
  const [skillTriggers, setSkillTriggers] = useState("Use when the user asks for a decision brief, executive summary, or structured recommendation.");
  const [skillWorkflow, setSkillWorkflow] = useState("1. Confirm the objective and audience.\n2. Inspect approved source material.\n3. Separate facts, assumptions, and gaps.\n4. Draft the brief.\n5. Run the verification checklist.");
  const [skillReferences, setSkillReferences] = useState("Reference approved templates, policies, and examples only when they are supplied or available in the workspace.");
  const [skillVerification, setSkillVerification] = useState("Confirm every material claim has a source, remove sensitive details, and flag unresolved gaps for human review.");

  const [imageGoal, setImageGoal] = useState("Create a professional concept image for an internal training presentation");
  const [imageSubject, setImageSubject] = useState("a cross-functional team evaluating an AI-assisted workflow");
  const [imageSetting, setImageSetting] = useState("a modern, secure collaboration space with abstract mission displays");
  const [imageComposition, setImageComposition] = useState("wide editorial composition, clear focal point, generous space for a title");
  const [imageStyle, setImageStyle] = useState("polished editorial illustration with realistic lighting");
  const [imageColor, setImageColor] = useState("deep purple, slate, white, and restrained cyan accents");
  const [imageText, setImageText] = useState("No text inside the image");
  const [imageConstraints, setImageConstraints] = useState("No logos, badges, uniforms, weapons, classified markings, or identifiable people");
  const [imageAspect, setImageAspect] = useState("16:9 landscape");

  const [useCaseRole, setUseCaseRole] = useState(role || "All roles");
  const [useCaseSearch, setUseCaseSearch] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateCategory, setTemplateCategory] = useState("All categories");
  const [savedOnly, setSavedOnly] = useState(false);

  const [dataClass, setDataClass] = useState("");
  const [approvedTool, setApprovedTool] = useState("");

  const labCount = Object.values(LAB_IDS).filter((id) => completed.includes(id)).length;
  const sectionLabId = section === "overview" ? null : LAB_IDS[section];

  const recommendedModel = useMemo(() => {
    if (!models.length || modelSensitivity === "controlled") return null;
    const searchable = models.map((model) => ({
      model,
      text: [model.id, model.name, model.family, ...model.bestFor, ...model.examples]
        .join(" ")
        .toLowerCase(),
    }));
    const imageModel = searchable.find(({ text }) => text.includes("image"));
    if (modelTask === "images" && imageModel) return imageModel.model;

    if (modelSurface === "chatgpt") {
      const chatChoice =
        modelTask === "reasoning" ||
        modelTask === "coding" ||
        modelPriority === "quality"
          ? searchable.find(({ text }) => text.includes("sol"))
          : searchable.find(({ text }) => text.includes("instant"));
      return chatChoice?.model ?? models[0];
    }

    const preferredTerm =
      modelPriority === "quality"
        ? "sol"
        : modelPriority === "speed" || modelPriority === "cost"
          ? "luna"
          : "terra";
    const preferred = searchable.find(({ text }) => text.includes(preferredTerm));
    if (preferred) return preferred.model;
    if (modelTask === "reasoning" || modelTask === "coding") {
      return searchable.find(({ text }) => text.includes("sol"))?.model ?? models[0];
    }
    return models[Math.min(1, models.length - 1)];
  }, [modelPriority, modelSensitivity, modelSurface, modelTask, models]);

  const gptInstructions = useMemo(
    () => `# ${gptName || "Custom assistant"}\n\n## Audience\n${gptAudience || "Define the intended users."}\n\n## Purpose\n${gptPurpose || "Define the job this GPT should perform."}\n\n## Operating instructions\n${gptBehavior || "Define how the GPT should gather context and complete the work."}\n\n## Boundaries\n${gptBoundaries || "Define prohibited behavior, data limits, and review requirements."}\n\n## Response format\n${gptFormat || "Define the expected structure and level of detail."}\n\n## Quality checks\n- Distinguish facts from assumptions.\n- Cite or identify the supplied source for material claims.\n- State uncertainty instead of guessing.\n- Require a qualified human to review decisions and deliverables.`,
    [gptAudience, gptBehavior, gptBoundaries, gptFormat, gptName, gptPurpose],
  );

  const skillMarkdown = useMemo(() => {
    const safeName = slugify(skillName) || "new-skill";
    const description = skillDescription.replace(/\r?\n/g, " ").replace(/"/g, "'");
    return `---\nname: ${safeName}\ndescription: "${description}"\n---\n\n# ${safeName}\n\n## When to use\n${skillTriggers}\n\n## Workflow\n${skillWorkflow}\n\n## References and assets\n${skillReferences}\n\n## Verification\n${skillVerification}\n\n## Safety\nUse only approved data and tools. Stop when required information is restricted, missing, or outside the user's authority.`;
  }, [skillDescription, skillName, skillReferences, skillTriggers, skillVerification, skillWorkflow]);

  const imagePrompt = useMemo(
    () => `Goal: ${imageGoal}.\nSubject: ${imageSubject}.\nSetting: ${imageSetting}.\nComposition: ${imageComposition}.\nVisual style: ${imageStyle}.\nColor direction: ${imageColor}.\nText treatment: ${imageText}.\nConstraints: ${imageConstraints}.\nFormat: ${imageAspect}.\nQuality check: professional, accessible, visually coherent, and suitable for the stated audience.`,
    [imageAspect, imageColor, imageComposition, imageConstraints, imageGoal, imageSetting, imageStyle, imageSubject, imageText],
  );

  const roleOptions = useMemo(
    () => [
      "All roles",
      ...Array.from(new Set(useCases.flatMap((useCase) => useCase.roles))).sort(),
    ],
    [useCases],
  );
  const effectiveUseCaseRole = roleOptions.includes(useCaseRole)
    ? useCaseRole
    : "All roles";
  const visibleUseCases = useMemo(() => {
    const query = useCaseSearch.trim().toLowerCase();
    return useCases.filter((useCase) => {
      const roleMatches = effectiveUseCaseRole === "All roles" || useCase.roles.includes(effectiveUseCaseRole) || useCase.role === effectiveUseCaseRole;
      const queryMatches = !query || [useCase.title, useCase.task, useCase.model, useCase.starterPrompt, ...useCase.roles]
        .join(" ")
        .toLowerCase()
        .includes(query);
      return roleMatches && queryMatches;
    });
  }, [effectiveUseCaseRole, useCaseSearch, useCases]);

  const templateCategories = useMemo(
    () => ["All categories", ...Array.from(new Set(templates.map((template) => template.category))).sort()],
    [templates],
  );
  const visibleTemplates = useMemo(() => {
    const query = templateSearch.trim().toLowerCase();
    return templates.filter((template) => {
      const bookmarkId = `template:${template.id}`;
      return (
        (templateCategory === "All categories" || template.category === templateCategory) &&
        (!savedOnly || bookmarks.includes(bookmarkId)) &&
        (!query || [template.title, template.category, template.purpose, template.template, ...template.roles]
          .join(" ")
          .toLowerCase()
          .includes(query))
      );
    });
  }, [bookmarks, savedOnly, templateCategory, templateSearch, templates]);

  const safetyDecision = useMemo(() => {
    if (!dataClass || !approvedTool) return null;
    if (approvedTool !== "yes") {
      return {
        status: "stop",
        title: "Stop and confirm the approved path",
        body: approvedTool === "no"
          ? "Do not enter work information into an unapproved AI tool. Use your organization's approved process or ask the responsible security, legal, or IT contact."
          : "Treat uncertainty as a stop signal. Confirm tool approval and data handling rules before continuing.",
      };
    }
    if (["controlled", "personal"].includes(dataClass)) {
      return {
        status: "stop",
        title: "Do not enter this information",
        body: "Use the authorized workflow for controlled, export-controlled, proprietary, personal, legal, or otherwise restricted information. Tool approval alone does not approve every data type.",
      };
    }
    if (dataClass === "internal") {
      return {
        status: "review",
        title: "Pause, minimize, and verify permission",
        body: "Remove names, identifiers, customer details, nonpublic program information, and unnecessary context. Proceed only when policy and the approved tool's data rules allow this exact use.",
      };
    }
    return {
      status: "go",
      title: "Proceed with a review checkpoint",
      body: "Use the minimum public or synthetic information needed, check the output against trusted sources, and have a qualified person review it before use.",
    };
  }, [approvedTool, dataClass]);

  function activateSection(next: StudioSection) {
    setSection(next);
    window.requestAnimationFrame(() => {
      document.getElementById("studio-section-heading")?.focus();
    });
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
    const url = URL.createObjectURL(new Blob([skillMarkdown], { type: "text/markdown" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "SKILL.md";
    link.click();
    URL.revokeObjectURL(url);
    onNotice("SKILL.md download prepared.");
  }

  function finishLab(id: string, label: string) {
    onComplete(id);
    onNotice(`${label} marked complete.`);
  }

  function completionButton(id: string, label: string) {
    const isComplete = completed.includes(id);
    return (
      <button
        className={`button ${isComplete ? "button-quiet" : "button-primary"}`}
        type="button"
        onClick={() => finishLab(id, label)}
      >
        {isComplete ? "Completed" : "Mark lab complete"}
      </button>
    );
  }

  return (
    <div className="creator-studio">
      <header className="studio-hero">
        <div className="studio-hero-copy">
          <p className="eyebrow">Creator Studio</p>
          <h1>Build useful AI workflows with judgment.</h1>
          <p>
            Choose a model, design reusable assistants, create skills, write image prompts, and practice responsible use. Everything in this studio stays in your browser.
          </p>
          <div className="studio-hero-actions">
            <button className="button studio-light-button" type="button" onClick={() => activateSection("models")}>
              Start with model selection
            </button>
            <button className="button studio-ghost-button" type="button" onClick={() => activateSection("templates")}>
              Browse prompt templates
            </button>
          </div>
        </div>
        <div className="studio-scorecard" aria-label="Creator Studio progress">
          <span className="studio-orbit" aria-hidden="true">AI</span>
          <strong>{labCount}<small>/{Object.keys(LAB_IDS).length}</small></strong>
          <p>studio labs complete</p>
          <div className="studio-progress-track" aria-hidden="true">
            <span style={{ width: `${Math.round((labCount / Object.keys(LAB_IDS).length) * 100)}%` }} />
          </div>
          <small>{bookmarks.length} saved item{bookmarks.length === 1 ? "" : "s"}</small>
        </div>
      </header>

      <nav className="studio-subnav" aria-label="Creator Studio sections">
        {SECTION_ITEMS.map((item, index) => (
          <button
            type="button"
            key={item.id}
            className={section === item.id ? "is-active" : ""}
            aria-current={section === item.id ? "page" : undefined}
            onClick={() => activateSection(item.id)}
          >
            <span aria-hidden="true">{String(index).padStart(2, "0")}</span>
            <strong className="studio-nav-long">{item.label}</strong>
            <strong className="studio-nav-short">{item.shortLabel}</strong>
            {item.id !== "overview" && completed.includes(LAB_IDS[item.id]) ? (
              <i aria-label="Complete">✓</i>
            ) : null}
          </button>
        ))}
      </nav>

      <main className="studio-main" aria-live="polite">
        {section === "overview" ? (
          <section aria-labelledby="studio-section-heading">
            <div className="studio-section-head">
              <div>
                <p className="eyebrow">Build, test, review</p>
                <h2 id="studio-section-heading" tabIndex={-1}>Choose a workshop</h2>
                <p>Each lab produces something useful that you can copy or download. No form entry is transmitted or stored by this studio.</p>
              </div>
              <div className="studio-role-chip"><span>Your lens</span><strong>{role || "Cross-functional work"}</strong></div>
            </div>
            <div className="studio-workshop-grid">
              {SECTION_ITEMS.filter((item) => item.id !== "overview").map((item, index) => {
                const labSection = item.id as Exclude<StudioSection, "overview">;
                const id = LAB_IDS[labSection];
                const descriptions: Record<string, string> = {
                  models: "Match task depth, speed, cost, and access to a practical model choice.",
                  gpts: "Turn a repeatable job into clear instructions for a tailored assistant.",
                  skills: "Generate a reusable SKILL.md with triggers, steps, references, and checks.",
                  images: "Compose a precise visual brief with layout, style, and safety constraints.",
                  "use-cases": "Explore realistic examples for business and mission-support roles.",
                  templates: "Search, save, and copy prompts built around responsible work patterns.",
                  safety: "Follow a branching decision path before entering work information.",
                  updates: "Review dated model guidance and links to official sources.",
                };
                return (
                  <article className="studio-workshop-card" key={item.id}>
                    <div className="studio-card-number"><span>{String(index + 1).padStart(2, "0")}</span>{completed.includes(id) ? <i>Complete</i> : null}</div>
                    <h3>{item.label}</h3>
                    <p>{descriptions[item.id]}</p>
                    <button className="text-button" type="button" onClick={() => activateSection(item.id)}>
                      Open workshop <span aria-hidden="true">→</span>
                    </button>
                  </article>
                );
              })}
            </div>
            <KnowledgeCheck onComplete={onComplete} onNotice={onNotice} />
          </section>
        ) : null}

        {section === "models" ? (
          <section aria-labelledby="studio-section-heading">
            <div className="studio-section-head">
              <div><p className="eyebrow">Model Selector Lab</p><h2 id="studio-section-heading" tabIndex={-1}>Choose for the job, not the hype</h2><p>Describe the work and the lab will suggest a starting point. Availability can vary by plan and approved workspace.</p></div>
              {completionButton("model-selector", "Model Selector Lab")}
            </div>
            <div className="studio-two-column">
              <form className="studio-form-card" onSubmit={(event) => event.preventDefault()}>
                <div className="studio-form-title"><span>01</span><div><h3>Define the decision</h3><p>Use task and operating constraints, not model popularity.</p></div></div>
                <label>Primary task<select value={modelTask} onChange={(event) => setModelTask(event.target.value)}><option value="everyday">Everyday writing and analysis</option><option value="reasoning">Complex reasoning and decision support</option><option value="coding">Coding and workflow automation</option><option value="volume">High-volume extraction or classification</option><option value="images">Image generation or editing</option></select></label>
                <label>Top priority<select value={modelPriority} onChange={(event) => setModelPriority(event.target.value)}><option value="balanced">Balanced quality and efficiency</option><option value="quality">Maximum quality and depth</option><option value="speed">Speed and responsiveness</option><option value="cost">Lower cost at scale</option></select></label>
                <label>Where will you work?<select value={modelSurface} onChange={(event) => setModelSurface(event.target.value)}><option value="chatgpt">ChatGPT workspace</option><option value="codex">Codex work environment</option><option value="api">Approved API workflow</option></select></label>
                <label>Highest data sensitivity<select value={modelSensitivity} onChange={(event) => setModelSensitivity(event.target.value)}><option value="public">Public or synthetic</option><option value="internal">Internal, after policy review</option><option value="controlled">Controlled, regulated, personal, or restricted</option></select></label>
              </form>
              <div className={`studio-recommendation ${modelSensitivity === "controlled" ? "is-stop" : ""}`} role="status">
                <p className="eyebrow">Starting recommendation</p>
                {modelSensitivity === "controlled" ? <><h3>Stop before choosing a model</h3><p>First use the authorized data-handling path. A capable model does not make a tool or data type approved.</p><button className="button button-quiet" type="button" onClick={() => activateSection("safety")}>Open safe-data coach</button></> : recommendedModel ? <><span className="studio-model-family">{recommendedModel.family}</span><h3>{recommendedModel.name}</h3><p>{recommendedModel.bestFor[0] || "A practical starting point for this combination of task and priority."}</p><dl><div><dt>Speed</dt><dd>{recommendedModel.speed}</dd></div><div><dt>Depth</dt><dd>{recommendedModel.depth}</dd></div><div><dt>Surface</dt><dd>{modelSurface === "chatgpt" ? "ChatGPT" : modelSurface === "codex" ? "Codex" : "API"}</dd></div></dl><small>{recommendedModel.availability}</small></> : <><h3>Compare the approved choices</h3><p>No model guidance is available yet. Confirm the models available in your approved workspace.</p></>}
              </div>
            </div>
            <div className="studio-model-grid">
              {models.map((model) => <article className="studio-model-card" key={model.id}><div><span>{model.family}</span><h3>{model.name}</h3></div><p><strong>Best for</strong>{model.bestFor.join(" • ") || "General AI-assisted work"}</p>{model.avoidWhen ? <p><strong>Choose another option when</strong>{model.avoidWhen}</p> : null}{model.examples.length ? <ul>{model.examples.map((example) => <li key={example}>{example}</li>)}</ul> : null}<footer><small>{model.availability}</small>{model.sourceUrl ? <a href={model.sourceUrl} target="_blank" rel="noreferrer">Official guidance</a> : null}</footer></article>)}
            </div>
          </section>
        ) : null}

        {section === "gpts" ? (
          <section aria-labelledby="studio-section-heading">
            <div className="studio-section-head"><div><p className="eyebrow">Custom GPT Builder</p><h2 id="studio-section-heading" tabIndex={-1}>Design instructions people can trust</h2><p>Define a narrow job, operating behavior, boundaries, and a reviewable output format.</p></div>{completionButton("custom-gpt", "Custom GPT Builder")}</div>
            <aside className="studio-fact-strip">
              <div><strong>Where to build</strong><p>Creating and editing Custom GPTs is a web-based workflow. Access depends on a paid plan, workspace permissions, and administrator controls.</p></div>
              <a href="https://help.openai.com/en/articles/8554397-creating-a-gpt" target="_blank" rel="noreferrer">Open official GPT guidance</a>
            </aside>
            <GuidanceCards data={GPT_BUILDER_STEPS} label="Custom GPT building steps" />
            <div className="studio-builder-grid">
              <form className="studio-form-card studio-builder-form" onSubmit={(event) => event.preventDefault()}>
                <label>GPT name<input value={gptName} onChange={(event) => setGptName(event.target.value)} /></label>
                <label>Audience<input value={gptAudience} onChange={(event) => setGptAudience(event.target.value)} /></label>
                <label className="studio-field-wide">Purpose<textarea rows={3} value={gptPurpose} onChange={(event) => setGptPurpose(event.target.value)} /></label>
                <label className="studio-field-wide">Operating behavior<textarea rows={4} value={gptBehavior} onChange={(event) => setGptBehavior(event.target.value)} /></label>
                <label className="studio-field-wide">Boundaries and review<textarea rows={4} value={gptBoundaries} onChange={(event) => setGptBoundaries(event.target.value)} /></label>
                <label className="studio-field-wide">Response format<textarea rows={3} value={gptFormat} onChange={(event) => setGptFormat(event.target.value)} /></label>
              </form>
              <div className="studio-output-card"><div className="studio-output-head"><div><span>Generated instructions</span><strong>Ready to refine</strong></div><button className="button button-small button-quiet" type="button" onClick={() => copyText(gptInstructions, "GPT instructions")}>Copy</button></div><pre>{gptInstructions}</pre><div className="studio-note"><strong>Before publishing</strong><p>Test normal requests, missing context, sensitive-data requests, refusal behavior, and edge cases. Knowledge files should support the instructions, not replace them.</p></div></div>
            </div>
          </section>
        ) : null}

        {section === "skills" ? (
          <section aria-labelledby="studio-section-heading">
            <div className="studio-section-head"><div><p className="eyebrow">Codex Skills Workshop</p><h2 id="studio-section-heading" tabIndex={-1}>Package a repeatable workflow</h2><p>A skill combines clear activation guidance, a focused procedure, reusable references, and verification.</p></div>{completionButton("codex-skills", "Codex Skills Workshop")}</div>
            <aside className="studio-fact-strip">
              <div><strong>Core structure</strong><p>A skill is a directory with a required SKILL.md file. It can also include scripts, references, assets, and optional agent configuration.</p></div>
              <a href="https://developers.openai.com/codex/skills" target="_blank" rel="noreferrer">Open official Skills guidance</a>
            </aside>
            <GuidanceCards data={SKILL_BUILDER_STEPS} label="Skill building steps" />
            <div className="studio-builder-grid">
              <form className="studio-form-card studio-builder-form" onSubmit={(event) => event.preventDefault()}>
                <label>Skill folder name<input value={skillName} onChange={(event) => setSkillName(event.target.value)} /></label>
                <label className="studio-field-wide">Description<textarea rows={3} value={skillDescription} onChange={(event) => setSkillDescription(event.target.value)} /></label>
                <label className="studio-field-wide">When to use<textarea rows={3} value={skillTriggers} onChange={(event) => setSkillTriggers(event.target.value)} /></label>
                <label className="studio-field-wide">Workflow<textarea rows={6} value={skillWorkflow} onChange={(event) => setSkillWorkflow(event.target.value)} /></label>
                <label className="studio-field-wide">References and assets<textarea rows={3} value={skillReferences} onChange={(event) => setSkillReferences(event.target.value)} /></label>
                <label className="studio-field-wide">Verification<textarea rows={3} value={skillVerification} onChange={(event) => setSkillVerification(event.target.value)} /></label>
              </form>
              <div className="studio-output-card"><div className="studio-output-head"><div><span>Generated file</span><strong>SKILL.md</strong></div><div><button className="button button-small button-quiet" type="button" onClick={() => copyText(skillMarkdown, "SKILL.md")}>Copy</button><button className="button button-small button-primary" type="button" onClick={downloadSkill}>Download</button></div></div><pre>{skillMarkdown}</pre><div className="studio-file-tree" aria-label="Recommended skill structure"><span>{slugify(skillName) || "new-skill"}/</span><span>├── SKILL.md</span><span>├── references/</span><span>├── scripts/</span><span>└── assets/</span></div></div>
            </div>
          </section>
        ) : null}

        {section === "images" ? (
          <section aria-labelledby="studio-section-heading">
            <div className="studio-section-head"><div><p className="eyebrow">Image Prompt Studio</p><h2 id="studio-section-heading" tabIndex={-1}>Direct the picture before generating it</h2><p>Build a production-ready visual brief with subject, composition, style, text treatment, and constraints.</p></div>{completionButton("image-prompts", "Image Prompt Studio")}</div>
            <GuidanceCards data={IMAGE_PROMPT_FIELDS} label="Image prompt elements" />
            <div className="studio-builder-grid">
              <form className="studio-form-card studio-builder-form" onSubmit={(event) => event.preventDefault()}>
                <label className="studio-field-wide">Goal<textarea rows={2} value={imageGoal} onChange={(event) => setImageGoal(event.target.value)} /></label><label>Subject<input value={imageSubject} onChange={(event) => setImageSubject(event.target.value)} /></label><label>Setting<input value={imageSetting} onChange={(event) => setImageSetting(event.target.value)} /></label><label>Composition<input value={imageComposition} onChange={(event) => setImageComposition(event.target.value)} /></label><label>Style<input value={imageStyle} onChange={(event) => setImageStyle(event.target.value)} /></label><label>Color direction<input value={imageColor} onChange={(event) => setImageColor(event.target.value)} /></label><label>Aspect ratio<select value={imageAspect} onChange={(event) => setImageAspect(event.target.value)}><option>16:9 landscape</option><option>1:1 square</option><option>4:5 portrait</option><option>9:16 vertical</option></select></label><label className="studio-field-wide">Text treatment<input value={imageText} onChange={(event) => setImageText(event.target.value)} /></label><label className="studio-field-wide">Constraints<textarea rows={3} value={imageConstraints} onChange={(event) => setImageConstraints(event.target.value)} /></label>
              </form>
              <div className="studio-output-card studio-image-output"><div className="studio-output-head"><div><span>Composed prompt</span><strong>{imageAspect}</strong></div><button className="button button-small button-quiet" type="button" onClick={() => copyText(imagePrompt, "Image prompt")}>Copy</button></div><pre>{imagePrompt}</pre><div className="studio-note"><strong>Use the right workflow</strong><p>Use a direct image tool for a single generation or edit. Use a conversational image workflow when you expect multiple rounds of feedback and revision.</p></div></div>
            </div>
          </section>
        ) : null}

        {section === "use-cases" ? (
          <section aria-labelledby="studio-section-heading">
            <div className="studio-section-head"><div><p className="eyebrow">Role Use-Case Gallery</p><h2 id="studio-section-heading" tabIndex={-1}>Start from realistic work</h2><p>Use examples as patterns, then replace placeholders with approved, necessary context.</p></div>{completionButton("role-use-cases", "Role Use-Case Gallery")}</div>
            <div className="studio-filter-bar"><label>Role family<select value={effectiveUseCaseRole} onChange={(event) => setUseCaseRole(event.target.value)}>{roleOptions.map((option) => <option key={option}>{option}</option>)}</select></label><label>Search examples<input type="search" value={useCaseSearch} onChange={(event) => setUseCaseSearch(event.target.value)} placeholder="Search task, model, or prompt" /></label><span>{visibleUseCases.length} example{visibleUseCases.length === 1 ? "" : "s"}</span></div>
            <div className="studio-use-case-grid">{visibleUseCases.map((useCase) => { const bookmarkId = `use-case:${useCase.id}`; const saved = bookmarks.includes(bookmarkId); return <article className="studio-use-case-card" key={useCase.id}><header><span>{useCase.role}</span><button type="button" aria-pressed={saved} aria-label={`${saved ? "Remove" : "Save"} ${useCase.title}`} onClick={() => onToggleBookmark(bookmarkId)}>{saved ? "Saved" : "Save"}</button></header><h3>{useCase.title}</h3><p>{useCase.task}</p><div><strong>Suggested starting point</strong><span>{useCase.model}</span></div><details><summary>Open starter prompt</summary><pre>{useCase.starterPrompt}</pre>{useCase.checks.length ? <ul>{useCase.checks.map((check) => <li key={check}>{check}</li>)}</ul> : null}<button className="button button-small button-quiet" type="button" onClick={() => copyText(useCase.starterPrompt, "Starter prompt")}>Copy prompt</button></details></article>; })}</div>
            {!visibleUseCases.length ? <div className="studio-empty"><h3>No matching examples</h3><p>Try a broader role family or a shorter search.</p></div> : null}
          </section>
        ) : null}

        {section === "templates" ? (
          <section aria-labelledby="studio-section-heading">
            <div className="studio-section-head"><div><p className="eyebrow">Prompt Template Library</p><h2 id="studio-section-heading" tabIndex={-1}>Find a responsible starting structure</h2><p>Templates provide scaffolding. You still own source quality, data handling, verification, and the final decision.</p></div>{completionButton("template-library", "Prompt Template Library")}</div>
            <div className="studio-filter-bar studio-template-filters"><label>Search templates<input type="search" value={templateSearch} onChange={(event) => setTemplateSearch(event.target.value)} placeholder="Search title, role, or content" /></label><label>Category<select value={templateCategory} onChange={(event) => setTemplateCategory(event.target.value)}>{templateCategories.map((category) => <option key={category}>{category}</option>)}</select></label><label className="studio-check-filter"><input type="checkbox" checked={savedOnly} onChange={(event) => setSavedOnly(event.target.checked)} /><span>Saved only</span></label><span>{visibleTemplates.length} shown</span></div>
            <div className="studio-template-grid">{visibleTemplates.map((template) => { const bookmarkId = `template:${template.id}`; const saved = bookmarks.includes(bookmarkId); return <article className="studio-template-card" key={template.id}><header><span>{template.category}</span><button type="button" aria-pressed={saved} onClick={() => onToggleBookmark(bookmarkId)}>{saved ? "★ Saved" : "☆ Save"}</button></header><h3>{template.title}</h3><p>{template.purpose}</p>{template.roles.length ? <div className="studio-tag-row">{template.roles.slice(0, 3).map((templateRole) => <span key={templateRole}>{templateRole}</span>)}</div> : null}<details><summary>View template</summary><pre>{template.template}</pre>{template.caution ? <p className="studio-caution"><strong>Review:</strong> {template.caution}</p> : null}</details><button className="button button-small button-quiet" type="button" onClick={() => copyText(template.template, template.title)}>Copy template</button></article>; })}</div>
            {!visibleTemplates.length ? <div className="studio-empty"><h3>No templates match</h3><p>Clear the saved-only filter, select all categories, or try another term.</p></div> : null}
          </section>
        ) : null}

        {section === "safety" ? (
          <section aria-labelledby="studio-section-heading">
            <div className="studio-section-head"><div><p className="eyebrow">Safe-Data Decision Coach</p><h2 id="studio-section-heading" tabIndex={-1}>Decide before you paste</h2><p>Follow the branch using the most sensitive information involved. When unsure, stop and confirm.</p></div>{completionButton("safe-data", "Safe-Data Decision Coach")}</div>
            <div className="studio-safety-grid">
              <form className="studio-form-card" onSubmit={(event) => event.preventDefault()}>
                <fieldset><legend>1. What is the highest data classification or sensitivity?</legend><div className="studio-choice-stack"><label><input type="radio" name="data-class" value="public" checked={dataClass === "public"} onChange={(event) => setDataClass(event.target.value)} /><span><strong>Public or synthetic</strong><small>Already public, approved for release, or realistic test data</small></span></label><label><input type="radio" name="data-class" value="internal" checked={dataClass === "internal"} onChange={(event) => setDataClass(event.target.value)} /><span><strong>Internal or proprietary</strong><small>Nonpublic business, customer, program, legal, or technical context</small></span></label><label><input type="radio" name="data-class" value="controlled" checked={dataClass === "controlled"} onChange={(event) => setDataClass(event.target.value)} /><span><strong>Controlled or restricted</strong><small>Classified, export-controlled, regulated, contract-restricted, or security-sensitive</small></span></label><label><input type="radio" name="data-class" value="personal" checked={dataClass === "personal"} onChange={(event) => setDataClass(event.target.value)} /><span><strong>Personal or privileged</strong><small>Personal data, health details, legal privilege, investigations, or personnel matters</small></span></label></div></fieldset>
                <fieldset><legend>2. Is this exact AI tool and use approved?</legend><div className="studio-segmented"><label><input type="radio" name="tool-approval" value="yes" checked={approvedTool === "yes"} onChange={(event) => setApprovedTool(event.target.value)} /><span>Yes</span></label><label><input type="radio" name="tool-approval" value="no" checked={approvedTool === "no"} onChange={(event) => setApprovedTool(event.target.value)} /><span>No</span></label><label><input type="radio" name="tool-approval" value="unsure" checked={approvedTool === "unsure"} onChange={(event) => setApprovedTool(event.target.value)} /><span>Unsure</span></label></div></fieldset>
              </form>
              <div className="studio-decision-panel"><p className="eyebrow">Your decision path</p>{safetyDecision ? <div className={`studio-decision is-${safetyDecision.status}`} role="status"><span aria-hidden="true">{safetyDecision.status === "go" ? "✓" : safetyDecision.status === "review" ? "!" : "×"}</span><h3>{safetyDecision.title}</h3><p>{safetyDecision.body}</p></div> : <div className="studio-decision is-waiting"><span aria-hidden="true">?</span><h3>Answer both questions</h3><p>The coach will show a recommended path after you identify the data and tool approval status.</p></div>}<button className="button button-quiet" type="button" onClick={() => { setDataClass(""); setApprovedTool(""); }}>Start over</button></div>
            </div>
            <GuidanceCards data={SAFE_DATA_QUESTIONS} label="Safe-data review questions" />
            <div className="studio-principles"><article><strong>Minimize</strong><p>Use only the information needed for the task.</p></article><article><strong>De-identify</strong><p>Remove names, IDs, program details, and sensitive context.</p></article><article><strong>Verify</strong><p>Check outputs against trusted sources and policy.</p></article><article><strong>Own</strong><p>A qualified human remains accountable for the result.</p></article></div>
          </section>
        ) : null}

        {section === "updates" ? (
          <section aria-labelledby="studio-section-heading">
            <div className="studio-section-head"><div><p className="eyebrow">AI Updates</p><h2 id="studio-section-heading" tabIndex={-1}>Use dated guidance</h2><p>Model names, availability, and product behavior change. Check the date and follow official sources before making a lasting decision.</p></div>{completionButton("ai-updates", "AI Updates")}</div>
            <div className="studio-update-grid">{asRecords(AI_UPDATES).map((item, index) => { const url = textValue(item, ["sourceUrl", "source_url", "url"]); return <article className="studio-update-card" key={textValue(item, ["id"], `update-${index}`)}><header><time>{textValue(item, ["verifiedOn", "date", "updated", "published"], "Check current guidance")}</time><span>{textValue(item, ["category", "type"], "Product guidance")}</span></header><h3>{textValue(item, ["title", "name"], `Update ${index + 1}`)}</h3><p>{textValue(item, ["summary", "description", "detail"])}</p>{textValue(item, ["impact", "whyItMatters", "recommendation"]) ? <div><strong>What to do</strong><p>{textValue(item, ["impact", "whyItMatters", "recommendation"])}</p></div> : null}{url ? <a href={url} target="_blank" rel="noreferrer">{textValue(item, ["sourceName", "source", "linkLabel"], "Read the official source")} <span aria-hidden="true">↗</span></a> : null}</article>; })}</div>
            <section className="studio-sources" aria-labelledby="studio-sources-heading"><div><p className="eyebrow">Source shelf</p><h3 id="studio-sources-heading">Official references</h3><p>Open these references when you need the current product details, access rules, or implementation guidance.</p></div><div>{asRecords(OFFICIAL_SOURCES).map((item, index) => { const url = textValue(item, ["url", "sourceUrl", "href"]); return <a key={textValue(item, ["id"], `source-${index}`)} href={url || undefined} target={url ? "_blank" : undefined} rel={url ? "noreferrer" : undefined}><span>{String(index + 1).padStart(2, "0")}</span><strong>{textValue(item, ["title", "name", "label"], `Official reference ${index + 1}`)}</strong><small>{textValue(item, ["description", "purpose", "publisher"], "Open official guidance")}</small></a>; })}</div></section>
          </section>
        ) : null}
      </main>

      {sectionLabId && completed.includes(sectionLabId) ? (
        <div className="studio-complete-ribbon" role="status"><span aria-hidden="true">✓</span>This studio lab is complete</div>
      ) : null}
    </div>
  );
}
