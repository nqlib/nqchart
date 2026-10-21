#!/usr/bin/env node
/**
 * Remove AI attribution from commit messages, and fail a PR that still has one.
 *
 * The agent rule (CLAUDE.md § Shared rules) forbids these lines. The agent harness adds them
 * after the agent writes the message, so a rule alone does not hold. This script is the check.
 *
 * Banned: a Claude or Cursor `Co-authored-by:` trailer, `Made-with: Cursor`, and a
 * "Generated with Claude Code / Cursor" footer. A human `Co-authored-by:` line stays.
 *
 * Usage:
 *   node scripts/lint-commit-attribution.mjs --commit-msg <file>   strip lines (commit-msg hook)
 *   node scripts/lint-commit-attribution.mjs --base origin/dev     fail on commits in base..HEAD
 *   PR_BODY="…" node scripts/lint-commit-attribution.mjs --pr-body fail on the PR body (CI)
 *   node scripts/lint-commit-attribution.mjs --install-hook        install the commit-msg hook
 */
import { execFileSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = join(import.meta.dirname, "..");
const HOOK_SRC = join(root, "scripts/git-hooks/commit-msg");
const HOOK_MARKER = "strip-ai-attribution";

export function isBannedLine(line) {
  const text = line.trim().toLowerCase();
  if (!text) return false;
  if (text.startsWith("co-authored-by:")) {
    const name = text.slice("co-authored-by:".length).trim();
    return name.startsWith("claude") || name.startsWith("cursor");
  }
  if (text.startsWith("made-with:") && text.includes("cursor")) return true;
  if (text.includes("generated with [claude code]")) return true;
  if (text.includes("generated with claude code")) return true;
  if (text.includes("generated with cursor")) return true;
  return false;
}

export function stripMessage(text) {
  const kept = text.split(/\r?\n/).filter((line) => !isBannedLine(line));
  while (kept.length && !kept[kept.length - 1].trim()) kept.pop();
  return kept.length ? `${kept.join("\n")}\n` : "";
}

const hasBanned = (text) => text.split(/\r?\n/).some(isBannedLine);

function git(...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" });
}

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
}

function commitMsg(path) {
  const original = readFileSync(path, "utf8");
  const cleaned = stripMessage(original);
  if (cleaned !== original) writeFileSync(path, cleaned);
}

function checkRange(base) {
  const log = git("log", "--format=%H%x1f%s%x1f%B%x1e", `${base}..HEAD`);
  const found = [];
  for (const record of log.split("\x1e")) {
    if (!record.trim()) continue;
    const [sha, subject, body] = record.replace(/^\n/, "").split("\x1f");
    if (body !== undefined && hasBanned(body)) found.push(`${sha.slice(0, 10)} ${subject.trim()}`);
  }
  if (found.length) {
    console.error(`lint:attribution — ${found.length} commit(s) in ${base}..HEAD carry AI attribution:`);
    for (const line of found) console.error(`  ${line}`);
    console.error("Reword them (git rebase) or write the squash-merge body by hand.");
    process.exit(1);
  }
  console.log(`lint:attribution — no AI attribution in ${base}..HEAD.`);
}

function checkPrBody() {
  const body = process.env.PR_BODY ?? "";
  if (hasBanned(body)) {
    console.error("lint:attribution — the PR body carries AI attribution. Remove the line.");
    process.exit(1);
  }
  console.log("lint:attribution — PR body is clean.");
}

function installHook() {
  const hooksDir = git("rev-parse", "--git-path", "hooks").trim();
  const dest = resolve(root, hooksDir, "commit-msg");
  if (existsSync(dest) && !readFileSync(dest, "utf8").includes(HOOK_MARKER)) {
    console.error(`hooks:install — ${dest} exists and is not ours. Merge it by hand.`);
    process.exit(1);
  }
  copyFileSync(HOOK_SRC, dest);
  chmodSync(dest, 0o755);
  console.log(`hooks:install — installed ${dest}`);
}

const msgFile = argValue("--commit-msg");
if (msgFile) commitMsg(msgFile);
else if (process.argv.includes("--pr-body")) checkPrBody();
else if (process.argv.includes("--install-hook")) installHook();
else checkRange(argValue("--base") ?? "origin/dev");
