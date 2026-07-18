import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the AI Practice Lab course shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  const visibleHtml = html.replaceAll("<!-- -->", "");
  assert.match(html, /<title>AI Practice Lab<\/title>/i);
  assert.match(html, /Use AI with confidence/i);
  assert.match(html, /\bCLEAR\b/i);
  assert.match(html, /Course path/i);
  assert.match(html, /Created by Dr Shane Turner/i);
  assert.match(visibleHtml, /Version 2\.0\.2/i);
  assert.match(visibleHtml, /Updated July 18, 2026/i);
  assert.match(html, /© 2026 Dr Shane Turner\. All rights reserved\./i);
  assert.match(html, /href="\/favicon\.ico"/i);
  assert.match(html, /href="\/favicon-32x32\.png"/i);
  assert.match(html, /href="\/icon-512\.png"/i);
  assert.match(html, /href="\/apple-touch-icon\.png"/i);
});

test("does not ship the starter preview", async () => {
  const response = await render();
  const html = await response.text();

  assert.doesNotMatch(html, /codex-preview/i);
  assert.doesNotMatch(html, /Your site is taking shape/i);
  assert.doesNotMatch(html, /Codex is (?:working|building)/i);
  assert.doesNotMatch(html, /react-loading-skeleton/i);
});

test("keeps em dashes out of application source", async () => {
  const appRoot = new URL("../app/", import.meta.url);
  const files = await readdir(appRoot, { withFileTypes: true });

  for (const file of files) {
    if (!file.isFile() || !/\.(?:ts|tsx|css)$/i.test(file.name)) continue;
    const source = await readFile(new URL(file.name, appRoot), "utf8");
    assert.doesNotMatch(source, /\u2014/u, `${file.name} contains an em dash`);
  }
});
