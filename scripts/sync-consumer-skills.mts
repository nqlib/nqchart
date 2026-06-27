#!/usr/bin/env node
/**
 * Sync consumer Agent Skill from skills/consumer/beecharts to:
 *   - .agents/skills/beecharts          (skills CLI / repo-local agents)
 *   - public/.well-known/agent-skills/beecharts  (HTTP static bundle)
 */
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildAgentSkillsIndex } from "../src/lib/agent-skills-index";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "skills/consumer/beecharts");
const agentsDest = join(root, ".agents/skills/beecharts");
const publicDest = join(root, "public/.well-known/agent-skills/beecharts");
const indexPath = join(root, "public/.well-known/agent-skills/index.json");

function copySkill(dest: string) {
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(source, dest, { recursive: true });
}

copySkill(agentsDest);
copySkill(publicDest);

const index = buildAgentSkillsIndex(root);

mkdirSync(dirname(indexPath), { recursive: true });
writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`);

for (const name of ["beecharts-dev", "beecharts-docs"]) {
  const maintainerSource = join(root, ".agents/skills", name);
  const maintainerDest = join(root, "public/.well-known/agent-skills", name);
  rmSync(maintainerDest, { recursive: true, force: true });
  cpSync(maintainerSource, maintainerDest, { recursive: true });
}

console.log("sync-consumer-skills:");
console.log("  →", agentsDest);
console.log("  →", publicDest);
console.log("  →", indexPath);
console.log("  → maintainer skills in public/.well-known/agent-skills/");
