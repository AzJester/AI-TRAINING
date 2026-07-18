import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import net from "node:net";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));

async function availablePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function waitForServer(url, child, getLogs) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Production server exited early.\n${getLogs()}`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {
      // The listener may not be ready yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Production server did not become ready.\n${getLogs()}`);
}

test("production serves a hydratable page and every referenced asset", async (t) => {
  const port = await availablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const cliPath = fileURLToPath(
    new URL("../node_modules/vinext/dist/cli.js", import.meta.url),
  );
  let logs = "";
  const child = spawn(
    process.execPath,
    [cliPath, "start", "--port", String(port), "--hostname", "127.0.0.1"],
    {
      cwd: projectRoot,
      env: { ...process.env, NO_COLOR: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  child.stdout.on("data", (chunk) => {
    logs += chunk;
  });
  child.stderr.on("data", (chunk) => {
    logs += chunk;
  });
  t.after(() => {
    if (child.exitCode === null) child.kill();
  });

  const response = await waitForServer(baseUrl, child, () => logs);
  assert.match(response.headers.get("content-security-policy") ?? "", /default-src 'self'/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");

  const html = await response.text();
  const assets = [
    ...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g),
  ].map((match) => match[1]);
  assert.ok(assets.length > 0, "The production page did not reference any client assets");

  for (const asset of new Set(assets)) {
    const assetResponse = await fetch(new URL(asset, baseUrl));
    assert.equal(assetResponse.status, 200, `${asset} was not served\n${logs}`);
    assert.match(
      assetResponse.headers.get("content-type") ?? "",
      /(?:javascript|css)/i,
      `${asset} has the wrong content type`,
    );
    assert.match(
      assetResponse.headers.get("cache-control") ?? "",
      /(?:immutable|max-age=31536000)/i,
      `${asset} is missing long-lived caching`,
    );
  }
});
