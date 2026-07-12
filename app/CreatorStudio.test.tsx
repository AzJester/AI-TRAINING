import { readFile } from "node:fs/promises";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CreatorStudio } from "./CreatorStudio";
import {
  MODEL_CHOICES,
  OFFICIAL_SOURCES,
  PROMPT_TEMPLATES,
  ROLE_USE_CASES,
} from "./creator-studio-data";

const STUDIO_AND_INSTRUCTOR_SOURCES = [
  new URL("./CreatorStudio.tsx", import.meta.url),
  new URL("./creator-studio.css", import.meta.url),
  new URL("./creator-studio-data.ts", import.meta.url),
  new URL("./InstructorPanel.tsx", import.meta.url),
  new URL("./instructor-panel.css", import.meta.url),
];

const MAJOR_SECTION_LABELS = [
  "Creator Studio",
  "Model Selector",
  "Custom GPT",
  "Skills",
  "Images",
  "Use Cases",
  "Templates",
  "Safety",
  "Updates",
];

const CURRENT_MODEL_NAMES = [
  "GPT-5.5 Instant",
  "GPT-5.6 Sol",
  "GPT-5.6 Terra",
  "GPT-5.6 Luna",
  "GPT Image 2",
];

const EXPECTED_OFFICIAL_URLS = [
  "https://developers.openai.com/api/docs/guides/latest-model",
  "https://help.openai.com/en/articles/20001354-gpt-56-in-chatgpt",
  "https://help.openai.com/en/articles/8554397-creating-a-gpt",
  "https://developers.openai.com/codex/skills",
  "https://developers.openai.com/api/docs/guides/image-generation",
];

describe("Creator Studio", () => {
  it("renders navigation for every major studio section", () => {
    const html = renderToStaticMarkup(
      <CreatorStudio
        role="Program Management"
        completed={[]}
        bookmarks={[]}
        onComplete={vi.fn()}
        onToggleBookmark={vi.fn()}
        onNotice={vi.fn()}
      />,
    );

    for (const label of MAJOR_SECTION_LABELS) {
      expect(html, `Missing Creator Studio section: ${label}`).toContain(label);
    }
  });

  it("provides broad role and prompt coverage", () => {
    expect(ROLE_USE_CASES.length).toBeGreaterThanOrEqual(15);
    expect(PROMPT_TEMPLATES.length).toBeGreaterThanOrEqual(18);
  });

  it("includes the current model set", () => {
    const modelNames = MODEL_CHOICES.map((model) => model.name);

    expect(modelNames).toEqual(expect.arrayContaining(CURRENT_MODEL_NAMES));
  });

  it("links every guidance area to an official source", () => {
    const sourceUrls = OFFICIAL_SOURCES.map((source) => source.url);

    expect(sourceUrls).toEqual(expect.arrayContaining(EXPECTED_OFFICIAL_URLS));
    expect(sourceUrls.every((url) => url.startsWith("https://"))).toBe(true);
    expect(
      sourceUrls.every((url) => {
        const hostname = new URL(url).hostname;
        return hostname === "developers.openai.com" || hostname === "help.openai.com";
      }),
    ).toBe(true);
  });

  it("keeps naming and punctuation rules across the new feature source", async () => {
    const removedBrand = ["ast", "rion"].join("");
    const emDash = String.fromCodePoint(0x2014);

    for (const file of STUDIO_AND_INSTRUCTOR_SOURCES) {
      const source = await readFile(file, "utf8");

      expect(
        source.toLowerCase(),
        `${file.pathname} contains removed company branding`,
      ).not.toContain(removedBrand);
      expect(source, `${file.pathname} contains an em dash`).not.toContain(emDash);
    }
  });
});
