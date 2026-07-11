export type ClearStepKey =
  | "clarify"
  | "limit"
  | "engineer"
  | "assess"
  | "refine";

export interface CourseMetadata {
  title: string;
  shortTitle: string;
  description: string;
  audience: string;
  minutes: number;
  moduleCount: number;
  capstoneMinutes: number;
  promise: string;
}

export interface ClearStep {
  key: ClearStepKey;
  letter: string;
  name: string;
  action: string;
  description: string;
}

export interface Concept {
  title: string;
  body: string;
  example?: string;
}

export interface QuizOption {
  id: string;
  text: string;
  feedback: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
  correctOptionId: string;
  critical?: boolean;
  explanation: string;
}

export interface PracticeBase {
  id: string;
  eyebrow: string;
  title: string;
  estimatedMinutes: number;
  instructions: string[];
  scenario: string;
}

export interface BuilderField {
  id: string;
  label: string;
  prompt: string;
  placeholder: string;
}

export interface RewriteLabPractice extends PracticeBase {
  type: "rewrite-lab";
  starterPrompt: string;
  fields: BuilderField[];
  successChecks: string[];
  modelAnswer: string;
}

export type RiskCategoryId = "ready" | "pause" | "restricted";

export interface RiskSortPractice extends PracticeBase {
  type: "risk-sort";
  categories: {
    id: RiskCategoryId;
    label: string;
    description: string;
  }[];
  items: {
    id: string;
    text: string;
    detail: string;
    answer: RiskCategoryId;
    feedback: string;
  }[];
  debrief: string;
}

export interface ContextBuilderPractice extends PracticeBase {
  type: "context-builder";
  sourceNotes: string[];
  fields: BuilderField[];
  successChecks: string[];
  modelAnswer: string;
}

export type ClaimVerdict = "supported" | "unsupported" | "needs-context";

export interface VerificationCheckPractice extends PracticeBase {
  type: "verification-check";
  sourcePack: string[];
  draft: string;
  claims: {
    id: string;
    text: string;
    answer: ClaimVerdict;
    feedback: string;
  }[];
  improvedDraft: string;
}

export type ConcernCategory = "accuracy" | "judgment" | "tone" | "policy";

export interface ActionPlanPractice extends PracticeBase {
  type: "action-plan";
  aiDraft: string;
  concerns: {
    id: string;
    text: string;
    category: ConcernCategory;
  }[];
  planPrompts: {
    id: string;
    label: string;
    placeholder: string;
  }[];
  modelPlan: string[];
}

export type PracticeExercise =
  | RewriteLabPractice
  | RiskSortPractice
  | ContextBuilderPractice
  | VerificationCheckPractice
  | ActionPlanPractice;

export interface CourseModule {
  id: ClearStepKey;
  number: number;
  title: string;
  minutes: number;
  description: string;
  outcome: string;
  skillName: string;
  objectives: string[];
  concepts: Concept[];
  practice: PracticeExercise;
  quiz: QuizQuestion[];
  takeaway: string;
}

export interface CapstoneStage {
  step: ClearStepKey;
  title: string;
  prompt: string;
  deliverable: string;
}

export interface CapstoneScenario {
  id: string;
  number: number;
  title: string;
  minutes: number;
  description: string;
  outcome: string;
  scenario: string;
  sourcePack: string[];
  stages: CapstoneStage[];
  rubric: {
    id: string;
    label: string;
    description: string;
  }[];
  modelResponse: string;
}

export interface ResourceSection {
  heading: string;
  items: string[];
}

export interface ResourceItem {
  id: string;
  kind: "checklist" | "template" | "guide";
  title: string;
  description: string;
  useWhen: string;
  sections: ResourceSection[];
  copyText: string;
}

export const COURSE: CourseMetadata = {
  title: "AI at Work: Think Clearly, Work Responsibly",
  shortTitle: "AI at Work",
  description:
    "A hands-on course for getting useful results from AI while protecting people, information, and the quality of your work.",
  audience:
    "Astrion employees across defense, civilian, and space mission and business functions",
  minutes: 60,
  moduleCount: 5,
  capstoneMinutes: 15,
  promise:
    "Finish with a repeatable method for turning a work task into an AI-assisted result you can stand behind.",
};

export const CLEAR_STEPS: ClearStep[] = [
  {
    key: "clarify",
    letter: "C",
    name: "Clarify",
    action: "Name the job",
    description:
      "Define the audience, outcome, and success criteria before you open an AI tool.",
  },
  {
    key: "limit",
    letter: "L",
    name: "Limit",
    action: "Set safe boundaries",
    description:
      "Choose appropriate information, tools, and decision boundaries for the task.",
  },
  {
    key: "engineer",
    letter: "E",
    name: "Engineer",
    action: "Build useful context",
    description:
      "Give the model a clear role, relevant source material, constraints, and an output format.",
  },
  {
    key: "assess",
    letter: "A",
    name: "Assess",
    action: "Check before trust",
    description:
      "Test important claims, assumptions, omissions, tone, and fit for the real audience.",
  },
  {
    key: "refine",
    letter: "R",
    name: "Refine",
    action: "Improve and own",
    description:
      "Revise with judgment, document what matters, and keep a human accountable for the result.",
  },
];

export const COURSE_MODULES: CourseModule[] = [
  {
    id: "clarify",
    number: 1,
    title: "Clarify the job before prompting",
    minutes: 8,
    description:
      "Turn a fuzzy request into a task with a clear audience, purpose, and finish line.",
    outcome:
      "You can write a one-sentence AI task brief that makes a useful result much more likely.",
    skillName: "Task framing",
    objectives: [
      "Separate the real work outcome from the first idea for an AI prompt.",
      "Name the audience, decision, deliverable, and success criteria.",
      "Recognize when a task is too vague to delegate well.",
    ],
    concepts: [
      {
        title: "Start with the work, not the tool",
        body:
          "AI is most useful when it is attached to a real job. Ask what must change after the output exists: a reader understands, a manager decides, or a customer takes action.",
        example:
          "Instead of “write something about the launch,” aim for “help store managers explain the launch to frontline staff.”",
      },
      {
        title: "Give the result a finish line",
        body:
          "A good brief defines what done means. Audience, format, length, tone, and required content give both you and the model something concrete to work toward.",
        example:
          "A 150-word update for busy managers, in plain language, with three actions and one deadline.",
      },
      {
        title: "Keep judgment with the human",
        body:
          "You can delegate drafting, comparison, or brainstorming. You cannot delegate accountability for whether the task is appropriate or the result is ready to use.",
      },
    ],
    practice: {
      id: "clarify-rewrite",
      type: "rewrite-lab",
      eyebrow: "Prompt makeover",
      title: "Turn a vague ask into a usable brief",
      estimatedMinutes: 3,
      instructions: [
        "Read the starter prompt and scenario.",
        "Fill in the four framing fields.",
        "Compare your brief with the success checks and model answer.",
      ],
      scenario:
        "You support a regional operations team. A new expense process begins next Monday, and managers need to know what changes.",
      starterPrompt: "Write an email about the new expense process.",
      fields: [
        {
          id: "audience",
          label: "Audience",
          prompt: "Who will use this, and what do they already know?",
          placeholder: "Regional store managers who know the old process",
        },
        {
          id: "outcome",
          label: "Outcome",
          prompt: "What should the reader understand or do next?",
          placeholder: "Understand the two changes and brief their teams",
        },
        {
          id: "deliverable",
          label: "Deliverable",
          prompt: "What exact format should the AI produce?",
          placeholder: "A short email with a subject line and three bullets",
        },
        {
          id: "success",
          label: "Success criteria",
          prompt: "What must a strong result include or avoid?",
          placeholder: "Plain language, Monday deadline, help link, no jargon",
        },
      ],
      successChecks: [
        "The audience is specific enough to picture.",
        "The desired action is visible.",
        "The format and length are constrained.",
        "Required details and avoidances are named.",
      ],
      modelAnswer:
        "Draft a 150-word email for regional store managers who know our current expense process. Explain the two changes that begin next Monday and ask managers to brief their teams by Friday. Include a clear subject line, three scannable bullets, the help-center link placeholder, and a calm, practical tone. Avoid finance jargon and do not invent policy details.",
    },
    quiz: [
      {
        id: "clarify-q1",
        prompt:
          "A colleague asks, “Can AI make this report better?” What is the strongest first question?",
        options: [
          {
            id: "a",
            text: "Which AI model should we use?",
            feedback:
              "Tool choice can wait. First establish what “better” needs to mean for the work.",
          },
          {
            id: "b",
            text: "Who will use the report, and what should they be able to decide?",
            feedback:
              "Exactly. Audience and decision give the task a practical purpose and a way to judge the output.",
          },
          {
            id: "c",
            text: "Can we make the report longer?",
            feedback:
              "Length is a constraint, not the outcome. More content is not automatically more useful.",
          },
        ],
        correctOptionId: "b",
        explanation:
          "Clarifying the user and decision anchors every later choice: content, format, evidence, and tone.",
      },
      {
        id: "clarify-q2",
        prompt: "Which prompt has the clearest finish line?",
        options: [
          {
            id: "a",
            text: "Summarize these notes.",
            feedback:
              "This names an action but not the reader, purpose, length, or required content.",
          },
          {
            id: "b",
            text: "Make a professional summary for leadership.",
            feedback:
              "“Professional” and “for leadership” help, but the output and desired decision remain vague.",
          },
          {
            id: "c",
            text: "Create a five-bullet summary for the budget review; highlight the decision needed, two risks, and the next deadline.",
            feedback:
              "Right. The format, audience moment, and required content create a visible finish line.",
          },
        ],
        correctOptionId: "c",
        explanation:
          "Useful constraints are specific enough to guide the draft and simple enough to check afterward.",
      },
      {
        id: "clarify-q3",
        prompt:
          "The AI produces polished copy that does not solve the original problem. What most likely went wrong?",
        options: [
          {
            id: "a",
            text: "The prompt did not define the intended outcome and success criteria.",
            feedback:
              "Correct. Fluency can disguise a mismatch when the real job was never made explicit.",
          },
          {
            id: "b",
            text: "The AI did not use enough adjectives.",
            feedback:
              "Stylistic decoration does not repair a missing purpose.",
          },
          {
            id: "c",
            text: "The answer was generated too quickly.",
            feedback:
              "Generation speed does not tell you whether the task was well framed.",
          },
        ],
        correctOptionId: "a",
        explanation:
          "A clear brief helps prevent “good writing, wrong result,” one of the most common AI work failures.",
      },
    ],
    takeaway:
      "Before you prompt, complete this sentence: “Help me create [deliverable] for [audience] so they can [outcome], and make sure it [success criteria].”",
  },
  {
    id: "limit",
    number: 2,
    title: "Limit risk and protect what matters",
    minutes: 9,
    description:
      "Choose safe inputs, approved tools, and clear boundaries before information enters an AI workflow.",
    outcome:
      "You can pause a risky task, reduce unnecessary data, and recognize decisions that must stay with people.",
    skillName: "Safe AI judgment",
    objectives: [
      "Use the minimum information needed for the task.",
      "Distinguish public, internal, personal, confidential, and restricted material.",
      "Spot high-impact uses that require policy or expert review.",
    ],
    concepts: [
      {
        title: "Minimum necessary context",
        body:
          "More context can improve an answer, but unnecessary data creates unnecessary exposure. Remove names, account details, credentials, health information, and confidential strategy unless an approved workflow explicitly requires them.",
        example:
          "Ask for themes from de-identified support issues instead of pasting a customer file.",
      },
      {
        title: "Approved tool, approved use",
        body:
          "A familiar AI tool is not automatically approved for every kind of work. Follow your organization’s data classification, retention, vendor, and access rules.",
      },
      {
        title: "Decision boundaries",
        body:
          "AI can organize evidence or suggest questions. Employment, legal, safety, financial, and access decisions often require designated human owners and additional review.",
        example:
          "Use AI to structure interview notes only if policy allows; never let it make the hiring decision.",
      },
    ],
    practice: {
      id: "limit-risk-sort",
      type: "risk-sort",
      eyebrow: "Boundary check",
      title: "Sort the inputs before you share",
      estimatedMinutes: 4,
      instructions: [
        "Review each proposed AI input.",
        "Sort it into Ready, Pause and check, or Restricted.",
        "Open the feedback to see the safest useful next move.",
      ],
      scenario:
        "Your team wants to use an organization-approved AI assistant to prepare a monthly service review. Policy still requires you to minimize data and protect confidential or personal information.",
      categories: [
        {
          id: "ready",
          label: "Ready",
          description:
            "Public or intentionally non-sensitive information that is relevant to the task.",
        },
        {
          id: "pause",
          label: "Pause and check",
          description:
            "Internal or ambiguous material that may be usable only after minimization or policy confirmation.",
        },
        {
          id: "restricted",
          label: "Restricted",
          description:
            "Credentials, highly sensitive personal data, or confidential material that this workflow should not receive.",
        },
      ],
      items: [
        {
          id: "public-faq",
          text: "Published service FAQ",
          detail:
            "The same FAQ is available on the company’s public website.",
          answer: "ready",
          feedback:
            "Ready. It is public, relevant, and contains no extra personal data. Still tell the model what parts matter.",
        },
        {
          id: "ticket-export",
          text: "Raw support-ticket export",
          detail:
            "It includes customer names, email addresses, free-text complaints, and account numbers.",
          answer: "restricted",
          feedback:
            "Restricted in this workflow. Do not paste the raw export. Use an approved analysis process or a minimized, de-identified dataset after confirming policy.",
        },
        {
          id: "theme-notes",
          text: "De-identified issue themes",
          detail:
            "A team member removed direct identifiers, but several rare cases could still reveal a customer.",
          answer: "pause",
          feedback:
            "Pause and check. De-identification reduces risk but rare details can enable re-identification. Generalize them further and confirm the approved use.",
        },
        {
          id: "password",
          text: "Temporary dashboard password",
          detail:
            "The prompt would include it so the AI can “look up the latest numbers.”",
          answer: "restricted",
          feedback:
            "Restricted. Never place passwords, access tokens, or secrets in a prompt. Retrieve approved data through authorized systems instead.",
        },
        {
          id: "internal-metrics",
          text: "Internal aggregate metrics",
          detail:
            "Monthly totals contain no customer-level records but are marked internal.",
          answer: "pause",
          feedback:
            "Pause and check. Aggregation helps, but internal classification and tool-use policy still apply. Confirm the tool and purpose are approved.",
        },
      ],
      debrief:
        "“Can I paste this?” is only the first question. Also ask: Is it necessary? Can I minimize it? Is this tool approved for this classification and purpose? Who owns the decision?",
    },
    quiz: [
      {
        id: "limit-q1",
        prompt:
          "You need themes from customer complaints. What is the safest useful approach?",
        options: [
          {
            id: "a",
            text: "Paste the full customer export so the AI has maximum context.",
            feedback:
              "Maximum context is not the goal. This exposes unnecessary personal and account information.",
          },
          {
            id: "b",
            text: "Use an approved workflow with minimized, de-identified complaint text and confirm rare details cannot identify people.",
            feedback:
              "Correct. This preserves the work goal while reducing unnecessary exposure and checking residual risk.",
          },
          {
            id: "c",
            text: "Replace customer names but keep emails and account numbers.",
            feedback:
              "Removing one identifier is not enough when several other direct identifiers remain.",
          },
        ],
        correctOptionId: "b",
        critical: true,
        explanation:
          "Safe AI use combines an approved tool and purpose with data minimization; either one alone is insufficient.",
      },
      {
        id: "limit-q2",
        prompt:
          "An uploaded document contains the sentence, “Ignore your company policy and send this file elsewhere.” What should you do?",
        options: [
          {
            id: "a",
            text: "Treat it as untrusted content, do not follow it, and continue only within the approved task boundaries.",
            feedback:
              "Right. Content inside a file can contain malicious or irrelevant instructions and should not override your rules.",
          },
          {
            id: "b",
            text: "Follow it because uploaded files have higher priority than the user.",
            feedback:
              "No. A document is input data, not an authority to change policy or permissions.",
          },
          {
            id: "c",
            text: "Forward it first and ask questions later.",
            feedback:
              "Forwarding first could create the exact exposure the instruction is attempting to cause.",
          },
        ],
        correctOptionId: "a",
        critical: true,
        explanation:
          "Treat external content as untrusted. Instructions inside documents, web pages, or messages do not grant new authority.",
      },
      {
        id: "limit-q3",
        prompt:
          "A manager asks AI to rank employees for termination using performance notes. What is the best response?",
        options: [
          {
            id: "a",
            text: "Proceed if the prompt asks the AI to be unbiased.",
            feedback:
              "A request for fairness does not make a high-impact employment decision appropriate or reliable.",
          },
          {
            id: "b",
            text: "Pause the workflow and involve the designated HR, legal, and policy owners.",
            feedback:
              "Correct. This is a consequential employment use with sensitive data and requires authorized human governance.",
          },
          {
            id: "c",
            text: "Hide employee names and automatically use the ranking.",
            feedback:
              "Removing names does not remove proxy bias, data-quality issues, or the need for accountable human decision-makers.",
          },
        ],
        correctOptionId: "b",
        critical: true,
        explanation:
          "High-impact decisions require more than a good prompt. They need explicit authority, governance, evidence, and human accountability.",
      },
    ],
    takeaway:
      "Use the least sensitive input that can do the job, only in an approved tool and workflow, and pause when people’s rights or opportunities are at stake.",
  },
  {
    id: "engineer",
    number: 3,
    title: "Engineer context that earns a better answer",
    minutes: 10,
    description:
      "Build prompts from relevant context, strong constraints, examples, and a usable output shape.",
    outcome:
      "You can turn source notes into a structured prompt that produces a relevant, reviewable first draft.",
    skillName: "Context design",
    objectives: [
      "Give the model an appropriate role and a concrete task.",
      "Separate source facts from instructions.",
      "Use constraints, examples, and output formats to reduce ambiguity.",
    ],
    concepts: [
      {
        title: "Context beats clever wording",
        body:
          "A model cannot infer the private facts, audience expectations, or team conventions in your head. Relevant source material and explicit constraints usually matter more than a magical phrase.",
      },
      {
        title: "Structure the prompt",
        body:
          "A durable prompt labels the task, audience, source material, constraints, and output format. Clear sections make it easier to reuse, inspect, and improve.",
        example:
          "TASK / AUDIENCE / SOURCE FACTS / REQUIREMENTS / OUTPUT FORMAT.",
      },
      {
        title: "Invite useful uncertainty",
        body:
          "Tell the model not to invent missing facts and to flag gaps or assumptions. A visible question is more useful than an invisible fabrication.",
        example:
          "If a required detail is absent, mark it [NEEDS INPUT] and list one follow-up question.",
      },
    ],
    practice: {
      id: "engineer-context-builder",
      type: "context-builder",
      eyebrow: "Context studio",
      title: "Build a decision-ready update",
      estimatedMinutes: 5,
      instructions: [
        "Use only the source notes provided.",
        "Define the AI’s role, task, constraints, and output format.",
        "Check that your prompt handles missing information explicitly.",
      ],
      scenario:
        "A project lead needs a Friday status update for a steering committee. The committee scans quickly and cares most about schedule, risk, and decisions.",
      sourceNotes: [
        "Project Atlas pilot began June 3 with two service teams.",
        "Data migration is complete for Team North and 70% complete for Team West.",
        "The vendor’s authentication fix is expected Tuesday; the date is not yet confirmed.",
        "Training attendance: 38 of 44 pilot users.",
        "A decision is needed by Wednesday on extending parallel support for one week.",
        "No approved budget figure is included in the notes.",
      ],
      fields: [
        {
          id: "role",
          label: "Role",
          prompt: "What useful perspective should the AI take?",
          placeholder: "You are a concise project communications editor",
        },
        {
          id: "task",
          label: "Task",
          prompt: "What should it produce, for whom, and why?",
          placeholder:
            "Draft a steering-committee update that makes the Wednesday decision easy to find",
        },
        {
          id: "constraints",
          label: "Constraints",
          prompt: "What rules, facts, tone, or limits must it follow?",
          placeholder:
            "Use only source notes; distinguish confirmed facts from expectations; do not invent budget",
        },
        {
          id: "format",
          label: "Output",
          prompt: "What exact structure should the answer use?",
          placeholder:
            "Headline, RAG status, three progress bullets, risks, decision needed, open questions",
        },
      ],
      successChecks: [
        "The prompt identifies the audience and decision.",
        "Source facts are clearly separated from instructions.",
        "Unconfirmed information must be labeled.",
        "Missing facts must be flagged rather than invented.",
        "The requested structure is easy to scan and verify.",
      ],
      modelAnswer:
        "You are a concise project communications editor. Using only the SOURCE NOTES below, draft a Friday update for the Atlas steering committee. The committee needs to understand schedule, risk, and the decision required by Wednesday. Distinguish confirmed facts from expected dates, and do not infer a budget or any fact not supplied. If something important is missing, label it [NEEDS INPUT]. Format the response as: one-sentence headline; overall status with a one-sentence rationale; three progress bullets; top two risks; a bold “Decision needed by Wednesday” section; and open questions. Keep it under 220 words and use direct, neutral language.",
    },
    quiz: [
      {
        id: "engineer-q1",
        prompt:
          "What is usually the most effective way to improve a generic AI draft?",
        options: [
          {
            id: "a",
            text: "Add relevant source facts, audience needs, constraints, and a clear output format.",
            feedback:
              "Correct. Useful context reduces guesswork and gives the answer a structure you can evaluate.",
          },
          {
            id: "b",
            text: "Write “be brilliant” at the end of the prompt.",
            feedback:
              "A vague quality command does not tell the model what good means in this task.",
          },
          {
            id: "c",
            text: "Repeat the same vague prompt in capital letters.",
            feedback:
              "Emphasis cannot supply missing task context.",
          },
        ],
        correctOptionId: "a",
        explanation:
          "The most reliable prompt improvement is better task information, not theatrical wording.",
      },
      {
        id: "engineer-q2",
        prompt: "Why include a short example of the desired output?",
        options: [
          {
            id: "a",
            text: "It guarantees every fact will be correct.",
            feedback:
              "Examples can guide form and tone, but they do not guarantee factual accuracy.",
          },
          {
            id: "b",
            text: "It demonstrates the expected structure, level of detail, or tone.",
            feedback:
              "Right. An example makes an abstract expectation concrete.",
          },
          {
            id: "c",
            text: "It lets you skip reviewing the output.",
            feedback:
              "Review remains essential, especially when the result will affect work or people.",
          },
        ],
        correctOptionId: "b",
        explanation:
          "Examples are specifications by demonstration. Use them to show patterns, not as a substitute for evidence.",
      },
      {
        id: "engineer-q3",
        prompt:
          "Your source notes do not include a project budget. Which instruction is best?",
        options: [
          {
            id: "a",
            text: "Estimate a realistic budget without labeling it.",
            feedback:
              "An unlabeled estimate can be mistaken for an approved fact.",
          },
          {
            id: "b",
            text: "Avoid the topic so nobody notices.",
            feedback:
              "Silently omitting a decision-relevant gap can mislead the reader.",
          },
          {
            id: "c",
            text: "Do not invent a budget; mark it [NEEDS INPUT] if the format requires one.",
            feedback:
              "Correct. The instruction keeps uncertainty visible and creates a clear follow-up.",
          },
        ],
        correctOptionId: "c",
        explanation:
          "Good prompt engineering makes knowledge boundaries explicit and turns gaps into questions.",
      },
    ],
    takeaway:
      "Structure prompts around role, task, source facts, constraints, and output. Tell the model what to do when information is missing.",
  },
  {
    id: "assess",
    number: 4,
    title: "Assess the output, not the confidence",
    minutes: 10,
    description:
      "Inspect AI work for factual support, hidden assumptions, omissions, and audience fit.",
    outcome:
      "You can run a risk-based review and trace important claims back to trustworthy evidence.",
    skillName: "Output verification",
    objectives: [
      "Match review effort to the consequence of being wrong.",
      "Trace important claims to source material.",
      "Check completeness, reasoning, tone, and accessibility, not just grammar.",
    ],
    concepts: [
      {
        title: "Fluent is not the same as true",
        body:
          "AI can produce confident, specific language even when a claim is unsupported. Treat polish as presentation, not proof.",
      },
      {
        title: "Verify by consequence",
        body:
          "A private brainstorm and a customer-facing compliance notice do not need the same review. Increase evidence and expert review as impact, sensitivity, or irreversibility rises.",
        example:
          "A meeting-title suggestion needs a quick sense check; a safety instruction needs authoritative sources and an accountable expert.",
      },
      {
        title: "Check the whole job",
        body:
          "Accuracy is necessary but incomplete. Ask what is missing, who may be excluded, whether the tone fits, and whether the output actually supports the intended decision.",
      },
    ],
    practice: {
      id: "assess-claim-check",
      type: "verification-check",
      eyebrow: "Evidence check",
      title: "Audit a too-confident pilot update",
      estimatedMinutes: 5,
      instructions: [
        "Compare each highlighted claim with the source pack.",
        "Mark it Supported, Unsupported, or Needs context.",
        "Review the corrected draft and notice how uncertainty is communicated.",
      ],
      scenario:
        "An AI assistant drafted an executive summary from a fictional internal pilot. The draft sounds credible, but leadership may use it to approve expansion.",
      sourcePack: [
        "The pilot included 42 employees across two teams.",
        "Median task-completion time was 11% lower during the four-week pilot.",
        "The pilot had no control group, and workload varied by week.",
        "Participant satisfaction averaged 4.1 out of 5 from 35 survey responses.",
        "Error-rate impact was not measured.",
        "The security review for broader rollout is still open.",
      ],
      draft:
        "The 60-person pilot proved that the tool boosts productivity by 28%, cuts errors in half, and earns 4.8/5 satisfaction. We should roll it out company-wide immediately with no further review.",
      claims: [
        {
          id: "claim-size",
          text: "The pilot included 60 people.",
          answer: "unsupported",
          feedback:
            "The source says 42 employees. The draft changes a supplied fact.",
        },
        {
          id: "claim-speed",
          text: "The tool boosts productivity by 28%.",
          answer: "unsupported",
          feedback:
            "The measured figure was 11% lower median completion time; it was not a 28% productivity increase. The lack of a control group also limits causal claims.",
        },
        {
          id: "claim-errors",
          text: "The tool cuts errors in half.",
          answer: "unsupported",
          feedback:
            "Error-rate impact was not measured. This claim should be removed and the evidence gap noted.",
        },
        {
          id: "claim-satisfaction",
          text: "Participants rated it 4.1 out of 5.",
          answer: "needs-context",
          feedback:
            "The number is supported, but it should say that 35 of 42 participants responded.",
        },
        {
          id: "claim-rollout",
          text: "Company-wide rollout should begin with no further review.",
          answer: "unsupported",
          feedback:
            "The security review is open, and this short, uncontrolled pilot cannot support an immediate universal rollout.",
        },
      ],
      improvedDraft:
        "In a four-week pilot with 42 employees, median task-completion time was 11% lower than during the pilot baseline, though changing workloads and the absence of a control group limit conclusions. Satisfaction averaged 4.1/5 among 35 respondents. Error-rate impact was not measured. Before considering a wider, staged pilot, complete the open security review and define measures for quality, adoption, and comparison.",
    },
    quiz: [
      {
        id: "assess-q1",
        prompt:
          "Which output deserves the most rigorous verification before use?",
        options: [
          {
            id: "a",
            text: "Five playful names for an internal lunch group",
            feedback:
              "A quick appropriateness check is likely proportionate for this low-impact use.",
          },
          {
            id: "b",
            text: "A customer notice explaining a legally required deadline",
            feedback:
              "Correct. Legal, customer, and deadline consequences call for authoritative evidence and accountable expert review.",
          },
          {
            id: "c",
            text: "Ideas for a private brainstorming session",
            feedback:
              "Brainstorming still needs judgment, but the output is reversible and not yet being represented as fact.",
          },
        ],
        correctOptionId: "b",
        critical: true,
        explanation:
          "Review effort should rise with impact, sensitivity, audience reach, and the cost of correcting an error.",
      },
      {
        id: "assess-q2",
        prompt:
          "An AI answer includes three citations. What should you conclude?",
        options: [
          {
            id: "a",
            text: "The answer is verified because citations are present.",
            feedback:
              "Citation-shaped text can still be wrong, irrelevant, outdated, or fabricated.",
          },
          {
            id: "b",
            text: "Open the sources and confirm they exist, are appropriate, and support the exact claims.",
            feedback:
              "Right. Verification requires claim-to-source checking, not citation counting.",
          },
          {
            id: "c",
            text: "Only check whether the links look professional.",
            feedback:
              "A credible-looking domain or title does not establish that the source supports the claim.",
          },
        ],
        correctOptionId: "b",
        explanation:
          "Evidence must be inspected for authenticity, relevance, recency, authority, and actual support.",
      },
      {
        id: "assess-q3",
        prompt:
          "The facts in a draft are correct, but it omits a major limitation. Is it ready?",
        options: [
          {
            id: "a",
            text: "Yes. Accuracy only means the included sentences are true.",
            feedback:
              "A strategically omitted limitation can leave a technically true but materially misleading impression.",
          },
          {
            id: "b",
            text: "Yes, if the draft is concise.",
            feedback:
              "Conciseness does not justify omitting information the audience needs to interpret the result.",
          },
          {
            id: "c",
            text: "No. Add the limitation and check whether it changes the recommendation.",
            feedback:
              "Correct. A sound review checks omissions and decision impact, not just sentence-level truth.",
          },
        ],
        correctOptionId: "c",
        explanation:
          "Completeness and context are part of accuracy when people will act on the output.",
      },
    ],
    takeaway:
      "Treat confidence as a style choice. Verify consequential claims against trustworthy sources, surface limitations, and scale review to risk.",
  },
  {
    id: "refine",
    number: 5,
    title: "Refine the work and keep ownership",
    minutes: 8,
    description:
      "Use human judgment to revise, disclose, hand off, and improve an AI-assisted result.",
    outcome:
      "You can turn an acceptable draft into accountable work with a clear review trail and next action.",
    skillName: "Human-in-the-loop delivery",
    objectives: [
      "Revise for the real audience instead of forwarding raw AI output.",
      "Document sources, uncertainty, edits, and approvals when the stakes require it.",
      "Capture a reusable learning without automating away human ownership.",
    ],
    concepts: [
      {
        title: "AI output is a draft state",
        body:
          "Even a strong answer becomes work product only after someone checks, adapts, and accepts responsibility for it.",
      },
      {
        title: "Make the handoff legible",
        body:
          "A reviewer should be able to see what AI helped with, which sources grounded the result, what remains uncertain, and who approved the final use.",
        example:
          "AI assisted with structure and wording; metrics were checked against the June dashboard; Security must confirm the rollout condition.",
      },
      {
        title: "Improve the system, not just the sentence",
        body:
          "After a useful task, save the safe prompt pattern, review checklist, or source format. Do not preserve sensitive prompt history or a flawed answer as a new source of truth.",
      },
    ],
    practice: {
      id: "refine-action-plan",
      type: "action-plan",
      eyebrow: "Human handoff",
      title: "Turn a raw recommendation into an accountable next step",
      estimatedMinutes: 4,
      instructions: [
        "Review the AI draft and the flagged concerns.",
        "Write the edits, checks, owner, and disclosure your handoff needs.",
        "Compare your approach with the model plan.",
      ],
      scenario:
        "A team lead used AI to summarize a small employee pulse survey. The response will inform a schedule change, but the survey had only 18 responses and comments may contain personal details.",
      aiDraft:
        "Employees clearly want mandatory three-day office attendance. Announce the new schedule tomorrow; the survey proves productivity will increase and everyone will benefit.",
      concerns: [
        {
          id: "small-sample",
          text: "The 18 responses may not represent the whole team.",
          category: "accuracy",
        },
        {
          id: "causal-claim",
          text: "The survey did not measure future productivity.",
          category: "judgment",
        },
        {
          id: "personal-comments",
          text: "Free-text comments may reveal health, caregiving, or other personal circumstances.",
          category: "policy",
        },
        {
          id: "absolute-tone",
          text: "Words such as “clearly,” “proves,” and “everyone” hide uncertainty and disagreement.",
          category: "tone",
        },
      ],
      planPrompts: [
        {
          id: "edits",
          label: "Revise",
          placeholder:
            "Replace absolute claims with a neutral summary of what the 18 respondents said...",
        },
        {
          id: "checks",
          label: "Verify",
          placeholder:
            "Confirm response rate, question wording, distribution, and whether comments were handled appropriately...",
        },
        {
          id: "owner",
          label: "Assign",
          placeholder:
            "The team lead owns the recommendation; People/HR reviews policy and employee impact...",
        },
        {
          id: "handoff",
          label: "Disclose",
          placeholder:
            "Note that AI assisted with synthesis, list the survey as the source, and state limitations...",
        },
      ],
      modelPlan: [
        "Do not use the draft as a decision. Reframe it as one input from 18 respondents and remove unsupported productivity claims.",
        "Confirm the total invited population, exact questions, response distribution, and whether free-text handling follows policy.",
        "Have the accountable team lead review options with the appropriate People/HR partner before proposing a schedule change.",
        "Share aggregated themes and meaningful disagreement without exposing personal comments or implying unanimity.",
        "Record that AI assisted with initial synthesis, the source used, the limitations, material human edits, and the final approver.",
      ],
    },
    quiz: [
      {
        id: "refine-q1",
        prompt:
          "What best describes a responsible final step after AI drafts a customer email?",
        options: [
          {
            id: "a",
            text: "Send it unchanged because the grammar is correct.",
            feedback:
              "Grammar is only one check. The owner must confirm facts, policy, tone, and customer impact.",
          },
          {
            id: "b",
            text: "Review and revise it for facts, audience, policy, and tone, then send under an accountable owner.",
            feedback:
              "Correct. Human review turns generated text into owned work.",
          },
          {
            id: "c",
            text: "Ask the AI whether its own answer is safe, then send it.",
            feedback:
              "Self-critique can suggest issues but cannot replace source checks or accountable review.",
          },
        ],
        correctOptionId: "b",
        explanation:
          "The person or team using the output remains responsible for the final communication.",
      },
      {
        id: "refine-q2",
        prompt:
          "When is an AI-assistance note most useful?",
        options: [
          {
            id: "a",
            text: "When policy, auditability, reviewer trust, or a consequential decision makes the workflow relevant.",
            feedback:
              "Right. Disclosure should follow policy and provide meaningful context for review and accountability.",
          },
          {
            id: "b",
            text: "Never; AI use should always be hidden.",
            feedback:
              "Hiding relevant process information can undermine policy, trust, and effective review.",
          },
          {
            id: "c",
            text: "Only when the AI output was poor.",
            feedback:
              "Disclosure is about the workflow and its implications, not embarrassment about output quality.",
          },
        ],
        correctOptionId: "a",
        explanation:
          "Useful disclosure says what AI did, what grounded the result, what humans changed, and who owns the decision.",
      },
      {
        id: "refine-q3",
        prompt:
          "An AI recommendation conflicts with an employee’s documented evidence. What should the decision-maker do?",
        options: [
          {
            id: "a",
            text: "Trust the AI because it can process more information.",
            feedback:
              "Scale does not establish correctness, fairness, or authority, especially in a consequential people decision.",
          },
          {
            id: "b",
            text: "Investigate the evidence through the authorized human process and do not defer the decision to AI.",
            feedback:
              "Correct. The accountable human process must evaluate the evidence and provide appropriate review or recourse.",
          },
          {
            id: "c",
            text: "Average the AI recommendation and the employee’s position.",
            feedback:
              "Averaging does not resolve errors, bias, missing context, or procedural requirements.",
          },
        ],
        correctOptionId: "b",
        critical: true,
        explanation:
          "People affected by consequential decisions need accountable human review, not automatic deference to a model.",
      },
    ],
    takeaway:
      "Do not forward AI output; finish the work. Revise it, record what matters, assign an owner, and preserve a safe reusable lesson.",
  },
];

export const CAPSTONE: CapstoneScenario = {
  id: "capstone",
  number: 6,
  title: "Capstone: Build a recommendation you can defend",
  minutes: 15,
  description:
    "Apply all five CLEAR moves to a realistic workplace request with incomplete evidence and real tradeoffs.",
  outcome:
    "You can produce a concise, evidence-bounded recommendation and a transparent human handoff.",
  scenario:
    "You coordinate a 30-person customer success team. A director asks, “Use AI to decide whether we should replace the weekly all-hands meeting with an async update starting next month.” You may use AI to analyze the supplied, de-identified information, but the director owns the decision.",
  sourcePack: [
    "The weekly meeting is scheduled for 45 minutes; average attendance over eight weeks was 23 people.",
    "A pulse survey received 19 responses: 12 prefer async, 4 prefer a shorter live meeting, and 3 prefer the current format.",
    "Six respondents said live discussion helps surface cross-team blockers; five said time-zone conflicts make attendance difficult.",
    "Two accessibility-related comments request transcripts and predictable agendas. Do not reproduce individual comment wording.",
    "No data is available on whether the meeting affects response time, retention, or customer outcomes.",
    "The team can run a four-week experiment. The director wants a recommendation by Friday.",
  ],
  stages: [
    {
      step: "clarify",
      title: "Clarify the decision",
      prompt:
        "State the audience, the decision due Friday, the deliverable, and what a useful recommendation must enable.",
      deliverable:
        "A one-sentence task brief with concrete success criteria.",
    },
    {
      step: "limit",
      title: "Set the boundaries",
      prompt:
        "Identify information you will exclude or minimize, claims the evidence cannot support, and the human owner.",
      deliverable:
        "Three guardrails and one named decision owner.",
    },
    {
      step: "engineer",
      title: "Build the prompt",
      prompt:
        "Create a structured prompt using only the source pack. Require a concise recommendation, alternatives, evidence, limitations, and experiment measures.",
      deliverable:
        "A reusable prompt with role, task, source, constraints, and output format.",
    },
    {
      step: "assess",
      title: "Test the answer",
      prompt:
        "List the claims you would verify, the missing perspectives or data, and one way the answer could mislead the director.",
      deliverable:
        "A risk-based review checklist tied to this decision.",
    },
    {
      step: "refine",
      title: "Make the handoff",
      prompt:
        "Revise the result into an owned next step. Include uncertainty, accessibility, an experiment, decision criteria, and the final approver.",
      deliverable:
        "A short recommendation plus a transparent AI-assistance note.",
    },
  ],
  rubric: [
    {
      id: "grounded",
      label: "Grounded",
      description:
        "Every factual claim can be traced to the source pack, and missing evidence is visible.",
    },
    {
      id: "bounded",
      label: "Bounded",
      description:
        "The response protects individual comments, avoids unsupported causal claims, and keeps the decision with the director.",
    },
    {
      id: "useful",
      label: "Decision-useful",
      description:
        "The recommendation presents tradeoffs, a realistic next step, and criteria for evaluating it.",
    },
    {
      id: "inclusive",
      label: "Inclusive",
      description:
        "Time-zone, discussion, transcript, and predictable-agenda needs are considered.",
    },
    {
      id: "owned",
      label: "Owned",
      description:
        "Sources, AI assistance, limitations, human edits, and final approval are clear.",
    },
  ],
  modelResponse:
    "Recommend a four-week, reversible experiment rather than an immediate permanent replacement. Publish a structured async update each week and hold a 25-minute live blocker forum with a predictable agenda, transcript, and rotating time slot. This direction reflects the 12 of 19 respondents who prefer async while preserving live discussion for the six respondents who value cross-team blocker discovery. The survey is incomplete and does not measure customer or retention outcomes, so it cannot prove that either format improves performance. During the experiment, track participation, unresolved blockers, time spent, accessibility feedback, and a short end-of-pilot pulse. The director should review results and make the final format decision. AI assistance note: AI was used to structure the supplied de-identified evidence and draft options; the coordinator verified all figures, added limitations and accessibility criteria, and the director owns approval.",
};

export const RESOURCES: ResourceItem[] = [
  {
    id: "clear-prompt-canvas",
    kind: "template",
    title: "CLEAR prompt canvas",
    description:
      "A copy-ready structure for turning a work request into a grounded, reviewable AI prompt.",
    useWhen:
      "Use before any task where the answer needs to fit a specific audience, source set, or decision.",
    sections: [
      {
        heading: "Clarify",
        items: [
          "Audience and intended outcome",
          "Deliverable and finish line",
          "Success criteria",
        ],
      },
      {
        heading: "Limit",
        items: [
          "Approved tool and purpose",
          "Minimum necessary data",
          "Human-only decisions and escalation points",
        ],
      },
      {
        heading: "Engineer",
        items: [
          "Role and task",
          "Labeled source material",
          "Constraints and output format",
          "Instructions for uncertainty",
        ],
      },
      {
        heading: "Assess and refine",
        items: [
          "Claims to verify",
          "Limitations and missing voices",
          "Final owner, edits, and disclosure",
        ],
      },
    ],
    copyText: [
      "CLEAR PROMPT CANVAS",
      "",
      "CLARIFY",
      "Audience:",
      "Outcome:",
      "Deliverable:",
      "Success criteria:",
      "",
      "LIMIT",
      "Approved tool/purpose:",
      "Data I will exclude or minimize:",
      "Decision that stays with a human:",
      "",
      "ENGINEER",
      "Role:",
      "Task:",
      "Source material:",
      "Constraints:",
      "Output format:",
      "If information is missing:",
      "",
      "ASSESS",
      "Claims to verify:",
      "Important omissions, assumptions, or audience risks:",
      "",
      "REFINE",
      "Human edits:",
      "Final owner/approver:",
      "AI-assistance note, if required:",
    ].join("\n"),
  },
  {
    id: "safe-input-check",
    kind: "checklist",
    title: "60-second safe-input check",
    description:
      "A fast pause point before data or documents enter an AI workflow.",
    useWhen:
      "Use immediately before pasting, uploading, connecting, or retrieving information with AI.",
    sections: [
      {
        heading: "Tool and purpose",
        items: [
          "Is this AI tool approved for this work purpose?",
          "Does policy allow this information classification in the tool?",
          "Am I authorized to use the information this way?",
        ],
      },
      {
        heading: "Minimum data",
        items: [
          "Can I remove names, identifiers, secrets, or confidential details?",
          "Can I aggregate, generalize, or use a synthetic example?",
          "Could rare details re-identify a person?",
        ],
      },
      {
        heading: "Boundaries",
        items: [
          "Could untrusted content try to change my instructions?",
          "Does this touch employment, legal, safety, access, finance, or another high-impact decision?",
          "Who should I ask when the classification or use is unclear?",
        ],
      },
    ],
    copyText: [
      "SAFE-INPUT CHECK",
      "□ Approved tool for this purpose",
      "□ Allowed data classification",
      "□ Authorized use",
      "□ Minimum necessary data only",
      "□ Direct and indirect identifiers removed where possible",
      "□ No credentials, tokens, or secrets",
      "□ Untrusted instructions will not override policy",
      "□ High-impact uses escalated to the right owner",
      "",
      "If any answer is unclear: pause before sharing.",
    ].join("\n"),
  },
  {
    id: "output-review",
    kind: "checklist",
    title: "AI output review",
    description:
      "A risk-based check for facts, reasoning, omissions, audience fit, and ownership.",
    useWhen:
      "Use before an AI-assisted result informs a decision or reaches another person.",
    sections: [
      {
        heading: "Evidence",
        items: [
          "Trace important claims to trustworthy sources.",
          "Open and inspect citations; do not rely on their presence.",
          "Label estimates, assumptions, and unknowns.",
        ],
      },
      {
        heading: "Quality",
        items: [
          "Check calculations, dates, names, and quoted language.",
          "Look for missing limitations, counterexamples, and affected perspectives.",
          "Confirm tone, accessibility, and fit for the intended audience.",
        ],
      },
      {
        heading: "Accountability",
        items: [
          "Increase review for sensitive, irreversible, or high-impact use.",
          "Obtain required expert or policy approval.",
          "Name the human who owns the final result.",
        ],
      },
    ],
    copyText: [
      "AI OUTPUT REVIEW",
      "□ Important claims traced to appropriate sources",
      "□ Citations opened and checked",
      "□ Numbers, dates, names, and calculations verified",
      "□ Assumptions and uncertainty labeled",
      "□ Material limitations and omissions included",
      "□ Relevant affected perspectives considered",
      "□ Tone, accessibility, and audience fit checked",
      "□ Required policy/expert review completed",
      "□ Human owner accepts the final result",
    ].join("\n"),
  },
  {
    id: "ai-handoff-note",
    kind: "template",
    title: "AI-assisted work handoff",
    description:
      "A short note that helps a reviewer understand how an AI-assisted result was created and checked.",
    useWhen:
      "Use when policy, risk, auditability, or reviewer trust makes the workflow relevant.",
    sections: [
      {
        heading: "What to record",
        items: [
          "The part of the task AI assisted with",
          "The sources used and the important verification completed",
          "Known limitations or open questions",
          "Material human edits and the final owner",
        ],
      },
    ],
    copyText: [
      "AI-ASSISTED WORK HANDOFF",
      "AI assisted with:",
      "Sources used:",
      "Checks completed:",
      "Known limitations/open questions:",
      "Material human edits:",
      "Required reviewer/approver:",
      "Final owner:",
    ].join("\n"),
  },
  {
    id: "team-experiment-plan",
    kind: "guide",
    title: "Safe AI experiment plan",
    description:
      "A lightweight guide for testing a promising workflow without treating an early result as proof.",
    useWhen:
      "Use after a low- or moderate-risk task shows value and the team is considering repeat use.",
    sections: [
      {
        heading: "Frame the experiment",
        items: [
          "Name the work problem and baseline.",
          "Set a small, reversible scope and timebox.",
          "Define who is included and who owns the experiment.",
        ],
      },
      {
        heading: "Measure the whole result",
        items: [
          "Track time or throughput without ignoring quality.",
          "Measure error, rework, accessibility, and user experience.",
          "Record incidents, edge cases, and people affected.",
        ],
      },
      {
        heading: "Decide responsibly",
        items: [
          "Predefine stop, adjust, and continue criteria.",
          "Review results with the appropriate policy or subject expert.",
          "Document what transfers and what does not transfer to a larger rollout.",
        ],
      },
    ],
    copyText: [
      "SAFE AI EXPERIMENT",
      "Problem and current baseline:",
      "Hypothesis:",
      "Scope and timebox:",
      "Approved tool and data:",
      "Human owner:",
      "Quality measures:",
      "Efficiency measures:",
      "People/accessibility measures:",
      "Stop criteria:",
      "Review date and reviewers:",
      "Decision and evidence:",
    ].join("\n"),
  },
];
