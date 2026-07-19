import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const HOST = "127.0.0.1";
const PORT = "4174";
const URL = `http://${HOST}:${PORT}/`;
const projectRoot = process.cwd();
const serverOutput = [];

function rememberOutput(chunk) {
  serverOutput.push(String(chunk));
  if (serverOutput.length > 80) serverOutput.shift();
}

async function isReady() {
  try {
    const response = await fetch(URL, { signal: AbortSignal.timeout(2_000) });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer(server) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Vinext exited before Playwright started.\n${serverOutput.join("")}`);
    }
    if (await isReady()) return;
    await delay(250);
  }
  throw new Error(`Vinext did not become ready at ${URL}.\n${serverOutput.join("")}`);
}

async function stopServer(server) {
  if (server.exitCode !== null) return;
  const closed = new Promise((resolve) => server.once("close", resolve));
  server.kill("SIGTERM");
  await Promise.race([closed, delay(2_000)]);
  if (server.exitCode === null) {
    server.kill("SIGKILL");
    await Promise.race([closed, delay(2_000)]);
  }
}

if (await isReady()) {
  throw new Error(
    `Port ${PORT} is already serving a page. Stop that server before running Playwright.`,
  );
}

const server = spawn(
  process.execPath,
  [
    "node_modules/vinext/dist/cli.js",
    "start",
    "--hostname",
    HOST,
    "--port",
    PORT,
  ],
  {
    cwd: projectRoot,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  },
);
server.stdout.on("data", rememberOutput);
server.stderr.on("data", rememberOutput);

try {
  await waitForServer(server);
  const playwright = spawn(
    process.execPath,
    ["node_modules/@playwright/test/cli.js", "test", ...process.argv.slice(2)],
    {
      cwd: projectRoot,
      env: { ...process.env, PLAYWRIGHT_EXTERNAL_SERVER: "1" },
      stdio: "inherit",
      windowsHide: true,
    },
  );
  const exitCode = await new Promise((resolve, reject) => {
    playwright.once("error", reject);
    playwright.once("close", (code) => resolve(code ?? 1));
  });
  if (exitCode !== 0 && serverOutput.length) {
    process.stderr.write(`\nVinext output:\n${serverOutput.join("")}\n`);
  }
  process.exitCode = exitCode;
} finally {
  await stopServer(server);
}
