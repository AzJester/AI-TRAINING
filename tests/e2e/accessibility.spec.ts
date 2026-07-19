import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { openWithProgress } from "./helpers";
import { BEGINNER_MODULES } from "./test-curriculum";

test.use({ serviceWorkers: "block" });

async function expectNoAxeViolations(page: Parameters<typeof openWithProgress>[0]) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
}

test("dashboard meets automated WCAG A and AA checks", async ({ page }) => {
  await openWithProgress(page);
  await expectNoAxeViolations(page);
});

test("lesson practice meets automated WCAG A and AA checks", async ({ page }) => {
  const lesson = BEGINNER_MODULES[0];
  await openWithProgress(page, {
    currentTarget: lesson.id,
    currentStage: 1,
  });
  await expectNoAxeViolations(page);
});

test("onboarding dialog meets automated WCAG A and AA checks", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("dialog")).toBeVisible();
  await expectNoAxeViolations(page);
});
