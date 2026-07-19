# Training content

This directory is the editable content-management layer for the AI training
course. Course authors can revise lessons, quizzes, capstones, and downloadable
resources here without editing React or TypeScript.

## Content map

- `course.json`: course metadata, the five CLEAR steps, and level summaries.
- `levels/<level>/modules.json`: the five lessons and quizzes for one level.
- `levels/<level>/capstone.json`: the capstone for one level.
- `resources.json`: copy-ready checklists, templates, and guides.

Each level is intentionally independent. A change to an advanced quiz, for
example, only touches `levels/advanced/modules.json`.

## Editing workflow

1. Edit the relevant JSON file with a UTF-8-aware editor.
2. Keep existing identifiers stable after release. Learner progress refers to
   module, question, option, practice, and resource IDs.
3. Add a new identifier when adding content; do not reuse an old identifier for
   a different concept.
4. Update `moduleCount`, `minutes`, or other summary fields in `course.json`
   when the underlying content changes.
5. Run `npm run test:component` for a quick content check, then `npm test`
   before publishing.

The application validates every field as it loads. Validation rejects missing
or unknown fields, unsupported practice types, duplicate IDs, invalid quiz
answers, mismatched levels, non-sequential lesson numbers, and inconsistent
course totals. Errors identify the exact JSON path to repair.

## Supported practice types

- `rewrite-lab`: guided prompt rewrite fields and a model answer.
- `risk-sort`: items sorted into ready, pause, or restricted categories.
- `context-builder`: source notes assembled into a grounded prompt.
- `verification-check`: claims checked against a source pack.
- `action-plan`: concerns and human review steps assembled into a plan.

Quizzes identify the correct response with `correctOptionId`; that value must
match an option `id` in the same question. Set `critical` to `true` only
when a learner must answer that question correctly to complete the lesson.

## Implementation boundary

`app/training-data.ts` remains the stable application-facing API.
`app/training/content.ts` loads these documents, and
`app/training/schema.ts` validates them. Content authors should not need to
change those files for ordinary course updates.
