#!/usr/bin/env node
/**
 * Emit library .d.ts files, then rewrite "@/" path aliases to relative paths.
 *
 * tsc reports pre-existing type-check diagnostics in the echarts-core sources
 * (loose echarts submodule types, a couple of nullability gaps) and exits
 * non-zero — but it STILL emits declarations. A plain `tsc && rewrite` chain
 * would short-circuit on that non-zero exit and skip the rewrite, leaving
 * unresolvable "@/..." imports in the shipped types. So we run tsc, ignore its
 * exit code, and instead assert the declarations we actually ship were emitted.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd, args) {
  return spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
}

// 1. Emit declarations. tsc may exit non-zero on pre-existing diagnostics; that
//    does not block emit, so we don't fail here — we validate emission below.
run("npx", ["tsc", "-p", "tsconfig.lib.json"]);

// 2. Assert the entry declarations consumers rely on were actually written.
const required = [
  "dist/types/lib/public.d.ts",
  "dist/types/registry/charts/bar-chart.d.ts",
];
const missing = required.filter((f) => !existsSync(join(root, f)));
if (missing.length) {
  console.error(
    `build:types — declaration emit failed; missing: ${missing.join(", ")}`,
  );
  process.exit(1);
}

// 3. Rewrite "@/..." alias imports in the emitted .d.ts to relative paths.
const rewrite = run("node", [join(root, "scripts", "rewrite-dts-aliases.mjs")]);
if (rewrite.status !== 0) process.exit(rewrite.status ?? 1);

console.log("build:types — declarations emitted and alias-rewritten");
