import { expect, test } from "@playwright/test";
import { openWithProgress } from "./helpers";

test("renders without horizontal overflow at every responsive breakpoint", async ({
  page,
}) => {
  const viewports = [
    { width: 1199, height: 800, mobileNavigation: false },
    { width: 839, height: 800, mobileNavigation: true },
    { width: 539, height: 760, mobileNavigation: true },
    { width: 375, height: 667, mobileNavigation: true },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await openWithProgress(page);

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);

    const mobileNavigation = page.getByRole("navigation", {
      name: "Mobile navigation",
    });
    if (viewport.mobileNavigation) {
      await expect(mobileNavigation).toBeVisible();
      await expect(page.locator(".mobile-header")).toBeVisible();
    } else {
      await expect(
        page.getByRole("complementary", { name: "Primary navigation" }),
      ).toBeVisible();

      const outcomeLineCount = await page
        .locator(".level-selector-heading > p")
        .evaluate((outcome) => {
          const range = document.createRange();
          range.selectNodeContents(outcome);
          return range.getClientRects().length;
        });
      expect(outcomeLineCount).toBe(1);
    }
  }
});

test("supports skip navigation and a keyboard-only progress workflow", async ({ page }) => {
  await openWithProgress(page);

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to course content" });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  const progressButton = page.getByRole("button", {
    name: "Progress",
    exact: true,
  });
  for (let tab = 0; tab < 10; tab += 1) {
    if (await progressButton.evaluate((button) => document.activeElement === button)) {
      break;
    }
    await page.keyboard.press("Shift+Tab");
  }
  await expect(progressButton).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Progress you can see and use." }),
  ).toBeVisible();
});
