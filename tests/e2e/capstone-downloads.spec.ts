import { expect, test } from "@playwright/test";
import { openWithProgress } from "./helpers";
import {
  BEGINNER_CAPSTONE,
  BEGINNER_MODULES,
  CAPSTONE_VARIANTS,
} from "./test-curriculum";

for (const { id: levelId, modules, capstone } of CAPSTONE_VARIANTS) {
  test(`capstone variant ${levelId}: ${capstone.title}`, async ({ page }) => {
    await openWithProgress(page, {
      selectedLevel: levelId,
      completedModules: modules.map((module) => module.id),
      currentTarget: capstone.id,
      currentStage: 0,
    });

    await expect(
      page.getByRole("heading", { level: 1, name: capstone.title }),
    ).toBeVisible();
    await page.getByRole("button", { name: /Enter the workbench/i }).click();

    const responses = page.locator(".capstone-response textarea");
    await expect(responses).toHaveCount(capstone.stages.length);
    for (let index = 0; index < capstone.stages.length; index += 1) {
      await responses
        .nth(index)
        .fill(`Documented CLEAR decision with supporting evidence ${index + 1}`);
    }

    const reviewChecks = page.locator(".rubric-checklist input[type=checkbox]");
    await expect(reviewChecks).toHaveCount(capstone.rubric.length);
    for (let index = 0; index < capstone.rubric.length; index += 1) {
      await reviewChecks.nth(index).check();
    }

    await page.getByRole("button", { name: "Score my capstone" }).click();
    await expect(
      page.getByRole("heading", { name: "You can stand behind this workflow" }),
    ).toBeVisible();
    await page.getByRole("button", { name: /Complete the course/i }).click();
    await expect(
      page.getByText(new RegExp(`${levelId.toUpperCase()} LEVEL COMPLETE`, "i")),
    ).toBeVisible();
  });
}

test("downloads a progress export and completed-level certificate", async ({ page }) => {
  await openWithProgress(page, {
    completedModules: BEGINNER_MODULES.map((module) => module.id),
    completedCapstones: [BEGINNER_CAPSTONE.id],
    quizScores: Object.fromEntries(BEGINNER_MODULES.map((module) => [module.id, 3])),
  });

  await page.getByRole("button", { name: "Progress", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Progress you can see and use." }),
  ).toBeVisible();

  const exportDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export progress" }).click();
  expect((await exportDownload).suggestedFilename()).toBe(
    "ai-practice-lab-progress.json",
  );

  const certificateDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download certificate" }).click();
  expect((await certificateDownload).suggestedFilename()).toBe(
    "ai-practice-lab-beginner-certificate.html",
  );
});
