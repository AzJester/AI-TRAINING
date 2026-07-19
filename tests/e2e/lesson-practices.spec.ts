import { expect, test } from "@playwright/test";
import { openWithProgress } from "./helpers";
import {
  EXPECTED_PRACTICE_TYPES,
  LESSON_TYPE_EXAMPLES,
  type PracticeType,
  type TestModule,
} from "./test-curriculum";

const submitLabels: Record<PracticeType, string> = {
  "rewrite-lab": "Check my rewrite",
  "risk-sort": "Check my decisions",
  "context-builder": "Review my context",
  "verification-check": "Check the evidence",
  "action-plan": "Check my action plan",
};

async function completePractice(
  module: TestModule,
  page: Parameters<typeof openWithProgress>[0],
) {
  const { practice } = module;

  if (practice.type === "rewrite-lab" || practice.type === "context-builder") {
    const fields = page.locator(".builder-fields textarea");
    await expect(fields).toHaveCount(practice.fields.length);
    for (let index = 0; index < practice.fields.length; index += 1) {
      await fields.nth(index).fill(`Clear, specific workplace direction ${index + 1}`);
    }
  } else if (practice.type === "risk-sort") {
    const decisions = page.locator(".sort-item select");
    await expect(decisions).toHaveCount(practice.items.length);
    for (let index = 0; index < practice.items.length; index += 1) {
      await decisions.nth(index).selectOption(practice.items[index].answer);
    }
  } else if (practice.type === "verification-check") {
    const claims = page.locator(".claim-list fieldset");
    await expect(claims).toHaveCount(practice.claims.length);
    for (let index = 0; index < practice.claims.length; index += 1) {
      await claims
        .nth(index)
        .locator(`input[value="${practice.claims[index].answer}"]`)
        .check();
    }
  } else {
    const concerns = page.locator(".concern-list input[type=checkbox]");
    const requiredConcerns = Math.min(3, practice.concerns.length);
    for (let index = 0; index < requiredConcerns; index += 1) {
      await concerns.nth(index).check();
    }
    const planFields = page.locator(".builder-fields textarea");
    await expect(planFields).toHaveCount(practice.planPrompts.length);
    for (let index = 0; index < practice.planPrompts.length; index += 1) {
      await planFields.nth(index).fill(`Named human review checkpoint ${index + 1}`);
    }
  }

  await page.getByRole("button", { name: submitLabels[practice.type] }).click();
  const continueButton = page.getByRole("button", {
    name: /Continue to knowledge check/i,
  });
  await expect(continueButton).toBeVisible();
  await continueButton.click();
  await expect(page.getByRole("heading", { name: "Make the call" })).toBeVisible();
}

test("lesson matrix explicitly covers every supported practice type", () => {
  expect(LESSON_TYPE_EXAMPLES.map((module) => module.practice.type)).toEqual(
    EXPECTED_PRACTICE_TYPES,
  );
});

for (const module of LESSON_TYPE_EXAMPLES) {
  test(`lesson type ${module.practice.type}: ${module.title}`, async ({ page }) => {
    await openWithProgress(page, {
      currentTarget: module.id,
      currentStage: 1,
    });

    await expect(
      page.getByRole("heading", { level: 1, name: module.title }),
    ).toBeVisible();
    await completePractice(module, page);
  });
}
