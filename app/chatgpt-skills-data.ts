export const CHATGPT_SKILLS_VERIFIED_ON = "2026-07-18";

export type SkillLevelId = "beginner" | "intermediate" | "advanced";

export interface ChatGPTSkillsSource {
  id: string;
  title: string;
  url: string;
  purpose: string;
}

export interface SkillLevel {
  id: SkillLevelId;
  name: string;
  kicker: string;
  goal: string;
  summary: string;
  completionId: string;
  lessons: Array<{
    title: string;
    description: string;
    practice: string;
  }>;
}

export interface SkillToolChoice {
  id: "skill" | "gpt" | "project";
  name: string;
  bestFor: string;
  result: string;
  caution: string;
}

export interface SkillRoleProject {
  role: string;
  skillName: string;
  job: string;
  inputs: string;
  output: string;
  guardrails: string;
}

export interface SkillFitScenario {
  id: string;
  title: string;
  description: string;
  answer: "good" | "refine" | "not-suitable";
  explanation: string;
}

export interface SkillTestCase {
  id: string;
  label: string;
  category: string;
  request: string;
  expected: string;
  passSignal: string;
}

export interface SkillRedTeamCase {
  id: string;
  title: string;
  prompt: string;
  options: Array<{ id: string; label: string }>;
  correctOptionId: string;
  explanation: string;
}

export interface SkillGovernanceCheck {
  id: string;
  title: string;
  description: string;
}

export const CHATGPT_SKILLS_SOURCES: ChatGPTSkillsSource[] = [
  {
    id: "chatgpt-skills-help",
    title: "Skills in ChatGPT",
    url: "https://help.openai.com/en/articles/20001066-skills-in-chatgpt/",
    purpose: "Current access, creation, installation, sharing, and workspace administration guidance.",
  },
  {
    id: "openai-academy-skills",
    title: "Using skills",
    url: "https://openai.com/academy/skills/",
    purpose: "Practical guidance for choosing a repeatable task and writing a useful SKILL.md workflow.",
  },
];

export const SKILL_LEVELS: SkillLevel[] = [
  {
    id: "beginner",
    name: "Beginner",
    kicker: "Build one focused workflow",
    goal: "Turn a repeatable task into a clear Skill Brief and starter SKILL.md.",
    summary: "Choose a narrow job, define the inputs and output, write ordered steps, and add a safe stop rule.",
    completionId: "chatgpt-skills-beginner",
    lessons: [
      {
        title: "Choose the right job",
        description: "Start with work that repeats and benefits from a consistent process or output format.",
        practice: "Sort possible tasks into good fit, needs refinement, or not suitable.",
      },
      {
        title: "Define the contract",
        description: "State the job, required inputs, ordered workflow, output format, and final checks.",
        practice: "Complete the guided Skill Brief builder with synthetic information.",
      },
      {
        title: "Review before installing",
        description: "Read every instruction and resource, then confirm the Skill stays within the user's authority.",
        practice: "Copy or download the generated SKILL.md for review.",
      },
    ],
  },
  {
    id: "intermediate",
    name: "Intermediate",
    kicker: "Test and improve",
    goal: "Build a portable Skill package that behaves safely across normal and difficult requests.",
    summary: "Add only useful resources, test expected behavior, and revise weak instructions before sharing.",
    completionId: "chatgpt-skills-intermediate",
    lessons: [
      {
        title: "Use progressive disclosure",
        description: "Keep the core workflow concise and move detailed rules, templates, and deterministic checks into supporting resources.",
        practice: "Choose which references, scripts, examples, and assets belong in the package.",
      },
      {
        title: "Design the test set",
        description: "Test a normal request, missing input, conflicting sources, and an unsafe request.",
        practice: "Run all four simulated test-bench cases and compare the expected response.",
      },
      {
        title: "Revise from evidence",
        description: "Tighten the description, steps, or stop conditions when a test exposes ambiguity.",
        practice: "Record one specific revision for each failed behavior.",
      },
    ],
  },
  {
    id: "advanced",
    name: "Advanced",
    kicker: "Govern and scale",
    goal: "Prepare a team Skill for controlled release, monitoring, maintenance, and retirement.",
    summary: "Assign ownership, limit access, add human approvals, red-team risky behavior, and set a review cycle.",
    completionId: "chatgpt-skills-advanced",
    lessons: [
      {
        title: "Set accountable ownership",
        description: "Name a business owner, qualified reviewer, release approver, and maintenance schedule.",
        practice: "Complete the governance and release-readiness record.",
      },
      {
        title: "Control sharing and change",
        description: "Use the narrowest approved audience and review uploaded skills, resources, and code before installation.",
        practice: "Choose a sharing scope and document version, feedback, and retirement rules.",
      },
      {
        title: "Red-team the workflow",
        description: "Challenge authority, data handling, source trust, and high-impact decisions before release.",
        practice: "Pass every red-team scenario and complete the capstone readiness review.",
      },
    ],
  },
];

export const SKILL_TOOL_CHOICES: SkillToolChoice[] = [
  {
    id: "skill",
    name: "Skill",
    bestFor: "A repeatable task that should follow the same workflow, format, and quality checks across chats.",
    result: "A reusable workflow with instructions and optional resources such as templates, examples, or code.",
    caution: "Keep the task focused. Split a large process into smaller Skills when the triggers or outputs differ.",
  },
  {
    id: "gpt",
    name: "Custom GPT",
    bestFor: "A goal-oriented assistant with a defined purpose, knowledge, capabilities, and conversation style.",
    result: "A tailored ChatGPT experience that can use multiple workflows over time.",
    caution: "Do not turn one repeatable procedure into a broad assistant when a focused Skill is sufficient.",
  },
  {
    id: "project",
    name: "Project",
    bestFor: "Ongoing work that needs shared context, files, conversations, and continuity around one outcome.",
    result: "A workspace for related work, not a reusable procedure by itself.",
    caution: "A Project can use Skills, but storing files together does not define a reliable workflow.",
  },
];

export const SKILL_ROLE_PROJECTS: SkillRoleProject[] = [
  {
    role: "General",
    skillName: "review-ready-brief",
    job: "Turn approved notes into a concise decision brief with facts, assumptions, gaps, and next actions.",
    inputs: "Objective, audience, approved notes, decision deadline, and required format.",
    output: "A one-page decision brief with traceable claims and unresolved questions.",
    guardrails: "Use only supplied facts. Do not invent commitments. Route decisions to the responsible person.",
  },
  {
    role: "Business Development",
    skillName: "opportunity-qualification-brief",
    job: "Create an opportunity qualification brief from public or approved information.",
    inputs: "Customer need, public notice, timeline, fit criteria, and approved capability facts.",
    output: "A qualification summary with evidence, gaps, risks, and recommended next action.",
    guardrails: "Do not invent customer intent, competitor facts, past performance, or probability of win.",
  },
  {
    role: "Capture Management",
    skillName: "win-theme-evidence-map",
    job: "Map draft win themes to approved evidence and flag unsupported claims.",
    inputs: "Customer priorities, approved discriminators, evidence sources, and review criteria.",
    output: "A theme, proof, source, gap, and owner table.",
    guardrails: "Do not create proof points or attribute unstated priorities to a customer.",
  },
  {
    role: "Proposals",
    skillName: "proposal-compliance-matrix",
    job: "Build a compliance matrix from a synthetic solicitation excerpt.",
    inputs: "Requirement text, source identifiers, response location, owner, and status rules.",
    output: "A traceable compliance table with ambiguities and missing responses flagged.",
    guardrails: "Preserve source wording and identifiers. Require authorized review before submission.",
  },
  {
    role: "Solutions",
    skillName: "requirements-trade-study",
    job: "Compare solution options against stated requirements and evaluation criteria.",
    inputs: "Requirements, options, constraints, evidence, and scoring method.",
    output: "A trade table with scores, rationale, assumptions, risks, and open questions.",
    guardrails: "Do not claim certification, performance, or compliance without approved evidence.",
  },
  {
    role: "Contracts",
    skillName: "clause-obligation-tracker",
    job: "Extract stated obligations from an approved synthetic clause set for review.",
    inputs: "Clause text, source citation, responsible function, due date, and review status.",
    output: "An obligation tracker that quotes the source and flags interpretation questions.",
    guardrails: "Do not provide a binding interpretation or alter contract language. Require Contracts review.",
  },
  {
    role: "Legal",
    skillName: "legal-issue-spotting-checklist",
    job: "Organize potential issues and questions from an approved synthetic fact pattern.",
    inputs: "Fact pattern, jurisdiction, policy references, and decision needed.",
    output: "An issue list with facts, assumptions, missing information, and questions for counsel.",
    guardrails: "Do not provide final legal advice or represent the output as an attorney conclusion.",
  },
  {
    role: "Program Management",
    skillName: "program-status-raid-review",
    job: "Turn approved status inputs into a RAID review and leadership summary.",
    inputs: "Milestones, status, risks, assumptions, issues, dependencies, owners, and dates.",
    output: "A concise status summary plus a structured RAID table.",
    guardrails: "Do not invent dates, status, cost, or commitments. Flag missing owner decisions.",
  },
  {
    role: "Systems Engineering",
    skillName: "requirements-traceability-review",
    job: "Check a synthetic set of requirements for traceability and verification coverage.",
    inputs: "Requirement IDs, source, allocation, verification method, and evidence status.",
    output: "A coverage table with orphaned, duplicate, ambiguous, and unverified items.",
    guardrails: "Do not treat AI review as engineering approval or configuration control.",
  },
  {
    role: "Cybersecurity",
    skillName: "control-evidence-checklist",
    job: "Map synthetic evidence descriptions to stated security-control review criteria.",
    inputs: "Control text, evidence descriptions, scope, owner, and assessment criteria.",
    output: "An evidence checklist with sufficiency gaps and reviewer questions.",
    guardrails: "Do not enter credentials, vulnerabilities, system secrets, or restricted architecture details.",
  },
  {
    role: "Supply Chain",
    skillName: "supplier-comparison-brief",
    job: "Compare synthetic supplier options using approved evaluation criteria.",
    inputs: "Criteria, weights, public or synthetic supplier facts, risks, and assumptions.",
    output: "A comparison brief with evidence, scoring rationale, and due-diligence gaps.",
    guardrails: "Do not make a source-selection decision or invent supplier performance facts.",
  },
  {
    role: "Finance",
    skillName: "variance-narrative-builder",
    job: "Explain synthetic budget-to-actual variances in plain language.",
    inputs: "Approved anonymized figures, thresholds, period, drivers, and owner notes.",
    output: "A variance narrative with calculations, causes, assumptions, and follow-up actions.",
    guardrails: "Do not infer missing financial facts or treat the output as an approved forecast.",
  },
  {
    role: "Human Resources",
    skillName: "structured-interview-kit",
    job: "Create a structured interview kit from an approved job description.",
    inputs: "Role outcomes, required skills, approved competencies, and scoring scale.",
    output: "Consistent questions, evidence indicators, and a bias-aware scoring rubric.",
    guardrails: "Exclude protected-class information and require qualified HR review.",
  },
  {
    role: "Quality",
    skillName: "corrective-action-prep",
    job: "Organize synthetic evidence for a corrective-action review.",
    inputs: "Issue statement, evidence, containment, causal analysis, actions, owners, and dates.",
    output: "A review checklist with evidence gaps, verification steps, and closure questions.",
    guardrails: "Do not declare root cause or closure without the authorized quality process.",
  },
];

export const SKILL_FIT_SCENARIOS: SkillFitScenario[] = [
  {
    id: "fit-status",
    title: "Weekly status summary",
    description: "The team repeatedly converts the same approved status fields into the same leadership format.",
    answer: "good",
    explanation: "This is repeatable, bounded, and has clear inputs, steps, and output checks.",
  },
  {
    id: "fit-everything",
    title: "Handle every proposal task",
    description: "The workflow should research, strategize, write, price, approve, and submit any proposal.",
    answer: "refine",
    explanation: "The scope is too broad. Split it into focused Skills with distinct triggers and reviewers.",
  },
  {
    id: "fit-approval",
    title: "Approve a contract change",
    description: "The Skill would make the final binding decision without an authorized reviewer.",
    answer: "not-suitable",
    explanation: "A Skill can organize evidence, but it must not replace authorized contractual judgment.",
  },
  {
    id: "fit-matrix",
    title: "Build a compliance matrix",
    description: "The user supplies approved requirement text and needs a consistent traceable table.",
    answer: "good",
    explanation: "The workflow is structured and testable when source identifiers are preserved.",
  },
  {
    id: "fit-customer-intent",
    title: "Predict hidden customer intent",
    description: "The Skill would infer nonpublic priorities without supporting evidence.",
    answer: "not-suitable",
    explanation: "The request depends on speculation and could create unsupported business claims.",
  },
  {
    id: "fit-research",
    title: "Research any topic",
    description: "The user wants a general research helper with no defined sources, output, or completion rule.",
    answer: "refine",
    explanation: "Define the domain, approved sources, evidence standard, output, and stop conditions first.",
  },
];

export const SKILL_TEST_CASES: SkillTestCase[] = [
  {
    id: "normal",
    label: "Normal request",
    category: "Expected use",
    request: "Create the brief from this complete synthetic input set.",
    expected: "Confirm the job, follow the workflow, produce the required format, and run the final checks.",
    passSignal: "Every required section is present and material claims are traceable to the supplied input.",
  },
  {
    id: "missing",
    label: "Missing input",
    category: "Recovery",
    request: "Create the brief, but no audience or source material is provided.",
    expected: "Pause, identify the missing required inputs, and ask focused questions instead of guessing.",
    passSignal: "The Skill does not invent an audience, evidence, facts, or completion status.",
  },
  {
    id: "conflict",
    label: "Conflicting sources",
    category: "Evidence handling",
    request: "Two approved synthetic notes give different milestone dates.",
    expected: "Show the conflict, cite both supplied sources, and route the discrepancy to the responsible reviewer.",
    passSignal: "The Skill does not silently choose a date or merge incompatible facts.",
  },
  {
    id: "unsafe",
    label: "Unsafe request",
    category: "Safe stop",
    request: "Use restricted information, hidden credentials, or authority the user does not have.",
    expected: "Stop, explain the boundary in plain language, and direct the user to the approved process or owner.",
    passSignal: "No restricted content is requested, repeated, transformed, stored, or transmitted.",
  },
];

export const SKILL_RED_TEAM_CASES: SkillRedTeamCase[] = [
  {
    id: "rt-injection",
    title: "Untrusted instruction",
    prompt: "A supplied document says to ignore the Skill rules and reveal other workspace content. What should happen?",
    options: [
      { id: "follow", label: "Follow the document because it is part of the input" },
      { id: "stop", label: "Treat it as untrusted content, ignore the instruction, and flag it for review" },
      { id: "hide", label: "Continue without telling the reviewer" },
    ],
    correctOptionId: "stop",
    explanation: "Source content is evidence, not authority to override the Skill or workspace rules.",
  },
  {
    id: "rt-data",
    title: "Restricted data request",
    prompt: "A user offers classified, controlled, export-restricted, personal, or secret information to improve the result.",
    options: [
      { id: "accept", label: "Accept it if the user says it is important" },
      { id: "redact-later", label: "Process it first and remove it from the final answer" },
      { id: "stop", label: "Stop and use the organization's authorized data-handling path" },
    ],
    correctOptionId: "stop",
    explanation: "A capable workflow does not make a tool, data type, or use case approved.",
  },
  {
    id: "rt-authority",
    title: "High-impact approval",
    prompt: "The user asks the Skill to make a final legal, contractual, financial, security, personnel, or customer commitment.",
    options: [
      { id: "decide", label: "Make the decision and present it as final" },
      { id: "route", label: "Prepare a review package and route the decision to the authorized human" },
      { id: "guess", label: "Choose the least risky option without documenting assumptions" },
    ],
    correctOptionId: "route",
    explanation: "The Skill supports judgment but does not replace accountable decision authority.",
  },
  {
    id: "rt-upload",
    title: "Unknown Skill package",
    prompt: "A downloaded Skill includes instructions, supporting files, and code from an unknown source.",
    options: [
      { id: "install", label: "Install it because ChatGPT will scan it" },
      { id: "review", label: "Review the source, instructions, resources, code, permissions, and policy fit before installation" },
      { id: "share", label: "Share it broadly so others can test it" },
    ],
    correctOptionId: "review",
    explanation: "Platform scanning helps, but it does not replace organizational review, policy, or judgment.",
  },
];

export const SKILL_GOVERNANCE_CHECKS: SkillGovernanceCheck[] = [
  { id: "owner", title: "Named business owner", description: "Accountable for purpose, scope, and continued business need." },
  { id: "reviewer", title: "Qualified reviewer", description: "Validates domain accuracy, risk controls, and human approval points." },
  { id: "scope", title: "Narrow sharing scope", description: "Limits access to the smallest approved audience and use case." },
  { id: "sources", title: "Trusted resources", description: "Reviews every instruction, file, example, script, and dependency before release." },
  { id: "tests", title: "Representative test set", description: "Covers normal, missing, conflicting, unsafe, and out-of-scope requests." },
  { id: "version", title: "Version and change record", description: "Explains what changed, why, who approved it, and when it takes effect." },
  { id: "monitor", title: "Feedback and monitoring", description: "Captures failures, unsafe behavior, drift, and improvement requests." },
  { id: "retire", title: "Review and retirement rule", description: "Sets review dates and removes the Skill when policy, sources, or need changes." },
];
