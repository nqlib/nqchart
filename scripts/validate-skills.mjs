#!/usr/bin/env node
/**
 * Validate SKILL.md frontmatter (name + description) for all agent skills.
 * The nqchart-fixed skill validates every .md file under its root.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");

const skillRoots = [
  join(root, "skills/consumer/nqchart"),
  join(root, ".agents/skills/nqchart-dev"),
  join(root, ".agents/skills/nqchart-docs"),
  join(root, ".agents/skills/fixed"),
];

const fixedSkillRoot = join(root, ".agents/skills/fixed");

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

function findAllMarkdownFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      findAllMarkdownFiles(path, files);
    } else if (entry.endsWith(".md")) {
      files.push(path);
    }
  }
  return files;
}

function validateFrontmatter(file, content, { requireSkillKind = false } = {}) {
  let fileOk = true;

  if (!content.startsWith("---")) {
    console.error(`FAIL ${file}: missing YAML frontmatter`);
    return false;
  }

  const end = content.indexOf("---", 3);
  if (end === -1) {
    console.error(`FAIL ${file}: unclosed YAML frontmatter`);
    return false;
  }

  const frontmatter = content.slice(3, end);

  if (!/^name:\s*.+/m.test(frontmatter)) {
    console.error(`FAIL ${file}: missing name`);
    fileOk = false;
  }
  if (!/^description:/m.test(frontmatter)) {
    console.error(`FAIL ${file}: missing description`);
    fileOk = false;
  }

  if (requireSkillKind) {
    if (!/^skill:\s*nqchart-fixed/m.test(frontmatter)) {
      console.error(`FAIL ${file}: missing skill: nqchart-fixed`);
      fileOk = false;
    }
    if (!/^kind:\s*.+/m.test(frontmatter)) {
      console.error(`FAIL ${file}: missing kind`);
      fileOk = false;
    }
    if (!/^metadata:\s*\n\s+author:/m.test(frontmatter)) {
      console.error(`FAIL ${file}: missing metadata.author`);
      fileOk = false;
    }
    if (!/^metadata:\s*[\s\S]*?\n\s+version:/m.test(frontmatter)) {
      console.error(`FAIL ${file}: missing metadata.version`);
      fileOk = false;
    }
  }

  return fileOk;
}

let failed = false;

for (const skillRoot of skillRoots) {
  if (!existsSync(skillRoot)) {
    console.error(`FAIL missing skill root: ${skillRoot}`);
    failed = true;
    continue;
  }

  const isFixedSkill = skillRoot === fixedSkillRoot;
  const files = isFixedSkill
    ? findAllMarkdownFiles(skillRoot)
    : findSkillFiles(skillRoot);

  for (const file of files) {
    const content = readFileSync(file, "utf8");
    const fileOk = validateFrontmatter(file, content, {
      requireSkillKind: isFixedSkill,
    });

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
