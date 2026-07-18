import assert from "node:assert/strict";
import test from "node:test";
import {
  MINIMUM_NODE_VERSION,
  isSupportedNodeVersion,
} from "../scripts/check-node-version.mjs";

test("accepts the minimum supported Node.js version and newer releases", () => {
  assert.equal(MINIMUM_NODE_VERSION, "22.13.0");
  assert.equal(isSupportedNodeVersion("22.13.0"), true);
  assert.equal(isSupportedNodeVersion("v22.14.0"), true);
  assert.equal(isSupportedNodeVersion("23.0.0"), true);
});

test("rejects old or malformed Node.js versions", () => {
  assert.equal(isSupportedNodeVersion("22.12.9"), false);
  assert.equal(isSupportedNodeVersion("21.99.99"), false);
  assert.equal(isSupportedNodeVersion("not-a-version"), false);
});
