import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChatGPTSkillsLab } from "./ChatGPTSkillsLab";
import {
  SKILL_LEVELS,
  SKILL_RED_TEAM_CASES,
  SKILL_ROLE_PROJECTS,
  SKILL_TEST_CASES,
} from "./chatgpt-skills-data";

const OFFICIAL_SKILLS_URLS = [
  "https://help.openai.com/en/articles/20001066-skills-in-chatgpt/",
  "https://openai.com/academy/skills/",
];

const renderSkillsLab = () =>
  renderToStaticMarkup(
    <ChatGPTSkillsLab
      role="Proposals"
      completed={[]}
      onComplete={() => undefined}
      onNotice={() => undefined}
    />,
  );

describe("ChatGPT Skills Lab", () => {
  it("renders all three learning levels and the product comparison", () => {
    const html = renderSkillsLab();

    expect(html).toContain("Build ChatGPT Skills that hold up at work");
    expect(html).toContain("Beginner");
    expect(html).toContain("Intermediate");
    expect(html).toContain("Advanced");
    expect(html).toContain("Skills, GPTs, and Projects");
  });

  it("includes the builder, test bench, and advanced governance practice", () => {
    const html = renderSkillsLab();

    expect(html).toContain("Skill Brief builder");
    expect(html).toContain("Copy SKILL.md");
    expect(html).toContain("Download SKILL.md");
    expect(html).toContain("Simulated test bench");
    expect(html).toContain("Governance and release readiness");
    expect(html.toLowerCase()).toContain("red-team");
    expect(html).toContain('role="group" aria-label="Skill test cases"');
    expect(html).not.toContain('role="tablist"');
    expect(html).toContain('aria-pressed="true"');
  });

  it("links to both official ChatGPT Skills sources", () => {
    const html = renderSkillsLab();

    for (const url of OFFICIAL_SKILLS_URLS) {
      expect(html).toContain(url);
    }
  });

  it("provides three tracked levels and broad role-based practice", () => {
    expect(SKILL_LEVELS.map((level) => level.completionId)).toEqual([
      "chatgpt-skills-beginner",
      "chatgpt-skills-intermediate",
      "chatgpt-skills-advanced",
    ]);
    expect(SKILL_ROLE_PROJECTS.map((project) => project.role)).toEqual(
      expect.arrayContaining([
        "Business Development",
        "Capture Management",
        "Proposals",
        "Solutions",
        "Contracts",
        "Legal",
        "Program Management",
        "Systems Engineering",
        "Cybersecurity",
        "Supply Chain",
        "Finance",
        "Human Resources",
        "Quality",
      ]),
    );
    expect(SKILL_TEST_CASES.map((testCase) => testCase.id)).toEqual([
      "normal",
      "missing",
      "conflict",
      "unsafe",
    ]);
    expect(SKILL_RED_TEAM_CASES).toHaveLength(4);
  });

  it("keeps rendered naming and punctuation within the app rules", () => {
    const html = renderSkillsLab();
    const removedBrand = String.fromCharCode(97, 115, 116, 114, 105, 111, 110);
    const emDash = String.fromCodePoint(0x2014);

    expect(html.toLowerCase()).not.toContain(removedBrand);
    expect(html).not.toContain(emDash);
  });
});
