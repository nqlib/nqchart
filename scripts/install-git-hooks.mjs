#!/usr/bin/env node
/**
 * Install the repo git hooks (scripts/git-hooks/*) into this clone: `pnpm hooks:install`.
 *
 *   commit-msg  removes AI attribution lines before git stores the commit
 *   pre-push    runs `pnpm preflight` and blocks the push when a CI check fails
 *
 * Hooks are per clone. A hook file that does not carry the `nqchart-hook` marker belongs to
 * the developer; the script leaves it and exits 1.
 */
import { execFileSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = join(import.meta.dirname, "..");
const src = join(root, "scripts/git-hooks");
// "strip-ai-attribution" is the marker of the first commit-msg hook; keep it upgradable.
const MARKERS = ["nqchart-hook", "strip-ai-attribution"];

const hooksDir = resolve(
  root,
  execFileSync("git", ["rev-parse", "--git-path", "hooks"], { cwd: root, encoding: "utf8" }).trim(),
);

let failed = false;
for (const name of readdirSync(src)) {
  const dest = join(hooksDir, name);
  if (existsSync(dest)) {
    const current = readFileSync(dest, "utf8");
    if (!MARKERS.some((m) => current.includes(m))) {
      console.error(`hooks:install — ${dest} exists and is not ours. Merge it by hand.`);
      failed = true;
      continue;
    }
  }
  copyFileSync(join(src, name), dest);
  chmodSync(dest, 0o755);
  console.log(`hooks:install — installed ${dest}`);
}
process.exit(failed ? 1 : 0);
