/* global self, caches, fetch, Response, URL */

const CACHE_PREFIX = "ai-practice-lab";
const CACHE_VERSION = "2.1.0";
const SHELL_CACHE = `${CACHE_PREFIX}-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-${CACHE_VERSION}`;
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/icon-512.png",
];

async function precacheShell() {
  const cache = await caches.open(SHELL_CACHE);
  const rootResponse = await fetch("/", { cache: "reload" });
  if (!rootResponse.ok) throw new Error("The application shell could not be cached.");
  await cache.put("/", rootResponse.clone());

  const markup = await rootResponse.text();
  const buildAssets = [
    ...markup.matchAll(/(?:src|href)=["']([^"']+)["']/g),
  ]
    .map((match) => match[1])
    .filter((url) => {
      const parsed = new URL(url, self.location.origin);
      return (
        parsed.origin === self.location.origin &&
        (parsed.pathname.startsWith("/assets/") ||
          parsed.pathname.startsWith("/_next/static/"))
      );
    });

  await Promise.allSettled(
    [...new Set([...APP_SHELL.filter((url) => url !== "/"), ...buildAssets])].map(
      async (url) => {
      const response = await fetch(url, { cache: "reload" });
      if (response.ok) await cache.put(url, response);
      },
    ),
  );
}

async function cacheResponse(cacheName, request, response) {
  const cacheControl = response.headers.get("cache-control") ?? "";
  if (
    response.ok &&
    response.type === "basic" &&
    !/(?:no-store|private)/i.test(cacheControl)
  ) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    return await cacheResponse(SHELL_CACHE, request, response);
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (new URL(request.url).pathname === "/") return caches.match("/");
    return new Response("This page is unavailable while offline.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  return cacheResponse(RUNTIME_CACHE, request, response);
}

async function staleWhileRevalidate(event) {
  const cached = await caches.match(event.request);
  const update = fetch(event.request)
    .then((response) => cacheResponse(RUNTIME_CACHE, event.request, response))
    .catch(() => undefined);
  event.waitUntil(update);
  return cached ?? update;
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter(
              (name) =>
                name.startsWith(`${CACHE_PREFIX}-`) &&
                name !== SHELL_CACHE &&
                name !== RUNTIME_CACHE,
            )
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.pathname === "/signin-with-chatgpt" ||
    url.pathname === "/signout-with-chatgpt" ||
    url.pathname === "/callback"
  ) {
    return;
  }

  if (request.mode === "navigate") {
    if (url.pathname === "/") event.respondWith(networkFirst(request));
    return;
  }

  if (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/_next/static/")
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (
    request.destination === "image" ||
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "font" ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(staleWhileRevalidate(event));
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
