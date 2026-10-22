#!/usr/bin/env node
/**
 * Regenerate AGENTS.md from CLAUDE.md.
 *
 * CLAUDE.md is the source of the agent rules. AGENTS.md is what Cursor, Codex, and other
 * agents load. Run after any CLAUDE.md edit: `pnpm sync:agents`.
 *
 *   --check   exit 1 when AGENTS.md is out of date (CI, preflight)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const BANNER =
  "<!-- Generated copy of CLAUDE.md for non-Claude coding agents. Do not edit directly: edit CLAUDE.md, then run `pnpm sync:agents` (see docs/conventions.md). -->";

const source = readFileSync(join(root, "CLAUDE.md"), "utf8").replace(/\r\n/g, "\n");
const expected = `${BANNER}\n${source}`;
const target = join(root, "AGENTS.md");

if (process.argv.includes("--check")) {
  let current = "";
  try {
    current = readFileSync(target, "utf8").replace(/\r\n/g, "\n");
  } catch {
    // missing file is drift
  }
  if (current !== expected) {
    console.error("sync:agents — AGENTS.md is out of date. Run `pnpm sync:agents` and commit.");
    process.exit(1);
  }
  console.log("sync:agents — AGENTS.md matches CLAUDE.md.");
} else {
  writeFileSync(target, expected);
  console.log("sync:agents — wrote AGENTS.md");
}
