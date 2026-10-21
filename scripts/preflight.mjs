#!/usr/bin/env node
/**
 * Run the CI checks for the areas that this branch changes, before you push.
 *
 * The script reads the committed diff `origin/dev...HEAD` (`origin/main...HEAD` on a
 * `hotfix/*` branch). Commit first: an uncommitted
 * change does not select a check. Each check is a step of .github/workflows/ci.yml.
 *
 *   pnpm preflight          checks for the changed areas
 *   pnpm preflight --full   every check, including build:npm and next build (release)
 *   --base <ref>            compare against another ref (default origin/dev; hotfix → origin/main)
 *
 * Exit code 0 means every selected check passed. Read the exit code, not the output.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const full = process.argv.includes("--full");
const baseIdx = process.argv.indexOf("--base");
const base = baseIdx === -1 ? defaultBase() : process.argv[baseIdx + 1];

/** origin/main for a hotfix/* branch, origin/dev otherwise (docs/conventions.md § Git). */
function defaultBase() {
  const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  const branch = git("rev-parse", "--abbrev-ref", "HEAD");
  if (branch.startsWith("hotfix/")) return "origin/main";
  try {
    git("rev-parse", "--verify", "--quiet", "origin/dev");
    return "origin/dev";
  } catch {
    console.warn("preflight — origin/dev not found; comparing against origin/main.");
    return "origin/main";
  }
}

function changedFiles() {
  try {
    return execFileSync("git", ["diff", "--name-only", `${base}...HEAD`], {
      cwd: root,
      encoding: "utf8",
    })
      .split("\n")
      .filter(Boolean);
  } catch {
    console.error(`preflight — cannot diff against ${base}. Run \`git fetch origin\` first.`);
    process.exit(2);
  }
}

const files = changedFiles();
const any = (...patterns) => full || files.some((f) => patterns.some((p) => p.test(f)));

const code = any(/^src\//, /^scripts\//, /\.(ts|tsx|mts|mjs)$/, /^package\.json$/, /^pnpm-lock\.yaml$/);
const registry = any(/^src\/registry\//, /^src\/content\/docs\//, /^registry\.json$/);
const skills = any(/^skills\//, /^\.agents\/skills\/(nqchart|fixed|memory|no-box-glow)/, /^\.claude\/skills\//);
const pkg = any(
  /^src\/registry\//,
  /^src\/lib\/public\.ts$/,
  /^package\.json$/,
  /^pnpm-lock\.yaml$/,
  /^vite\.lib\.config\.ts$/,
  /^tsconfig\.lib\.json$/,
  /^scripts\/(build-types|check-|rewrite-dts|smoke-dist|strip-deps)/,
);
const site = any(/^src\//, /^next\.config\.ts$/, /^source\.config\.ts$/, /^public\//);
const deps = any(/^package\.json$/, /^pnpm-lock\.yaml$/);

/** [label, command] — run in order; stop at the first failure. */
const steps = [
  ["Agent rules in sync", "node scripts/sync-agents-md.mjs --check"],
  ["Status agree", "node scripts/lint-status.mjs"],
  ["No AI attribution", `node scripts/lint-commit-attribution.mjs --base ${base}`],
];
if (deps) steps.push(["Audit dependencies", "pnpm audit --audit-level=high"]);
if (code) {
  steps.push(["Lint", "pnpm run lint"]);
  steps.push(["Typecheck", "pnpm exec tsc --noEmit"]);
  steps.push(["Test", "pnpm test"]);
}
if (registry) {
  steps.push(["Audit doc previews", "pnpm run audit:previews"]);
  steps.push(["Audit registry boundary", "pnpm run audit:registry-boundary"]);
}
if (skills) {
  steps.push(["Validate agent skills", "pnpm skill:validate"]);
  steps.push([
    "Sync skills (no drift)",
    "pnpm sync:skills && git diff --ignore-cr-at-eol --exit-code -- public/.well-known/agent-skills .agents/skills/nqchart .claude/skills",
  ]);
}
if (pkg) steps.push(["npm package (dist, api, internals, size)", "pnpm run build:npm"]);
if (site) {
  steps.push(["Build site", "pnpm run build"]);
  steps.push([
    "Generated registry files committed (no drift)",
    "git diff --ignore-cr-at-eol --exit-code -- registry.json src/registry/__index__.tsx",
  ]);
}

console.log(
  full
    ? "preflight — full run."
    : `preflight — ${files.length} file(s) changed against ${base}; ${steps.length} check(s).`,
);

for (const [label, cmd] of steps) {
  console.log(`\n▶ ${label}\n  $ ${cmd}`);
  const res = spawnSync(cmd, { cwd: root, stdio: "inherit", shell: true });
  if (res.status !== 0) {
    console.error(`\n✖ preflight failed at: ${label} (exit ${res.status ?? "signal"})`);
    process.exit(res.status || 1);
  }
}
console.log("\n✔ preflight passed. You can push.");
