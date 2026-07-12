# AI Practice Lab

AI Practice Lab is an interactive, self-paced course for people who want to use
AI confidently at work. Three training levels use short lessons, realistic
exercises, and practical capstones to turn AI guidance into repeatable habits.

The course runs entirely in the browser. It does not call an AI service, require
an API key, or send learner responses to a backend. Onboarding role families
reflect defense-contractor engineering, cyber, test, program, mission-support, space,
business development, capture, proposal, solutions, contracts, legal,
compliance, finance, talent, communications, and business-operations functions.

Repository: [AzJester/AI-TRAINING](https://github.com/AzJester/AI-TRAINING)

## What learners can do

- Choose Beginner, Intermediate, or Advanced training.
- Work through 15 focused lessons and three practical capstones.
- Learn the **CLEAR** framework: Clarify, Limit, Engineer, Assess, and Refine.
- Practice with guided exercises and immediate, rule-based feedback.
- Use Creator Studio to select models, design Custom GPT instructions, build a
  `SKILL.md`, compose image prompts, and explore role-based examples.
- Search, copy, and bookmark reusable prompt templates.
- Follow a safe-data decision coach before entering workplace information.
- Complete an adaptive knowledge check that returns missed concepts for review.
- Track progress independently for each level and resume in the browser.
- Review local instructor analytics, export progress, and download a personal
  completion certificate.
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
| Codex Skills Workshop | A reusable `SKILL.md` file and recommended skill folder structure |
| Image Prompt Studio | A detailed visual brief for generation or editing |
| Role Use-Case Gallery | Searchable examples for mission, engineering, cyber, program, and business teams |
| Prompt Template Library | Searchable, copyable, and bookmarkable prompt structures |
| Safe-Data Decision Coach | A branching stop, review, or proceed recommendation |
| AI Updates | Dated product guidance linked to official sources |

The role gallery includes business development, capture, proposals, solutions,
contracts, legal, human resources, finance, pricing, procurement, program
management, engineering, software, data, cybersecurity, test, quality,
security, supply chain, logistics, communications, and operations.

## Current OpenAI guidance

The model and product lessons are dated so users know when to recheck them.
Guidance in this release was verified on July 12, 2026 against official OpenAI
sources:

- [ChatGPT model guidance](https://help.openai.com/en/articles/20001354-gpt-56-in-chatgpt)
- [OpenAI API model catalog](https://developers.openai.com/api/docs/models)
- [Creating and editing GPTs](https://help.openai.com/en/articles/8554397-creating-a-gpt)
- [Building Codex Skills](https://developers.openai.com/codex/skills)
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
the three-level component contract tests. To build or run the production output
separately:

```powershell
npm run build
npm run start
```

## Course design

AI Practice Lab is deliberately local-first. Course content and exercise logic
ship with the application, while learner progress is stored in the current
browser. Clearing browser storage or switching browsers starts a fresh course.

Each level introduces one idea at a time, then asks the learner to apply it
before moving on. Every level covers clarifying the job, limiting risk,
engineering context, assessing output, and refining the work while keeping
human ownership. A level-specific capstone combines those skills in a realistic
scenario. A printable completion summary provides a lightweight record of the
learner's work. The instructor view is a snapshot of this browser only. It is
not team analytics, personnel evaluation, or an externally verified credential.

## Project structure

```text
app/                 Application routes, course UI, and styles
public/              Static assets
tests/               Rendered HTML smoke tests
worker/              Cloudflare Worker entry point
.openai/hosting.json Optional OpenAI Sites hosting bindings
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

## Privacy and reset behavior

Learner input stays in the browser. This version has no analytics, account
system, remote AI requests, or organization-wide tracking. Use the visible
**Reset to 0** control or open **Progress**, then **Reset all progress to 0**,
to clear lessons, quizzes, Creator Studio activity, and bookmarks while keeping
the selected learner profile.

## Attribution

Created by Dr Shane Turner. © 2026 Dr Shane Turner. All rights reserved.

## Accessibility

The interface is designed for keyboard navigation, clear focus states,
responsive layouts, reduced-motion preferences, and readable contrast. Please
include keyboard and mobile-width checks when reviewing UI changes.
