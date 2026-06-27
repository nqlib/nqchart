import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/source", () => ({
  source: { getPages: () => [] },
}));

import {
  buildAgentSkillsIndex,
  AGENT_SKILLS_SCHEMA,
} from "../agent-skills-index";
import {
  generateSkillMd,
  getAgentSkillsIndex,
  readConsumerSkillFile,
} from "../agent-docs";
import { parseSkillDescription } from "../parse-skill-frontmatter";

describe("parse-skill-frontmatter", () => {
  it("parses folded YAML description", () => {
    const md = `---
name: test
description: >-
  Line one
  line two
---
`;
    expect(parseSkillDescription(md, "fallback")).toBe("Line one line two");
  });

  it("returns fallback when description is missing", () => {
    expect(parseSkillDescription("---\nname: test\n---\n", "fallback")).toBe(
      "fallback",
    );
  });
});

describe("agent-skills-index", () => {
  it("builds index with schema and three skills", () => {
    const index = buildAgentSkillsIndex();
    expect(index.$schema).toBe(AGENT_SKILLS_SCHEMA);
    expect(index.skills).toHaveLength(3);
    expect(index.skills.map((s) => s.name)).toEqual([
      "beecharts",
      "beecharts-dev",
      "beecharts-docs",
    ]);
  });

  it("matches synced index.json when present", () => {
    const built = buildAgentSkillsIndex();
    const loaded = getAgentSkillsIndex();
    expect(loaded.$schema).toBe(built.$schema);
    expect(loaded.skills.map((s: { name: string }) => s.name)).toEqual(
      built.skills.map((s) => s.name),
    );
  });
});

describe("agent-docs", () => {
  it("reads consumer SKILL.md from SOT", () => {
    const skill = readConsumerSkillFile("SKILL.md");
    expect(skill).toMatch(/^---\nname: beecharts/);
    expect(skill).toContain("Success gates");
  });

  it("generateSkillMd matches SOT", () => {
    expect(generateSkillMd()).toBe(readConsumerSkillFile("SKILL.md"));
  });

  it("getAgentSkillsIndex includes consumer NOT-for-contributing copy", () => {
    const index = getAgentSkillsIndex();
    expect(index.skills[0].description).toContain("NOT for contributing");
  });
});
