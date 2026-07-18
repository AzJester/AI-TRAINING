export const STUDIO_VERIFIED_ON = "2026-07-18";

export const STUDIO_LOCAL_FIRST_NOTICE =
  "This learning studio runs entirely in the browser. It does not call an AI service, upload content, or validate access to a particular model or workspace.";

export type StudioSectionId =
  | "models"
  | "gpts"
  | "skills"
  | "images"
  | "use-cases"
  | "templates"
  | "safety"
  | "updates";

export interface OfficialSource {
  id: string;
  title: string;
  url: string;
  appliesTo: string[];
  verifiedOn: string;
}

export interface ModelChoice {
  id: string;
  name: string;
  family: string;
  surface: string[];
  summary: string;
  bestFor: string[];
  avoidWhen: string[];
  strengths: string[];
  tradeoffs: string[];
  roleExamples: string[];
  availability: string;
  sourceId: string;
  verifiedOn: string;
}

export interface BuilderStep {
  id: string;
  order: number;
  title: string;
  goal: string;
  actions: string[];
  checkpoint: string;
  example?: string;
  sourceId: string;
  verifiedOn: string;
}

export interface ImagePromptField {
  id: string;
  label: string;
  promptLabel: string;
  description: string;
  placeholder: string;
  example: string;
  required: boolean;
}

export interface ImagePromptExample {
  id: string;
  title: string;
  role: string;
  prompt: string;
  humanChecks: string[];
}

export type UseCaseSensitivity = "standard" | "controlled" | "high";

export interface RoleUseCase {
  id: string;
  role: string;
  function: string;
  title: string;
  task: string;
  recommendedModel: string;
  whyThisModel: string;
  starterPrompt: string;
  inputs: string[];
  humanChecks: string[];
  sensitivity: UseCaseSensitivity;
  outcome: string;
}

export type PromptLevel = "Beginner" | "Intermediate" | "Advanced";

export interface PromptTemplate {
  id: string;
  title: string;
  category: string;
  roles: string[];
  level: PromptLevel;
  purpose: string;
  template: string;
  caution: string;
  tags: string[];
}

export interface SafeDataNext {
  kind: "question" | "outcome";
  id: string;
}

export interface SafeDataOption {
  id: string;
  label: string;
  guidance: string;
  next: SafeDataNext;
}

export interface SafeDataQuestion {
  id: string;
  prompt: string;
  whyItMatters: string;
  options: SafeDataOption[];
}

export interface SafeDataOutcome {
  id: string;
  status: "ready" | "pause" | "stop";
  title: string;
  summary: string;
  actions: string[];
}

export interface StudioQuizOption {
  id: string;
  label: string;
}

export interface StudioQuizQuestion {
  id: string;
  topic: string;
  difficulty: PromptLevel;
  prompt: string;
  options: StudioQuizOption[];
  correctOptionId: string;
  explanation: string;
  remediationSection: StudioSectionId;
  nextOnCorrect?: string;
  nextOnIncorrect?: string;
}

export interface AIUpdate {
  id: string;
  date: string;
  title: string;
  summary: string;
  whyItMatters: string;
  actions: string[];
  availability: string;
  sourceId: string;
  sourceUrl: string;
  verifiedOn: string;
}

export const OFFICIAL_SOURCES: OfficialSource[] = [
  {
    id: "latest-model",
    title: "OpenAI latest model guide",
    url: "https://developers.openai.com/api/docs/guides/latest-model",
    appliesTo: ["GPT-5.6 Sol", "GPT-5.6 Terra", "GPT-5.6 Luna", "model selection"],
    verifiedOn: STUDIO_VERIFIED_ON,
  },
  {
    id: "chatgpt-models",
    title: "GPT-5.6 in ChatGPT",
    url: "https://help.openai.com/en/articles/20001354-gpt-56-in-chatgpt",
    appliesTo: ["GPT-5.5 Instant", "GPT-5.6 Sol", "ChatGPT availability"],
    verifiedOn: STUDIO_VERIFIED_ON,
  },
  {
    id: "creating-gpts",
    title: "Creating and editing GPTs",
    url: "https://help.openai.com/en/articles/8554397-creating-a-gpt",
    appliesTo: ["Custom GPT builder", "instructions", "knowledge", "capabilities"],
    verifiedOn: STUDIO_VERIFIED_ON,
  },
  {
    id: "chatgpt-skills",
    title: "Skills in ChatGPT",
    url: "https://help.openai.com/en/articles/20001066-skills-in-chatgpt/",
    appliesTo: ["ChatGPT Skills", "installation", "sharing", "workspace controls"],
    verifiedOn: STUDIO_VERIFIED_ON,
  },
  {
    id: "skills-academy",
    title: "Using skills",
    url: "https://openai.com/academy/skills/",
    appliesTo: ["repeatable workflows", "SKILL.md", "testing", "role examples"],
    verifiedOn: STUDIO_VERIFIED_ON,
  },
  {
    id: "codex-skills",
    title: "Codex skills",
    url: "https://developers.openai.com/codex/skills",
    appliesTo: ["SKILL.md", "skill structure", "skill invocation"],
    verifiedOn: STUDIO_VERIFIED_ON,
  },
  {
    id: "image-generation",
    title: "OpenAI image generation guide",
    url: "https://developers.openai.com/api/docs/guides/image-generation",
    appliesTo: ["GPT Image 2", "image generation", "image editing"],
    verifiedOn: STUDIO_VERIFIED_ON,
  },
];

export const MODEL_CHOICES: ModelChoice[] = [
  {
    id: "gpt-55-instant",
    name: "GPT-5.5 Instant",
    family: "GPT-5.5",
    surface: ["ChatGPT"],
    summary: "The everyday ChatGPT default for fast drafting, summarization, and routine knowledge work.",
    bestFor: [
      "First drafts and rewrites",
      "Meeting summaries from approved notes",
      "Brainstorming and structured outlines",
      "Routine question answering",
    ],
    avoidWhen: [
      "The task needs deep multi-step reasoning",
      "A high-impact decision needs careful analysis",
      "The output requires authoritative source verification",
    ],
    strengths: ["Fast interaction", "Clear general writing", "Low-friction daily use"],
    tradeoffs: ["May need more guidance on complex work", "Still requires human verification"],
    roleExamples: ["Rewrite a customer email", "Turn meeting notes into actions", "Draft an agenda"],
    availability:
      "Shown as the everyday ChatGPT default in current guidance. Exact access and picker labels depend on plan and workspace settings.",
    sourceId: "chatgpt-models",
    verifiedOn: STUDIO_VERIFIED_ON,
  },
  {
    id: "gpt-56-sol",
    name: "GPT-5.6 Sol",
    family: "GPT-5.6",
    surface: ["ChatGPT on eligible plans", "API"],
    summary: "A deeper-reasoning choice for complex work where analysis quality matters more than fastest response time.",
    bestFor: [
      "Complex trade studies",
      "Proposal strategy analysis",
      "Cross-document synthesis",
      "High-stakes review preparation",
    ],
    avoidWhen: [
      "A simple rewrite is enough",
      "Latency is the primary constraint",
      "The user cannot supply adequate context or review the result",
    ],
    strengths: ["Deeper reasoning", "Strong synthesis", "Handles layered instructions"],
    tradeoffs: ["May take longer", "Access depends on plan or workspace", "Human approval remains required"],
    roleExamples: [
      "Compare solution alternatives against weighted criteria",
      "Stress-test a capture strategy",
      "Prepare legal issues for attorney review",
    ],
    availability:
      "Available for deeper reasoning on eligible plans and surfaces. Workspace administrators can limit access, and labels may change during rollout.",
    sourceId: "latest-model",
    verifiedOn: STUDIO_VERIFIED_ON,
  },
  {
    id: "gpt-56-terra",
    name: "GPT-5.6 Terra",
    family: "GPT-5.6",
    surface: ["API", "Codex", "Work"],
    summary: "A balanced choice for applications and work that need strong intelligence with practical cost control.",
    bestFor: [
      "Repeatable business workflows",
      "Document analysis at moderate scale",
      "Coding and structured transformation",
      "Quality-focused production use",
    ],
    avoidWhen: [
      "The task is available only in the standard ChatGPT model picker",
      "The lightest high-volume option is sufficient",
      "No approved API or enterprise workflow exists",
    ],
    strengths: ["Balanced capability", "Useful for production workflows", "Strong structured output"],
    tradeoffs: ["Not a standard ChatGPT picker option", "Organizational setup and governance are required"],
    roleExamples: [
      "Transform requirements into a review table",
      "Classify proposal comments",
      "Generate unit-test candidates for approved code",
    ],
    availability:
      "Documented for API, Codex, and Work experiences. It is not presented as a standard ChatGPT model choice. Access depends on product and workspace configuration.",
    sourceId: "latest-model",
    verifiedOn: STUDIO_VERIFIED_ON,
  },
  {
    id: "gpt-56-luna",
    name: "GPT-5.6 Luna",
    family: "GPT-5.6",
    surface: ["API", "Codex", "Work"],
    summary: "An efficient choice for well-defined, high-volume tasks where speed and throughput matter.",
    bestFor: [
      "High-volume classification",
      "Consistent field extraction",
      "Routine formatting",
      "Large batches of low-risk transformations",
    ],
    avoidWhen: [
      "The task requires deep judgment",
      "Ambiguous instructions cannot be resolved",
      "A regulated or high-impact conclusion depends on the output",
    ],
    strengths: ["Efficient throughput", "Good for narrow tasks", "Suitable for repeatable patterns"],
    tradeoffs: ["Less suited to deep analysis", "Requires approved API or enterprise access"],
    roleExamples: [
      "Tag a sanitized question log by topic",
      "Normalize an approved glossary",
      "Extract dates and owners from non-sensitive action lists",
    ],
    availability:
      "Documented for API, Codex, and Work experiences. It is not presented as a standard ChatGPT model choice. Confirm access with the workspace owner.",
    sourceId: "latest-model",
    verifiedOn: STUDIO_VERIFIED_ON,
  },
  {
    id: "gpt-image-2",
    name: "GPT Image 2",
    family: "GPT Image",
    surface: ["Image API", "Responses API", "supported OpenAI experiences"],
    summary: "The current image-generation model for creating and editing visuals from text and image inputs.",
    bestFor: [
      "Concept art and visual ideation",
      "Presentation-safe abstract graphics",
      "Iterative image editing",
      "Non-sensitive training illustrations",
    ],
    avoidWhen: [
      "The prompt contains controlled or personal information",
      "The visual could be mistaken for approved technical evidence",
      "Exact engineering geometry or measured accuracy is required",
    ],
    strengths: ["Strong prompt adherence", "Image editing", "Conversational refinement through supported workflows"],
    tradeoffs: ["Generated details can be inaccurate", "Text and brand details need human review"],
    roleExamples: [
      "Create an abstract mission-readiness illustration",
      "Develop three visual directions for a training cover",
      "Remove a generic background from an approved asset",
    ],
    availability:
      "Availability depends on the product, account, plan, workspace controls, and enabled image capabilities.",
    sourceId: "image-generation",
    verifiedOn: STUDIO_VERIFIED_ON,
  },
];

export const GPT_BUILDER_STEPS: BuilderStep[] = [
  {
    id: "gpt-purpose",
    order: 1,
    title: "Define one job and one audience",
    goal: "Give the GPT a narrow, testable purpose instead of a broad promise.",
    actions: [
      "Name the primary user role.",
      "Write the job as an observable outcome.",
      "List two tasks the GPT should refuse or redirect.",
    ],
    checkpoint: "A new user can explain the GPT in one sentence and knows what it does not do.",
    example: "Help proposal reviewers turn approved review notes into a prioritized, traceable action list.",
    sourceId: "creating-gpts",
    verifiedOn: STUDIO_VERIFIED_ON,
  },
  {
    id: "gpt-profile",
    order: 2,
    title: "Create the public profile",
    goal: "Make the name, description, and conversation starters set accurate expectations.",
    actions: [
      "Choose a specific name with no claim of official approval.",
      "Describe the intended input and output.",
      "Add three starters that demonstrate safe use.",
    ],
    checkpoint: "The profile tells users what to provide, what they will receive, and when to stop.",
    example: "Starter: Turn these sanitized review notes into actions with owner, priority, and rationale.",
    sourceId: "creating-gpts",
    verifiedOn: STUDIO_VERIFIED_ON,
  },
  {
    id: "gpt-instructions",
    order: 3,
    title: "Write operational instructions",
    goal: "Specify behavior, sequence, boundaries, and output format in direct language.",
    actions: [
      "State the role and desired outcome.",
      "Use explicit step rules for multi-stage work.",
      "Define required questions, refusal conditions, and review reminders.",
      "Give examples of acceptable and unacceptable output.",
    ],
    checkpoint: "The instructions cover normal use, missing context, risky input, and final verification.",
    example: "If the source classification or release status is unclear, stop and ask the user to use an approved workflow.",
    sourceId: "creating-gpts",
    verifiedOn: STUDIO_VERIFIED_ON,
  },
  {
    id: "gpt-knowledge",
    order: 4,
    title: "Add approved reference knowledge",
    goal: "Use knowledge files for stable reference material, not hidden behavior rules.",
    actions: [
      "Confirm every file is approved for the selected workspace.",
      "Remove stale, duplicate, controlled, or personal content.",
      "Use clear filenames and version dates.",
      "Put behavior rules in instructions and reference content in knowledge.",
    ],
    checkpoint: "A content owner can identify each file, its purpose, its version, and its approval status.",
    example: "Knowledge: an approved writing guide. Instructions: always flag claims that need a source.",
    sourceId: "creating-gpts",
    verifiedOn: STUDIO_VERIFIED_ON,
  },
  {
    id: "gpt-capabilities",
    order: 5,
    title: "Enable only needed capabilities",
    goal: "Minimize access by turning on only the capabilities required for the defined job.",
    actions: [
      "Map each capability to a specific user outcome.",
      "Review workspace policy before enabling web, data, image, or action features.",
      "Do not add external actions without technical, security, privacy, and legal review.",
    ],
    checkpoint: "Every enabled capability has a documented purpose, owner, and review path.",
    example: "Image generation is enabled only for generic training graphics with non-sensitive prompts.",
    sourceId: "creating-gpts",
    verifiedOn: STUDIO_VERIFIED_ON,
  },
  {
    id: "gpt-test",
    order: 6,
    title: "Test, red-team, and revise",
    goal: "Validate useful behavior and boundary behavior before wider sharing.",
    actions: [
      "Test five normal tasks and five edge cases.",
      "Try missing context, conflicting instructions, sensitive data, and unsupported claims.",
      "Record expected versus actual results.",
      "Use version history and retest after material changes.",
    ],
    checkpoint: "The GPT passes an owner-approved test set and clearly fails safe on risky cases.",
    example: "Red-team case: ask for a legal conclusion from incomplete contract text. Expected: issue spotting plus attorney review reminder.",
    sourceId: "creating-gpts",
    verifiedOn: STUDIO_VERIFIED_ON,
  },
  {
    id: "gpt-govern",
    order: 7,
    title: "Publish with ownership",
    goal: "Set sharing, review, update, and retirement expectations.",
    actions: [
      "Choose the narrowest approved sharing scope.",
      "Name a business owner and a technical owner.",
      "Schedule content and behavior reviews.",
      "Provide a feedback channel and retirement rule.",
    ],
    checkpoint: "Users know who owns the GPT, what version they are using, and how to report a concern.",
    example: "Review quarterly and whenever policy, source files, capabilities, or model behavior changes.",
    sourceId: "creating-gpts",
    verifiedOn: STUDIO_VERIFIED_ON,
  },
];

export const SKILL_BUILDER_STEPS: BuilderStep[] = [
  {
    id: "skill-trigger",
    order: 1,
    title: "Define the repeatable trigger",
    goal: "Describe the task that should cause Codex to select the skill.",
    actions: [
      "Choose one repeatable workflow.",
      "List phrases users are likely to say.",
      "Define what is outside the skill scope.",
    ],
    checkpoint: "The skill description is specific enough to match the intended task without matching unrelated work.",
    example: "Use when a user asks to create or update an approved proposal compliance matrix from provided requirements.",
    sourceId: "codex-skills",
    verifiedOn: STUDIO_VERIFIED_ON,
  },
  {
    id: "skill-folder",
    order: 2,
    title: "Create the skill directory",
    goal: "Use a clean folder with a required SKILL.md file and only the support material the workflow needs.",
    actions: [
      "Create a descriptive, lowercase directory name.",
      "Add SKILL.md as the entry point.",
      "Add scripts, references, assets, or agent configuration only when they improve reliability.",
    ],
    checkpoint: "The folder is portable, understandable, and free of secrets or restricted content.",
    example: "proposal-compliance/SKILL.md with references/compliance-rules.md and scripts/validate-table.js.",
    sourceId: "codex-skills",
    verifiedOn: STUDIO_VERIFIED_ON,
  },
  {
    id: "skill-frontmatter",
    order: 3,
    title: "Write discoverable frontmatter",
    goal: "Provide a clear name and description so Codex can choose the skill correctly.",
    actions: [
      "Use the documented frontmatter fields.",
      "Write the description around user intent and expected outcome.",
      "Avoid vague claims such as handles everything.",
    ],
    checkpoint: "A reviewer can distinguish this skill from nearby workflows by reading the frontmatter.",
    example: "description: Build and validate proposal compliance matrices from user-provided, approved requirements.",
    sourceId: "codex-skills",
    verifiedOn: STUDIO_VERIFIED_ON,
  },
  {
    id: "skill-workflow",
    order: 4,
    title: "Write an executable workflow",
    goal: "Turn expert practice into ordered instructions with decisions, checks, and exit conditions.",
    actions: [
      "State prerequisites and input requirements.",
      "Write the steps in execution order.",
      "Route optional references by task type.",
      "Define verification and completion criteria.",
    ],
    checkpoint: "Another operator can follow the workflow without guessing the next step.",
    example: "Extract requirements, preserve source identifiers, flag ambiguity, validate coverage, then render a review-ready table.",
    sourceId: "codex-skills",
    verifiedOn: STUDIO_VERIFIED_ON,
  },
  {
    id: "skill-assets",
    order: 5,
    title: "Add reusable support material",
    goal: "Move detailed references, deterministic scripts, and reusable assets out of the core instructions.",
    actions: [
      "Use references for domain rules and examples.",
      "Use scripts for repeatable checks or mechanical transformations.",
      "Use assets for templates and approved starting files.",
      "Document when each support item should be loaded or run.",
    ],
    checkpoint: "Each support item has a clear purpose and the skill remains concise enough to navigate.",
    example: "A validation script checks for missing requirement IDs and duplicate response owners.",
    sourceId: "codex-skills",
    verifiedOn: STUDIO_VERIFIED_ON,
  },
  {
    id: "skill-safety",
    order: 6,
    title: "Set safety and authority boundaries",
    goal: "Keep the skill within approved data, tools, systems, and user authority.",
    actions: [
      "State prohibited inputs and actions.",
      "Require confirmation before external or irreversible changes.",
      "Keep credentials and secrets out of the skill package.",
      "Define escalation when classification or authorization is unclear.",
    ],
    checkpoint: "The skill stops safely when input, authority, or external impact is uncertain.",
    example: "Do not upload, transmit, or transform controlled information outside an approved environment.",
    sourceId: "codex-skills",
    verifiedOn: STUDIO_VERIFIED_ON,
  },
  {
    id: "skill-evaluate",
    order: 7,
    title: "Evaluate with representative tasks",
    goal: "Prove that selection, execution, and verification work across normal and edge cases.",
    actions: [
      "Create a small test set with expected outcomes.",
      "Test explicit invocation and natural-language invocation.",
      "Check failure paths, missing files, and ambiguous requests.",
      "Revise the description or steps based on observed errors.",
    ],
    checkpoint: "The skill is selected at the right time, produces the expected artifact, and reports limitations clearly.",
    example: "Test one clean input, one incomplete input, one conflicting input, and one request outside scope.",
    sourceId: "codex-skills",
    verifiedOn: STUDIO_VERIFIED_ON,
  },
];

export const IMAGE_PROMPT_FIELDS: ImagePromptField[] = [
  {
    id: "purpose",
    label: "Purpose",
    promptLabel: "Create an image for",
    description: "State where the image will be used and what it must communicate.",
    placeholder: "training cover, internal concept brief, presentation divider",
    example: "an internal training cover about responsible AI use",
    required: true,
  },
  {
    id: "subject",
    label: "Subject",
    promptLabel: "Primary subject",
    description: "Name the focal object, people, environment, or abstract concept.",
    placeholder: "a cross-functional team reviewing a digital mission map",
    example: "a diverse technical team collaborating around an abstract systems diagram",
    required: true,
  },
  {
    id: "action",
    label: "Action",
    promptLabel: "Action or moment",
    description: "Describe what is happening and the intended emotional signal.",
    placeholder: "working together with calm focus and shared purpose",
    example: "comparing options with focused, constructive energy",
    required: false,
  },
  {
    id: "setting",
    label: "Setting",
    promptLabel: "Environment",
    description: "Set the scene without adding sensitive facilities, equipment, or locations.",
    placeholder: "generic modern operations room with abstract displays",
    example: "a clean, generic collaboration space with non-readable interface elements",
    required: true,
  },
  {
    id: "style",
    label: "Style",
    promptLabel: "Visual style",
    description: "Choose a visual language that fits the audience and avoids copying a living artist.",
    placeholder: "editorial illustration, polished 3D, documentary photography",
    example: "modern editorial illustration with crisp geometric forms",
    required: true,
  },
  {
    id: "composition",
    label: "Composition",
    promptLabel: "Framing and layout",
    description: "Specify orientation, camera angle, focus, and negative space for text.",
    placeholder: "16:9 landscape, subject on right, clear space on left",
    example: "16:9 landscape, wide view, focal group on the right, generous empty space on the left",
    required: true,
  },
  {
    id: "light-color",
    label: "Light and color",
    promptLabel: "Lighting and palette",
    description: "Describe lighting, contrast, and palette in accessible terms.",
    placeholder: "soft directional light, deep violet and electric blue accents",
    example: "soft directional light, deep violet, cool blue, and warm neutral accents",
    required: false,
  },
  {
    id: "text",
    label: "Text",
    promptLabel: "Exact visible text",
    description: "Include only short, exact wording when visible text is required, then verify it manually.",
    placeholder: "No text, or exact short phrase in quotation marks",
    example: "no visible words, labels, logos, badges, or watermarks",
    required: false,
  },
  {
    id: "constraints",
    label: "Constraints",
    promptLabel: "Must include and avoid",
    description: "State safety, accuracy, branding, and exclusion requirements.",
    placeholder: "no logos, no readable data, no real facilities, no weapons detail",
    example: "generic technology only, no logos, no uniforms, no readable information, no real program identifiers",
    required: true,
  },
];

export const IMAGE_PROMPT_EXAMPLES: ImagePromptExample[] = [
  {
    id: "image-responsible-ai",
    title: "Responsible AI training cover",
    role: "Learning and Development",
    prompt:
      "Create a 16:9 landscape editorial illustration for an internal responsible AI training cover. Show a diverse cross-functional team comparing options around an abstract glowing decision map in a generic collaboration space. Place the group on the right with generous negative space on the left. Use crisp geometric forms, deep violet, cool blue, and warm neutral accents with soft directional light. No visible words, logos, uniforms, readable data, real facilities, or program identifiers.",
    humanChecks: ["No sensitive visual details", "No unintended logos or readable text", "Inclusive and professional representation"],
  },
  {
    id: "image-systems-concept",
    title: "Systems integration concept",
    role: "Solutions and Engineering",
    prompt:
      "Create a polished abstract 3D illustration for a solutions workshop. Show several generic modular systems connecting into one resilient network, with clear visual hierarchy and no depiction of real equipment. Use an isometric wide composition, dark neutral background, blue connection lines, and restrained violet highlights. No labels, logos, maps, mission data, weapon details, or identifiable platforms.",
    humanChecks: ["Concept is clearly abstract", "No real system configuration is implied", "Connections do not claim technical accuracy"],
  },
  {
    id: "image-proposal-divider",
    title: "Proposal teamwork divider",
    role: "Business Development and Proposals",
    prompt:
      "Create a refined 16:9 photographic-style scene for a presentation divider. Show a generic team arranging colored cards into a clear story flow on a clean table, viewed from a slightly elevated angle. Leave negative space across the upper third. Use natural light, confident but calm expressions, and a navy, violet, and cyan palette. No visible document text, customer names, logos, badges, or identifiable office locations.",
    humanChecks: ["Documents contain no readable content", "Scene does not imply a real customer", "Composition leaves usable title space"],
  },
  {
    id: "image-cyber-awareness",
    title: "Cyber awareness visual",
    role: "Cybersecurity",
    prompt:
      "Create a modern vector illustration for a cyber awareness lesson. Show a user pausing before moving an abstract data block from one approved zone to another, with a clear visual checkpoint between the zones. Use simple geometric icons, accessible contrast, navy background, cyan signals, and violet accents. No real interface, exploit details, credentials, code, logos, or readable data.",
    humanChecks: ["No actionable attack detail", "Meaning is understandable without text", "Color contrast remains clear"],
  },
];

export const ROLE_USE_CASES: RoleUseCase[] = [
  {
    id: "role-business-development",
    role: "Business Development Lead",
    function: "Business Development",
    title: "Opportunity signal brief",
    task: "Turn approved public and internal notes into a concise opportunity signal brief with assumptions separated from facts.",
    recommendedModel: "GPT-5.5 Instant for the first draft, GPT-5.6 Sol for complex synthesis",
    whyThisModel: "The task starts as structured summarization, then may need deeper synthesis across competing signals.",
    starterPrompt:
      "Using only the approved notes below, create an opportunity signal brief with sections for confirmed facts, stakeholder needs, possible fit, unknowns, and next questions. Do not invent customer priorities. Cite each fact to the note label. Notes: [PASTE SANITIZED NOTES]",
    inputs: ["Approved notes", "Known customer needs", "Source labels", "Decision deadline"],
    humanChecks: ["Every claim maps to a source", "Assumptions are labeled", "No non-public customer data is exposed"],
    sensitivity: "controlled",
    outcome: "A traceable brief for human review and capture discussion.",
  },
  {
    id: "role-capture",
    role: "Capture Manager",
    function: "Capture",
    title: "Capture strategy stress test",
    task: "Challenge a draft capture strategy against customer value, competition, evidence, and execution risk.",
    recommendedModel: "GPT-5.6 Sol",
    whyThisModel: "The exercise requires multi-factor reasoning, adversarial questions, and explicit uncertainty.",
    starterPrompt:
      "Act as a capture strategy reviewer. Using the sanitized strategy below, identify the five strongest assumptions, evidence that would support or weaken each one, likely competitor countermoves, and the next validation action. Do not claim knowledge beyond the provided material. Strategy: [PASTE APPROVED SUMMARY]",
    inputs: ["Sanitized strategy", "Approved competitor themes", "Decision criteria", "Known gaps"],
    humanChecks: ["No invented intelligence", "Recommendations align with approved capture process", "Owners validate customer assumptions"],
    sensitivity: "high",
    outcome: "A prioritized strategy validation agenda, not an autonomous bid decision.",
  },
  {
    id: "role-proposals",
    role: "Proposal Manager",
    function: "Proposals",
    title: "Review comment action plan",
    task: "Convert approved proposal review comments into a structured, traceable action plan.",
    recommendedModel: "GPT-5.6 Terra",
    whyThisModel: "The workflow benefits from consistent classification, structured outputs, and careful handling of dependencies.",
    starterPrompt:
      "Transform the sanitized review comments into a table with comment ID, issue category, requested change, response owner, dependency, priority, and verification check. Preserve the original IDs and wording in a source column. Flag ambiguous comments instead of resolving them. Comments: [PASTE APPROVED COMMENTS]",
    inputs: ["Sanitized review comments", "Owner list", "Review criteria", "Due dates"],
    humanChecks: ["All source comments are represented", "Priority is reviewer-approved", "No proposal content is sent to an unapproved tool"],
    sensitivity: "high",
    outcome: "A review-ready action tracker that preserves source traceability.",
  },
  {
    id: "role-solutions",
    role: "Solutions Architect",
    function: "Solutions",
    title: "Alternative trade study scaffold",
    task: "Build a neutral comparison structure for solution alternatives using approved evaluation criteria.",
    recommendedModel: "GPT-5.6 Sol",
    whyThisModel: "Weighted tradeoffs, uncertainty, and constraint interactions call for deeper reasoning.",
    starterPrompt:
      "Create a trade study scaffold for the three sanitized solution alternatives below. Use only the provided criteria and weights. For each score, show the supporting input, uncertainty, and missing evidence. Do not recommend a winner. Alternatives: [PASTE] Criteria and weights: [PASTE]",
    inputs: ["Sanitized alternatives", "Approved criteria", "Weights", "Constraints"],
    humanChecks: ["Engineers validate each score", "No architecture detail exceeds tool approval", "The decision authority makes the final selection"],
    sensitivity: "high",
    outcome: "A transparent comparison scaffold with evidence gaps visible.",
  },
  {
    id: "role-contracts",
    role: "Contracts Manager",
    function: "Contracts",
    title: "Clause change comparison",
    task: "Compare two approved clause versions and surface wording changes, obligations, dates, and review questions.",
    recommendedModel: "GPT-5.6 Sol",
    whyThisModel: "Detailed cross-text comparison benefits from careful reasoning, but does not replace contracts judgment.",
    starterPrompt:
      "Compare the two approved clause versions below. Produce: exact change summary, possible obligation changes, affected dates or notices, ambiguous terms, and questions for a contracts professional. Do not provide a final interpretation or recommendation. Version A: [PASTE] Version B: [PASTE]",
    inputs: ["Approved clause text", "Document version labels", "Known context"],
    humanChecks: ["Contracts staff verify every difference", "No legal conclusion is treated as final", "Source text was approved for the tool"],
    sensitivity: "high",
    outcome: "A comparison aid that accelerates professional review.",
  },
  {
    id: "role-legal",
    role: "Legal Counsel",
    function: "Legal",
    title: "Issue-spotting intake summary",
    task: "Organize approved facts and documents into an issue-spotting brief for attorney analysis.",
    recommendedModel: "GPT-5.6 Sol",
    whyThisModel: "Complex fact patterns need structured reasoning while final legal analysis remains with counsel.",
    starterPrompt:
      "Organize the approved facts below into a legal intake summary with chronology, parties, stated obligations, disputed facts, potential issue categories, missing information, and preservation questions. Label uncertainty. Do not give legal advice or reach a conclusion. Facts: [PASTE APPROVED SUMMARY]",
    inputs: ["Approved fact summary", "Chronology", "Document list", "Known questions"],
    humanChecks: ["Counsel controls privilege and tool choice", "Facts are verified", "No legal advice is delegated to the model"],
    sensitivity: "high",
    outcome: "A structured intake brief for licensed counsel.",
  },
  {
    id: "role-human-resources",
    role: "Human Resources Partner",
    function: "Human Resources",
    title: "Competency-based interview guide",
    task: "Draft role-relevant interview questions and scoring anchors from an approved job profile.",
    recommendedModel: "GPT-5.5 Instant",
    whyThisModel: "This is a well-defined drafting task when protected data and candidate decisions stay out of the prompt.",
    starterPrompt:
      "Using the approved job competencies below, draft eight behavior-based interview questions with neutral follow-ups and observable scoring anchors from 1 to 5. Avoid demographic assumptions and do not infer candidate traits. Competencies: [PASTE]",
    inputs: ["Approved job competencies", "Interview length", "Scoring scale"],
    humanChecks: ["HR reviews fairness and legality", "No candidate personal data is entered", "Humans make all employment decisions"],
    sensitivity: "high",
    outcome: "A consistent draft guide for HR-approved use.",
  },
  {
    id: "role-finance",
    role: "Financial Analyst",
    function: "Finance",
    title: "Forecast variance narrative",
    task: "Turn approved aggregate variances into a concise narrative with drivers, uncertainty, and follow-up questions.",
    recommendedModel: "GPT-5.5 Instant",
    whyThisModel: "Routine structured writing is sufficient when calculations are completed and verified separately.",
    starterPrompt:
      "Draft a forecast variance narrative from the approved aggregate table below. Separate volume, rate, timing, and one-time drivers. State uncertainty and list follow-up questions. Do not calculate missing values or invent causes. Table: [PASTE SANITIZED AGGREGATES]",
    inputs: ["Approved aggregate variance table", "Reporting period", "Known drivers"],
    humanChecks: ["Finance verifies all numbers", "No protected financial details are exposed", "Narrative does not claim unsupported causes"],
    sensitivity: "controlled",
    outcome: "A concise draft narrative tied to verified figures.",
  },
  {
    id: "role-systems-engineering",
    role: "Systems Engineer",
    function: "Engineering",
    title: "Requirement decomposition review",
    task: "Break an approved, sanitized requirement into candidate child requirements and verification questions.",
    recommendedModel: "GPT-5.6 Terra",
    whyThisModel: "Structured decomposition and traceability fit a balanced reasoning model, with engineers retaining approval.",
    starterPrompt:
      "Analyze the sanitized parent requirement below. Draft candidate child requirements using shall statements, map each to the parent phrase, propose a verification method, and flag ambiguity or untestable language. Do not add unstated performance values. Requirement: [PASTE]",
    inputs: ["Sanitized requirement", "Approved glossary", "Verification categories"],
    humanChecks: ["Engineers approve all requirements", "Traceability is complete", "Technical details are permitted in the selected tool"],
    sensitivity: "high",
    outcome: "A candidate decomposition set for engineering review.",
  },
  {
    id: "role-software-engineering",
    role: "Software Engineer",
    function: "Engineering",
    title: "Test-case candidate generator",
    task: "Generate test candidates from approved acceptance criteria without exposing restricted code or architecture.",
    recommendedModel: "GPT-5.6 Terra in Codex",
    whyThisModel: "Coding and structured test generation benefit from a balanced production model and repository context.",
    starterPrompt:
      "From the approved acceptance criteria below, draft positive, negative, boundary, and failure-recovery test cases. For each case include preconditions, steps, expected result, and traceability ID. Flag untestable criteria. Do not assume implementation details. Criteria: [PASTE]",
    inputs: ["Approved acceptance criteria", "Traceability IDs", "Test constraints"],
    humanChecks: ["Tests run only in approved environments", "Engineers review coverage", "No credentials or restricted code enter the prompt"],
    sensitivity: "controlled",
    outcome: "A traceable candidate test set for engineering validation.",
  },
  {
    id: "role-cybersecurity",
    role: "Cybersecurity Analyst",
    function: "Cybersecurity",
    title: "Tabletop scenario facilitator",
    task: "Create a non-operational tabletop exercise from approved objectives and generic conditions.",
    recommendedModel: "GPT-5.6 Sol",
    whyThisModel: "A good tabletop needs branching reasoning without producing actionable attack instructions.",
    starterPrompt:
      "Create a defensive cyber tabletop exercise using the approved learning objectives below. Include a generic scenario, five staged injects, facilitator questions, expected defensive decisions, and a debrief rubric. Do not include exploit steps, real vulnerabilities, credentials, or system details. Objectives: [PASTE]",
    inputs: ["Approved objectives", "Participant roles", "Duration", "Defensive policies"],
    humanChecks: ["Security reviews all injects", "No operational attack detail appears", "Scenario remains generic"],
    sensitivity: "high",
    outcome: "A facilitator-ready draft focused on defensive decision quality.",
  },
  {
    id: "role-program-management",
    role: "Program Manager",
    function: "Program Management",
    title: "Executive status narrative",
    task: "Turn approved status inputs into a decision-focused summary with risks, actions, and asks.",
    recommendedModel: "GPT-5.5 Instant",
    whyThisModel: "The work is structured communication based on already verified program inputs.",
    starterPrompt:
      "Using only the approved status inputs below, draft a one-page executive update with accomplishments, schedule and cost signals, top risks, decisions needed, and next-period focus. Preserve dates and owners. Label missing data. Inputs: [PASTE SANITIZED STATUS]",
    inputs: ["Approved status summary", "Milestones", "Risk labels", "Decision requests"],
    humanChecks: ["Program controls verifies all facts", "Leaders approve risk language", "No controlled program data is sent outside approved systems"],
    sensitivity: "controlled",
    outcome: "A clear executive draft that emphasizes decisions and ownership.",
  },
  {
    id: "role-security-compliance",
    role: "Security and Compliance Specialist",
    function: "Security",
    title: "Policy-to-checklist conversion",
    task: "Convert approved policy excerpts into a plain-language pre-use checklist without weakening requirements.",
    recommendedModel: "GPT-5.6 Terra",
    whyThisModel: "Consistent transformation and traceability matter more than creative generation.",
    starterPrompt:
      "Convert the approved policy excerpts below into a pre-use checklist. Preserve each source reference, distinguish required from recommended actions, and flag ambiguous language for the policy owner. Do not reinterpret or relax a requirement. Excerpts: [PASTE]",
    inputs: ["Approved policy excerpts", "Source identifiers", "Target user role"],
    humanChecks: ["Policy owner verifies every checklist item", "Original policy remains authoritative", "No classification guidance is invented"],
    sensitivity: "high",
    outcome: "A traceable usability aid that points back to authoritative policy.",
  },
  {
    id: "role-supply-chain",
    role: "Supply Chain Manager",
    function: "Supply Chain and Procurement",
    title: "Vendor comparison question set",
    task: "Generate neutral diligence questions from approved evaluation criteria and sanitized vendor claims.",
    recommendedModel: "GPT-5.6 Terra",
    whyThisModel: "The task needs consistent criteria mapping and gap detection across multiple inputs.",
    starterPrompt:
      "Using the approved criteria and sanitized vendor claims below, create a neutral diligence question set. Map each question to a criterion, state the evidence requested, and flag unsupported claims. Do not rank vendors or infer responsibility. Criteria: [PASTE] Claims: [PASTE]",
    inputs: ["Approved criteria", "Sanitized claims", "Required evidence types"],
    humanChecks: ["Procurement validates fairness", "Source-selection information stays in approved systems", "No autonomous vendor ranking"],
    sensitivity: "high",
    outcome: "A consistent diligence agenda for the evaluation team.",
  },
  {
    id: "role-quality",
    role: "Quality Assurance Lead",
    function: "Quality",
    title: "Corrective-action draft structure",
    task: "Organize approved issue data into a root-cause and corrective-action review structure.",
    recommendedModel: "GPT-5.6 Sol",
    whyThisModel: "Root-cause work benefits from deeper reasoning, counter-hypotheses, and evidence checks.",
    starterPrompt:
      "Using only the approved issue facts below, create a corrective-action review structure with problem statement, evidence, candidate causes, disconfirming evidence, containment, proposed corrective actions, owners, and effectiveness measures. Do not select a root cause without evidence. Facts: [PASTE]",
    inputs: ["Approved issue facts", "Evidence list", "Process steps", "Known containment"],
    humanChecks: ["Quality board validates cause", "Actions have measurable effectiveness checks", "No supplier-sensitive data is exposed"],
    sensitivity: "controlled",
    outcome: "An evidence-centered draft for the corrective-action board.",
  },
  {
    id: "role-data-analytics",
    role: "Data Analyst",
    function: "Data and Analytics",
    title: "Metric definition review",
    task: "Turn approved business questions into candidate metric definitions, assumptions, and validation tests.",
    recommendedModel: "GPT-5.6 Terra",
    whyThisModel: "The task benefits from structured reasoning and consistent definition templates.",
    starterPrompt:
      "For each approved business question below, draft a candidate metric definition with numerator, denominator, grain, filters, time window, data owner, assumptions, edge cases, and validation tests. Do not fabricate field names or source systems. Questions: [PASTE]",
    inputs: ["Approved business questions", "Sanitized data dictionary", "Reporting cadence"],
    humanChecks: ["Data owners approve definitions", "Analysts verify calculations", "No row-level protected data is entered"],
    sensitivity: "controlled",
    outcome: "A candidate metric catalog with validation work clearly identified.",
  },
];

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: "template-opportunity-brief",
    title: "Opportunity signal brief",
    category: "Strategy",
    roles: ["Business Development", "Capture"],
    level: "Beginner",
    purpose: "Separate known facts, assumptions, gaps, and next questions.",
    template:
      "Using only [APPROVED SOURCES], create an opportunity brief for [AUDIENCE]. Include confirmed facts with source labels, stated needs, possible fit, assumptions, unknowns, and the five next questions. Do not infer unstated priorities. Use [OUTPUT FORMAT].",
    caution: "Use only sources approved for the selected tool and validate customer claims.",
    tags: ["opportunity", "business development", "facts", "questions"],
  },
  {
    id: "template-win-theme-test",
    title: "Win-theme evidence test",
    category: "Strategy",
    roles: ["Capture", "Proposals", "Solutions"],
    level: "Intermediate",
    purpose: "Test whether a proposed win theme is specific, relevant, and supported.",
    template:
      "Evaluate each proposed win theme against [CUSTOMER PRIORITIES], [EVIDENCE], and [COMPETITIVE ALTERNATIVES]. For each, identify the claim, benefit, proof, likely objection, evidence gap, and a safer rewrite. Do not invent discriminators or customer views.",
    caution: "Treat competitive and customer information as controlled business data.",
    tags: ["capture", "win themes", "evidence", "proposal"],
  },
  {
    id: "template-compliance-matrix",
    title: "Compliance matrix starter",
    category: "Proposals",
    roles: ["Proposals", "Contracts", "Solutions"],
    level: "Intermediate",
    purpose: "Map requirements to response locations, owners, evidence, and open questions.",
    template:
      "From [APPROVED REQUIREMENTS], create a compliance matrix with source ID, exact requirement, response instruction, proposed section, owner, evidence needed, dependency, and ambiguity flag. Preserve source wording. Do not resolve unclear requirements.",
    caution: "A qualified reviewer must confirm completeness and interpretation.",
    tags: ["compliance", "requirements", "matrix", "traceability"],
  },
  {
    id: "template-review-actions",
    title: "Review comments to actions",
    category: "Proposals",
    roles: ["Proposals", "Program Management", "Quality"],
    level: "Beginner",
    purpose: "Turn comments into trackable actions while preserving the source.",
    template:
      "Convert [APPROVED REVIEW COMMENTS] into a table with comment ID, source text, issue category, requested change, owner, priority, dependency, due date, and verification check. Flag ambiguity and duplicates. Do not silently combine distinct comments.",
    caution: "Review owners must approve priorities and closure evidence.",
    tags: ["review", "actions", "tracker", "comments"],
  },
  {
    id: "template-solution-traceability",
    title: "Solution traceability review",
    category: "Solutions",
    roles: ["Solutions", "Systems Engineering", "Software Engineering"],
    level: "Advanced",
    purpose: "Check that each solution element supports a stated need and verification path.",
    template:
      "Using [SANITIZED NEEDS], [SOLUTION ELEMENTS], and [CONSTRAINTS], build a traceability table from need to element, rationale, evidence, interface, risk, and verification method. Mark missing links and unsupported claims. Do not add technical values.",
    caution: "Keep controlled technical data in approved environments only.",
    tags: ["solution", "traceability", "verification", "engineering"],
  },
  {
    id: "template-trade-study",
    title: "Neutral trade-study scaffold",
    category: "Analysis",
    roles: ["Solutions", "Systems Engineering", "Program Management"],
    level: "Advanced",
    purpose: "Compare alternatives transparently without delegating the decision.",
    template:
      "Compare [ALTERNATIVES] using only [APPROVED CRITERIA AND WEIGHTS]. For each score, show the supporting input, uncertainty, sensitivity to weight changes, missing evidence, and key risk. Do not choose a winner. End with decision questions for [AUTHORITY].",
    caution: "Decision authorities own weights, scores, and final selection.",
    tags: ["trade study", "alternatives", "decision", "risk"],
  },
  {
    id: "template-clause-compare",
    title: "Contract clause comparison",
    category: "Contracts and Legal",
    roles: ["Contracts", "Legal"],
    level: "Advanced",
    purpose: "Surface text changes and review questions without issuing a final interpretation.",
    template:
      "Compare [VERSION A] and [VERSION B]. Provide exact wording changes, possible obligation effects, affected dates or notices, defined-term changes, ambiguity, and questions for [CONTRACTS OR LEGAL REVIEWER]. Cite the source paragraph for every point.",
    caution: "This is a review aid, not legal advice or a final contract interpretation.",
    tags: ["contracts", "legal", "clauses", "comparison"],
  },
  {
    id: "template-legal-intake",
    title: "Legal issue-spotting intake",
    category: "Contracts and Legal",
    roles: ["Legal", "Contracts", "Human Resources"],
    level: "Advanced",
    purpose: "Organize approved facts for counsel while preserving uncertainty.",
    template:
      "Organize [APPROVED FACTS] into chronology, parties, stated obligations, disputed facts, possible issue categories, missing information, evidence sources, and preservation questions. Distinguish fact from allegation. Do not provide legal advice or conclusions.",
    caution: "Counsel must control privileged work, data handling, and final analysis.",
    tags: ["legal", "intake", "chronology", "issues"],
  },
  {
    id: "template-interview-guide",
    title: "Competency interview guide",
    category: "People",
    roles: ["Human Resources", "Hiring Manager"],
    level: "Intermediate",
    purpose: "Create consistent behavior-based questions and observable scoring anchors.",
    template:
      "From [APPROVED COMPETENCIES], draft [NUMBER] behavior-based questions, neutral follow-ups, and observable scoring anchors from [SCALE]. Avoid demographic assumptions, personality inference, and protected information. Include an interviewer calibration note.",
    caution: "HR must review fairness, legality, accessibility, and decision use.",
    tags: ["HR", "interview", "competency", "fairness"],
  },
  {
    id: "template-variance-narrative",
    title: "Forecast variance narrative",
    category: "Finance",
    roles: ["Finance", "Program Management"],
    level: "Beginner",
    purpose: "Explain verified aggregate changes without inventing causes.",
    template:
      "Using [VERIFIED AGGREGATE TABLE], draft a variance narrative for [PERIOD AND AUDIENCE]. Separate volume, rate, timing, and one-time drivers. State uncertainty, label unsupported causes, and list follow-up questions. Do not calculate missing values.",
    caution: "Finance must verify calculations, drivers, and disclosure level.",
    tags: ["finance", "forecast", "variance", "narrative"],
  },
  {
    id: "template-requirement-decompose",
    title: "Requirement decomposition",
    category: "Engineering",
    roles: ["Systems Engineering", "Solutions"],
    level: "Advanced",
    purpose: "Draft traceable child requirements and verification questions.",
    template:
      "Analyze [SANITIZED PARENT REQUIREMENT]. Draft candidate child requirements, map each to the parent phrase, identify interfaces and assumptions, propose a verification method, and flag ambiguity or untestable language. Do not add unstated values.",
    caution: "Qualified engineers approve requirements and verify technical handling rules.",
    tags: ["requirements", "engineering", "decomposition", "verification"],
  },
  {
    id: "template-test-cases",
    title: "Acceptance criteria to test cases",
    category: "Engineering",
    roles: ["Software Engineering", "Quality", "Systems Engineering"],
    level: "Intermediate",
    purpose: "Draft traceable positive, negative, boundary, and recovery tests.",
    template:
      "From [APPROVED ACCEPTANCE CRITERIA], draft test cases with traceability ID, preconditions, steps, expected result, test data needs, and pass criteria. Include positive, negative, boundary, and recovery cases. Flag untestable criteria and do not assume implementation details.",
    caution: "Run tests only in approved environments and keep secrets out of prompts.",
    tags: ["testing", "acceptance criteria", "software", "quality"],
  },
  {
    id: "template-cyber-tabletop",
    title: "Defensive cyber tabletop",
    category: "Cybersecurity",
    roles: ["Cybersecurity", "Security", "Program Management"],
    level: "Advanced",
    purpose: "Build a safe, generic exercise around defensive decisions.",
    template:
      "Create a defensive tabletop from [APPROVED OBJECTIVES]. Include a generic scenario, staged injects, decision points, facilitator questions, expected defensive actions, and a debrief rubric. Exclude exploit steps, real vulnerabilities, credentials, and identifiable systems.",
    caution: "Security reviewers must remove actionable attack detail and approve the scenario.",
    tags: ["cyber", "tabletop", "defensive", "exercise"],
  },
  {
    id: "template-executive-status",
    title: "Executive program update",
    category: "Program Management",
    roles: ["Program Management", "Finance", "Engineering"],
    level: "Beginner",
    purpose: "Create a decision-focused status narrative from verified inputs.",
    template:
      "Using only [APPROVED STATUS INPUTS], draft a [LENGTH] executive update with accomplishments, cost and schedule signals, top risks, decisions needed, owners, and next-period focus. Preserve dates and label missing or uncertain data.",
    caution: "Program controls and accountable owners verify every fact and forecast.",
    tags: ["program", "status", "executive", "decisions"],
  },
  {
    id: "template-policy-checklist",
    title: "Policy to user checklist",
    category: "Governance",
    roles: ["Security", "Legal", "Contracts", "Quality"],
    level: "Intermediate",
    purpose: "Make approved policy easier to follow without changing meaning.",
    template:
      "Convert [APPROVED POLICY EXCERPTS] into a checklist for [USER ROLE AND MOMENT]. Preserve source references, distinguish required from recommended actions, explain defined terms using the source, and flag ambiguity for the policy owner. Do not relax requirements.",
    caution: "The original policy remains authoritative and must be linked or cited.",
    tags: ["policy", "checklist", "governance", "security"],
  },
  {
    id: "template-vendor-diligence",
    title: "Vendor diligence questions",
    category: "Supply Chain",
    roles: ["Supply Chain", "Contracts", "Cybersecurity", "Quality"],
    level: "Intermediate",
    purpose: "Map neutral evidence requests to approved evaluation criteria.",
    template:
      "Using [APPROVED CRITERIA] and [SANITIZED CLAIMS], draft neutral diligence questions. Map each question to a criterion, identify evidence requested, and flag unsupported or ambiguous claims. Do not rank vendors or infer responsibility.",
    caution: "Follow procurement integrity and source-selection handling rules.",
    tags: ["supply chain", "vendor", "diligence", "evidence"],
  },
  {
    id: "template-corrective-action",
    title: "Corrective-action review",
    category: "Quality",
    roles: ["Quality", "Engineering", "Supply Chain"],
    level: "Advanced",
    purpose: "Structure evidence, candidate causes, actions, and effectiveness measures.",
    template:
      "Using only [APPROVED ISSUE FACTS], create a review with problem statement, evidence, candidate causes, disconfirming evidence, containment, proposed corrective actions, owners, due dates, and effectiveness measures. Do not select a root cause without evidence.",
    caution: "The accountable quality authority validates cause and closure.",
    tags: ["quality", "root cause", "corrective action", "evidence"],
  },
  {
    id: "template-metric-definition",
    title: "Metric definition card",
    category: "Data",
    roles: ["Data and Analytics", "Finance", "Program Management"],
    level: "Intermediate",
    purpose: "Define a metric precisely enough to calculate and validate it.",
    template:
      "For [BUSINESS QUESTION], draft a metric card with name, decision supported, numerator, denominator, grain, filters, time window, data owner, source placeholders, assumptions, edge cases, and validation tests. Do not invent field names or systems.",
    caution: "Data owners approve definitions and analysts verify implementation.",
    tags: ["data", "metrics", "definition", "validation"],
  },
  {
    id: "template-meeting-actions",
    title: "Meeting notes to decisions and actions",
    category: "Productivity",
    roles: ["All Roles"],
    level: "Beginner",
    purpose: "Separate decisions, actions, open questions, and context from approved notes.",
    template:
      "Using [APPROVED MEETING NOTES], produce decisions with rationale, actions with owner and due date, open questions, risks raised, and items needing confirmation. Quote or cite the note label for each item. Do not assign an owner or date that is not stated.",
    caution: "Participants confirm the record before it becomes authoritative.",
    tags: ["meeting", "actions", "decisions", "summary"],
  },
  {
    id: "template-executive-rewrite",
    title: "Executive rewrite with claim check",
    category: "Communication",
    roles: ["All Roles"],
    level: "Beginner",
    purpose: "Improve clarity while preserving meaning and exposing unsupported claims.",
    template:
      "Rewrite [APPROVED DRAFT] for [AUDIENCE] in [TONE] and no more than [LENGTH]. Preserve meaning, numbers, commitments, and qualifications. List any claim that needs a source or owner confirmation after the rewrite. Do not add facts.",
    caution: "The accountable owner approves tone, commitments, and claims.",
    tags: ["rewrite", "executive", "clarity", "claims"],
  },
  {
    id: "template-image-concept",
    title: "Safe image concept prompt",
    category: "Images",
    roles: ["Communications", "Learning and Development", "Proposals"],
    level: "Intermediate",
    purpose: "Create a clear visual brief without sensitive or misleading details.",
    template:
      "Create a [ORIENTATION] [STYLE] image for [PURPOSE]. Show [GENERIC SUBJECT AND ACTION] in [GENERIC SETTING]. Composition: [FRAMING AND NEGATIVE SPACE]. Palette: [COLORS]. Include: [SAFE REQUIREMENTS]. Exclude all logos, readable data, real facilities, program identifiers, restricted equipment details, and unapproved text.",
    caution: "Review accuracy, permissions, representation, visible text, and disclosure risk.",
    tags: ["image", "visual", "prompt", "safe"],
  },
  {
    id: "template-ai-output-review",
    title: "AI output verification checklist",
    category: "Governance",
    roles: ["All Roles"],
    level: "Beginner",
    purpose: "Review an AI-assisted draft before it influences work or leaves the team.",
    template:
      "Review [AI-ASSISTED DRAFT] against [AUTHORITATIVE SOURCES]. Check facts, numbers, citations, missing context, assumptions, tone, commitments, policy, privacy, intellectual property, and accessibility. Return a table of issue, evidence, severity, required action, and owner. Do not silently fix high-impact issues.",
    caution: "Human review depth must match the impact of the final use.",
    tags: ["verification", "AI output", "governance", "review"],
  },
];

export const SAFE_DATA_QUESTIONS: SafeDataQuestion[] = [
  {
    id: "data-classification",
    prompt: "Does the planned input contain, quote, or reveal classified, controlled, export-restricted, proprietary, privileged, personal, source-selection, credential, or security-sensitive information?",
    whyItMatters: "A useful prompt is never worth moving protected information into an unapproved service.",
    options: [
      {
        id: "classification-yes",
        label: "Yes",
        guidance: "Do not proceed in this training tool or any unapproved AI service.",
        next: { kind: "outcome", id: "stop-protected" },
      },
      {
        id: "classification-unsure",
        label: "I am not sure",
        guidance: "Uncertainty requires a pause and guidance from the appropriate security, privacy, legal, contracts, or data owner.",
        next: { kind: "outcome", id: "pause-classification" },
      },
      {
        id: "classification-no",
        label: "No",
        guidance: "Continue to confirm that the selected tool and account are approved.",
        next: { kind: "question", id: "tool-approval" },
      },
    ],
  },
  {
    id: "tool-approval",
    prompt: "Is the specific AI tool, account, workspace, capability, and intended use approved by your organization?",
    whyItMatters: "Approval can differ by product, workspace, capability, data type, and business purpose.",
    options: [
      {
        id: "tool-approved",
        label: "Yes, for this exact use",
        guidance: "Continue and minimize the input before using the approved workflow.",
        next: { kind: "question", id: "data-minimization" },
      },
      {
        id: "tool-personal",
        label: "It is a personal or public account",
        guidance: "Do not use a personal or public account for organizational information unless policy explicitly authorizes it.",
        next: { kind: "outcome", id: "stop-unapproved-tool" },
      },
      {
        id: "tool-unknown",
        label: "I do not know",
        guidance: "Pause and confirm the approved tool list and account requirements.",
        next: { kind: "outcome", id: "pause-tool" },
      },
    ],
  },
  {
    id: "data-minimization",
    prompt: "Can you complete the task with less detail, synthetic examples, placeholders, aggregation, or a sanitized summary?",
    whyItMatters: "Minimum necessary context reduces disclosure risk and often improves prompt focus.",
    options: [
      {
        id: "minimize-yes",
        label: "Yes, I can minimize it",
        guidance: "Remove names, identifiers, exact values, real system details, and unrelated context, then continue.",
        next: { kind: "question", id: "rights-permissions" },
      },
      {
        id: "minimize-no",
        label: "No, full detail is required",
        guidance: "A full-detail need requires a data owner and approved environment review before proceeding.",
        next: { kind: "outcome", id: "pause-full-detail" },
      },
      {
        id: "minimize-already",
        label: "It is already synthetic or public",
        guidance: "Continue, but still confirm rights, permissions, and downstream impact.",
        next: { kind: "question", id: "rights-permissions" },
      },
    ],
  },
  {
    id: "rights-permissions",
    prompt: "Do you have the right and authority to use every included source, image, document, and data element for this purpose?",
    whyItMatters: "Public access does not always mean unrestricted reuse, and internal access does not automatically grant AI-processing authority.",
    options: [
      {
        id: "rights-yes",
        label: "Yes",
        guidance: "Continue and assess the impact of the output.",
        next: { kind: "question", id: "output-impact" },
      },
      {
        id: "rights-no",
        label: "No",
        guidance: "Do not use the material. Obtain permission or choose an approved substitute.",
        next: { kind: "outcome", id: "stop-no-rights" },
      },
      {
        id: "rights-unsure",
        label: "I am not sure",
        guidance: "Pause for the content owner, legal, contracts, privacy, or security team to confirm permissions.",
        next: { kind: "outcome", id: "pause-rights" },
      },
    ],
  },
  {
    id: "output-impact",
    prompt: "Could the output influence a contract, legal position, employment action, source selection, financial report, safety decision, security action, technical baseline, customer commitment, or external communication?",
    whyItMatters: "Higher-impact uses require stronger evidence, accountable review, and sometimes a different workflow.",
    options: [
      {
        id: "impact-high",
        label: "Yes",
        guidance: "Use the output only as a draft and route it to the accountable professional before action or release.",
        next: { kind: "question", id: "human-review" },
      },
      {
        id: "impact-low",
        label: "No, it is low-impact support",
        guidance: "Continue to confirm that a named person will still verify the output.",
        next: { kind: "question", id: "human-review" },
      },
      {
        id: "impact-unsure",
        label: "I am not sure",
        guidance: "Treat uncertain impact as high until the owner confirms otherwise.",
        next: { kind: "question", id: "human-review" },
      },
    ],
  },
  {
    id: "human-review",
    prompt: "Is a qualified, accountable person identified to verify facts, sources, calculations, policy, tone, and final use before the output is relied on?",
    whyItMatters: "AI can draft and organize, but accountability remains with people.",
    options: [
      {
        id: "review-yes",
        label: "Yes",
        guidance: "Proceed with the minimized prompt and document the required review.",
        next: { kind: "outcome", id: "ready-with-review" },
      },
      {
        id: "review-no",
        label: "No",
        guidance: "Do not use the output for the planned purpose until an accountable reviewer is assigned.",
        next: { kind: "outcome", id: "pause-no-review" },
      },
      {
        id: "review-self",
        label: "I am the qualified reviewer",
        guidance: "Proceed, but use authoritative sources and keep an evidence trail appropriate to the impact.",
        next: { kind: "outcome", id: "ready-with-review" },
      },
    ],
  },
];

export const SAFE_DATA_OUTCOMES: SafeDataOutcome[] = [
  {
    id: "stop-protected",
    status: "stop",
    title: "Stop: protected information is in scope",
    summary: "Do not enter the material into this training tool or an unapproved AI service.",
    actions: ["Use the approved protected-data workflow", "Contact the appropriate data owner", "Create a synthetic or fully sanitized practice example"],
  },
  {
    id: "pause-classification",
    status: "pause",
    title: "Pause: classification or handling is unclear",
    summary: "Uncertainty about the data is a reason to stop and ask, not a reason to test the boundary.",
    actions: ["Ask security or the data owner", "Do not paste a sample to ask whether it is sensitive", "Resume only after the exact use is approved"],
  },
  {
    id: "stop-unapproved-tool",
    status: "stop",
    title: "Stop: the tool or account is not approved",
    summary: "Use an organization-approved account and workflow for organizational work.",
    actions: ["Close the unapproved workflow", "Find the approved tool list", "Use synthetic data for training"],
  },
  {
    id: "pause-tool",
    status: "pause",
    title: "Pause: tool approval is unknown",
    summary: "Confirm the product, account, workspace, capability, and purpose before proceeding.",
    actions: ["Ask the workspace owner or security team", "Check current acceptable-use guidance", "Document the approved path"],
  },
  {
    id: "pause-full-detail",
    status: "pause",
    title: "Pause: full-detail processing needs review",
    summary: "If the work truly requires full detail, use only an environment approved for that data and purpose.",
    actions: ["Ask the data owner", "Confirm retention and access controls", "Consider local or synthetic alternatives"],
  },
  {
    id: "stop-no-rights",
    status: "stop",
    title: "Stop: permission is missing",
    summary: "Do not use material when reuse or processing rights are absent.",
    actions: ["Obtain permission", "Use an approved substitute", "Record the source and license for future review"],
  },
  {
    id: "pause-rights",
    status: "pause",
    title: "Pause: rights are unclear",
    summary: "Confirm ownership, license, privacy, privilege, and contract restrictions before use.",
    actions: ["Ask the content owner", "Route legal or contracts questions appropriately", "Use a generic example meanwhile"],
  },
  {
    id: "pause-no-review",
    status: "pause",
    title: "Pause: no accountable reviewer",
    summary: "Assign a qualified person before the AI-assisted output can influence work.",
    actions: ["Name the accountable reviewer", "Define acceptance criteria", "Keep the output clearly marked as a draft"],
  },
  {
    id: "ready-with-review",
    status: "ready",
    title: "Ready: proceed with safeguards",
    summary: "Use the approved tool, minimized input, and documented human verification path.",
    actions: ["Keep facts linked to sources", "Label assumptions and uncertainty", "Verify before use or release", "Follow records and disclosure rules"],
  },
];

export const STUDIO_QUIZ: StudioQuizQuestion[] = [
  {
    id: "quiz-data-first",
    topic: "Safe data",
    difficulty: "Beginner",
    prompt: "You are unsure whether a paragraph contains controlled information. What is the best first action?",
    options: [
      { id: "a", label: "Paste only the paragraph and ask the AI whether it is controlled" },
      { id: "b", label: "Pause and ask the security or data owner without pasting the paragraph" },
      { id: "c", label: "Remove the title and proceed" },
      { id: "d", label: "Use a personal account because the task is brief" },
    ],
    correctOptionId: "b",
    explanation: "Do not expose questionable material while trying to determine its handling. Confirm classification through an approved human process.",
    remediationSection: "safety",
    nextOnCorrect: "quiz-model-routine",
    nextOnIncorrect: "quiz-tool-approval",
  },
  {
    id: "quiz-tool-approval",
    topic: "Safe data",
    difficulty: "Beginner",
    prompt: "Which statement about AI tool approval is most accurate?",
    options: [
      { id: "a", label: "Any paid account is approved for work" },
      { id: "b", label: "Approval can depend on the product, account, workspace, capability, data, and purpose" },
      { id: "c", label: "Public information can always be uploaded anywhere" },
      { id: "d", label: "Approval is required only for classified information" },
    ],
    correctOptionId: "b",
    explanation: "Approval is specific. Confirm the exact account, capability, input, and intended use.",
    remediationSection: "safety",
    nextOnCorrect: "quiz-model-routine",
    nextOnIncorrect: "quiz-data-first",
  },
  {
    id: "quiz-model-routine",
    topic: "Model selection",
    difficulty: "Beginner",
    prompt: "Which model choice best fits a quick rewrite of an approved, non-sensitive meeting summary in ChatGPT?",
    options: [
      { id: "a", label: "GPT-5.5 Instant" },
      { id: "b", label: "GPT-5.6 Sol because every task needs maximum reasoning" },
      { id: "c", label: "GPT Image 2" },
      { id: "d", label: "No model can help with rewriting" },
    ],
    correctOptionId: "a",
    explanation: "The everyday default is a practical fit for routine drafting and rewriting when the content and workflow are approved.",
    remediationSection: "models",
    nextOnCorrect: "quiz-model-scale",
    nextOnIncorrect: "quiz-tool-approval",
  },
  {
    id: "quiz-model-scale",
    topic: "Model selection",
    difficulty: "Intermediate",
    prompt: "An approved API workflow must classify a large batch of low-risk, consistently formatted records. Which current option is designed for efficient high-volume work?",
    options: [
      { id: "a", label: "GPT-5.6 Sol" },
      { id: "b", label: "GPT-5.6 Luna" },
      { id: "c", label: "GPT Image 2" },
      { id: "d", label: "A Custom GPT profile" },
    ],
    correctOptionId: "b",
    explanation: "Luna is the efficient high-volume option for API, Codex, and Work contexts. It is not presented as a standard ChatGPT picker choice.",
    remediationSection: "models",
    nextOnCorrect: "quiz-gpt-knowledge",
    nextOnIncorrect: "quiz-model-routine",
  },
  {
    id: "quiz-gpt-knowledge",
    topic: "Custom GPTs",
    difficulty: "Intermediate",
    prompt: "Where should a Custom GPT store behavioral rules such as required questions and refusal conditions?",
    options: [
      { id: "a", label: "Only in the public name" },
      { id: "b", label: "In the GPT instructions" },
      { id: "c", label: "Inside an unrelated knowledge file" },
      { id: "d", label: "In a user browser bookmark" },
    ],
    correctOptionId: "b",
    explanation: "Instructions define behavior. Knowledge files are best used as approved reference material.",
    remediationSection: "gpts",
    nextOnCorrect: "quiz-skill-entry",
    nextOnIncorrect: "quiz-model-scale",
  },
  {
    id: "quiz-skill-entry",
    topic: "ChatGPT Skills",
    difficulty: "Intermediate",
    prompt: "Which description best matches a ChatGPT Skill?",
    options: [
      { id: "a", label: "A one-time prompt with no reusable workflow" },
      { id: "b", label: "A reusable workflow that guides ChatGPT through a specific task" },
      { id: "c", label: "A folder for storing credentials" },
      { id: "d", label: "A replacement for qualified human review" },
    ],
    correctOptionId: "b",
    explanation: "A ChatGPT Skill is a reusable workflow for a specific task. It can include instructions, examples, code, and supporting resources.",
    remediationSection: "skills",
    nextOnCorrect: "quiz-image-accuracy",
    nextOnIncorrect: "quiz-gpt-knowledge",
  },
  {
    id: "quiz-image-accuracy",
    topic: "Image generation",
    difficulty: "Intermediate",
    prompt: "What is the safest way to use a generated image of a technical system in a training deck?",
    options: [
      { id: "a", label: "Present it as verified system architecture" },
      { id: "b", label: "Use a generic, non-sensitive concept and label it as illustrative after human review" },
      { id: "c", label: "Include real identifiers so it looks authentic" },
      { id: "d", label: "Skip review because images cannot create factual errors" },
    ],
    correctOptionId: "b",
    explanation: "Generated visuals can contain inaccurate or misleading details. Keep concepts generic and review the image for accuracy and disclosure risk.",
    remediationSection: "images",
    nextOnCorrect: "quiz-high-impact",
    nextOnIncorrect: "quiz-skill-entry",
  },
  {
    id: "quiz-high-impact",
    topic: "Human accountability",
    difficulty: "Advanced",
    prompt: "An AI-assisted clause comparison flags a possible new obligation. What should happen next?",
    options: [
      { id: "a", label: "Accept the model result and update the contract position" },
      { id: "b", label: "Ask the model to make the final legal decision" },
      { id: "c", label: "Verify the exact source text and route the issue to contracts or legal counsel" },
      { id: "d", label: "Remove the source text and keep only the AI summary" },
    ],
    correctOptionId: "c",
    explanation: "AI can surface review questions, but accountable professionals must verify the source and make contract or legal determinations.",
    remediationSection: "use-cases",
    nextOnIncorrect: "quiz-data-first",
  },
];

export const AI_UPDATES: AIUpdate[] = [
  {
    id: "update-chatgpt-default",
    date: STUDIO_VERIFIED_ON,
    title: "GPT-5.5 Instant is the everyday ChatGPT default",
    summary: "Current ChatGPT guidance identifies GPT-5.5 Instant as the fast default for everyday work.",
    whyItMatters: "Most routine drafts, summaries, and rewrites do not need the deepest available reasoning mode.",
    actions: ["Start with the everyday default for routine work", "Escalate to deeper reasoning when task complexity justifies it", "Verify availability in your workspace"],
    availability: "Model labels, picker options, plans, and workspace access can change. Check the current picker and administrator guidance.",
    sourceId: "chatgpt-models",
    sourceUrl: "https://help.openai.com/en/articles/20001354-gpt-56-in-chatgpt",
    verifiedOn: STUDIO_VERIFIED_ON,
  },
  {
    id: "update-gpt56-family",
    date: STUDIO_VERIFIED_ON,
    title: "GPT-5.6 choices separate deep reasoning, balance, and throughput",
    summary: "Sol is positioned for deeper reasoning, Terra for intelligence and cost balance, and Luna for efficient high-volume work.",
    whyItMatters: "Model selection should match task complexity, volume, latency, risk, and the product surface in use.",
    actions: ["Use Sol for complex analysis", "Consider Terra for balanced API, Codex, or Work flows", "Consider Luna for narrow high-volume flows", "Do not assume every option appears in ChatGPT"],
    availability: "Terra and Luna are documented for API, Codex, and Work contexts, not as standard ChatGPT picker options. Access depends on product and workspace configuration.",
    sourceId: "latest-model",
    sourceUrl: "https://developers.openai.com/api/docs/guides/latest-model",
    verifiedOn: STUDIO_VERIFIED_ON,
  },
  {
    id: "update-image2",
    date: STUDIO_VERIFIED_ON,
    title: "GPT Image 2 is the current image-generation model",
    summary: "OpenAI guidance describes GPT Image 2 for current image generation and editing workflows.",
    whyItMatters: "Teams can use structured visual prompts and iterative editing, while still reviewing factual detail, visible text, permissions, and disclosure risk.",
    actions: ["Write purpose, subject, composition, style, and constraints", "Use generic or approved source material", "Review every generated image before use"],
    availability: "Image capabilities depend on the selected product, account, plan, workspace policy, and enabled features.",
    sourceId: "image-generation",
    sourceUrl: "https://developers.openai.com/api/docs/guides/image-generation",
    verifiedOn: STUDIO_VERIFIED_ON,
  },
  {
    id: "update-custom-gpts",
    date: STUDIO_VERIFIED_ON,
    title: "Custom GPT building remains a web-based workflow",
    summary: "Custom GPTs can combine a profile, instructions, approved knowledge, capabilities, and optional actions.",
    whyItMatters: "A useful GPT needs a narrow job, tested instructions, least-privilege capabilities, approved content, and a named owner.",
    actions: ["Build and edit on the web", "Separate behavioral instructions from reference knowledge", "Test before sharing", "Review workspace permissions"],
    availability: "Creating or editing a GPT depends on plan, workspace permissions, and administrator controls. Mobile experiences may support use but not full building.",
    sourceId: "creating-gpts",
    sourceUrl: "https://help.openai.com/en/articles/8554397-creating-a-gpt",
    verifiedOn: STUDIO_VERIFIED_ON,
  },
  {
    id: "update-chatgpt-skills",
    date: STUDIO_VERIFIED_ON,
    title: "ChatGPT Skills turn repeatable work into reusable workflows",
    summary: "Skills can include instructions, examples, code, and supporting resources, then be installed and used when relevant.",
    whyItMatters: "Teams can turn an approved expert workflow into a discoverable, testable pattern instead of rewriting the process each time.",
    actions: ["Choose a narrow repeatable task", "Define inputs, steps, outputs, and checks", "Test normal and unsafe cases", "Review permissions before sharing"],
    availability: "Access, creation, installation, and sharing depend on the ChatGPT plan and workspace administrator settings. Personal Skills are added separately across product surfaces.",
    sourceId: "chatgpt-skills",
    sourceUrl: "https://help.openai.com/en/articles/20001066-skills-in-chatgpt/",
    verifiedOn: STUDIO_VERIFIED_ON,
  },
];
