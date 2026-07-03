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
  "Build dashboards with composable NQChart — install @nqchart/* via shadcn, compose NQ*Chart children, theme colors, BI recipes.";
const DEV_FALLBACK =
  "Contribute to NQChart — engine, registry, examples, chart-recipes.";
const DOCS_FALLBACK =
  "NQChart docs site — Fumadocs MDX, ComponentPreview, landing, agent HTTP routes.";

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
        name: "nqchart",
        type: "skill-md",
        description: readSkillDescription(
          join(root, "skills/consumer/nqchart"),
          CONSUMER_FALLBACK,
        ),
        url: "/.well-known/agent-skills/nqchart/SKILL.md",
      },
      {
        name: "nqchart-dev",
        type: "skill-md",
        description: readSkillDescription(
          join(root, ".agents/skills/nqchart-dev"),
          DEV_FALLBACK,
        ),
        url: "/.well-known/agent-skills/nqchart-dev/SKILL.md",
      },
      {
        name: "nqchart-docs",
        type: "skill-md",
        description: readSkillDescription(
          join(root, ".agents/skills/nqchart-docs"),
          DOCS_FALLBACK,
        ),
        url: "/.well-known/agent-skills/nqchart-docs/SKILL.md",
      },
    ],
  };
}
