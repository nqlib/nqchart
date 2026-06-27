import { readFileSync } from "node:fs";
import { join } from "node:path";

import { parseSkillDescription } from "./parse-skill-frontmatter";

export const AGENT_SKILLS_SCHEMA =
  "https://schemas.agentskills.io/discovery/0.2.0/schema.json";

export type AgentSkillIndexEntry = {
  name: string;
  type: "skill-md";
  description: string;
  url: string;
};

export type AgentSkillsIndex = {
  $schema: string;
  skills: AgentSkillIndexEntry[];
};

const CONSUMER_FALLBACK =
  "Build dashboards with composable BeeCharts — install @beecharts/* via shadcn, compose Bee*Chart children, theme colors, BI recipes.";
const DEV_FALLBACK =
  "Contribute to BeeCharts — engine, registry, examples, chart-recipes.";
const DOCS_FALLBACK =
  "BeeCharts docs site — Fumadocs MDX, ComponentPreview, landing, agent HTTP routes.";

function readSkillDescription(skillDir: string, fallback: string): string {
  return parseSkillDescription(
    readFileSync(join(skillDir, "SKILL.md"), "utf8"),
    fallback,
  );
}

/** Build agentskills.io index from skill source directories (same shape as sync script). */
export function buildAgentSkillsIndex(root = process.cwd()): AgentSkillsIndex {
  return {
    $schema: AGENT_SKILLS_SCHEMA,
    skills: [
      {
        name: "beecharts",
        type: "skill-md",
        description: readSkillDescription(
          join(root, "skills/consumer/beecharts"),
          CONSUMER_FALLBACK,
        ),
        url: "/.well-known/agent-skills/beecharts/SKILL.md",
      },
      {
        name: "beecharts-dev",
        type: "skill-md",
        description: readSkillDescription(
          join(root, ".agents/skills/beecharts-dev"),
          DEV_FALLBACK,
        ),
        url: "/.well-known/agent-skills/beecharts-dev/SKILL.md",
      },
      {
        name: "beecharts-docs",
        type: "skill-md",
        description: readSkillDescription(
          join(root, ".agents/skills/beecharts-docs"),
          DOCS_FALLBACK,
        ),
        url: "/.well-known/agent-skills/beecharts-docs/SKILL.md",
      },
    ],
  };
}
