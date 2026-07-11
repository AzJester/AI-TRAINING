# AI Practice Lab

AI Practice Lab is an interactive, self-paced course for people who want to use
AI confidently at work. Three training levels use short lessons, realistic
exercises, and practical capstones to turn AI guidance into repeatable habits.

The course runs entirely in the browser. It does not call an AI service, require
an API key, or send learner responses to a backend. Onboarding role families
reflect Astrion's engineering, cyber, test, program, mission-support, space,
business development, capture, proposal, solutions, contracts, legal,
compliance, finance, talent, communications, and business-operations functions.

## Live course

[Open AI Practice Lab](https://astrion-ai-practice-lab.drjester.chatgpt.site/)

The public course runs in a normal web browser. Learners do not need PowerShell,
an installation, or access to this repository.

## What learners can do

- Choose Beginner, Intermediate, or Advanced training.
- Work through 15 focused lessons and three practical capstones.
- Learn the **CLEAR** framework: Clarify, Limit, Engineer, Assess, and Refine.
- Practice with guided exercises and immediate, rule-based feedback.
- Track progress independently for each level and resume in the browser.
- Review course completion and print a personal summary.
- Use the lab comfortably on desktop, tablet, or mobile.

## Training levels

| Level | Focus | Structure |
| --- | --- | --- |
| Beginner | **Use AI with confidence** | Five CLEAR lessons and one capstone |
| Intermediate | **Build reliable AI workflows** | Five CLEAR lessons and one capstone |
| Advanced | **Govern and scale AI systems** | Five CLEAR lessons and one capstone |

Each level is designed as a focused 60-minute path. Progress is calculated per
level, so learners can move between levels without losing completed work.

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
learner's work.

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

Learner input stays in the browser; this version has no analytics, account
system, or remote AI requests. Use **Progress**, then **Reset course progress**,
to start over while keeping the selected role profile.

## Attribution

Created by Dr Shane Turner. © 2026 Dr Shane Turner. All rights reserved.

## Accessibility

The interface is designed for keyboard navigation, clear focus states,
responsive layouts, reduced-motion preferences, and readable contrast. Please
include keyboard and mobile-width checks when reviewing UI changes.
