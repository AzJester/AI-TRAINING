/* global console */

import { readFile } from "node:fs/promises";

const source = await readFile("app/creator-studio-data.ts", "utf8");
const dateMatch = source.match(
  /export const STUDIO_VERIFIED_ON\s*=\s*"(\d{4}-\d{2}-\d{2})"/,
);

if (!dateMatch) {
  throw new Error("STUDIO_VERIFIED_ON is missing from creator-studio-data.ts.");
}

const verifiedOn = new Date(`${dateMatch[1]}T00:00:00Z`);
const ageInDays = Math.floor((Date.now() - verifiedOn.getTime()) / 86_400_000);
const maximumAgeInDays = 45;

if (!Number.isFinite(verifiedOn.getTime())) {
  throw new Error(`Invalid model-guidance review date: ${dateMatch[1]}`);
}
if (ageInDays < -2) {
  throw new Error(`Model-guidance review date is unexpectedly in the future: ${dateMatch[1]}`);
}
if (ageInDays > maximumAgeInDays) {
  throw new Error(
    `Model guidance was last reviewed ${ageInDays} days ago. Re-check official sources and update STUDIO_VERIFIED_ON.`,
  );
}

const officialUrls = [
  ...source.matchAll(/(?:url|sourceUrl):\s*"(https:\/\/(?:developers\.openai\.com|help\.openai\.com|openai\.com)\/[^"\s]+)"/g),
].map((match) => match[1]);
const modelNames = [
  ...source.matchAll(/\n\s+name:\s*"((?:GPT|o\d)[^"\n]+)"/g),
].map((match) => match[1]);

if (new Set(officialUrls).size < 4) {
  throw new Error("Expected at least four official OpenAI references for model guidance.");
}
if (new Set(modelNames).size < 3) {
  throw new Error("Expected at least three named models in the model-selection guidance.");
}

console.log(
  `Model guidance reviewed ${ageInDays} day(s) ago; checking ${new Set(officialUrls).size} official references and ${new Set(modelNames).size} named models.`,
);
