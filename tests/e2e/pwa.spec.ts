import { expect, test } from "@playwright/test";
import { openWithProgress } from "./helpers";

const SENSITIVE_PATHS = [
  "/api/pwa-boundary-probe",
  "/signin-with-chatgpt?return_to=%2F",
  "/signout-with-chatgpt?return_to=%2F",
  "/callback?pwa-boundary-probe=1",
] as const;

async function waitForServiceWorker(
  page: Parameters<typeof openWithProgress>[0],
) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
}

test("installs the PWA and restores the application shell offline", async ({
  context,
  page,
}) => {
  await openWithProgress(page);
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifest.webmanifest",
  );

  await waitForServiceWorker(page);

  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Use AI with confidence" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Progress", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Progress you can see and use." }),
  ).toBeVisible();
  await context.setOffline(false);
});

test("never intercepts or caches account APIs and authentication routes", async ({
  context,
  page,
}) => {
  await openWithProgress(page);
  await waitForServiceWorker(page);

  const cachedAfterNetworkRequests = await page.evaluate(async (paths) => {
    for (const path of paths) {
      try {
        await fetch(path, { cache: "no-store", redirect: "manual" });
      } catch {
        // A local production server may not implement the hosting auth endpoints.
      }
    }

    const cached = [];
    for (const cacheName of await caches.keys()) {
      const cache = await caches.open(cacheName);
      for (const path of paths) {
        if (await cache.match(new URL(path, location.origin).href)) {
          cached.push({ cacheName, path });
        }
      }
    }
    return cached;
  }, SENSITIVE_PATHS);
  expect(cachedAfterNetworkRequests).toEqual([]);

  await page.evaluate(async (paths) => {
    const probeCache = await caches.open("pwa-sensitive-route-probe");
    await Promise.all(
      paths.map((path) =>
        probeCache.put(
          new URL(path, location.origin).href,
          new Response(`cached probe for ${path}`),
        ),
      ),
    );
  }, SENSITIVE_PATHS);

  await context.setOffline(true);
  try {
    const outcomes = await page.evaluate(async (paths) =>
      Promise.all(
        paths.map(async (path) => {
          try {
            const response = await fetch(path, {
              cache: "no-store",
              redirect: "manual",
            });
            return { path, outcome: `response:${response.status}` };
          } catch {
            return { path, outcome: "network-error" };
          }
        }),
      ),
    SENSITIVE_PATHS);

    expect(outcomes).toEqual(
      SENSITIVE_PATHS.map((path) => ({ path, outcome: "network-error" })),
    );
  } finally {
    await context.setOffline(false);
  }
});
