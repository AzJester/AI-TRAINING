# AI Practice Lab

Current release: Version 2.1.0, updated July 18, 2026.

AI Practice Lab is an interactive, self-paced course for people who want to use
AI confidently at work. Three training levels use short lessons, realistic
exercises, and practical capstones to turn AI guidance into repeatable habits.

The course remains private and local-only by default. It does not call an AI
model, require an API key, or upload exercise responses. Learners may separately
opt into account-based progress sync, anonymous usage counters, and aggregate
cohort sharing. Onboarding role families reflect defense-contractor
engineering, cyber, test, program, mission-support, space, business development,
capture, proposal, solutions, contracts, legal, compliance, finance, talent,
communications, and business-operations functions.

Repository: [AzJester/AI-TRAINING](https://github.com/AzJester/AI-TRAINING)

## Public access

The public address is [ai-training.st-dba.com](https://ai-training.st-dba.com).

## What learners can do

- Choose Beginner, Intermediate, or Advanced training.
- Work through 15 focused lessons and three practical capstones.
- Learn the **CLEAR** framework: Clarify, Limit, Engineer, Assess, and Refine.
- Practice with guided exercises and immediate, rule-based feedback.
- Use Creator Studio to select models, design Custom GPT instructions, build
  and test a reusable ChatGPT Skill, compose image prompts, and explore
  role-based examples.
- Search, copy, and bookmark reusable prompt templates.
- Follow a safe-data decision coach before entering workplace information.
- Complete an adaptive knowledge check that returns missed concepts for review.
- Track progress independently for each level and resume in the browser.
- Optionally sync minimized progress across signed-in devices while retaining
  device-only mode.
- Join an instructor cohort with explicit consent; reports contain only
  privacy-thresholded, coarsely rounded aggregate completion statistics.
- Export personal progress, aggregate cohort CSV reports, and a personal
  completion certificate.
- Install the site as a PWA and continue training after the application shell
  has been cached for offline use.
- Reset every saved activity and bookmark to 0 at any time.
- Use the lab comfortably on desktop, tablet, or mobile.

## Training levels

| Level | Focus | Structure |
| --- | --- | --- |
| Beginner | **Use AI with confidence** | Five CLEAR lessons and one capstone |
| Intermediate | **Build reliable AI workflows** | Five CLEAR lessons and one capstone |
| Advanced | **Govern and scale AI systems** | Five CLEAR lessons and one capstone |

Each level is designed as a focused 60-minute path. Progress is calculated per
level, so learners can move between levels without losing completed work.

## Creator Studio

Creator Studio expands the course into eight local, interactive labs:

| Lab | What it produces |
| --- | --- |
| Model Selector | A model recommendation based on task, surface, speed, cost, and depth |
| Custom GPT Builder | Structured instructions with purpose, behavior, boundaries, and quality checks |
| ChatGPT Skills Lab | A three-level skill builder, test bench, and governance capstone |
| Image Prompt Studio | A detailed visual brief for generation or editing |
| Role Use-Case Gallery | Searchable examples for mission, engineering, cyber, program, and business teams |
| Prompt Template Library | Searchable, copyable, and bookmarkable prompt structures |
| Safe-Data Decision Coach | A branching stop, review, or proceed recommendation |
| AI Updates | Dated product guidance linked to official sources |

The role gallery includes business development, capture, proposals, solutions,
contracts, legal, human resources, finance, pricing, procurement, program
management, engineering, software, data, cybersecurity, test, quality,
security, supply chain, logistics, communications, and operations.

### ChatGPT Skills Lab

The ChatGPT Skills Lab teaches learners how to turn a repeatable job into a
reusable workflow. It also explains when to use a Skill, a custom GPT, or a
Project so learners can select the right tool before they start building.

| Level | Learning experience | Result |
| --- | --- | --- |
| Beginner | Define the job, inputs, steps, output format, guardrails, and quality checks in a guided `SKILL.md` builder | A role-aware skill draft that can be copied or downloaded |
| Intermediate | Use a test bench to try expected triggers, non-triggers, edge cases, missing inputs, and unsafe requests | A documented test result and a stronger revision plan |
| Advanced | Apply ownership, approval, versioning, access, monitoring, and retirement controls, then complete a governance and red-team capstone | A review-ready skill package with risks and mitigations |

Examples adapt to the learner's selected role, including proposals, contracts,
legal, solutions, engineering, program management, cybersecurity, finance, and
other mission and business functions. The generated `SKILL.md` can be copied
or downloaded for review, but the lab does not install, upload, publish, or run
the Skill in ChatGPT.

The entire experience is a local-only simulation. Builder entries, test-bench
results, and governance decisions stay in the current visit, while completion
status remains in the current browser. Completing Skills activities contributes to Creator Studio progress.
Using **Reset to 0** clears Skills Lab progress with the other saved training
activities and bookmarks while keeping the selected learner profile.

The curriculum follows these official OpenAI resources:

- [Skills in ChatGPT](https://help.openai.com/en/articles/20001066-skills-in-chatgpt/)
- [Using skills, OpenAI Academy](https://openai.com/academy/skills/)

## Current OpenAI guidance

The model and product lessons are dated so users know when to recheck them.
Guidance in this release was verified on July 18, 2026 against official OpenAI
sources:

- [ChatGPT model guidance](https://help.openai.com/en/articles/20001354-gpt-56-in-chatgpt)
- [OpenAI API model catalog](https://developers.openai.com/api/docs/models)
- [Creating and editing GPTs](https://help.openai.com/en/articles/8554397-creating-a-gpt)
- [Skills in ChatGPT](https://help.openai.com/en/articles/20001066-skills-in-chatgpt/)
- [Using skills, OpenAI Academy](https://openai.com/academy/skills/)
- [Image generation guidance](https://developers.openai.com/api/docs/guides/image-generation)

Model access depends on the user's plan, workspace settings, approved tools,
and rollout status. The app does not make API calls or claim that a model is
available in a specific workplace.

## Run it locally

### Requirements

- [Node.js](https://nodejs.org/) 22.13 or newer
- npm (included with Node.js)

No environment variables or external service credentials are required.

### Install and start

On Windows, the simplest option is to double-click **Start AI Training.cmd** in
this folder. It prepares the project when needed, starts the course, and opens
it in the default browser.

Or start it from PowerShell:

```powershell
cd C:\Users\shane\OneDrive\Documents\GitHub\AI-TRAINING
npm install
npm run dev
```

Open the local URL printed in the terminal (normally
`http://localhost:3000`). Changes under `app/` reload automatically.

To stop the development server, press `Ctrl+C` in its terminal.

## Validate a production build

```powershell
npm run lint
npm test
```

`npm test` creates a production build, checks its server-rendered HTML, and runs
the unit and component suites. The browser suite covers all five lesson practice
types, the capstone, downloads, responsive breakpoints, keyboard-only use,
offline recovery, and automated Axe checks:

```powershell
npx playwright install chromium
npm run test:e2e
npm run test:accessibility
```

To build or run the production output separately:

```powershell
npm run build
npm run start
```

## Course design

AI Practice Lab is deliberately local-first. Course content and exercise logic
ship with the application, while learner progress is stored in the current
browser. Clearing browser storage or switching browsers starts a fresh course
unless the learner explicitly enables account sync.

Each level introduces one idea at a time, then asks the learner to apply it
before moving on. Every level covers clarifying the job, limiting risk,
engineering context, assessing output, and refining the work while keeping
human ownership. A level-specific capstone combines those skills in a realistic
scenario. A printable completion summary provides a lightweight record of the
learner's work. Cohort reporting is completion-oriented, aggregate-only, and
unavailable until at least five members have both opted into sharing and synced
progress. Published values are rounded into coarse privacy bands so successive
reports do not expose exact small-group averages. It is not personnel evaluation
or an externally verified credential.

## Content management

Lessons, quizzes, capstones, course metadata, and downloadable resources live
under `content/` as validated JSON. Authors can update ordinary curriculum copy
without editing TypeScript. Keep published identifiers stable because local and
synced learner progress references them. See [`content/README.md`](content/README.md)
for the schema, supported practice types, and editing workflow.

## Project structure

```text
app/                 Application shell and independently maintained features
content/             Validated JSON lessons, quizzes, capstones, and resources
db/                  Drizzle schema for optional hosted features
drizzle/             Versioned D1 migrations
public/              Static assets
tests/               Rendered HTML and Playwright browser tests
worker/              Worker entry point and privacy-preserving APIs
.github/workflows/   Quality, Lighthouse, link, and freshness automation
.openai/hosting.json OpenAI Sites hosting bindings
```

The application uses React, Next.js-compatible routing through
[vinext](https://github.com/cloudflare/vinext), responsive CSS, and the
Cloudflare Vite plugin.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create the production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Check the project with ESLint |
| `npm test` | Build and run all rendered HTML and component tests |
| `npm run test:component` | Run the focused level and course contract tests |
| `npm run test:e2e` | Run Playwright practice, capstone, download, responsive, keyboard, and PWA tests |
| `npm run test:accessibility` | Run Axe checks in Playwright |
| `npm run db:generate` | Generate a migration after an intentional D1 schema change |

## Privacy, sync, and reset behavior

- **Local-only is the default.** A fresh browser makes no progress-sync or
  analytics requests. Exercise answers, capstone drafts, prompt text, generated
  Skill content, and onboarding task descriptions are never synced.
- **Account sync is optional.** After explicit sign-in and opt-in, the service
  stores only bounded completion state, best quiz scores, bookmarks, course
  position, role category, and confidence. Account email is normalized and
  converted to a keyed one-way identifier before database access; it is not
  stored in application tables.
- **Analytics is a separate opt-in.** Only allowlisted daily counters are kept
  for onboarding completion, lesson starts and incomplete exits, quiz retries,
  and Studio activity. Counters older than 13 months are purged during routine
  page, API, and scheduled worker maintenance. No raw event, session identifier,
  prompt content, or account/cohort join is stored.
- **Cohort sharing is a third explicit choice.** Instructors receive no roster or
  learner-level rows. Completion metrics and CSV exports remain suppressed below
  five synced members, use coarse privacy rounding, and stop including a learner
  immediately after they leave.
- **Deletion preserves user control.** Stopping sync leaves the cloud copy in
  place; deleting the cloud copy also removes owned cohorts and memberships while
  retaining progress on the current device. A deletion tombstone prevents another
  device from automatically recreating the cloud copy; uploading again requires
  a new explicit sync choice. Reset increments a sync epoch so an older device
  cannot restore cleared achievements.

Use **Reset to 0** or open **Progress**, then **Reset all progress to 0**, to
clear lessons, quizzes, Creator Studio activity, and bookmarks while keeping the
selected learner profile.

## Attribution

Created by Dr Shane Turner. © 2026 Dr Shane Turner. All rights reserved.

## Accessibility

The interface is designed for keyboard navigation, clear focus states,
responsive layouts, reduced-motion preferences, and readable contrast. CI runs
Axe browser checks and Lighthouse accessibility budgets on each change. A
scheduled workflow also checks external links and fails when dated model
guidance has not been re-verified within its freshness window.
