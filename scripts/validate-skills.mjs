#!/usr/bin/env node
/**
 * Validate SKILL.md frontmatter (name + description) for all agent skills.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");

const skillRoots = [
  join(root, "skills/consumer/beecharts"),
  join(root, ".agents/skills/beecharts-dev"),
  join(root, ".agents/skills/beecharts-docs"),
];

function findSkillFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      findSkillFiles(path, files);
    } else if (entry === "SKILL.md") {
      files.push(path);
    }
  }
  return files;
}

let failed = false;

for (const skillRoot of skillRoots) {
  if (!existsSync(skillRoot)) {
    console.error(`FAIL missing skill root: ${skillRoot}`);
    failed = true;
    continue;
  }

  for (const file of findSkillFiles(skillRoot)) {
    const content = readFileSync(file, "utf8");
    let fileOk = true;

    if (!content.startsWith("---")) {
      console.error(`FAIL ${file}: missing YAML frontmatter`);
      fileOk = false;
    } else {
      const end = content.indexOf("---", 3);
      const frontmatter = content.slice(3, end);
      if (!/^name:\s*.+/m.test(frontmatter)) {
        console.error(`FAIL ${file}: missing name`);
        fileOk = false;
      }
      if (!/^description:/m.test(frontmatter)) {
        console.error(`FAIL ${file}: missing description`);
        fileOk = false;
      }
    }

    if (fileOk) {
      console.log(`OK ${file}`);
    } else {
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log("skill:validate passed");
