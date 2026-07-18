import { pathToFileURL } from "node:url";

export const MINIMUM_NODE_VERSION = "22.13.0";

function numericParts(version) {
  const match = String(version).trim().match(/^v?(\d+)\.(\d+)\.(\d+)/);
  return match ? match.slice(1).map(Number) : null;
}

export function isSupportedNodeVersion(
  version,
  minimum = MINIMUM_NODE_VERSION,
) {
  const actualParts = numericParts(version);
  const minimumParts = numericParts(minimum);
  if (!actualParts || !minimumParts) return false;

  for (let index = 0; index < minimumParts.length; index += 1) {
    if (actualParts[index] > minimumParts[index]) return true;
    if (actualParts[index] < minimumParts[index]) return false;
  }
  return true;
}

const isMainModule =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule && !isSupportedNodeVersion(process.versions.node)) {
  console.error(
    `AI Practice Lab needs Node.js ${MINIMUM_NODE_VERSION} or newer. You are using ${process.versions.node}.`,
  );
  process.exitCode = 1;
}
